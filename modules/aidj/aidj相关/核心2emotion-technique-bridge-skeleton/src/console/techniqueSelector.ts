// techniqueSelector.ts —— 20 种手法 + 情绪偏置（逻辑-only）
// - 返回字符串 `technique` 与 `hint`（可选），后端可忽略。
// - 不改端口/环境；上下文与情绪由上层注入。

import type { TechniqueName } from '../types/shared';

export type Seg = 'steady'|'build'|'fill'|'drop';
export interface EmotionInput { energy:number; valence:number; arousal:number; }
export interface TechContext {
  bpmFrom: number; bpmTo: number;
  keyFrom?: string; keyTo?: string;
  segment?: Seg;
  vocality?: number;
  simpleHeadTail?: boolean;
  dropoutRate?: number;
  recentErrors?: number;
  emotion?: EmotionInput;
}

export interface TechniqueHint {
  beats?: number;
  eq?: { low?: number; mid?: number; hi?: number };
  filter?: { type: 'HPF'|'LPF'; startHz:number; endHz:number; Q?:number };
  fx?: { delay?: number; reverb?: number; gate?: number; noise?: number };
  loop?: { bars?: number; active?: boolean };
  actions?: Array<'bass_kill'|'backspin'|'brake'|'double_drop_cue'|'duck_sidechain'>;
  safety?: { compatibleKey?: boolean; allowVocalFx?: boolean };
  hintVersion?: string;
}
export interface TechniqueDecision { technique: TechniqueName; hint: TechniqueHint; reason: string[]; }

const HVER = 'techniques-v1';
const clamp01 = (x:number)=> Math.max(0, Math.min(1, x));
const camelotCompat = (a?:string,b?:string) => {
  if(!a || !b) return true; if(a===b) return true;
  const rx=/(\d+)([AB])/i; const ma=rx.exec(a||''); const mb=rx.exec(b||'');
  if(!ma||!mb) return false; const na=+ma[1], nb=+mb[1];
  if(ma[2]===mb[2] && (Math.abs(na-nb)===1 || Math.abs(na-nb)===11)) return true;
  return false;
};
const compatR = (a?:string,b?:string)=> camelotCompat(a,b) ? 'key:compatible' : 'key:incompatible';

// Hint factories（20）
const T = {
  simple_head_tail: (beats=16)=>({ beats, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} }),
  bass_swap: (beats=24)=>({ beats, eq:{low:-6}, actions:['bass_kill'], hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} }),
  long_layer_24: ()=>({ beats:24, eq:{low:-2,mid:-1}, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} }),
  long_layer_32: ()=>({ beats:32, eq:{low:-2,mid:-2}, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} }),
  phrase_cut_16: ()=>({ beats:16, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} }),
  mid_scoop_cross: ()=>({ beats:24, eq:{mid:-6}, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} }),
  hat_carry: ()=>({ beats:16, eq:{hi:+2}, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} }),
  percussion_tease: ()=>({ beats:12, eq:{mid:+1,hi:+1}, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} }),
  hp_sweep_in: ()=>({ beats:16, filter:{type:'HPF',startHz:220,endHz:30,Q:0.7}, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} }),
  lp_sweep_out: ()=>({ beats:16, filter:{type:'LPF',startHz:18000,endHz:2000,Q:0.7}, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} }),
  delay_tail_1_2: ()=>({ beats:8, fx:{delay:0.3}, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} }),
  reverb_wash: ()=>({ beats:12, fx:{reverb:0.35}, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} }),
  loop_roll_4: ()=>({ beats:8, loop:{bars:1,active:true}, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} }),
  backspin_safe: ()=>({ beats:4, actions:['backspin'], hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:false} }),
  brake_fx: ()=>({ beats:4, actions:['brake'], hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:false} }),
  double_drop_32: ()=>({ beats:32, actions:['double_drop_cue'], hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:false} }),
  stutter_gate: ()=>({ beats:8, fx:{gate:0.3}, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:false} }),
  kick_replace: ()=>({ beats:16, actions:['bass_kill'], eq:{low:-9}, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} }),
  bass_duck_side: ()=>({ beats:16, actions:['duck_sidechain'], hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} }),
  noise_riser_cross: ()=>({ beats:12, fx:{noise:0.3}, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} }),
} as const;

export function techniqueHintOf(name: TechniqueName): TechniqueHint {
  const f = (T as any)[name]; return f ? f() : { hintVersion:HVER };
}

export function chooseTechnique(ctx: TechContext): TechniqueDecision {
  const reason: string[] = [];

  // 安全优先级 1：simpleHeadTail
  if (ctx.simpleHeadTail) return { technique:'simple_head_tail', hint:T.simple_head_tail(16), reason:['simpleHeadTail=true'] };

  // 安全优先级 2：网络/错误保守
  if ((ctx.dropoutRate||0) > 0.05 || (ctx.recentErrors||0) > 0) {
    reason.push('instability → conservative');
    return { technique:'bass_swap', hint:T.bass_swap(24), reason };
  }

  const bpmT = ctx.bpmTo || 128;
  const slow = bpmT <= 128;
  const fast = bpmT >= 140;
  const compat = camelotCompat(ctx.keyFrom, ctx.keyTo);
  const vocal = (ctx.vocality||0) > 0.2;
  reason.push(compatR(ctx.keyFrom, ctx.keyTo));
  if (vocal) reason.push('vocal:present');

  // 段落优先
  switch(ctx.segment){
    case 'build':
      if (slow) return { technique:'long_layer_32', hint:T.long_layer_32(), reason:[...reason,'build+slow'] };
      return { technique:'hp_sweep_in', hint:T.hp_sweep_in(), reason:[...reason,'build'] };
    case 'fill':
      if (!vocal) return { technique:'stutter_gate', hint:T.stutter_gate(), reason:[...reason,'fill+noVocal'] };
      return { technique:'mid_scoop_cross', hint:T.mid_scoop_cross(), reason:[...reason,'fill+vocal'] };
    case 'drop':
      if (fast && compat) return { technique:'double_drop_32', hint:T.double_drop_32(), reason:[...reason,'drop+fast+compat'] };
      return { technique:'phrase_cut_16', hint:T.phrase_cut_16(), reason:[...reason,'drop'] };
    case 'steady':
    default:
      break;
  }

  // 速度导向
  if (slow)  return { technique:'long_layer_24', hint:T.long_layer_24(), reason:[...reason,'slow'] };
  if (fast)  return { technique:'phrase_cut_16', hint:T.phrase_cut_16(), reason:[...reason,'fast'] };

  // 常规
  if (!vocal && compat) return { technique:'hat_carry', hint:T.hat_carry(), reason:[...reason,'compat+noVocal'] };
  if (!compat)          return { technique:'mid_scoop_cross', hint:T.mid_scoop_cross(), reason:[...reason,'incompatibleKey'] };

  const base = { technique:'bass_swap' as TechniqueName, hint:T.bass_swap(24), reason:[...reason,'default'] };
  return applyEmotionBias(base, ctx);
}

// 情绪偏置（不改变安全线）
function applyEmotionBias(base: TechniqueDecision, ctx: TechContext): TechniqueDecision {
  const e = ctx.emotion; if (!e) return base;
  const reason = [...base.reason];

  if (e.arousal >= 0.7 && (base.technique === 'long_layer_24' || base.technique === 'long_layer_32')) {
    reason.push('emotion:arousal↑ → phrase_cut_16');
    return { technique:'phrase_cut_16', hint:T.phrase_cut_16(), reason };
  }
  if (e.energy <= 0.35 && base.technique === 'phrase_cut_16') {
    reason.push('emotion:energy↓ → long_layer_24');
    return { technique:'long_layer_24', hint:T.long_layer_24(), reason };
  }
  if (e.valence >= 0.2 && ctx.segment === 'drop' && (ctx.bpmTo||0) >= 138 && camelotCompat(ctx.keyFrom, ctx.keyTo)) {
    if (base.technique !== 'double_drop_32') {
      reason.push('emotion:valence↑+drop → double_drop_32');
      return { technique:'double_drop_32', hint:T.double_drop_32(), reason };
    }
  }
  if (e.valence <= -0.2 || (ctx.vocality||0) > 0.2) {
    const risky: TechniqueName[] = ['backspin_safe','brake_fx','stutter_gate'];
    if (risky.includes(base.technique)) {
      reason.push('emotion:valence↓|vocal → mid_scoop_cross');
      return { technique:'mid_scoop_cross', hint:T.mid_scoop_cross(), reason };
    }
  }
  return base;
}
