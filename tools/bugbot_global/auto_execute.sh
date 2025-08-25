#!/usr/bin/env bash
set -euo pipefail

# 🚀 BugBot自动执行脚本
# 根据配置自动执行BugBot测试

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$SCRIPT_DIR/global_bugbot_config.json"
LOGS_DIR="$WORKSPACE_ROOT/logs/bugbot_global"

# 确保日志目录存在
mkdir -p "$LOGS_DIR"

# 日志函数
log_info() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - [INFO] $1" | tee -a "$LOGS_DIR/auto_execute.log"
}

log_success() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - [SUCCESS] $1" | tee -a "$LOGS_DIR/auto_execute.log"
}

log_warning() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - [WARNING] $1" | tee -a "$LOGS_DIR/auto_execute.log"
}

log_error() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - [ERROR] $1" | tee -a "$LOGS_DIR/auto_execute.log"
}

# 检查配置
check_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        log_error "配置文件不存在: $CONFIG_FILE"
        return 1
    fi
    
    # 检查自动执行是否启用
    local auto_enabled=$(jq -r '.global.auto_execution.enabled' "$CONFIG_FILE" 2>/dev/null || echo "false")
    if [ "$auto_enabled" != "true" ]; then
        log_warning "自动执行未启用"
        return 1
    fi
    
    log_success "配置检查通过"
    return 0
}

# 检查执行时间
check_execution_time() {
    local schedule=$(jq -r '.global.auto_execution.schedule' "$CONFIG_FILE" 2>/dev/null || echo "daily")
    local scheduled_time=$(jq -r '.global.auto_execution.time' "$CONFIG_FILE" 2>/dev/null || echo "09:00")
    
    local current_time=$(date '+%H:%M')
    local current_day=$(date '+%u')  # 1=Monday, 7=Sunday
    
    case "$schedule" in
        "daily")
            if [ "$current_time" = "$scheduled_time" ]; then
                return 0
            fi
            ;;
        "weekly")
            if [ "$current_day" = "1" ] && [ "$current_time" = "$scheduled_time" ]; then
                return 0
            fi
            ;;
        "monthly")
            local current_date=$(date '+%d')
            if [ "$current_date" = "01" ] && [ "$current_time" = "$scheduled_time" ]; then
                return 0
            fi
            ;;
        *)
            log_warning "未知的执行计划: $schedule"
            return 1
            ;;
    esac
    
    return 1
}

# 检查上次执行时间
check_last_execution() {
    local last_exec_file="$LOGS_DIR/bugbot_last_execution"
    
    if [ -f "$last_exec_file" ]; then
        local last_exec=$(cat "$last_exec_file")
        local current_time=$(date '+%s')
        local time_diff=$((current_time - last_exec))
        
        # 如果距离上次执行不到1小时，跳过
        if [ $time_diff -lt 3600 ]; then
            log_info "距离上次执行时间太短，跳过"
            return 1
        fi
    fi
    
    return 0
}

# 记录执行时间
record_execution() {
    local last_exec_file="$LOGS_DIR/bugbot_last_execution"
    date '+%s' > "$last_exec_file"
}

# 执行测试
execute_tests() {
    log_info "开始自动执行BugBot测试..."
    
    # 运行全局测试
    if bash "$SCRIPT_DIR/global_bugbot_test.sh" --force; then
        log_success "BugBot测试执行成功"
        return 0
    else
        log_error "BugBot测试执行失败"
        return 1
    fi
}

# 发送通知
send_notification() {
    local success="$1"
    local message="$2"
    
    # 这里可以实现各种通知方式
    # 比如邮件、Slack、钉钉等
    
    if [ "$success" = "true" ]; then
        log_success "通知: $message"
    else
        log_error "通知: $message"
    fi
}

# 主函数
main() {
    log_info "BugBot自动执行脚本启动"
    
    # 检查配置
    if ! check_config; then
        log_error "配置检查失败，退出"
        exit 1
    fi
    
    # 检查执行时间
    if ! check_execution_time; then
        log_info "不在执行时间范围内，退出"
        exit 0
    fi
    
    # 检查上次执行时间
    if ! check_last_execution; then
        log_info "距离上次执行时间太短，退出"
        exit 0
    fi
    
    # 记录执行时间
    record_execution
    
    # 执行测试
    if execute_tests; then
        local message="BugBot自动测试执行成功"
        send_notification "true" "$message"
        log_success "自动执行完成"
    else
        local message="BugBot自动测试执行失败"
        send_notification "false" "$message"
        log_error "自动执行失败"
        exit 1
    fi
}

# 运行主函数
main "$@"
