/**
 * 协调引擎
 * 负责协调不同层级的随机性，实现智能的随机性控制
 * 从MultiLevelRandomSystem中提取的模块
 */

import { UnifiedEventBus } from '../../events/UnifiedEventBus';
import { RandomLevel, LevelConfig, LevelState, CoordinationStrategy } from '../multiLevelRandomSystem';
import { RandomLevelManager } from './RandomLevelManager';

// 协调结果接口
export interface CoordinationResult {
  coordinated: Record<RandomLevel, number>;
  strategy: string;
  coordinationTime: number;
  performance: {
    totalUpdates: number;
    averageCoordinationTime: number;
    lastOptimization: number;
  };
  metadata: {
    timestamp: number;
    version: string;
  };
}

// 协调策略接口
export interface CoordinationStrategyInterface {
  name: string;
  execute(
    levelStates: Record<RandomLevel, LevelState>,
    configs: Record<RandomLevel, LevelConfig>
  ): Record<RandomLevel, number>;
  getDescription(): string;
}

/**
 * 分层协调策略
 */
export class HierarchicalCoordinationStrategy implements CoordinationStrategyInterface {
  name = 'hierarchical';
  
  execute(
    levelStates: Record<RandomLevel, LevelState>,
    configs: Record<RandomLevel, LevelConfig>
  ): Record<RandomLevel, number> {
    const coordinated: Record<RandomLevel, number> = {} as any;
    
    // 从系统级开始，逐层向下协调
    Object.values(RandomLevel).forEach(level => {
      if (level === RandomLevel.SYSTEM) {
        coordinated[level] = levelStates[level].currentRandomness;
      } else {
        const config = configs[level];
        const state = levelStates[level];
        const dependencyInfluence = this.calculateDependencyInfluence(level, levelStates, configs);
        
        coordinated[level] = state.currentRandomness * (1 - config.weight) + 
                           dependencyInfluence * config.weight;
      }
    });
    
    return coordinated;
  }
  
  getDescription(): string {
    return '分层协调策略：从系统级开始，逐层向下协调，每层受上层影响';
  }
  
  private calculateDependencyInfluence(
    level: RandomLevel,
    levelStates: Record<RandomLevel, LevelState>,
    configs: Record<RandomLevel, LevelConfig>
  ): number {
    const config = configs[level];
    let influence = 0;
    let totalWeight = 0;
    
    config.dependencies.forEach(depLevel => {
      const depState = levelStates[depLevel];
      if (depState && depState.isActive) {
        const depWeight = configs[depLevel].weight;
        influence += depState.currentRandomness * depWeight;
        totalWeight += depWeight;
      }
    });
    
    return totalWeight > 0 ? influence / totalWeight : 0;
  }
}

/**
 * 权重协调策略
 */
export class WeightedCoordinationStrategy implements CoordinationStrategyInterface {
  name = 'weighted';
  
  execute(
    levelStates: Record<RandomLevel, LevelState>,
    configs: Record<RandomLevel, LevelConfig>
  ): Record<RandomLevel, number> {
    const coordinated: Record<RandomLevel, number> = {} as any;
    
    Object.values(RandomLevel).forEach(level => {
      const config = configs[level];
      const state = levelStates[level];
      
      if (config.enabled && state.isActive) {
        coordinated[level] = state.currentRandomness * config.weight;
      } else {
        coordinated[level] = 0;
      }
    });
    
    return coordinated;
  }
  
  getDescription(): string {
    return '权重协调策略：根据每个层级的权重进行线性组合';
  }
}

/**
 * 自适应协调策略
 */
export class AdaptiveCoordinationStrategy implements CoordinationStrategyInterface {
  name = 'adaptive';
  
  execute(
    levelStates: Record<RandomLevel, LevelState>,
    configs: Record<RandomLevel, LevelConfig>
  ): Record<RandomLevel, number> {
    const coordinated: Record<RandomLevel, number> = {} as any;
    const performanceFactor = this.calculatePerformanceFactor();
    
    Object.values(RandomLevel).forEach(level => {
      const config = configs[level];
      const state = levelStates[level];
      
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
  
  getDescription(): string {
    return '自适应协调策略：根据系统性能动态调整层级权重';
  }
  
  private calculatePerformanceFactor(): number {
    // 简化的性能因子计算
    const memoryUsage = performance.memory?.usedJSHeapSize / performance.memory?.jsHeapSizeLimit || 0.5;
    const fps = 60; // 假设60FPS
    
    let factor = 1.0;
    
    if (fps < 30) factor *= 0.5;
    else if (fps < 45) factor *= 0.7;
    else if (fps < 60) factor *= 0.9;
    
    if (memoryUsage > 0.8) factor *= 0.6;
    else if (memoryUsage > 0.6) factor *= 0.8;
    
    return Math.max(0.3, Math.min(1.0, factor));
  }
}

/**
 * 级联协调策略
 */
export class CascadeCoordinationStrategy implements CoordinationStrategyInterface {
  name = 'cascade';
  
  execute(
    levelStates: Record<RandomLevel, LevelState>,
    configs: Record<RandomLevel, LevelConfig>
  ): Record<RandomLevel, number> {
    const coordinated: Record<RandomLevel, number> = {} as any;
    
    // 按依赖顺序协调
    const sortedLevels = this.getSortedLevelsByDependency(configs);
    
    sortedLevels.forEach(level => {
      const config = configs[level];
      const state = levelStates[level];
      
      if (config.enabled && state.isActive) {
        const cascadeInfluence = this.calculateCascadeInfluence(level, levelStates, configs);
        coordinated[level] = state.currentRandomness * (1 - cascadeInfluence) + 
                           cascadeInfluence * 0.5;
      } else {
        coordinated[level] = 0;
      }
    });
    
    return coordinated;
  }
  
  getDescription(): string {
    return '级联协调策略：按依赖顺序逐级协调，每级受上级影响';
  }
  
  private getSortedLevelsByDependency(configs: Record<RandomLevel, LevelConfig>): RandomLevel[] {
    const sorted: RandomLevel[] = [];
    const visited = new Set<RandomLevel>();
    
    const visit = (level: RandomLevel) => {
      if (visited.has(level)) return;
      
      const config = configs[level];
      config.dependencies.forEach(dep => visit(dep));
      
      visited.add(level);
      sorted.push(level);
    };
    
    Object.values(RandomLevel).forEach(level => visit(level));
    return sorted;
  }
  
  private calculateCascadeInfluence(
    level: RandomLevel,
    levelStates: Record<RandomLevel, LevelState>,
    configs: Record<RandomLevel, LevelConfig>
  ): number {
    const config = configs[level];
    let cascadeEffect = 0;
    
    config.dependencies.forEach(depLevel => {
      const depState = levelStates[depLevel];
      if (depState && depState.isActive) {
        cascadeEffect += depState.currentRandomness * 0.3;
      }
    });
    
    return Math.min(1, cascadeEffect);
  }
}

/**
 * 协调引擎
 * 负责执行不同的协调策略并管理性能指标
 */
export class CoordinationEngine {
  private strategies: Map<string, CoordinationStrategyInterface>;
  private currentStrategy: CoordinationStrategyInterface;
  private performanceMetrics: {
    totalUpdates: number;
    averageCoordinationTime: number;
    lastOptimization: number;
  } = {
    totalUpdates: 0,
    averageCoordinationTime: 0,
    lastOptimization: 0
  };
  private levelManager: RandomLevelManager;

  constructor(levelManager: RandomLevelManager, defaultStrategy: string = 'adaptive') {
    this.levelManager = levelManager;
    this.strategies = this.initializeStrategies();
    this.currentStrategy = this.strategies.get(defaultStrategy) || this.strategies.get('adaptive')!;
    
    this.setupEventListeners();
  }

  /**
   * 初始化协调策略
   */
  private initializeStrategies(): Map<string, CoordinationStrategyInterface> {
    const strategies = new Map<string, CoordinationStrategyInterface>();
    
    strategies.set('hierarchical', new HierarchicalCoordinationStrategy());
    strategies.set('weighted', new WeightedCoordinationStrategy());
    strategies.set('adaptive', new AdaptiveCoordinationStrategy());
    strategies.set('cascade', new CascadeCoordinationStrategy());
    
    return strategies;
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听策略切换事件
    UnifiedEventBus.on('random', 'strategy_change', this.handleStrategyChange.bind(this));
    
    // 监听性能优化事件
    UnifiedEventBus.on('global', 'performance', this.handlePerformanceEvent.bind(this));
  }

  /**
   * 执行协调
   */
  public coordinate(): Record<RandomLevel, number> {
    const startTime = performance.now();
    
    try {
      const levelStates = this.levelManager.getAllLevelStates();
      const configs = this.getLevelConfigs();
      
      // 执行当前策略
      const coordinated = this.currentStrategy.execute(levelStates, configs);
      
      // 更新性能指标
      const coordinationTime = performance.now() - startTime;
      this.updatePerformanceMetrics(coordinationTime);
      
      // 发射协调完成事件
      this.emitCoordinationComplete(coordinated, coordinationTime);
      
      return coordinated;
      
    } catch (error) {
      console.error('❌ 协调执行失败:', error);
      
      // 返回默认值
      return this.getDefaultRandomness();
    }
  }

  /**
   * 获取层级配置
   */
  private getLevelConfigs(): Record<RandomLevel, LevelConfig> {
    const configs: Record<RandomLevel, LevelConfig> = {} as any;
    
    Object.values(RandomLevel).forEach(level => {
      const config = this.levelManager.getLevelConfig(level);
      if (config) {
        configs[level] = config;
      }
    });
    
    return configs;
  }

  /**
   * 获取默认随机性值
   */
  private getDefaultRandomness(): Record<RandomLevel, number> {
    const result: Record<RandomLevel, number> = {} as any;
    
    Object.values(RandomLevel).forEach(level => {
      const state = this.levelManager.getLevelState(level);
      result[level] = state ? state.currentRandomness : 0.5;
    });
    
    return result;
  }

  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(coordinationTime: number): void {
    this.performanceMetrics.totalUpdates++;
    this.performanceMetrics.averageCoordinationTime = 
      (this.performanceMetrics.averageCoordinationTime * (this.performanceMetrics.totalUpdates - 1) + coordinationTime) / 
      this.performanceMetrics.totalUpdates;
  }

  /**
   * 发射协调完成事件
   */
  private emitCoordinationComplete(coordinated: Record<RandomLevel, number>, coordinationTime: number): void {
    UnifiedEventBus.emit({
      namespace: 'random',
      type: 'coordination_complete',
      timestamp: Date.now(),
      data: {
        coordinated,
        performance: this.performanceMetrics,
        strategy: this.currentStrategy.name,
        coordinationTime
      }
    });
  }

  /**
   * 切换协调策略
   */
  public setStrategy(strategyName: string): boolean {
    const strategy = this.strategies.get(strategyName);
    if (strategy) {
      this.currentStrategy = strategy;
      
      console.log(`🔄 协调策略已切换到: ${strategy.name}`);
      
      // 发射策略切换事件
      UnifiedEventBus.emit({
        namespace: 'random',
        type: 'strategy_changed',
        timestamp: Date.now(),
        data: {
          strategy: strategy.name,
          description: strategy.getDescription()
        }
      });
      
      return true;
    }
    
    console.warn(`⚠️ 未知的协调策略: ${strategyName}`);
    return false;
  }

  /**
   * 获取当前策略
   */
  public getCurrentStrategy(): CoordinationStrategyInterface {
    return this.currentStrategy;
  }

  /**
   * 获取可用策略列表
   */
  public getAvailableStrategies(): Array<{ name: string; description: string }> {
    return Array.from(this.strategies.values()).map(strategy => ({
      name: strategy.name,
      description: strategy.getDescription()
    }));
  }

  /**
   * 获取性能指标
   */
  public getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * 优化协调策略
   */
  public optimizeStrategy(): void {
    const avgTime = this.performanceMetrics.averageCoordinationTime;
    
    // 如果协调时间过长，切换到更简单的策略
    if (avgTime > 5) { // 5ms阈值
      if (this.currentStrategy.name !== 'weighted') {
        this.setStrategy('weighted');
        console.log('⚡ 性能优化：切换到权重协调策略');
      }
    } else if (avgTime > 2) { // 2ms阈值
      if (this.currentStrategy.name !== 'adaptive') {
        this.setStrategy('adaptive');
        console.log('⚡ 性能优化：切换到自适应协调策略');
      }
    }
    
    this.performanceMetrics.lastOptimization = Date.now();
  }

  /**
   * 事件处理器
   */
  private handleStrategyChange(event: any): void {
    const { strategy } = event.data;
    if (strategy) {
      this.setStrategy(strategy);
    }
  }

  private handlePerformanceEvent(event: any): void {
    // 性能事件触发策略优化
    this.optimizeStrategy();
  }

  /**
   * 创建协调结果
   */
  public createCoordinationResult(
    coordinated: Record<RandomLevel, number>,
    coordinationTime: number
  ): CoordinationResult {
    return {
      coordinated,
      strategy: this.currentStrategy.name,
      coordinationTime,
      performance: { ...this.performanceMetrics },
      metadata: {
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
  }

  /**
   * 导出协调配置
   */
  public exportConfiguration(): string {
    return JSON.stringify({
      currentStrategy: this.currentStrategy.name,
      availableStrategies: this.getAvailableStrategies(),
      performanceMetrics: this.performanceMetrics,
      timestamp: Date.now(),
      version: '1.0.0'
    }, null, 2);
  }

  /**
   * 导入协调配置
   */
  public importConfiguration(configString: string): void {
    try {
      const config = JSON.parse(configString);
      
      if (config.currentStrategy && config.version) {
        this.setStrategy(config.currentStrategy);
        console.log('✅ 协调配置导入成功');
      } else {
        throw new Error('无效的配置格式');
      }
      
    } catch (error) {
      console.error('❌ 协调配置导入失败:', error);
      throw error;
    }
  }

  /**
   * 销毁协调引擎
   */
  public destroy(): void {
    // 清理事件监听器
    UnifiedEventBus.off('random', 'strategy_change', this.handleStrategyChange.bind(this));
    UnifiedEventBus.off('global', 'performance', this.handlePerformanceEvent.bind(this));
    
    console.log('🛑 协调引擎已销毁');
  }
}
