Param()

# PowerShell 启动联网专家会议：避免前缀写法导致崩溃
$Script = Join-Path $PSScriptRoot 'orchestrator.py'
if (!(Test-Path $Script)) {
  Write-Error "orchestrator.py 不存在: $Script"
  exit 1
}

# 直接调用，Python 从 .env.local 读取密钥（脚本内部支持多路径）
Write-Host "[experts] 启动联网专家会议 (后台)"
Start-Process -FilePath python -ArgumentList @($Script) -WindowStyle Hidden
Write-Host "[experts] 已启动。纪要输出至 logs/personal_website/experts_meetings/<ts>/meeting.md"


