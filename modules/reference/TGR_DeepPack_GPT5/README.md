# TGR DeepPack (GPT‑5 Thinking) — 液态金属 Techno 可视化（集成・深度版）

> **亮点**：在上一版基础上，新增 **Generators（Curl/Domain/Worley/LIC/RD）**、**Flow 位移**、更完整的 **Blend 统一实现**、更细的注释与接线；保持**一键可跑**。

## 快速开始
```bash
npm i
npm run dev
# http://localhost:5173
```

## 目录
- `src/vis/UnifiedTechnoMoodCore.ts`：统一心脏（情绪×Techno×音频×随机）
- `src/vis/engine.ts`：集成引擎（FBO+Temporal+Bloom+Generators）
- `src/vis/VisualizerIsland.tsx`：React 岛
- `src/vis/glsl/*`：GLSL（12 Blends、金属 BRDF、Bloom、生成器合集）
- `src/main.ts`：Demo 数据源（可替换为 AudioWorklet 与 SSE）

## 渲染管线
1. **Extras**：根据 `pipeline.extras` 生成 `flow/texture/pattern` 三张辅助纹理：
   - `Curl/Domain/LIC` → `uFlow`（位移/方向纹理）或 `uTexA`（细节）
   - `Worley/RD` → `uTexA/uTexB`（粗糙度/高光掩码）
2. **Blend 链**：按节点顺序运行 `blend.frag`，每个模式都可用 `uFlow/uTexA/uTexB` 控制局部变化。
3. **Bloom**：Threshold → Dual-Kawase Down/Up → 合成（被 `BloomHL` 节点触发）。
4. **Temporal**：`TemporalTrail` 模式在链内通过 `uPrev` 混合；帧末 `read` → `prev`。
5. **Composite**：sRGB 输出。

## 接入你的工程
- 用你的 `AudioWorklet` 替换 `main.ts` 里的 `getAudioFeatures()`；
- `/api/nowplaying` → `getNowPlaying()`（SSE/REST）；
- 把 60+ 预设写成 `Preset[]` 喂给 `UnifiedCore.stepOnce()`；
- 如需 SSR/反射，可在 `blend.frag::modeSpecularGrad` 内加入 `prev` 的射线步进近似。

## 性能建议
- FPS≥55：Bloom 打开；48~55：只跑 Down/Up 各 1 级；<48：禁 Bloom，仅 Base+Accent；
- Flow 位移默认 `0.02`，可通过 `uniforms` 降到 `0.01`。

Enjoy the silver.™
