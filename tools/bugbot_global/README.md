# 🐛 全局BugBot测试体系

## 📋 概述

这是一个完整的全局BugBot测试体系，用于自动检测和管理整个code工作区中所有项目的BugBot测试。系统支持自动执行、定时任务、智能调度等功能。

## 🎯 核心特性

### 🔍 智能项目检测
- 自动检测工作区中的所有项目
- 支持多种项目类型（Node.js、Python、Rust、Java等）
- 智能识别项目优先级和测试频率

### 🧪 全面测试覆盖
- 为每个项目自动创建测试文件
- 支持Python、JavaScript、TypeScript、React等多种语言
- 包含95个故意编写的代码问题用于测试BugBot

### ⏰ 自动执行管理
- 支持每日、每周、每月定时执行
- 使用cron或systemd定时器
- 智能调度，避免重复执行

### 📊 完整监控报告
- 实时日志记录
- 测试结果统计
- 执行状态监控

## 📁 文件结构

```
tools/bugbot_global/
├── global_bugbot_config.json    # 全局配置文件
├── global_bugbot_test.py        # Python测试脚本
├── global_bugbot_test.sh        # Shell测试脚本
├── auto_execute.sh              # 自动执行脚本
├── cron_setup.sh                # 定时任务设置
├── start_global_bugbot.sh       # 一键启动脚本
└── README.md                    # 说明文档
```

## 🚀 快速开始

### 1. 一键启动
```bash
cd /Users/masher/code
bash tools/bugbot_global/start_global_bugbot.sh
```

### 2. 直接运行测试
```bash
# 检测项目
bash tools/bugbot_global/global_bugbot_test.sh --detect-only

# 运行测试
bash tools/bugbot_global/global_bugbot_test.sh

# 强制测试所有项目
bash tools/bugbot_global/global_bugbot_test.sh --force
```

### 3. 设置定时任务
```bash
# 安装定时任务
bash tools/bugbot_global/cron_setup.sh --install

# 查看状态
bash tools/bugbot_global/cron_setup.sh --status

# 卸载定时任务
bash tools/bugbot_global/cron_setup.sh --uninstall
```

## ⚙️ 配置说明

### 全局配置 (`global_bugbot_config.json`)

```json
{
  "global": {
    "auto_execution": {
      "enabled": true,
      "schedule": "daily",
      "time": "09:00"
    }
  },
  "projects": {
    "个人网站项目V2": {
      "path": "程序集_Programs/个人网站项目V2",
      "enabled": true,
      "priority": "high",
      "test_frequency": "weekly"
    }
  }
}
```

### 配置选项说明

- **auto_execution.enabled**: 是否启用自动执行
- **auto_execution.schedule**: 执行计划（daily/weekly/monthly）
- **auto_execution.time**: 执行时间（HH:MM格式）
- **projects**: 项目配置列表
- **priority**: 项目优先级（high/medium/low）
- **test_frequency**: 测试频率（weekly/bi-weekly/monthly）

## 🔧 使用方法

### 图形界面模式
运行 `start_global_bugbot.sh` 进入交互式管理界面：

1. **检测工作区项目** - 自动发现所有项目
2. **运行全局测试** - 执行智能测试
3. **强制测试所有项目** - 忽略频率限制
4. **管理定时任务** - 安装/卸载定时任务
5. **查看测试状态** - 监控执行情况
6. **配置管理** - 编辑配置文件
7. **帮助信息** - 查看使用说明

### 命令行模式
直接使用各个脚本：

```bash
# 项目检测
python3 tools/bugbot_global/global_bugbot_test.py --detect-only

# 运行测试并生成报告
python3 tools/bugbot_global/global_bugbot_test.py --force --report

# 测试自动执行
bash tools/bugbot_global/cron_setup.sh --test
```

## 📊 测试结果

### 测试报告
系统会自动生成详细的测试报告，包括：

- 项目检测结果
- 测试执行状态
- 成功/失败统计
- 详细错误信息
- 执行时间记录

### 日志文件
所有操作都会记录到日志文件：

- `logs/bugbot_global.log` - 全局测试日志
- `logs/bugbot_auto.log` - 自动执行日志
- `logs/bugbot_cron.log` - 定时任务日志

## 🔍 项目检测规则

### 项目识别条件
系统会自动识别以下类型的项目：

- **Node.js项目**: 包含 `package.json`
- **Python项目**: 包含 `requirements.txt`
- **Rust项目**: 包含 `Cargo.toml`
- **Java Maven项目**: 包含 `pom.xml`
- **Java Gradle项目**: 包含 `build.gradle`
- **Git仓库**: 包含 `.git` 目录
- **源代码项目**: 包含 `src/`、`app/` 等目录

### 优先级判断
根据项目名称和路径自动判断优先级：

- **高优先级**: 包含"个人网站"、"webui"、"main"、"core"、"src"等关键词
- **中优先级**: 包含"test"、"demo"、"example"、"tool"等关键词
- **低优先级**: 其他项目

## ⏰ 定时任务配置

### Cron定时任务
系统会自动创建以下cron任务：

```bash
# 每天上午9点执行
0 9 * * * cd /Users/masher/code && tools/bugbot_global/auto_execute.sh

# 每周一上午9点执行（备用）
0 9 * * 1 cd /Users/masher/code && tools/bugbot_global/auto_execute.sh
```

### Systemd服务（Linux）
在支持systemd的系统上，还会创建systemd服务：

- **服务名称**: `bugbot-auto-test.service`
- **定时器**: `bugbot-auto-test.timer`
- **执行时间**: 每天上午9点

## 🛠️ 故障排除

### 常见问题

#### 1. 依赖缺失
```bash
# 检查依赖
which git jq python3

# 安装缺失的依赖
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

#### 2. 权限问题
```bash
# 设置执行权限
chmod +x tools/bugbot_global/*.sh

# 检查文件权限
ls -la tools/bugbot_global/
```

#### 3. 配置错误
```bash
# 验证JSON格式
jq . tools/bugbot_global/global_bugbot_config.json

# 重置配置
rm tools/bugbot_global/global_bugbot_config.json
# 重新运行脚本生成默认配置
```

#### 4. 定时任务问题
```bash
# 检查cron状态
crontab -l

# 查看cron日志
tail -f /var/log/cron

# 测试脚本
bash tools/bugbot_global/auto_execute.sh
```

### 日志分析
查看相关日志文件来诊断问题：

```bash
# 查看最近的日志
tail -50 logs/bugbot_global.log

# 搜索错误信息
grep -i error logs/bugbot_*.log

# 查看执行时间
grep "测试完成" logs/bugbot_global.log
```

## 🔄 更新和维护

### 自动更新
系统会自动检测工作区变化并更新项目列表。

### 手动更新
```bash
# 重新检测项目
bash tools/bugbot_global/global_bugbot_test.sh --detect-only

# 更新配置
# 编辑 global_bugbot_config.json 文件
```

### 备份配置
```bash
# 备份配置文件
cp tools/bugbot_global/global_bugbot_config.json tools/bugbot_global/global_bugbot_config.json.backup

# 恢复配置
cp tools/bugbot_global/global_bugbot_config.json.backup tools/bugbot_global/global_bugbot_config.json
```

## 📞 技术支持

### 获取帮助
1. 查看本README文档
2. 运行 `start_global_bugbot.sh` 查看帮助信息
3. 检查日志文件了解详细错误信息

### 报告问题
如果遇到问题，请提供以下信息：
- 操作系统版本
- 错误日志内容
- 配置文件内容
- 执行的具体命令

## 📝 更新日志

### v2.0.0 (2025-08-26)
- ✨ 新增全局项目检测功能
- ✨ 新增自动执行管理
- ✨ 新增定时任务支持
- ✨ 新增图形界面管理
- ✨ 新增智能调度算法
- ✨ 新增完整日志系统
- ✨ 新增测试报告生成
- 🔧 优化项目识别规则
- 🔧 改进错误处理机制
- 📚 完善文档和帮助信息

---

**作者**: AI助手  
**创建时间**: 2025年8月26日  
**最后更新**: 2025年8月26日  
**版本**: v2.0.0
