#!/usr/bin/env bash
set -euo pipefail

# 批量移除 UI 包导入中的版本后缀（仅代码层），不改 package.json
# 示例：import X from 'lucide-react@0.487.0' → import X from 'lucide-react'

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
TARGET_DIR="$ROOT_DIR/webui/src"

echo "[codemod] target dir: $TARGET_DIR"

# 处理 .ts/.tsx 文件
find "$TARGET_DIR" -type f \( -name '*.ts' -o -name '*.tsx' \) | while read -r f; do
  tmp="$f.tmp.__codemod"
  # 常见UI包清单（可扩展）
  sed -E \
    -e "s/'lucide-react@[0-9.]+/'lucide-react/g" \
    -e "s/'sonner@[0-9.]+/'sonner/g" \
    -e "s/'recharts@[0-9.]+/'recharts/g" \
    -e "s/'react-resizable-panels@[0-9.]+/'react-resizable-panels/g" \
    -e "s/'react-hook-form@[0-9.]+/'react-hook-form/g" \
    -e "s/'react-day-picker@[0-9.]+/'react-day-picker/g" \
    -e "s/'next-themes@[0-9.]+/'next-themes/g" \
    -e "s/'input-otp@[0-9.]+/'input-otp/g" \
    -e "s/'embla-carousel-react@[0-9.]+/'embla-carousel-react/g" \
    -e "s/'cmdk@[0-9.]+/'cmdk/g" \
    -e "s/'class-variance-authority@[0-9.]+/'class-variance-authority/g" \
    -e "s/'(@radix-ui\/react-[a-z-]+)@[0-9.]+/'\\1/g" "$f" > "$tmp" || true
  if ! cmp -s "$f" "$tmp"; then
    mv "$tmp" "$f"
    echo "[codemod] updated: $f"
  else
    rm -f "$tmp"
  fi
done

echo "[codemod] completed"


