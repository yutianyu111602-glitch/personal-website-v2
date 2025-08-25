import { WEIGHTS, LIMITS, TRANSITION } from './config.js';
export const PRESETS = {
  deep_minimal: { limits:{ bpmSoftLo:122,bpmSoftHi:126,bpmIdeal:124,bpmTol:3,maxStretchPct:4 }, transition:{ technoCrossfadeBeats:32 }, weights:{ vocal:0.07, energy:0.18 } },
  classic: { limits:{ bpmSoftLo:126,bpmSoftHi:130,bpmIdeal:128,bpmTol:4,maxStretchPct:6 }, transition:{ technoCrossfadeBeats:24 }, weights:{} },
  peak_warehouse: { limits:{ bpmSoftLo:128,bpmSoftHi:134,bpmIdeal:130,bpmTol:3,maxStretchPct:5 }, transition:{ technoCrossfadeBeats:24 }, weights:{ energy:0.25, vocal:0.04 } },
  hard_techno: { limits:{ bpmSoftLo:140,bpmSoftHi:150,bpmIdeal:145,bpmTol:4,maxStretchPct:3 }, transition:{ technoCrossfadeBeats:12 }, weights:{ tempo:0.35, energy:0.25, vocal:0.03 } },
  hypnotic: { limits:{ bpmSoftLo:130,bpmSoftHi:134,bpmIdeal:132,bpmTol:2,maxStretchPct:5 }, transition:{ technoCrossfadeBeats:32 }, weights:{ energy:0.18, phrase:0.12 } },
} as const;
export function applyPreset(name: keyof typeof PRESETS = 'classic'){ const cfg = PRESETS[name]; if(!cfg) return;
  Object.assign(LIMITS, cfg.limits); Object.assign(TRANSITION, cfg.transition); Object.assign(WEIGHTS, cfg.weights); }
