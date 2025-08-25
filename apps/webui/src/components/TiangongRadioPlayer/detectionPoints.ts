/**
 * 检测点配置文件
 * 定义各种频段和音乐结构的检测点
 */

import type { DetectionPoint } from './types';

// 频段检测点配置
export const FREQUENCY_DETECTION_POINTS: DetectionPoint[] = [
  {
    id: 'kick_100hz',
    name: '100Hz Kick检测点',
    description: '检测100Hz附近的低频Kick鼓，用于触发低频视觉效果',
    frequency: {
      min: 80,
      max: 120,
      center: 100
    },
    threshold: {
      value: 0.35,
      hysteresis: 0.05,
      smoothing: 0.8
    },
    decay: {
      attack: 50,
      release: 200,
      sustain: 0.7
    },
    visualEffect: {
      type: 'intensity',
      parameter: 'bassIntensity',
      minValue: 0.0,
      maxValue: 1.0,
      curve: 'exponential'
    },
    enabled: true,
    priority: 10,
    category: 'frequency'
  },
  {
    id: 'synth_mid',
    name: '中频合成器检测点',
    description: '检测1-2.5kHz中频合成器音色，用于触发中频纹理效果',
    frequency: {
      min: 1000,
      max: 2500,
      center: 1750
    },
    threshold: {
      value: 0.25,
      hysteresis: 0.03,
      smoothing: 0.9
    },
    decay: {
      attack: 100,
      release: 300,
      sustain: 0.6
    },
    visualEffect: {
      type: 'texture',
      parameter: 'midTexture',
      minValue: 0.0,
      maxValue: 1.0,
      curve: 'linear'
    },
    enabled: true,
    priority: 8,
    category: 'frequency'
  },
  {
    id: 'percussion_high',
    name: '高频打击乐检测点',
    description: '检测6-12kHz高频打击乐，用于触发高频高光效果',
    frequency: {
      min: 6000,
      max: 12000,
      center: 9000
    },
    threshold: {
      value: 0.20,
      hysteresis: 0.02,
      smoothing: 0.95
    },
    decay: {
      attack: 30,
      release: 150,
      sustain: 0.5
    },
    visualEffect: {
      type: 'motion',
      parameter: 'highMotion',
      minValue: 0.0,
      maxValue: 1.0,
      curve: 'exponential'
    },
    enabled: true,
    priority: 6,
    category: 'frequency'
  }
];

// 音乐结构检测点配置
export const STRUCTURE_DETECTION_POINTS: DetectionPoint[] = [
  {
    id: 'segment_boundary',
    name: '段落边界检测点',
    description: '检测音乐段落边界，用于触发段落切换效果',
    frequency: {
      min: 0,
      max: 0,
      center: 0
    },
    threshold: {
      value: 0.5,
      hysteresis: 0.1,
      smoothing: 0.7
    },
    decay: {
      attack: 200,
      release: 500,
      sustain: 0.8
    },
    visualEffect: {
      type: 'color',
      parameter: 'segmentColor',
      minValue: 0.0,
      maxValue: 1.0,
      curve: 'linear'
    },
    enabled: true,
    priority: 9,
    category: 'structure'
  },
  {
    id: 'emotion_change',
    name: '情绪变化检测点',
    description: '检测情绪状态变化，用于触发情绪相关视觉效果',
    frequency: {
      min: 0,
      max: 0,
      center: 0
    },
    threshold: {
      value: 0.3,
      hysteresis: 0.05,
      smoothing: 0.8
    },
    decay: {
      attack: 300,
      release: 800,
      sustain: 0.6
    },
    visualEffect: {
      type: 'intensity',
      parameter: 'emotionIntensity',
      minValue: 0.0,
      maxValue: 1.0,
      curve: 'logarithmic'
    },
    enabled: true,
    priority: 7,
    category: 'emotion'
  },
  {
    id: 'dynamic_range',
    name: '动态范围检测点',
    description: '检测音频动态范围变化，用于触发动态视觉效果',
    frequency: {
      min: 0,
      max: 0,
      center: 0
    },
    threshold: {
      value: 0.4,
      hysteresis: 0.08,
      smoothing: 0.85
    },
    decay: {
      attack: 150,
      release: 400,
      sustain: 0.7
    },
    visualEffect: {
      type: 'motion',
      parameter: 'dynamicMotion',
      minValue: 0.0,
      maxValue: 1.0,
      curve: 'exponential'
    },
    enabled: true,
    priority: 5,
    category: 'structure'
  }
];

// 默认检测点配置
export const DEFAULT_DETECTION_CONFIG = {
  points: [...FREQUENCY_DETECTION_POINTS, ...STRUCTURE_DETECTION_POINTS],
  globalThreshold: 0.3,
  smoothingFactor: 0.8,
  updateInterval: 16, // 60fps
  enableVisualization: true,
  enableLogging: true
};

// 检测点预设配置
export const DETECTION_PRESETS = {
  techno: {
    name: 'Techno专用检测点',
    description: '针对Techno音乐优化的检测点配置',
    points: FREQUENCY_DETECTION_POINTS.filter(p => p.category === 'frequency'),
    globalThreshold: 0.25,
    smoothingFactor: 0.9,
    updateInterval: 16
  },
  ambient: {
    name: 'Ambient专用检测点',
    description: '针对Ambient音乐优化的检测点配置',
    points: STRUCTURE_DETECTION_POINTS.filter(p => p.category === 'emotion'),
    globalThreshold: 0.4,
    smoothingFactor: 0.95,
    updateInterval: 32
  },
  custom: {
    name: '自定义检测点',
    description: '用户自定义的检测点配置',
    points: [],
    globalThreshold: 0.3,
    smoothingFactor: 0.8,
    updateInterval: 16
  }
};
