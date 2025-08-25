Param(
  [int]$Port = 3500,
  [string]$TermusicGateway = "http://127.0.0.1:7533",
  [string]$AudioGateway = "http://127.0.0.1:18766",
  [switch]$Mock
)

# PowerShell 启动脚本：统一设置环境变量并启动 metadata_server.js
$env:METADATA_PORT = "$Port"
$env:TERMUSIC_GATEWAY = "$TermusicGateway"
$env:AUDIO_GATEWAY = "$AudioGateway"
if ($Mock) {
  $env:TERMUSIC_MOCK = "true"
  $env:AUDIO_MOCK = "true"
}

Write-Host "[start] METADATA_PORT=$($env:METADATA_PORT) TERMUSIC_GATEWAY=$($env:TERMUSIC_GATEWAY) AUDIO_GATEWAY=$($env:AUDIO_GATEWAY) MOCK=$Mock"
node "$PSScriptRoot/../server/metadata_server.js"


