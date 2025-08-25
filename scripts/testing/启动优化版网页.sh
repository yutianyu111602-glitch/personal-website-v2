#!/bin/bash

# 启动优化版网页脚本
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

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js 18+"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装，请先安装 npm"
        exit 1
    fi
    
    log_success "系统依赖检查通过"
}

# 启动优化版网页
start_optimized_webpage() {
    log_info "启动优化版网页..."
    
    # 检查webui目录是否存在
    if [ ! -d "apps/webui" ]; then
        log_error "❌ 错误: 未找到webui目录"
        log_info "请检查项目结构是否正确"
        exit 1
    fi
    
    # 进入webui目录
    cd apps/webui
    
    # 检查依赖
    if [ ! -d "node_modules" ]; then
        log_info "安装依赖..."
        npm install
    fi
    
    # 启动开发服务器
    log_info "启动开发服务器..."
    npm run dev
    
    cd "$PROJECT_ROOT"
}

# 主函数
main() {
    log_info "🚀 启动优化版网页"
    log_info "项目根目录: $PROJECT_ROOT"
    
    # 检查依赖
    check_dependencies
    
    # 启动优化版网页
    start_optimized_webpage
    
    log_success "优化版网页启动完成！"
}

# 执行主函数
main "$@"
