# 🚀 一键部署指南

## 📋 快速开始

### 前提条件
- ✅ 已安装 Git
- ✅ 已配置 GitHub 账号
- ✅ 项目目录已打开（Cursor 中）

### 一键部署命令
```bash
# 在项目根目录运行
./deploy.sh
```

## 🔧 详细步骤

### 步骤 1：配置 GitHub 信息
```bash
./deploy.sh --config
```
按提示输入：
- GitHub 用户名
- 仓库名（默认：personal-website-v2）
- 分支名（默认：main）

### 步骤 2：执行完整部署
```bash
./deploy.sh --deploy
```
脚本会自动：
- 初始化 Git 仓库
- 创建必要文件
- 提交代码到 GitHub
- 创建测试分支
- 配置 BugBot 集成

### 步骤 3：安装 BugBot
1. 打开 [BugBot GitHub Marketplace](https://github.com/marketplace/bugbot)
2. 点击 "Install it for free"
3. 选择你的仓库
4. 确认权限设置

### 步骤 4：测试 BugBot
1. 访问你的 GitHub 仓库
2. 你会看到测试分支 `bugfix/test-bugbot`
3. 创建 Pull Request
4. 等待 BugBot 自动审查

## 🎯 部署后验证

### 检查清单
- [ ] 代码已推送到 GitHub
- [ ] BugBot 已安装到仓库
- [ ] 测试分支已创建
- [ ] Pull Request 已创建
- [ ] BugBot 已开始审查

### 常见问题
**Q: 脚本运行失败怎么办？**
A: 检查 Git 是否安装，GitHub 配置是否正确

**Q: BugBot 没有自动运行？**
A: 确保 BugBot 已正确安装，仓库权限设置正确

**Q: 如何手动触发 BugBot？**
A: 在 PR 评论中输入：`cursor review` 或 `bugbot run`

## 🔗 相关文档

- [BugBot 使用文档](./BUGBOT.md)
- [项目功能文档](./docs/)
- [部署脚本](./deploy.sh)

---

**部署状态**: ✅ 准备就绪  
**最后更新**: 2025年8月25日
