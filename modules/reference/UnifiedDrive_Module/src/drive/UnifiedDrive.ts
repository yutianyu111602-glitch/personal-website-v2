
/**
 * UnifiedDrive.ts — 统一驱动（E,A,R → 全参数）
 * ------------------------------------------------------------
 * [FOR CURSOR / 给 Cursor]
 *  - 入口：`drive(EAR, opts?)` 返回 { pipelineDelta, uniforms, extras }。
 *  - 纯函数，无副作用；可用于 SSR 或 Worker。
 *  - ΣW 自动裁切 ≤ 0.35；单节点 ≤ 0.22。
 *  - 保留 stable API：不在这里触摸渲染器或 UI。
 *
 * [FOR HUMANS / 给人看]
 *  - 把情绪/音频/音乐的复杂度压缩到三维 (E,A,R)。
 *  - 你只需喂进 (E,A,R)，这里就会生成所有节点的权重与参数。
 *  - 可以把它看作“视觉方向盘”。
 */
import { BlendID, BlendNode, BlendPipeline, UnifiedVector, Assignments } from "../types/BlendTypes";

export type DriveOptions = {
  clampTotalW?: number;   // 总权重上限，默认 0.35
  nodeCap?: number;       // 单节点上限，默认 0.22
  brightCapBase?: number; // 全局亮度上限基线，默认 0.7
};

const clamp = (x:number, a=0, b=1)=> Math.min(b, Math.max(a, x));
const L = (x:number)=> clamp(x,0,1); // lock 0..1

/** 将 (E,A,R) 规范化（容忍越界输入） */
export function normalizeEAR(EAR:UnifiedVector): UnifiedVector {
  return { E:L(EAR.E), A:L(EAR.A), R:L(EAR.R) };
}

/** 基于 (E,A,R) 计算 12 个节点的 weight */
export function weightsFromEAR(EAR:UnifiedVector, nodeCap=0.22){
  const {E,A,R} = normalizeEAR(EAR);
  const W:Record<BlendID, number> = {
    LumaSoftOverlay: 0.08 + 0.15*(1-A),
    SMix:             0.07 + 0.12*(1-Math.abs(R-0.5)*2),
    OkLabLightness:   0.05 + 0.15*R,
    BoundedDodge:     0.04 + 0.18*E,
    SoftBurn:         0.03 + 0.12*(1-R),
    StructureMix:     0.05 + 0.12*A,
    DualCurve:        0.05 + 0.14*E + 0.06*A,
    SpecularGrad:     0.04 + 0.10*A,
    GrainMerge:       0.03 + 0.08*(1-A),
    BloomHL:          0.03 + 0.15*E*(1-R),
    EdgeTint:         0.02 + 0.10*A*R,
    TemporalTrail:    0.02 + 0.08*(1-R) + 0.05*E,
  } as any;

  // 单节点上限
  (Object.keys(W) as BlendID[]).forEach(k=> (W[k] = Math.min(nodeCap, W[k])) );
  return W;
}

/** 全局 uniforms 与素材模块参数（简化：统一 map，不做强 schema 约束） */
export function uniformsFromEAR(EAR:UnifiedVector, brightCapBase=0.7){
  const {E,A,R} = normalizeEAR(EAR);
  const U:Record<string, number> = {
    // 全局
    'Global.uBrightCap': brightCapBase + 0.3*E,         // 0.7..1.0
    'Global.uJitter':    0.01 + 0.05*A,                 // 抖动
    'Global.uVividGate': 0.2 + 0.7*E*(1-R),             // 鲜艳门
    'SpecularGrad.uLightPhase': (R%1)*6.28318530718,    // 灯相位
    // StructureMix 拓展（来自 NewVisuals）
    'Flow.flowAmp':   0.01 + 0.05*A,
    'Flow.flowScale': 0.8  + 0.5*R,
    'Caustic.strength': 0.2 + 0.6*(E*A),
    'Worley.cellSharp': 0.4 + 0.5*(1-R),
    'Polar.rippleAmp':  0.1 + 0.4*A,
    'RD.f': 0.04 + 0.02*(1-R),
  };
  return U;
}

/** 将权重总量裁切到 `clampTotalW`（默认 0.35） */
export function clampTotalWeights(W:Record<BlendID,number>, clampTotalW=0.35){
  const sum = (Object.values(W) as number[]).reduce((a,b)=>a+b,0);
  const k   = sum>clampTotalW ? clampTotalW/sum : 1;
  const out:Record<BlendID,number> = {} as any;
  (Object.keys(W) as BlendID[]).forEach(kid=> out[kid] = W[kid]*k );
  return out;
}

/** 组合为 Assignments（渲染层友好） */
export function toAssignments(EAR:UnifiedVector, opts:DriveOptions={}): Assignments {
  const clampTotalW = opts.clampTotalW ?? 0.35;
  const nodeCap     = opts.nodeCap     ?? 0.22;
  const brightBase  = opts.brightCapBase ?? 0.7;

  const W0 = weightsFromEAR(EAR, nodeCap);
  const W  = clampTotalWeights(W0, clampTotalW);
  const U  = uniformsFromEAR(EAR, brightBase);

  const weights = (Object.keys(W) as BlendID[]).map(id=>({id, weight: W[id]}));
  const uniforms = Object.entries(U).map(([key,value])=>{
    if(key.startsWith('Global.')) return { scope:'global' as const, key:key.replace(/^Global\./,''), value };
    const m = key.match(/^([A-Za-z0-9_]+)\.(.+)$/);
    if(m) return { scope:'node' as const, nodeId:m[1] as BlendID, key:m[2], value };
    return { scope:'global' as const, key, value };
  });
  return { weights, uniforms };
}

/** 直接把 (E,A,R) 合并进已有 pipeline（不修改传入对象的引用） */
export function mergeIntoPipeline(pipeline:BlendPipeline, EAR:UnifiedVector, opts:DriveOptions={}): BlendPipeline {
  const next:BlendPipeline = { ...pipeline, nodes: pipeline.nodes.map(n=> ({...n, uniforms: {...(n.uniforms||{})}})) };
  const assign = toAssignments(EAR, opts);

  // 写权重
  const map = new Map<BlendID, number>();
  next.nodes.forEach(n=> map.set(n.id, n.weight));
  assign.weights.forEach(w=> map.set(w.id, (map.get(w.id)||0) + w.weight));
  // ΣW 限制
  const sum = Array.from(map.values()).reduce((a,b)=>a+b,0);
  const k = sum> (opts.clampTotalW ?? 0.35) ? (opts.clampTotalW ?? 0.35)/sum : 1;
  next.nodes = Array.from(map.entries()).map(([id,weight])=> ({ id, weight: Math.min(opts.nodeCap ?? 0.22, weight*k) })) as any;

  // 写 uniforms（Global → 每个节点；Node → 指定节点）
  const globals:Record<string,number> = {};
  assign.uniforms.forEach(u=>{
    if(u.scope==='global'){ globals[u.key]=u.value; }
  });
  next.nodes = next.nodes.map(n=>{
    const nu = { ...(globals), ...(n.uniforms||{}) } as Record<string,number>;
    assign.uniforms.forEach(u=>{
      if(u.scope==='node' && u.nodeId===n.id){ nu[u.key]=u.value; }
    });
    return { ...n, uniforms: nu };
  });
  return next;
}

/** 入口：`drive(EAR)` → 给渲染层的 assignments */
export function drive(EAR:UnifiedVector, opts?:DriveOptions){
  return toAssignments(EAR, opts);
}
