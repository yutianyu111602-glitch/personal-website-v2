/**
 * 切歌手法类型定义
 * 支持20种手法的完整类型系统
 */

// 基础类型定义
export type TechniqueName = 
  // 基础切歌手法
  | 'simple_head_tail'
  | 'phrase_cut_16'
  | 'phrase_cut_32'
  | 'long_layer_24'
  | 'long_layer_32'
  
  // 高级切歌手法
  | 'double_drop_32'
  | 'triple_drop_48'
  | 'build_up_16'
  | 'build_up_32'
  | 'fill_bridge_8'
  
  // 特效切歌手法
  | 'backspin_safe'
  | 'brake_fx'
  | 'stutter_gate'
  | 'echo_fade'
  | 'filter_sweep'
  
  // 温和切歌手法
  | 'mid_scoop_cross'
  | 'high_pass_swap'
  | 'low_pass_swap'
  | 'volume_ride'
  | 'tempo_match';

// 段落类型
export type Segment = 'steady' | 'build' | 'fill' | 'drop';

// 情绪输入类型
export interface EmotionInput {
  energy: number;   // 0..1: 能量强度
  valence: number;  // -1..1: 效价（明亮/暗沉）
  arousal: number;  // 0..1: 唤醒度
}

// 技术上下文
export interface TechContext {
  bpmFrom: number;
  bpmTo: number;
  keyFrom?: string;
  keyTo?: string;
  segment?: Segment;
  vocality?: number;
  simpleHeadTail?: boolean;
  dropoutRate?: number;
  recentErrors?: number;
  emotion?: EmotionInput;
}

// 手法提示信息
export interface TechniqueHint {
  beats?: number;           // 拍数建议
  eq?: {                    // EQ建议
    low?: number;
    mid?: number;
    high?: number;
  };
  filter?: {                // 滤波建议
    type: 'lowpass' | 'highpass' | 'bandpass';
    frequency: number;
    resonance: number;
  };
  fx?: {                    // 特效建议
    reverb?: number;
    delay?: number;
    distortion?: number;
  };
  loop?: {                  // 循环建议
    length: number;
    crossfade: number;
  };
  action?: string;          // 动作建议
}

// 手法决策结果
export interface TechniqueDecision {
  technique: TechniqueName;
  hint: TechniqueHint;
  reason: string[];
}

// 手法配置
export interface TechniqueConfig {
  name: TechniqueName;
  description: string;
  minBpm: number;
  maxBpm: number;
  compatibleKeys: string[];
  safeForVocals: boolean;
  networkStability: 'high' | 'medium' | 'low';
  complexity: 'simple' | 'medium' | 'complex';
  energyBias: number;      // -1到1，情绪能量偏置
  valenceBias: number;     // -1到1，情绪效价偏置
  arousalBias: number;     // -1到1，情绪唤醒偏置
}

// 安全优先级枚举
export enum SafetyPriority {
  SIMPLE_HEAD_TAIL = 0,    // 最高优先级：simpleHeadTail
  NETWORK_STABILITY = 1,   // 网络稳定性
  KEY_COMPATIBILITY = 2,   // 调性兼容性
  VOCAL_SAFETY = 3,        // 人声安全
  EMOTION_BIAS = 4,        // 情绪偏置（最低优先级）
}
