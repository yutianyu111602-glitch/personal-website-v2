#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
LOG_DIR="$ROOT_DIR/logs/personal_website/ci"
mkdir -p "$LOG_DIR"

PORT=${PORT:-3000}
METADATA_PORT=${METADATA_PORT:-3500}
PLAYLIST_NAME=${PLAYLIST_NAME:-我的歌单21}

echo "[ci] start metadata_server"
(
  PORT=$PORT METADATA_PORT=$METADATA_PORT node "$ROOT_DIR/server/metadata_server.js" &
) >/dev/null 2>&1 || true

sleep 1

echo "[ci] health checks"
set +e
curl -fsS "http://localhost:$METADATA_PORT/api/health" >/dev/null || exit 1
curl -fsS --get --data-urlencode "name=$PLAYLIST_NAME" "http://localhost:$METADATA_PORT/api/playlist_resolved" >/dev/null || exit 1
curl -fsS "http://localhost:$METADATA_PORT/api/autodj/status" >/dev/null || exit 1
set -e

echo "[ci] OK"


