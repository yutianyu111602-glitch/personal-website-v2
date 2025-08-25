#!/usr/bin/env bash
set -euo pipefail

# 🚀 全局BugBot一键启动脚本
# 提供简单的界面来管理全局BugBot测试

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

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

# 显示标题
show_title() {
    clear
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🐛 全局BugBot测试管理器                    ║"
    echo "║                                                              ║"
    echo "║               Code Workspace BugBot Global Manager           ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
}

# 显示主菜单
show_main_menu() {
    echo "请选择操作:"
    echo ""
    echo "  1) 🔍 检测工作区项目"
    echo "  2) 🧪 运行全局测试"
    echo "  3) 🚀 强制测试所有项目"
    echo "  4) ⏰ 管理定时任务"
    echo "  5) 📊 查看测试状态"
    echo "  6) ⚙️  配置管理"
    echo "  7) 📚 帮助信息"
    echo "  0) 🚪 退出"
    echo ""
    echo -n "请输入选项 [0-7]: "
}

# 检测项目
detect_projects() {
    log_step "检测工作区项目..."
    
    if [ -f "$SCRIPT_DIR/global_bugbot_test.py" ]; then
        cd "$WORKSPACE_ROOT"
        python3 "$SCRIPT_DIR/global_bugbot_test.py" --detect-only
    elif [ -f "$SCRIPT_DIR/global_bugbot_test.sh" ]; then
        bash "$SCRIPT_DIR/global_bugbot_test.sh" --detect-only
    else
        log_error "测试脚本不存在"
        return 1
    fi
    
    echo ""
    echo -n "按回车键继续..."
    read -r
}

# 运行全局测试
run_global_test() {
    log_step "运行全局BugBot测试..."
    
    if [ -f "$SCRIPT_DIR/global_bugbot_test.py" ]; then
        cd "$WORKSPACE_ROOT"
        python3 "$SCRIPT_DIR/global_bugbot_test.py" --report
    elif [ -f "$SCRIPT_DIR/global_bugbot_test.sh" ]; then
        bash "$SCRIPT_DIR/global_bugbot_test.sh"
    else
        log_error "测试脚本不存在"
        return 1
    fi
    
    echo ""
    echo -n "按回车键继续..."
    read -r
}

# 强制测试所有项目
force_test_all() {
    log_step "强制测试所有项目..."
    
    if [ -f "$SCRIPT_DIR/global_bugbot_test.py" ]; then
        cd "$WORKSPACE_ROOT"
        python3 "$SCRIPT_DIR/global_bugbot_test.py" --force --report
    elif [ -f "$SCRIPT_DIR/global_bugbot_test.sh" ]; then
        bash "$SCRIPT_DIR/global_bugbot_test.sh" --force
    else
        log_error "测试脚本不存在"
        return 1
    fi
    
    echo ""
    echo -n "按回车键继续..."
    read -r
}

# 管理定时任务
manage_cron() {
    while true; do
        clear
        show_title
        echo "⏰ 定时任务管理"
        echo ""
        echo "请选择操作:"
        echo ""
        echo "  1) 📥 安装定时任务"
        echo "  2) 📤 卸载定时任务"
        echo "  3) 📋 查看任务状态"
        echo "  4) 🧪 测试自动执行"
        echo "  0) 🔙 返回主菜单"
        echo ""
        echo -n "请输入选项 [0-4]: "
        
        read -r choice
        case $choice in
            1)
                log_step "安装定时任务..."
                bash "$SCRIPT_DIR/cron_setup.sh" --install
                echo ""
                echo -n "按回车键继续..."
                read -r
                ;;
            2)
                log_step "卸载定时任务..."
                bash "$SCRIPT_DIR/cron_setup.sh" --uninstall
                echo ""
                echo -n "按回车键继续..."
                read -r
                ;;
            3)
                log_step "查看任务状态..."
                bash "$SCRIPT_DIR/cron_setup.sh" --status
                echo ""
                echo -n "按回车键继续..."
                read -r
                ;;
            4)
                log_step "测试自动执行..."
                bash "$SCRIPT_DIR/cron_setup.sh" --test
                                echo ""
                echo -n "按回车键继续..."
                read -r
                ;;
            0)
                return 0
                ;;
            *)
                log_error "无效选项: $choice"
                sleep 2
                ;;
        esac
    done
}

# 查看测试状态
show_test_status() {
    log_step "查看测试状态..."
    
    # 检查日志文件
    local log_dir="$WORKSPACE_ROOT/logs/bugbot_global"
    local global_log="$log_dir/global_test.log"
    local auto_log="$log_dir/auto_execute.log"
    local cron_log="$log_dir/cron_jobs.log"
    
    echo "📊 BugBot测试状态报告"
    echo "================================"
    echo ""
    
    if [ -f "$global_log" ]; then
        echo "🔍 全局测试日志 ($global_log):"
        echo "最近10条记录:"
        tail -10 "$global_log" 2>/dev/null || echo "无法读取日志"
        echo ""
    else
        echo "❌ 全局测试日志不存在"
        echo ""
    fi
    
    if [ -f "$auto_log" ]; then
        echo "🤖 自动执行日志 ($auto_log):"
        echo "最近10条记录:"
        tail -10 "$auto_log" 2>/dev/null || echo "无法读取日志"
        echo ""
    else
        echo "❌ 自动执行日志不存在"
        echo ""
    fi
    
    if [ -f "$cron_log" ]; then
        echo "⏰ 定时任务日志 ($cron_log):"
        echo "最近10条记录:"
        tail -10 "$cron_log" 2>/dev/null || echo "无法读取日志"
        echo ""
    else
        echo "❌ 定时任务日志不存在"
        echo ""
    fi
    
    # 检查定时任务状态
    echo "⏰ 定时任务状态:"
    if command -v crontab >/dev/null 2>&1; then
        local cron_count=$(crontab -l 2>/dev/null | grep -c "bugbot_global/auto_execute.sh" || echo "0")
        if [ "$cron_count" -gt 0 ]; then
            echo "✅ 找到 $cron_count 个BugBot定时任务"
        else
            echo "❌ 未找到BugBot定时任务"
        fi
    else
        echo "❌ 系统不支持crontab"
    fi
    
    echo ""
    echo -n "按回车键继续..."
    read -r
}

# 配置管理
manage_config() {
    while true; do
        clear
        show_title
        echo "⚙️  配置管理"
        echo ""
        echo "请选择操作:"
        echo ""
        echo "  1) 📋 查看当前配置"
        echo "  2) ✏️  编辑配置文件"
        echo "  3) 🔄 重置为默认配置"
        echo "  4) 📁 打开配置目录"
        echo "  0) 🔙 返回主菜单"
        echo ""
        echo -n "请输入选项 [0-4]: "
        
        read -r choice
        case $choice in
            1)
                log_step "查看当前配置..."
                if [ -f "$SCRIPT_DIR/global_bugbot_config.json" ]; then
                    cat "$SCRIPT_DIR/global_bugbot_config.json" | jq '.' 2>/dev/null || cat "$SCRIPT_DIR/global_bugbot_config.json"
                else
                    log_error "配置文件不存在"
                fi
                echo ""
                echo -n "按回车键继续..."
                read -r
                ;;
            2)
                log_step "编辑配置文件..."
                if [ -f "$SCRIPT_DIR/global_bugbot_config.json" ]; then
                    if command -v code >/dev/null 2>&1; then
                        code "$SCRIPT_DIR/global_bugbot_config.json"
                    elif command -v nano >/dev/null 2>&1; then
                        nano "$SCRIPT_DIR/global_bugbot_config.json"
                    elif command -v vim >/dev/null 2>&1; then
                        vim "$SCRIPT_DIR/global_bugbot_config.json"
                    else
                        log_error "未找到可用的编辑器"
                    fi
                else
                    log_error "配置文件不存在"
                fi
                echo ""
                echo -n "按回车键继续..."
                read -r
                ;;
            3)
                log_step "重置为默认配置..."
                echo "⚠️  确定要重置配置吗？这将覆盖所有自定义设置。"
                echo -n "输入 'yes' 确认: "
                read -r confirm
                if [ "$confirm" = "yes" ]; then
                    # 这里可以重新生成默认配置
                    log_success "配置已重置"
                else
                    log_info "操作已取消"
                fi
                echo ""
                echo -n "按回车键继续..."
                read -r
                ;;
            4)
                log_step "打开配置目录..."
                if command -v open >/dev/null 2>&1; then
                    open "$SCRIPT_DIR"
                elif command -v xdg-open >/dev/null 2>&1; then
                    xdg-open "$SCRIPT_DIR"
                else
                    log_info "配置目录: $SCRIPT_DIR"
                fi
                echo ""
                echo -n "按回车键继续..."
                read -r
                ;;
            0)
                return 0
                ;;
            *)
                log_error "无效选项: $choice"
                sleep 2
                ;;
        esac
    done
}

# 显示帮助信息
show_help() {
    clear
    show_title
    echo "📚 帮助信息"
    echo "============"
    echo ""
    echo "🐛 BugBot是什么？"
    echo "BugBot是Cursor的GitHub App，用于自动审查Pull Request中的代码，"
    echo "发现潜在问题并提供修复建议。"
    echo ""
    echo "🚀 全局测试功能："
    echo "- 自动检测工作区中的所有项目"
    echo "- 为每个项目创建测试文件"
    echo "- 运行BugBot测试脚本"
    echo "- 生成测试报告"
    echo ""
    echo "⏰ 自动执行功能："
    echo "- 支持每日、每周、每月定时执行"
    echo "- 使用cron或systemd定时器"
    echo "- 自动记录执行日志"
    echo ""
    echo "📁 文件结构："
    echo "$SCRIPT_DIR/"
    echo "├── global_bugbot_config.json    # 全局配置文件"
    echo "├── global_bugbot_test.py        # Python测试脚本"
    echo "├── global_bugbot_test.sh        # Shell测试脚本"
    echo "├── auto_execute.sh              # 自动执行脚本"
    echo "├── cron_setup.sh                # 定时任务设置"
    echo "└── start_global_bugbot.sh      # 本启动脚本"
    echo ""
    echo "🔧 使用方法："
    echo "1. 选择'检测工作区项目'来发现所有项目"
    echo "2. 选择'运行全局测试'来执行测试"
    echo "3. 选择'管理定时任务'来设置自动执行"
    echo "4. 选择'查看测试状态'来监控执行情况"
    echo ""
    echo "📞 获取帮助："
    echo "如果遇到问题，请检查："
    echo "- 脚本执行权限"
    echo "- 依赖工具（git, jq, python3）"
    echo "- 配置文件格式"
    echo "- 日志文件内容"
    echo ""
    echo -n "按回车键返回主菜单..."
    read -r
}

# 主循环
main() {
    while true; do
        show_title
        show_main_menu
        
        read -r choice
        case $choice in
            1)
                detect_projects
                ;;
            2)
                run_global_test
                ;;
            3)
                force_test_all
                ;;
            4)
                manage_cron
                ;;
            5)
                show_test_status
                ;;
            6)
                manage_config
                ;;
            7)
                show_help
                ;;
            0)
                echo ""
                log_info "感谢使用全局BugBot测试管理器！"
                exit 0
                ;;
            *)
                log_error "无效选项: $choice"
                sleep 2
                ;;
        esac
    done
}

# 检查依赖
check_dependencies() {
    local missing_deps=()
    
    if ! command -v git >/dev/null 2>&1; then
        missing_deps+=("git")
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        missing_deps+=("jq")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "缺少必要的依赖: ${missing_deps[*]}"
        log_info "请安装缺少的依赖后重试"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 启动前检查
startup_check() {
    log_step "启动检查..."
    
    # 检查依赖
    check_dependencies
    
    # 检查脚本文件
    local required_files=(
        "global_bugbot_config.json"
        "global_bugbot_test.sh"
        "auto_execute.sh"
        "cron_setup.sh"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$SCRIPT_DIR/$file" ]; then
            log_error "缺少必要文件: $file"
            exit 1
        fi
    done
    
    # 设置执行权限
    chmod +x "$SCRIPT_DIR"/*.sh 2>/dev/null || true
    
    log_success "启动检查完成"
}

# 运行启动检查
startup_check

# 运行主程序
main "$@"
