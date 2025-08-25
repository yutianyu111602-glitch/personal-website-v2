/**
 * 多层级随机系统
 * 实现不同层次的随机性控制和协调
 * TASK-121: 实现多层级随机系统
 */

import { UnifiedEventBus } from '../events/UnifiedEventBus';
import { randomStateManager } from './randomStateManager';
import type { RandomState, RandomnessControl } from './randomStateManager';

// 随机层级定义
export enum RandomLevel {
  SYSTEM = 'system',           // 系统级：全局随机性控制
  EMOTION = 'emotion',         // 情绪级：基于情绪的随机性
  PRESET = 'preset',          // 预设级：预设相关的随机性
  EFFECT = 'effect',           // 效果级：视觉效果随机性
  AUDIO = 'audio',            // 音频级：音频特征随机性
  TIME = 'time'               // 时间级：时间相关的随机性
}

// 层级配置接口
export interface LevelConfig {
  level: RandomLevel;
  weight: number;              // 权重 (0-1)
  randomnessRange: [number, number]; // 随机性范围
  updateInterval: number;      // 更新间隔(ms)
  dependencies: RandomLevel[]; // 依赖的其他层级
  enabled: boolean;            // 是否启用
}

// 层级状态接口
export interface LevelState {
  level: RandomLevel;
  currentRandomness: number;   // 当前随机性值
  lastUpdate: number;          // 最后更新时间
  isActive: boolean;           // 是否激活
  performance: {               // 性能指标
    updateCount: number;
    averageUpdateTime: number;
    errorCount: number;
  };
}

// 层级协调策略
export interface CoordinationStrategy {
  strategy: 'hierarchical' | 'weighted' | 'adaptive' | 'cascade';
  parameters: {
    hierarchyWeight: number;   // 层级权重
    timeDecay: number;         // 时间衰减
    emotionInfluence: number;  // 情绪影响
    performanceThreshold: number; // 性能阈值
  };
}

// 默认配置
export const DEFAULT_LEVEL_CONFIGS: Record<RandomLevel, LevelConfig> = {
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
};

export const DEFAULT_COORDINATION_STRATEGY: CoordinationStrategy = {
  strategy: 'adaptive',
  parameters: {
    hierarchyWeight: 0.4,
    timeDecay: 0.1,
    emotionInfluence: 0.6,
    performanceThreshold: 0.8
  }
};

/**
 * 多层级随机系统管理器
 * 负责协调不同层级的随机性，实现智能的随机性控制
 */
export class MultiLevelRandomSystem {
  private configs: Record<RandomLevel, LevelConfig>;
  private states: Record<RandomLevel, LevelState>;
  private strategy: CoordinationStrategy;
  private updateTimers: Map<RandomLevel, NodeJS.Timeout> = new Map();
  private isInitialized: boolean = false;
  private performanceMetrics: {
    totalUpdates: number;
    averageCoordinationTime: number;
    lastOptimization: number;
  } = {
    totalUpdates: 0,
    averageCoordinationTime: 0,
    lastOptimization: 0
  };

  constructor(
    configs?: Partial<Record<RandomLevel, Partial<LevelConfig>>>,
    strategy?: Partial<CoordinationStrategy>
  ) {
    this.configs = { ...DEFAULT_LEVEL_CONFIGS };
    this.strategy = { ...DEFAULT_COORDINATION_STRATEGY, ...strategy };
    
    // 应用自定义配置
    if (configs) {
      Object.keys(configs).forEach(level => {
        if (this.configs[level as RandomLevel]) {
          this.configs[level as RandomLevel] = {
            ...this.configs[level as RandomLevel],
            ...configs[level as RandomLevel]
          };
        }
      });
    }

    // 初始化层级状态
    this.states = this.initializeLevelStates();
    
    this.setupEventListeners();
  }

  /**
   * 初始化层级状态
   */
  private initializeLevelStates(): Record<RandomLevel, LevelState> {
    const states: Record<RandomLevel, LevelState> = {} as any;
    
    Object.values(RandomLevel).forEach(level => {
      const config = this.configs[level];
      states[level] = {
        level,
        currentRandomness: (config.randomnessRange[0] + config.randomnessRange[1]) / 2,
        lastUpdate: Date.now(),
        isActive: config.enabled,
        performance: {
          updateCount: 0,
          averageUpdateTime: 0,
          errorCount: 0
        }
      };
    });
    
    return states;
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听情绪变化事件
    UnifiedEventBus.on('emotion', 'change', this.handleEmotionChange.bind(this));
    
    // 监听音频特征事件
    UnifiedEventBus.on('audio', 'features', this.handleAudioFeatures.bind(this));
    
    // 监听性能事件
    UnifiedEventBus.on('global', 'performance', this.handlePerformanceEvent.bind(this));
    
    // 监听时间事件
    UnifiedEventBus.on('time', 'tick', this.handleTimeTick.bind(this));
  }

  /**
   * 启动多层级随机系统
   */
  public start(): void {
    if (this.isInitialized) {
      console.warn('多层级随机系统已经启动');
      return;
    }

    try {
      // 启动各个层级的更新定时器
      Object.values(RandomLevel).forEach(level => {
        this.startLevelTimer(level);
      });

      this.isInitialized = true;
      console.log('🎲 多层级随机系统启动成功');

      // 发射系统就绪事件
      UnifiedEventBus.emit({
        namespace: 'random',
        type: 'multi_level_ready',
        timestamp: Date.now(),
        data: {
          levels: Object.keys(this.states),
          strategy: this.strategy.strategy
        }
      });

    } catch (error) {
      console.error('❌ 多层级随机系统启动失败:', error);
    }
  }

  /**
   * 启动层级定时器
   */
  private startLevelTimer(level: RandomLevel): void {
    const config = this.configs[level];
    if (!config.enabled) return;

    const timer = setInterval(() => {
      this.updateLevel(level);
    }, config.updateInterval);

    this.updateTimers.set(level, timer);
  }

  /**
   * 更新指定层级
   */
  private updateLevel(level: RandomLevel): void {
    const startTime = performance.now();
    
    try {
      const config = this.configs[level];
      const state = this.states[level];
      
      if (!config.enabled || !state.isActive) return;

      // 计算新的随机性值
      const newRandomness = this.calculateLevelRandomness(level);
      
      // 更新状态
      state.currentRandomness = newRandomness;
      state.lastUpdate = Date.now();
      state.performance.updateCount++;
      
      // 计算性能指标
      const updateTime = performance.now() - startTime;
      state.performance.averageUpdateTime = 
        (state.performance.averageUpdateTime * (state.performance.updateCount - 1) + updateTime) / 
        state.performance.updateCount;

      // 发射层级更新事件
      UnifiedEventBus.emit({
        namespace: 'random',
        type: 'level_updated',
        timestamp: Date.now(),
        data: {
          level,
          randomness: newRandomness,
          performance: state.performance
        }
      });

    } catch (error) {
      const state = this.states[level];
      if (state) {
        state.performance.errorCount++;
      }
      console.error(`❌ 更新层级 ${level} 失败:`, error);
    }
  }

  /**
   * 计算层级随机性值
   */
  private calculateLevelRandomness(level: RandomLevel): number {
    const config = this.configs[level];
    const state = this.states[level];
    const baseRandom = randomStateManager.random();
    
    let randomness = baseRandom;
    
    // 应用层级特定的计算逻辑
    switch (level) {
      case RandomLevel.SYSTEM:
        randomness = this.calculateSystemRandomness(baseRandom);
        break;
      case RandomLevel.EMOTION:
        randomness = this.calculateEmotionRandomness(baseRandom);
        break;
      case RandomLevel.PRESET:
        randomness = this.calculatePresetRandomness(baseRandom);
        break;
      case RandomLevel.EFFECT:
        randomness = this.calculateEffectRandomness(baseRandom);
        break;
      case RandomLevel.AUDIO:
        randomness = this.calculateAudioRandomness(baseRandom);
        break;
      case RandomLevel.TIME:
        randomness = this.calculateTimeRandomness(baseRandom);
        break;
    }
    
    // 应用依赖层级的影响
    randomness = this.applyDependencyInfluence(level, randomness);
    
    // 确保在配置范围内
    return Math.max(
      config.randomnessRange[0],
      Math.min(config.randomnessRange[1], randomness)
    );
  }

  /**
   * 计算系统级随机性
   */
  private calculateSystemRandomness(baseRandom: number): number {
    // 系统级随机性相对稳定，变化较小
    return baseRandom * 0.3 + 0.5;
  }

  /**
   * 计算情绪级随机性
   */
  private calculateEmotionRandomness(baseRandom: number): number {
    // 情绪级随机性变化较大，响应情绪变化
    const emotionVariation = Math.sin(Date.now() / 10000) * 0.2;
    return baseRandom * 0.6 + 0.2 + emotionVariation;
  }

  /**
   * 计算预设级随机性
   */
  private calculatePresetRandomness(baseRandom: number): number {
    // 预设级随机性中等变化，平衡稳定性和多样性
    return baseRandom * 0.5 + 0.25;
  }

  /**
   * 计算效果级随机性
   */
  private calculateEffectRandomness(baseRandom: number): number {
    // 效果级随机性变化较大，提供视觉多样性
    const timeVariation = Math.sin(Date.now() / 5000) * 0.3;
    return baseRandom * 0.7 + 0.15 + timeVariation;
  }

  /**
   * 计算音频级随机性
   */
  private calculateAudioRandomness(baseRandom: number): number {
    // 音频级随机性相对稳定，避免过度变化
    return baseRandom * 0.4 + 0.3;
  }

  /**
   * 计算时间级随机性
   */
  private calculateTimeRandomness(baseRandom: number): number {
    // 时间级随机性缓慢变化，提供长期变化
    const timeVariation = Math.sin(Date.now() / 30000) * 0.15;
    return baseRandom * 0.3 + 0.35 + timeVariation;
  }

  /**
   * 应用依赖层级的影响
   */
  private applyDependencyInfluence(level: RandomLevel, randomness: number): number {
    const config = this.configs[level];
    let influence = 0;
    let totalWeight = 0;
    
    config.dependencies.forEach(depLevel => {
      const depState = this.states[depLevel];
      if (depState && depState.isActive) {
        const depWeight = this.configs[depLevel].weight;
        influence += depState.currentRandomness * depWeight;
        totalWeight += depWeight;
      }
    });
    
    if (totalWeight > 0) {
      const avgInfluence = influence / totalWeight;
      const influenceFactor = this.strategy.parameters.hierarchyWeight;
      randomness = randomness * (1 - influenceFactor) + avgInfluence * influenceFactor;
    }
    
    return randomness;
  }

  /**
   * 协调所有层级的随机性
   */
  public coordinateRandomness(): Record<RandomLevel, number> {
    const startTime = performance.now();
    
    try {
      const coordinated: Record<RandomLevel, number> = {} as any;
      
      // 根据策略协调各个层级
      switch (this.strategy.strategy) {
        case 'hierarchical':
          coordinated = this.coordinateHierarchical();
          break;
        case 'weighted':
          coordinated = this.coordinateWeighted();
          break;
        case 'adaptive':
          coordinated = this.coordinateAdaptive();
          break;
        case 'cascade':
          coordinated = this.coordinateCascade();
          break;
        default:
          coordinated = this.coordinateAdaptive();
      }
      
      // 更新性能指标
      const coordinationTime = performance.now() - startTime;
      this.performanceMetrics.totalUpdates++;
      this.performanceMetrics.averageCoordinationTime = 
        (this.performanceMetrics.averageCoordinationTime * (this.performanceMetrics.totalUpdates - 1) + coordinationTime) / 
        this.performanceMetrics.totalUpdates;
      
      // 发射协调完成事件
      UnifiedEventBus.emit({
        namespace: 'random',
        type: 'coordination_complete',
        timestamp: Date.now(),
        data: {
          coordinated,
          performance: this.performanceMetrics,
          strategy: this.strategy.strategy
        }
      });
      
      return coordinated;
      
    } catch (error) {
      console.error('❌ 随机性协调失败:', error);
      return this.getCurrentRandomness();
    }
  }

  /**
   * 分层协调策略
   */
  private coordinateHierarchical(): Record<RandomLevel, number> {
    const coordinated: Record<RandomLevel, number> = {} as any;
    
    // 从系统级开始，逐层向下协调
    Object.values(RandomLevel).forEach(level => {
      if (level === RandomLevel.SYSTEM) {
        coordinated[level] = this.states[level].currentRandomness;
      } else {
        const config = this.configs[level];
        const state = this.states[level];
        const dependencyInfluence = this.calculateDependencyInfluence(level);
        
        coordinated[level] = state.currentRandomness * (1 - config.weight) + 
                           dependencyInfluence * config.weight;
      }
    });
    
    return coordinated;
  }

  /**
   * 权重协调策略
   */
  private coordinateWeighted(): Record<RandomLevel, number> {
    const coordinated: Record<RandomLevel, number> = {} as any;
    
    Object.values(RandomLevel).forEach(level => {
      const config = this.configs[level];
      const state = this.states[level];
      
      if (config.enabled && state.isActive) {
        coordinated[level] = state.currentRandomness * config.weight;
      } else {
        coordinated[level] = 0;
      }
    });
    
    return coordinated;
  }

  /**
   * 自适应协调策略
   */
  private coordinateAdaptive(): Record<RandomLevel, number> {
    const coordinated: Record<RandomLevel, number> = {} as any;
    const performanceFactor = this.calculatePerformanceFactor();
    
    Object.values(RandomLevel).forEach(level => {
      const config = this.configs[level];
      const state = this.states[level];
      
      if (config.enabled && state.isActive) {
        // 根据性能调整权重
        const adjustedWeight = config.weight * performanceFactor;
        coordinated[level] = state.currentRandomness * adjustedWeight;
      } else {
        coordinated[level] = 0;
      }
    });
    
    return coordinated;
  }

  /**
   * 级联协调策略
   */
  private coordinateCascade(): Record<RandomLevel, number> {
    const coordinated: Record<RandomLevel, number> = {} as any;
    
    // 按依赖顺序协调
    const sortedLevels = this.getSortedLevelsByDependency();
    
    sortedLevels.forEach(level => {
      const config = this.configs[level];
      const state = this.states[level];
      
      if (config.enabled && state.isActive) {
        const cascadeInfluence = this.calculateCascadeInfluence(level);
        coordinated[level] = state.currentRandomness * (1 - cascadeInfluence) + 
                           cascadeInfluence * 0.5;
      } else {
        coordinated[level] = 0;
      }
    });
    
    return coordinated;
  }

  /**
   * 计算依赖影响
   */
  private calculateDependencyInfluence(level: RandomLevel): number {
    const config = this.configs[level];
    let influence = 0;
    let totalWeight = 0;
    
    config.dependencies.forEach(depLevel => {
      const depState = this.states[depLevel];
      if (depState && depState.isActive) {
        const depWeight = this.configs[depLevel].weight;
        influence += depState.currentRandomness * depWeight;
        totalWeight += depWeight;
      }
    });
    
    return totalWeight > 0 ? influence / totalWeight : 0;
  }

  /**
   * 计算级联影响
   */
  private calculateCascadeInfluence(level: RandomLevel): number {
    const config = this.configs[level];
    let cascadeEffect = 0;
    
    config.dependencies.forEach(depLevel => {
      const depState = this.states[depLevel];
      if (depState && depState.isActive) {
        cascadeEffect += depState.currentRandomness * 0.3;
      }
    });
    
    return Math.min(1, cascadeEffect);
  }

  /**
   * 获取按依赖排序的层级
   */
  private getSortedLevelsByDependency(): RandomLevel[] {
    const sorted: RandomLevel[] = [];
    const visited = new Set<RandomLevel>();
    
    const visit = (level: RandomLevel) => {
      if (visited.has(level)) return;
      
      const config = this.configs[level];
      config.dependencies.forEach(dep => visit(dep));
      
      visited.add(level);
      sorted.push(level);
    };
    
    Object.values(RandomLevel).forEach(level => visit(level));
    return sorted;
  }

  /**
   * 计算性能因子
   */
  private calculatePerformanceFactor(): number {
    const threshold = this.strategy.parameters.performanceThreshold;
    const avgTime = this.performanceMetrics.averageCoordinationTime;
    
    if (avgTime < threshold) {
      return 1.0; // 性能良好，保持正常权重
    } else {
      return Math.max(0.3, 1.0 - (avgTime - threshold) / threshold); // 性能下降，降低权重
    }
  }

  /**
   * 获取当前随机性值
   */
  public getCurrentRandomness(): Record<RandomLevel, number> {
    const result: Record<RandomLevel, number> = {} as any;
    
    Object.values(RandomLevel).forEach(level => {
      result[level] = this.states[level].currentRandomness;
    });
    
    return result;
  }

  /**
   * 获取层级状态
   */
  public getLevelStates(): Record<RandomLevel, LevelState> {
    return { ...this.states };
  }

  /**
   * 获取性能指标
   */
  public getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * 更新层级配置
   */
  public updateLevelConfig(level: RandomLevel, config: Partial<LevelConfig>): void {
    if (this.configs[level]) {
      this.configs[level] = { ...this.configs[level], ...config };
      
      // 如果更新间隔改变，重启定时器
      if (config.updateInterval) {
        this.restartLevelTimer(level);
      }
      
      console.log(`🔄 层级 ${level} 配置已更新`);
    }
  }

  /**
   * 重启层级定时器
   */
  private restartLevelTimer(level: RandomLevel): void {
    const existingTimer = this.updateTimers.get(level);
    if (existingTimer) {
      clearInterval(existingTimer);
    }
    
    this.startLevelTimer(level);
  }

  /**
   * 事件处理器
   */
  private handleEmotionChange(event: any): void {
    // 情绪变化时调整相关层级的权重
    const emotionData = event.data?.mood;
    if (emotionData) {
      this.adjustEmotionLevels(emotionData);
    }
  }

  private handleAudioFeatures(event: any): void {
    // 音频特征变化时调整音频层级
    const audioData = event.data;
    if (audioData) {
      this.adjustAudioLevel(audioData);
    }
  }

  private handlePerformanceEvent(event: any): void {
    // 性能事件时优化系统
    const performanceData = event.data;
    if (performanceData) {
      this.optimizeForPerformance(performanceData);
    }
  }

  private handleTimeTick(event: any): void {
    // 时间事件时更新时间层级
    this.updateTimeLevel();
  }

  /**
   * 调整情绪相关层级
   */
  private adjustEmotionLevels(emotion: { energy: number; valence: number; arousal: number }): void {
    const { energy, valence, arousal } = emotion;
    
    // 调整情绪层级权重
    const emotionConfig = this.configs[RandomLevel.EMOTION];
    const newWeight = Math.max(0.3, Math.min(1.0, 
      emotionConfig.weight * (0.8 + energy * 0.4)
    ));
    
    this.updateLevelConfig(RandomLevel.EMOTION, { weight: newWeight });
  }

  /**
   * 调整音频层级
   */
  private adjustAudioLevel(audioData: any): void {
    // 根据音频特征调整音频层级
    const audioConfig = this.configs[RandomLevel.AUDIO];
    const complexity = audioData.complexity || 0.5;
    
    const newWeight = Math.max(0.2, Math.min(0.8, 
      audioConfig.weight * (0.6 + complexity * 0.4)
    ));
    
    this.updateLevelConfig(RandomLevel.AUDIO, { weight: newWeight });
  }

  /**
   * 性能优化
   */
  private optimizeForPerformance(performanceData: any): void {
    const { fps, memoryUsage, cpuUsage } = performanceData;
    
    // 如果性能下降，降低更新频率
    if (fps < 30 || memoryUsage > 0.8 || cpuUsage > 0.8) {
      Object.values(RandomLevel).forEach(level => {
        const config = this.configs[level];
        const newInterval = Math.min(config.updateInterval * 2, 10000);
        this.updateLevelConfig(level, { updateInterval: newInterval });
      });
      
      console.log('⚡ 性能优化：降低随机系统更新频率');
    }
  }

  /**
   * 更新时间层级
   */
  private updateTimeLevel(): void {
    const timeConfig = this.configs[RandomLevel.TIME];
    const timeState = this.states[RandomLevel.TIME];
    
    // 时间层级使用正弦波变化，提供缓慢的长期变化
    const timeVariation = Math.sin(Date.now() / 30000) * 0.15;
    timeState.currentRandomness = 0.3 + timeVariation;
  }

  /**
   * 停止系统
   */
  public stop(): void {
    if (!this.isInitialized) return;
    
    // 清除所有定时器
    this.updateTimers.forEach(timer => clearInterval(timer));
    this.updateTimers.clear();
    
    this.isInitialized = false;
    console.log('🛑 多层级随机系统已停止');
  }

  /**
   * 销毁系统
   */
  public destroy(): void {
    this.stop();
    
    // 清理事件监听器
    UnifiedEventBus.off('emotion', 'change', this.handleEmotionChange.bind(this));
    UnifiedEventBus.off('audio', 'features', this.handleAudioFeatures.bind(this));
    UnifiedEventBus.off('global', 'performance', this.handlePerformanceEvent.bind(this));
    UnifiedEventBus.off('time', 'tick', this.handleTimeTick.bind(this));
  }
}

// 创建默认实例
export const multiLevelRandomSystem = new MultiLevelRandomSystem();
