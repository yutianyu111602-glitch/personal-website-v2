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
你得到的

统一核心：src/vis/UnifiedTechnoMoodCore.ts（我们前面定制的情绪×Techno×随机编排引擎，完整源码）。

引擎（集成版）：src/vis/engine.ts（FBO 管线、TemporalTrail、Dual-Kawase Bloom、逐节点执行）。

12 个 Blend：src/vis/glsl/blend.frag（uMode 切换实现 LumaSoftOverlay / SMix / OkLabLightness / BoundedDodge / SoftBurn / StructureMix / DualCurve / SpecularGrad / GrainMerge / EdgeTint / TemporalTrail；BloomHL 走外部 pass）。

金属高光：src/vis/glsl/brdf-metal.glsl（银质 GGX 近似 + Fresnel）。

公共工具：src/vis/glsl/common.glsl（sRGB↔线性、OkLab 近似、Simplex/FBM 噪声、边缘度量等）。

Bloom：bloom_threshold.frag + kawase_down.frag + kawase_up.frag + composite.frag。

React 岛：src/vis/VisualizerIsland.tsx（异步加载引擎，接入统一核心输出）。

Demo：src/main.ts + index.html（按钮一键切能量/抽卡；HUD 帧率）。

文档：README.md（结构、链路、扩展点、性能守护，写清楚了）。

想把你的真实 60+ 预设和 AudioWorklet 接进来？

把你现有的 presets[] 替换 main.ts 里的示例；

用你已经做好的 Worklet 输出替换 getAudioFeatures()；

把电台 /api/nowplaying 的 SSE 数据接入 getNowPlaying()；

其余逻辑都由 UnifiedCore.stepOnce() 自动编排，engine.ts 负责渲染。