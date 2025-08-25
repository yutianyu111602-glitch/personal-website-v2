#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
专家团队编排器文档处理模块

功能：
1. 读取和解析项目报告文档
2. 智能文档切片，保持语义完整性
3. 生成专家角色特定的提示词
4. 管理文档缓存和版本控制
"""

import pathlib
from typing import List, Dict, Any
from config import REPORT_FILE, EXPERT_ROLES


def collect_doc_text() -> str:
    """读取主报告文档内容。若不存在则返回空串。"""
    try:
        return REPORT_FILE.read_text(encoding='utf-8')
    except Exception:
        return ''


def split_text_for_chunks(text: str, max_chars: int = 12000) -> List[str]:
    """将长文本按字符数切片，尽量在段落边界分割。
    
    优化策略：
    1. 优先在段落边界分割
    2. 避免在句子中间分割
    3. 保持语义完整性
    """
    if len(text) <= max_chars:
        return [text]
    
    chunks: List[str] = []
    start = 0
    
    while start < len(text):
        end = min(len(text), start + max_chars)
        
        # 尝试在最近的段落边界分割
        nl = text.rfind('\n\n', start, end)
        if nl == -1 or nl <= start + 4000:
            # 如果没有段落边界，尝试在句子边界分割
            nl = text.rfind('. ', start, end)
            if nl == -1 or nl <= start + 4000:
                # 如果都没有，尝试在换行处分割
                nl = text.rfind('\n', start, end)
                if nl == -1 or nl <= start + 4000:
                    nl = end
        
        chunks.append(text[start:nl])
        start = nl
    
    return chunks


def generate_expert_prompt(provider_type: str, chunk_index: int, total_chunks: int, chunk_content: str) -> Dict[str, Any]:
    """生成专家角色特定的提示词。
    
    根据不同的AI提供商特点，生成针对性的提示词：
    - DeepSeek: 专注于代码和算法优化
    - 阿里千问: 专注于业务逻辑和用户体验
    - OpenAI: 专注于创意设计和系统集成
    """
    expert_role = EXPERT_ROLES.get(provider_type, EXPERT_ROLES['deepseek'])
    
    # 基础系统提示词
    base_system_prompt = (
        f'你是{expert_role["name"]}，专长领域：{expert_role["specialty"]}。'
        '请基于我提供的项目报告切片，输出高信噪比的"本周可落地 TODO + 风险"。\n\n'
        '约束要求：\n'
        '1) 仅输出可以在 3 天内完成且对构建/可视化/电台稳定性有直接帮助的事项；\n'
        '2) 给出每条 TODO 的验收标准；\n'
        '3) 如需调用/修改的文件与端口，请明确文件路径与环境变量名；\n'
        '4) 如报告中已有对应完成项，请标注"已完成(引用)"；\n'
        '5) 重点关注你的专长领域：{", ".join(expert_role["focus_areas"])}；\n'
        '6) 输出格式请按模块/文件路径分组（如 webui/, server/, scripts/、vis/），每组列出 TODO 与风险。'
    )
    
    # 用户消息，包含文档切片
    user_message = (
        f'以下是项目报告的第 {chunk_index}/{total_chunks} 段内容。目标：不要想得太远，优先“跑通现有功能、减少BUG、做性能优化”。'
        f'请基于你的专长领域{expert_role["specialty"]}，分析本段内容并给出：\n\n'
        f'- 本周可落地 TODO（最多5条，3天内完成）\n'
        f'- 潜在的技术风险点（最多3条）\n'
        f'- 具体的实施建议和验收标准\n\n'
        f'文档内容：\n{chunk_content}'
    )
    
    return {
        'system_prompt': base_system_prompt,
        'user_message': user_message,
        'expert_role': expert_role,
        'chunk_info': {
            'index': chunk_index,
            'total': total_chunks,
            'content_length': len(chunk_content)
        }
    }


def generate_summary_prompt(provider_type: str, combined_outputs: List[str]) -> Dict[str, Any]:
    """生成聚合收敛的提示词，用于整合多段专家输出。"""
    expert_role = EXPERT_ROLES.get(provider_type, EXPERT_ROLES['deepseek'])
    
    system_prompt = (
        f'你是{expert_role["name"]}，现在需要对多段分析结果进行聚合收敛。'
        '请基于你的专长领域，对以下多段专家输出做一次去重收敛，并按模块/目录分组，给出：\n\n'
        '1) 可直接执行的 TODO(<=12条，逐条含验收标准、涉及文件路径/端口/env)\n'
        '2) 最高风险的 3 项与规避方案\n'
        '3) 若与现有报告有冲突，请明确指出并给出取舍建议\n'
        '4) 基于你的专长领域，给出优先级排序和实施路线图\n'
        '5) 输出格式：每个模块小节下列出 [TODO] 与 [Risk] 列表，可直接复制执行。'
    )
    
    user_message = (
        f'请基于你的专长领域{expert_role["specialty"]}，对以下多段分析结果进行聚合：\n\n'
        + '\n\n----- 以下为多段聚合 -----\n\n' + '\n\n'.join(combined_outputs)
    )
    
    return {
        'system_prompt': system_prompt,
        'user_message': user_message,
        'expert_role': expert_role
    }


def create_meeting_template() -> List[str]:
    """创建会议纪要模板。"""
    import datetime as dt
    
    return [
        f"# 专家团队会议纪要（联网版）\n\n时间：{dt.datetime.now().isoformat(timespec='seconds')}\n",
        '> 本纪要由脚本 scripts/experts/orchestrator.py 自动生成，所有 Key 已做掩码记录。\n',
        '\n## 会议概述\n',
        '- 参与专家：DeepSeek、阿里千问、GPT（如有配置）\n',
        '- 分析文档：GPT_EXPERTS_ANALYSIS_AND_BUGBOT_REPORT.md\n',
        '- 会议目标：识别本周可落地的TODO与风险\n\n'
    ]


def format_expert_section(expert_name: str, content: str, status: str = 'success') -> str:
    """格式化专家建议部分。"""
    if status == 'success':
        return f"\n## {expert_name} 的建议\n\n{content}\n"
    else:
        return f"\n## {expert_name} 的建议\n\n**状态：{status}**\n\n{content}\n"


def add_meeting_footer(meeting_lines: List[str], anthropic_key: str = '') -> None:
    """添加会议纪要的页脚信息。"""
    meeting_lines.append('\n---\n')
    meeting_lines.append('## 会议总结\n')
    meeting_lines.append('- 所有专家已完成分析\n')
    meeting_lines.append('- 建议按优先级执行TODO项目\n')
    meeting_lines.append('- 重点关注高风险项目的规避方案\n\n')
    
    if anthropic_key:
        meeting_lines.append('注：检测到 ANTHROPIC_API_KEY，当前版本使用 OpenAI 兼容接口，Anthropic 将在下一轮接入 messages API。\n')
    
    meeting_lines.append(f'\n---\n\n*会议纪要生成时间：{datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}*')


def validate_document_content(content: str) -> Dict[str, Any]:
    """验证文档内容的有效性。"""
    validation_result = {
        'is_valid': True,
        'warnings': [],
        'errors': [],
        'stats': {}
    }
    
    if not content:
        validation_result['is_valid'] = False
        validation_result['errors'].append('文档内容为空')
        return validation_result
    
    # 统计信息
    validation_result['stats'] = {
        'total_chars': len(content),
        'total_lines': len(content.splitlines()),
        'total_words': len(content.split()),
        'has_todo': 'TODO' in content.upper() or '待办' in content,
        'has_bug': 'BUG' in content.upper() or '错误' in content or '问题' in content,
        'has_feature': '功能' in content or '特性' in content or 'FEATURE' in content.upper()
    }
    
    # 检查内容质量
    if len(content) < 1000:
        validation_result['warnings'].append('文档内容较短，可能信息不足')
    
    if not validation_result['stats']['has_todo'] and not validation_result['stats']['has_bug']:
        validation_result['warnings'].append('文档中未发现明显的TODO或BUG标记')
    
    return validation_result
