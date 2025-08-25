
# UnifiedDrive — 统一驱动模块

- 自包含 TypeScript 模块：**(E,A,R) → 全部特效参数**
- 带 **Cursor 接入说明** 与 **白话文指南**

## 主要导出
- `normalizeEAR(EAR)`：容错归一化
- `weightsFromEAR(EAR, nodeCap?)`：12 节点权重
- `uniformsFromEAR(EAR, brightCapBase?)`：全局/模块 uniforms
- `toAssignments(EAR, opts?)`：渲染层友好的赋值列表
- `mergeIntoPipeline(pipeline, EAR, opts?)`：把 E/A/R 融入现有 Pipeline
- `makeUnifiedVector(mood, audio, stage)`：把三源数据做成 (E,A,R)

## 约束
- ΣW ≤ 0.35，单节点 ≤ 0.22（可改）
- 不依赖 UI 或 WebGL，方便在 Worker/Server 端运行

## 例子
见 `docs/CURSOR_INTEGRATION.md` 的“典型调用流”。
