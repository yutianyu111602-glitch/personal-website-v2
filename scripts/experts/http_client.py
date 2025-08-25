#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
专家团队编排器HTTP通信模块

功能：
1. 提供统一的HTTP POST请求接口
2. 实现OpenAI兼容的Chat Completions API调用
3. 支持流式和非流式响应
4. 包含重试机制和错误处理
"""

import json
import time
import typing as t
from urllib import request, error
from config import REQUEST_TIMEOUT_SEC, MAX_TOKENS, MAX_ATTEMPTS, DISABLE_PROXY, ECHO_STREAM, ECHO_STREAM_MODE, ECHO_STREAM_PREFIX


def http_post_json(url: str, headers: dict, payload: dict, timeout: int = REQUEST_TIMEOUT_SEC) -> tuple[int, dict]:
    """发送 JSON POST 请求，返回 (状态码, JSON或文本)。出现异常返回 (0, 错误字符串)。"""
    try:
        data = json.dumps(payload).encode('utf-8')
        req = request.Request(url, data=data, headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'ExpertsOrchestrator/1.0 (+https://local)',
            'Connection': 'close',
            **headers,
        })
        # 可选禁用代理，避免环境代理导致长时间阻塞
        opener = request.build_opener(request.ProxyHandler({})) if DISABLE_PROXY else request.build_opener()
        with opener.open(req, timeout=timeout) as resp:
            raw = resp.read()
            ctype = resp.headers.get('Content-Type', '')
            if 'application/json' in ctype:
                return resp.status, json.loads(raw.decode('utf-8', errors='ignore'))
            return resp.status, raw.decode('utf-8', errors='ignore')
    except error.HTTPError as e:
        try:
            body = e.read().decode('utf-8', errors='ignore')
        except Exception:
            body = str(e)
        return e.code or 0, body
    except Exception as e:  # noqa: B902 - 兼容较老解释器
        return 0, f'EXCEPTION: {e}'


def openai_compatible_chat(base_url: str, api_key: str, model: str, messages: list[dict], extra: dict = None) -> dict:
    """调用 OpenAI 兼容的 Chat Completions 接口，带退避重试，返回统一结构。"""
    url = base_url.rstrip('/') + '/chat/completions'
    payload = {
        'model': model,
        'messages': messages,
        'temperature': 0.3,
        'stream': False,
        'max_tokens': MAX_TOKENS,
    }
    if extra:
        # 过滤掉以 '_' 开头的本地扩展参数（不发送给服务端）
        payload.update({k: v for k, v in extra.items() if not str(k).startswith('_')})

    transient_statuses = {0, 408, 429, 500, 502, 503, 504}
    attempt = 0
    backoff_sec = 1.2
    last_status: int = 0
    last_data: t.Any = ''
    
    while attempt < MAX_ATTEMPTS:
        status, data = http_post_json(url, headers={'Authorization': f'Bearer {api_key}'}, payload=payload)
        last_status, last_data = status, data
        
        if status and isinstance(data, dict):
            try:
                content = data['choices'][0]['message']['content']
                return {
                    'ok': True,
                    'status': status,
                    'raw': data,
                    'content': content,
                }
            except Exception:
                # 非标准返回结构，若非临时性错误则直接返回
                if status not in transient_statuses:
                    return {'ok': False, 'status': status, 'raw': data, 'content': ''}
        else:
            # 非 JSON 或异常，若非临时性则直接返回
            if status not in transient_statuses:
                return {'ok': False, 'status': status, 'raw': data, 'content': ''}

        attempt += 1
        print(f"[experts] 重试第 {attempt}/{MAX_ATTEMPTS} 次（状态 {status}），退避 {backoff_sec:.1f}s")
        time.sleep(backoff_sec)
        backoff_sec *= 1.6

    return {'ok': False, 'status': last_status, 'raw': last_data, 'content': ''}


def openai_compatible_chat_streaming(base_url: str, api_key: str, model: str, messages: list[dict], extra: dict = None) -> dict:
    """以流式（SSE）方式调用 Chat Completions，逐行解析 data 帧，聚合 content 返回。
    - 兼容 OpenAI/DeepSeek/DashScope 的 SSE 增量格式（choices[0].delta.content 或 message）
    - 若中途超时但已有增量内容，则视为 ok=True 并返回已聚合文本
    """
    url = base_url.rstrip('/') + '/chat/completions'
    payload = {
        'model': model,
        'messages': messages,
        'temperature': 0.3,
        'stream': True,
        'max_tokens': MAX_TOKENS,
    }
    echo_tag = ''
    if extra:
        echo_tag = str(extra.get('_echo_tag', '') or '')
        payload.update({k: v for k, v in extra.items() if not str(k).startswith('_')})
    
    data = json.dumps(payload).encode('utf-8')
    req = request.Request(url, data=data, headers={
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'User-Agent': 'ExpertsOrchestrator/1.0 (+https://local)',
        'Connection': 'close',
        'Authorization': f'Bearer {api_key}',
    })
    
    opener = request.build_opener(request.ProxyHandler({})) if DISABLE_PROXY else request.build_opener()
    accum: list[str] = []
    line_buffer: str = ''  # 持续累计的行缓冲，避免逐字符/逐词刷屏
    status_code: int = 0
    
    try:
        with opener.open(req, timeout=REQUEST_TIMEOUT_SEC) as resp:
            status_code = getattr(resp, 'status', 200)
            # 按行读取 SSE
            while True:
                line_bytes = resp.readline()
                if not line_bytes:
                    break
                line = line_bytes.decode('utf-8', errors='ignore').strip('\r\n')
                if not line:
                    continue  # keep-alive 空行
                if line.startswith('data:'):
                    payload_str = line[len('data:'):].strip()
                    if payload_str == '[DONE]':
                        break
                    try:
                        frame = json.loads(payload_str)
                        choice0 = (frame.get('choices') or [{}])[0]
                        delta = choice0.get('delta') or {}
                        # OpenAI 风格增量
                        piece = delta.get('content')
                        if piece is None:
                            # 部分兼容返回完整 message
                            msg = choice0.get('message') or {}
                            piece = msg.get('content')
                        if piece:
                            text = str(piece)
                            accum.append(text)
                            # 可选在终端直接回显专家讨论（跨帧聚合到句子级别）
                            if ECHO_STREAM and ECHO_STREAM_MODE != 'off':
                                import re
                                # 归一空白并拼接到全局缓冲
                                normalized = re.sub(r"\s+", " ", text)
                                line_buffer += normalized
                                # 检测句子终止符或换行
                                sentences: list[str] = []
                                buf = ''
                                for ch in line_buffer:
                                    buf += ch
                                    if ch in '。！？!?；;\n':
                                        sentences.append(buf.strip())
                                        buf = ''
                                # 剩余部分回填到缓冲（不立即打印）
                                line_buffer = buf
                                # 打印已完成句子
                                if sentences:
                                    prefix = (echo_tag or '[GPT-TEAM] ') if ECHO_STREAM_PREFIX else ''
                                    for s in sentences:
                                        if s:
                                            print(prefix + s, flush=True)
                                # 安全阈值：若缓冲过长也强制换行
                                if len(line_buffer) >= 160:
                                    prefix = (echo_tag or '[GPT-TEAM] ') if ECHO_STREAM_PREFIX else ''
                                    print(prefix + line_buffer.strip(), flush=True)
                                    line_buffer = ''
                    except Exception:
                        # 忽略无法解析的增量帧
                        continue
    except error.HTTPError as he:
        try:
            raw = he.read().decode('utf-8', errors='ignore')
        except Exception:
            raw = str(he)
        return {'ok': False, 'status': he.code or 0, 'raw': raw, 'content': ''.join(accum)}
    except Exception as e:
        # 若已有增量内容则视为成功，缓解长响应导致的超时
        if accum:
            return {'ok': True, 'status': status_code or 200, 'raw': 'STREAM_PARTIAL', 'content': ''.join(accum)}
        # 输出缓冲尾巴
        if ECHO_STREAM and line_buffer.strip():
            prefix = (echo_tag or '[GPT-TEAM] ') if ECHO_STREAM_PREFIX else ''
            print(prefix + line_buffer.strip(), flush=True)
        return {'ok': False, 'status': 0, 'raw': f'EXCEPTION: {e}', 'content': ''}

    # 输出缓冲尾巴
    if ECHO_STREAM and line_buffer.strip():
        prefix = (echo_tag or '[GPT-TEAM] ') if ECHO_STREAM_PREFIX else ''
        print(prefix + line_buffer.strip(), flush=True)
    return {'ok': True, 'status': status_code or 200, 'raw': 'STREAM_OK', 'content': ''.join(accum)}


def probe_endpoint_reachable(base_url: str, timeout: int = REQUEST_TIMEOUT_SEC) -> bool:
    """快速探测端点可达性：对 chat/completions 发送 HEAD 请求。
    - 任意 HTTP 状态码(>=100)均视为可达（含 405/404）。
    - 仅在网络异常/超时返回 False。
    """
    try:
        url = base_url.rstrip('/') + '/chat/completions'
        req = request.Request(url, method='HEAD')
        opener = request.build_opener(request.ProxyHandler({})) if DISABLE_PROXY else request.build_opener()
        with opener.open(req, timeout=timeout) as resp:
            return bool(getattr(resp, 'status', 200))
    except error.HTTPError as e:
        return True  # HTTP 层返回，视为网络连通
    except Exception:
        return False


def call_ai_provider(provider: dict, messages: list[dict], use_streaming: bool = True, extra_params: dict = None) -> dict:
    """统一的AI提供商调用接口，根据配置自动选择调用方式。"""
    base_url = provider['base']
    api_key = provider['key']
    model = provider['model']
    provider_type = provider.get('provider_type', 'unknown')
    
    # 获取模型特定参数
    from config import get_model_specific_params
    model_params = get_model_specific_params(provider_type, model)
    
    # 合并额外参数
    if extra_params:
        model_params.update(extra_params)

    # 为终端流式输出构造彩色前缀（不传给服务端）
    provider_label = provider.get('name', provider_type).split('(')[0].strip()
    COLOR_RESET = '\u001b[0m'
    COLOR_MAP = {
        'DeepSeek': '\u001b[38;5;46m',       # 绿色
        'DashScope': '\u001b[38;5;45m',      # 青色
        'GPT-5': '\u001b[38;5;177m',         # 品红
    }
    color = None
    for key, val in COLOR_MAP.items():
        if provider_label.startswith(key):
            color = val
            break
    if not color:
        color = '\u001b[38;5;81m'  # 默认蓝青
    echo_tag = f"{color}[GPT-TEAM|{provider_label}]{COLOR_RESET} "
    model_params.setdefault('_echo_tag', echo_tag)
    
    # 根据配置选择调用方式
    if use_streaming and model_params.get('stream', True):
        return openai_compatible_chat_streaming(base_url, api_key, model, messages, model_params)
    else:
        return openai_compatible_chat(base_url, api_key, model, messages, model_params)
