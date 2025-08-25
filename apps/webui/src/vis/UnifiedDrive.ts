/**
 * UnifiedDrive.ts - 统一驱动算法
 * 将情绪、音频特征和音乐信息统一到一个驱动向量中
 */

import type { Mood } from './LiquidMetalConductor';
import type { AudioFeatures } from './AudioReactive';

export type Segment = 'build' | 'drop' | 'fill' | 'steady' | 'break';

export type NowPlaying = {
  title?: string;
  artist?: string;
  bpm?: number;
  segment?: Segment;
  startedAt?: number;
  trackId?: string;
};

export type UnifiedDriveVector = {
  E: number; // Energy 能量 (0..1)
  A: number; // Arousal 唤醒度 (0..1)
  V: number; // Valence 情感效价 (-1..1)
};

/**
 * 统一驱动算法 - 将多维输入统一为三维驱动向量
 * 这是TGR_FullStack_VisualSuite的核心创新
 */
export function unifyDrive(
  mood: Mood,
  audioFeatures: AudioFeatures,
  nowPlaying?: NowPlaying
): UnifiedDriveVector {
  // BPM归一化
  const bpmNormalized = nowPlaying?.bpm 
    ? Math.min(1, Math.max(0, nowPlaying.bpm / 180)) 
    : 0.65;
  
  // 段落增强系数
  const segmentBoost = 
    nowPlaying?.segment === 'build' ? 0.10 :
    nowPlaying?.segment === 'drop' ? 0.20 :
    nowPlaying?.segment === 'fill' ? 0.15 :
    nowPlaying?.segment === 'break' ? -0.05 : 
    0.0;
  
  // 统一能量计算
  const E = Math.min(1, Math.max(0, 
    0.45 * mood.energy + 
    0.25 * bpmNormalized + 
    0.20 * audioFeatures.rms + 
    0.10 * segmentBoost
  ));
  
  // 统一唤醒度计算
  const A = Math.min(1, Math.max(0, 
    0.50 * mood.arousal + 
    0.30 * audioFeatures.flux + 
    0.20 * audioFeatures.crest
  ));
  
  // 统一情感效价计算
  const V = Math.max(-1, Math.min(1, 
    mood.valence + 
    0.2 * (audioFeatures.presence - audioFeatures.lowMid)
  ));
  
  return { E, A, V };
}

/**
 * 段落检测 - 根据音乐结构检测当前段落
 */
export type StepState = {
  bar: number;
  step: number;
  steps: number;
  phaseInPhrase: number;
  phraseBars: number;
};

export function nextStep(state: StepState): void {
  const newStep = (state.step + 1) % state.steps;
  state.step = newStep;
  if (newStep === 0) {
    state.bar++;
  }
  state.phaseInPhrase = state.bar % state.phraseBars;
}

export function segmentFromStep(state: StepState): Segment {
  if (state.phaseInPhrase === 0 && state.step === 0) return 'drop';
  if (state.phaseInPhrase === state.phraseBars - 1) return 'fill';
  if (state.phaseInPhrase >= state.phraseBars - 2) return 'build';
  return 'steady';
}
