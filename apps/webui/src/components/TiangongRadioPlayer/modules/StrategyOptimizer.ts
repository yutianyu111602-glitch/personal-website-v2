/**
 * 策略优化器模块
 * 负责优化种子生成策略
 * TASK-128: 模块化AdvancedSeedGenerator
 */

import type { SeedGenerationStrategy, StrategyPerformanceMetrics } from './SeedStrategyManager';
import type { SeedQualityMetrics } from './QualityEvaluator';

// 优化配置接口
export interface OptimizationConfig {
  // 优化参数
  enableAutoOptimization: boolean;    // 是否启用自动优化
  optimizationInterval: number;        // 优化间隔(ms)
  minDataPoints: number;              // 最小数据点数量
  qualityThreshold: number;           // 质量阈值 (0-1)
  performanceThreshold: number;       // 性能阈值 (0-1)
  
  // 优化策略
  optimizationStrategies: {
    enableParameterTuning: boolean;   // 是否启用参数调优
    enableStrategySwitching: boolean; // 是否启用策略切换
    enableHybridOptimization: boolean; // 是否启用混合优化
    enableAdaptiveLearning: boolean;  // 是否启用自适应学习
  };
  
  // 学习参数
  learningRate: number;               // 学习率 (0-1)
  explorationRate: number;            // 探索率 (0-1)
  exploitationRate: number;           // 利用率 (0-1)
}

// 默认配置
export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  enableAutoOptimization: true,
  optimizationInterval: 60000, // 1分钟
  minDataPoints: 100,
  qualityThreshold: 0.8,
  performanceThreshold: 0.7,
  optimizationStrategies: {
    enableParameterTuning: true,
    enableStrategySwitching: true,
    enableHybridOptimization: true,
    enableAdaptiveLearning: true
  },
  learningRate: 0.1,
  explorationRate: 0.2,
  exploitationRate: 0.8
};

// 优化结果接口
export interface OptimizationResult {
  timestamp: number;
  strategy: SeedGenerationStrategy;
  optimizationType: 'parameter_tuning' | 'strategy_switching' | 'hybrid_optimization' | 'adaptive_learning';
  oldMetrics: {
    quality: number;
    performance: number;
  };
  newMetrics: {
    quality: number;
    performance: number;
  };
  improvement: number;                // 改进程度 (0-1)
  parameters: Record<string, any>;    // 优化后的参数
  reasoning: string[];                // 优化原因
}

// 参数调优结果接口
export interface ParameterTuningResult {
  strategy: SeedGenerationStrategy;
  parameters: Record<string, any>;
  expectedImprovement: number;
  confidence: number;
  tuningHistory: Array<{
    timestamp: number;
    parameters: Record<string, any>;
    quality: number;
    performance: number;
  }>;
}

// 策略切换结果接口
export interface StrategySwitchingResult {
  oldStrategy: SeedGenerationStrategy;
  newStrategy: SeedGenerationStrategy;
  reason: string;
  expectedBenefit: number;
  confidence: number;
  alternatives: SeedGenerationStrategy[];
}

// 混合优化结果接口
export interface HybridOptimizationResult {
  primaryStrategy: SeedGenerationStrategy;
  secondaryStrategy: SeedGenerationStrategy;
  blendRatio: number;
  expectedQuality: number;
  expectedPerformance: number;
  optimizationHistory: Array<{
    timestamp: number;
    blendRatio: number;
    quality: number;
    performance: number;
  }>;
}

/**
 * 策略优化器类
 * 提供完整的策略优化功能
 */
export class StrategyOptimizer {
  private config: OptimizationConfig;
  private isInitialized: boolean = false;
  private optimizationHistory: OptimizationResult[] = [];
  private maxHistoryLength: number = 1000;
  private optimizationTimer: NodeJS.Timeout | null = null;
  private lastOptimization: number = 0;

  constructor(config?: Partial<OptimizationConfig>) {
    this.config = { ...DEFAULT_OPTIMIZATION_CONFIG, ...config };
  }

  /**
   * 初始化策略优化器
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    try {
      if (this.config.enableAutoOptimization) {
        this.startAutoOptimization();
      }
      
      this.isInitialized = true;
      console.log('🚀 策略优化器初始化成功');
      
    } catch (error) {
      console.error('❌ 策略优化器初始化失败:', error);
    }
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
   * 停止自动优化
   */
  private stopAutoOptimization(): void {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = null;
    }
  }

  /**
   * 执行自动优化
   */
  private performAutoOptimization(): void {
    const now = Date.now();
    
    // 检查是否达到最小数据点要求
    if (this.optimizationHistory.length < this.config.minDataPoints) {
      return;
    }
    
    // 检查是否达到优化间隔
    if (now - this.lastOptimization < this.config.optimizationInterval) {
      return;
    }
    
    try {
      console.log('🔄 开始自动优化...');
      
      // 执行各种优化策略
      let optimizationPerformed = false;
      
      if (this.config.optimizationStrategies.enableParameterTuning) {
        const tuningResult = this.optimizeParameters();
        if (tuningResult) {
          this.recordOptimizationResult(tuningResult);
          optimizationPerformed = true;
        }
      }
      
      if (this.config.optimizationStrategies.enableStrategySwitching) {
        const switchingResult = this.optimizeStrategySelection();
        if (switchingResult) {
          this.recordOptimizationResult(switchingResult);
          optimizationPerformed = true;
        }
      }
      
      if (this.config.optimizationStrategies.enableHybridOptimization) {
        const hybridResult = this.optimizeHybridStrategy();
        if (hybridResult) {
          this.recordOptimizationResult(hybridResult);
          optimizationPerformed = true;
        }
      }
      
      if (this.config.optimizationStrategies.enableAdaptiveLearning) {
        const learningResult = this.performAdaptiveLearning();
        if (learningResult) {
          this.recordOptimizationResult(learningResult);
          optimizationPerformed = true;
        }
      }
      
      if (optimizationPerformed) {
        this.lastOptimization = now;
        console.log('✅ 自动优化完成');
      } else {
        console.log('ℹ️ 无需优化');
      }
      
    } catch (error) {
      console.error('❌ 自动优化失败:', error);
    }
  }

  /**
   * 优化参数
   */
  public optimizeParameters(): OptimizationResult | null {
    try {
      // 分析历史数据，找出最佳参数组合
      const bestParameters = this.findBestParameters();
      
      if (!bestParameters) {
        return null;
      }
      
      const { strategy, parameters, quality, performance } = bestParameters;
      
      // 创建优化结果
      const result: OptimizationResult = {
        timestamp: Date.now(),
        strategy,
        optimizationType: 'parameter_tuning',
        oldMetrics: {
          quality: this.getAverageQuality(),
          performance: this.getAveragePerformance()
        },
        newMetrics: {
          quality,
          performance
        },
        improvement: this.calculateImprovement(
          this.getAverageQuality(),
          this.getAveragePerformance(),
          quality,
          performance
        ),
        parameters,
        reasoning: [
          `参数调优: 基于历史数据分析`,
          `策略: ${strategy}`,
          `预期质量提升: ${((quality - this.getAverageQuality()) * 100).toFixed(1)}%`,
          `预期性能提升: ${((performance - this.getAveragePerformance()) * 100).toFixed(1)}%`
        ]
      };
      
      return result;
      
    } catch (error) {
      console.error('❌ 参数优化失败:', error);
      return null;
    }
  }

  /**
   * 优化策略选择
   */
  public optimizeStrategySelection(): OptimizationResult | null {
    try {
      // 分析各策略的性能表现
      const strategyPerformance = this.analyzeStrategyPerformance();
      
      if (!strategyPerformance) {
        return null;
      }
      
      const { bestStrategy, quality, performance } = strategyPerformance;
      
      // 创建优化结果
      const result: OptimizationResult = {
        timestamp: Date.now(),
        strategy: bestStrategy,
        optimizationType: 'strategy_switching',
        oldMetrics: {
          quality: this.getAverageQuality(),
          performance: this.getAveragePerformance()
        },
        newMetrics: {
          quality,
          performance
        },
        improvement: this.calculateImprovement(
          this.getAverageQuality(),
          this.getAveragePerformance(),
          quality,
          performance
        ),
        parameters: { strategy: bestStrategy },
        reasoning: [
          `策略切换: 基于性能分析`,
          `新策略: ${bestStrategy}`,
          `预期质量提升: ${((quality - this.getAverageQuality()) * 100).toFixed(1)}%`,
          `预期性能提升: ${((performance - this.getAveragePerformance()) * 100).toFixed(1)}%`
        ]
      };
      
      return result;
      
    } catch (error) {
      console.error('❌ 策略选择优化失败:', error);
      return null;
    }
  }

  /**
   * 优化混合策略
   */
  public optimizeHybridStrategy(): OptimizationResult | null {
    try {
      // 分析混合策略的最佳组合
      const hybridConfig = this.optimizeHybridConfiguration();
      
      if (!hybridConfig) {
        return null;
      }
      
      const { primaryStrategy, secondaryStrategy, blendRatio, quality, performance } = hybridConfig;
      
      // 创建优化结果
      const result: OptimizationResult = {
        timestamp: Date.now(),
        strategy: 'hybrid' as SeedGenerationStrategy,
        optimizationType: 'hybrid_optimization',
        oldMetrics: {
          quality: this.getAverageQuality(),
          performance: this.getAveragePerformance()
        },
        newMetrics: {
          quality,
          performance
        },
        improvement: this.calculateImprovement(
          this.getAverageQuality(),
          this.getAveragePerformance(),
          quality,
          performance
        ),
        parameters: {
          primaryStrategy,
          secondaryStrategy,
          blendRatio
        },
        reasoning: [
          `混合策略优化: 基于策略组合分析`,
          `主策略: ${primaryStrategy}`,
          `次策略: ${secondaryStrategy}`,
          `混合比例: ${(blendRatio * 100).toFixed(1)}%`,
          `预期质量提升: ${((quality - this.getAverageQuality()) * 100).toFixed(1)}%`
        ]
      };
      
      return result;
      
    } catch (error) {
      console.error('❌ 混合策略优化失败:', error);
      return null;
    }
  }

  /**
   * 执行自适应学习
   */
  public performAdaptiveLearning(): OptimizationResult | null {
    try {
      // 基于历史数据学习最佳配置
      const learnedConfig = this.learnOptimalConfiguration();
      
      if (!learnedConfig) {
        return null;
      }
      
      const { strategy, parameters, quality, performance } = learnedConfig;
      
      // 创建优化结果
      const result: OptimizationResult = {
        timestamp: Date.now(),
        strategy,
        optimizationType: 'adaptive_learning',
        oldMetrics: {
          quality: this.getAverageQuality(),
          performance: this.getAveragePerformance()
        },
        newMetrics: {
          quality,
          performance
        },
        improvement: this.calculateImprovement(
          this.getAverageQuality(),
          this.getAveragePerformance(),
          quality,
          performance
        ),
        parameters,
        reasoning: [
          `自适应学习: 基于机器学习算法`,
          `学习策略: ${strategy}`,
          `学习参数: ${JSON.stringify(parameters)}`,
          `预期质量提升: ${((quality - this.getAverageQuality()) * 100).toFixed(1)}%`,
          `学习置信度: ${(this.calculateLearningConfidence() * 100).toFixed(1)}%`
        ]
      };
      
      return result;
      
    } catch (error) {
      console.error('❌ 自适应学习失败:', error);
      return null;
    }
  }

  /**
   * 找出最佳参数
   */
  private findBestParameters(): {
    strategy: SeedGenerationStrategy;
    parameters: Record<string, any>;
    quality: number;
    performance: number;
  } | null {
    if (this.optimizationHistory.length === 0) {
      return null;
    }
    
    // 按质量排序，找出最佳参数组合
    const sortedHistory = [...this.optimizationHistory].sort((a, b) => 
      b.newMetrics.quality - a.newMetrics.quality
    );
    
    const bestResult = sortedHistory[0];
    
    return {
      strategy: bestResult.strategy,
      parameters: bestResult.parameters,
      quality: bestResult.newMetrics.quality,
      performance: bestResult.newMetrics.performance
    };
  }

  /**
   * 分析策略性能
   */
  private analyzeStrategyPerformance(): {
    bestStrategy: SeedGenerationStrategy;
    quality: number;
    performance: number;
  } | null {
    if (this.optimizationHistory.length === 0) {
      return null;
    }
    
    // 按策略分组，计算平均性能
    const strategyStats = new Map<SeedGenerationStrategy, {
      totalQuality: number;
      totalPerformance: number;
      count: number;
    }>();
    
    this.optimizationHistory.forEach(result => {
      const stats = strategyStats.get(result.strategy) || {
        totalQuality: 0,
        totalPerformance: 0,
        count: 0
      };
      
      stats.totalQuality += result.newMetrics.quality;
      stats.totalPerformance += result.newMetrics.performance;
      stats.count++;
      
      strategyStats.set(result.strategy, stats);
    });
    
    // 找出最佳策略
    let bestStrategy: SeedGenerationStrategy = 'linear_congruential';
    let bestScore = 0;
    
    strategyStats.forEach((stats, strategy) => {
      const avgQuality = stats.totalQuality / stats.count;
      const avgPerformance = stats.totalPerformance / stats.count;
      const score = avgQuality * 0.6 + avgPerformance * 0.4;
      
      if (score > bestScore) {
        bestScore = score;
        bestStrategy = strategy;
      }
    });
    
    const bestStats = strategyStats.get(bestStrategy)!;
    
    return {
      bestStrategy,
      quality: bestStats.totalQuality / bestStats.count,
      performance: bestStats.totalPerformance / bestStats.count
    };
  }

  /**
   * 优化混合配置
   */
  private optimizeHybridConfiguration(): {
    primaryStrategy: SeedGenerationStrategy;
    secondaryStrategy: SeedGenerationStrategy;
    blendRatio: number;
    quality: number;
    performance: number;
  } | null {
    if (this.optimizationHistory.length === 0) {
      return null;
    }
    
    // 分析混合策略的最佳配置
    const hybridResults = this.optimizationHistory.filter(
      result => result.optimizationType === 'hybrid_optimization'
    );
    
    if (hybridResults.length === 0) {
      return null;
    }
    
    // 找出最佳混合配置
    const bestHybrid = hybridResults.reduce((best, current) => {
      const currentScore = current.newMetrics.quality * 0.6 + current.newMetrics.performance * 0.4;
      const bestScore = best.newMetrics.quality * 0.6 + best.newMetrics.performance * 0.4;
      
      return currentScore > bestScore ? current : best;
    });
    
    return {
      primaryStrategy: bestHybrid.parameters.primaryStrategy || 'pcg',
      secondaryStrategy: bestHybrid.parameters.secondaryStrategy || 'xorsift',
      blendRatio: bestHybrid.parameters.blendRatio || 0.7,
      quality: bestHybrid.newMetrics.quality,
      performance: bestHybrid.newMetrics.performance
    };
  }

  /**
   * 学习最优配置
   */
  private learnOptimalConfiguration(): {
    strategy: SeedGenerationStrategy;
    parameters: Record<string, any>;
    quality: number;
    performance: number;
  } | null {
    if (this.optimizationHistory.length === 0) {
      return null;
    }
    
    // 使用简单的机器学习算法学习最优配置
    const recentHistory = this.optimizationHistory.slice(-50); // 最近50次优化
    
    // 计算加权平均
    let totalWeightedQuality = 0;
    let totalWeightedPerformance = 0;
    let totalWeight = 0;
    
    recentHistory.forEach((result, index) => {
      const weight = Math.exp(-index * this.config.learningRate);
      totalWeightedQuality += result.newMetrics.quality * weight;
      totalWeightedPerformance += result.newMetrics.performance * weight;
      totalWeight += weight;
    });
    
    if (totalWeight === 0) {
      return null;
    }
    
    const learnedQuality = totalWeightedQuality / totalWeight;
    const learnedPerformance = totalWeightedPerformance / totalWeight;
    
    // 选择最佳策略
    const bestStrategy = this.selectBestStrategyForLearning();
    
    return {
      strategy: bestStrategy,
      parameters: this.generateLearnedParameters(bestStrategy),
      quality: learnedQuality,
      performance: learnedPerformance
    };
  }

  /**
   * 选择学习的最佳策略
   */
  private selectBestStrategyForLearning(): SeedGenerationStrategy {
    const strategies = ['pcg', 'xorsift', 'chacha20', 'hybrid'] as SeedGenerationStrategy[];
    
    // 基于探索与利用平衡选择策略
    if (Math.random() < this.config.explorationRate) {
      // 探索：随机选择策略
      return strategies[Math.floor(Math.random() * strategies.length)];
    } else {
      // 利用：选择历史最佳策略
      const bestStrategy = this.analyzeStrategyPerformance();
      return bestStrategy ? bestStrategy.bestStrategy : 'pcg';
    }
  }

  /**
   * 生成学习参数
   */
  private generateLearnedParameters(strategy: SeedGenerationStrategy): Record<string, any> {
    const baseParams = {
      seedLength: 32,
      maxAttempts: 100,
      enableOptimization: true,
      optimizationLevel: 3
    };
    
    switch (strategy) {
      case 'hybrid':
        return {
          ...baseParams,
          primaryStrategy: 'pcg',
          secondaryStrategy: 'xorsift',
          blendRatio: 0.7
        };
      default:
        return baseParams;
    }
  }

  /**
   * 计算改进程度
   */
  private calculateImprovement(
    oldQuality: number,
    oldPerformance: number,
    newQuality: number,
    newPerformance: number
  ): number {
    const qualityImprovement = (newQuality - oldQuality) / Math.max(oldQuality, 0.1);
    const performanceImprovement = (newPerformance - oldPerformance) / Math.max(oldPerformance, 0.1);
    
    return Math.max(0, (qualityImprovement + performanceImprovement) / 2);
  }

  /**
   * 计算学习置信度
   */
  private calculateLearningConfidence(): number {
    if (this.optimizationHistory.length < 10) {
      return 0.1;
    }
    
    // 基于历史数据的一致性计算置信度
    const recentResults = this.optimizationHistory.slice(-10);
    const qualityVariance = this.calculateVariance(
      recentResults.map(r => r.newMetrics.quality)
    );
    
    // 方差越小，置信度越高
    return Math.max(0.1, Math.min(1, 1 - qualityVariance));
  }

  /**
   * 计算方差
   */
  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  }

  /**
   * 获取平均质量
   */
  private getAverageQuality(): number {
    if (this.optimizationHistory.length === 0) return 0;
    
    const totalQuality = this.optimizationHistory.reduce(
      (sum, result) => sum + result.newMetrics.quality, 0
    );
    
    return totalQuality / this.optimizationHistory.length;
  }

  /**
   * 获取平均性能
   */
  private getAveragePerformance(): number {
    if (this.optimizationHistory.length === 0) return 0;
    
    const totalPerformance = this.optimizationHistory.reduce(
      (sum, result) => sum + result.newMetrics.performance, 0
    );
    
    return totalPerformance / this.optimizationHistory.length;
  }

  /**
   * 记录优化结果
   */
  private recordOptimizationResult(result: OptimizationResult): void {
    this.optimizationHistory.push(result);
    
    if (this.optimizationHistory.length > this.maxHistoryLength) {
      this.optimizationHistory.shift();
    }
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
    averageImprovement: number;
    bestOptimization: OptimizationResult | null;
    recentOptimizations: OptimizationResult[];
  } {
    if (this.optimizationHistory.length === 0) {
      return {
        totalOptimizations: 0,
        averageImprovement: 0,
        bestOptimization: null,
        recentOptimizations: []
      };
    }
    
    const totalImprovement = this.optimizationHistory.reduce(
      (sum, result) => sum + result.improvement, 0
    );
    
    const bestOptimization = this.optimizationHistory.reduce((best, current) => 
      current.improvement > best.improvement ? current : best
    );
    
    return {
      totalOptimizations: this.optimizationHistory.length,
      averageImprovement: totalImprovement / this.optimizationHistory.length,
      bestOptimization,
      recentOptimizations: this.optimizationHistory.slice(-10)
    };
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 根据新配置调整自动优化
    if (this.config.enableAutoOptimization && !this.optimizationTimer) {
      this.startAutoOptimization();
    } else if (!this.config.enableAutoOptimization && this.optimizationTimer) {
      this.stopAutoOptimization();
    }
    
    console.log('🔄 优化配置已更新');
  }

  /**
   * 获取配置
   */
  public getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  /**
   * 销毁策略优化器
   */
  public destroy(): void {
    this.stopAutoOptimization();
    this.optimizationHistory = [];
    this.isInitialized = false;
    
    console.log('�� 策略优化器已销毁');
  }
}
