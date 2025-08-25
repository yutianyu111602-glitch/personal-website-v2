
# LiquidMetal Strategy Suite (Annotated)
- 所有 TS/GLSL 文件均带有“双语注释块”：
  - [FOR CURSOR]：告诉 Cursor 如何识别 API、保持模块边界、避免 UI 污染
  - [FOR HUMANS]：给开发者的心智模型与使用注意事项
- **大文件分段**策略：
  - 当单文件超过 500 行时，自动拆分为 `*.partN.*`，每段独立可编译或可包含。
  - 本包的 12 个 Blend 被拆成 `glsl-blends.part1/2/3.glsl`。
- 策略包：
  - `strategy/combos.json`：40+ 配方，含 class（stable/build/drop/fill/ambient/experimental）与可选 extras
  - `strategy/strategy.rules.json`：按时段的类别权重

## 接入顺序
1) 用 `scheduler()` 拿基础 pipeline。
2) 根据场景（idle/build/drop/fill）调用 `StrategyRuntime.pick()` 选一个 combo，用 `mergePipeline()` 合入。
3) 调 `computeAudioFeatures()` + `pickMicroMods()` + `applyMicroMods()` 注入瞬态。
4) 用 `pipelineToAssignments()` 映射为 weights/uniforms，写入渲染器（见你的 WebGL 层）。
5) 若 FPS 下降，先用 `gatekeepWeights()` 自救；必要时减少节点数或禁用 Bloom。

## 给 Cursor 的备注
- 操作台 UI 不在本包，但请预留：查看 pipeline、调 mood、查看 12 监测点、切策略、看 FPS/降级。
- API：只读 `get`、可写 `post`，用 BroadcastChannel 或 postMessage 连到运行时。
