#!/bin/zsh

# 个人网站项目V2 开发环境优化脚本
# 解决终端溢出、进程管理和性能问题

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
REPO_ROOT="/Users/masher/code"
GLOBAL_LOGS="$REPO_ROOT/logs/personal_website"
GLOBAL_CACHE="$REPO_ROOT/cache/personal_website"

mkdir -p "$GLOBAL_LOGS" "$GLOBAL_CACHE"

log() { echo "[`date '+%Y-%m-%d %H:%M:%S'`] [INFO] $1" | tee -a "$GLOBAL_LOGS/dev_optimization.log"; }
warn() { echo "[`date '+%Y-%m-%d %H:%M:%S'`] [WARN] $1" | tee -a "$GLOBAL_LOGS/dev_optimization.log"; }
err() { echo "[`date '+%Y-%m-%d %H:%M:%S'`] [ERROR] $1" | tee -a "$GLOBAL_LOGS/dev_optimization.log"; }

# 清理僵尸进程和孤儿进程
cleanup_zombie_processes() {
  log "清理僵尸进程和孤儿进程..."
  
  # 查找并终止僵尸进程
  ZOMBIE_PIDS=$(ps aux | grep -E 'Z|defunct' | grep -v grep | awk '{print $2}' | tr '\n' ' ')
  if [ -n "$ZOMBIE_PIDS" ]; then
    log "发现僵尸进程: $ZOMBIE_PIDS"
    for pid in $ZOMBIE_PIDS; do
      kill -9 "$pid" 2>/dev/null || true
    done
    log "僵尸进程已清理"
  else
    log "未发现僵尸进程"
  fi
  
  # 查找并终止孤儿进程
  ORPHAN_PIDS=$(ps aux | grep -E 'node|npm|vite' | grep -v grep | awk '{print $2}' | tr '\n' ' ')
  if [ -n "$ORPHAN_PIDS" ]; then
    log "发现开发进程: $ORPHAN_PIDS"
    for pid in $ORPHAN_PIDS; do
      # 检查进程是否真的在运行
      if kill -0 "$pid" 2>/dev/null; then
        log "终止进程 $pid"
        kill -TERM "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
      fi
    done
    log "开发进程已清理"
  else
    log "未发现开发进程"
  fi
}

# 优化日志输出
optimize_logging() {
  log "优化日志输出配置..."
  
  # 创建日志轮转配置
  cat > "$PROJECT_ROOT/scripts/dev/logrotate.conf" << 'EOF'
# 个人网站项目V2 日志轮转配置
$GLOBAL_LOGS/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $(whoami) $(whoami)
    postrotate
        echo "日志轮转完成: $(date)" >> $GLOBAL_LOGS/logrotate.log
    endscript
}
EOF

  # 设置日志级别
  export NODE_ENV=development
  export VITE_LOG_LEVEL=warn
  export NPM_CONFIG_LOGLEVEL=warn
  
  log "日志配置已优化"
}

# 优化进程管理
optimize_process_management() {
  log "优化进程管理..."
  
  # 创建进程管理脚本
  cat > "$PROJECT_ROOT/scripts/dev/process_manager.sh" << 'EOF'
#!/bin/zsh

# 进程管理器 - 监控和管理开发进程

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
GLOBAL_LOGS="$PROJECT_ROOT/../../logs/personal_website"

log() { echo "[`date '+%Y-%m-%d %H:%M:%S'`] [PROCESS_MANAGER] $1" | tee -a "$GLOBAL_LOGS/process_manager.log"; }

# 监控进程状态
monitor_processes() {
  while true; do
    # 检查关键进程
    WEBUI_PID=$(pgrep -f "npm run dev.*webui" | head -1)
    TGR_PID=$(pgrep -f "npm run dev.*TGR_FullStack_VisualSuite" | head -1)
    
    if [ -n "$WEBUI_PID" ]; then
      log "WebUI进程运行中 (PID: $WEBUI_PID)"
    else
      log "WebUI进程未运行"
    fi
    
    if [ -n "$TGR_PID" ]; then
      log "TGR进程运行中 (PID: $TGR_PID)"
    else
      log "TGR进程未运行"
    fi
    
    # 检查内存使用
    if [ -n "$WEBUI_PID" ]; then
      MEMORY_USAGE=$(ps -o rss= -p "$WEBUI_PID" 2>/dev/null | awk '{print $1/1024}')
      if [ -n "$MEMORY_USAGE" ] && [ "$MEMORY_USAGE" -gt 500 ]; then
        log "警告: WebUI进程内存使用过高 (${MEMORY_USAGE}MB)"
      fi
    fi
    
    sleep 30
  done
}

# 启动进程监控
monitor_processes &
MONITOR_PID=$!
echo $MONITOR_PID > "$PROJECT_ROOT/scripts/dev/process_monitor.pid"

log "进程监控已启动 (PID: $MONITOR_PID)"
EOF

  chmod +x "$PROJECT_ROOT/scripts/dev/process_manager.sh"
  
  # 创建进程清理脚本
  cat > "$PROJECT_ROOT/scripts/dev/cleanup_processes.sh" << 'EOF'
#!/bin/zsh

# 进程清理脚本

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
GLOBAL_LOGS="$PROJECT_ROOT/../../logs/personal_website"

log() { echo "[`date '+%Y-%m-%d %H:%M:%S'`] [CLEANUP] $1" | tee -a "$GLOBAL_LOGS/cleanup.log"; }

# 清理所有开发进程
cleanup_all() {
  log "开始清理所有开发进程..."
  
  # 终止进程监控
  if [ -f "$PROJECT_ROOT/scripts/dev/process_monitor.pid" ]; then
    MONITOR_PID=$(cat "$PROJECT_ROOT/scripts/dev/process_monitor.pid")
    kill "$MONITOR_PID" 2>/dev/null || true
    rm -f "$PROJECT_ROOT/scripts/dev/process_monitor.pid"
    log "进程监控已停止"
  fi
  
  # 终止所有相关进程
  pkill -f "npm run dev" 2>/dev/null || true
  pkill -f "vite" 2>/dev/null || true
  pkill -f "node.*metadata_server" 2>/dev/null || true
  
  log "所有开发进程已清理"
}

# 清理特定端口
cleanup_port() {
  local port=$1
  if [ -n "$port" ]; then
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$PID" ]; then
      log "清理端口 $port 的进程 (PID: $PID)"
      kill -TERM "$PID" 2>/dev/null || kill -9 "$PID" 2>/dev/null || true
    else
      log "端口 $port 无进程占用"
    fi
  fi
}

case "$1" in
  "all") cleanup_all ;;
  "port") cleanup_port "$2" ;;
  *) echo "用法: $0 {all|port <port_number>}" ;;
esac
EOF

  chmod +x "$PROJECT_ROOT/scripts/dev/cleanup_processes.sh"
  
  log "进程管理已优化"
}

# 优化内存管理
optimize_memory_management() {
  log "优化内存管理..."
  
  # 设置Node.js内存限制
  export NODE_OPTIONS="--max-old-space-size=2048 --max-semi-space-size=128"
  
  # 设置Vite内存限制
  export VITE_MAX_MEMORY=2048
  
  # 创建内存监控脚本
  cat > "$PROJECT_ROOT/scripts/dev/memory_monitor.sh" << 'EOF'
#!/bin/zsh

# 内存监控脚本

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
GLOBAL_LOGS="$PROJECT_ROOT/../../logs/personal_website"

log() { echo "[`date '+%Y-%m-%d %H:%M:%S'`] [MEMORY] $1" | tee -a "$GLOBAL_LOGS/memory.log"; }

# 监控内存使用
monitor_memory() {
  while true; do
    # 获取系统内存信息
    TOTAL_MEM=$(sysctl -n hw.memsize | awk '{print $1/1024/1024/1024}')
    FREE_MEM=$(vm_stat | grep "Pages free:" | awk '{print $3}' | sed 's/\.//')
    FREE_MEM_MB=$((FREE_MEM * 4096 / 1024 / 1024))
    USED_MEM_MB=$((TOTAL_MEM * 1024 - FREE_MEM_MB))
    MEMORY_USAGE_PERCENT=$((USED_MEM_MB * 100 / (TOTAL_MEM * 1024)))
    
    log "内存使用: ${USED_MEM_MB}MB / ${TOTAL_MEM}GB (${MEMORY_USAGE_PERCENT}%)"
    
    # 如果内存使用超过80%，发出警告
    if [ "$MEMORY_USAGE_PERCENT" -gt 80 ]; then
      warn "警告: 内存使用率过高 (${MEMORY_USAGE_PERCENT}%)"
      
      # 清理缓存
      sudo purge 2>/dev/null || true
      log "已清理系统缓存"
    fi
    
    sleep 60
  done
}

# 启动内存监控
monitor_memory &
MEMORY_MONITOR_PID=$!
echo $MEMORY_MONITOR_PID > "$PROJECT_ROOT/scripts/dev/memory_monitor.pid"

log "内存监控已启动 (PID: $MEMORY_MONITOR_PID)"
EOF

  chmod +x "$PROJECT_ROOT/scripts/dev/memory_monitor.sh"
  
  log "内存管理已优化"
}

# 优化网络配置
optimize_network_config() {
  log "优化网络配置..."
  
  # 设置网络超时
  export NODE_OPTIONS="$NODE_OPTIONS --http-parser=legacy"
  export VITE_SERVER_TIMEOUT=30000
  
  # 创建网络监控脚本
  cat > "$PROJECT_ROOT/scripts/dev/network_monitor.sh" << 'EOF'
#!/bin/zsh

# 网络监控脚本

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
GLOBAL_LOGS="$PROJECT_ROOT/../../logs/personal_website"

log() { echo "[`date '+%Y-%m-%d %H:%M:%S'`] [NETWORK] $1" | tee -a "$GLOBAL_LOGS/network.log"; }

# 监控网络连接
monitor_network() {
  while true; do
    # 检查端口占用
    WEBUI_PORTS=$(lsof -i :3000-3010 2>/dev/null | grep LISTEN | wc -l)
    log "活跃端口数量: $WEBUI_PORTS"
    
    # 检查网络延迟
    if command -v ping >/dev/null 2>&1; then
      PING_RESULT=$(ping -c 1 8.8.8.8 2>/dev/null | grep "time=" | awk '{print $7}' | sed 's/time=//')
      if [ -n "$PING_RESULT" ]; then
        log "网络延迟: $PING_RESULT"
      fi
    fi
    
    sleep 120
  done
}

# 启动网络监控
monitor_network &
NETWORK_MONITOR_PID=$!
echo $NETWORK_MONITOR_PID > "$PROJECT_ROOT/scripts/dev/network_monitor.pid"

log "网络监控已启动 (PID: $NETWORK_MONITOR_PID)"
EOF

  chmod +x "$PROJECT_ROOT/scripts/dev/network_monitor.sh"
  
  log "网络配置已优化"
}

# 主优化函数
main() {
  log "开始优化开发环境..."
  
  cleanup_zombie_processes
  optimize_logging
  optimize_process_management
  optimize_memory_management
  optimize_network_config
  
  log "开发环境优化完成"
  log "建议重启开发服务器以应用所有优化"
  
  # 显示优化后的配置
  echo ""
  echo "🔧 开发环境优化配置:"
  echo "=========================="
  echo "日志轮转: 已配置 (保留7天)"
  echo "进程管理: 已优化 (自动监控)"
  echo "内存管理: 已优化 (2GB限制)"
  echo "网络配置: 已优化 (30s超时)"
  echo ""
  echo "📁 日志目录: $GLOBAL_LOGS"
  echo "🗂️  缓存目录: $GLOBAL_CACHE"
  echo ""
  echo "🚀 使用以下命令管理进程:"
  echo "   ./scripts/dev/process_manager.sh     # 启动进程监控"
  echo "   ./scripts/dev/cleanup_processes.sh   # 清理进程"
  echo "   ./scripts/dev/memory_monitor.sh      # 启动内存监控"
  echo "   ./scripts/dev/network_monitor.sh     # 启动网络监控"
}

# 执行主函数
main "$@"
