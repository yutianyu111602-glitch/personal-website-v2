/**
 * 段落边界检测算法
 * 基于音乐结构和音频特征检测段落边界
 * 采用结构性好的设计，易于维护和扩展
 */

import { UnifiedEventBus } from '../events/UnifiedEventBus';
import type { AudioFeatures } from '../../vis/AudioReactive';

// 段落类型定义
export type SegmentType = 'intro' | 'build' | 'drop' | 'fill' | 'break' | 'outro' | 'steady';

// 段落边界事件
export interface SegmentBoundaryEvent {
  type: 'segment_boundary';
  fromSegment: SegmentType;
  toSegment: SegmentType;
  confidence: number;
  timestamp: number;
  audioFeatures: AudioFeatures;
  bpm?: number;
  key?: string;
}

// 段落检测配置
export interface SegmentDetectionConfig {
  // 能量阈值配置
  energyThresholds: {
    low: number;      // 低能量阈值
    medium: number;   // 中能量阈值
    high: number;     // 高能量阈值
  };
  
  // 变化检测配置
  changeDetection: {
    energyChangeThreshold: number;    // 能量变化阈值
    fluxChangeThreshold: number;      // 通量变化阈值
    timeWindow: number;               // 时间窗口 (ms)
  };
  
  // 段落特征配置
  segmentFeatures: {
    [key in SegmentType]: {
      energyRange: [number, number];  // 能量范围
      fluxRange: [number, number];    // 通量范围
      durationRange: [number, number]; // 持续时间范围 (ms)
      transitionProbability: number;   // 转换概率
    };
  };
}

// 默认配置
export const DEFAULT_SEGMENT_DETECTION_CONFIG: SegmentDetectionConfig = {
  energyThresholds: {
    low: 0.2,
    medium: 0.5,
    high: 0.8
  },
  
  changeDetection: {
    energyChangeThreshold: 0.15,
    fluxChangeThreshold: 0.2,
    timeWindow: 2000
  },
  
  segmentFeatures: {
    intro: {
      energyRange: [0.1, 0.4],
      fluxRange: [0.1, 0.3],
      durationRange: [8000, 16000],
      transitionProbability: 0.8
    },
    build: {
      energyRange: [0.4, 0.7],
      fluxRange: [0.3, 0.6],
      durationRange: [4000, 8000],
      transitionProbability: 0.9
    },
    drop: {
      energyRange: [0.7, 1.0],
      fluxRange: [0.6, 1.0],
      durationRange: [8000, 16000],
      transitionProbability: 0.7
    },
    fill: {
      energyRange: [0.5, 0.8],
      fluxRange: [0.4, 0.7],
      durationRange: [2000, 4000],
      transitionProbability: 0.8
    },
    break: {
      energyRange: [0.1, 0.3],
      fluxRange: [0.1, 0.4],
      durationRange: [4000, 8000],
      transitionProbability: 0.6
    },
    outro: {
      energyRange: [0.2, 0.5],
      fluxRange: [0.2, 0.4],
      durationRange: [8000, 16000],
      transitionProbability: 0.5
    },
    steady: {
      energyRange: [0.3, 0.6],
      fluxRange: [0.2, 0.5],
      durationRange: [8000, 16000],
      transitionProbability: 0.3
    }
  }
};

/**
 * 段落边界检测器
 * 基于音频特征和音乐结构检测段落边界
 */
export class SegmentBoundaryDetector {
  private config: SegmentDetectionConfig;
  private currentSegment: SegmentType = 'steady';
  private segmentStartTime: number = 0;
  private lastEnergy: number = 0;
  private lastFlux: number = 0;
  private energyHistory: Array<{ energy: number; timestamp: number }> = [];
  private fluxHistory: Array<{ flux: number; timestamp: number }> = [];
  private isInitialized: boolean = false;

  constructor(config?: Partial<SegmentDetectionConfig>) {
    this.config = { ...DEFAULT_SEGMENT_DETECTION_CONFIG, ...config };
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听音频特征事件
    UnifiedEventBus.on('audio', 'features', this.handleAudioFeatures.bind(this));
    
    // 监听BPM变化事件
    UnifiedEventBus.on('automix', 'bpm', this.handleBpmChange.bind(this));
    
    // 监听调性变化事件
    UnifiedEventBus.on('automix', 'key', this.handleKeyChange.bind(this));
    
    console.log('🎵 段落边界检测器事件监听器设置完成');
  }

  /**
   * 处理音频特征事件
   */
  private handleAudioFeatures(event: any): void {
    const { audioFeatures, timestamp } = event.data || {};
    if (!audioFeatures) return;

    this.processAudioFeatures(audioFeatures, timestamp || Date.now());
  }

  /**
   * 处理BPM变化事件
   */
  private handleBpmChange(event: any): void {
    const { bpm } = event.data || {};
    if (bpm) {
      this.updateBpm(bpm);
    }
  }

  /**
   * 处理调性变化事件
   */
  private handleKeyChange(event: any): void {
    const { key } = event.data || {};
    if (key) {
      this.updateKey(key);
    }
  }

  /**
   * 处理音频特征
   */
  private processAudioFeatures(audioFeatures: AudioFeatures, timestamp: number): void {
    if (!this.isInitialized) {
      this.initialize(timestamp);
    }

    // 更新历史记录
    this.updateHistory(audioFeatures, timestamp);

    // 检测段落变化
    const newSegment = this.detectSegmentChange(audioFeatures, timestamp);
    
    if (newSegment !== this.currentSegment) {
      this.handleSegmentChange(newSegment, audioFeatures, timestamp);
    }

    // 更新当前状态
    this.lastEnergy = audioFeatures.rms;
    this.lastFlux = audioFeatures.flux;
  }

  /**
   * 初始化检测器
   */
  private initialize(timestamp: number): void {
    this.segmentStartTime = timestamp;
    this.isInitialized = true;
    console.log('🎵 段落边界检测器初始化完成');
  }

  /**
   * 更新历史记录
   */
  private updateHistory(audioFeatures: AudioFeatures, timestamp: number): void {
    const maxHistoryLength = 100; // 保留最近100个数据点
    
    // 更新能量历史
    this.energyHistory.push({ energy: audioFeatures.rms, timestamp });
    if (this.energyHistory.length > maxHistoryLength) {
      this.energyHistory.shift();
    }
    
    // 更新通量历史
    this.fluxHistory.push({ flux: audioFeatures.flux, timestamp });
    if (this.fluxHistory.length > maxHistoryLength) {
      this.fluxHistory.shift();
    }
  }

  /**
   * 检测段落变化
   */
  private detectSegmentChange(audioFeatures: AudioFeatures, timestamp: number): SegmentType {
    const currentTime = timestamp;
    const segmentDuration = currentTime - this.segmentStartTime;
    
    // 计算能量和通量的变化
    const energyChange = Math.abs(audioFeatures.rms - this.lastEnergy);
    const fluxChange = Math.abs(audioFeatures.flux - this.lastFlux);
    
    // 检查是否满足变化阈值
    const hasSignificantChange = 
      energyChange > this.config.changeDetection.energyChangeThreshold ||
      fluxChange > this.config.changeDetection.fluxChangeThreshold;
    
    // 检查是否满足时间窗口要求
    const timeWindowMet = segmentDuration > this.config.changeDetection.timeWindow;
    
    if (hasSignificantChange && timeWindowMet) {
      // 基于当前音频特征预测新段落
      return this.predictSegment(audioFeatures, segmentDuration);
    }
    
    return this.currentSegment;
  }

  /**
   * 预测段落类型
   */
  private predictSegment(audioFeatures: AudioFeatures, segmentDuration: number): SegmentType {
    const { energy, flux } = audioFeatures;
    
    // 计算每个段落的匹配度
    const segmentScores: Array<{ segment: SegmentType; score: number }> = [];
    
    Object.entries(this.config.segmentFeatures).forEach(([segmentType, features]) => {
      const energyMatch = this.calculateRangeMatch(energy, features.energyRange);
      const fluxMatch = this.calculateRangeMatch(flux, features.fluxRange);
      const durationMatch = this.calculateRangeMatch(segmentDuration, features.durationRange);
      
      // 综合评分
      const score = (energyMatch * 0.4 + fluxMatch * 0.4 + durationMatch * 0.2) * features.transitionProbability;
      
      segmentScores.push({ segment: segmentType as SegmentType, score });
    });
    
    // 选择得分最高的段落
    segmentScores.sort((a, b) => b.score - a.score);
    return segmentScores[0].segment;
  }

  /**
   * 计算范围匹配度
   */
  private calculateRangeMatch(value: number, range: [number, number]): number {
    const [min, max] = range;
    
    if (value < min) {
      return Math.max(0, 1 - (min - value) / min);
    } else if (value > max) {
      return Math.max(0, 1 - (value - max) / max);
    } else {
      return 1.0;
    }
  }

  /**
   * 处理段落变化
   */
  private handleSegmentChange(newSegment: SegmentType, audioFeatures: AudioFeatures, timestamp: number): void {
    const oldSegment = this.currentSegment;
    
    // 计算变化置信度
    const confidence = this.calculateChangeConfidence(audioFeatures, oldSegment, newSegment);
    
    // 发射段落边界事件
    const boundaryEvent: SegmentBoundaryEvent = {
      type: 'segment_boundary',
      fromSegment: oldSegment,
      toSegment: newSegment,
      confidence,
      timestamp,
      audioFeatures
    };
    
    UnifiedEventBus.emit({
      namespace: 'music',
      type: 'segment_change',
      timestamp,
      data: {
        ...boundaryEvent,
        previousSegment: oldSegment,
        currentSegment: newSegment
      }
    });
    
    // 更新当前状态
    this.currentSegment = newSegment;
    this.segmentStartTime = timestamp;
    
    console.log(`🎵 段落变化: ${oldSegment} → ${newSegment} (置信度: ${confidence.toFixed(3)})`);
  }

  /**
   * 计算变化置信度
   */
  private calculateChangeConfidence(audioFeatures: AudioFeatures, oldSegment: SegmentType, newSegment: SegmentType): number {
    const oldFeatures = this.config.segmentFeatures[oldSegment];
    const newFeatures = this.config.segmentFeatures[newSegment];
    
    // 基于音频特征计算置信度
    const energyConfidence = this.calculateRangeMatch(audioFeatures.rms, newFeatures.energyRange);
    const fluxConfidence = this.calculateRangeMatch(audioFeatures.flux, newFeatures.fluxRange);
    
    // 基于转换概率计算置信度
    const transitionConfidence = newFeatures.transitionProbability;
    
    // 综合置信度
    return (energyConfidence * 0.4 + fluxConfidence * 0.4 + transitionConfidence * 0.2);
  }

  /**
   * 更新BPM信息
   */
  private updateBpm(bpm: number): void {
    // 可以基于BPM调整检测参数
    console.log(`🎵 BPM更新: ${bpm}`);
  }

  /**
   * 更新调性信息
   */
  private updateKey(key: string): void {
    // 可以基于调性调整检测参数
    console.log(`🎵 调性更新: ${key}`);
  }

  /**
   * 获取当前段落信息
   */
  public getCurrentSegment(): {
    segment: SegmentType;
    startTime: number;
    duration: number;
    confidence: number;
  } {
    const duration = Date.now() - this.segmentStartTime;
    const confidence = this.calculateCurrentSegmentConfidence();
    
    return {
      segment: this.currentSegment,
      startTime: this.segmentStartTime,
      duration,
      confidence
    };
  }

  /**
   * 计算当前段落置信度
   */
  private calculateCurrentSegmentConfidence(): number {
    if (this.energyHistory.length === 0) return 0;
    
    const currentFeatures = this.config.segmentFeatures[this.currentSegment];
    const recentEnergy = this.energyHistory.slice(-10).reduce((sum, h) => sum + h.energy, 0) / 10;
    const recentFlux = this.fluxHistory.slice(-10).reduce((sum, h) => sum + h.flux, 0) / 10;
    
    const energyConfidence = this.calculateRangeMatch(recentEnergy, currentFeatures.energyRange);
    const fluxConfidence = this.calculateRangeMatch(recentFlux, currentFeatures.fluxRange);
    
    return (energyConfidence + fluxConfidence) / 2;
  }

  /**
   * 获取检测器状态
   */
  public getStatus(): {
    isInitialized: boolean;
    currentSegment: SegmentType;
    segmentStartTime: number;
    energyHistoryLength: number;
    fluxHistoryLength: number;
  } {
    return {
      isInitialized: this.isInitialized,
      currentSegment: this.currentSegment,
      segmentStartTime: this.segmentStartTime,
      energyHistoryLength: this.energyHistory.length,
      fluxHistoryLength: this.fluxHistory.length
    };
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<SegmentDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🎵 段落检测配置已更新');
  }

  /**
   * 销毁检测器
   */
  public destroy(): void {
    // 移除事件监听器
    UnifiedEventBus.off('audio', 'features', this.handleAudioFeatures.bind(this));
    UnifiedEventBus.off('automix', 'bpm', this.handleBpmChange.bind(this));
    UnifiedEventBus.off('automix', 'key', this.handleKeyChange.bind(this));
    
    console.log('🧹 段落边界检测器已销毁');
  }
}

// 导出单例实例
export const segmentBoundaryDetector = new SegmentBoundaryDetector();
