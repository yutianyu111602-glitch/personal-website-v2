/**
 * BeatSync.ts — 节拍相位工具
 * ------------------------------------------------------------
 * [FOR CURSOR / 给 Cursor]
 *   Expose phase()/nearStep()/barPhase(). Drive triggers with audio-time.
 *
 * [FOR HUMANS / 给人看]
 *   把视觉事件卡在 1/16、1/32 的拍点上，过渡自然。
 */

export type BeatState={ bpm:number; startMs:number; };
export const phase=(nowMs:number, st:BeatState)=>{ const beat=60000/Math.max(1,st.bpm); return ((nowMs-st.startMs)%beat)/beat; };
export const nearStep=(ph:number,steps=16,tol=0.02)=>{ const s=Math.round(ph*steps)/steps; return Math.abs(ph-s)<tol; };
export const barPhase=(nowMs:number,st:BeatState,beatsPerBar=4)=>{ const beat=60000/Math.max(1,st.bpm); const bar=beat*beatsPerBar; return ((nowMs-st.startMs)%bar)/bar; };
