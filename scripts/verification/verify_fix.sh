#!/bin/bash

# 🚀 个人网站项目V2 - 修复验证脚本
# 用途: 每次修复后自动验证修复效果
# 作者: AI助手
# 创建时间: 2025年8月25日

set -e  # 遇到错误立即退出

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
    echo "🚀 个人网站项目V2 - 修复验证脚本"
    echo ""
    echo "用法: $0 [选项] [修复描述]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  -f, --full     执行完整验证流程"
    echo "  -q, --quick    执行快速验证流程"
    echo "  -p, --performance 仅执行性能验证"
    echo "  -s, --stability   仅执行稳定性验证"
    echo ""
    echo "示例:"
    echo "  $0 '修复路径引用问题'"
    echo "  $0 -f '修复配置加载Bug'"
    echo "  $0 -q '快速验证启动脚本'"
}

# 获取脚本参数
FIX_DESCRIPTION=""
VERIFICATION_MODE="standard"
VERIFICATION_LEVEL="full"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--full)
            VERIFICATION_LEVEL="full"
            shift
            ;;
        -q|--quick)
            VERIFICATION_LEVEL="quick"
            shift
            ;;
        -p|--performance)
            VERIFICATION_MODE="performance"
            shift
            ;;
        -s|--stability)
            VERIFICATION_MODE="stability"
            shift
            ;;
        -*)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
        *)
            FIX_DESCRIPTION="$1"
            shift
            ;;
    esac
done

# 检查是否提供了修复描述
if [[ -z "$FIX_DESCRIPTION" ]]; then
    log_error "请提供修复描述"
    show_help
    exit 1
fi

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# 创建验证日志目录
VERIFICATION_LOG_DIR="$PROJECT_ROOT/logs/verification"
mkdir -p "$VERIFICATION_LOG_DIR"

# 生成验证日志文件名
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$VERIFICATION_LOG_DIR/verify_${TIMESTAMP}.log"

# 开始验证
log_info "🔍 开始验证修复: $FIX_DESCRIPTION"
log_info "📅 验证时间: $(date)"
log_info "📁 项目根目录: $PROJECT_ROOT"
log_info "📝 日志文件: $LOG_FILE"
log_info "🎯 验证模式: $VERIFICATION_MODE"
log_info "📊 验证级别: $VERIFICATION_LEVEL"

# 记录验证开始
{
    echo "🚀 个人网站项目V2 - 修复验证报告"
    echo "=================================="
    echo "修复描述: $FIX_DESCRIPTION"
    echo "验证时间: $(date)"
    echo "验证模式: $VERIFICATION_MODE"
    echo "验证级别: $VERIFICATION_LEVEL"
    echo "项目根目录: $PROJECT_ROOT"
    echo ""
} | tee -a "$LOG_FILE"

# 1. 基础功能验证
log_info "✅ 开始基础功能验证..."

# 检查项目结构
log_info "📁 检查项目目录结构..."
{
    echo "## 📁 项目目录结构检查"
    echo "### 必需目录检查:"
    
    # 检查必需目录
    REQUIRED_DIRS=("apps" "modules" "config" "scripts" "docs" "logs" "outputs")
    for dir in "${REQUIRED_DIRS[@]}"; do
        if [[ -d "$dir" ]]; then
            echo "✅ $dir/ - 存在"
        else
            echo "❌ $dir/ - 缺失"
        fi
    done
    
    echo ""
    echo "### 核心应用目录检查:"
    CORE_APP_DIRS=("apps/webui" "apps/visualization" "apps/server")
    for dir in "${CORE_APP_DIRS[@]}"; do
        if [[ -d "$dir" ]]; then
            echo "✅ $dir/ - 存在"
        else
            echo "❌ $dir/ - 缺失"
        fi
    done
    
    echo ""
} | tee -a "$LOG_FILE"

# 检查核心文件
log_info "📄 检查核心文件..."
{
    echo "## 📄 核心文件检查"
    echo "### 必需文件检查:"
    
    REQUIRED_FILES=("start.sh" "README.md" "GPT_EXPERTS_ANALYSIS_AND_BUGBOT_REPORT.md")
    for file in "${REQUIRED_FILES[@]}"; do
        if [[ -f "$file" ]]; then
            echo "✅ $file - 存在"
        else
            echo "❌ $file - 缺失"
        fi
    done
    
    echo ""
} | tee -a "$LOG_FILE"

# 2. 构建验证
log_info "🔨 开始构建验证..."

# 检查Node.js环境
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_success "Node.js版本: $NODE_VERSION"
    echo "Node.js版本: $NODE_VERSION" | tee -a "$LOG_FILE"
else
    log_error "Node.js未安装"
    echo "❌ Node.js未安装" | tee -a "$LOG_FILE"
    exit 1
fi

# 检查npm环境
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    log_success "npm版本: $NPM_VERSION"
    echo "npm版本: $NPM_VERSION" | tee -a "$LOG_FILE"
else
    log_error "npm未安装"
    echo "❌ npm未安装" | tee -a "$LOG_FILE"
    exit 1
fi

# 进入webui目录进行构建测试
if [[ -d "apps/webui" ]]; then
    log_info "📱 进入webui目录进行构建测试..."
    cd "apps/webui"
    
    # 检查依赖
    if [[ -d "node_modules" ]]; then
        log_success "依赖已安装"
        echo "✅ 依赖已安装" | tee -a "$LOG_FILE"
    else
        log_warning "依赖未安装，正在安装..."
        echo "⚠️ 依赖未安装，正在安装..." | tee -a "$LOG_FILE"
        npm install
    fi
    
    # 尝试构建
    log_info "🔨 尝试构建项目..."
    if npm run build; then
        log_success "构建成功"
        echo "✅ 构建成功" | tee -a "$LOG_FILE"
        
        # 检查构建输出
        if [[ -d "build" ]]; then
            BUILD_SIZE=$(du -sh build | cut -f1)
            log_success "构建输出目录: build/ (大小: $BUILD_SIZE)"
            echo "✅ 构建输出目录: build/ (大小: $BUILD_SIZE)" | tee -a "$LOG_FILE"
        else
            log_error "构建输出目录不存在"
            echo "❌ 构建输出目录不存在" | tee -a "$LOG_FILE"
        fi
    else
        log_error "构建失败"
        echo "❌ 构建失败" | tee -a "$LOG_FILE"
    fi
    
    # 返回项目根目录
    cd "$PROJECT_ROOT"
else
    log_warning "webui目录不存在，跳过构建测试"
    echo "⚠️ webui目录不存在，跳过构建测试" | tee -a "$LOG_FILE"
fi

# 3. 启动脚本验证
log_info "🚀 开始启动脚本验证..."

# 检查启动脚本权限
if [[ -f "start.sh" ]]; then
    if [[ -x "start.sh" ]]; then
        log_success "启动脚本有执行权限"
        echo "✅ 启动脚本有执行权限" | tee -a "$LOG_FILE"
    else
        log_warning "启动脚本无执行权限，正在修复..."
        echo "⚠️ 启动脚本无执行权限，正在修复..." | tee -a "$LOG_FILE"
        chmod +x start.sh
    fi
    
    # 测试启动脚本帮助信息
    log_info "📖 测试启动脚本帮助信息..."
    if ./start.sh --help &> /dev/null; then
        log_success "启动脚本帮助信息正常"
        echo "✅ 启动脚本帮助信息正常" | tee -a "$LOG_FILE"
    else
        log_warning "启动脚本帮助信息异常"
        echo "⚠️ 启动脚本帮助信息异常" | tee -a "$LOG_FILE"
    fi
else
    log_error "启动脚本不存在"
    echo "❌ 启动脚本不存在" | tee -a "$LOG_FILE"
fi

# 4. 配置文件验证
log_info "⚙️ 开始配置文件验证..."

# 检查主配置文件
if [[ -f "config/main_config.json" ]]; then
    if jq empty "config/main_config.json" 2>/dev/null; then
        log_success "主配置文件JSON格式正确"
        echo "✅ 主配置文件JSON格式正确" | tee -a "$LOG_FILE"
    else
        log_error "主配置文件JSON格式错误"
        echo "❌ 主配置文件JSON格式错误" | tee -a "$LOG_FILE"
    fi
else
    log_warning "主配置文件不存在"
    echo "⚠️ 主配置文件不存在" | tee -a "$LOG_FILE"
fi

# 检查前端配置文件
if [[ -f "apps/webui/src/data-config.json" ]]; then
    if jq empty "apps/webui/src/data-config.json" 2>/dev/null; then
        log_success "前端配置文件JSON格式正确"
        echo "✅ 前端配置文件JSON格式正确" | tee -a "$LOG_FILE"
    else
        log_error "前端配置文件JSON格式错误"
        echo "❌ 前端配置文件JSON格式错误" | tee -a "$LOG_FILE"
    fi
else
    log_warning "前端配置文件不存在"
    echo "⚠️ 前端配置文件不存在" | tee -a "$LOG_FILE"
fi

# 5. 性能验证（如果启用）
if [[ "$VERIFICATION_MODE" == "performance" || "$VERIFICATION_LEVEL" == "full" ]]; then
    log_info "⚡ 开始性能验证..."
    
    # 记录构建时间
    if [[ -d "apps/webui" ]]; then
        cd "apps/webui"
        
        log_info "⏱️ 测量构建性能..."
        BUILD_START=$(date +%s)
        if npm run build &> /dev/null; then
            BUILD_END=$(date +%s)
            BUILD_TIME=$((BUILD_END - BUILD_START))
            log_success "构建时间: ${BUILD_TIME}秒"
            echo "⚡ 构建时间: ${BUILD_TIME}秒" | tee -a "$LOG_FILE"
        fi
        
        cd "$PROJECT_ROOT"
    fi
fi

# 6. 稳定性验证（如果启用）
if [[ "$VERIFICATION_MODE" == "stability" || "$VERIFICATION_LEVEL" == "full" ]]; then
    log_info "🛡️ 开始稳定性验证..."
    
    # 检查文件权限
    log_info "🔐 检查文件权限..."
    {
        echo "## 🔐 文件权限检查"
        echo "### 关键文件权限:"
        
        CRITICAL_FILES=("start.sh" "README.md")
        for file in "${CRITICAL_FILES[@]}"; do
            if [[ -f "$file" ]]; then
                PERMS=$(ls -l "$file" | awk '{print $1}')
                echo "$file: $PERMS"
            fi
        done
        
        echo ""
    } | tee -a "$LOG_FILE"
fi

# 7. 验证结果总结
log_info "📊 生成验证结果总结..."

{
    echo ""
    echo "## 📊 验证结果总结"
    echo "=================================="
    echo "修复描述: $FIX_DESCRIPTION"
    echo "验证状态: 完成"
    echo "验证时间: $(date)"
    echo ""
    echo "### 🎯 验证项目:"
    echo "✅ 基础功能验证 - 完成"
    echo "✅ 构建验证 - 完成"
    echo "✅ 启动脚本验证 - 完成"
    echo "✅ 配置文件验证 - 完成"
    
    if [[ "$VERIFICATION_MODE" == "performance" || "$VERIFICATION_LEVEL" == "full" ]]; then
        echo "✅ 性能验证 - 完成"
    fi
    
    if [[ "$VERIFICATION_MODE" == "stability" || "$VERIFICATION_LEVEL" == "full" ]]; then
        echo "✅ 稳定性验证 - 完成"
    fi
    
    echo ""
    echo "### 📝 后续建议:"
    echo "1. 根据验证结果进行必要的修复"
    echo "2. 更新相关文档"
    echo "3. 进行用户验收测试"
    echo "4. 记录验证经验和教训"
    echo ""
} | tee -a "$LOG_FILE"

# 验证完成
log_success "🎉 修复验证完成!"
log_info "📝 详细日志已保存到: $LOG_FILE"
log_info "🔍 请查看日志文件了解详细验证结果"

# 显示验证结果摘要
echo ""
echo "🎯 验证结果摘要:"
echo "=================="
echo "修复描述: $FIX_DESCRIPTION"
echo "验证状态: ✅ 完成"
echo "日志文件: $LOG_FILE"
echo "验证时间: $(date)"
echo ""

exit 0
