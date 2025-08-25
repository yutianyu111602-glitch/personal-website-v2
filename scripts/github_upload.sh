#!/bin/bash

# 🚀 个人网站项目V2 - GitHub上传脚本
# 版本: v1.0.0
# 创建时间: 2025年8月25日
# 目标: 上传项目到GitHub并配置自动备份

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
🚀 个人网站项目V2 - GitHub上传脚本

用法: $0 [选项]

选项:
    --init, -i          初始化GitHub仓库
    --upload, -u        上传到GitHub
    --backup, -b        配置自动备份
    --all, -a           执行所有操作
    --help, -h          显示此帮助信息

示例:
    $0 --init              # 初始化GitHub仓库
    $0 --upload            # 上传到GitHub
    $0 --backup            # 配置自动备份
    $0 --all               # 执行所有操作

默认行为: 显示菜单选择
EOF
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    if ! command -v git &> /dev/null; then
        log_error "Git 未安装，请先安装 Git"
        exit 1
    fi
    
    if ! command -v gh &> /dev/null; then
        log_warning "GitHub CLI 未安装，将使用Git命令"
        USE_GH_CLI=false
    else
        USE_GH_CLI=true
        log_success "GitHub CLI 已安装"
    fi
    
    log_success "系统依赖检查通过"
}

# 检查Git状态
check_git_status() {
    log_step "检查Git状态..."
    
    if [ ! -d ".git" ]; then
        log_error "Git仓库未初始化，请先运行 --init"
        exit 1
    fi
    
    # 检查是否有未提交的变更
    if ! git diff --quiet || ! git diff --cached --quiet; then
        log_warning "检测到未提交的变更，建议先提交"
        read -p "是否继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "Git状态检查通过"
}

# 初始化GitHub仓库
init_github_repo() {
    log_step "初始化GitHub仓库..."
    
    # 检查是否已有远程仓库
    if git remote -v | grep -q "origin"; then
        log_info "远程仓库已存在"
        return 0
    fi
    
    # 获取GitHub用户名和仓库名
    read -p "请输入GitHub用户名: " github_username
    read -p "请输入仓库名 (默认: personal-website-v2): " repo_name
    repo_name=${repo_name:-personal-website-v2}
    
    # 创建README文件
    if [ ! -f "README.md" ]; then
        log_info "创建README.md文件..."
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
    fi
    
    # 添加远程仓库
    log_info "添加远程仓库..."
    git remote add origin "https://github.com/${github_username}/${repo_name}.git"
    
    # 创建main分支
    git branch -M main
    
    # 提交初始文件
    git add .
    git commit -m "feat: 初始项目提交 - $(date '+%Y-%m-%d %H:%M:%S')"
    
    log_success "GitHub仓库初始化完成"
}

# 上传到GitHub
upload_to_github() {
    log_step "上传到GitHub..."
    
    # 检查远程仓库
    if ! git remote -v | grep -q "origin"; then
        log_error "远程仓库未配置，请先运行 --init"
        exit 1
    fi
    
    # 推送到GitHub
    log_info "推送到GitHub..."
    git push -u origin main
    
    log_success "项目已成功上传到GitHub"
}

# 配置自动备份
setup_auto_backup() {
    log_step "配置自动备份..."
    
    # 创建GitHub Actions工作流
    log_info "创建GitHub Actions自动备份工作流..."
    mkdir -p .github/workflows
    
    cat > .github/workflows/auto-backup.yml << 'EOF'
name: 🚀 自动备份

on:
  schedule:
    # 每天凌晨2点执行备份
    - cron: '0 2 * * *'
  workflow_dispatch:
    # 手动触发

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
    - name: 🚀 检出代码
      uses: actions/checkout@v4
      
    - name: 📦 设置Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: 🔧 安装依赖
      run: npm ci
      
    - name: 🧪 运行测试
      run: npm test
      
    - name: 🏗️ 构建项目
      run: npm run build
      
    - name: 📊 生成备份报告
      run: |
        echo "备份时间: $(date)" > backup-report.txt
        echo "构建状态: 成功" >> backup-report.txt
        echo "测试状态: 通过" >> backup-report.txt
        
    - name: 💾 上传备份报告
      uses: actions/upload-artifact@v4
      with:
        name: backup-report
        path: backup-report.txt
        
    - name: 📧 发送通知
      if: always()
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#backup-notifications'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
EOF
    
    # 创建本地备份脚本
    log_info "创建本地自动备份脚本..."
    cat > scripts/auto_backup.sh << 'EOF'
#!/bin/bash

# 🚀 自动备份脚本
# 每天自动备份项目文件

BACKUP_DIR="backups/auto_backup_$(date +%Y%m%d)"
LOG_FILE="logs/backup_$(date +%Y%m%d).log"

# 创建备份目录
mkdir -p "$BACKUP_DIR"
mkdir -p logs

# 记录备份开始
echo "$(date): 开始自动备份..." | tee -a "$LOG_FILE"

# 备份核心文件
echo "$(date): 备份核心文件..." | tee -a "$LOG_FILE"
cp -r src "$BACKUP_DIR/" 2>/dev/null || echo "src目录备份失败" | tee -a "$LOG_FILE"
cp -r config "$BACKUP_DIR/" 2>/dev/null || echo "config目录备份失败" | tee -a "$LOG_FILE"
cp -r scripts "$BACKUP_DIR/" 2>/dev/null || echo "scripts目录备份失败" | tee -a "$LOG_FILE"
cp -r docs "$BACKUP_DIR/" 2>/dev/null || echo "docs目录备份失败" | tee -a "$LOG_FILE"

# 备份配置文件
cp *.json "$BACKUP_DIR/" 2>/dev/null || echo "配置文件备份失败" | tee -a "$LOG_FILE"
cp *.md "$BACKUP_DIR/" 2>/dev/null || echo "文档文件备份失败" | tee -a "$LOG_FILE"

# 记录备份完成
echo "$(date): 自动备份完成，备份目录: $BACKUP_DIR" | tee -a "$LOG_FILE"

# 清理旧备份（保留最近7天）
find backups/auto_backup_* -maxdepth 0 -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true
echo "$(date): 已清理7天前的旧备份" | tee -a "$LOG_FILE"
EOF
    
    chmod +x scripts/auto_backup.sh
    
    # 添加到crontab（如果支持）
    if command -v crontab &> /dev/null; then
        log_info "配置crontab自动备份..."
        (crontab -l 2>/dev/null; echo "0 2 * * * cd $PROJECT_ROOT && ./scripts/auto_backup.sh") | crontab -
        log_success "crontab自动备份已配置"
    else
        log_warning "crontab不可用，请手动配置自动备份"
    fi
    
    log_success "自动备份配置完成"
}

# 创建部署脚本
create_deployment_scripts() {
    log_step "创建部署脚本..."
    
    # 创建Vercel部署配置
    log_info "创建Vercel部署配置..."
    cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
EOF
    
    # 创建Docker配置
    log_info "创建Docker配置..."
    cat > Dockerfile << 'EOF'
# 多阶段构建
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建文件
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF
    
    # 创建nginx配置
    cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    sendfile        on;
    keepalive_timeout  65;
    
    server {
        listen       80;
        server_name  localhost;
        
        location / {
            root   /usr/share/nginx/html;
            index  index.html index.htm;
            try_files $uri $uri/ /index.html;
        }
        
        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # API代理
        location /api/ {
            proxy_pass http://localhost:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
EOF
    
    # 创建docker-compose配置
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  webui:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    
  # 可以添加其他服务
  # metadata:
  #   image: node:18-alpine
  #   ports:
  #     - "3500:3500"
  #   volumes:
  #     - ./metadata:/app
  #   working_dir: /app
  #   command: npm start
EOF
    
    log_success "部署脚本创建完成"
}

# 生成上传报告
generate_upload_report() {
    log_step "生成上传报告..."
    
    local report_file="docs/GITHUB_UPLOAD_REPORT.md"
    
    cat > "$report_file" << EOF
# 🚀 GitHub上传报告

## 📅 上传时间
$(date '+%Y年%m月%d日 %H:%M:%S')

## 🎯 上传目标
- 项目代码上传到GitHub
- 配置自动备份系统
- 创建部署脚本

## 📊 上传统计

### 文件统计
$(find . -type f | wc -l) 个文件
$(find . -type d | wc -l) 个目录

### 代码文件统计
$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | wc -l) 个代码文件
$(find . -name "*.md" | wc -l) 个文档文件
$(find . -name "*.json" | wc -l) 个配置文件

## ✅ 完成的任务

### 1. GitHub仓库初始化
- [x] 创建README.md
- [x] 配置远程仓库
- [x] 初始化main分支

### 2. 自动备份配置
- [x] 创建GitHub Actions工作流
- [x] 配置本地自动备份脚本
- [x] 设置crontab定时任务

### 3. 部署脚本创建
- [x] Vercel部署配置
- [x] Docker配置
- [x] Nginx配置
- [x] Docker Compose配置

## 🔗 相关链接

- **GitHub仓库**: [个人网站项目V2](https://github.com/[用户名]/personal-website-v2)
- **GitHub Actions**: [自动备份工作流](https://github.com/[用户名]/personal-website-v2/actions)
- **部署状态**: [Vercel部署](https://[项目名].vercel.app)

## 🚀 下一步行动

1. [ ] 配置GitHub Pages
2. [ ] 设置域名和SSL
3. [ ] 配置CDN加速
4. [ ] 设置监控和告警
5. [ ] 配置CI/CD流水线

## 📝 注意事项

- 确保.env文件已添加到.gitignore
- 定期检查自动备份状态
- 监控GitHub Actions执行情况
- 及时更新依赖包版本

---
**报告生成时间**: $(date '+%Y-%m-%d %H:%M:%S')
**生成工具**: github_upload.sh
EOF
    
    log_success "上传报告已生成: $report_file"
}

# 主函数
main() {
    log_info "🚀 开始GitHub上传流程..."
    
    # 检查依赖
    check_dependencies
    
    # 解析命令行参数
    case "${1:-}" in
        --init|-i)
            init_github_repo
            ;;
        --upload|-u)
            check_git_status
            upload_to_github
            ;;
        --backup|-b)
            setup_auto_backup
            ;;
        --all|-a)
            init_github_repo
            check_git_status
            upload_to_github
            setup_auto_backup
            create_deployment_scripts
            generate_upload_report
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            # 显示菜单
            echo -e "${CYAN}请选择要执行的操作:${NC}"
            echo "1) 初始化GitHub仓库"
            echo "2) 上传到GitHub"
            echo "3) 配置自动备份"
            echo "4) 创建部署脚本"
            echo "5) 执行所有操作"
            echo "6) 显示帮助"
            echo "0) 退出"
            
            read -p "请输入选项 (0-6): " choice
            
            case $choice in
                1) init_github_repo ;;
                2) 
                    check_git_status
                    upload_to_github 
                    ;;
                3) setup_auto_backup ;;
                4) create_deployment_scripts ;;
                5)
                    init_github_repo
                    check_git_status
                    upload_to_github
                    setup_auto_backup
                    create_deployment_scripts
                    generate_upload_report
                    ;;
                6) show_help ;;
                0) exit 0 ;;
                *) log_error "无效选项" && exit 1 ;;
            esac
            ;;
    esac
    
    log_success "🎉 GitHub上传流程完成！"
}

# 执行主函数
main "$@"
