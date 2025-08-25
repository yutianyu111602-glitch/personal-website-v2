// 类型契约（与现有约定保持最小一致）

export type PresetName = 'deep_minimal' | 'classic' | 'peak_warehouse' | 'hard_techno' | 'hypnotic';

export type TechniqueName =
  | 'bass_swap' | 'long_layer_24' | 'phrase_cut_16' | 'simple_head_tail'
  | 'long_layer_32' | 'mid_scoop_cross' | 'hat_carry' | 'percussion_tease'
  | 'hp_sweep_in' | 'lp_sweep_out' | 'delay_tail_1_2' | 'reverb_wash'
  | 'loop_roll_4' | 'backspin_safe' | 'brake_fx' | 'double_drop_32'
  | 'stutter_gate' | 'kick_replace' | 'bass_duck_side' | 'noise_riser_cross';

export interface EmotionState { energy: number; valence: number; arousal: number; preset?: PresetName; }
export interface NowPlaying { title?: string; artist?: string; bpm?: number; keyCamelot?: string; startedAt?: number; segment?: 'steady'|'build'|'fill'|'drop'; }
export interface RadioTelemetry { listeners?: number; dropoutRate?: number; recentErrors?: number; avgBpm?: number; simpleHeadTail?: boolean; }
