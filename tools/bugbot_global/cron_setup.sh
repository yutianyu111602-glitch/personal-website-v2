#!/usr/bin/env bash
set -euo pipefail

# ⏰ BugBot定时任务设置脚本
# 设置cron定时任务来自动执行BugBot测试

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AUTO_EXECUTE_SCRIPT="$SCRIPT_DIR/auto_execute.sh"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# 显示帮助信息
show_help() {
    cat << EOF
⏰ BugBot定时任务设置脚本

用法: $0 [选项]

选项:
    --install, -i        安装定时任务
    --uninstall, -u      卸载定时任务
    --status, -s         查看定时任务状态
    --test, -t           测试自动执行脚本
    --help, -h           显示此帮助信息

示例:
    $0 --install          # 安装定时任务
    $0 --uninstall        # 卸载定时任务
    $0 --status           # 查看状态
    $0 --test             # 测试脚本

默认行为: 显示帮助信息
EOF
}

# 检查脚本是否存在
check_script() {
    if [ ! -f "$AUTO_EXECUTE_SCRIPT" ]; then
        log_error "自动执行脚本不存在: $AUTO_EXECUTE_SCRIPT"
        exit 1
    fi
    
    if [ ! -x "$AUTO_EXECUTE_SCRIPT" ]; then
        log_info "设置脚本执行权限"
        chmod +x "$AUTO_EXECUTE_SCRIPT"
    fi
    
    log_success "脚本检查通过"
}

# 安装定时任务
install_cron() {
    log_step "安装BugBot定时任务..."
    
    # 创建临时crontab文件
    local temp_cron=$(mktemp)
    
    # 导出当前crontab
    crontab -l 2>/dev/null > "$temp_cron" || echo "" > "$temp_cron"
    
    # 检查是否已经存在BugBot任务
    if grep -q "bugbot_global/auto_execute.sh" "$temp_cron"; then
        log_warning "BugBot定时任务已存在"
        return 0
    fi
    
    # 添加BugBot定时任务
    cat >> "$temp_cron" << EOF

# BugBot自动测试任务
# 每天上午9点执行
0 9 * * * cd "$WORKSPACE_ROOT" && "$AUTO_EXECUTE_SCRIPT" >> "$WORKSPACE_ROOT/logs/bugbot_global/cron_jobs.log" 2>&1

# 每周一上午9点执行（备用）
0 9 * * 1 cd "$WORKSPACE_ROOT" && "$AUTO_EXECUTE_SCRIPT" >> "$WORKSPACE_ROOT/logs/bugbot_global/cron_jobs.log" 2>&1
EOF
    
    # 安装新的crontab
    if crontab "$temp_cron"; then
        log_success "定时任务安装成功"
        
        # 显示安装的任务
        log_info "已安装的定时任务:"
        crontab -l | grep -A 5 -B 5 "bugbot"
    else
        log_error "定时任务安装失败"
        return 1
    fi
    
    # 清理临时文件
    rm "$temp_cron"
}

# 卸载定时任务
uninstall_cron() {
    log_step "卸载BugBot定时任务..."
    
    # 创建临时crontab文件
    local temp_cron=$(mktemp)
    
    # 导出当前crontab并过滤掉BugBot相关任务
    crontab -l 2>/dev/null | grep -v "bugbot_global/auto_execute.sh" | grep -v "BugBot自动测试任务" > "$temp_cron"
    
    # 安装过滤后的crontab
    if crontab "$temp_cron"; then
        log_success "定时任务卸载成功"
    else
        log_error "定时任务卸载失败"
        return 1
    fi
    
    # 清理临时文件
    rm "$temp_cron"
}

# 查看定时任务状态
show_status() {
    log_step "查看BugBot定时任务状态..."
    
    local cron_count=$(crontab -l 2>/dev/null | grep -c "bugbot_global/auto_execute.sh" || echo "0")
    
    if [ "$cron_count" -gt 0 ]; then
        log_success "找到 $cron_count 个BugBot定时任务"
        echo ""
        echo "当前BugBot定时任务:"
        crontab -l | grep -A 2 -B 2 "bugbot"
    else
        log_warning "未找到BugBot定时任务"
    fi
    
    # 检查日志文件
    local log_file="$WORKSPACE_ROOT/logs/bugbot_global/cron_jobs.log"
    if [ -f "$log_file" ]; then
        echo ""
        echo "最近的执行日志:"
        tail -10 "$log_file" 2>/dev/null || echo "无法读取日志文件"
    else
        echo ""
        echo "日志文件不存在: $log_file"
    fi
}

# 测试自动执行脚本
test_script() {
    log_step "测试自动执行脚本..."
    
    if bash "$AUTO_EXECUTE_SCRIPT"; then
        log_success "脚本测试成功"
    else
        log_error "脚本测试失败"
        return 1
    fi
}

# 创建systemd服务（Linux系统）
create_systemd_service() {
    if ! command -v systemctl >/dev/null 2>&1; then
        log_warning "系统不支持systemd，跳过服务创建"
        return 0
    fi
    
    log_info "创建systemd服务..."
    
    local service_name="bugbot-auto-test"
    local service_file="/etc/systemd/system/$service_name.service"
    local timer_file="/etc/systemd/system/$service_name.timer"
    
    # 检查是否以root权限运行
    if [ "$EUID" -ne 0 ]; then
        log_warning "需要root权限创建systemd服务，跳过"
        return 0
    fi
    
    # 创建服务文件
    cat > "$service_file" << EOF
[Unit]
Description=BugBot Auto Test Service
After=network.target

[Service]
Type=oneshot
User=$USER
WorkingDirectory=$WORKSPACE_ROOT
ExecStart=$AUTO_EXECUTE_SCRIPT
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    
    # 创建定时器文件
    cat > "$timer_file" << EOF
[Unit]
Description=Run BugBot Auto Test daily
Requires=$service_name.service

[Timer]
OnCalendar=*-*-* 09:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF
    
    # 重新加载systemd配置
    systemctl daemon-reload
    
    # 启用并启动定时器
    systemctl enable "$service_name.timer"
    systemctl start "$service_name.timer"
    
    log_success "systemd服务创建成功"
    log_info "服务状态:"
    systemctl status "$service_name.timer" --no-pager -l
}

# 主函数
main() {
    local action=""
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --install|-i)
                action="install"
                shift
                ;;
            --uninstall|-u)
                action="uninstall"
                shift
                ;;
            --status|-s)
                action="status"
                shift
                ;;
            --test|-t)
                action="test"
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 如果没有指定动作，显示帮助
    if [ -z "$action" ]; then
        show_help
        exit 0
    fi
    
    # 检查脚本
    check_script
    
    # 执行相应动作
    case "$action" in
        "install")
            install_cron
            create_systemd_service
            ;;
        "uninstall")
            uninstall_cron
            ;;
        "status")
            show_status
            ;;
        "test")
            test_script
            ;;
        *)
            log_error "未知动作: $action"
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
