/**
 * LiquidMetalConductor.ts — 情绪→节点编排核心
 * ------------------------------------------------------------
 * [FOR CURSOR / 给 Cursor]
 *   Expose clear APIs. Keep UI out of this module. Ensure types are exported. Provide JSDoc for intellisense. No side-effects.
 *   Expose `scheduler(mood, now, avgFrameMs, presets)` only.
 *
 * [FOR HUMANS / 给人看]
 *   这是逻辑中台：只出数与参数，不含 UI。把输出写入你的渲染器即可。避免在此处做 DOM/UI。
 *   情绪只定边界; 瞬态交给 AudioReactive.
 */

export type Mood = { energy:number; valence:number; arousal:number; beat?:boolean; clockH?:number; };

/** Blend 节点枚举 */
export type BlendID =
  | 'LumaSoftOverlay' | 'SMix' | 'BoundedDodge' | 'SoftBurn' | 'GrainMerge'
  | 'StructureMix' | 'BloomHL' | 'EdgeTint' | 'DualCurve' | 'TemporalTrail'
  | 'SpecularGrad' | 'OkLabLightness';

/** 单个节点 */
export type BlendNode = { id:BlendID; weight:number; uniforms?:Record<string,number>; category?:'Base'|'Accent'|'Decor'; };

/** 预设标签（与 60+ 预设对接） */
export type Preset = { id:string; tags: { metalScore:number; energyBias:number; valenceBias:number; arousalBias:number; hueShiftRisk:number; specularBoost:number; rippleAffinity:number; cost:number; flowAffinity?:number; organicAffinity?:number; fractureAffinity?:number; } };

/** 输出管线 */
export type BlendPipeline = { nodes:BlendNode[]; ttlMs:number; presetId?:string; extras?: any; };

const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));

/** 心智模型：情绪 → 倾向评分 → 按类抽取 Base/Accent/Decor */
function roulette<T extends {s:number}>(arr:T[]):T{ const sum=arr.reduce((a,b)=>a+b.s,0); let r=Math.random()*sum; for(const it of arr){ r-=it.s; if(r<=0) return it; } return arr[arr.length-1]; }
function scoreByMood(id:BlendID, m:Mood){const e=m.energy,v=m.valence,a=m.arousal; switch(id){
  case 'LumaSoftOverlay': return 0.6+0.4*(1-a);
  case 'SMix': return 0.55+0.3*(1-Math.abs(v));
  case 'BoundedDodge': return 0.2+0.9*e+0.3*a;
  case 'SoftBurn': return 0.2+0.8*((-v+1)/2);
  case 'GrainMerge': return 0.4+0.4*(1-a);
  case 'StructureMix': return 0.45+0.5*a;
  case 'BloomHL': return 0.2+0.7*e;
  case 'EdgeTint': return 0.35+0.4*a+0.2*((1+v)/2);
  case 'DualCurve': return 0.3+0.9*e+0.2*a;
  case 'TemporalTrail': return 0.4+0.4*(1-a)+0.2*e;
  case 'SpecularGrad': return 0.35+0.5*a;
  case 'OkLabLightness': return 0.5+0.4*((1+v)/2);
}}

function paramFor(id:BlendID, m:Mood, fpsOk:boolean){
  const e=m.energy,v=m.valence,a=m.arousal, perf=fpsOk?1.0:0.7; switch(id){
    case 'LumaSoftOverlay': return clamp(0.08+0.06*(1-a),0.06,0.16)*perf;
    case 'SMix': return clamp(0.07+0.05*(1-Math.abs(v)),0.05,0.13)*perf;
    case 'OkLabLightness': return clamp(0.06+0.06*((1+v)/2),0.05,0.14)*perf;
    case 'BoundedDodge': return clamp(0.05+0.1*e,0.04,0.16)*perf;
    case 'SoftBurn': return clamp(0.05+0.08*((-v+1)/2),0.04,0.14)*perf;
    case 'StructureMix': return clamp(0.05+0.09*a,0.04,0.14)*perf;
    case 'DualCurve': return clamp(0.05+0.1*e,0.05,0.16)*perf;
    case 'SpecularGrad': return clamp(0.04+0.08*a,0.03,0.12)*perf;
    case 'GrainMerge': return clamp(0.04+0.06*(1-a),0.03,0.10)*perf;
    case 'BloomHL': return clamp(0.04+0.08*e,0.03,0.12)*(fpsOk?1:0);
    case 'EdgeTint': return clamp(0.03+0.06*(a*0.7+(1+v)/3),0.02,0.09)*perf;
    case 'TemporalTrail': return clamp(0.03+0.06*(1-a)+0.03*e,0.02,0.09)*(fpsOk?1:0.5);
  } return 0.08;
}

let _current:BlendPipeline|null=null, _until=0;
/** 主调度器：返回当前 Pipeline（情绪触发/到期重编排） */
export function scheduler(m:Mood, now:number, avgFrameMs:number, presets:Preset[]):BlendPipeline{
  const fpsOk = avgFrameMs<18;
  const BASE:BlendID[]=['LumaSoftOverlay','SMix','OkLabLightness'];
  const ACC:BlendID[]=['BoundedDodge','SoftBurn','StructureMix','DualCurve','SpecularGrad'];
  const DEC:BlendID[]=['GrainMerge','BloomHL','EdgeTint','TemporalTrail'];
  const pick=(pool:BlendID[])=>{ const items=pool.map(id=>({id,s:Math.max(0.001,scoreByMood(id,m))})); return roulette(items).id; };
  if(!_current || now>_until || m.beat){
    const nodes=[] as BlendNode[]; let sum=0;
    const push=(id:BlendID,cat:BlendNode['category'])=>{ const w=paramFor(id,m,fpsOk); if(sum+w<=0.35){ nodes.push({id,weight:w,category:cat}); sum+=w; } };
    push(pick(BASE),'Base'); push(pick(ACC),'Accent'); push(pick(DEC),'Decor');
    _current={nodes, ttlMs:(m.energy>0.75||m.arousal>0.7?15000+Math.random()*15000:45000+Math.random()*45000)};
    _until = now + _current.ttlMs;
  }
  return _current;
}
