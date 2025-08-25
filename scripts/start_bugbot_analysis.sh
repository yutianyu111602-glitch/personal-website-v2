#!/bin/bash

# 🐛 BugBot代码分析启动脚本
# 版本: v1.0.0
# 创建时间: 2025年8月25日
# 目标: 指导用户使用Cursor BugBot分析代码

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

log_instruction() {
    echo -e "${CYAN}[INSTRUCTION]${NC} $1"
}

# 显示帮助信息
show_help() {
    cat << EOF
🐛 BugBot代码分析启动脚本

用法: $0 [选项]

选项:
    --start, -s        启动BugBot分析
    --config, -c       显示配置信息
    --help, -h         显示此帮助信息

示例:
    $0 --start              # 启动BugBot分析
    $0 --config             # 显示配置信息

默认行为: 启动BugBot分析
EOF
}

# 检查Cursor是否安装
check_cursor() {
    log_step "检查Cursor安装状态..."
    
    if ! command -v cursor &> /dev/null; then
        log_error "Cursor未安装，请先安装Cursor"
        log_info "下载地址: https://cursor.sh/"
        exit 1
    fi
    
    log_success "Cursor已安装"
}

# 显示配置信息
show_config() {
    log_step "显示BugBot配置信息..."
    
    if [ -f ".bugbotrc" ]; then
        log_info "BugBot配置文件内容:"
        cat .bugbotrc | jq '.' 2>/dev/null || cat .bugbotrc
    else
        log_warning "BugBot配置文件不存在"
    fi
    
    log_info "项目结构:"
    tree -I 'node_modules|build|dist|backups' -L 3 2>/dev/null || find . -maxdepth 3 -type d | head -20
}

# 启动BugBot分析
start_bugbot_analysis() {
    log_step "启动BugBot代码分析..."
    
    # 检查配置文件
    if [ ! -f ".bugbotrc" ]; then
        log_error "BugBot配置文件不存在，请先创建"
        exit 1
    fi
    
    # 显示分析指导
    log_instruction "🚀 BugBot分析启动指导"
    echo
    log_instruction "步骤1: 在Cursor中打开项目"
    echo "   - 使用命令: cursor ."
    echo "   - 或者手动打开Cursor并选择项目文件夹"
    echo
    
    log_instruction "步骤2: 启动BugBot"
    echo "   - 使用快捷键: Cmd+Shift+P (Mac) 或 Ctrl+Shift+P (Windows/Linux)"
    echo "   - 输入: 'BugBot' 或 'Start BugBot Analysis'"
    echo "   - 选择: 'Start BugBot Analysis'"
    echo
    
    log_instruction "步骤3: 配置分析范围"
    echo "   - 分析类型: Comprehensive Analysis"
    echo "   - 分析深度: Deep Analysis"
    echo "   - 实时监控: Enable Real-time Monitoring"
    echo "   - 配置文件: 已创建 .bugbotrc"
    echo
    
    log_instruction "步骤4: 开始分析"
    echo "   - 点击: Start Analysis"
    echo "   - 等待分析完成"
    echo "   - 查看分析报告"
    echo
    
    log_instruction "步骤5: 修复问题"
    echo "   - 按优先级修复问题"
    echo "   - 运行测试验证"
    echo "   - 重新分析确认修复"
    echo
    
    # 启动Cursor
    log_info "正在启动Cursor..."
    cursor . &
    
    # 等待Cursor启动
    sleep 3
    
    log_success "Cursor已启动，请按照上述步骤操作"
    log_info "BugBot配置文件: .bugbotrc"
    log_info "分析报告将保存到: docs/BUGBOT_ANALYSIS_REPORT.md"
}

# 创建分析报告模板
create_report_template() {
    log_step "创建BugBot分析报告模板..."
    
    mkdir -p docs
    
    cat > docs/BUGBOT_ANALYSIS_REPORT.md << 'EOF'
# 🐛 BugBot代码分析报告

## 📅 分析时间
[等待BugBot分析完成]

## 🎯 分析范围
- 项目: 个人网站项目V2
- 版本: 2.0.0
- 分析深度: Deep Analysis
- 实时监控: 启用

## 📊 分析统计
- 文件数量: [等待统计]
- 代码行数: [等待统计]
- 发现问题: [等待统计]

## 🚨 发现的问题

### 1. 严重问题 (Critical)
- [ ] 等待BugBot分析...

### 2. 重要问题 (High)
- [ ] 等待BugBot分析...

### 3. 中等问题 (Medium)
- [ ] 等待BugBot分析...

### 4. 低优先级问题 (Low)
- [ ] 等待BugBot分析...

## 🔧 修复建议

### 立即修复
- [ ] 等待BugBot分析...

### 短期修复 (1-2天)
- [ ] 等待BugBot分析...

### 长期优化 (1周内)
- [ ] 等待BugBot分析...

## 📈 代码质量评分

- **总体评分**: [等待评分]/100
- **类型安全**: [等待评分]/100
- **性能优化**: [等待评分]/100
- **可维护性**: [等待评分]/100
- **安全性**: [等待评分]/100

## 🚀 下一步行动

1. [ ] 等待BugBot分析完成
2. [ ] 查看详细问题报告
3. [ ] 按优先级修复问题
4. [ ] 运行测试验证
5. [ ] 重新分析确认修复

## 📝 分析配置

BugBot使用以下配置进行分析：

```json
{
  "focusAreas": [
    "port-configuration",
    "type-definitions",
    "import-paths", 
    "event-system",
    "state-management",
    "performance-optimization",
    "memory-leaks",
    "security-vulnerabilities"
  ]
}
```

## 🔍 重点分析文件

- `apps/webui/src/App.tsx` - 主应用组件
- `apps/webui/src/core/EmotionCoreManager.ts` - 情绪核心管理器
- `apps/webui/src/core/ManagerRegistry.ts` - 管理器注册中心
- `apps/webui/src/components/events/UnifiedEventBus.ts` - 统一事件总线
- `apps/webui/src/components/BackgroundManager.tsx` - 背景管理器
- `config/main_config.json` - 主配置文件

---

**报告状态**: ⏳ 等待BugBot分析完成  
**创建时间**: 2025年8月25日  
**生成工具**: start_bugbot_analysis.sh  
**最后更新**: [等待BugBot分析完成]
EOF
    
    log_success "分析报告模板已创建: docs/BUGBOT_ANALYSIS_REPORT.md"
}

# 主函数
main() {
    log_info "🐛 启动BugBot代码分析..."
    
    # 检查Cursor
    check_cursor
    
    # 解析命令行参数
    case "${1:-}" in
        --start|-s)
            create_report_template
            start_bugbot_analysis
            ;;
        --config|-c)
            show_config
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            create_report_template
            start_bugbot_analysis
            ;;
    esac
    
    log_success "🎉 BugBot分析启动完成！"
    log_info "请按照上述步骤在Cursor中使用BugBot分析代码"
}

# 执行主函数
main "$@"
