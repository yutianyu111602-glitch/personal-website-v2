#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
专家团队编排器主模块

功能：
1. 整合所有功能模块，提供统一的会议管理接口
2. 管理整个专家会议的生命周期
3. 处理配置加载、文档处理、专家协作等流程
4. 生成最终的会议纪要和报告
"""

import pathlib
import datetime as dt
from typing import Dict, Any, List
from config import (
    load_environment_config, 
    get_provider_configs, 
    mask_secret, 
    LOG_DIR
)
from document_processor import (
    collect_doc_text, 
    split_text_for_chunks, 
    create_meeting_template,
    validate_document_content
)
from expert_collaboration import (
    ExpertCollaboration, 
    create_meeting_summary, 
    validate_meeting_results
)


class MainOrchestrator:
    """主编排器，负责协调整个专家会议流程。"""
    
    def __init__(self):
        self.env_config = {}
        self.providers = []
        self.document_content = ""
        self.document_chunks = []
        self.meeting_results = {}
        self.collaboration_summary = {}
        
    def initialize(self) -> bool:
        """初始化编排器，加载配置和检查环境。"""
        print("[experts] 初始化专家团队编排器...")
        
        try:
            # 加载环境配置
            self.env_config = load_environment_config()
            print(f"[experts] 环境配置加载完成")
            
            # 获取提供商配置
            self.providers = get_provider_configs(self.env_config)
            if not self.providers:
                print("[experts] 警告：未检测到可用的AI提供商")
                return False
            
            print(f"[experts] 检测到 {len(self.providers)} 个AI提供商")
            for provider in self.providers:
                print(f"  - {provider['name']} @ {provider['base']}")
            
            # 加载文档内容
            self.document_content = collect_doc_text()
            if not self.document_content:
                print("[experts] 错误：无法读取项目报告文档")
                return False
            
            # 验证文档内容
            doc_validation = validate_document_content(self.document_content)
            if not doc_validation['is_valid']:
                print(f"[experts] 文档验证失败: {doc_validation['errors']}")
                return False
            
            if doc_validation['warnings']:
                print(f"[experts] 文档验证警告: {doc_validation['warnings']}")
            
            print(f"[experts] 文档加载成功，长度: {len(self.document_content)} 字符")
            
            # 文档切片
            self.document_chunks = split_text_for_chunks(self.document_content, max_chars=7000)
            print(f"[experts] 文档切片完成，共 {len(self.document_chunks)} 段")
            
            return True
            
        except Exception as e:
            print(f"[experts] 初始化失败: {e}")
            return False
    
    def write_secrets_snapshot(self) -> None:
        """写入密钥快照（掩码形式）。"""
        secrets_snapshot = (
            f"OPENAI_API_KEY={mask_secret(self.env_config.get('OPENAI_API_KEY',''))}\n"
            f"DEEPSEEK_API_KEY={mask_secret(self.env_config.get('DEEPSEEK_API_KEY',''))}\n"
            f"DASHSCOPE_API_KEY={mask_secret(self.env_config.get('DASHSCOPE_API_KEY',''))}\n"
            f"ANTHROPIC_API_KEY={mask_secret(self.env_config.get('ANTHROPIC_API_KEY',''))}\n"
        )
        
        secrets_path = LOG_DIR / 'secrets_masked.txt'
        secrets_path.parent.mkdir(parents=True, exist_ok=True)
        secrets_path.write_text(secrets_snapshot, encoding='utf-8')
        print(f"[experts] 密钥快照已写入: {secrets_path}")
    
    def run_meeting(self) -> bool:
        """运行专家会议。"""
        print(f"[experts] 开始专家会议，日志目录: {LOG_DIR}")
        
        try:
            # 写入密钥快照
            self.write_secrets_snapshot()
            
            # 创建专家协作管理器
            collaboration_manager = ExpertCollaboration(self.providers, LOG_DIR)
            
            # 运行并行专家会议
            print("[experts] 启动专家协作分析...")
            self.meeting_results = collaboration_manager.run_parallel_meeting(self.document_chunks)
            
            # 生成协作总结
            self.collaboration_summary = collaboration_manager.generate_collaboration_summary()
            
            # 验证会议结果
            validation_result = validate_meeting_results(self.meeting_results)
            if not validation_result['is_valid']:
                print(f"[experts] 会议结果验证失败: {validation_result['errors']}")
                if validation_result['recommendations']:
                    print(f"[experts] 建议: {validation_result['recommendations']}")
            
            if validation_result['warnings']:
                print(f"[experts] 会议结果警告: {validation_result['warnings']}")
            
            print(f"[experts] 专家会议完成，质量评分: {validation_result['quality_score']:.2f}")
            return True
            
        except Exception as e:
            print(f"[experts] 专家会议运行失败: {e}")
            return False
    
    def generate_meeting_report(self) -> bool:
        """生成会议纪要和报告。"""
        print("[experts] 生成会议纪要...")
        
        try:
            # 创建会议纪要模板
            meeting_lines = create_meeting_template()
            
            # 添加会议结果概览
            meeting_lines.append(f"## 会议结果概览\n")
            meeting_lines.append(f"- 参与专家数量: {self.collaboration_summary.get('total_experts', 0)}")
            meeting_lines.append(f"- 成功完成分析: {len(self.collaboration_summary.get('successful_experts', []))}")
            meeting_lines.append(f"- 协作评分: {self.collaboration_summary.get('collaboration_score', 0):.2f}\n")
            
            # 添加各专家建议
            for provider_name, result in self.meeting_results.items():
                status = result.get('status', 'unknown')
                content = result.get('content', '')
                
                if status == 'success':
                    meeting_lines.append(f"\n## {provider_name} 的建议\n\n{content}\n")
                else:
                    meeting_lines.append(f"\n## {provider_name} 的建议\n\n**状态：{status}**\n\n{content}\n")
            
            # 添加协作总结
            if self.collaboration_summary.get('status') == 'success':
                meeting_lines.append("\n## 专家协作总结\n")
                meeting_lines.append(f"- 成功专家: {', '.join(self.collaboration_summary.get('successful_experts', []))}")
                meeting_lines.append(f"- 协作评分: {self.collaboration_summary.get('collaboration_score', 0):.2f}")
            
            # 添加页脚
            anthropic_key = self.env_config.get('ANTHROPIC_API_KEY', '')
            if anthropic_key:
                meeting_lines.append('\n---\n注：检测到 ANTHROPIC_API_KEY，当前版本使用 OpenAI 兼容接口，Anthropic 将在下一轮接入 messages API。\n')
            
            meeting_lines.append(f'\n---\n\n*会议纪要生成时间：{dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}*')
            
            # 写入会议纪要
            meeting_path = LOG_DIR / 'meeting.md'
            meeting_path.parent.mkdir(parents=True, exist_ok=True)
            meeting_path.write_text('\n'.join(meeting_lines), encoding='utf-8')
            
            print(f"[experts] 会议纪要已生成: {meeting_path}")
            
            # 生成JSON格式的详细报告
            detailed_report = {
                'meeting_info': {
                    'timestamp': dt.datetime.now().isoformat(),
                    'total_providers': len(self.providers),
                    'successful_providers': len(self.collaboration_summary.get('successful_experts', [])),
                    'collaboration_score': self.collaboration_summary.get('collaboration_score', 0),
                    'document_chunks': len(self.document_chunks)
                },
                'providers': self.providers,
                'meeting_results': self.meeting_results,
                'collaboration_summary': self.collaboration_summary,
                'validation': validate_meeting_results(self.meeting_results)
            }
            
            report_path = LOG_DIR / 'detailed_report.json'
            import json
            report_path.write_text(json.dumps(detailed_report, ensure_ascii=False, indent=2), encoding='utf-8')
            
            print(f"[experts] 详细报告已生成: {report_path}")
            return True
            
        except Exception as e:
            print(f"[experts] 生成会议纪要失败: {e}")
            return False
    
    def run_full_meeting(self) -> bool:
        """运行完整的专家会议流程。"""
        print("[experts] ===== 专家团队会议开始 =====")
        
        # 初始化
        if not self.initialize():
            print("[experts] 初始化失败，会议终止")
            return False
        
        # 运行会议
        if not self.run_meeting():
            print("[experts] 会议运行失败")
            return False
        
        # 生成报告
        if not self.generate_meeting_report():
            print("[experts] 报告生成失败")
            return False
        
        print("[experts] ===== 专家团队会议完成 =====")
        print(f"[experts] 所有文件已保存到: {LOG_DIR}")
        return True


def run_meeting() -> None:
    """主流程：装载环境 → 选择可用提供商 → 向每位专家发送文档切片 → 汇总输出。"""
    orchestrator = MainOrchestrator()
    success = orchestrator.run_full_meeting()
    
    if not success:
        # 如果失败，尝试生成错误报告
        try:
            error_report = [
                "# 专家团队会议失败报告\n",
                f"时间：{dt.datetime.now().isoformat(timespec='seconds')}\n",
                "\n## 错误信息\n",
                "会议执行过程中发生错误，请检查：\n",
                "1. API密钥配置是否正确\n",
                "2. 网络连接是否正常\n",
                "3. 项目报告文档是否存在\n",
                "4. 系统环境是否满足要求\n\n",
                "## 建议\n",
                "- 检查 .env.local 配置文件\n",
                "- 验证API密钥的有效性\n",
                "- 确认网络连接状态\n",
                "- 查看详细错误日志\n"
            ]
            
            error_path = LOG_DIR / 'error_report.md'
            error_path.parent.mkdir(parents=True, exist_ok=True)
            error_path.write_text('\n'.join(error_report), encoding='utf-8')
            print(f"[experts] 错误报告已生成: {error_path}")
            
        except Exception as e:
            print(f"[experts] 生成错误报告失败: {e}")


if __name__ == '__main__':
    run_meeting()
