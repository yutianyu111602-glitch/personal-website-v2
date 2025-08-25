// src/presets.ts — Techno 速度/风格预设（TS API）
import { WEIGHTS, LIMITS, TRANSITION } from './config.js';

export const PRESETS = {
  deep_minimal: {
    limits: { bpmSoftLo: 122, bpmSoftHi: 126, bpmIdeal: 124, bpmTol: 3, maxStretchPct: 4 },
    transition: { technoCrossfadeBeats: 32 },
    weights: { vocal: 0.07, energy: 0.18 },
    notes: '长铺垫、滤波渐入、避免断崖式能量变化'
  },
  classic: {
    limits: { bpmSoftLo: 126, bpmSoftHi: 130, bpmIdeal: 128, bpmTol: 4, maxStretchPct: 6 },
    transition: { technoCrossfadeBeats: 24 },
    weights: {},
    notes: '默认策略：谐波/能量平滑 + 24拍 crossfade + 低频交接'
  },
  peak_warehouse: {
    limits: { bpmSoftLo: 128, bpmSoftHi: 134, bpmIdeal: 130, bpmTol: 3, maxStretchPct: 5 },
    transition: { technoCrossfadeBeats: 24 },
    weights: { energy: 0.25, vocal: 0.04 },
    notes: '更紧凑、更强能量推进；在短语边界切换'
  },
  hard_techno: {
    limits: { bpmSoftLo: 140, bpmSoftHi: 150, bpmIdeal: 145, bpmTol: 4, maxStretchPct: 3 },
    transition: { technoCrossfadeBeats: 12 },
    weights: { tempo: 0.35, energy: 0.25, vocal: 0.03 },
    notes: '果断切换：短 crossfade 或直接 bass kill → swap（建议）'
  },
  hypnotic: {
    limits: { bpmSoftLo: 130, bpmSoftHi: 134, bpmIdeal: 132, bpmTol: 2, maxStretchPct: 5 },
    transition: { technoCrossfadeBeats: 32 },
    weights: { energy: 0.18, phrase: 0.12 },
    notes: '超长层叠、慢变'
  },
} as const;

export function applyPreset(name: keyof typeof PRESETS = 'classic'){
  const cfg = PRESETS[name]; if (!cfg) return;
  Object.assign(LIMITS, cfg.limits);
  Object.assign(TRANSITION, cfg.transition);
  Object.assign(WEIGHTS, cfg.weights);
}
