#!/bin/bash

# 专家团队会议启动脚本（模块化版本 V2.0.0）

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 脚本信息
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  专家团队会议启动脚本 V2.0.0${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 检查Python环境
echo -e "${YELLOW}检查Python环境...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}错误：未找到python3命令${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo -e "${GREEN}Python版本: ${PYTHON_VERSION}${NC}"

# 检查项目目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
REPO_ROOT="$(dirname "$PROJECT_ROOT")"

echo -e "${YELLOW}项目路径检查...${NC}"
echo "脚本目录: $SCRIPT_DIR"
echo "项目根目录: $PROJECT_ROOT"
echo "仓库根目录: $REPO_ROOT"

# 检查必要的文件
echo -e "${YELLOW}检查必要文件...${NC}"
REPORT_FILE="$PROJECT_ROOT/GPT_EXPERTS_ANALYSIS_AND_BUGBOT_REPORT.md"
if [ ! -f "$REPORT_FILE" ]; then
    echo -e "${RED}错误：未找到项目报告文件: $REPORT_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}项目报告文件: $REPORT_FILE${NC}"

# 检查配置文件
ENV_FILES=(
    "$PROJECT_ROOT/.env.local"
    "$REPO_ROOT/.env.local"
    "$REPO_ROOT/.secrets/ai_providers.env"
)

echo -e "${YELLOW}检查配置文件...${NC}"
CONFIG_FOUND=false
for env_file in "${ENV_FILES[@]}"; do
    if [ -f "$env_file" ]; then
        echo -e "${GREEN}找到配置文件: $env_file${NC}"
        CONFIG_FOUND=true
    fi
done

if [ "$CONFIG_FOUND" = false ]; then
    echo -e "${YELLOW}警告：未找到配置文件，将使用默认配置${NC}"
fi

# 检查模块文件
echo -e "${YELLOW}检查模块文件...${NC}"
MODULE_FILES=(
    "config.py"
    "http_client.py"
    "document_processor.py"
    "expert_collaboration.py"
    "main_orchestrator.py"
    "__init__.py"
)

for module_file in "${MODULE_FILES[@]}"; do
    if [ -f "$SCRIPT_DIR/$module_file" ]; then
        echo -e "${GREEN}✓ $module_file${NC}"
    else
        echo -e "${RED}✗ $module_file${NC}"
        echo -e "${RED}错误：模块文件缺失，请检查模块结构${NC}"
        exit 1
    fi
done

# 创建日志目录
LOG_DIR="$REPO_ROOT/logs/personal_website/experts_meetings/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$LOG_DIR"
echo -e "${GREEN}日志目录: $LOG_DIR${NC}"

# 显示配置信息
echo ""
echo -e "${BLUE}配置信息:${NC}"
echo "项目根目录: $PROJECT_ROOT"
echo "仓库根目录: $REPO_ROOT"
echo "日志目录: $LOG_DIR"
echo "报告文件: $REPORT_FILE"

# 启动专家会议
echo ""
echo -e "${BLUE}启动专家团队会议...${NC}"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 切换到脚本目录
cd "$SCRIPT_DIR"

# 运行Python脚本（开启流式回显）
export MEETING_ECHO_STREAM=true
if python3 -c "import sys; sys.path.insert(0, '.'); from main_orchestrator import run_meeting; run_meeting()"; then
    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}  专家团队会议完成！${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo -e "${GREEN}会议纪要: $LOG_DIR/meeting.md${NC}"
    echo -e "${GREEN}详细报告: $LOG_DIR/detailed_report.json${NC}"
    echo -e "${GREEN}密钥快照: $LOG_DIR/secrets_masked.txt${NC}"
    echo ""
    echo -e "${BLUE}可以查看以下文件了解会议详情：${NC}"
    echo "1. meeting.md - 会议纪要"
    echo "2. detailed_report.json - 详细报告"
    echo "3. raw_*_part*.json - 原始响应数据"
    echo "4. secrets_masked.txt - 密钥使用快照"
else
    echo ""
    echo -e "${RED}================================${NC}"
    echo -e "${RED}  专家团队会议失败！${NC}"
    echo -e "${RED}================================${NC}"
    echo ""
    echo -e "${YELLOW}请检查：${NC}"
    echo "1. API密钥配置是否正确"
    echo "2. 网络连接是否正常"
    echo "3. Python环境是否正常"
    echo "4. 查看错误日志: $LOG_DIR/error_report.md"
    echo ""
    exit 1
fi


