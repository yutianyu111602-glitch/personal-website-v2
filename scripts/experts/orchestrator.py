#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
联网专家团队编排脚本（V2）- 模块化版本

功能概述（符合项目规则）：
1) 读取项目根 `.env.local`，采集可用的多家 API Key（OpenAI / DeepSeek / DashScope / Anthropic）。
2) 将项目根 `GPT_EXPERTS_ANALYSIS_AND_BUGBOT_REPORT.md` 文档切片后上传给各"专家"（按提供商划分），
   请求其给出聚焦"本周可落地的TODO与风险"的建议与补充。
3) 汇总各家模型的结果，生成会议纪要并落盘到
   `logs/personal_website/experts_meetings/<timestamp>/meeting.md`，并保存原始响应 JSON 以便追溯。
4) 自动在纪要开头写入"密钥使用快照（掩码）"。

模块化架构：
- config.py: 配置管理
- http_client.py: HTTP通信
- document_processor.py: 文档处理
- expert_collaboration.py: 专家协作
- main_orchestrator.py: 主编排器

实现要点：
- 不引入外部依赖，使用标准库 `urllib.request` 发起 HTTP 请求（OpenAI 兼容 Chat Completions）。
- 兼容三种 OpenAI 兼容端点：OpenAI、DeepSeek、DashScope（阿里百炼兼容模式）。
- Anthropic 暂做占位提示（如提供了 Key 则提示"已记录，将在下轮接入 messages 接口"）。
- 中文注释与文档字符串；异常不抛出到顶层，全部落日志并继续。
- 支持并行专家处理，提高效率。

注意：本脚本不会在终端打印任何机密；所有密钥在日志中以掩码形式显示（仅保留末尾 4 位）。
"""

# 导入模块化功能
try:
    from .main_orchestrator import run_meeting
except ImportError:
    # 如果相对导入失败，尝试绝对导入
    try:
        import sys
        import pathlib
        sys.path.insert(0, str(pathlib.Path(__file__).parent))
        from main_orchestrator import run_meeting
    except ImportError:
        print("[experts] 错误：无法导入模块化功能，请检查模块结构")
        sys.exit(1)


def main():
    """主函数入口点。"""
    print("[experts] 启动专家团队编排器（模块化版本 V2.0.0）")
    print("[experts] 支持并行专家处理，提高分析效率")
    
    try:
        # 运行专家会议
        run_meeting()
    except KeyboardInterrupt:
        print("\n[experts] 用户中断，会议终止")
    except Exception as e:
        print(f"[experts] 未预期的错误: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()


