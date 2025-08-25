@echo off
chcp 65001 >nul
echo 🚀 天宫空间站 - 项目打包开始...

set TEMP_DIR=temp_space_station
set OUTPUT_ZIP=space-station-coordinates.zip

echo 📁 准备打包环境...

:: 清理之前的文件
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
if exist "%OUTPUT_ZIP%" del /q "%OUTPUT_ZIP%"

:: 创建临时目录
mkdir "%TEMP_DIR%"

echo 📂 复制项目文件...

:: 复制根文件
copy "App.tsx" "%TEMP_DIR%\" >nul
copy "index.html" "%TEMP_DIR%\" >nul
copy "package.json" "%TEMP_DIR%\" >nul
copy "tsconfig.json" "%TEMP_DIR%\" >nul
copy "vite.config.ts" "%TEMP_DIR%\" >nul
copy "tailwind.config.js" "%TEMP_DIR%\" >nul
copy "postcss.config.js" "%TEMP_DIR%\" >nul
copy "eslint.config.js" "%TEMP_DIR%\" >nul
copy ".gitignore" "%TEMP_DIR%\" >nul
copy "README.md" "%TEMP_DIR%\" >nul
copy "DEPLOYMENT.md" "%TEMP_DIR%\" >nul
copy "Attributions.md" "%TEMP_DIR%\" >nul

:: 复制目录
xcopy "LICENSE" "%TEMP_DIR%\LICENSE\" /E /I /Q >nul
xcopy "src" "%TEMP_DIR%\src\" /E /I /Q >nul
xcopy "styles" "%TEMP_DIR%\styles\" /E /I /Q >nul
xcopy "components" "%TEMP_DIR%\components\" /E /I /Q >nul

echo 📦 创建ZIP文件...

:: 使用PowerShell创建ZIP文件
powershell -command "Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath '%OUTPUT_ZIP%' -Force"

if %errorlevel% equ 0 (
    echo ✨ 打包完成！
    echo 📦 文件位置: %CD%\%OUTPUT_ZIP%
) else (
    echo ❌ 打包失败，请检查PowerShell是否可用
    echo 💡 您可以手动将 %TEMP_DIR% 目录压缩为ZIP文件
    goto end
)

:: 清理临时目录
rmdir /s /q "%TEMP_DIR%"

echo.
echo 🎯 快速启动命令:
echo   1. 解压ZIP文件
echo   2. 在项目目录运行: npm install
echo   3. 启动开发服务器: npm run dev
echo.
echo 🌌 享受您的太空之旅！

:end
pause