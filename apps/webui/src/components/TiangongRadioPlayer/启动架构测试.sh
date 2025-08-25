#!/bin/bash

# 电台模块化架构测试启动脚本
echo "🧩 开始电台模块化架构测试..."

# 检查当前目录
CURRENT_DIR=$(pwd)
echo "📍 当前目录: $CURRENT_DIR"

# 检查测试文件是否存在
TEST_FILES=(
    "architecture_test.html"
    "architecture_test.ts"
    "types.ts"
    "stateManager.ts"
    "eventManager.ts"
    "windowManager.ts"
    "uiComponents.tsx"
    "index.tsx"
)

echo "🔍 检查测试文件..."
for file in "${TEST_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 缺失"
    fi
done

# 检查代码行数
echo -e "\n📏 检查代码行数..."
for file in "${TEST_FILES[@]}"; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file" 2>/dev/null || echo "0")
        echo "📄 $file: ${lines}行"
    fi
done

# 启动测试页面
echo -e "\n🚀 启动架构测试页面..."
if command -v open &> /dev/null; then
    # macOS
    open "architecture_test.html"
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "architecture_test.html"
elif command -v start &> /dev/null; then
    # Windows
    start "architecture_test.html"
else
    echo "⚠️  无法自动打开浏览器，请手动打开 architecture_test.html"
fi

echo -e "\n🎉 架构测试已启动！"
echo "📋 请在浏览器中查看测试结果"
echo "🔍 可以运行以下命令查看详细文件信息："
echo "   ls -la"
echo "   wc -l *.ts *.tsx *.html"
