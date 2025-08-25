#!/bin/bash

# 天宫空间站项目打包脚本
echo "🚀 天宫空间站 - 项目打包开始..."

# 创建临时目录
TEMP_DIR="temp_space_station"
OUTPUT_ZIP="space-station-coordinates.zip"

# 清理之前的文件
rm -rf "$TEMP_DIR"
rm -f "$OUTPUT_ZIP"

# 创建项目结构
mkdir -p "$TEMP_DIR"

echo "📁 复制项目文件..."

# 复制根文件
cp App.tsx "$TEMP_DIR/"
cp index.html "$TEMP_DIR/"
cp package.json "$TEMP_DIR/"
cp tsconfig.json "$TEMP_DIR/"
cp vite.config.ts "$TEMP_DIR/"
cp tailwind.config.js "$TEMP_DIR/"
cp postcss.config.js "$TEMP_DIR/"
cp eslint.config.js "$TEMP_DIR/"
cp .gitignore "$TEMP_DIR/"
cp README.md "$TEMP_DIR/"
cp DEPLOYMENT.md "$TEMP_DIR/"
cp Attributions.md "$TEMP_DIR/"

# 复制LICENSE目录
cp -r LICENSE "$TEMP_DIR/"

# 复制src目录
cp -r src "$TEMP_DIR/"

# 复制styles目录
cp -r styles "$TEMP_DIR/"

# 复制components目录
cp -r components "$TEMP_DIR/"

echo "📦 创建ZIP文件..."

# 创建ZIP文件
if command -v zip &> /dev/null; then
    cd "$TEMP_DIR"
    zip -r "../$OUTPUT_ZIP" . -x "*.DS_Store" "node_modules/*" "dist/*" ".git/*"
    cd ..
elif command -v 7z &> /dev/null; then
    7z a "$OUTPUT_ZIP" "./$TEMP_DIR/*"
else
    echo "❌ 错误: 未找到zip或7z命令"
    echo "请手动将 $TEMP_DIR 目录压缩为ZIP文件"
    exit 1
fi

# 清理临时目录
rm -rf "$TEMP_DIR"

echo "✨ 打包完成！"
echo "📦 文件位置: ./$OUTPUT_ZIP"
echo ""
echo "🎯 快速启动命令:"
echo "  1. 解压: unzip $OUTPUT_ZIP"
echo "  2. 安装: npm install"
echo "  3. 运行: npm run dev"
echo ""
echo "🌌 享受您的太空之旅！"