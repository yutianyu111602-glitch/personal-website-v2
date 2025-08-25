
# Cursor 接入说明（UnifiedDrive）

## 模块边界
- **本模块只产出参数**（权重/Uniform），**不包含 UI 与 WebGL**。
- Cursor 侧请保留“音乐可视化操作台”用于：
  - 观察与调节三维向量 **(E, A, R)**
  - 查看当前 Pipeline 节点权重与 uniforms
  - 切换 Stage（idle/build/drop/fill）
  - 观察 FPS/降级状态

## 典型调用流
```ts
import { makeUnifiedVector, drive, mergeIntoPipeline } from 'unified-drive';

// 1) 外部数据（你已有）
const mood   = { energy, valence, arousal };
const audio  = { rms, flux, crest, centroid, beatConf };
const stage: 'idle'|'build'|'drop'|'fill' = stageDetector();

// 2) 合成三维向量
const U = makeUnifiedVector(mood, audio, stage);

// 3) 生成 Assignments（或直接合并到基础 Pipeline）
const assignments = drive(U, { clampTotalW:0.35, nodeCap:0.22 });
// 或：
const pipeline = mergeIntoPipeline(basePipeline, U);

// 4) 把 assignments 映射到渲染器（你项目已有的 EngineBridge）
//    - weights: [{id, weight}], uniforms: [{scope, nodeId, key, value}]
//    - Global scope 的 uniforms 写成全局常量，node scope 的写到对应材质/程序
```

## 事件通道（建议）
- 使用 `BroadcastChannel('vis-console')` 或 React 状态容器，暴露：
  - `GET /state` → 返回 E/A/R、stage、pipeline snapshot、fps
  - `POST /control` → 支持 setEAR / setStage / setUniform / setWeight
- 开发环境允许写入，线上环境只读。

## 热更新
- `makeUnifiedVector` 的权重可以从 `/config/unified.json` 拉取并覆盖（无需改代码）。
- 渲染层的节点/Uniform 名称保持稳定，便于 IDE 自动补全。
