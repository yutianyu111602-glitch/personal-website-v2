# TGR Visual Suite — FullStack Demo

这是一个可直接 `npm i && npm run dev` 跑起来的**可视化 Demo**，并内置“统一心脏” (`UnifiedTechnoMoodCore.ts`)：把情绪×Techno×音频特征统一成可渲染的 **BlendPipeline**。

## 快速开始
```bash
npm i
npm run dev
# 浏览器打开 http://localhost:5173
```

## 目录
- `src/vis/UnifiedTechnoMoodCore.ts` 统一模块（完整实现）：单入口 `stepOnce(...)` 产出渲染用 pipeline
- `src/vis/engine.ts` 最小 WebGL 引擎（WebGL1，避免 #version 差异），内置“液态金属”着色器
- `src/vis/VisualizerIsland.tsx` React 客户端岛，驱动引擎与心脏
- `src/main.ts` Demo 入口（提供 Mood/Audio/NowPlaying 的简单模拟）
- `src/vis/glsl/*` 预留的 GLSL 模板（你可替换为之前完整的 12 Blends 与 Generators）

## 说明
- 为了“开箱即跑”，`engine.ts` 采用内置着色器展示液态金属质感，并把 pipeline 的各类权重映射到视觉参数上。
- 当你准备好完整的 GLSL 12 Blends 与生成器时，只需在 `engine.ts` 的 `render`/`drawBlend` 中按 pipeline 节点顺序调用相应的 pass，即可替换为真正的多 pass 管线。

## 可视化质量与性能
- FPS≥55：高质；48~55：中档降级；<48：低档，仅 Base+Accent。
- HUD 显示实时 FPS；页面左下“低能/中能/高能/抽卡”按钮可快速感受编排变化。
