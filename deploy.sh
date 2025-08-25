#!/bin/bash
# ===========================================
# 一键部署脚本：项目上传 GitHub + 接入 BugBot
# 适用环境：Mac / Linux / Windows(WSL/GitBash)
# 前提条件：
#   1. 已安装 Git
#   2. 已在本机配置 GitHub SSH 或 HTTPS 登录
#   3. 项目目录已存在（Cursor 打开的就是项目根目录）
# ===========================================

set -e  # 遇到错误直接退出

# === 配置区 ===
GITHUB_USER="你的GitHub用户名"
REPO_NAME="personal-website-v2"   # 默认仓库名
BRANCH_NAME="main"       # 或 master
BUGBOT_URL="https://github.com/marketplace/bugbot"

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

log_instruction() {
    echo -e "${CYAN}[INSTRUCTION]${NC} $1"
}

# 显示帮助信息
show_help() {
    cat << EOF
🚀 个人网站项目V2 - 一键部署脚本

用法: $0 [选项]

选项:
    --config, -c        配置GitHub信息
    --deploy, -d        执行完整部署
    --test-bugbot, -t   测试BugBot集成
    --help, -h          显示此帮助信息

示例:
    $0 --config              # 配置GitHub信息
    $0 --deploy              # 执行完整部署
    $0 --test-bugbot         # 测试BugBot集成

默认行为: 执行完整部署
EOF
}

# 配置GitHub信息
configure_github() {
    log_step "配置GitHub信息..."
    
    echo -e "${CYAN}请输入GitHub配置信息:${NC}"
    read -p "GitHub用户名: " github_user
    read -p "仓库名 (默认: personal-website-v2): " repo_name
    read -p "分支名 (默认: main): " branch_name
    
    # 设置默认值
    GITHUB_USER=${github_user}
    REPO_NAME=${repo_name:-personal-website-v2}
    BRANCH_NAME=${branch_name:-main}
    
    # 保存配置到文件
    cat > .github_config << EOF
GITHUB_USER="$GITHUB_USER"
REPO_NAME="$REPO_NAME"
BRANCH_NAME="$BRANCH_NAME"
EOF
    
    log_success "GitHub配置已保存到 .github_config"
}

# 加载GitHub配置
load_github_config() {
    if [ -f ".github_config" ]; then
        source .github_config
        log_info "已加载GitHub配置: $GITHUB_USER/$REPO_NAME ($BRANCH_NAME)"
    else
        log_warning "未找到GitHub配置文件，使用默认配置"
        log_info "请运行 $0 --config 进行配置"
    fi
}

# 检查Git状态
check_git_status() {
    log_step "检查Git状态..."
    
    if ! command -v git &> /dev/null; then
        log_error "Git 未安装，请先安装 Git"
        exit 1
    fi
    
    log_success "Git 已安装"
}

# 初始化Git仓库
init_git_repo() {
    log_step "初始化Git仓库..."
    
    if [ ! -d ".git" ]; then
        git init
        log_success "Git仓库已初始化"
    else
        log_info "Git仓库已存在"
    fi
    
    # 设置默认分支
    git checkout -B $BRANCH_NAME
    log_success "默认分支设置为: $BRANCH_NAME"
}

# 配置远程仓库
setup_remote_repo() {
    log_step "配置远程仓库..."
    
    if git remote | grep origin > /dev/null; then
        log_info "远程仓库已存在，跳过添加"
    else
        # 尝试SSH，如果失败则使用HTTPS
        if git remote add origin git@github.com:$GITHUB_USER/$REPO_NAME.git 2>/dev/null; then
            log_success "SSH远程仓库已添加"
        else
            git remote add origin https://github.com/$GITHUB_USER/$REPO_NAME.git
            log_success "HTTPS远程仓库已添加"
        fi
    fi
}

# 创建.gitignore文件
create_gitignore() {
    log_step "创建.gitignore文件..."
    
    if [ ! -f ".gitignore" ]; then
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
    else
        log_info ".gitignore文件已存在"
    fi
}

# 创建README文件
create_readme() {
    log_step "创建README文件..."
    
    if [ ! -f "README.md" ]; then
        cat > README.md << EOF
# 🚀 个人网站项目V2

## 📋 项目简介

天宫科技全屏视觉体验应用 - 重构版

## ✨ 主要特性

- 🎨 基于React + TypeScript构建
- 🎵 集成电台播放器系统
- 🌈 智能情绪驱动的可视化系统
- 🎮 GPU优化的WebGL渲染
- 🔄 基于事件总线的模块化架构

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn
- Git

### 安装依赖
\`\`\`bash
npm install
\`\`\`

### 启动开发服务器
\`\`\`bash
npm run dev
\`\`\`

### 构建生产版本
\`\`\`bash
npm run build
\`\`\`

## 📁 项目结构

\`\`\`
src/
├── components/     # React组件
├── core/          # 核心模块
├── events/        # 事件系统
├── types/         # 类型定义
└── utils/         # 工具函数
\`\`\`

## 🔧 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式系统**: Tailwind CSS
- **动画库**: Framer Motion
- **WebGL**: Three.js + 自定义着色器
- **状态管理**: 事件总线 + React Hooks

## 📊 性能特性

- GPU加速渲染
- 智能内存管理
- 自适应性能调整
- 实时性能监控

## 🌐 部署

项目支持多种部署方式：

- **静态托管**: Vercel, Netlify, GitHub Pages
- **容器化**: Docker
- **传统服务器**: Nginx + Node.js

## 📝 开发指南

详细的开发指南请参考 \`docs/\` 目录下的文档。

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

---

**作者**: 麻蛇 @ 天宫科技  
**版本**: v2.0.0  
**最后更新**: $(date '+%Y年%m月%d日')
EOF
        log_success "README.md已创建"
    else
        log_info "README.md已存在"
    fi
}

# 提交代码
commit_code() {
    log_step "提交代码到Git..."
    
    git add .
    
    # 检查是否有变更
    if git diff --cached --quiet; then
        log_warning "没有新的更改需要提交"
        return 0
    fi
    
    git commit -m "feat: 初次提交 - 个人网站项目V2部署"
    log_success "代码已提交"
}

# 推送到GitHub
push_to_github() {
    log_step "推送到GitHub..."
    
    # 检查远程仓库是否存在
    if ! git remote -v | grep -q "origin"; then
        log_error "远程仓库未配置，请先运行配置步骤"
        exit 1
    fi
    
    # 推送到GitHub
    git push -u origin $BRANCH_NAME
    log_success "代码已推送到GitHub: $GITHUB_USER/$REPO_NAME"
}

# 创建BugBot配置文件
create_bugbot_config() {
    log_step "创建BugBot配置文件..."
    
    mkdir -p .cursor
    
    cat > .cursor/BUGBOT.md << 'EOF'
# Project review guidelines for BugBot

## Security focus areas

- Validate user input in API endpoints
- Check for SQL injection vulnerabilities in database queries
- Ensure proper authentication on protected routes
- Validate file uploads and prevent path traversal attacks

## Architecture patterns

- Use dependency injection for services
- Follow the repository pattern for data access
- Implement proper error handling with custom error classes
- Use event-driven architecture for loose coupling

## React best practices

- Memory leaks in React components (check useEffect cleanup)
- Missing error boundaries in UI components
- Inconsistent naming conventions (use camelCase for functions)
- Proper state management with hooks
- Performance optimization with React.memo, useMemo, useCallback

## TypeScript guidelines

- Strict type checking enabled
- No implicit any types
- Proper interface definitions
- Generic type constraints
- Union and intersection types usage

## Performance considerations

- Bundle size optimization
- Lazy loading implementation
- Memory leak prevention
- WebGL performance optimization
- Event listener cleanup

## Common issues to watch for

- Unhandled promise rejections
- Missing error boundaries
- Inconsistent error handling
- Memory leaks in event listeners
- Performance bottlenecks in render loops
- Security vulnerabilities in user input

## Code quality standards

- Consistent code formatting
- Meaningful variable and function names
- Proper documentation and comments
- Unit test coverage
- Integration test coverage
EOF
    
    log_success "BugBot配置文件已创建: .cursor/BUGBOT.md"
}

# 测试BugBot集成
test_bugbot() {
    log_step "测试BugBot集成..."
    
    # 创建测试分支
    git checkout -b bugfix/test-bugbot
    
    # 创建测试文件
    cat > bugbot_test.js << 'EOF'
// BugBot 测试代码
// 这个文件用于测试BugBot的代码审查功能

function testFunction() {
    // 故意写一些有问题的代码来测试BugBot
    var x = 10;  // 使用var而不是const/let
    if (x == "10") {  // 使用==而不是===
        console.log("x is 10");
    }
    
    // 缺少错误处理
    fetch('/api/data').then(response => {
        return response.json();
    }).then(data => {
        console.log(data);
    });
    
    // 内存泄漏风险
    setInterval(() => {
        console.log("tick");
    }, 1000);
}

// 导出函数
module.exports = testFunction;
EOF
    
    # 提交测试代码
    git add bugbot_test.js
    git commit -m "test: 添加BugBot测试代码"
    
    # 推送测试分支
    git push origin bugfix/test-bugbot
    
    log_success "测试分支已创建并推送: bugfix/test-bugbot"
}

# 显示后续步骤
show_next_steps() {
    log_step "显示后续步骤..."
    
    echo
    log_instruction "🚀 部署完成！接下来请按以下步骤操作："
    echo
    
    log_instruction "步骤1: 安装BugBot"
    echo "   1. 打开浏览器访问: $BUGBOT_URL"
    echo "   2. 点击 'Install it for free'"
    echo "   3. 选择仓库: $GITHUB_USER/$REPO_NAME"
    echo "   4. 完成安装"
    echo
    
    log_instruction "步骤2: 创建Pull Request"
    echo "   1. 访问: https://github.com/$GITHUB_USER/$REPO_NAME"
    echo "   2. 你会看到测试分支 'bugfix/test-bugbot'"
    echo "   3. 点击 'Compare & pull request'"
    echo "   4. 创建PR，等待BugBot自动评论"
    echo
    
    log_instruction "步骤3: 测试BugBot功能"
    echo "   1. 在PR中，BugBot会自动运行代码审查"
    echo "   2. 查看BugBot的评论和建议"
    echo "   3. 使用 'Fix in Cursor' 链接直接在Cursor中修复问题"
    echo
    
    log_instruction "步骤4: 手动触发BugBot"
    echo "   在PR评论中输入以下任一命令："
    echo "   - cursor review"
    echo "   - bugbot run"
    echo "   - cursor run"
    echo
    
    log_success "🎉 项目已成功部署到GitHub，BugBot集成已配置！"
}

# 执行完整部署
execute_deployment() {
    log_step "开始执行完整部署..."
    
    # 加载配置
    load_github_config
    
    # 检查Git状态
    check_git_status
    
    # 初始化Git仓库
    init_git_repo
    
    # 配置远程仓库
    setup_remote_repo
    
    # 创建必要文件
    create_gitignore
    create_readme
    create_bugbot_config
    
    # 提交代码
    commit_code
    
    # 推送到GitHub
    push_to_github
    
    # 测试BugBot
    test_bugbot
    
    # 显示后续步骤
    show_next_steps
}

# 主函数
main() {
    log_info "🚀 个人网站项目V2 - 一键部署脚本"
    
    # 解析命令行参数
    case "${1:-}" in
        --config|-c)
            configure_github
            ;;
        --deploy|-d)
            execute_deployment
            ;;
        --test-bugbot|-t)
            load_github_config
            test_bugbot
            show_next_steps
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            # 默认执行完整部署
            execute_deployment
            ;;
    esac
}

# 执行主函数
main "$@"
