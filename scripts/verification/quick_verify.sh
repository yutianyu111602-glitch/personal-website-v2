#!/bin/bash

# 🚀 个人网站项目V2 - 快速验证脚本
# 用途: 日常快速验证项目状态
# 作者: AI助手
# 创建时间: 2025年8月25日

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "🚀 个人网站项目V2 - 快速验证"
echo "================================"
echo "📁 项目根目录: $PROJECT_ROOT"
echo "📅 验证时间: $(date)"
echo ""

# 1. 快速目录检查
log_info "📁 快速目录检查..."
MISSING_DIRS=()
REQUIRED_DIRS=("apps" "modules" "config" "scripts" "docs")

for dir in "${REQUIRED_DIRS[@]}"; do
    if [[ -d "$dir" ]]; then
        echo "✅ $dir/"
    else
        echo "❌ $dir/"
        MISSING_DIRS+=("$dir")
    fi
done

if [[ ${#MISSING_DIRS[@]} -gt 0 ]]; then
    log_warning "发现缺失目录: ${MISSING_DIRS[*]}"
else
    log_success "所有必需目录都存在"
fi

echo ""

# 2. 快速文件检查
log_info "📄 快速文件检查..."
MISSING_FILES=()
REQUIRED_FILES=("start.sh" "README.md")

for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file"
    else
        echo "❌ $file"
        MISSING_FILES+=("$file")
    fi
done

if [[ ${#MISSING_FILES[@]} -gt 0 ]]; then
    log_warning "发现缺失文件: ${MISSING_FILES[*]}"
else
    log_success "所有必需文件都存在"
fi

echo ""

# 3. 快速构建检查
log_info "🔨 快速构建检查..."
if [[ -d "apps/webui" ]]; then
    cd "apps/webui"
    
    if [[ -d "node_modules" ]]; then
        echo "✅ 依赖已安装"
        
        # 尝试快速构建检查
        if npm run build --silent &> /dev/null; then
            log_success "构建成功"
        else
            log_error "构建失败"
        fi
    else
        log_warning "依赖未安装"
    fi
    
    cd "$PROJECT_ROOT"
else
    log_warning "webui目录不存在"
fi

echo ""

# 4. 快速配置检查
log_info "⚙️ 快速配置检查..."
if [[ -f "config/main_config.json" ]]; then
    if command -v jq &> /dev/null; then
        if jq empty "config/main_config.json" 2>/dev/null; then
            echo "✅ 主配置文件格式正确"
        else
            log_error "主配置文件格式错误"
        fi
    else
        echo "⚠️ 无法验证配置文件格式 (jq未安装)"
    fi
else
    log_warning "主配置文件不存在"
fi

if [[ -f "apps/webui/src/data-config.json" ]]; then
    if command -v jq &> /dev/null; then
        if jq empty "apps/webui/src/data-config.json" 2>/dev/null; then
            echo "✅ 前端配置文件格式正确"
        else
            log_error "前端配置文件格式错误"
        fi
    else
        echo "⚠️ 无法验证配置文件格式 (jq未安装)"
    fi
else
    log_warning "前端配置文件不存在"
fi

echo ""

# 5. 快速权限检查
log_info "🔐 快速权限检查..."
if [[ -f "start.sh" ]]; then
    if [[ -x "start.sh" ]]; then
        echo "✅ 启动脚本有执行权限"
    else
        log_warning "启动脚本无执行权限"
    fi
else
    log_error "启动脚本不存在"
fi

echo ""

# 6. 总结
echo "🎯 快速验证完成!"
echo "=================="

if [[ ${#MISSING_DIRS[@]} -eq 0 && ${#MISSING_FILES[@]} -eq 0 ]]; then
    log_success "项目状态: 良好 ✅"
else
    log_warning "项目状态: 需要关注 ⚠️"
    echo ""
    echo "📋 需要解决的问题:"
    if [[ ${#MISSING_DIRS[@]} -gt 0 ]]; then
        echo "  - 缺失目录: ${MISSING_DIRS[*]}"
    fi
    if [[ ${#MISSING_FILES[@]} -gt 0 ]]; then
        echo "  - 缺失文件: ${MISSING_FILES[*]}"
    fi
fi

echo ""
echo "💡 提示: 使用 './scripts/verification/verify_fix.sh' 进行完整验证"
echo "📝 日志位置: logs/verification/"
