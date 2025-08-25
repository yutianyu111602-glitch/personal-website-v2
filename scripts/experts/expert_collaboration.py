#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
专家团队编排器专家协作模块

功能：
1. 管理专家并行处理流程
2. 聚合和整合专家分析结果
3. 生成结构化的会议纪要
4. 处理专家间的协作和冲突解决
"""

import time
import json
import pathlib
from typing import List, Dict, Any, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
from config import LOG_DIR, STREAM_ENABLED, OUTPUT_DIR
from http_client import call_ai_provider, probe_endpoint_reachable
from document_processor import (
    generate_expert_prompt, 
    generate_summary_prompt,
    format_expert_section,
    validate_document_content
)


class ExpertCollaboration:
    """专家协作管理器，负责协调多个AI专家的并行工作。"""
    
    def __init__(self, providers: List[Dict[str, str]], log_dir: pathlib.Path):
        self.providers = providers
        self.log_dir = log_dir
        self.meeting_results = {}
        self.collaboration_log = []
        
    def process_provider_parallel(self, provider: Dict[str, str], chunks: List[str]) -> Dict[str, Any]:
        """并行处理单个提供商的文档分析。"""
        provider_name = provider['name']
        provider_type = provider.get('provider_type', 'unknown')
        
        print(f"[experts] 开始处理提供商: {provider_name}，模型: {provider['model']}")
        
        # 检查端点连通性
        if not probe_endpoint_reachable(provider['base']):
            print(f"[experts] 端点不可达: {provider['base']}，跳过该提供商")
            return {
                'provider': provider_name,
                'status': 'unreachable',
                'content': f"端点不可达，跳过：{provider['base']}",
                'chunks_processed': 0,
                'total_chunks': len(chunks)
            }
        
        # 逐段处理文档
        chunk_results = []
        for i, chunk in enumerate(chunks, 1):
            print(f"[experts] {provider_name} 进度: {i}/{len(chunks)} -> 请求中...")
            
            # 生成专家特定的提示词
            prompt_data = generate_expert_prompt(provider_type, i, len(chunks), chunk)
            
            messages = [
                {'role': 'system', 'content': prompt_data['system_prompt']},
                {'role': 'user', 'content': prompt_data['user_message']},
            ]
            
            # 调用AI提供商
            result = call_ai_provider(provider, messages, STREAM_ENABLED)
            
            if result.get('ok'):
                chunk_results.append(str(result.get('content') or '').strip())
                print(f"[experts] {provider_name} 进度: {i}/{len(chunks)} -> 成功")
            else:
                error_msg = f"[ERROR {result.get('status')}] {result.get('raw')}"
                chunk_results.append(error_msg)
                print(f"[experts] {provider_name} 进度: {i}/{len(chunks)} -> 失败 [HTTP {result.get('status')}]")
            
            # 保存原始响应
            raw_path = self.log_dir / f"raw_{provider_name.replace('(', '_').replace(')', '_')}_part{i}.json"
            self._write_text(raw_path, json.dumps(result, ensure_ascii=False, indent=2))
            # 同步一份到 outputs 归档
            out_raw = OUTPUT_DIR / raw_path.name
            self._write_text(out_raw, json.dumps(result, ensure_ascii=False, indent=2))
            
            # 轻微节流，避免触发速率限制
            time.sleep(0.3)
        
        # 聚合收敛
        print(f"[experts] {provider_name} 聚合收敛 -> 请求中...")
        summary_prompt = generate_summary_prompt(provider_type, chunk_results)
        
        summary_messages = [
            {'role': 'system', 'content': summary_prompt['system_prompt']},
            {'role': 'user', 'content': summary_prompt['user_message']},
        ]
        
        # 调用聚合接口
        final_result = call_ai_provider(
            provider, 
            summary_messages, 
            STREAM_ENABLED, 
            {'temperature': 0.2}
        )
        
        if final_result.get('ok'):
            final_content = str(final_result.get('content') or '').strip()
            print(f"[experts] {provider_name} 聚合收敛 -> 成功")
            status = 'success'
        else:
            final_content = f"聚合失败：[HTTP {final_result.get('status')}] {final_result.get('raw')}"
            print(f"[experts] {provider_name} 聚合收敛 -> 失败 [HTTP {final_result.get('status')}]")
            status = 'failed'
        
        return {
            'provider': provider_name,
            'status': status,
            'content': final_content,
            'chunks_processed': len(chunks),
            'total_chunks': len(chunks),
            'chunk_results': chunk_results,
            'raw_final': final_result
        }
    
    def run_parallel_meeting(self, chunks: List[str]) -> Dict[str, Any]:
        """运行并行专家会议，所有专家同时处理文档。"""
        print(f"[experts] 启动并行专家会议，提供商数量: {len(self.providers)}")
        
        # 使用线程池并行处理
        with ThreadPoolExecutor(max_workers=min(len(self.providers), 3)) as executor:
            # 提交所有任务
            future_to_provider = {
                executor.submit(self.process_provider_parallel, provider, chunks): provider
                for provider in self.providers
            }
            
            # 收集结果
            for future in as_completed(future_to_provider):
                provider = future_to_provider[future]
                try:
                    result = future.result()
                    self.meeting_results[provider['name']] = result
                    print(f"[experts] {provider['name']} 完成处理")
                except Exception as e:
                    print(f"[experts] {provider['name']} 处理异常: {e}")
                    self.meeting_results[provider['name']] = {
                        'provider': provider['name'],
                        'status': 'error',
                        'content': f"处理异常: {e}",
                        'chunks_processed': 0,
                        'total_chunks': len(chunks)
                    }
        
        return self.meeting_results
    
    def generate_collaboration_summary(self) -> Dict[str, Any]:
        """生成专家协作总结，识别共识和分歧。"""
        successful_providers = [
            name for name, result in self.meeting_results.items()
            if result.get('status') == 'success'
        ]
        
        if not successful_providers:
            return {
                'status': 'no_successful_experts',
                'message': '没有专家成功完成分析',
                'consensus': [],
                'conflicts': [],
                'recommendations': []
            }
        
        # 分析专家输出，寻找共识和分歧
        consensus_points = []
        conflict_points = []
        unique_insights = []
        
        # 这里可以添加更复杂的分析逻辑
        # 目前简化处理，主要关注TODO项目的重叠度
        
        return {
            'status': 'success',
            'successful_experts': successful_providers,
            'total_experts': len(self.providers),
            'consensus': consensus_points,
            'conflicts': conflict_points,
            'unique_insights': unique_insights,
            'collaboration_score': len(successful_providers) / len(self.providers)
        }
    
    def resolve_conflicts(self, conflicts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """解决专家间的冲突，生成统一的建议。"""
        resolved_conflicts = []
        
        for conflict in conflicts:
            # 基于冲突类型和严重程度，生成解决方案
            resolution = {
                'conflict_type': conflict.get('type', 'unknown'),
                'description': conflict.get('description', ''),
                'resolution': '建议采用多数专家意见',
                'priority': 'medium'
            }
            
            resolved_conflicts.append(resolution)
        
        return resolved_conflicts
    
    def _write_text(self, path: pathlib.Path, content: str) -> None:
        """安全写文件（父目录自动创建，UTF-8）。"""
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding='utf-8')


def create_meeting_summary(meeting_results: Dict[str, Any], collaboration_summary: Dict[str, Any]) -> List[str]:
    """创建结构化的会议纪要。"""
    meeting_lines = []
    
    # 会议概述
    meeting_lines.append("## 会议结果概览\n")
    meeting_lines.append(f"- 参与专家数量: {collaboration_summary.get('total_experts', 0)}")
    meeting_lines.append(f"- 成功完成分析: {len(collaboration_summary.get('successful_experts', []))}")
    meeting_lines.append(f"- 协作评分: {collaboration_summary.get('collaboration_score', 0):.2f}\n")
    
    # 专家建议
    for provider_name, result in meeting_results.items():
        status = result.get('status', 'unknown')
        content = result.get('content', '')
        
        meeting_lines.append(format_expert_section(provider_name, content, status))
    
    # 协作总结
    if collaboration_summary.get('status') == 'success':
        meeting_lines.append("\n## 专家协作总结\n")
        
        if collaboration_summary.get('consensus'):
            meeting_lines.append("### 专家共识\n")
            for consensus in collaboration_summary['consensus']:
                meeting_lines.append(f"- {consensus}\n")
        
        if collaboration_summary.get('conflicts'):
            meeting_lines.append("### 专家分歧\n")
            for conflict in collaboration_summary['conflicts']:
                meeting_lines.append(f"- {conflict}\n")
        
        if collaboration_summary.get('unique_insights'):
            meeting_lines.append("### 独特见解\n")
            for insight in collaboration_summary['unique_insights']:
                meeting_lines.append(f"- {insight}\n")
    
    return meeting_lines


def validate_meeting_results(meeting_results: Dict[str, Any]) -> Dict[str, Any]:
    """验证会议结果的质量和完整性。"""
    validation = {
        'is_valid': True,
        'warnings': [],
        'errors': [],
        'quality_score': 0.0,
        'recommendations': []
    }
    
    total_providers = len(meeting_results)
    successful_providers = sum(1 for r in meeting_results.values() if r.get('status') == 'success')
    
    if total_providers == 0:
        validation['is_valid'] = False
        validation['errors'].append('没有配置任何AI提供商')
        return validation
    
    # 计算质量评分
    validation['quality_score'] = successful_providers / total_providers
    
    if validation['quality_score'] < 0.5:
        validation['warnings'].append('超过一半的专家未能成功完成分析')
        validation['recommendations'].append('检查API密钥和网络连接')
    
    if validation['quality_score'] == 0:
        validation['is_valid'] = False
        validation['errors'].append('所有专家都未能成功完成分析')
        validation['recommendations'].append('检查配置文件和服务状态')
    
    # 检查内容质量
    for provider_name, result in meeting_results.items():
        if result.get('status') == 'success':
            content = result.get('content', '')
            if len(content) < 100:
                validation['warnings'].append(f'{provider_name} 的输出内容过短')
            elif len(content) > 10000:
                validation['warnings'].append(f'{provider_name} 的输出内容过长')
    
    return validation
