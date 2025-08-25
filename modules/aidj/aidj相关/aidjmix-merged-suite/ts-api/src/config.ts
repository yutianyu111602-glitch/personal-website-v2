export const WEIGHTS = { key: 0.35, tempo: 0.30, energy: 0.20, phrase: 0.10, vocal: 0.05 };
export const LIMITS = {
  maxStretchPct: Number(process.env.MAX_STRETCH_PCT ?? 6),
  targetMinutes: Number(process.env.TARGET_MINUTES ?? 60),
  beamWidth: Number(process.env.BEAM_WIDTH ?? 24),
  bpmIdeal: 128, bpmTol: 4, bpmSoftLo: 124, bpmSoftHi: 136,
};
export const TRANSITION = { defaultCrossfadeBeats: 16, technoCrossfadeBeats: 24 };
