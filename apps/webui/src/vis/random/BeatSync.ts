
/**
 * BeatSync.ts — 节拍相位与触发工具
 */
export type BeatState = { bpm:number; startMs:number; };
export function phase(nowMs:number, st:BeatState){ // 0..1
  const beatDur = 60000 / Math.max(1, st.bpm);
  return ((nowMs - st.startMs) % beatDur) / beatDur;
}
export function nearStep(ph:number, steps=16, tol=0.02){
  const s = Math.round(ph*steps)/steps; return Math.abs(ph - s) < tol;
}
export function barPhase(nowMs:number, st:BeatState, beatsPerBar=4){
  const beatDur = 60000 / Math.max(1, st.bpm);
  const barDur = beatDur*beatsPerBar;
  return ((nowMs - st.startMs) % barDur) / barDur;
}
