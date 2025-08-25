
/**
 * BlendTypes.ts — 统一类型定义
 * ------------------------------------------------------------
 * [FOR CURSOR / 给 Cursor]
 *   - 自包含类型，避免跨包循环依赖；若你已有类型，保持兼容字段即可。
 *   - 不承担 UI；只导出类型与纯函数。
 *
 * [FOR HUMANS / 给人看]
 *   - 这些类型与我们之前的系统一致（12 Blend 节点 + Pipeline 模式）。
 *   - 如果你的项目已有定义，可把此文件替换成类型映射层（保持字段名一致即可）。
 */
export type BlendID =
  | 'LumaSoftOverlay' | 'SMix' | 'BoundedDodge' | 'SoftBurn' | 'GrainMerge'
  | 'StructureMix' | 'BloomHL' | 'EdgeTint' | 'DualCurve' | 'TemporalTrail'
  | 'SpecularGrad' | 'OkLabLightness';

export type BlendNode = { id:BlendID; weight:number; uniforms?:Record<string,number>; category?:'Base'|'Accent'|'Decor'; };
export type BlendPipeline = { nodes:BlendNode[]; ttlMs?:number; presetId?:string; extras?: any; };

export type UnifiedVector = { E:number; A:number; R:number }; // E=Energy, A=Arousal, R=Regularity

export type Assignments = {
  weights: { id:BlendID; weight:number }[];
  uniforms: { scope:'global'|'node'; nodeId?:BlendID; key:string; value:number }[];
};
