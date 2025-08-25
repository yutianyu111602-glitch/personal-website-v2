#!/usr/bin/env bash
set -euo pipefail

# 🐛 BugBot 自动流水线
# 功能：自动创建触发分支与PR → 触发BugBot → 轮询等待评论 → 下载与汇总结果

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; PURPLE='\033[0;35m'; NC='\033[0m'

log()  { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()   { echo -e "${GREEN}[OK]${NC}   $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERR]${NC}  $*"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 进入目标仓库（参数可指定路径，否则取当前git仓库根）
TARGET_DIR="${1:-}"
if [ -z "$TARGET_DIR" ]; then
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    TARGET_DIR="$(git rev-parse --show-toplevel)"
  else
    err "未检测到Git仓库，请在仓库内运行或传参：bugbot_auto_pipeline.sh <repo_path>"
    exit 1
  fi
fi

cd "$TARGET_DIR"
REPO_ROOT="$(pwd)"
log "仓库路径: $REPO_ROOT"

if ! command -v gh >/dev/null 2>&1; then
  err "未安装 GitHub CLI (gh)"
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  err "未安装 jq"
  exit 1
fi

# 确认远程
if ! git ls-remote --get-url origin >/dev/null 2>&1; then
  err "未检测到 origin 远程，请先设置远程到GitHub"
  exit 1
fi

# 选择主分支
MAIN_BRANCH="main"
if git show-ref --verify --quiet refs/heads/main; then
  MAIN_BRANCH="main"
elif git show-ref --verify --quiet refs/heads/master; then
  MAIN_BRANCH="master"
fi

log "切换主分支并拉取"
git checkout "$MAIN_BRANCH" || true
git pull --ff-only || true

# 创建分支并添加触发文件
TS="$(date +%Y%m%d%H%M%S)"
BRANCH="bugbot/auto-${TS}"
log "创建分支: $BRANCH"
git checkout -b "$BRANCH"

TEST_DIR="bugbot_test_examples"

CHANGES=0
if [ -d "$TEST_DIR" ]; then
  log "发现测试示例目录，纳入提交"
  git add "$TEST_DIR" || true
  CHANGES=1
else
  # 如果没有示例，写入一个极简触发文件
  cat > "bugbot_trigger_example.py" << 'PY'
# 用于触发BugBot审查的简单文件
def div(a, b):
    return a / b  # b=0 时将异常，此处用于触发建议
PY
  git add bugbot_trigger_example.py
  CHANGES=1
fi

# 如果仍无更改，则触发空变更文件
if [ "$CHANGES" -eq 0 ]; then
  echo "BugBot auto trigger ${TS}" > "bugbot_auto_touch_${TS}.md"
  git add "bugbot_auto_touch_${TS}.md"
fi

git commit -m "chore(bugbot): auto trigger at ${TS}" || true

log "推送分支"
git push -u origin "$BRANCH"

# 创建PR
log "创建PR"
if gh pr create --fill --base "$MAIN_BRANCH" --head "$BRANCH" >/dev/null 2>&1; then
  ok "PR已创建"
else
  warn "PR可能已存在，继续"
fi

# 获取PR信息
PR_JSON="$(gh pr view --json number,url 2>/dev/null || echo '{}')"
PR_NUMBER="$(echo "$PR_JSON" | jq -r '.number // empty')"
PR_URL="$(echo "$PR_JSON" | jq -r '.url // empty')"
if [ -z "$PR_NUMBER" ]; then
  err "无法获取PR编号"
  exit 1
fi
ok "PR #$PR_NUMBER: $PR_URL"

# 触发BugBot（双保险）
gh pr comment "$PR_NUMBER" -b "bugbot run" >/dev/null 2>&1 || true
gh pr comment "$PR_NUMBER" -b "@cursor review" >/dev/null 2>&1 || true
ok "已发送触发评论"

# 输出目录
OUT_DIR="$WORKSPACE_ROOT/outputs/$(basename "$REPO_ROOT")/bugbot_analysis/${TS}"
mkdir -p "$OUT_DIR"

# 轮询等待评论（更快：自适应间隔，总时长~10分钟）
log "开始轮询等待BugBot评论（自适应轮询，最长约10分钟）"

# 先抓取一次，避免漏捕已生成的结果
gh pr view "$PR_NUMBER" --json number,title,body,author,comments,reviews,reviewRequests,files,commits,url,state > "$OUT_DIR/pr1_full.json" || true

FOUND=0
has_feedback() {
  local f="$1"
  # 评论或审查中出现来自 cursor/cursor[bot] 的内容，即判定成功
  jq -e '
    ( .comments[]? | select((.author.login|ascii_downcase)=="cursor" or (.author.login|ascii_downcase)=="cursor[bot]") )
    or
    ( .reviews[]?  | select((.author.login|ascii_downcase)=="cursor" or (.author.login|ascii_downcase)=="cursor[bot]") )
  ' "$f" >/dev/null 2>&1
}

if has_feedback "$OUT_DIR/pr1_full.json"; then
  FOUND=1
  ok "检测到BugBot评论（首次抓取）"
fi

ATTEMPT=0
while [ "$FOUND" -eq 0 ] && [ "$ATTEMPT" -lt 120 ]; do
  ATTEMPT=$((ATTEMPT+1))
  gh pr view "$PR_NUMBER" --json number,title,body,author,comments,reviews,reviewRequests,files,commits,url,state > "$OUT_DIR/pr1_full.json" || true

  if has_feedback "$OUT_DIR/pr1_full.json"; then
    FOUND=1
    ok "检测到BugBot评论（轮询第$ATTEMPT次）"
    break
  fi

  # 自适应间隔：前60次每3秒，其后每5秒，超过90次每10秒
  if   [ "$ATTEMPT" -le 60 ]; then sleep 3
  elif [ "$ATTEMPT" -le 90 ]; then sleep 5
  else                              sleep 10
  fi
done

if [ "$FOUND" -eq 0 ]; then
  warn "未检测到BugBot评论（可能已完成但被快速合并），已保存当前快照；将继续生成摘要"
fi

# 生成Markdown摘要
python3 "$SCRIPT_DIR/collect_bugbot_pr.py" "$OUT_DIR" >/dev/null 2>&1 || true

# 追加到项目报告文件
REPORT_MD="$REPO_ROOT/GPT_EXPERTS_ANALYSIS_AND_BUGBOT_REPORT.md"
{
  echo "\n## BugBot 自动分析 (${TS})"
  echo "- PR: ${PR_URL}"
  if [ -f "$OUT_DIR/analysis.md" ]; then
    echo "\n<details><summary>展开查看本次摘要</summary>"
    echo ""
    sed '1,5!b' "$OUT_DIR/analysis.md" >/dev/null 2>&1 || true
    cat "$OUT_DIR/analysis.md"
    echo ""; echo "</details>"
  else
    echo "(摘要生成失败，已保存JSON于 $OUT_DIR/pr1_full.json)"
  fi
} >> "$REPORT_MD" || true

ok "完成。输出目录: $OUT_DIR"
echo "$OUT_DIR"


