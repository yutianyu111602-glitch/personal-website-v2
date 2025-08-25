#!/usr/bin/env bash
set -euo pipefail
echo "安装 LiquidMetal Visual Suite 到 ./src/vis ..."
mkdir -p ./src/vis
cp -f LiquidMetalConductor.ts ./src/vis/ || true
cp -f AudioReactive.ts ./src/vis/ || true
cp -f TechnoRandomizer.ts ./src/vis/ || true
cp -f index.example.ts ./src/vis/ || true
cp -f glsl-blends.template.glsl ./src/vis/ || true
cp -f glsl-generators.template.glsl ./src/vis/ || true
cp -f README.md ./src/vis/ || true
echo "✅ 完成。"
