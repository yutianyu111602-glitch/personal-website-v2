#!/usr/bin/env bash
set -euo pipefail

# 🐛 全局BugBot测试脚本
# 自动检测code工作区中的所有项目并执行BugBot测试

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$SCRIPT_DIR/global_bugbot_config.json"
LOGS_DIR="$WORKSPACE_ROOT/logs/bugbot_global"

# 确保日志目录存在
mkdir -p "$LOGS_DIR"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOGS_DIR/global_test.log" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOGS_DIR/global_test.log" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOGS_DIR/global_test.log" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOGS_DIR/global_test.log" >&2
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1" | tee -a "$LOGS_DIR/global_test.log" >&2
}

# 显示帮助信息
show_help() {
    cat << EOF
🐛 全局BugBot测试脚本

用法: $0 [选项]

选项:
    --detect-only, -d    仅检测项目，不执行测试
    --force, -f          强制测试所有项目
    --config, -c         指定配置文件路径
    --help, -h           显示此帮助信息

示例:
    $0                     # 运行智能测试（根据频率）
    $0 --detect-only      # 仅检测项目
    $0 --force            # 强制测试所有项目
    $0 --config custom.json # 使用自定义配置

默认行为: 智能测试（根据项目优先级和测试频率）
EOF
}

# 检查依赖
check_dependencies() {
    local missing_deps=()
    
    if ! command -v git >/dev/null 2>&1; then
        missing_deps+=("git")
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        missing_deps+=("jq")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "缺少必要的依赖: ${missing_deps[*]}"
        log_info "请安装缺少的依赖后重试"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 加载配置
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        log_info "加载配置文件: $CONFIG_FILE"
        CONFIG=$(cat "$CONFIG_FILE")
    else
        log_warning "配置文件不存在，使用默认配置"
        CONFIG='{"auto_execution":{"enabled":true},"projects":{}}'
    fi
}

# 检测项目
detect_projects() {
    log_step "开始自动检测项目..."
    
    # 以JSON数组形式收集结果，便于后续jq解析
    local projects_json="["
    local first=true
    local project_count=0
    
    # 遍历工作区目录
    for item in "$WORKSPACE_ROOT"/*; do
        if [ -d "$item" ] && [[ ! "$(basename "$item")" =~ ^\. ]]; then
            local project_name=$(basename "$item")
            local project_path="$item"
            
            # 检查是否为项目
            if is_project "$project_path"; then
                local project_info=$(analyze_project "$project_name" "$project_path")
                if [ -n "$project_info" ]; then
                    if [ "$first" = true ]; then
                        projects_json+="$project_info"
                        first=false
                    else
                        projects_json+=",$project_info"
                    fi
                    ((project_count++))
                    log_info "发现项目: $project_name"
                fi
            fi
        fi
    done
    
    log_success "共发现 $project_count 个项目"
    echo "$projects_json]"
}

# 判断是否为项目
is_project() {
    local project_path="$1"
    
    # 检查项目指示器
    local indicators=("package.json" "requirements.txt" "Cargo.toml" "pom.xml" "build.gradle" ".git" "README.md" "src" "app")
    
    for indicator in "${indicators[@]}"; do
        if [ -e "$project_path/$indicator" ]; then
            return 0
        fi
    done
    
    return 1
}

# 分析项目
analyze_project() {
    local project_name="$1"
    local project_path="$2"
    
    # 确定项目类型
    local project_type="unknown"
    if [ -f "$project_path/package.json" ]; then
        project_type="nodejs"
    elif [ -f "$project_path/requirements.txt" ]; then
        project_type="python"
    elif [ -f "$project_path/Cargo.toml" ]; then
        project_type="rust"
    elif [ -f "$project_path/pom.xml" ]; then
        project_type="java-maven"
    elif [ -f "$project_path/build.gradle" ]; then
        project_type="java-gradle"
    elif [ -d "$project_path/.git" ]; then
        project_type="git-repo"
    fi
    
    # 检查Git状态
    local git_info=$(get_git_info "$project_path")
    
    # 确定优先级
    local priority=$(determine_priority "$project_name")
    
    # 确定测试频率
    local test_frequency=$(determine_test_frequency "$priority")
    
    # 构建项目信息JSON
    cat << EOF
{
    "name": "$project_name",
    "path": "$(cd "$WORKSPACE_ROOT" && realpath --relative-to="." "$project_path" 2>/dev/null || echo "$project_name")",
    "type": "$project_type",
    "enabled": true,
    "priority": "$priority",
    "test_frequency": "$test_frequency",
    "last_test": null,
    "git_info": $git_info
}
EOF
}

# 获取Git信息
get_git_info() {
    local project_path="$1"
    
    if [ -d "$project_path/.git" ]; then
        cd "$project_path"
        if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
            local remote_url=$(git remote get-url origin 2>/dev/null || echo "null")
            cat << EOF
{
    "is_git_repo": true,
    "remote_url": "$remote_url"
}
EOF
        else
            echo '{"is_git_repo": false, "remote_url": null}'
        fi
    else
        echo '{"is_git_repo": false, "remote_url": null}'
    fi
}

# 确定项目优先级
determine_priority() {
    local project_name="$1"
    local name_lower=$(echo "$project_name" | tr '[:upper:]' '[:lower:]')
    
    # 高优先级关键词
    local high_priority_keywords=("个人网站" "webui" "main" "core" "src")
    # 中优先级关键词
    local medium_priority_keywords=("test" "demo" "example" "tool")
    
    for keyword in "${high_priority_keywords[@]}"; do
        if [[ "$name_lower" == *"$keyword"* ]]; then
            echo "high"
            return 0
        fi
    done
    
    for keyword in "${medium_priority_keywords[@]}"; do
        if [[ "$name_lower" == *"$keyword"* ]]; then
            echo "medium"
            return 0
        fi
    done
    
    echo "low"
}

# 确定测试频率
determine_test_frequency() {
    local priority="$1"
    
    case "$priority" in
        "high")
            echo "weekly"
            ;;
        "medium")
            echo "bi-weekly"
            ;;
        "low")
            echo "monthly"
            ;;
        *)
            echo "monthly"
            ;;
    esac
}

# 判断项目是否应该测试
should_test_project() {
    local project_info="$1"
    local force="$2"
    
    if [ "$force" = "true" ]; then
        return 0
    fi
    
    # 这里可以添加更复杂的逻辑来判断是否需要测试
    # 比如检查最后测试时间、项目修改状态等
    return 0
}

# 创建测试文件
create_test_files() {
    local project_path="$1"
    local test_dir="$project_path/bugbot_test_examples"
    
    log_info "为项目创建测试文件: $test_dir"
    
    mkdir -p "$test_dir"
    
    # 复制测试示例文件
    local source_test_dir="$WORKSPACE_ROOT/程序集_Programs/个人网站项目V2/bugbot_test_examples"
    
    if [ -d "$source_test_dir" ]; then
        for test_file in "$source_test_dir"/*; do
            if [ -f "$test_file" ]; then
                local dest_file="$test_dir/$(basename "$test_file")"
                if [ ! -f "$dest_file" ]; then
                    cp "$test_file" "$dest_file"
                    log_info "创建测试文件: $dest_file"
                fi
            fi
        done
        return 0
    else
        log_warning "源测试目录不存在: $source_test_dir"
        return 1
    fi
}

# 运行项目测试
run_project_test() {
    local project_name="$1"
    local project_path="$2"
    
    log_step "开始测试项目: $project_name"
    
    # 检查是否为Git仓库
    if [ ! -d "$project_path/.git" ]; then
        log_warning "项目 $project_name 不是Git仓库，跳过"
        return 1
    fi
    
    # 创建测试文件
    if ! create_test_files "$project_path"; then
        log_error "为项目 $project_name 创建测试文件失败"
        return 1
    fi
    
    # 运行测试脚本
    local test_script="$project_path/scripts/test-bugbot.sh"
    if [ -f "$test_script" ]; then
        log_info "运行测试脚本: $test_script"
        
        cd "$project_path"
        if bash "$test_script"; then
            log_success "项目 $project_name 测试成功"
            return 0
        else
            log_error "项目 $project_name 测试失败"
            return 1
        fi
    else
        log_warning "项目 $project_name 没有测试脚本，跳过"
        return 1
    fi
}

# 主测试函数
run_all_tests() {
    local force="$1"
    
    log_step "开始全局BugBot测试..."
    
    # 检测项目（仅取最后一行的JSON数组，前面的为日志）
    local projects_json
    projects_json="$(detect_projects)"
    local total
    total=$(echo "$projects_json" | jq 'length')
    local tested=0
    local success=0
    local failed=0
    local skipped=0
    
    log_info "检测到 $total 个项目"
    
    # 使用进程替换，避免管道导致子shell中变量丢失
    while IFS= read -r project_info; do
        local project_name
        local project_path
        project_name=$(echo "$project_info" | jq -r '.name')
        project_path="$WORKSPACE_ROOT/$(echo "$project_info" | jq -r '.path')"

        if should_test_project "$project_info" "$force"; then
            ((tested++))
            if run_project_test "$project_name" "$project_path"; then
                ((success++))
            else
                ((failed++))
            fi
        else
            log_info "项目 $project_name 不需要测试，跳过"
            ((skipped++))
        fi
    done < <(echo "$projects_json" | jq -c '.[]')
    
    # 输出结果
    log_success "测试完成!"
    log_info "总计: $total, 测试: $tested, 成功: $success, 失败: $failed, 跳过: $skipped"
    
    # 保存结果到日志
    cat << EOF >> "$LOGS_DIR/global_test.log"
$(date '+%Y-%m-%d %H:%M:%S') - 测试完成: 总计 $total, 测试 $tested, 成功 $success, 失败 $failed, 跳过 $skipped
EOF
}

# 主函数
main() {
    local detect_only=false
    local force=false
    local config_path=""
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --detect-only|-d)
                detect_only=true
                shift
                ;;
            --force|-f)
                force=true
                shift
                ;;
            --config|-c)
                config_path="$2"
                shift 2
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查依赖
    check_dependencies
    
    # 加载配置
    load_config
    
    if [ "$detect_only" = "true" ]; then
        log_step "仅检测项目模式"
        detect_projects
        exit 0
    fi
    
    # 运行测试
    run_all_tests "$force"
}

# 运行主函数
main "$@"
