
/**
 * LiquidMetalConductor.ts
 * 液态金属银背景 · 情绪能量驱动的特效调度器（完整实现）
 * ------------------------------------------------------------------
 * - 基于情绪(Mood)自动编排 Base/Accent/Decor 混合节点
 * - 与 60+ 预设结合（基于 tags 打分 + 冷却/多样性惩罚）
 * - 性能守护、银色保护（亮度/色相）
 * - 输出 BlendPipeline（交给 Shader 渲染）；另外提供 extras 生成器选择
 * - 无第三方依赖；纯 TypeScript
 */

// -------------------- 类型定义 --------------------

export type Mood = {
  energy: number;   // 0..1
  valence: number;  // -1..1
  arousal: number;  // 0..1
  beat?: boolean;
  clockH?: number;  // 0..23 可选（时段偏好）
};

export type BlendID =
  | 'LumaSoftOverlay'
  | 'SMix'
  | 'BoundedDodge'
  | 'SoftBurn'
  | 'GrainMerge'
  | 'StructureMix'
  | 'BloomHL'
  | 'EdgeTint'
  | 'DualCurve'
  | 'TemporalTrail'
  | 'SpecularGrad'
  | 'OkLabLightness';

export type BlendNode = {
  id: BlendID;
  weight: number;                     // 0..0.22（系统会限幅）
  uniforms?: Record<string, number>;  // 传 Shader 的额外参数
  category?: 'Base'|'Accent'|'Decor';
};

export type BlendPipeline = {
  nodes: BlendNode[]; // 顺序即链路顺序
  ttlMs: number;      // 有效时长，到点重编排
  presetId?: string;  // 关联的 60+ 预设 ID（可选）
  extras?: Extras;    // 可选：生成器/蒙版选型（见下）
};

export type Preset = {
  id: string;
  tags: {
    metalScore: number;      // 0..1（银色契合度）
    energyBias: number;      // -1..+1
    valenceBias: number;     // -1..+1
    arousalBias: number;     // 0..1
    hueShiftRisk: number;    // 0..1（色偏风险）
    specularBoost: number;   // 0..1（高光强化）
    rippleAffinity: number;  // 0..1（流动亲和）
    cost: number;            // 1..5（性能代价）
    // 可选扩展：
    flowAffinity?: number;   // 0..1 对流场/位移喜好
    organicAffinity?: number;// 0..1 对有机图样（Lenia/RD）喜好
    fractureAffinity?: number;// 0..1 对碎裂（Worley）喜好
  };
};

export type History = { id: string; t: number }[];

// -------------------- 生成器/蒙版（可选机制） --------------------

export type FlowAlgoID = 'CurlNoise' | 'StableFluid' | 'DomainWarp' | 'LIC';
export type TextureAlgoID = 'Simplex' | 'fBm' | 'Ridged' | 'Worley' | 'Gabor';
export type PatternAlgoID = 'ReactionDiffusion' | 'Lenia' | 'WFC';

export type ExtraNode<T extends string> = {
  id: T;
  uniforms?: Record<string, number>;
};

export type Extras = {
  flow?: ExtraNode<FlowAlgoID>;
  texture?: ExtraNode<TextureAlgoID>;
  pattern?: ExtraNode<PatternAlgoID>;
};

// -------------------- 工具函数 --------------------

const clamp = (v:number,min:number,max:number)=> Math.min(max, Math.max(min,v));

function cooldownPenalty(id: string, history: History, now: number, cooldownMs=45000, diversity=0.6): number {
  let score = 1.0;
  const last = [...history].reverse().find(h => h.id === id);
  if (last && (now - last.t) < cooldownMs) score *= 0.2; // 冷却期强降
  const idx = history.slice(-6).map(h=>h.id).lastIndexOf(id);
  if (idx >= 0) score *= (1 - diversity * (1 - idx/6));
  return score;
}

function roulette<T extends {s:number}>(arr:T[]):T {
  const sum = arr.reduce((a,b)=>a+b.s,0);
  let r = Math.random()*sum;
  for (let item of arr){ r -= item.s; if (r <= 0) return item; }
  return arr[arr.length-1];
}

function seedRnd(seed:number){ // 简易 Xorshift32
  let x = seed|0 || 123456789;
  return ()=>{
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return ((x>>>0) / 0xFFFFFFFF);
  };
}

// -------------------- 情绪 → 算法加权 --------------------

function scoreByMood(id: BlendID, m: Mood): number {
  const { energy:e, valence:v, arousal:a } = m;
  switch (id) {
    case 'LumaSoftOverlay': return 0.6 + 0.4*(1-a);
    case 'SMix':            return 0.55 + 0.3*(1-Math.abs(v));
    case 'BoundedDodge':    return 0.2 + 0.9*e + 0.3*a;
    case 'SoftBurn':        return 0.2 + 0.8*((-v+1)/2);
    case 'GrainMerge':      return 0.4 + 0.4*(1-a);
    case 'StructureMix':    return 0.45 + 0.5*a;
    case 'BloomHL':         return 0.2 + 0.7*e;
    case 'EdgeTint':        return 0.35 + 0.4*a + 0.2*((1+v)/2);
    case 'DualCurve':       return 0.3 + 0.9*e + 0.2*a;
    case 'TemporalTrail':   return 0.4 + 0.4*(1-a) + 0.2*e;
    case 'SpecularGrad':    return 0.35 + 0.5*a;
    case 'OkLabLightness':  return 0.5 + 0.4*((1+v)/2);
  }
}

function paramFor(id: BlendID, m: Mood, fpsOk: boolean): number {
  const e=m.energy, v=m.valence, a=m.arousal;
  const perf = fpsOk ? 1.0 : 0.7;
  switch(id){
    case 'LumaSoftOverlay': return clamp(0.08 + 0.06*(1-a),0.06,0.16)*perf;
    case 'SMix':            return clamp(0.07 + 0.05*(1-Math.abs(v)),0.05,0.13)*perf;
    case 'OkLabLightness':  return clamp(0.06 + 0.06*((1+v)/2),0.05,0.14)*perf;
    case 'BoundedDodge':    return clamp(0.05 + 0.1*e,0.04,0.16)*perf;
    case 'SoftBurn':        return clamp(0.05 + 0.08*((-v+1)/2),0.04,0.14)*perf;
    case 'StructureMix':    return clamp(0.05 + 0.09*a,0.04,0.14)*perf;
    case 'DualCurve':       return clamp(0.05 + 0.1*e,0.05,0.16)*perf;
    case 'SpecularGrad':    return clamp(0.04 + 0.08*a,0.03,0.12)*perf;
    case 'GrainMerge':      return clamp(0.04 + 0.06*(1-a),0.03,0.10)*perf;
    case 'BloomHL':         return clamp(0.04 + 0.08*e,0.03,0.12) * (fpsOk?1:0);
    case 'EdgeTint':        return clamp(0.03 + 0.06*(a*0.7 + (1+v)/3),0.02,0.09)*perf;
    case 'TemporalTrail':   return clamp(0.03 + 0.06*(1-a)+0.03*e,0.02,0.09) * (fpsOk?1:0.5);
  }
  return 0.08;
}

// -------------------- 生成器选择（可选） --------------------

function pickFlowByMood(m:Mood): ExtraNode<FlowAlgoID> {
  // 高唤醒/能量 -> Curl/Domain；平稳 -> LIC；复杂 -> StableFluid
  const e=m.energy, a=m.arousal;
  const pool: FlowAlgoID[] = (a>0.6||e>0.6) ? ['CurlNoise','DomainWarp','LIC'] : ['LIC','CurlNoise','StableFluid'];
  const id = pool[Math.floor(Math.random()*pool.length)];
  switch(id){
    case 'CurlNoise': return { id, uniforms:{ flowAmp: 0.02 + 0.03*e, flowScale: 0.8 + 1.2*a } };
    case 'DomainWarp':return { id, uniforms:{ warpAmp: 0.015 + 0.02*e, warpIter: 1 + Math.floor(2*a) } };
    case 'StableFluid':return { id, uniforms:{ fluidDamp: 0.96, fluidForce: 0.5+0.5*e } };
    case 'LIC':       return { id, uniforms:{ licLen: 6.0 + 10.0*a, licGain: 0.6 } };
  }
}

function pickTextureByMood(m:Mood): ExtraNode<TextureAlgoID> {
  const e=m.energy, v=m.valence;
  const pool: TextureAlgoID[] = e>0.7 ? ['Ridged','Gabor','fBm'] : (v<0 ? ['Ridged','Worley'] : ['Simplex','fBm']);
  const id = pool[Math.floor(Math.random()*pool.length)];
  switch(id){
    case 'Simplex': return { id, uniforms:{ texScale: 2.0, texGain: 0.8 } };
    case 'fBm':     return { id, uniforms:{ texScale: 2.5, fbmOct: 4, fbmGain: 0.55 } };
    case 'Ridged':  return { id, uniforms:{ texScale: 3.0, ridgeGain: 0.8 } };
    case 'Worley':  return { id, uniforms:{ texScale: 4.0, cellSharp: 0.6 } };
    case 'Gabor':   return { id, uniforms:{ texScale: 3.0, gaborAniso: 0.8 } };
  }
}

function pickPatternByMood(m:Mood): ExtraNode<PatternAlgoID> {
  const e=m.energy, v=m.valence, a=m.arousal;
  const pool: PatternAlgoID[] = (v<0 && a<0.5) ? ['ReactionDiffusion','Lenia'] : (a>0.6 ? ['Lenia','WFC'] : ['ReactionDiffusion','WFC']);
  const id = pool[Math.floor(Math.random()*pool.length)];
  switch(id){
    case 'ReactionDiffusion': return { id, uniforms:{ rdF: 0.037 + 0.01*e, rdK: 0.06 + 0.01*(1+v)/2 } };
    case 'Lenia':            return { id, uniforms:{ leniaR: 0.08+0.04*a, leniaBeta: 2.0 } };
    case 'WFC':              return { id, uniforms:{ wfcSeed: Math.random()*1e6 } };
  }
}

export function selectExtras(m:Mood): Extras {
  return {
    flow: pickFlowByMood(m),
    texture: pickTextureByMood(m),
    pattern: pickPatternByMood(m)
  };
}

// -------------------- 核心编排 --------------------

export function pickCombo(
  m: Mood,
  fpsOk: boolean,
  history: History,
  presets: Preset[],
  now: number
): BlendPipeline {
  const BASE_POOL: BlendID[] = ['LumaSoftOverlay','SMix','OkLabLightness'];
  const ACC_POOL:  BlendID[] = ['BoundedDodge','SoftBurn','StructureMix','DualCurve','SpecularGrad'];
  const DEC_POOL:  BlendID[] = ['GrainMerge','BloomHL','EdgeTint','TemporalTrail'];

  const chooseWeighted = (pool:BlendID[]): BlendID => {
    const items = pool.map(id=>({ id, s: Math.max(0.001, scoreByMood(id, m)) }));
    return roulette(items).id;
  };

  const base = chooseWeighted(BASE_POOL);
  const acc  = chooseWeighted(ACC_POOL);
  const dec  = chooseWeighted(DEC_POOL);

  const nodes: BlendNode[] = [];
  let sumW = 0;
  const pushNode = (id:BlendID, category:BlendNode['category'])=>{
    const w = paramFor(id,m,fpsOk);
    if (sumW + w <= 0.35){ nodes.push({id,weight:w,category}); sumW += w; }
  };

  pushNode(base,'Base');
  pushNode(acc,'Accent');
  pushNode(dec,'Decor');

  // 选一个预设（考虑银色保护/冷却/性能）
  const scored = presets.map(p=>{
    let s = 0.6*p.tags.metalScore + 0.2*p.tags.specularBoost + 0.2*p.tags.rippleAffinity;
    s += 0.35*m.energy*p.tags.energyBias;
    s += 0.25*m.arousal*p.tags.arousalBias;
    s += 0.15*((m.valence+1)/2)*p.tags.valenceBias;
    s *= (1 - 0.5*p.tags.hueShiftRisk);
    s *= cooldownPenalty(p.id, history, now);
    if (!fpsOk && p.tags.cost>3) s *= 0.5;      // 性能守护
    return {p,s: Math.max(0.001,s)};
  });
  const chosen = roulette(scored);

  // TTL（build/drop 可外部覆盖）
  const jump = (m.beat?1:0)+(m.energy>0.75?1:0)+(m.arousal>0.7?1:0);
  const ttlMs = jump ? (15000+Math.random()*15000):(45000+Math.random()*45000);

  // 记录历史
  nodes.forEach(n=>history.push({id:n.id,t:now}));
  history.push({id:chosen.p.id,t:now});

  // 附加可选生成器（flow/texture/pattern）
  const extras = selectExtras(m);

  return { nodes, ttlMs, presetId: chosen.p.id, extras };
}

// -------------------- 调度器状态 --------------------

let _history: History = [];
let _current: BlendPipeline|null = null;
let _until = 0;

/** 调度器入口（情绪 -> Pipeline） */
export function scheduler(m:Mood, now:number, avgFrameMs:number, presets:Preset[]):BlendPipeline {
  const fpsOk = avgFrameMs < 18; // ~55FPS+
  if (!_current || now > _until || m.beat) {
    _current = pickCombo(m, fpsOk, _history, presets, now);
    _until = now + _current.ttlMs;
  }
  return _current;
}

// -------------------- 调试辅助 --------------------

/** 简易打印当前 Pipeline */
export function debugPipeline(p: BlendPipeline): string {
  const ns = p.nodes.map(n=>`${n.category||''}:${n.id}(${n.weight.toFixed(3)})`).join('  →  ');
  const ex = p.extras ? ` | flow:${p.extras.flow?.id} tex:${p.extras.texture?.id} pat:${p.extras.pattern?.id}` : '';
  return `[TTL ${p.ttlMs}ms] ${ns}${ex} | preset:${p.presetId||'-'}`;
}
