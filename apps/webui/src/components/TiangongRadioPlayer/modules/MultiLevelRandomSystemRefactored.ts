/**
 * 重构后的多层级随机系统
 * 使用模块化架构，整合RandomLevelManager、CoordinationEngine、PerformanceOptimizer
 * TASK-125: 模块化MultiLevelRandomSystem
 */

import { UnifiedEventBus } from '../../events/UnifiedEventBus';
import { RandomLevel, LevelConfig, LevelState, CoordinationStrategy } from '../multiLevelRandomSystem';
import { RandomLevelManager } from './RandomLevelManager';
import { CoordinationEngine } from './CoordinationEngine';
import { PerformanceOptimizer } from './PerformanceOptimizer';

// 重构后的系统配置
export interface RefactoredSystemConfig {
  levelConfigs: Record<RandomLevel, LevelConfig>;
  coordinationStrategy: string;
  enablePerformanceOptimization: boolean;
  optimizationConfig?: any;
}

// 默认配置
export const DEFAULT_REFACTORED_CONFIG: RefactoredSystemConfig = {
  levelConfigs: {
    [RandomLevel.SYSTEM]: {
      level: RandomLevel.SYSTEM,
      weight: 1.0,
      randomnessRange: [0.1, 0.9],
      updateInterval: 1000,
      dependencies: [],
      enabled: true
    },
    [RandomLevel.EMOTION]: {
      level: RandomLevel.EMOTION,
      weight: 0.8,
      randomnessRange: [0.2, 0.8],
      updateInterval: 500,
      dependencies: [RandomLevel.SYSTEM],
      enabled: true
    },
    [RandomLevel.PRESET]: {
      level: RandomLevel.PRESET,
      weight: 0.6,
      randomnessRange: [0.3, 0.7],
      updateInterval: 2000,
      dependencies: [RandomLevel.EMOTION],
      enabled: true
    },
    [RandomLevel.EFFECT]: {
      level: RandomLevel.EFFECT,
      weight: 0.7,
      randomnessRange: [0.2, 0.8],
      updateInterval: 300,
      dependencies: [RandomLevel.PRESET],
      enabled: true
    },
    [RandomLevel.AUDIO]: {
      level: RandomLevel.AUDIO,
      weight: 0.5,
      randomnessRange: [0.4, 0.6],
      updateInterval: 100,
      dependencies: [RandomLevel.EFFECT],
      enabled: true
    },
    [RandomLevel.TIME]: {
      level: RandomLevel.TIME,
      weight: 0.3,
      randomnessRange: [0.1, 0.5],
      updateInterval: 5000,
      dependencies: [RandomLevel.SYSTEM],
      enabled: true
    }
  },
  coordinationStrategy: 'adaptive',
  enablePerformanceOptimization: true
};

/**
 * 重构后的多层级随机系统
 * 整合三个核心模块，提供统一的接口
 */
export class MultiLevelRandomSystemRefactored {
  private config: RefactoredSystemConfig;
  private levelManager: RandomLevelManager;
  private coordinationEngine: CoordinationEngine;
  private performanceOptimizer: PerformanceOptimizer;
  private isInitialized: boolean = false;

  constructor(config?: Partial<RefactoredSystemConfig>) {
    this.config = { ...DEFAULT_REFACTORED_CONFIG, ...config };
    
    // 初始化核心模块
    this.levelManager = new RandomLevelManager(this.config.levelConfigs);
    this.coordinationEngine = new CoordinationEngine(this.levelManager, this.config.coordinationStrategy);
    
    if (this.config.enablePerformanceOptimization) {
      this.performanceOptimizer = new PerformanceOptimizer(this.levelManager, this.config.optimizationConfig);
    }
    
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听情绪变化事件
    UnifiedEventBus.on('emotion', 'change', this.handleEmotionChange.bind(this));
    
    // 监听音频特征事件
    UnifiedEventBus.on('audio', 'features', this.handleAudioFeatures.bind(this));
    
    // 监听时间事件
    UnifiedEventBus.on('time', 'tick', this.handleTimeTick.bind(this));
  }

  /**
   * 启动系统
   */
  public start(): void {
    if (this.isInitialized) {
      console.warn('多层级随机系统已经启动');
      return;
    }

    try {
      // 启动层级管理器
      this.levelManager.startAllLevels();
      
      // 启动性能优化器
      if (this.performanceOptimizer) {
        this.performanceOptimizer.initialize();
      }

      this.isInitialized = true;
      console.log('🎲 重构后的多层级随机系统启动成功');

      // 发射系统就绪事件
      UnifiedEventBus.emit({
        namespace: 'random',
        type: 'multi_level_ready',
        timestamp: Date.now(),
        data: {
          levels: Object.keys(this.config.levelConfigs),
          strategy: this.config.coordinationStrategy,
          performanceOptimization: this.config.enablePerformanceOptimization
        }
      });

    } catch (error) {
      console.error('❌ 重构后的多层级随机系统启动失败:', error);
    }
  }

  /**
   * 协调所有层级的随机性
   */
  public coordinateRandomness(): Record<RandomLevel, number> {
    return this.coordinationEngine.coordinate();
  }

  /**
   * 获取当前随机性值
   */
  public getCurrentRandomness(): Record<RandomLevel, number> {
    const result: Record<RandomLevel, number> = {} as any;
    
    Object.values(RandomLevel).forEach(level => {
      const state = this.levelManager.getLevelState(level);
      result[level] = state ? state.currentRandomness : 0.5;
    });
    
    return result;
  }

  /**
   * 获取层级状态
   */
  public getLevelStates(): Record<RandomLevel, LevelState> {
    return this.levelManager.getAllLevelStates();
  }

  /**
   * 获取性能指标
   */
  public getPerformanceMetrics() {
    if (this.performanceOptimizer) {
      return this.performanceOptimizer.getPerformanceMetrics();
    }
    return null;
  }

  /**
   * 更新层级配置
   */
  public updateLevelConfig(level: RandomLevel, config: Partial<LevelConfig>): void {
    this.levelManager.updateLevelConfig(level, config);
  }

  /**
   * 切换协调策略
   */
  public setCoordinationStrategy(strategy: string): boolean {
    return this.coordinationEngine.setStrategy(strategy);
  }

  /**
   * 获取当前协调策略
   */
  public getCurrentCoordinationStrategy(): string {
    return this.coordinationEngine.getCurrentStrategy().name;
  }

  /**
   * 获取可用协调策略
   */
  public getAvailableCoordinationStrategies(): Array<{ name: string; description: string }> {
    return this.coordinationEngine.getAvailableStrategies();
  }

  /**
   * 手动性能优化
   */
  public manualPerformanceOptimization(level: number): void {
    if (this.performanceOptimizer) {
      this.performanceOptimizer.manualOptimize(level);
    }
  }

  /**
   * 获取性能摘要
   */
  public getPerformanceSummary() {
    if (this.performanceOptimizer) {
      return this.performanceOptimizer.getPerformanceSummary();
    }
    return null;
  }

  /**
   * 获取优化建议
   */
  public getOptimizationSuggestions() {
    if (this.performanceOptimizer) {
      return this.performanceOptimizer.getOptimizationSuggestions();
    }
    return [];
  }

  /**
   * 事件处理器
   */
  private handleEmotionChange(event: any): void {
    const emotionData = event.data?.mood;
    if (emotionData) {
      this.adjustEmotionLevels(emotionData);
    }
  }

  private handleAudioFeatures(event: any): void {
    const audioData = event.data;
    if (audioData) {
      this.adjustAudioLevel(audioData);
    }
  }

  private handleTimeTick(event: any): void {
    this.updateTimeLevel();
  }

  /**
   * 调整情绪相关层级
   */
  private adjustEmotionLevels(emotion: { energy: number; valence: number; arousal: number }): void {
    const { energy, valence, arousal } = emotion;
    
    // 调整情绪层级权重
    const emotionConfig = this.config.levelConfigs[RandomLevel.EMOTION];
    const newWeight = Math.max(0.3, Math.min(1.0, 
      emotionConfig.weight * (0.8 + energy * 0.4)
    ));
    
    this.updateLevelConfig(RandomLevel.EMOTION, { weight: newWeight });
  }

  /**
   * 调整音频层级
   */
  private adjustAudioLevel(audioData: any): void {
    const complexity = audioData.complexity || 0.5;
    
    const newWeight = Math.max(0.2, Math.min(0.8, 
      this.config.levelConfigs[RandomLevel.AUDIO].weight * (0.6 + complexity * 0.4)
    ));
    
    this.updateLevelConfig(RandomLevel.AUDIO, { weight: newWeight });
  }

  /**
   * 更新时间层级
   */
  private updateTimeLevel(): void {
    const timeVariation = Math.sin(Date.now() / 30000) * 0.15;
    const newRandomness = 0.3 + timeVariation;
    
    // 通过层级管理器设置随机性值
    this.levelManager.setLevelRandomness(RandomLevel.TIME, newRandomness);
  }

  /**
   * 停止系统
   */
  public stop(): void {
    if (!this.isInitialized) return;
    
    this.levelManager.stopAllLevels();
    
    if (this.performanceOptimizer) {
      this.performanceOptimizer.stop();
    }
    
    this.isInitialized = false;
    console.log('🛑 重构后的多层级随机系统已停止');
  }

  /**
   * 销毁系统
   */
  public destroy(): void {
    this.stop();
    
    this.levelManager.destroy();
    this.coordinationEngine.destroy();
    
    if (this.performanceOptimizer) {
      this.performanceOptimizer.destroy();
    }
    
    // 清理事件监听器
    UnifiedEventBus.off('emotion', 'change', this.handleEmotionChange.bind(this));
    UnifiedEventBus.off('audio', 'features', this.handleAudioFeatures.bind(this));
    UnifiedEventBus.off('time', 'tick', this.handleTimeTick.bind(this));
    
    console.log('🛑 重构后的多层级随机系统已销毁');
  }

  /**
   * 导出系统配置
   */
  public exportConfiguration(): string {
    return JSON.stringify({
      config: this.config,
      levelStates: this.getLevelStates(),
      coordinationStrategy: this.getCurrentCoordinationStrategy(),
      performanceSummary: this.getPerformanceSummary(),
      timestamp: Date.now(),
      version: '2.0.0'
    }, null, 2);
  }

  /**
   * 导入系统配置
   */
  public importConfiguration(configString: string): void {
    try {
      const config = JSON.parse(configString);
      
      if (config.config && config.version) {
        // 更新配置
        this.config = { ...this.config, ...config.config };
        
        // 重新初始化模块
        this.levelManager.destroy();
        this.levelManager = new RandomLevelManager(this.config.levelConfigs);
        
        this.coordinationEngine.destroy();
        this.coordinationEngine = new CoordinationEngine(this.levelManager, this.config.coordinationStrategy);
        
        if (this.config.enablePerformanceOptimization) {
          if (this.performanceOptimizer) {
            this.performanceOptimizer.destroy();
          }
          this.performanceOptimizer = new PerformanceOptimizer(this.levelManager, this.config.optimizationConfig);
        }
        
        console.log('✅ 系统配置导入成功');
      } else {
        throw new Error('无效的配置格式');
      }
      
    } catch (error) {
      console.error('❌ 系统配置导入失败:', error);
      throw error;
    }
  }

  /**
   * 获取系统状态摘要
   */
  public getSystemStatus(): {
    isInitialized: boolean;
    activeLevels: number;
    currentStrategy: string;
    performanceOptimization: boolean;
    totalLevels: number;
  } {
    return {
      isInitialized: this.isInitialized,
      activeLevels: this.levelManager.getActiveLevelCount(),
      currentStrategy: this.getCurrentCoordinationStrategy(),
      performanceOptimization: this.config.enablePerformanceOptimization,
      totalLevels: Object.keys(this.config.levelConfigs).length
    };
  }
}

// 创建默认实例
export const multiLevelRandomSystemRefactored = new MultiLevelRandomSystemRefactored();
