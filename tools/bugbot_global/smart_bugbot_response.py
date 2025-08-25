#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
智能BugBot响应脚本
自动识别用户输入的BugBot相关触发词，并执行相应的全局测试操作
"""

import os
import sys
import re
import subprocess
import logging
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import argparse

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/bugbot_global/smart_response.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SmartBugBotResponder:
    """智能BugBot响应器"""
    
    def __init__(self):
        self.workspace_root = Path(__file__).parent.parent.parent
        self.bugbot_dir = self.workspace_root / "tools" / "bugbot_global"
        self.logs_dir = self.workspace_root / "logs"
        self.logs_dir.mkdir(exist_ok=True)
        
        # 定义触发词模式
        self.trigger_patterns = [
            # 直接触发词
            r'用bugbot',
            r'使用bugbot',
            r'运行bugbot',
            r'启动bugbot',
            r'bugbot检查',
            r'bugbot分析',
            r'bugbot测试',
            r'bugbot扫描',
            # 间接触发词
            r'代码审查',
            r'代码质量检查',
            r'代码扫描',
            r'代码分析',
            r'质量检查',
            r'安全检查',
            r'性能检查',
            # 英文触发词
            r'use bugbot',
            r'run bugbot',
            r'start bugbot',
            r'bugbot check',
            r'bugbot analyze',
            r'bugbot test',
            r'code review',
            r'quality check',
            r'security scan',
        ]
        
        # 编译正则表达式
        self.compiled_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.trigger_patterns]
        
        # 定义响应动作
        self.response_actions = {
            'detect': {
                'command': ['bash', 'tools/bugbot_global/global_bugbot_test.sh', '--detect-only'],
                'description': '检测工作区项目',
                'priority': 1
            },
            'test': {
                'command': ['bash', 'tools/bugbot_global/global_bugbot_test.sh'],
                'description': '运行智能测试',
                'priority': 2
            },
            'auto_pipeline': {
                'command': ['bash', 'tools/bugbot_global/bugbot_auto_pipeline.sh'],
                'description': '自动创建PR→触发→等待→下载结果→写入报告',
                'priority': 0
            },
            'force': {
                'command': ['bash', 'tools/bugbot_global/global_bugbot_test.sh', '--force'],
                'description': '强制测试所有项目',
                'priority': 3
            },
            'gui': {
                'command': ['bash', 'start_global_bugbot.sh'],
                'description': '启动图形界面',
                'priority': 4
            }
        }
    
    def detect_triggers(self, text: str) -> List[str]:
        """检测文本中的触发词"""
        detected_triggers = []
        
        for pattern in self.compiled_patterns:
            if pattern.search(text):
                detected_triggers.append(pattern.pattern)
        
        return detected_triggers
    
    def analyze_intent(self, text: str, triggers: List[str]) -> Dict:
        """分析用户意图"""
        text_lower = text.lower()
        
        intent = {
            'action': 'detect',  # 默认动作
            'confidence': 0.0,
            'reasoning': [],
            'suggested_actions': []
        }
        
        # 分析触发词强度
        if any('bugbot' in trigger.lower() for trigger in triggers):
            intent['confidence'] += 0.4
            intent['reasoning'].append('检测到明确的BugBot触发词')
        
        if any('检查' in trigger or 'check' in trigger.lower() for trigger in triggers):
            intent['confidence'] += 0.3
            intent['reasoning'].append('检测到检查/审查意图')
        
        if any('测试' in trigger or 'test' in trigger.lower() for trigger in triggers):
            intent['confidence'] += 0.2
            intent['reasoning'].append('检测到测试意图')
        
        # 分析动作意图
        if '强制' in text_lower or 'force' in text_lower or '全部' in text_lower:
            intent['action'] = 'force'
            intent['confidence'] += 0.2
            intent['reasoning'].append('检测到强制测试意图')
        
        elif '界面' in text_lower or 'gui' in text_lower or '图形' in text_lower:
            intent['action'] = 'gui'
            intent['confidence'] += 0.2
            intent['reasoning'].append('检测到图形界面意图')
        
        elif '测试' in text_lower or 'test' in text_lower:
            intent['action'] = 'auto_pipeline'
            intent['confidence'] += 0.2
            intent['reasoning'].append('检测到测试执行意图')
        
        # 建议动作
        if intent['confidence'] > 0.5:
            intent['suggested_actions'] = ['detect', 'test']
        if intent['confidence'] > 0.7:
            intent['suggested_actions'].append('force')
        if intent['confidence'] > 0.8:
            intent['suggested_actions'].append('gui')
        
        return intent
    
    def execute_action(self, action: str) -> bool:
        """执行指定的动作"""
        if action not in self.response_actions:
            logger.error(f"未知动作: {action}")
            return False
        
        action_info = self.response_actions[action]
        logger.info(f"执行动作: {action_info['description']}")
        
        try:
            # 切换到工作区根目录
            os.chdir(self.workspace_root)
            
            # 执行命令
            result = subprocess.run(
                action_info['command'],
                capture_output=True,
                text=True,
                timeout=300  # 5分钟超时
            )
            
            if result.returncode == 0:
                logger.info(f"动作执行成功: {action}")
                return True
            else:
                logger.error(f"动作执行失败: {action}, 错误: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            logger.error(f"动作执行超时: {action}")
            return False
        except Exception as e:
            logger.error(f"执行动作时发生错误: {e}")
            return False
    
    def smart_response(self, text: str) -> Dict:
        """智能响应主函数"""
        logger.info(f"收到输入: {text}")
        
        # 检测触发词
        triggers = self.detect_triggers(text)
        
        if not triggers:
            return {
                'triggered': False,
                'message': '未检测到BugBot相关触发词',
                'suggestions': ['尝试使用"用bugbot"、"代码审查"等关键词']
            }
        
        logger.info(f"检测到触发词: {triggers}")
        
        # 分析意图
        intent = self.analyze_intent(text, triggers)
        
        # 执行动作
        success = self.execute_action(intent['action'])
        
        # 构建响应
        response = {
            'triggered': True,
            'triggers': triggers,
            'intent': intent,
            'action_executed': intent['action'],
            'success': success,
            'message': self._generate_response_message(intent, success),
            'next_steps': self._suggest_next_steps(intent, success)
        }
        
        return response
    
    def _generate_response_message(self, intent: Dict, success: bool) -> str:
        """生成响应消息"""
        if success:
            action_desc = self.response_actions[intent['action']]['description']
            return f"✅ 已自动执行: {action_desc}"
        else:
            return f"❌ 执行失败: {self.response_actions[intent['action']]['description']}"
    
    def _suggest_next_steps(self, intent: Dict, success: bool) -> List[str]:
        """建议下一步操作"""
        suggestions = []
        
        if success:
            if intent['action'] == 'detect':
                suggestions.append("运行测试: 说'运行bugbot测试'")
                suggestions.append("查看状态: 说'查看bugbot状态'")
            elif intent['action'] == 'test':
                suggestions.append("强制测试: 说'强制测试所有项目'")
                suggestions.append("启动界面: 说'启动bugbot界面'")
            elif intent['action'] == 'force':
                suggestions.append("查看报告: 检查logs目录下的日志文件")
                suggestions.append("启动界面: 说'启动bugbot界面'")
        else:
            suggestions.append("检查错误: 查看logs目录下的错误日志")
            suggestions.append("手动执行: 运行bash start_global_bugbot.sh")
            suggestions.append("查看帮助: 运行bash tools/bugbot_global/start_global_bugbot.sh")
        
        return suggestions
    
    def interactive_mode(self):
        """交互模式"""
        print("🐛 智能BugBot响应器 - 交互模式")
        print("输入 'quit' 或 'exit' 退出")
        print("=" * 50)
        
        while True:
            try:
                user_input = input("\n请输入您的请求: ").strip()
                
                if user_input.lower() in ['quit', 'exit', '退出']:
                    print("👋 再见！")
                    break
                
                if not user_input:
                    continue
                
                # 智能响应
                response = self.smart_response(user_input)
                
                # 显示结果
                print(f"\n🔍 分析结果:")
                print(f"触发状态: {'✅ 已触发' if response['triggered'] else '❌ 未触发'}")
                
                if response['triggered']:
                    print(f"检测到的触发词: {', '.join(response['triggers'])}")
                    print(f"执行的动作: {response['action_executed']}")
                    print(f"执行结果: {'✅ 成功' if response['success'] else '❌ 失败'}")
                    print(f"响应消息: {response['message']}")
                    
                    if response['next_steps']:
                        print(f"\n📋 建议的下一步操作:")
                        for i, step in enumerate(response['next_steps'], 1):
                            print(f"  {i}. {step}")
                else:
                    print(f"消息: {response['message']}")
                    if response['suggestions']:
                        print(f"建议: {', '.join(response['suggestions'])}")
                
            except KeyboardInterrupt:
                print("\n\n👋 再见！")
                break
            except Exception as e:
                logger.error(f"交互模式错误: {e}")
                print(f"❌ 发生错误: {e}")

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="智能BugBot响应器")
    parser.add_argument("--text", "-t", help="要分析的文本")
    parser.add_argument("--interactive", "-i", action="store_true", help="启动交互模式")
    parser.add_argument("--test", action="store_true", help="测试模式")
    
    args = parser.parse_args()
    
    responder = SmartBugBotResponder()
    
    if args.test:
        # 测试模式
        test_cases = [
            "用bugbot检查代码",
            "使用bugbot分析项目",
            "运行bugbot测试",
            "代码审查",
            "代码质量检查",
            "强制测试所有项目",
            "启动bugbot界面"
        ]
        
        print("🧪 测试模式 - 测试各种触发词")
        print("=" * 50)
        
        for test_case in test_cases:
            print(f"\n📝 测试用例: {test_case}")
            response = responder.smart_response(test_case)
            print(f"结果: {response['message']}")
    
    elif args.text:
        # 分析指定文本
        response = responder.smart_response(args.text)
        print(f"📝 输入文本: {args.text}")
        print(f"🔍 分析结果: {response}")
    
    elif args.interactive:
        # 交互模式
        responder.interactive_mode()
    
    else:
        # 默认显示帮助
        parser.print_help()
        print("\n💡 使用示例:")
        print("  python3 tools/bugbot_global/smart_bugbot_response.py --text '用bugbot检查代码'")
        print("  python3 tools/bugbot_global/smart_bugbot_response.py --interactive")
        print("  python3 tools/bugbot_global/smart_bugbot_response.py --test")

if __name__ == "__main__":
    main()
