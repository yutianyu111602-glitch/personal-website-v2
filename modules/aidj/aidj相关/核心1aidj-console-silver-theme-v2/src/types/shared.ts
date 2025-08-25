// 协议与共享类型 —— 与后端/事件总线一致（保持最小必要字段）

export type PresetName = 'deep_minimal' | 'classic' | 'peak_warehouse' | 'hard_techno' | 'hypnotic';

export type TechniqueName = 'bass_swap' | 'long_layer_24' | 'phrase_cut_16' | 'simple_head_tail';

export interface EmotionState {
  /** 0..1 */
  energy: number;
  /** -1..1（也可用 0..1；此处使用 -1..1 以兼容旧文献） */
  valence: number;
  /** 0..1 */
  arousal: number;
  /** 当前采用的预设（只做展示） */
  preset?: PresetName;
}

export interface RadioParams {
  stationName?: string;
  uptimeSec?: number;
  listeners?: number;
  dropoutRate?: number; // 0..1
  avgBpm?: number;
}

export interface NowPlaying {
  title?: string;
  artist?: string;
  bpm?: number;
  keyCamelot?: string;
  startedAt?: number;
  trackId?: string;
  segment?: 'steady' | 'build' | 'fill' | 'drop';
}

export interface AutoPlanMeta {
  count?: number;
  minutes?: number;
  preset?: PresetName;
  technique?: TechniqueName;
}

export interface RotationSelection {
  preset: PresetName;
  simpleHeadTail: boolean;
  reason: string[];
}

export type TrackFeature = {
  id: string;
  durationSec: number;
  bpm: number;
  keyCamelot: string;
  title?: string;
  artist?: string;
  path: string;
  cueInSec?: number;
  cueOutSec?: number;
  energyCurve?: number[];
  downbeats?: number[];
  vocality?: number;
};
