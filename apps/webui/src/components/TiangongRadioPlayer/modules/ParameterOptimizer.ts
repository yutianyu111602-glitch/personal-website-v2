/**
 * 参数优化器模块
 * 负责优化随机性控制参数以提高系统性能
 * TASK-126: 模块化RandomnessControlParameterManager
 */

import type { RandomnessControlParameters } from '../randomnessControlParameters';
import { UnifiedEventBus } from '../../events/UnifiedEventBus';

// 优化策略接口
export interface OptimizationStrategy {
  name: string;
  description: string;
  priority: number;
  enabled: boolean;
  apply: (parameters: RandomnessControlParameters, context: OptimizationContext) => Partial<RandomnessControlParameters>;
}

// 优化上下文接口
export interface OptimizationContext {
  emotionState?: {
    energy: number;
    valence: number;
    arousal: number;
  };
  performanceMetrics?: {
    fps: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  timeContext?: {
    currentTime: number;
    timeSinceLastUpdate: number;
    timeOfDay: number;
  };
  userPreferences?: {
    preferredChaosLevel: number;
    preferredPerformanceLevel: number;
    preferredEmotionResponse: number;
  };
}

// 优化结果接口
export interface OptimizationResult {
  success: boolean;
  optimizedParameters: Partial<RandomnessControlParameters>;
  appliedStrategies: string[];
  performanceImprovement: number;
  warnings: string[];
  timestamp: number;
}

// 优化配置接口
export interface OptimizationConfig {
  enableAutoOptimization: boolean;
  optimizationInterval: number;
  maxOptimizationAttempts: number;
  performanceThreshold: number;
  enableEmotionOptimization: boolean;
  enablePerformanceOptimization: boolean;
  enableTimeOptimization: boolean;
}

// 默认优化配置
export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  enableAutoOptimization: true,
  optimizationInterval: 5000, // 5秒
  maxOptimizationAttempts: 3,
  performanceThreshold: 0.8,
  enableEmotionOptimization: true,
  enablePerformanceOptimization: true,
  enableTimeOptimization: true
};

/**
 * 参数优化器类
 * 提供智能的参数优化功能
 */
export class ParameterOptimizer {
  private strategies: OptimizationStrategy[] = [];
  private config: OptimizationConfig;
  private isInitialized: boolean = false;
  private optimizationTimer?: NodeJS.Timeout;
  private optimizationHistory: OptimizationResult[] = [];
  private maxHistoryLength: number = 50;

  constructor(config?: Partial<OptimizationConfig>) {
    this.config = { ...DEFAULT_OPTIMIZATION_CONFIG, ...config };
    this.initializeStrategies();
  }

  /**
   * 初始化优化器
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    try {
      // 启动自动优化
      if (this.config.enableAutoOptimization) {
        this.startAutoOptimization();
      }
      
      this.isInitialized = true;
      console.log('🚀 参数优化器初始化成功');
      
    } catch (error) {
      console.error('❌ 参数优化器初始化失败:', error);
    }
  }

  /**
   * 初始化优化策略
   */
  private initializeStrategies(): void {
    // 情绪优化策略
    this.strategies.push({
      name: '情绪响应优化',
      description: '根据当前情绪状态优化参数',
      priority: 1,
      enabled: this.config.enableEmotionOptimization,
      apply: this.optimizeForEmotion.bind(this)
    });

    // 性能优化策略
    this.strategies.push({
      name: '性能优化',
      description: '根据性能指标优化参数',
      priority: 2,
      enabled: this.config.enablePerformanceOptimization,
      apply: this.optimizeForPerformance.bind(this)
    });

    // 时间优化策略
    this.strategies.push({
      name: '时间优化',
      description: '根据时间上下文优化参数',
      priority: 3,
      enabled: this.config.enableTimeOptimization,
      apply: this.optimizeForTime.bind(this)
    });

    // 混沌平衡策略
    this.strategies.push({
      name: '混沌平衡',
      description: '平衡混沌级别和系统稳定性',
      priority: 4,
      enabled: true,
      apply: this.optimizeChaosBalance.bind(this)
    });

    // 层级协调策略
    this.strategies.push({
      name: '层级协调',
      description: '优化层级间的协调性',
      priority: 5,
      enabled: true,
      apply: this.optimizeLevelCoordination.bind(this)
    });
  }

  /**
   * 优化参数
   */
  public optimizeParameters(
    currentParameters: RandomnessControlParameters,
    context: OptimizationContext
  ): OptimizationResult {
    try {
      const enabledStrategies = this.strategies
        .filter(strategy => strategy.enabled)
        .sort((a, b) => a.priority - b.priority);

      let optimizedParameters = { ...currentParameters };
      const appliedStrategies: string[] = [];
      const warnings: string[] = [];

      // 应用每个策略
      enabledStrategies.forEach(strategy => {
        try {
          const strategyResult = strategy.apply(optimizedParameters, context);
          optimizedParameters = { ...optimizedParameters, ...strategyResult };
          appliedStrategies.push(strategy.name);
        } catch (error) {
          warnings.push(`策略 ${strategy.name} 应用失败: ${error.message}`);
        }
      });

      // 计算性能改进
      const performanceImprovement = this.calculatePerformanceImprovement(
        currentParameters,
        optimizedParameters,
        context
      );

      // 创建优化结果
      const result: OptimizationResult = {
        success: true,
        optimizedParameters,
        appliedStrategies,
        performanceImprovement,
        warnings,
        timestamp: Date.now()
      };

      // 保存到历史记录
      this.optimizationHistory.push(result);
      if (this.optimizationHistory.length > this.maxHistoryLength) {
        this.optimizationHistory.shift();
      }

      // 发射优化完成事件
      UnifiedEventBus.emit({
        namespace: 'random',
        type: 'parameters_optimized',
        timestamp: Date.now(),
        data: result
      });

      return result;

    } catch (error) {
      console.error('❌ 参数优化失败:', error);
      
      return {
        success: false,
        optimizedParameters: {},
        appliedStrategies: [],
        performanceImprovement: 0,
        warnings: [error.message],
        timestamp: Date.now()
      };
    }
  }

  /**
   * 情绪响应优化策略
   */
  private optimizeForEmotion(
    parameters: RandomnessControlParameters,
    context: OptimizationContext
  ): Partial<RandomnessControlParameters> {
    if (!context.emotionState) return {};

    const { energy, valence, arousal } = context.emotionState;
    const optimized: Partial<RandomnessControlParameters> = {};

    // 根据能量调整基础随机性
    if (energy > 0.7) {
      optimized.baseRandomness = Math.min(1, parameters.baseRandomness * 1.2);
      optimized.randomnessAmplitude = Math.min(1, parameters.randomnessAmplitude * 1.1);
    } else if (energy < 0.3) {
      optimized.baseRandomness = Math.max(0.1, parameters.baseRandomness * 0.8);
      optimized.randomnessAmplitude = Math.max(0.1, parameters.randomnessAmplitude * 0.9);
    }

    // 根据效价调整情绪影响
    if (Math.abs(valence - 0.5) > 0.3) {
      optimized.emotionInfluence = Math.min(1, parameters.emotionInfluence * 1.1);
    }

    // 根据激活调整时间参数
    if (arousal > 0.7) {
      optimized.timeAcceleration = Math.min(2, parameters.timeAcceleration * 1.2);
    } else if (arousal < 0.3) {
      optimized.timeDecay = Math.max(0.05, parameters.timeDecay * 0.9);
    }

    return optimized;
  }

  /**
   * 性能优化策略
   */
  private optimizeForPerformance(
    parameters: RandomnessControlParameters,
    context: OptimizationContext
  ): Partial<RandomnessControlParameters> {
    if (!context.performanceMetrics) return {};

    const { fps, memoryUsage, cpuUsage } = context.performanceMetrics;
    const optimized: Partial<RandomnessControlParameters> = {};

    // 根据FPS调整更新频率
    if (fps < 30) {
      // 性能较差时，降低更新频率
      Object.keys(parameters.levelSpecificControls).forEach(level => {
        const control = parameters.levelSpecificControls[level as keyof typeof parameters.levelSpecificControls];
        if (control.updateInterval < 1000) {
          optimized.levelSpecificControls = {
            ...optimized.levelSpecificControls,
            [level]: {
              ...control,
              updateInterval: Math.min(2000, control.updateInterval * 1.5)
            }
          };
        }
      });
    }

    // 根据内存使用调整参数
    if (memoryUsage > 0.8) {
      optimized.performanceScaling = Math.max(0.5, parameters.performanceScaling * 0.8);
      optimized.randomnessAmplitude = Math.max(0.3, parameters.randomnessAmplitude * 0.9);
    }

    // 根据CPU使用调整
    if (cpuUsage > 0.8) {
      optimized.adaptiveRandomness = true;
      optimized.performanceThreshold = Math.min(0.9, parameters.performanceThreshold * 1.1);
    }

    return optimized;
  }

  /**
   * 时间优化策略
   */
  private optimizeForTime(
    parameters: RandomnessControlParameters,
    context: OptimizationContext
  ): Partial<RandomnessControlParameters> {
    if (!context.timeContext) return {};

    const { timeOfDay, timeSinceLastUpdate } = context.timeContext;
    const optimized: Partial<RandomnessControlParameters> = {};

    // 根据一天中的时间调整
    const hour = new Date().getHours();
    
    if (hour >= 22 || hour <= 6) {
      // 夜间模式：降低随机性
      optimized.baseRandomness = Math.max(0.2, parameters.baseRandomness * 0.7);
      optimized.chaosLevel = Math.max(0.1, parameters.chaosLevel * 0.6);
    } else if (hour >= 9 && hour <= 17) {
      // 工作时间：中等随机性
      optimized.baseRandomness = Math.min(1, parameters.baseRandomness * 1.1);
      optimized.chaosLevel = Math.min(1, parameters.chaosLevel * 1.05);
    }

    // 根据更新间隔调整
    if (timeSinceLastUpdate > 30000) { // 30秒
      optimized.randomnessFrequency = Math.min(1, parameters.randomnessFrequency * 1.2);
    }

    return optimized;
  }

  /**
   * 混沌平衡优化策略
   */
  private optimizeChaosBalance(
    parameters: RandomnessControlParameters,
    context: OptimizationContext
  ): Partial<RandomnessControlParameters> {
    const optimized: Partial<RandomnessControlParameters> = {};

    // 平衡混沌级别和熵目标
    if (parameters.chaosLevel > 0.8 && parameters.entropyTarget < 0.4) {
      optimized.entropyTarget = Math.min(0.8, parameters.entropyTarget * 1.3);
    }

    if (parameters.chaosLevel < 0.2 && parameters.entropyTarget > 0.7) {
      optimized.chaosLevel = Math.min(0.6, parameters.chaosLevel * 1.5);
    }

    // 调整噪声级别以平衡混沌
    const targetNoiseLevel = parameters.chaosLevel * 0.5;
    if (Math.abs(parameters.noiseLevel - targetNoiseLevel) > 0.1) {
      optimized.noiseLevel = targetNoiseLevel;
    }

    return optimized;
  }

  /**
   * 层级协调优化策略
   */
  private optimizeLevelCoordination(
    parameters: RandomnessControlParameters,
    context: OptimizationContext
  ): Partial<RandomnessControlParameters> {
    const optimized: Partial<RandomnessControlParameters> = {};

    // 检查权重分布
    const totalWeight = Object.values(parameters.levelSpecificControls)
      .reduce((sum, control) => sum + control.weight, 0);

    if (totalWeight > 5) {
      // 权重过高，需要降低
      Object.keys(parameters.levelSpecificControls).forEach(level => {
        const control = parameters.levelSpecificControls[level as keyof typeof parameters.levelSpecificControls];
        optimized.levelSpecificControls = {
          ...optimized.levelSpecificControls,
          [level]: {
            ...control,
            weight: Math.max(0.1, control.weight * 0.8)
          }
        };
      });
    } else if (totalWeight < 2) {
      // 权重过低，需要提高
      Object.keys(parameters.levelSpecificControls).forEach(level => {
        const control = parameters.levelSpecificControls[level as keyof typeof parameters.levelSpecificControls];
        optimized.levelSpecificControls = {
          ...optimized.levelSpecificControls,
          [level]: {
            ...control,
            weight: Math.min(1, control.weight * 1.2)
          }
        };
      });
    }

    return optimized;
  }

  /**
   * 计算性能改进
   */
  private calculatePerformanceImprovement(
    oldParameters: RandomnessControlParameters,
    newParameters: RandomnessControlParameters,
    context: OptimizationContext
  ): number {
    let improvement = 0;

    // 基于性能指标的改进计算
    if (context.performanceMetrics) {
      const { fps, memoryUsage, cpuUsage } = context.performanceMetrics;
      
      // FPS改进
      if (fps < 30) improvement += 0.3;
      else if (fps < 45) improvement += 0.2;
      else if (fps < 60) improvement += 0.1;
      
      // 内存使用改进
      if (memoryUsage > 0.8) improvement += 0.2;
      else if (memoryUsage > 0.6) improvement += 0.1;
      
      // CPU使用改进
      if (cpuUsage > 0.8) improvement += 0.2;
      else if (cpuUsage > 0.6) improvement += 0.1;
    }

    // 基于参数变化的改进计算
    const parameterChanges = this.calculateParameterChanges(oldParameters, newParameters);
    improvement += parameterChanges * 0.1;

    return Math.min(1, Math.max(0, improvement));
  }

  /**
   * 计算参数变化
   */
  private calculateParameterChanges(
    oldParameters: RandomnessControlParameters,
    newParameters: RandomnessControlParameters
  ): number {
    let changes = 0;
    let totalParams = 0;

    Object.keys(oldParameters).forEach(key => {
      const oldValue = oldParameters[key as keyof RandomnessControlParameters];
      const newValue = newParameters[key as keyof RandomnessControlParameters];
      
      if (oldValue !== newValue) {
        changes++;
      }
      totalParams++;
    });

    return totalParams > 0 ? changes / totalParams : 0;
  }

  /**
   * 启动自动优化
   */
  private startAutoOptimization(): void {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
    }

    this.optimizationTimer = setInterval(() => {
      this.performAutoOptimization();
    }, this.config.optimizationInterval);
  }

  /**
   * 执行自动优化
   */
  private performAutoOptimization(): void {
    // 这里需要从外部获取当前参数和上下文
    // 暂时跳过，等待外部调用
    console.log('🔄 自动优化检查中...');
  }

  /**
   * 获取优化历史
   */
  public getOptimizationHistory(): OptimizationResult[] {
    return [...this.optimizationHistory];
  }

  /**
   * 获取优化统计
   */
  public getOptimizationStats(): {
    totalOptimizations: number;
    successfulOptimizations: number;
    averageImprovement: number;
    lastOptimization: number;
  } {
    if (this.optimizationHistory.length === 0) {
      return {
        totalOptimizations: 0,
        successfulOptimizations: 0,
        averageImprovement: 0,
        lastOptimization: 0
      };
    }

    const successful = this.optimizationHistory.filter(result => result.success);
    const averageImprovement = this.optimizationHistory.reduce((sum, result) => 
      sum + result.performanceImprovement, 0
    ) / this.optimizationHistory.length;

    return {
      totalOptimizations: this.optimizationHistory.length,
      successfulOptimizations: successful.length,
      averageImprovement,
      lastOptimization: this.optimizationHistory[this.optimizationHistory.length - 1].timestamp
    };
  }

  /**
   * 更新优化配置
   */
  public updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 重新启动自动优化
    if (this.config.enableAutoOptimization) {
      this.startAutoOptimization();
    } else if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
    }

    console.log('🔄 优化配置已更新');
  }

  /**
   * 添加自定义优化策略
   */
  public addCustomStrategy(strategy: OptimizationStrategy): void {
    this.strategies.push(strategy);
    console.log(`➕ 添加自定义优化策略: ${strategy.name}`);
  }

  /**
   * 启用/禁用策略
   */
  public toggleStrategy(strategyName: string, enabled: boolean): boolean {
    const strategy = this.strategies.find(s => s.name === strategyName);
    if (strategy) {
      strategy.enabled = enabled;
      console.log(`${enabled ? '✅' : '❌'} 策略 ${strategyName} 已${enabled ? '启用' : '禁用'}`);
      return true;
    }
    return false;
  }

  /**
   * 获取所有策略
   */
  public getStrategies(): OptimizationStrategy[] {
    return [...this.strategies];
  }

  /**
   * 销毁优化器
   */
  public destroy(): void {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
    }
    
    this.optimizationHistory = [];
    this.isInitialized = false;
    
    console.log('🛑 参数优化器已销毁');
  }
}

// 创建默认优化器实例
export const parameterOptimizer = new ParameterOptimizer();
