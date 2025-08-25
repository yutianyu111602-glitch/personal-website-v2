# 音乐可视化 · 点击不弹窗 → 背景切换 + 模块最小化

> 目标：点击可视化区域**不弹新窗口**，而是**切换背景**并将功能模块**最小化到 Dock**；再次点击或按 `Esc` 退出。动画≤300ms，不中断音频。

## 功能点
- `Normal ↔ Focus` 两种模式切换
- Focus 模式：
  - 背景切换（渐变/图片/视频/Canvas 均可扩展）
  - 所有模块缩小并隐藏，仅在底部 `Dock` 保留核心控件
  - 可选禁用滚动，避免页面抖动
- 仅切换 CSS class；不直接操作 `<audio>`，保证播放不断流

## 目录结构
```
music-visualizer-focus-toggle
├─ index.html
├─ src/
│  ├─ main.js
│  └─ style.css
├─ public/
├─ .env.example
├─ .env.local          # 可选：复制 .env.example 后修改
├─ vite.config.js
├─ package.json
└─ README.md
```

## 快速开始（本地）
前置：Node.js ≥ 18（建议 18/20 LTS），npm 或 pnpm/yarn。

```bash
# 1) 安装依赖
npm i
# 2) 启动开发服务（端口默认 .env 或 5173）
npm run dev
# 3) 生产构建
npm run build
# 4) 本地预览构建产物
npm run preview
```

### 端口与环境变量
- `.env.example` 提供：
  - `VITE_PORT=5173` —— 开发端口
  - `VITE_BASE=/` —— 部署子路径（如挂在 `/app/`）
- 将其复制为 `.env.local` 并按需修改。Vite 会在启动时读取。

### 与 Cursor 一键接入
1. 在 Cursor 中打开本项目文件夹。
2. `npm i` 安装依赖。
3. 运行 `npm run dev` 启动预览；按需修改 `src/` 中逻辑。
4. 插件/Agent 可以基于 `index.html`、`main.js` 的注释引导重构为 React/Three.js 版本。

## 二次开发建议
- **可视化引擎**：将 `#viz` 换成 WebGL/Three.js/ShaderToy 渲染；在 `enterFocus/exitFocus` 中打开/关闭高帧率模式。
- **背景源**：在 `enterFocus()` 中切换 `app.style.backgroundImage` 或插入 `<video>`/Canvas 层。
- **Dock 行为**：把全局播放器接口挂到 `window.player`，在 `dockPlay` 点击时调用 `player.toggle()`。

## 依赖
- 开发：Vite 5（Vanilla）
- 运行时：无（纯前端静态资源）

## 部署
- 静态托管（推荐）：Vercel / Netlify / Cloudflare Pages / GitHub Pages。
- Nginx/容器：构建后将 `dist/` 暴露为静态目录即可。
- 若使用子路径部署，设置 `VITE_BASE=/子路径/`，重新构建。

## 无障碍（a11y）
- 可视化热区使用 `aria-pressed` 暴露状态。
- 通过 `Esc` 快捷键退出 Focus。

## 许可证
MIT
