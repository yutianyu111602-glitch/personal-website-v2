#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
专家团队编排器配置管理模块

功能：
1. 管理所有配置常量和环境变量
2. 提供安全的密钥读取和掩码功能
3. 统一管理API端点和模型配置
"""

import os
import pathlib
import datetime as dt
from typing import Dict, Any


# ============================= 路径与常量 =============================
REPO_ROOT = pathlib.Path('/Users/masher/code')
PROJECT_ROOT = REPO_ROOT / '程序集_Programs' / '个人网站项目V2'
# 统一时间戳，确保 logs 与 outputs 对齐
TIMESTAMP = dt.datetime.now().strftime('%Y%m%d_%H%M%S')
LOG_DIR = REPO_ROOT / 'logs' / 'personal_website' / 'experts_meetings' / TIMESTAMP
LOG_DIR.mkdir(parents=True, exist_ok=True)
REPORT_FILE = REPO_ROOT / 'GPT_EXPERTS_ANALYSIS_AND_BUGBOT_REPORT.md'
OUTPUT_DIR = REPO_ROOT / 'outputs' / 'personal_website' / 'experts_meetings' / TIMESTAMP
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ============================= 明文内置密钥（仅用户本机使用） =============================
# 说明：按用户要求将密钥写入代码作为兜底；若 .env.local 或进程环境存在值，则优先使用环境值。
# 注意：日志与纪要始终写"掩码"，不输出完整密钥。
DEFAULT_DEEPSEEK_API_KEY = 'sk-5e2b4288d63f4a4b972bdcde2b9c4d43'
DEFAULT_DASHSCOPE_API_KEY = 'sk-bf7fb00b049845d484cb4f6aa39b20db'
DEFAULT_DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1'
DEFAULT_DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

# ============================= 网络与超时配置 =============================
# 说明：默认禁用系统代理，防止被错误代理劫持导致请求长时间阻塞。
# 超时可通过环境变量 MEETING_HTTP_TIMEOUT_SEC 调整（默认 15 秒）。
REQUEST_TIMEOUT_SEC: int = int(os.environ.get('MEETING_HTTP_TIMEOUT_SEC', '120') or '120')
MAX_TOKENS: int = int(os.environ.get('MEETING_MAX_TOKENS', '256') or '256')
MAX_ATTEMPTS: int = int(os.environ.get('MEETING_HTTP_ATTEMPTS', '3') or '3')
DISABLE_PROXY: bool = (os.environ.get('MEETING_DISABLE_PROXY', 'true').lower() == 'true')
STREAM_ENABLED: bool = (os.environ.get('MEETING_STREAM', 'true').lower() == 'true')
ECHO_STREAM: bool = (os.environ.get('MEETING_ECHO_STREAM', 'true').lower() == 'true')
ECHO_STREAM_MODE: str = os.environ.get('MEETING_ECHO_STREAM_MODE', 'line')  # line|raw|off
ECHO_STREAM_PREFIX: bool = (os.environ.get('MEETING_ECHO_STREAM_PREFIX', 'true').lower() == 'true')

# ============================= 模型配置 =============================
MODEL_CONFIGS = {
    'deepseek': {
        'default_model': 'deepseek-chat',
        'supported_models': ['deepseek-chat', 'deepseek-coder', 'deepseek-llm-7b-chat'],
        'features': ['streaming', 'deep_thinking', 'function_calling'],
        'max_tokens': 4096,
        'temperature_range': (0.1, 0.9)
    },
    'dashscope': {
        'default_model': 'qwen-plus',
        'supported_models': ['qwen-plus', 'qwen-turbo', 'qwen-max', 'qwen-max-longcontext'],
        'features': ['streaming', 'vision', 'audio', 'deep_thinking'],
        'max_tokens': 8192,
        'temperature_range': (0.1, 1.0)
    },
    'openai': {
        'default_model': 'gpt-4o-mini',
        'supported_models': ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
        'features': ['streaming', 'function_calling', 'vision'],
        'max_tokens': 4096,
        'temperature_range': (0.1, 2.0)
    }
}

# ============================= 专家角色配置 =============================
EXPERT_ROLES = {
    'deepseek': {
        'name': 'DeepSeek专家',
        'specialty': '代码优化与算法分析',
        'focus_areas': ['性能优化', '代码重构', '算法改进', '架构设计']
    },
    'dashscope': {
        'name': '阿里千问专家', 
        'specialty': '业务逻辑与用户体验',
        'focus_areas': ['功能设计', '用户交互', '业务流程', '界面优化']
    },
    'openai': {
        'name': 'GPT专家',
        'specialty': '创意设计与系统集成',
        'focus_areas': ['创新功能', '系统集成', '创意设计', '技术选型']
    }
}


def mask_secret(value: str) -> str:
    """安全掩码：仅保留末尾 4 位，其余以 * 替换。"""
    if not value:
        return ''
    tail = value[-4:] if len(value) >= 4 else value
    return '*' * max(0, len(value) - len(tail)) + tail


def read_env_file(path: pathlib.Path) -> Dict[str, str]:
    """读取 .env.local（简易解析，忽略注释与空行）。
    - 自动去除值两端引号（兼容 "sk-xxx" 或 'sk-xxx' 的写法）
    - 自动去除无意义的空白
    """
    env: Dict[str, str] = {}
    if not path.exists():
        return env
    for line in path.read_text(encoding='utf-8').splitlines():
        s = line.strip()
        if not s or s.startswith('#'):
            continue
        if '=' in s:
            k, v = s.split('=', 1)
            key = k.strip()
            val = v.strip()
            # 去除包裹引号
            if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                val = val[1:-1]
            env[key] = val
    return env


def load_environment_config() -> Dict[str, str]:
    """加载环境配置，优先使用环境变量，其次使用配置文件，最后使用默认值。"""
    # 多路径查找配置文件
    candidates = [
        PROJECT_ROOT / '.env.local',
        REPO_ROOT / '.env.local',
        REPO_ROOT / '.secrets' / 'ai_providers.env'
    ]
    
    env: Dict[str, str] = dict(os.environ)
    
    # 读取配置文件
    for p in candidates:
        if p.exists():
            env.update(read_env_file(p))
    
    # 兼容别名：阿里百炼密钥（ALI_BAILIAN_API_KEY）等价于 DASHSCOPE_API_KEY
    if not env.get('DASHSCOPE_API_KEY') and env.get('ALI_BAILIAN_API_KEY'):
        env['DASHSCOPE_API_KEY'] = env.get('ALI_BAILIAN_API_KEY', '')
    
    # 设置默认值
    if not env.get('DEEPSEEK_API_KEY'):
        env['DEEPSEEK_API_KEY'] = DEFAULT_DEEPSEEK_API_KEY
    if not env.get('DEEPSEEK_BASE_URL'):
        env['DEEPSEEK_BASE_URL'] = DEFAULT_DEEPSEEK_BASE_URL
    if not env.get('DASHSCOPE_API_KEY'):
        env['DASHSCOPE_API_KEY'] = DEFAULT_DASHSCOPE_API_KEY
    if not env.get('DASHSCOPE_BASE_URL'):
        env['DASHSCOPE_BASE_URL'] = DEFAULT_DASHSCOPE_BASE_URL
    
    return env


def get_provider_configs(env: Dict[str, str]) -> list[Dict[str, str]]:
    """获取可用的AI提供商配置列表。"""
    providers: list[Dict[str, str]] = []
    
    # OpenAI配置
    if env.get('OPENAI_API_KEY'):
        providers.append({
            'name': 'GPT-5(OPENAI_COMPAT)',
            'base': normalize_base_url(env.get('OPENAI_BASE_URL', 'https://api.openai.com/v1')),
            'key': env['OPENAI_API_KEY'],
            'model': env.get('OPENAI_MODEL', 'gpt-4o-mini'),
            'provider_type': 'openai'
        })
    
    # DeepSeek配置
    if env.get('DEEPSEEK_API_KEY'):
        providers.append({
            'name': 'DeepSeek',
            'base': normalize_base_url(env.get('DEEPSEEK_BASE_URL', DEFAULT_DEEPSEEK_BASE_URL)),
            'key': env['DEEPSEEK_API_KEY'],
            'model': env.get('DEEPSEEK_MODEL', 'deepseek-chat'),
            'provider_type': 'deepseek'
        })
    
    # DashScope配置
    if env.get('DASHSCOPE_API_KEY'):
        providers.append({
            'name': 'DashScope(Qwen-兼容)',
            'base': env.get('DASHSCOPE_BASE_URL', DEFAULT_DASHSCOPE_BASE_URL).rstrip('/'),
            'key': env['DASHSCOPE_API_KEY'],
            'model': env.get('DASHSCOPE_MODEL', 'qwen-plus'),
            'provider_type': 'dashscope'
        })
    
    return providers


def normalize_base_url(base: str) -> str:
    """规范化 Provider 兼容端点：
    - deepseek: 保持原样（官方示例使用根域直接 /chat/completions）
    - openai: 若不含 `/v1`，自动补齐
    - dashscope: 保持传入值（应为 /compatible-mode/v1）
    """
    b = base.rstrip('/')
    low = b.lower()
    if 'deepseek.com' in low:
        # DeepSeek 的 OpenAI 兼容端点要求带 /v1
        return b if low.endswith('/v1') else (b + '/v1')
    if 'openai.com' in low and not low.endswith('/v1'):
        return b + '/v1'
    return b


def get_model_specific_params(provider_type: str, model: str) -> Dict[str, Any]:
    """获取模型特定的参数配置。"""
    base_params = {
        'temperature': 0.3,
        'stream': STREAM_ENABLED,
        'max_tokens': MAX_TOKENS,
    }
    
    # 根据提供商和模型添加特定参数
    if provider_type == 'deepseek':
        base_params.update({
            'enable_search': True,  # 启用联网搜索
            'enable_vision': False,
        })
    elif provider_type == 'dashscope':
        base_params.update({
            'enable_search': True,  # 启用联网搜索
            'enable_vision': True,  # 启用视觉功能
            'enable_audio': True,   # 启用音频功能
        })
    elif provider_type == 'openai':
        base_params.update({
            'enable_search': False,  # OpenAI默认不启用搜索
            'enable_vision': True,   # 启用视觉功能
        })
    
    return base_params
