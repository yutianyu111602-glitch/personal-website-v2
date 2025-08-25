#!/bin/bash

# 🚀 个人网站项目V2 - 项目整理脚本
# 版本: v1.0.0
# 创建时间: 2025年8月25日
# 目标: 整理项目结构，准备GitHub上传

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

# 显示帮助信息
show_help() {
    cat << EOF
🚀 个人网站项目V2 - 项目整理脚本

用法: $0 [选项]

选项:
    --clean, -c        清理项目文件
    --organize, -o     整理项目结构
    --backup, -b       创建备份
    --prepare-git, -g  准备Git上传
    --all, -a          执行所有操作
    --help, -h         显示此帮助信息

示例:
    $0 --clean              # 清理项目文件
    $0 --organize           # 整理项目结构
    $0 --prepare-git        # 准备Git上传
    $0 --all                # 执行所有操作

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
    
    if ! command -v git &> /dev/null; then
        log_error "Git 未安装，请先安装 Git"
        exit 1
    fi
    
    log_success "系统依赖检查通过"
}

# 创建备份
create_backup() {
    log_step "创建项目备份..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_dir="backups/backup_${timestamp}_before_cleanup"
    
    mkdir -p "$backup_dir"
    
    # 备份核心文件
    log_info "备份核心文件..."
    cp -r apps "$backup_dir/"
    cp -r config "$backup_dir/"
    cp -r modules "$backup_dir/"
    cp -r scripts "$backup_dir/"
    cp -r docs "$backup_dir/"
    cp *.md "$backup_dir/"
    cp *.sh "$backup_dir/"
    cp *.ini "$backup_dir/"
    
    # 备份配置文件
    if [ -f "package.json" ]; then
        cp package.json "$backup_dir/"
    fi
    
    if [ -f "package-lock.json" ]; then
        cp package-lock.json "$backup_dir/"
    fi
    
    log_success "备份已创建: $backup_dir"
}

# 清理项目文件
clean_project() {
    log_step "清理项目文件..."
    
    # 清理构建文件
    log_info "清理构建文件..."
    find . -name "build" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # 清理临时文件
    log_info "清理临时文件..."
    find . -name "*.tmp" -delete 2>/dev/null || true
    find . -name "*.log" -delete 2>/dev/null || true
    find . -name ".DS_Store" -delete 2>/dev/null || true
    find . -name "Thumbs.db" -delete 2>/dev/null || true
    
    # 清理缓存文件
    log_info "清理缓存文件..."
    find . -name ".cache" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "cache" -type d -exec rm -rf {} + 2>/dev/null || true
    
    log_success "项目清理完成"
}

# 整理项目结构
organize_project() {
    log_step "整理项目结构..."
    
    # 创建标准目录结构
    log_info "创建标准目录结构..."
    mkdir -p {src,dist,tests,docs,scripts,config,backups,logs,outputs}
    
    # 移动文件到合适位置
    log_info "整理文件结构..."
    
    # 移动源代码
    if [ -d "apps/webui/src" ]; then
        mkdir -p src
        cp -r apps/webui/src/* src/ 2>/dev/null || true
    fi
    
    # 移动配置文件
    if [ -d "config" ]; then
        cp -r config/* config/ 2>/dev/null || true
    fi
    
    # 移动脚本文件
    if [ -d "scripts" ]; then
        cp -r scripts/* scripts/ 2>/dev/null || true
    fi
    
    # 移动文档文件
    find . -maxdepth 1 -name "*.md" -exec mv {} docs/ \; 2>/dev/null || true
    
    log_success "项目结构整理完成"
}

# 准备Git上传
prepare_git() {
    log_step "准备Git上传..."
    
    # 检查Git状态
    if [ ! -d ".git" ]; then
        log_info "初始化Git仓库..."
        git init
        log_success "Git仓库已初始化"
    fi
    
    # 创建.gitignore文件
    log_info "创建.gitignore文件..."
    cat > .gitignore << 'EOF'
# 依赖
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 构建输出
build/
dist/
out/

# 环境变量
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 日志文件
*.log
logs/

# 缓存
.cache/
cache/

# 临时文件
*.tmp
*.temp

# 系统文件
.DS_Store
Thumbs.db

# IDE文件
.vscode/
.idea/
*.swp
*.swo

# 备份文件
backups/
*.backup

# 测试覆盖率
coverage/

# 其他
*.pid
*.seed
*.pid.lock
EOF
    
    log_success ".gitignore文件已创建"
    
    # 添加文件到Git
    log_info "添加文件到Git..."
    git add .
    
    # 检查是否有变更
    if git diff --cached --quiet; then
        log_warning "没有文件变更需要提交"
    else
        log_info "提交文件变更..."
        git commit -m "feat: 项目整理完成 - $(date '+%Y-%m-%d %H:%M:%S')"
        log_success "文件已提交到Git"
    fi
}

# 生成项目报告
generate_report() {
    log_step "生成项目报告..."
    
    local report_file="docs/PROJECT_CLEANUP_REPORT.md"
    
    cat > "$report_file" << EOF
# 📋 项目整理报告

## 📅 整理时间
$(date '+%Y年%m月%d日 %H:%M:%S')

## 🎯 整理目标
- 清理冗余文件
- 整理项目结构
- 准备GitHub上传
- 优化代码质量

## 📊 整理统计

### 文件统计
$(find . -type f | wc -l) 个文件
$(find . -type d | wc -l) 个目录

### 代码文件统计
$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | wc -l) 个代码文件
$(find . -name "*.md" | wc -l) 个文档文件
$(find . -name "*.json" | wc -l) 个配置文件

### 清理结果
- ✅ 构建文件已清理
- ✅ 临时文件已清理
- ✅ 缓存文件已清理
- ✅ 项目结构已整理
- ✅ Git仓库已准备

## 🚀 下一步行动
1. 使用BugBot分析代码
2. 修复发现的bug
3. 上传到GitHub
4. 配置自动备份

---
**报告生成时间**: $(date '+%Y-%m-%d %H:%M:%S')
**生成工具**: project_cleanup.sh
EOF
    
    log_success "项目报告已生成: $report_file"
}

# 主函数
main() {
    log_info "🚀 开始项目整理..."
    
    # 检查依赖
    check_dependencies
    
    # 解析命令行参数
    case "${1:-}" in
        --clean|-c)
            clean_project
            ;;
        --organize|-o)
            organize_project
            ;;
        --backup|-b)
            create_backup
            ;;
        --prepare-git|-g)
            prepare_git
            ;;
        --all|-a)
            create_backup
            clean_project
            organize_project
            prepare_git
            generate_report
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            # 显示菜单
            echo -e "${CYAN}请选择要执行的操作:${NC}"
            echo "1) 清理项目文件"
            echo "2) 整理项目结构"
            echo "3) 创建备份"
            echo "4) 准备Git上传"
            echo "5) 执行所有操作"
            echo "6) 显示帮助"
            echo "0) 退出"
            
            read -p "请输入选项 (0-6): " choice
            
            case $choice in
                1) clean_project ;;
                2) organize_project ;;
                3) create_backup ;;
                4) prepare_git ;;
                5)
                    create_backup
                    clean_project
                    organize_project
                    prepare_git
                    generate_report
                    ;;
                6) show_help ;;
                0) exit 0 ;;
                *) log_error "无效选项" && exit 1 ;;
            esac
            ;;
    esac
    
    log_success "🎉 项目整理完成！"
}

# 执行主函数
main "$@"
