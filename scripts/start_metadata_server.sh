#!/usr/bin/env bash
set -euo pipefail

PORT=${1:-3500}
TERMUSIC_GATEWAY=${TERMUSIC_GATEWAY:-http://127.0.0.1:7533}
AUDIO_GATEWAY=${AUDIO_GATEWAY:-http://127.0.0.1:18766}
MOCK=${MOCK:-false}

export METADATA_PORT="$PORT"
export TERMUSIC_GATEWAY
export AUDIO_GATEWAY
if [[ "$MOCK" == "true" ]]; then
  export TERMUSIC_MOCK=true
  export AUDIO_MOCK=true
fi

echo "[start] METADATA_PORT=$METADATA_PORT TERMUSIC_GATEWAY=$TERMUSIC_GATEWAY AUDIO_GATEWAY=$AUDIO_GATEWAY MOCK=$MOCK"
node "$(dirname "$0")/../server/metadata_server.js"


