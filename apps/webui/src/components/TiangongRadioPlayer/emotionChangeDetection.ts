/**
 * 情绪变化检测算法
 * 基于音频特征和用户交互检测情绪变化
 * 采用结构性好的设计，易于维护和扩展
 */

import { UnifiedEventBus } from '../events/UnifiedEventBus';
import type { AudioFeatures } from '../../vis/AudioReactive';

// 情绪类型定义
export type EmotionType = 'calm' | 'energetic' | 'melancholic' | 'excited' | 'focused' | 'relaxed' | 'intense';

// 情绪状态
export interface EmotionState {
  type: EmotionType;
  intensity: number;        // 0-1
  confidence: number;       // 0-1
  timestamp: number;
  duration: number;         // 持续时间 (ms)
  stability: number;        // 稳定性 (0-1)
}

// 情绪变化事件
export interface EmotionChangeEvent {
  type: 'emotion_change';
  fromEmotion: EmotionState;
  toEmotion: EmotionState;
  changeMagnitude: number;  // 变化幅度 (0-1)
  confidence: number;       // 变化置信度 (0-1)
  timestamp: number;
  trigger: 'audio' | 'user' | 'time' | 'external';
  audioFeatures?: AudioFeatures;
}

// 情绪检测配置
export interface EmotionDetectionConfig {
  // 音频特征权重
  audioFeatureWeights: {
    energy: number;         // 能量权重
    flux: number;           // 通量权重
    centroid: number;       // 质心权重
    crest: number;          // 峰均比权重
    bass: number;           // 低频权重
    presence: number;       // 存在感权重
  };
  
  // 变化检测阈值
  changeThresholds: {
    intensityChange: number;    // 强度变化阈值
    durationChange: number;     // 持续时间变化阈值
    stabilityChange: number;    // 稳定性变化阈值
    timeWindow: number;         // 时间窗口 (ms)
  };
  
  // 情绪特征配置
  emotionFeatures: {
    [key in EmotionType]: {
      energyRange: [number, number];      // 能量范围
      fluxRange: [number, number];        // 通量范围
      centroidRange: [number, number];    // 质心范围
      bassRange: [number, number];        // 低频范围
      presenceRange: [number, number];    // 存在感范围
      stabilityRange: [number, number];   // 稳定性范围
      transitionProbability: number;       // 转换概率
    };
  };
}

// 默认配置
export const DEFAULT_EMOTION_DETECTION_CONFIG: EmotionDetectionConfig = {
  audioFeatureWeights: {
    energy: 0.3,
    flux: 0.25,
    centroid: 0.15,
    crest: 0.1,
    bass: 0.15,
    presence: 0.05
  },
  
  changeThresholds: {
    intensityChange: 0.2,
    durationChange: 0.3,
    stabilityChange: 0.25,
    timeWindow: 3000
  },
  
  emotionFeatures: {
    calm: {
      energyRange: [0.1, 0.4],
      fluxRange: [0.1, 0.3],
      centroidRange: [0.2, 0.5],
      bassRange: [0.2, 0.5],
      presenceRange: [0.1, 0.4],
      stabilityRange: [0.7, 1.0],
      transitionProbability: 0.6
    },
    energetic: {
      energyRange: [0.6, 1.0],
      fluxRange: [0.5, 1.0],
      centroidRange: [0.5, 0.8],
      bassRange: [0.6, 1.0],
      presenceRange: [0.5, 0.8],
      stabilityRange: [0.3, 0.6],
      transitionProbability: 0.8
    },
    melancholic: {
      energyRange: [0.2, 0.5],
      fluxRange: [0.1, 0.4],
      centroidRange: [0.1, 0.4],
      bassRange: [0.3, 0.6],
      presenceRange: [0.2, 0.5],
      stabilityRange: [0.6, 0.9],
      transitionProbability: 0.5
    },
    excited: {
      energyRange: [0.7, 1.0],
      fluxRange: [0.6, 1.0],
      centroidRange: [0.6, 0.9],
      bassRange: [0.7, 1.0],
      presenceRange: [0.6, 0.9],
      stabilityRange: [0.2, 0.5],
      transitionProbability: 0.7
    },
    focused: {
      energyRange: [0.4, 0.7],
      fluxRange: [0.3, 0.6],
      centroidRange: [0.4, 0.7],
      bassRange: [0.4, 0.7],
      presenceRange: [0.4, 0.7],
      stabilityRange: [0.5, 0.8],
      transitionProbability: 0.6
    },
    relaxed: {
      energyRange: [0.2, 0.5],
      fluxRange: [0.1, 0.4],
      centroidRange: [0.2, 0.5],
      bassRange: [0.2, 0.5],
      presenceRange: [0.1, 0.4],
      stabilityRange: [0.8, 1.0],
      transitionProbability: 0.4
    },
    intense: {
      energyRange: [0.8, 1.0],
      fluxRange: [0.7, 1.0],
      centroidRange: [0.7, 1.0],
      bassRange: [0.8, 1.0],
      presenceRange: [0.7, 1.0],
      stabilityRange: [0.1, 0.4],
      transitionProbability: 0.9
    }
  }
};

/**
 * 情绪变化检测器
 * 基于音频特征和用户交互检测情绪变化
 */
export class EmotionChangeDetector {
  private config: EmotionDetectionConfig;
  private currentEmotion: EmotionState;
  private emotionStartTime: number = 0;
  private lastAudioFeatures: AudioFeatures | null = null;
  private emotionHistory: EmotionState[] = [];
  private isInitialized: boolean = false;
  private maxHistoryLength: number = 50;

  constructor(config?: Partial<EmotionDetectionConfig>) {
    this.config = { ...DEFAULT_EMOTION_DETECTION_CONFIG, ...config };
    
    // 初始化默认情绪状态
    this.currentEmotion = {
      type: 'calm',
      intensity: 0.5,
      confidence: 0.8,
      timestamp: Date.now(),
      duration: 0,
      stability: 0.8
    };
    
    this.emotionStartTime = Date.now();
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听音频特征事件
    UnifiedEventBus.on('audio', 'features', this.handleAudioFeatures.bind(this));
    
    // 监听用户交互事件
    UnifiedEventBus.on('user', 'interaction', this.handleUserInteraction.bind(this));
    
    // 监听外部情绪事件
    UnifiedEventBus.on('external', 'emotion', this.handleExternalEmotion.bind(this));
    
    console.log('🎭 情绪变化检测器事件监听器设置完成');
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
   * 处理用户交互事件
   */
  private handleUserInteraction(event: any): void {
    const { type, intensity, timestamp } = event.data || {};
    if (!type || intensity === undefined) return;

    this.processUserInteraction(type, intensity, timestamp || Date.now());
  }

  /**
   * 处理外部情绪事件
   */
  private handleExternalEmotion(event: any): void {
    const { emotion, intensity, timestamp } = event.data || {};
    if (!emotion || intensity === undefined) return;

    this.processExternalEmotion(emotion, intensity, timestamp || Date.now());
  }

  /**
   * 处理音频特征
   */
  private processAudioFeatures(audioFeatures: AudioFeatures, timestamp: number): void {
    if (!this.isInitialized) {
      this.initialize(timestamp);
    }

    // 检测情绪变化
    const newEmotion = this.detectEmotionFromAudio(audioFeatures, timestamp);
    
    if (this.shouldTriggerEmotionChange(newEmotion)) {
      this.handleEmotionChange(newEmotion, 'audio', audioFeatures, timestamp);
    }

    // 更新最后音频特征
    this.lastAudioFeatures = audioFeatures;
  }

  /**
   * 处理用户交互
   */
  private processUserInteraction(type: string, intensity: number, timestamp: number): void {
    // 基于用户交互调整情绪
    const adjustedEmotion = this.adjustEmotionFromUserInteraction(type, intensity);
    
    if (this.shouldTriggerEmotionChange(adjustedEmotion)) {
      this.handleEmotionChange(adjustedEmotion, 'user', undefined, timestamp);
    }
  }

  /**
   * 处理外部情绪
   */
  private processExternalEmotion(emotion: string, intensity: number, timestamp: number): void {
    // 基于外部输入设置情绪
    const externalEmotion: EmotionState = {
      type: emotion as EmotionType,
      intensity: Math.max(0, Math.min(1, intensity)),
      confidence: 0.9,
      timestamp,
      duration: 0,
      stability: 0.7
    };
    
    if (this.shouldTriggerEmotionChange(externalEmotion)) {
      this.handleEmotionChange(externalEmotion, 'external', undefined, timestamp);
    }
  }

  /**
   * 初始化检测器
   */
  private initialize(timestamp: number): void {
    this.emotionStartTime = timestamp;
    this.isInitialized = true;
    console.log('🎭 情绪变化检测器初始化完成');
  }

  /**
   * 从音频特征检测情绪
   */
  private detectEmotionFromAudio(audioFeatures: AudioFeatures, timestamp: number): EmotionState {
    const { energy, flux, centroid, crest, bass, presence } = audioFeatures;
    
    // 计算每个情绪的匹配度
    const emotionScores: Array<{ emotion: EmotionType; score: number }> = [];
    
    Object.entries(this.config.emotionFeatures).forEach(([emotionType, features]) => {
      const energyScore = this.calculateRangeMatch(energy, features.energyRange);
      const fluxScore = this.calculateRangeMatch(flux, features.fluxRange);
      const centroidScore = this.calculateRangeMatch(centroid, features.centroidRange);
      const bassScore = this.calculateRangeMatch(bass, features.bassRange);
      const presenceScore = this.calculateRangeMatch(presence, features.presenceRange);
      
      // 加权计算总分
      const totalScore = 
        energyScore * this.config.audioFeatureWeights.energy +
        fluxScore * this.config.audioFeatureWeights.flux +
        centroidScore * this.config.audioFeatureWeights.centroid +
        bassScore * this.config.audioFeatureWeights.bass +
        presenceScore * this.config.audioFeatureWeights.presence;
      
      emotionScores.push({ emotion: emotionType as EmotionType, score: totalScore });
    });
    
    // 选择得分最高的情绪
    emotionScores.sort((a, b) => b.score - a.score);
    const bestEmotion = emotionScores[0];
    
    // 计算情绪强度（基于音频特征的整体强度）
    const overallIntensity = (energy + flux + bass) / 3;
    
    // 计算置信度
    const confidence = Math.min(1, bestEmotion.score * 1.2);
    
    // 计算稳定性（基于历史数据）
    const stability = this.calculateEmotionStability(bestEmotion.emotion);
    
    return {
      type: bestEmotion.emotion,
      intensity: overallIntensity,
      confidence,
      timestamp,
      duration: 0,
      stability
    };
  }

  /**
   * 基于用户交互调整情绪
   */
  private adjustEmotionFromUserInteraction(type: string, intensity: number): EmotionState {
    // 根据交互类型调整情绪
    let adjustedType = this.currentEmotion.type;
    let adjustedIntensity = this.currentEmotion.intensity;
    
    switch (type) {
      case 'boost':
        adjustedIntensity = Math.min(1, adjustedIntensity + intensity * 0.3);
        if (adjustedIntensity > 0.7) adjustedType = 'energetic';
        break;
      case 'calm':
        adjustedIntensity = Math.max(0, adjustedIntensity - intensity * 0.3);
        if (adjustedIntensity < 0.3) adjustedType = 'calm';
        break;
      case 'focus':
        adjustedType = 'focused';
        adjustedIntensity = 0.6;
        break;
      case 'relax':
        adjustedType = 'relaxed';
        adjustedIntensity = 0.3;
        break;
    }
    
    return {
      type: adjustedType,
      intensity: adjustedIntensity,
      confidence: 0.8,
      timestamp: Date.now(),
      duration: 0,
      stability: this.currentEmotion.stability
    };
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
   * 计算情绪稳定性
   */
  private calculateEmotionStability(emotionType: EmotionType): number {
    if (this.emotionHistory.length < 2) return 0.8;
    
    // 计算最近几次情绪变化的频率
    const recentChanges = this.emotionHistory
      .slice(-10)
      .filter(e => e.type !== emotionType).length;
    
    const stability = Math.max(0.1, 1 - (recentChanges / 10));
    return stability;
  }

  /**
   * 判断是否应该触发情绪变化
   */
  private shouldTriggerEmotionChange(newEmotion: EmotionState): boolean {
    const { intensityChange, durationChange, stabilityChange, timeWindow } = this.config.changeThresholds;
    
    // 检查强度变化
    const intensityDiff = Math.abs(newEmotion.intensity - this.currentEmotion.intensity);
    if (intensityDiff < intensityChange) return false;
    
    // 检查持续时间
    const currentDuration = Date.now() - this.emotionStartTime;
    if (currentDuration < timeWindow) return false;
    
    // 检查情绪类型变化
    if (newEmotion.type !== this.currentEmotion.type) return true;
    
    // 检查稳定性变化
    const stabilityDiff = Math.abs(newEmotion.stability - this.currentEmotion.stability);
    if (stabilityDiff > stabilityChange) return true;
    
    return false;
  }

  /**
   * 处理情绪变化
   */
  private handleEmotionChange(
    newEmotion: EmotionState, 
    trigger: 'audio' | 'user' | 'time' | 'external',
    audioFeatures?: AudioFeatures,
    timestamp?: number
  ): void {
    const oldEmotion = { ...this.currentEmotion };
    const changeTime = timestamp || Date.now();
    
    // 计算变化幅度
    const intensityChange = Math.abs(newEmotion.intensity - oldEmotion.intensity);
    const typeChange = newEmotion.type !== oldEmotion.type ? 1 : 0;
    const changeMagnitude = (intensityChange + typeChange) / 2;
    
    // 计算变化置信度
    const changeConfidence = (newEmotion.confidence + oldEmotion.confidence) / 2;
    
    // 创建情绪变化事件
    const emotionChangeEvent: EmotionChangeEvent = {
      type: 'emotion_change',
      fromEmotion: oldEmotion,
      toEmotion: newEmotion,
      changeMagnitude,
      confidence: changeConfidence,
      timestamp: changeTime,
      trigger,
      audioFeatures
    };
    
    // 发射情绪变化事件
    UnifiedEventBus.emit({
      namespace: 'emotion',
      type: 'mood_change',
      timestamp: changeTime,
      data: {
        ...emotionChangeEvent,
        previousMood: oldEmotion,
        currentMood: newEmotion
      }
    });
    
    // 更新当前情绪状态
    this.currentEmotion = {
      ...newEmotion,
      timestamp: changeTime,
      duration: 0
    };
    this.emotionStartTime = changeTime;
    
    // 添加到历史记录
    this.addToHistory(oldEmotion);
    
    console.log(`🎭 情绪变化: ${oldEmotion.type} → ${newEmotion.type} (触发: ${trigger}, 幅度: ${changeMagnitude.toFixed(3)})`);
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(emotion: EmotionState): void {
    this.emotionHistory.push(emotion);
    
    if (this.emotionHistory.length > this.maxHistoryLength) {
      this.emotionHistory.shift();
    }
  }

  /**
   * 获取当前情绪状态
   */
  public getCurrentEmotion(): EmotionState {
    return { ...this.currentEmotion };
  }

  /**
   * 获取情绪历史
   */
  public getEmotionHistory(): EmotionState[] {
    return [...this.emotionHistory];
  }

  /**
   * 获取检测器状态
   */
  public getStatus(): {
    isInitialized: boolean;
    currentEmotion: EmotionType;
    emotionStartTime: number;
    historyLength: number;
    lastAudioFeatures: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      currentEmotion: this.currentEmotion.type,
      emotionStartTime: this.emotionStartTime,
      historyLength: this.emotionHistory.length,
      lastAudioFeatures: !!this.lastAudioFeatures
    };
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<EmotionDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🎭 情绪检测配置已更新');
  }

  /**
   * 销毁检测器
   */
  public destroy(): void {
    // 移除事件监听器
    UnifiedEventBus.off('audio', 'features', this.handleAudioFeatures.bind(this));
    UnifiedEventBus.off('user', 'interaction', this.handleUserInteraction.bind(this));
    UnifiedEventBus.off('external', 'emotion', this.handleExternalEmotion.bind(this));
    
    console.log('🧹 情绪变化检测器已销毁');
  }
}

// 导出单例实例
export const emotionChangeDetector = new EmotionChangeDetector();
