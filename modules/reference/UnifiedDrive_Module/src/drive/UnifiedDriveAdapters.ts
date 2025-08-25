
/**
 * UnifiedDriveAdapters.ts — 适配层：多源 → E/A/R
 * ------------------------------------------------------------
 * [FOR CURSOR / 给 Cursor]
 *   - 封装归一化与权重合成，便于替换。
 *   - 不读 UI；输入来自你的音频/情绪/节拍服务。
 *
 * [FOR HUMANS / 给人看]
 *   - 这里是把“多信号”变成三维向量的配方；实际项目请按你手头的数据修正权重。
 */
import { UnifiedVector } from "../types/BlendTypes";

export type Mood = { energy:number; valence:number; arousal:number };
export type Audio = { rms:number; flux:number; crest:number; centroid:number; beatConf:number };
export type Stage = 'idle'|'build'|'drop'|'fill';

const L=(x:number)=> Math.min(1,Math.max(0,x));

/** 将三源合成为 E/A/R，返回统一向量 */
export function makeUnifiedVector(mood:Mood, audio:Audio, stage:Stage): UnifiedVector {
  const E = L( 0.55*mood.energy + 0.30*audio.rms + 0.15*(stage==='drop'?1:stage==='build'?0.6:0) );
  const A = L( 0.50*mood.arousal + 0.35*audio.flux + 0.15*audio.crest );
  const R = L( 0.60*(1-audio.flux) + 0.25*(stage==='idle'||stage==='build'?1:0.2) + 0.15*(1-Math.abs(mood.valence)) );
  return { E, A, R };
}
