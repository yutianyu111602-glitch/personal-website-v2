#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
专家团队编排器模块包

模块结构：
- config.py: 配置管理
- http_client.py: HTTP通信
- document_processor.py: 文档处理
- expert_collaboration.py: 专家协作
- main_orchestrator.py: 主编排器
"""

from .config import (
    load_environment_config,
    get_provider_configs,
    mask_secret,
    LOG_DIR,
    REPORT_FILE
)

from .http_client import (
    call_ai_provider,
    probe_endpoint_reachable
)

from .document_processor import (
    collect_doc_text,
    split_text_for_chunks,
    generate_expert_prompt,
    validate_document_content
)

from .expert_collaboration import (
    ExpertCollaboration,
    validate_meeting_results
)

from .main_orchestrator import (
    MainOrchestrator,
    run_meeting
)

__version__ = "2.0.0"
__author__ = "AI专家团队编排器"
__description__ = "多AI专家协作分析项目报告，生成可落地的TODO和风险分析"

# 主要功能接口
__all__ = [
    'run_meeting',
    'MainOrchestrator',
    'ExpertCollaboration',
    'load_environment_config',
    'get_provider_configs',
    'call_ai_provider',
    'collect_doc_text',
    'validate_document_content'
]
