# 个人网站项目V2 - 重构版（独立项目）

## 项目概述

本目录为 `@个人网站项目V2/` 独立重构版本，遵循全局三目录产物规范（`outputs/`、`logs/`、`cache/`）与无人化自动更新策略（每次启动均执行 update）。在兼容 `webuiv4_v2.3` 可复用模块的基础上，重组目录、统一规则、强化部署与健康检查。

## 目录结构（V2）

```
个人网站项目V2/
├── README_使用说明.md
├── PROJECT_RULES_V2.md             # V2项目规则（命名/产物/脚本/注释规范）
├── oneclick_start.sh               # 一键启动（含自动update）
├── reference/                      # 参考模块归档（只读，不直接运行）
│   ├── TGR_DeepPack_GPT5/
│   ├── LiquidMetal_StrategySuite_Annotated/
│   ├── LiquidMetal_AlgoBoost/
│   ├── UnifiedDrive_Module/
│   └── music-visualizer-focus-toggle/
├── env.example                     # 环境变量模板
├── webui/                          # 统一前端入口（纯前端V2）
└── scripts/
    ├── healthcheck/               # 端口/接口健康检查
    ├── post_deploy/               # 部署后钩子（产物对齐/清理）
    └── utils/                     # 公共函数（日志/路径/更新）
```

## 全局三目录路由

- 输出：`outputs/personal_website/`（全局根级目录）
- 日志：`logs/personal_website/`
- 缓存：`cache/personal_website/`

V2所有脚本与应用输出统一写入上述路径，禁止散落创建新目录。

## 快速开始

```bash
cd "程序集_Programs/个人网站项目V2"
chmod +x oneclick_start.sh oneclick_build.sh oneclick_deploy.sh || true
./oneclick_start.sh
```

默认启动 `webui`（端口由 `PORT` 指定，默认3000）。

### 跨 Shell 启动元数据服务与代理（重要）

- macOS/Linux（zsh/bash）：
```bash
# 真实上游
node server/metadata_server.js
# 或启用 Mock（上游未运行时开发用）
MOCK=true bash scripts/start_metadata_server.sh 3500
```

- Windows PowerShell：
```powershell
# 正确设置环境变量后启动
$env:METADATA_PORT='3500'
$env:TERMUSIC_GATEWAY='http://127.0.0.1:7533'
$env:AUDIO_GATEWAY='http://127.0.0.1:18766'
node server/metadata_server.js

# 启用 Mock
powershell -File scripts/start_metadata_server.ps1 -Port 3500 -Mock
```

> 注意：PowerShell 不支持 `FOO=bar node app.js` 这种 Bash 风格的内联环境变量写法。

## 端口与环境变量

- 开发端口 `PORT`，默认 `3000`。
- `oneclick_start.sh` 会加载 `.env.local` 并将 `PORT` 传入 `vite`。
- 修改端口：复制 `env.example` 为 `.env.local` 并调整 `PORT`。

```bash
cp env.example .env.local
echo "PORT=3010" >> .env.local
./oneclick_start.sh
```

## 密钥迁移指南（重要）

- 旧版 `src/config/api_keys.py` 中的密钥请迁移到 `.env.local`：
  - `OPENAI_API_KEY`
  - `OPENAI_ORG_ID`
  - `OPENAI_BASE_URL`
- 不要将密钥提交到仓库；`env.example` 仅保留空占位键名。

## 自动更新（每次执行必跑）

包含：
- Git更新（若为Git仓库则 `git pull --rebase --autostash`）
- 依赖更新（Node: `npm ci` 或 `npm install`）
- 文档与更新日志写入（`GPT_EXPERTS_ANALYSIS_AND_BUGBOT_REPORT.md` 追加条目）
- 环境变量校验（若缺失则从 `env.example` 生成 `.env.local`）

### 关于 reference/

- 此目录仅存放历史参考/算法包源码，已在 `webui/src/vis/` 中完成必要抽取与集成。
- 参考包不会被启动脚本直接运行；如需对照阅读，请从 `reference/` 中查阅对应实现。
- 如需回滚，已于 `outputs/personal_website/archives/refs_<timestamp>.tar.gz` 自动归档。

## 核心模块与端口说明（新增）

### 统一管理器（core/）
- 入口与初始化：`webui/src/core/index.ts`，在 `webui/src/main.tsx` 中执行 `initCoreManagers()` 与 `startCoreManagers()`。
- 注册中心：`webui/src/core/ManagerRegistry.ts` 统一注册/初始化/启停/释放所有管理器。
- 管理器接口：`webui/src/core/ManagerTypes.ts` 规范所有管理器的生命周期接口（`init/start/stop/dispose`）。

### 动态主题管理器（DynamicThemeManager）
- 路径：`webui/src/core/DynamicThemeManager.ts`
- 职责：将情绪/能量/BPM 等事件映射为主题 Token（`accent/background/intensity/motion/contrast`）。
- 事件：订阅 `UnifiedEventBus` 的 `liquidmetal:mood`、`automix:energy`、`automix:bpm`；广播 `global:config { theme }`。

### 遥测管理器（TelemetryManager）
- 路径：`webui/src/core/TelemetryManager.ts`
- 职责：订阅统一事件并以 500ms 节流上报到 `/api/event`（开发模式通过 Vite 代理到元数据服务）。
- 数据落盘：`logs/personal_website/events.ndjson`（由 `server/metadata_server.js` 写入）。

### 主题调试面板（ThemeDebugPanel）
- 路径：`webui/src/components/ThemeDebugPanel.tsx`，已在 `webui/src/App.tsx` 挂载。
- 功能：实时展示 Theme Tokens，支持一键注入随机情绪事件验证链路。

### 事件总线限流（UnifiedEventBus）
- 路径：`webui/src/components/events/UnifiedEventBus.ts`
- 默认限流：`automix:bpm`/`energy` 250ms throttle、`global:performance` 500ms throttle、`visualization:effect` 250ms debounce。
- 运行时API：`configureRateLimit(namespace,type,mode,waitMs)`、`clearRateLimit()`。

### 端口与代理关系
- `PORT`（默认 3000）：Vite 开发/预览/静态部署端口；由一键脚本与 `vite.config.ts` 读取。
- `METADATA_PORT`（默认 3500）：`server/metadata_server.js` 监听端口，提供 `/api/*` 接口；Vite 通过 `server.proxy['/api']` 转发到该端口。
- `TGR_PORT`（默认 3001）：可选的 `TGR_FullStack_VisualSuite` 演示端口（存在该目录时由一键脚本拉起）。
- `VITE_MUSIC_BASE_URL`（默认 `http://localhost:9000`）：音乐/后端服务可选基址（当前纯前端可留空）。

### 健康检查与一键脚本
### 情绪核心统一（EmotionCoreManager）
- 路径：`webui/src/core/EmotionCoreManager.ts`
- 作用：作为统一核心的承载层（输入/输出/主循环/配置），用于逐步合并 DynamicTheme/VisualizationEffect/AutoMix 的职责，减少多处循环与事件抖动。
- FeatureFlag（灰度开关）：
  - `webui/src/data-config.json` 中 `featureFlags.emotionCoreUnifiedLoop`（默认 false）。
  - 开启后，入口仅注册 `EmotionCoreManager + TelemetryManager`，其余旧管理器不再注册，避免重复事件；关闭时沿用旧路径，EmotionCore 仅占位。
- 输入（事件）：
  - `liquidmetal:mood { mood }`、`automix:energy { energy }`、`automix:bpm { bpm }`、（可选）`/api/nowplaying` 内嵌轮询。
- 输出（事件）：
  - `global:config { theme }`、`visualization:preset { preset }`、（可选）`visualization:effect { pipeline }`。

### 统一配置规范（重要）
- 运行时配置：`webui/src/data-config.json`
  - `visualizer.overlay`: `blendMode | opacity | highFps`
  - `layout.focus`: `organizer.width/height`、`taskLogger.width`
  - `featureFlags.emotionCoreUnifiedLoop`: 是否启用统一循环
  - `emotionCore.tickIntervalMs`: 统一循环步进间隔
- 环境变量（仅端口/密钥）：`.env.local`
  - `PORT`、`METADATA_PORT`、`TGR_PORT`、`OPENAI_API_KEY` 等
- 迁移建议：所有界面/算法的可调参数尽量迁入 `data-config.json`；端口与敏感信息保留在 `.env.local`。
- 健康检查脚本：`scripts/utils/healthcheck_webui.sh`（检测首页与 `/api/health`）。
- 一键脚本：`oneclick_start.sh` 自动执行依赖更新、构建/部署、健康检查以及（可选）TGR 套件联启。

## 部署

```bash
./oneclick_build.sh   # 产物构建
./oneclick_deploy.sh  # 静态产物部署 + 健康检查
```

构建产物统一归档到 `outputs/personal_website/builds/<timestamp>/`。

## 参考

- `webui/vite.config.ts`（端口从环境变量读取）

---
版本：v2.0（重构首版）  
状态：试运行  
维护：麻蛇 / GPT-5

# 🌟 个人网站项目 - 天宫科技全屏视觉体验应用

## 📖 项目概述

这是一个集成了多种现代化Web技术的个人网站项目，包含多个版本的WebUI和Shader效果展示。项目采用React + TypeScript + Vite技术栈，提供流畅的用户体验和丰富的视觉效果。

## 🏗️ 项目结构

```
个人网站项目/
├── webuiv4_v2.3/          # 最新版本 - 天宫科技全屏视觉体验应用
├── webuiv2/                # 第二版本 - 音乐可视化WebUI
├── Shader_Reminder_v1/     # Shader效果展示器 v1
└── Shader_Reminder_v3/     # Shader效果展示器 v3
```

## 🚀 快速开始

### 1. 启动最新版本 (webuiv4_v2.3)
```bash
cd webuiv4_v2.3
npm install
npm run dev
```

### 2. 启动第二版本 (webuiv2)
```bash
cd webuiv2
npm install
npm run dev
```

### 3. 启动Shader展示器
```bash
cd Shader_Reminder_v1
npm install
npm run dev
```

## ✨ 核心特性

### 🎨 视觉体验
- **5种银色主题Shader背景** - 自动循环切换
- **WebGL硬件加速** - 流畅的45fps实时渲染
- **鼠标交互响应** - 微妙的动画跟随
- **2025 Apple毛玻璃风格** - 现代化界面设计

### ⏰ 智能时钟系统
- **全屏欢迎界面** - 优雅的时钟显示
- **空间站主题** - 科技感虚拟轨道模拟
- **双向导航** - 欢迎界面与控制台切换
- **中文本地化** - 完整简体中文支持

### 🎵 音乐功能
- **网易云音乐整理** - 智能分类管理
- **Spotify导出功能** - 无缝平台导出
- **电台播放器** - Wavesurfer.js集成
- **音频可视化** - 实时波形显示

## 🔧 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式框架**: Tailwind CSS
- **动画库**: Motion (Framer Motion)
- **音频处理**: Wavesurfer.js v7
- **渲染引擎**: WebGL + GLSL Shaders

## 📱 兼容性

- **浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **设备**: 桌面端、移动端、平板端、4K显示器
- **性能**: 45fps渲染、<50MB内存占用、<2s加载时间

## 🛠️ 开发指南

### 环境要求
- Node.js 18+
- 现代浏览器 (支持WebGL)
- TypeScript 4.9+

### 开发命令
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 代码规范
- 使用TypeScript严格模式
- 遵循React Hooks最佳实践
- 保持组件纯净和可复用
- 添加适当的错误处理

## 🚀 部署指南

### 生产部署
```bash
# 构建优化版本
npm run build

# 部署到服务器
# 将 build/ 目录内容上传到Web服务器
```

### Cursor IDE部署
详细部署说明请参考各项目目录下的部署指南文档。

## 📊 性能优化

- **渲染优化**: WebGL硬件加速
- **内存管理**: 自动清理和优化
- **加载优化**: 按需加载和代码分割
- **响应式设计**: 多设备适配

## 🐛 故障排除

### 常见问题
1. **欢迎界面不显示** - 检查组件导入和初始状态
2. **Shader背景黑屏** - 验证WebGL支持，启用回退机制
3. **功能模块加载失败** - 确认组件路径，使用回退组件
4. **性能问题** - 启用硬件加速，调整渲染频率

### 调试工具
- **快捷键**: `Ctrl/Cmd + Shift + D` 打开调试面板
- **性能监控**: 实时显示渲染性能指标
- **状态调试**: 查看应用内部状态变化

## 📚 相关文档

- [webuiv4_v2.3部署指南](./webuiv4_v2.3/src/CURSOR_DEPLOYMENT_GUIDE_V2.md)
- [技术规格说明](./webuiv4_v2.3/src/TECHNICAL_SPECIFICATIONS.md)
- [性能优化指南](./webuiv4_v2.3/src/PERFORMANCE_OPTIMIZATION_GUIDE.md)
- [故障排除指南](./webuiv4_v2.3/src/TROUBLESHOOTING_GUIDE.md)

## 🤝 开发贡献

### 提交规范
```
feat: 新功能
fix: 错误修复
docs: 文档更新
style: 代码格式化
refactor: 代码重构
test: 测试相关
chore: 构建或辅助工具变动
```

## 📄 许可证

MIT License - 详见各项目目录下的LICENSE文件

## 👨‍💻 作者信息

**麻蛇**  
🏢 天宫科技  

## 🎉 致谢

感谢所有为这个项目提供灵感和技术支持的开源社区！

---

**版本**: v2.3 终极兼容性版本  
**最后更新**: 2025年1月  
**状态**: ✅ 生产就绪
