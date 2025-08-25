// src/console/techniqueSelector.ts
// Logic-only transition technique selector for AIDJ/djmix.
// - Primary contract: returns a TechniqueName (string) that your backend already accepts.
// - Secondary (optional): returns a `hint` object with parameters; backend may ignore.
// - Safe with your existing request flow: AidjPlaylistClient(requestAutoPlaylist) includes `{ technique }`.
// - ZERO server/port changes. Only front-end logic + docs.
//
// Version: techniques-v1
// Updated: 2025-08-24 20:09:17

import type { TechniqueName } from "../types/shared";

export type Seg = 'steady'|'build'|'fill'|'drop';

export interface TechContext {
  bpmFrom: number;
  bpmTo: number;
  keyFrom?: string;   // Camelot (e.g., '8A', '9B')
  keyTo?: string;
  segment?: Seg;
  vocality?: number;  // 0..1
  simpleHeadTail?: boolean;
  dropoutRate?: number; // 0..1
  recentErrors?: number; // >0 means conservative
}

export interface TechniqueHint {
  // These are advisory parameters ONLY; your backend can ignore safely.
  beats?: number; // 8/16/24/32 etc.
  eq?: { low?: number; mid?: number; hi?: number }; // dB values (negative = cut)
  filter?: { type: 'HPF'|'LPF'; startHz: number; endHz: number; Q?: number };
  fx?: { delay?: number; reverb?: number; gate?: number; noise?: number };
  loop?: { bars?: number; active?: boolean };
  actions?: Array<'bass_kill'|'backspin'|'brake'|'double_drop_cue'|'duck_sidechain'>;
  safety?: { compatibleKey?: boolean; allowVocalFx?: boolean };
  hintVersion?: string;
}

export interface TechniqueDecision {
  technique: TechniqueName;
  hint: TechniqueHint;
  reason: string[];
}

const HVER = "techniques-v1";

// ---------- Helpers ----------
const clamp01 = (x:number)=> Math.max(0, Math.min(1, x));
const camelotCompat = (a?:string,b?:string) => {
  if(!a || !b) return true;
  if(a===b) return true;
  const rx=/^(\d+)([AB])$/i; const ma=rx.exec(a); const mb=rx.exec(b);
  if(!ma||!mb) return false;
  const na=parseInt(ma[1],10), nb=parseInt(mb[1],10);
  if(ma[2]===mb[2] && (Math.abs(na-nb)===1 || Math.abs(na-nb)===11)) return true;
  return false;
};

const compatReason = (a?:string,b?:string)=> camelotCompat(a,b) ? "key:compatible" : "key:incompatible";

// ---------- Technique factories (20) ----------
function T_simple_head_tail(beats=16): TechniqueHint {
  return { beats, hintVersion: HVER, actions: [], safety:{compatibleKey:true, allowVocalFx:true} };
}

function T_bass_swap(beats=24): TechniqueHint {
  return { beats, eq:{ low:-6, mid:0, hi:0 }, actions:['bass_kill'], hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} };
}

function T_long_layer_24(): TechniqueHint {
  return { beats:24, eq:{ low:-2, mid:-1, hi:0 }, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} };
}
function T_long_layer_32(): TechniqueHint {
  return { beats:32, eq:{ low:-2, mid:-2, hi:0 }, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} };
}

function T_phrase_cut_16(): TechniqueHint {
  return { beats:16, hintVersion:HVER, actions:[], safety:{compatibleKey:true, allowVocalFx:true} };
}

function T_mid_scoop_cross(): TechniqueHint {
  return { beats:24, eq:{ mid:-6 }, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} };
}

function T_hat_carry(): TechniqueHint {
  return { beats:16, eq:{ hi:+2 }, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} };
}

function T_percussion_tease(): TechniqueHint {
  return { beats:12, eq:{ mid:+1, hi:+1 }, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} };
}

function T_hp_sweep_in(): TechniqueHint {
  return { beats:16, filter:{ type:'HPF', startHz:220, endHz:30, Q:0.7 }, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} };
}

function T_lp_sweep_out(): TechniqueHint {
  return { beats:16, filter:{ type:'LPF', startHz:18000, endHz:2000, Q:0.7 }, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} };
}

function T_delay_tail_1_2(): TechniqueHint {
  return { beats:8, fx:{ delay:0.3 }, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} };
}

function T_reverb_wash(): TechniqueHint {
  return { beats:12, fx:{ reverb:0.35 }, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} };
}

function T_loop_roll_4(): TechniqueHint {
  return { beats:8, loop:{ bars:1, active:true }, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} };
}

function T_backspin_safe(): TechniqueHint {
  return { beats:4, actions:['backspin'], hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:false} };
}

function T_brake_fx(): TechniqueHint {
  return { beats:4, actions:['brake'], hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:false} };
}

function T_double_drop_32(): TechniqueHint {
  return { beats:32, actions:['double_drop_cue'], hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:false} };
}

function T_stutter_gate(): TechniqueHint {
  return { beats:8, fx:{ gate:0.3 }, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:false} };
}

function T_kick_replace(): TechniqueHint {
  return { beats:16, actions:['bass_kill'], eq:{ low:-9 }, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} };
}

function T_bass_duck_side(): TechniqueHint {
  return { beats:16, actions:['duck_sidechain'], hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} };
}

function T_noise_riser_cross(): TechniqueHint {
  return { beats:12, fx:{ noise:0.3 }, hintVersion:HVER, safety:{compatibleKey:true, allowVocalFx:true} };
}

// Map names to factories for easier overrides if needed
const HINT_MAP: Record<TechniqueName, ()=>TechniqueHint> = {
  'simple_head_tail': ()=> T_simple_head_tail(16),
  'bass_swap': T_bass_swap,
  'long_layer_24': T_long_layer_24,
  'phrase_cut_16': T_phrase_cut_16,
  'long_layer_32': T_long_layer_32,
  'mid_scoop_cross': T_mid_scoop_cross,
  'hat_carry': T_hat_carry,
  'percussion_tease': T_percussion_tease,
  'hp_sweep_in': T_hp_sweep_in,
  'lp_sweep_out': T_lp_sweep_out,
  'delay_tail_1_2': T_delay_tail_1_2,
  'reverb_wash': T_reverb_wash,
  'loop_roll_4': T_loop_roll_4,
  'backspin_safe': T_backspin_safe,
  'brake_fx': T_brake_fx,
  'double_drop_32': T_double_drop_32,
  'stutter_gate': T_stutter_gate,
  'kick_replace': T_kick_replace,
  'bass_duck_side': T_bass_duck_side,
  'noise_riser_cross': T_noise_riser_cross,
};

// ---------- The selector ----------
export function chooseTechnique(ctx: TechContext): TechniqueDecision {
  const reason: string[] = [];

  // Global safety
  if (ctx.simpleHeadTail) {
    return { technique:'simple_head_tail', hint:T_simple_head_tail(16), reason:['simpleHeadTail=true'] };
  }
  if ((ctx.dropoutRate||0) > 0.05 || (ctx.recentErrors||0) > 0) {
    reason.push('instability → conservative');
    return { technique:'bass_swap', hint:T_bass_swap(24), reason };
  }

  const bpmTo = ctx.bpmTo || 128;
  const slow = bpmTo <= 128;
  const fast = bpmTo >= 140;
  const compat = camelotCompat(ctx.keyFrom, ctx.keyTo);
  const vocal = (ctx.vocality||0) > 0.2;
  reason.push(compatReason(ctx.keyFrom, ctx.keyTo));
  if (vocal) reason.push('vocal:present');

  // Segment priority
  switch(ctx.segment){
    case 'build':
      if (slow) return { technique:'long_layer_32', hint:T_long_layer_32(), reason:[...reason,'build+slow'] };
      return { technique:'hp_sweep_in', hint:T_hp_sweep_in(), reason:[...reason,'build'] };
    case 'fill':
      if (!vocal) return { technique:'stutter_gate', hint:T_stutter_gate(), reason:[...reason,'fill+noVocal'] };
      return { technique:'mid_scoop_cross', hint:T_mid_scoop_cross(), reason:[...reason,'fill+vocal'] };
    case 'drop':
      if (fast && compat) return { technique:'double_drop_32', hint:T_double_drop_32(), reason:[...reason,'drop+fast+compat'] };
      return { technique:'phrase_cut_16', hint:T_phrase_cut_16(), reason:[...reason,'drop'] };
    case 'steady':
    default:
      // fallthrough
      break;
  }

  // Speed
  if (slow)  return { technique:'long_layer_24', hint:T_long_layer_24(), reason:[...reason,'slow'] };
  if (fast)  return { technique:'phrase_cut_16', hint:T_phrase_cut_16(), reason:[...reason,'fast'] };

  // Common neutral
  if (!vocal && compat) return { technique:'hat_carry', hint:T_hat_carry(), reason:[...reason,'compat+noVocal'] };
  if (!compat)         return { technique:'mid_scoop_cross', hint:T_mid_scoop_cross(), reason:[...reason,'incompatibleKey'] };

  return { technique:'bass_swap', hint:T_bass_swap(24), reason:[...reason,'default'] };
}

// ---------- Utilities -----------
export function techniqueHintOf(name: TechniqueName): TechniqueHint {
  return (HINT_MAP[name] || (()=>({hintVersion:HVER})) )();
}
