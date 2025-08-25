/**
 * 检测点管理器
 * 负责管理所有检测点的状态、触发逻辑和事件发射
 * 集成到现有的UnifiedEventBus系统中
 */

import { UnifiedEventBus } from '../events/UnifiedEventBus';
import type { 
  DetectionPoint, 
  DetectionPointState, 
  DetectionConfig, 
  DetectionEvent,
  DetectionManagerState 
} from './types';
import { 
  FREQUENCY_DETECTION_POINTS, 
  STRUCTURE_DETECTION_POINTS,
  DEFAULT_DETECTION_CONFIG 
} from './detectionPoints';

export class DetectionPointManager {
  private config: DetectionConfig;
  private points: Record<string, DetectionPointState>;
  private isEnabled: boolean;
  private lastUpdate: number;
  private errorCount: number;
  private performanceMetrics: {
    averageUpdateTime: number;
    maxUpdateTime: number;
    updateCount: number;
  };
  private updateInterval: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;

  constructor(config?: Partial<DetectionConfig>) {
    this.config = { ...DEFAULT_DETECTION_CONFIG, ...config };
    this.points = {};
    this.isEnabled = false;
    this.lastUpdate = Date.now();
    this.errorCount = 0;
    this.performanceMetrics = {
      averageUpdateTime: 0,
      maxUpdateTime: 0,
      updateCount: 0
    };

    this.initializePoints();
    this.setupEventListeners();
  }

  /**
   * 初始化所有检测点
   */
  private initializePoints(): void {
    const allPoints = [...this.config.points];
    
    allPoints.forEach(point => {
      this.points[point.id] = {
        pointId: point.id,
        isActive: false,
        intensity: 0,
        lastTriggered: 0,
        triggerCount: 0,
        averageIntensity: 0,
        peakIntensity: 0
      };
    });

    console.log(`🎯 检测点管理器初始化完成，共 ${allPoints.length} 个检测点`);
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听音频特征事件
    UnifiedEventBus.on('audio', 'features', this.handleAudioFeatures.bind(this));
    
    // 监听情绪变化事件
    UnifiedEventBus.on('emotion', 'mood_change', this.handleEmotionChange.bind(this));
    
    // 监听音乐结构事件
    UnifiedEventBus.on('music', 'segment_change', this.handleSegmentChange.bind(this));
    
    console.log('🎵 检测点事件监听器设置完成');
  }

  /**
   * 处理音频特征事件
   */
  private handleAudioFeatures(event: any): void {
    if (!this.isEnabled) return;

    const { audioFeatures } = event.data || {};
    if (!audioFeatures) return;

    this.updateFrequencyDetectionPoints(audioFeatures);
  }

  /**
   * 处理情绪变化事件
   */
  private handleEmotionChange(event: any): void {
    if (!this.isEnabled) return;

    const { mood, previousMood } = event.data || {};
    if (!mood || !previousMood) return;

    this.updateEmotionDetectionPoints(mood, previousMood);
  }

  /**
   * 处理音乐段落变化事件
   */
  private handleSegmentChange(event: any): void {
    if (!this.isEnabled) return;

    const { segment, previousSegment } = event.data || {};
    if (!segment || segment === previousSegment) return;

    this.updateStructureDetectionPoints(segment, previousSegment);
  }

  /**
   * 更新频段检测点
   */
  private updateFrequencyDetectionPoints(audioFeatures: any): void {
    const frequencyPoints = this.config.points.filter(p => p.category === 'frequency');
    
    frequencyPoints.forEach(point => {
      const intensity = this.calculateFrequencyIntensity(point, audioFeatures);
      this.updatePointIntensity(point.id, intensity);
    });
  }

  /**
   * 计算频段强度
   */
  private calculateFrequencyIntensity(point: DetectionPoint, audioFeatures: any): number {
    const { min, max, center } = point.frequency;
    
    // 根据频段范围计算强度
    if (min === 80 && max === 120) {
      // 100Hz Kick检测点
      return audioFeatures.sub || 0;
    } else if (min === 1000 && max === 2500) {
      // 中频合成器检测点
      return audioFeatures.mid || 0;
    } else if (min === 6000 && max === 12000) {
      // 高频打击乐检测点
      return audioFeatures.brilliance || 0;
    }
    
    return 0;
  }

  /**
   * 更新情绪检测点
   */
  private updateEmotionDetectionPoints(currentMood: any, previousMood: any): void {
    const emotionPoints = this.config.points.filter(p => p.category === 'emotion');
    
    emotionPoints.forEach(point => {
      const intensity = this.calculateEmotionIntensity(point, currentMood, previousMood);
      this.updatePointIntensity(point.id, intensity);
    });
  }

  /**
   * 计算情绪变化强度
   */
  private calculateEmotionIntensity(point: DetectionPoint, currentMood: any, previousMood: any): number {
    const energyDiff = Math.abs((currentMood.energy || 0) - (previousMood.energy || 0));
    const valenceDiff = Math.abs((currentMood.valence || 0) - (previousMood.valence || 0));
    const arousalDiff = Math.abs((currentMood.arousal || 0) - (previousMood.arousal || 0));
    
    return Math.max(energyDiff, valenceDiff, arousalDiff);
  }

  /**
   * 更新结构检测点
   */
  private updateStructureDetectionPoints(currentSegment: string, previousSegment: string): void {
    const structurePoints = this.config.points.filter(p => p.category === 'structure');
    
    structurePoints.forEach(point => {
      if (point.id === 'segment_boundary') {
        const intensity = currentSegment !== previousSegment ? 1.0 : 0.0;
        this.updatePointIntensity(point.id, intensity);
      }
    });
  }

  /**
   * 更新检测点强度
   */
  private updatePointIntensity(pointId: string, newIntensity: number): void {
    const point = this.points[pointId];
    if (!point) return;

    const config = this.config.points.find(p => p.id === pointId);
    if (!config) return;

    // 应用平滑和阈值
    const smoothedIntensity = this.applySmoothing(
      point.intensity, 
      newIntensity, 
      config.threshold.smoothing
    );

    // 检查是否触发
    const shouldTrigger = this.checkTrigger(point, smoothedIntensity, config);
    
    if (shouldTrigger) {
      this.triggerPoint(pointId, smoothedIntensity, config);
    } else if (point.isActive) {
      this.releasePoint(pointId, config);
    }

    // 更新状态
    point.intensity = smoothedIntensity;
    point.averageIntensity = (point.averageIntensity + smoothedIntensity) / 2;
    point.peakIntensity = Math.max(point.peakIntensity, smoothedIntensity);
  }

  /**
   * 应用平滑处理
   */
  private applySmoothing(current: number, target: number, smoothing: number): number {
    return current * smoothing + target * (1 - smoothing);
  }

  /**
   * 检查是否触发
   */
  private checkTrigger(point: DetectionPointState, intensity: number, config: DetectionPoint): boolean {
    if (point.isActive) {
      // 已激活状态，检查释放条件
      return intensity > (config.threshold.value - config.threshold.hysteresis);
    } else {
      // 未激活状态，检查触发条件
      return intensity > (config.threshold.value + config.threshold.hysteresis);
    }
  }

  /**
   * 触发检测点
   */
  private triggerPoint(pointId: string, intensity: number, config: DetectionPoint): void {
    const point = this.points[pointId];
    if (!point || point.isActive) return;

    point.isActive = true;
    point.lastTriggered = Date.now();
    point.triggerCount++;

    // 发射检测点触发事件
    const event: DetectionEvent = {
      type: 'trigger',
      pointId,
      timestamp: Date.now(),
      intensity,
      data: {
        config: config.visualEffect,
        point: point
      }
    };

    UnifiedEventBus.emit({
      namespace: 'detection',
      type: 'point_trigger',
      timestamp: Date.now(),
      data: event
    });

    console.log(`🎯 检测点触发: ${pointId}, 强度: ${intensity.toFixed(3)}`);
  }

  /**
   * 释放检测点
   */
  private releasePoint(pointId: string, config: DetectionPoint): void {
    const point = this.points[pointId];
    if (!point || !point.isActive) return;

    point.isActive = false;

    // 发射检测点释放事件
    const event: DetectionEvent = {
      type: 'release',
      pointId,
      timestamp: Date.now(),
      intensity: point.intensity,
      data: {
        config: config.visualEffect,
        point: point
      }
    };

    UnifiedEventBus.emit({
      namespace: 'detection',
      type: 'point_release',
      timestamp: Date.now(),
      data: event
    });

    console.log(`🎯 检测点释放: ${pointId}`);
  }

  /**
   * 启动检测点管理器
   */
  public start(): void {
    if (this.isEnabled) return;

    this.isEnabled = true;
    this.lastUpdate = Date.now();
    
    // 启动更新循环
    this.updateInterval = setInterval(() => {
      this.update();
    }, this.config.updateInterval);

    console.log('🎯 检测点管理器已启动');
  }

  /**
   * 停止检测点管理器
   */
  public stop(): void {
    if (!this.isEnabled) return;

    this.isEnabled = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log('🎯 检测点管理器已停止');
  }

  /**
   * 更新循环
   */
  private update(): void {
    const startTime = performance.now();
    
    try {
      // 应用衰减
      this.applyDecay();
      
      // 更新性能指标
      const updateTime = performance.now() - startTime;
      this.updatePerformanceMetrics(updateTime);
      
    } catch (error) {
      console.error('❌ 检测点更新错误:', error);
      this.errorCount++;
    }
    
    this.lastUpdate = Date.now();
  }

  /**
   * 应用衰减
   */
  private applyDecay(): void {
    const now = Date.now();
    
    Object.values(this.points).forEach(point => {
      if (!point.isActive) return;
      
      const config = this.config.points.find(p => p.id === point.pointId);
      if (!config) return;
      
      const timeSinceTrigger = now - point.lastTriggered;
      const decayTime = config.decay.attack + config.decay.release;
      
      if (timeSinceTrigger > decayTime) {
        // 应用衰减
        const decayFactor = Math.exp(-(timeSinceTrigger - decayTime) / config.decay.release);
        point.intensity *= decayFactor;
        
        if (point.intensity < 0.01) {
          this.releasePoint(point.pointId, config);
        }
      }
    });
  }

  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(updateTime: number): void {
    const { performanceMetrics } = this;
    
    performanceMetrics.updateCount++;
    performanceMetrics.averageUpdateTime = 
      (performanceMetrics.averageUpdateTime * (performanceMetrics.updateCount - 1) + updateTime) / 
      performanceMetrics.updateCount;
    performanceMetrics.maxUpdateTime = Math.max(performanceMetrics.maxUpdateTime, updateTime);
  }

  /**
   * 获取检测点状态
   */
  public getPointState(pointId: string): DetectionPointState | null {
    return this.points[pointId] || null;
  }

  /**
   * 获取所有检测点状态
   */
  public getAllPointStates(): Record<string, DetectionPointState> {
    return { ...this.points };
  }

  /**
   * 获取管理器状态
   */
  public getState(): DetectionManagerState {
    return {
      config: this.config,
      points: this.points,
      isEnabled: this.isEnabled,
      lastUpdate: this.lastUpdate,
      errorCount: this.errorCount,
      performanceMetrics: this.performanceMetrics
    };
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<DetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🎯 检测点配置已更新');
  }

  /**
   * 启用/禁用特定检测点
   */
  public setPointEnabled(pointId: string, enabled: boolean): void {
    const config = this.config.points.find(p => p.id === pointId);
    if (config) {
      config.enabled = enabled;
      console.log(`🎯 检测点 ${pointId} ${enabled ? '已启用' : '已禁用'}`);
    }
  }

  /**
   * 销毁管理器
   */
  public destroy(): void {
    this.stop();
    console.log('🎯 检测点管理器已销毁');
  }
}

// 导出单例实例
export const detectionPointManager = new DetectionPointManager();
