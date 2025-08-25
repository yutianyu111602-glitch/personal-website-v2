#!/bin/zsh

# 个人网站项目V2 一键启动（含自动update、构建、部署）

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="/Users/masher/code"
GLOBAL_OUTPUTS="$REPO_ROOT/outputs/personal_website"
GLOBAL_LOGS="$REPO_ROOT/logs/personal_website"
GLOBAL_CACHE="$REPO_ROOT/cache/personal_website"

mkdir -p "$GLOBAL_OUTPUTS" "$GLOBAL_LOGS" "$GLOBAL_CACHE"

log() { echo "[`date '+%Y-%m-%d %H:%M:%S'`] [INFO] $1" | tee -a "$GLOBAL_LOGS/start.log"; }
warn() { echo "[`date '+%Y-%m-%d %H:%M:%S'`] [WARN] $1" | tee -a "$GLOBAL_LOGS/start.log"; }
err() { echo "[`date '+%Y-%m-%d %H:%M:%S'`] [ERROR] $1" | tee -a "$GLOBAL_LOGS/start.log"; }

auto_update() {
  log "执行自动update..."
  if command -v git >/dev/null 2>&1 && [ -d "$PROJECT_ROOT/.git" ]; then
    git -C "$PROJECT_ROOT" pull --rebase --autostash || warn "git pull 失败，忽略继续"
  fi
  if command -v node >/dev/null 2>&1; then
    pushd "$PROJECT_ROOT/apps/webui" >/dev/null || true
    if [ -f package.json ]; then
      if command -v npm >/dev/null 2>&1; then
        npm ci || npm install || warn "依赖安装失败，继续"
      fi
    fi
    popd >/dev/null || true
  fi
  if [ ! -f "$PROJECT_ROOT/.env.local" ] && [ -f "$PROJECT_ROOT/config/environment/env.example" ]; then
    cp "$PROJECT_ROOT/config/environment/env.example" "$PROJECT_ROOT/.env.local"
    log "已生成 .env.local"
  fi
  echo "[`date '+%Y-%m-%d %H:%M:%S'`] start: auto update executed" >> "$REPO_ROOT/GPT_EXPERTS_ANALYSIS_AND_BUGBOT_REPORT.md" 2>/dev/null || true
}

build_project() {
  log "开始构建项目..."
  TARGET_DIR="$PROJECT_ROOT/apps/webui"
  
  if [ -d "$TARGET_DIR" ]; then
    pushd "$TARGET_DIR" >/dev/null
    if command -v npm >/dev/null 2>&1; then
      npm run build
      BUILD_OUT_DIR="build"
      TS="$(date '+%Y%m%d_%H%M%S')"
      DEST="$GLOBAL_OUTPUTS/builds/$TS"
      mkdir -p "$DEST"
      if [ -d "$BUILD_OUT_DIR" ]; then
        cp -Rp "$BUILD_OUT_DIR"/* "$DEST/"
        log "构建产物已归档到 $DEST"
      else
        warn "未找到构建目录 $BUILD_OUT_DIR"
      fi
    else
      warn "未检测到npm，跳过构建"
    fi
    popd >/dev/null
  else
    warn "未找到前端目录，跳过构建"
  fi
  
  echo "[`date '+%Y-%m-%d %H:%M:%S'`] build: completed" >> "$REPO_ROOT/GPT_EXPERTS_ANALYSIS_AND_BUGBOT_REPORT.md" 2>/dev/null || true
}

deploy_project() {
  log "开始部署项目..."
  LATEST_BUILD=$(ls -dt "$GLOBAL_OUTPUTS/builds"/* 2>/dev/null | head -n 1)
  if [ -z "$LATEST_BUILD" ]; then
    warn "未发现构建产物，先执行构建..."
    build_project
    LATEST_BUILD=$(ls -dt "$GLOBAL_OUTPUTS/builds"/* 2>/dev/null | head -n 1)
  fi
  
  if [ -n "$LATEST_BUILD" ]; then
    DEPLOY_DIR="$GLOBAL_OUTPUTS/current"
    rm -rf "$DEPLOY_DIR"
    mkdir -p "$DEPLOY_DIR"
    cp -Rp "$LATEST_BUILD"/* "$DEPLOY_DIR/"
    log "已部署到 $DEPLOY_DIR"
    
    # 启动静态服务器
    if command -v npx >/dev/null 2>&1; then
      PORT="$PORT" npx --yes serve "$DEPLOY_DIR" -l "$PORT" >/dev/null 2>&1 &
      log "已通过 serve 启动静态服务 :$PORT"
    fi
    
    # 健康检查
    (
      chmod +x "$PROJECT_ROOT/scripts/utils/healthcheck_webui.sh" 2>/dev/null || true
      PORT="$PORT" METADATA_PORT="$METADATA_PORT" "$PROJECT_ROOT/scripts/utils/healthcheck_webui.sh" || true
    ) &
  else
    err "构建失败，无法部署"
    exit 1
  fi
  
  echo "[`date '+%Y-%m-%d %H:%M:%S'`] deploy: completed" >> "$REPO_ROOT/GPT_EXPERTS_ANALYSIS_AND_BUGBOT_REPORT.md" 2>/dev/null || true
}

start_metadata_server() {
  log "启动元数据服务..."
  METADATA_DIR="$PROJECT_ROOT/apps/server"
  
  if [ -d "$METADATA_DIR" ]; then
    pushd "$METADATA_DIR" >/dev/null
    if [ -f "metadata_server.js" ]; then
      PORT="$METADATA_PORT" nohup node metadata_server.js > "$GLOBAL_LOGS/metadata.log" 2>&1 &
      METADATA_PID=$!
      echo $METADATA_PID > "$GLOBAL_LOGS/metadata.pid"
      log "元数据服务已启动 (pid=$METADATA_PID, port=$METADATA_PORT)"
    else
      warn "未找到 metadata_server.js"
    fi
    popd >/dev/null
  else
    warn "未找到服务器目录，跳过元数据服务启动"
  fi
}

start_webui() {
  log "启动webui（默认端口 3000）..."
  WEBUI_DIR="$PROJECT_ROOT/apps/webui"
  
  if [ -d "$WEBUI_DIR" ]; then
    pushd "$WEBUI_DIR" >/dev/null
    if [ -f "package.json" ]; then
      log "启动 webui 开发服务器..."
      PORT="$PORT" nohup npm run dev > "$GLOBAL_LOGS/webui.log" 2>&1 &
      WEBUI_PID=$!
      echo $WEBUI_PID > "$GLOBAL_LOGS/webui.pid"
      log "webui已启动 (pid=$WEBUI_PID)"
    else
      warn "未找到 package.json"
    fi
    popd >/dev/null
  else
    warn "未找到webui目录，跳过前端启动"
  fi
}

show_menu() {
  cat << EOF

🚀 个人网站项目V2 - 一键启动菜单
=====================================

请选择操作:

1) 启动开发环境 (webui + 元数据服务)
2) 仅启动 webui
3) 仅启动元数据服务
4) 构建项目
5) 部署项目
6) 构建并部署
7) 显示状态
0) 退出

请输入选项 [0-7]: 
EOF
}

show_status() {
  log "=== 服务状态 ==="
  
  # 检查 webui 状态
  if [ -f "$GLOBAL_LOGS/webui.pid" ]; then
    WEBUI_PID=$(cat "$GLOBAL_LOGS/webui.pid")
    if kill -0 "$WEBUI_PID" 2>/dev/null; then
      log "✅ webui 运行中 (PID: $WEBUI_PID)"
    else
      log "❌ webui 已停止 (PID: $WEBUI_PID)"
      rm -f "$GLOBAL_LOGS/webui.pid"
    fi
  else
    log "❌ webui 未启动"
  fi
  
  # 检查元数据服务状态
  if [ -f "$GLOBAL_LOGS/metadata.pid" ]; then
    METADATA_PID=$(cat "$GLOBAL_LOGS/metadata.pid")
    if kill -0 "$METADATA_PID" 2>/dev/null; then
      log "✅ 元数据服务运行中 (PID: $METADATA_PID)"
    else
      log "❌ 元数据服务已停止 (PID: $METADATA_PID)"
      rm -f "$GLOBAL_LOGS/metadata.pid"
    fi
  else
    log "❌ 元数据服务未启动"
  fi
  
  # 检查端口占用
  if command -v lsof >/dev/null 2>&1; then
    WEBUI_PORT=$(lsof -i :$PORT 2>/dev/null | grep LISTEN | wc -l)
    METADATA_PORT_CHECK=$(lsof -i :$METADATA_PORT 2>/dev/null | grep LISTEN | wc -l)
    
    if [ "$WEBUI_PORT" -gt 0 ]; then
      log "✅ 端口 $PORT 已被占用 (webui)"
    else
      log "❌ 端口 $PORT 未被占用"
    fi
    
    if [ "$METADATA_PORT_CHECK" -gt 0 ]; then
      log "✅ 端口 $METADATA_PORT 已被占用 (元数据服务)"
    else
      log "❌ 端口 $METADATA_PORT 未被占用"
    fi
  fi
  
  log "=== 日志文件 ==="
  log "webui: $GLOBAL_LOGS/webui.log"
  log "元数据: $GLOBAL_LOGS/metadata.log"
  log "启动: $GLOBAL_LOGS/start.log"
}

main() {
  # 加载环境变量
  if [ -f "$PROJECT_ROOT/.env.local" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env.local" | xargs)
  fi
  
  # 设置默认端口
  export PORT=${PORT:-3000}
  export METADATA_PORT=${METADATA_PORT:-3500}
  
  log "项目根目录: $PROJECT_ROOT"
  log "端口配置: webui=$PORT, metadata=$METADATA_PORT"
  
  # 执行自动更新
  auto_update
  
  # 处理命令行参数
  case "${1:-}" in
    --dev|-d)
      start_metadata_server
      start_webui
      ;;
    --webui|-w)
      start_webui
      ;;
    --metadata|-m)
      start_metadata_server
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
    --status|-s)
      show_status
      ;;
    --help|-h)
      cat << EOF
用法: $0 [选项]

选项:
  --dev, -d          启动开发环境 (webui + 元数据服务)
  --webui, -w        仅启动 webui
  --metadata, -m     仅启动元数据服务
  --build, -b        构建项目
  --deploy, -D       部署项目
  --build-deploy, -B 构建并部署
  --status, -s       显示服务状态
  --help, -h         显示此帮助信息

默认行为: 显示菜单选择
EOF
      exit 0
      ;;
    "")
      # 无参数时显示菜单
      while true; do
        show_menu
        read -r choice
        case $choice in
          1)
            start_metadata_server
            start_webui
            break
            ;;
          2)
            start_webui
            break
            ;;
          3)
            start_metadata_server
            break
            ;;
          4)
            build_project
            break
            ;;
          5)
            deploy_project
            break
            ;;
          6)
            build_project
            deploy_project
            break
            ;;
          7)
            show_status
            ;;
          0)
            log "退出程序"
            exit 0
            ;;
          *)
            warn "无效选项，请重新选择"
            ;;
        esac
      done
      ;;
    *)
      err "未知选项: $1"
      exit 1
      ;;
  esac
  
  log "操作完成！"
  log "访问地址:"
  log "  webui: http://localhost:$PORT"
  log "  元数据: http://localhost:$METADATA_PORT"
}

# 执行主函数
main "$@"


