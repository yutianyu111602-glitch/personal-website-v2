#!/bin/bash

# 🚀 个人网站项目V2 - 统一启动脚本
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
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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

# 显示帮助信息
show_help() {
    cat << EOF
🚀 个人网站项目V2 - 统一启动脚本

用法: $0 [选项]

选项:
    --dev, -d          启动开发环境
    --build, -b        构建项目
    --deploy, -D       部署项目
    --build-deploy, -B 构建并部署
    --clean, -c        清理项目
    --help, -h         显示此帮助信息

示例:
    $0 --dev              # 启动开发环境
    $0 --build            # 构建项目
    $0 --deploy           # 部署项目
    $0 --build-deploy     # 构建并部署

默认行为: 显示菜单选择
EOF
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

# 环境变量检查
check_environment() {
    log_info "检查环境变量..."
    
    if [ ! -f ".env.local" ]; then
        log_warning ".env.local 不存在，从 env.example 生成"
        if [ -f "config/environment/env.example" ]; then
            cp "config/environment/env.example" ".env.local"
            log_success "已生成 .env.local"
        else
            log_warning "env.example 不存在，使用默认配置"
        fi
    fi
    
    # 加载环境变量
    if [ -f ".env.local" ]; then
        export $(grep -v '^#' .env.local | xargs)
    fi
    
    # 设置默认端口
    export PORT=${PORT:-3000}
    export METADATA_PORT=${METADATA_PORT:-3500}
    
    log_success "环境变量检查完成"
}

# 依赖安装
install_dependencies() {
    log_info "安装项目依赖..."
    
    if [ -d "apps/webui" ]; then
        cd "apps/webui"
        if [ ! -d "node_modules" ]; then
            log_info "安装前端依赖..."
            npm ci || npm install
        fi
        cd "$PROJECT_ROOT"
    fi
    
    log_success "依赖安装完成"
}

# 启动开发环境
start_dev() {
    log_info "启动开发环境..."
    
    if [ ! -d "apps/webui" ]; then
        log_error "webui 目录不存在"
        exit 1
    fi
    
    cd "apps/webui"
    
    # 后台启动开发服务器
    nohup npm run dev > ../../logs/dev.log 2>&1 &
    DEV_PID=$!
    
    echo $DEV_PID > ../../logs/dev.pid
    
    log_success "开发服务器已启动 (PID: $DEV_PID)"
    log_info "访问地址: http://localhost:$PORT"
    log_info "日志文件: logs/dev.log"
    
    cd "$PROJECT_ROOT"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    if [ ! -d "apps/webui" ]; then
        log_error "webui 目录不存在"
        exit 1
    fi
    
    cd "apps/webui"
    
    # 构建项目
    npm run build
    
    # 创建构建产物归档
    BUILD_DIR="../../outputs/personal_website/builds/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BUILD_DIR"
    
    # 复制构建产物（注意：输出目录是build不是dist）
    cp -r build/* "$BUILD_DIR/"
    
    log_success "项目构建完成"
    log_info "构建产物: $BUILD_DIR"
    
    cd "$PROJECT_ROOT"
}

# 部署项目
deploy_project() {
    log_info "部署项目..."
    
    # 检查是否有构建产物
    if [ ! -d "apps/webui/build" ]; then
        log_warning "未找到构建产物，先构建项目"
        build_project
    fi
    
    # 部署到当前目录
    DEPLOY_DIR="outputs/personal_website/current"
    mkdir -p "$DEPLOY_DIR"
    
    # 清理旧部署
    rm -rf "$DEPLOY_DIR"/*
    
    # 复制新部署（注意：输出目录是build不是dist）
    cp -r apps/webui/build/* "$DEPLOY_DIR/"
    
    # 启动静态服务
    cd "$DEPLOY_DIR"
    
    # 检查是否有 serve 命令
    if command -v serve &> /dev/null; then
        nohup serve -l "$PORT" > ../../logs/serve.log 2>&1 &
        SERVE_PID=$!
        echo $SERVE_PID > ../../logs/serve.pid
        
        log_success "项目部署完成"
        log_info "访问地址: http://localhost:$PORT"
        log_info "服务PID: $SERVE_PID"
    else
        log_warning "serve 命令未安装，请手动启动静态服务"
        log_info "部署目录: $DEPLOY_DIR"
    fi
    
    cd "$PROJECT_ROOT"
}

# 清理项目
clean_project() {
    log_info "清理项目..."
    
    # 停止开发服务器
    if [ -f "logs/dev.pid" ]; then
        DEV_PID=$(cat logs/dev.pid)
        if kill -0 "$DEV_PID" 2>/dev/null; then
            kill "$DEV_PID"
            log_info "已停止开发服务器 (PID: $DEV_PID)"
        fi
        rm -f logs/dev.pid
    fi
    
    # 停止部署服务
    if [ -f "logs/serve.pid" ]; then
        SERVE_PID=$(cat logs/serve.pid)
        if kill -0 "$SERVE_PID" 2>/dev/null; then
            kill "$SERVE_PID"
            log_info "已停止部署服务 (PID: $SERVE_PID)"
        fi
        rm -f logs/serve.pid
    fi
    
    # 清理构建产物
    if [ -d "apps/webui/build" ]; then
        rm -rf apps/webui/build
        log_info "已清理构建产物"
    fi
    
    # 清理日志
    rm -f logs/dev.log logs/serve.log
    
    log_success "项目清理完成"
}

# 显示菜单
show_menu() {
    cat << EOF

🚀 个人网站项目V2 - 重构版
================================

请选择操作:

1) 启动开发环境
2) 构建项目
3) 部署项目
4) 构建并部署
5) 清理项目
6) 显示帮助
0) 退出

请输入选项 [0-6]: 
EOF
}

# 主函数
main() {
    # 创建必要的目录
    mkdir -p logs outputs/personal_website/builds outputs/personal_website/current
    
    # 检查依赖和环境
    check_dependencies
    check_environment
    install_dependencies
    
    # 处理命令行参数
    case "${1:-}" in
        --dev|-d)
            start_dev
            ;;
        --build|-b)
            build_project
            ;;
        --deploy|-D)
            deploy_project
            ;;
        --build-deploy|-B)
            build_project
            deploy_project
            ;;
        --clean|-c)
            clean_project
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        "")
            # 无参数时显示菜单
            while true; do
                show_menu
                read -r choice
                case $choice in
                    1)
                        start_dev
                        break
                        ;;
                    2)
                        build_project
                        break
                        ;;
                    3)
                        deploy_project
                        break
                        ;;
                    4)
                        build_project
                        deploy_project
                        break
                        ;;
                    5)
                        clean_project
                        break
                        ;;
                    6)
                        show_help
                        ;;
                    0)
                        log_info "退出程序"
                        exit 0
                        ;;
                    *)
                        log_warning "无效选项，请重新选择"
                        ;;
                esac
            done
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
    
    log_success "操作完成！"
}

# 执行主函数
main "$@"
