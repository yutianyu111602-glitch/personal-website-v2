#!/bin/zsh

# webui 健康检查脚本
# - 轮询 http://localhost:$PORT 是否可访问
# - 同时检查元数据服务 /api/health
# - 输出日志到全局 logs/personal_website/health/ 目录

set -e

REPO_ROOT="/Users/masher/code"
LOG_DIR="$REPO_ROOT/logs/personal_website/health"
mkdir -p "$LOG_DIR"

PORT=${PORT:-3000}
METADATA_PORT=${METADATA_PORT:-3500}
PLAYLIST_NAME=${PLAYLIST_NAME:-我的歌单21}
TIMEOUT=${TIMEOUT:-40}
CHECK_GATEWAYS=${CHECK_GATEWAYS:-true}
RETRIES=${RETRIES:-3}
SLEEP_BETWEEN=${SLEEP_BETWEEN:-1}

log() { echo "[`date '+%Y-%m-%d %H:%M:%S'`] [HEALTH] $1" | tee -a "$LOG_DIR/healthcheck.log"; }

for i in $(seq 1 $TIMEOUT); do
  if nc -z localhost "$PORT" 2>/dev/null; then
    # 检查首页
    if curl -fsS "http://localhost:$PORT" >/dev/null 2>&1; then
      # 检查元数据健康
      if curl -fsS "http://localhost:$METADATA_PORT/api/health" >/dev/null 2>&1; then
        # 覆盖新增接口：/api/autodj/status 与 /api/playlist_resolved
        curl -fsS --get --data-urlencode "name=$PLAYLIST_NAME" "http://localhost:$METADATA_PORT/api/playlist_resolved" >/dev/null 2>&1 && \
        curl -fsS "http://localhost:$METADATA_PORT/api/autodj/status" >/dev/null 2>&1 && {
          if [ "$CHECK_GATEWAYS" = "true" ]; then
            # 非致命检查：termusic 与 audio 代理连通性（失败仅记录，不阻塞 READY）
            ok_t=false; for r in $(seq 1 $RETRIES); do curl -fsS "http://localhost:$METADATA_PORT/api/termusic/services" >/dev/null 2>&1 && ok_t=true && break || sleep $SLEEP_BETWEEN; done; $ok_t && log "termusic proxy OK" || log "termusic proxy not available"
            ok_a=false; for r in $(seq 1 $RETRIES); do curl -fsS "http://localhost:$METADATA_PORT/api/audio/peaks?src=test&duration=1" >/dev/null 2>&1 && ok_a=true && break || sleep $SLEEP_BETWEEN; done; $ok_a && log "audio proxy OK" || log "audio proxy not available"
          fi
          log "READY webui(:$PORT) + metadata(:$METADATA_PORT) + autodj/status + playlist_resolved($PLAYLIST_NAME)"
          exit 0
        }
      fi
      log "webui(:$PORT) OK，metadata(:$METADATA_PORT) 暂未就绪，继续等待..."
    fi
  fi
  sleep 1
  if [ $i -eq $TIMEOUT ]; then
    log "TIMEOUT: webui(:$PORT) 或 metadata(:$METADATA_PORT) 未就绪"
    exit 1
  fi
done
