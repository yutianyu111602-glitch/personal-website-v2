#!/bin/bash

# 自动打开页面脚本
# 版本: v2.0 重构版
# 最后更新: 2025年8月25日

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

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

# 检查webui目录
check_webui_directory() {
    log_info "检查webui目录..."
    
    if [ ! -d "apps/webui" ]; then
        log_error "❌ 错误: 未找到webui目录"
        log_info "请检查项目结构是否正确"
        exit 1
    fi
    
    log_success "webui目录检查通过"
}

# 启动开发服务器
start_dev_server() {
    log_info "启动开发服务器..."
    
    # 进入webui目录
    cd apps/webui
    
    # 检查依赖
    if [ ! -d "node_modules" ]; then
        log_info "安装依赖..."
        npm install
    fi
    
    # 后台启动开发服务器
    log_info "启动开发服务器..."
    nohup npm run dev > ../../logs/dev.log 2>&1 &
    DEV_PID=$!
    
    echo $DEV_PID > ../../logs/dev.pid
    
    log_success "开发服务器已启动 (PID: $DEV_PID)"
    
    cd "$PROJECT_ROOT"
}

# 等待服务器启动
wait_for_server() {
    log_info "等待服务器启动..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            log_success "服务器已就绪！"
            return 0
        fi
        
        log_info "等待服务器启动... (尝试 $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    log_error "服务器启动超时"
    return 1
}

# 自动打开浏览器
open_browser() {
    log_info "自动打开浏览器..."
    
    # 生成带时间戳的URL以避免缓存
    TIMESTAMP=$(date +%s)
    CACHE_BUST_URL="http://localhost:3000/?v=$TIMESTAMP&_cb=$TIMESTAMP"
    
    # macOS 打开浏览器
    if command -v open > /dev/null; then
        open "$CACHE_BUST_URL"
        log_success "已自动打开浏览器"
    else
        log_warning "无法自动打开浏览器，请手动访问: $CACHE_BUST_URL"
    fi
    
    log_info "访问地址: $CACHE_BUST_URL"
}

# 主函数
main() {
    log_info "🚀 自动打开页面"
    log_info "项目根目录: $PROJECT_ROOT"
    
    # 创建必要的目录
    mkdir -p logs
    
    # 检查webui目录
    check_webui_directory
    
    # 启动开发服务器
    start_dev_server
    
    # 等待服务器启动
    if wait_for_server; then
        # 自动打开浏览器
        open_browser
        
        log_success "页面自动打开完成！"
        log_info "如果页面显示旧版本，请按 Cmd+Shift+R 强制刷新"
    else
        log_error "服务器启动失败，无法打开页面"
        exit 1
    fi
}

# 执行主函数
main "$@"
