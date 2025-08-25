#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
全局BugBot测试脚本
自动检测code工作区中的所有项目并执行BugBot测试
"""

import os
import sys
import json
import subprocess
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import argparse

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/bugbot_global/global_test.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class GlobalBugBotTester:
    """全局BugBot测试器"""
    
    def __init__(self, config_path: str = None):
        self.workspace_root = Path(__file__).parent.parent.parent
        self.config_path = config_path or self.workspace_root / "tools" / "bugbot_global" / "global_bugbot_config.json"
        self.config = self.load_config()
        self.logs_dir = self.workspace_root / "logs"
        self.logs_dir.mkdir(exist_ok=True)
        
    def load_config(self) -> Dict:
        """加载配置文件"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"加载配置文件失败: {e}")
            return self.get_default_config()
    
    def get_default_config(self) -> Dict:
        """获取默认配置"""
        return {
            "auto_execution": {"enabled": True, "schedule": "daily"},
            "projects": {},
            "automation": {"auto_detect_projects": True}
        }
    
    def detect_projects(self) -> List[Dict]:
        """自动检测工作区中的项目"""
        projects = []
        workspace_root = self.workspace_root
        
        # 定义项目检测规则
        project_indicators = [
            "package.json",  # Node.js项目
            "requirements.txt",  # Python项目
            "Cargo.toml",  # Rust项目
            "pom.xml",  # Java Maven项目
            "build.gradle",  # Java Gradle项目
            ".git",  # Git仓库
            "README.md",  # 有说明文档的目录
            "src/",  # 源代码目录
            "app/",  # 应用目录
        ]
        
        logger.info("开始自动检测项目...")
        
        for item in workspace_root.iterdir():
            if item.is_dir() and not item.name.startswith('.'):
                project_info = self.analyze_project(item, project_indicators)
                if project_info:
                    projects.append(project_info)
                    logger.info(f"发现项目: {project_info['name']} ({project_info['type']})")
        
        logger.info(f"共发现 {len(projects)} 个项目")
        return projects
    
    def analyze_project(self, project_path: Path, indicators: List[str]) -> Optional[Dict]:
        """分析单个项目"""
        try:
            # 检查项目类型
            project_type = "unknown"
            if (project_path / "package.json").exists():
                project_type = "nodejs"
            elif (project_path / "requirements.txt").exists():
                project_type = "python"
            elif (project_path / "Cargo.toml").exists():
                project_type = "rust"
            elif (project_path / "pom.xml").exists():
                project_type = "java-maven"
            elif (project_path / "build.gradle").exists():
                project_type = "java-gradle"
            elif (project_path / ".git").exists():
                project_type = "git-repo"
            
            # 检查是否有源代码
            has_source = any([
                (project_path / "src").exists(),
                (project_path / "app").exists(),
                (project_path / "lib").exists(),
                (project_path / "main.py").exists(),
                (project_path / "index.js").exists(),
                (project_path / "main.ts").exists(),
            ])
            
            if not has_source:
                return None
            
            # 检查Git状态
            git_info = self.get_git_info(project_path)
            
            return {
                "name": project_path.name,
                "path": str(project_path.relative_to(self.workspace_root)),
                "type": project_type,
                "enabled": True,
                "priority": self.determine_priority(project_path),
                "test_frequency": self.determine_test_frequency(project_path),
                "last_test": None,
                "git_info": git_info,
                "last_modified": self.get_last_modified(project_path)
            }
            
        except Exception as e:
            logger.warning(f"分析项目 {project_path.name} 失败: {e}")
            return None
    
    def get_git_info(self, project_path: Path) -> Dict:
        """获取Git信息"""
        try:
            result = subprocess.run(
                ["git", "rev-parse", "--is-inside-work-tree"],
                cwd=project_path,
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                # 获取远程仓库信息
                remote_result = subprocess.run(
                    ["git", "remote", "get-url", "origin"],
                    cwd=project_path,
                    capture_output=True,
                    text=True
                )
                
                return {
                    "is_git_repo": True,
                    "remote_url": remote_result.stdout.strip() if remote_result.returncode == 0 else None
                }
        except Exception:
            pass
        
        return {"is_git_repo": False, "remote_url": None}
    
    def get_last_modified(self, project_path: Path) -> str:
        """获取项目最后修改时间"""
        try:
            # 获取目录下所有文件的最后修改时间
            latest_time = 0
            for file_path in project_path.rglob("*"):
                if file_path.is_file():
                    mtime = file_path.stat().st_mtime
                    latest_time = max(latest_time, mtime)
            
            return datetime.fromtimestamp(latest_time).isoformat()
        except Exception:
            return datetime.now().isoformat()
    
    def determine_priority(self, project_path: Path) -> str:
        """确定项目优先级"""
        # 根据项目名称和路径判断优先级
        high_priority_keywords = ["个人网站", "webui", "main", "core", "src"]
        medium_priority_keywords = ["test", "demo", "example", "tool"]
        
        path_str = str(project_path).lower()
        
        if any(keyword in path_str for keyword in high_priority_keywords):
            return "high"
        elif any(keyword in path_str for keyword in medium_priority_keywords):
            return "medium"
        else:
            return "low"
    
    def determine_test_frequency(self, project_path: Path) -> str:
        """确定测试频率"""
        priority = self.determine_priority(project_path)
        
        if priority == "high":
            return "weekly"
        elif priority == "medium":
            return "bi-weekly"
        else:
            return "monthly"
    
    def should_test_project(self, project: Dict) -> bool:
        """判断项目是否应该测试"""
        if not project.get("enabled", True):
            return False
        
        last_test = project.get("last_test")
        if not last_test:
            return True
        
        # 根据测试频率判断
        frequency = project.get("test_frequency", "monthly")
        last_test_date = datetime.fromisoformat(last_test)
        now = datetime.now()
        
        if frequency == "weekly":
            return (now - last_test_date).days >= 7
        elif frequency == "bi-weekly":
            return (now - last_test_date).days >= 14
        elif frequency == "monthly":
            return (now - last_test_date).days >= 30
        else:
            return True
    
    def create_test_files(self, project_path: Path) -> bool:
        """为项目创建测试文件"""
        try:
            test_dir = project_path / "bugbot_test_examples"
            test_dir.mkdir(exist_ok=True)
            
            # 复制测试示例文件
            source_test_dir = self.workspace_root / "程序集_Programs" / "个人网站项目V2" / "bugbot_test_examples"
            
            if source_test_dir.exists():
                for test_file in source_test_dir.glob("*"):
                    if test_file.is_file():
                        dest_file = test_dir / test_file.name
                        if not dest_file.exists():
                            with open(test_file, 'r', encoding='utf-8') as f:
                                content = f.read()
                            with open(dest_file, 'w', encoding='utf-8') as f:
                                f.write(content)
                            logger.info(f"创建测试文件: {dest_file}")
            
            return True
        except Exception as e:
            logger.error(f"创建测试文件失败: {e}")
            return False
    
    def run_bugbot_test(self, project: Dict) -> bool:
        """运行单个项目的BugBot测试"""
        try:
            project_path = self.workspace_root / project["path"]
            logger.info(f"开始测试项目: {project['name']}")
            
            # 检查是否为Git仓库
            if not project.get("git_info", {}).get("is_git_repo", False):
                logger.warning(f"项目 {project['name']} 不是Git仓库，跳过")
                return False
            
            # 创建测试文件
            if not self.create_test_files(project_path):
                logger.error(f"为项目 {project['name']} 创建测试文件失败")
                return False
            
            # 运行测试脚本
            test_script = project_path / "scripts" / "test-bugbot.sh"
            if test_script.exists():
                logger.info(f"运行测试脚本: {test_script}")
                result = subprocess.run(
                    ["bash", str(test_script)],
                    cwd=project_path,
                    capture_output=True,
                    text=True
                )
                
                if result.returncode == 0:
                    logger.info(f"项目 {project['name']} 测试成功")
                    return True
                else:
                    logger.error(f"项目 {project['name']} 测试失败: {result.stderr}")
                    return False
            else:
                logger.warning(f"项目 {project['name']} 没有测试脚本，跳过")
                return False
                
        except Exception as e:
            logger.error(f"测试项目 {project['name']} 时发生错误: {e}")
            return False
    
    def update_project_status(self, project_name: str, success: bool):
        """更新项目测试状态"""
        if project_name in self.config.get("projects", {}):
            self.config["projects"][project_name]["last_test"] = datetime.now().isoformat()
            self.config["projects"][project_name]["last_test_success"] = success
    
    def save_config(self):
        """保存配置"""
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"保存配置失败: {e}")
    
    def run_all_tests(self, force: bool = False) -> Dict:
        """运行所有项目的测试"""
        logger.info("开始全局BugBot测试...")
        
        # 检测项目
        projects = self.detect_projects()
        
        # 更新配置中的项目列表
        self.config["projects"] = {p["name"]: p for p in projects}
        
        results = {
            "total": len(projects),
            "tested": 0,
            "success": 0,
            "failed": 0,
            "skipped": 0,
            "details": []
        }
        
        for project in projects:
            project_name = project["name"]
            
            if not force and not self.should_test_project(project):
                logger.info(f"项目 {project_name} 不需要测试，跳过")
                results["skipped"] += 1
                continue
            
            results["tested"] += 1
            
            try:
                success = self.run_bugbot_test(project)
                if success:
                    results["success"] += 1
                    self.update_project_status(project_name, True)
                else:
                    results["failed"] += 1
                    self.update_project_status(project_name, False)
                
                results["details"].append({
                    "name": project_name,
                    "success": success,
                    "timestamp": datetime.now().isoformat()
                })
                
            except Exception as e:
                logger.error(f"测试项目 {project_name} 时发生异常: {e}")
                results["failed"] += 1
                results["details"].append({
                    "name": project_name,
                    "success": False,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                })
        
        # 保存配置
        self.save_config()
        
        # 输出结果
        logger.info(f"测试完成: 总计 {results['total']}, 测试 {results['tested']}, 成功 {results['success']}, 失败 {results['failed']}, 跳过 {results['skipped']}")
        
        return results
    
    def schedule_tests(self):
        """安排定时测试"""
        # 这里可以实现定时任务逻辑
        # 可以使用cron、systemd timer或其他调度工具
        logger.info("定时测试功能待实现")
    
    def generate_report(self, results: Dict) -> str:
        """生成测试报告"""
        report = f"""
# BugBot全局测试报告

## 测试概览
- **测试时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **总项目数**: {results['total']}
- **测试项目数**: {results['tested']}
- **成功**: {results['success']}
- **失败**: {results['failed']}
- **跳过**: {results['skipped']}

## 详细结果
"""
        
        for detail in results["details"]:
            status = "✅ 成功" if detail["success"] else "❌ 失败"
            report += f"- **{detail['name']}**: {status}\n"
            if not detail["success"] and "error" in detail:
                report += f"  - 错误: {detail['error']}\n"
        
        return report

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="全局BugBot测试工具")
    parser.add_argument("--force", "-f", action="store_true", help="强制测试所有项目")
    parser.add_argument("--config", "-c", help="配置文件路径")
    parser.add_argument("--detect-only", "-d", action="store_true", help="仅检测项目，不执行测试")
    parser.add_argument("--report", "-r", action="store_true", help="生成测试报告")
    
    args = parser.parse_args()
    
    tester = GlobalBugBotTester(args.config)
    
    if args.detect_only:
        projects = tester.detect_projects()
        print(f"检测到 {len(projects)} 个项目:")
        for project in projects:
            print(f"  - {project['name']} ({project['type']}) - {project['path']}")
        return
    
    # 运行测试
    results = tester.run_all_tests(force=args.force)
    
    if args.report:
        report = tester.generate_report(results)
        report_file = tester.workspace_root / "logs" / f"bugbot_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"报告已保存到: {report_file}")
    
    # 输出结果
    print(f"\n测试完成!")
    print(f"总计: {results['total']}, 测试: {results['tested']}, 成功: {results['success']}, 失败: {results['failed']}, 跳过: {results['skipped']}")

if __name__ == "__main__":
    main()
