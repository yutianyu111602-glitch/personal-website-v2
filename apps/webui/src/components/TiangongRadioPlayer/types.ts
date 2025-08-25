// 电台播放器类型定义
export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  bpm: number;
  key?: string;
  genre?: string;
  path?: string;
  type: string;
  playCount: number;
}

// 吸附边缘枚举
export enum SnapEdge {
  None = 'none',
  Left = 'left',
  Right = 'right',
  Top = 'top',
  Bottom = 'bottom'
}

// 吸附状态枚举
export enum SnapState {
  Free = 'free',       // 自由状态，未吸附
  Snapped = 'snapped', // 已吸附到边缘
  Expanded = 'expanded' // 从吸附状态展开
}

// 简化的状态接口
export interface RadioState {
  // 🎯 位置和吸附状态
  position: { x: number; y: number };
  snapState: SnapState;
  snappedEdge: SnapEdge;
  freePosition: { x: number; y: number };
  
  // 🎵 播放状态 - 通过事件系统获取
  isPlaying: boolean;
  volume: number;
  currentTrack: AudioTrack | null;
  
  // 🎼 歌单信息 - 通过事件系统获取
  currentPlaylist: AudioTrack[];
  currentTrackIndex: number;
  
  // 📊 音频特征数据 - 通过事件系统获取
  bpm: number | null;
  energy: number | null;
  
  // 🎯 AidjMix智能推荐状态
  aiRecommendation: {
    technique: string;
    hint?: any;
    reason: string[];
  } | null;
  aiStatus: 'idle' | 'analyzing' | 'recommending' | 'error';
  
  // 🧲 UI状态
  isLoading: boolean;
  playerDims: { width: number; height: number };
}

// 组件属性接口
export interface TiangongRadioPlayerProps {
  language: string;
  syncActive?: boolean;
  onSyncToggle?: () => void;
  onClose?: () => void;
  autoPlayOnMount?: boolean;
  preloadOnly?: boolean;
}

// AI反馈组件属性
export interface AIFeedbackSectionProps {
  language?: string;
  className?: string;
}

// 切歌手法选择器属性
export interface TechniqueSelectorProps {
  className?: string;
  language?: string;
}

// 检测点系统类型定义
export interface DetectionPoint {
  id: string;                    // 检测点唯一标识
  name: string;                  // 检测点名称
  description: string;           // 检测点描述
  frequency: {                   // 频率范围配置
    min: number;                 // 最小频率 (Hz)
    max: number;                 // 最大频率 (Hz)
    center: number;              // 中心频率 (Hz)
  };
  threshold: {                   // 触发阈值配置
    value: number;               // 触发值 (0-1)
    hysteresis: number;          // 滞后值，防止抖动
    smoothing: number;           // 平滑系数 (0-1)
  };
  decay: {                       // 衰减配置
    attack: number;              // 攻击时间 (ms)
    release: number;             // 释放时间 (ms)
    sustain: number;             // 持续值 (0-1)
  };
  visualEffect: {                // 视觉效果配置
    type: 'color' | 'intensity' | 'motion' | 'texture';
    parameter: string;           // 效果参数名
    minValue: number;            // 最小值
    maxValue: number;            // 最大值
    curve: 'linear' | 'exponential' | 'logarithmic';
  };
  enabled: boolean;              // 是否启用
  priority: number;              // 优先级 (1-10)
  category: 'frequency' | 'structure' | 'emotion' | 'custom';
}

// 检测点状态
export interface DetectionPointState {
  pointId: string;               // 检测点ID
  isActive: boolean;             // 是否激活
  intensity: number;             // 当前强度 (0-1)
  lastTriggered: number;         // 最后触发时间
  triggerCount: number;          // 触发次数
  averageIntensity: number;      // 平均强度
  peakIntensity: number;         // 峰值强度
}

// 检测点配置
export interface DetectionConfig {
  points: DetectionPoint[];      // 检测点列表
  globalThreshold: number;       // 全局阈值
  smoothingFactor: number;       // 全局平滑系数
  updateInterval: number;        // 更新间隔 (ms)
  enableVisualization: boolean;  // 是否启用可视化
  enableLogging: boolean;        // 是否启用日志
}

// 检测点事件
export interface DetectionEvent {
  type: 'trigger' | 'release' | 'update' | 'error';
  pointId: string;
  timestamp: number;
  intensity: number;
  data?: any;
}

// 检测点管理器状态
export interface DetectionManagerState {
  config: DetectionConfig;
  points: Record<string, DetectionPointState>;
  isEnabled: boolean;
  lastUpdate: number;
  errorCount: number;
  performanceMetrics: {
    averageUpdateTime: number;
    maxUpdateTime: number;
    updateCount: number;
  };
}
