/**
 * 随机层级管理器
 * 负责管理各个随机层级的状态和配置
 * 从MultiLevelRandomSystem中提取的模块
 */

import { UnifiedEventBus } from '../../events/UnifiedEventBus';
import { RandomLevel, LevelConfig, LevelState } from '../multiLevelRandomSystem';

// 层级事件类型
export interface LevelEvent {
  level: RandomLevel;
  type: 'created' | 'updated' | 'enabled' | 'disabled' | 'error';
  data: any;
  timestamp: number;
}

// 层级性能统计
export interface LevelPerformanceStats {
  totalUpdates: number;
  averageUpdateTime: number;
  errorCount: number;
  lastUpdateTime: number;
  uptime: number;
}

/**
 * 随机层级管理器
 * 负责管理各个随机层级的状态、配置和性能
 */
export class RandomLevelManager {
  private configs: Record<RandomLevel, LevelConfig>;
  private states: Record<RandomLevel, LevelState>;
  private updateTimers: Map<RandomLevel, NodeJS.Timeout> = new Map();
  private isInitialized: boolean = false;
  private performanceStats: Record<RandomLevel, LevelPerformanceStats> = {} as any;

  constructor(configs: Record<RandomLevel, LevelConfig>) {
    this.configs = { ...configs };
    this.states = this.initializeLevelStates();
    this.initializePerformanceStats();
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
   * 初始化性能统计
   */
  private initializePerformanceStats(): void {
    Object.values(RandomLevel).forEach(level => {
      this.performanceStats[level] = {
        totalUpdates: 0,
        averageUpdateTime: 0,
        errorCount: 0,
        lastUpdateTime: Date.now(),
        uptime: 0
      };
    });
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听层级相关事件
    UnifiedEventBus.on('random', 'level_created', this.handleLevelCreated.bind(this));
    UnifiedEventBus.on('random', 'level_error', this.handleLevelError.bind(this));
  }

  /**
   * 启动层级定时器
   */
  public startLevelTimer(level: RandomLevel): void {
    const config = this.configs[level];
    if (!config.enabled) return;

    const timer = setInterval(() => {
      this.updateLevel(level);
    }, config.updateInterval);

    this.updateTimers.set(level, timer);
    
    // 发射层级启动事件
    this.emitLevelEvent(level, 'enabled', { updateInterval: config.updateInterval });
  }

  /**
   * 停止层级定时器
   */
  public stopLevelTimer(level: RandomLevel): void {
    const timer = this.updateTimers.get(level);
    if (timer) {
      clearInterval(timer);
      this.updateTimers.delete(level);
      
      // 发射层级停止事件
      this.emitLevelEvent(level, 'disabled', { reason: 'timer_stopped' });
    }
  }

  /**
   * 更新指定层级
   */
  public updateLevel(level: RandomLevel): void {
    const startTime = performance.now();
    
    try {
      const config = this.configs[level];
      const state = this.states[level];
      
      if (!config.enabled || !state.isActive) return;

      // 更新状态
      state.lastUpdate = Date.now();
      state.performance.updateCount++;
      
      // 计算性能指标
      const updateTime = performance.now() - startTime;
      state.performance.averageUpdateTime = 
        (state.performance.averageUpdateTime * (state.performance.updateCount - 1) + updateTime) / 
        state.performance.updateCount;

      // 更新性能统计
      this.updatePerformanceStats(level, updateTime);

      // 发射层级更新事件
      this.emitLevelEvent(level, 'updated', {
        randomness: state.currentRandomness,
        performance: state.performance
      });

    } catch (error) {
      const state = this.states[level];
      if (state) {
        state.performance.errorCount++;
      }
      
      this.updatePerformanceStats(level, 0, true);
      console.error(`❌ 更新层级 ${level} 失败:`, error);
      
      // 发射错误事件
      this.emitLevelEvent(level, 'error', { error: error.message });
    }
  }

  /**
   * 更新性能统计
   */
  private updatePerformanceStats(level: RandomLevel, updateTime: number, isError: boolean = false): void {
    const stats = this.performanceStats[level];
    
    if (isError) {
      stats.errorCount++;
    } else {
      stats.totalUpdates++;
      stats.averageUpdateTime = 
        (stats.averageUpdateTime * (stats.totalUpdates - 1) + updateTime) / stats.totalUpdates;
    }
    
    stats.lastUpdateTime = Date.now();
    stats.uptime = Date.now() - this.states[level].lastUpdate;
  }

  /**
   * 设置层级随机性值
   */
  public setLevelRandomness(level: RandomLevel, randomness: number): void {
    const state = this.states[level];
    if (state) {
      const config = this.configs[level];
      
      // 确保在配置范围内
      const clampedRandomness = Math.max(
        config.randomnessRange[0],
        Math.min(config.randomnessRange[1], randomness)
      );
      
      state.currentRandomness = clampedRandomness;
      state.lastUpdate = Date.now();
      
      // 发射层级更新事件
      this.emitLevelEvent(level, 'updated', {
        randomness: clampedRandomness,
        reason: 'manual_set'
      });
    }
  }

  /**
   * 获取层级状态
   */
  public getLevelState(level: RandomLevel): LevelState | null {
    return this.states[level] || null;
  }

  /**
   * 获取所有层级状态
   */
  public getAllLevelStates(): Record<RandomLevel, LevelState> {
    return { ...this.states };
  }

  /**
   * 获取层级配置
   */
  public getLevelConfig(level: RandomLevel): LevelConfig | null {
    return this.configs[level] || null;
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
      
      // 如果启用状态改变，启动或停止定时器
      if (config.enabled !== undefined) {
        if (config.enabled) {
          this.startLevelTimer(level);
        } else {
          this.stopLevelTimer(level);
        }
      }
      
      console.log(`🔄 层级 ${level} 配置已更新`);
      
      // 发射配置更新事件
      this.emitLevelEvent(level, 'updated', {
        config: this.configs[level],
        reason: 'config_updated'
      });
    }
  }

  /**
   * 重启层级定时器
   */
  private restartLevelTimer(level: RandomLevel): void {
    this.stopLevelTimer(level);
    this.startLevelTimer(level);
  }

  /**
   * 启用层级
   */
  public enableLevel(level: RandomLevel): void {
    this.updateLevelConfig(level, { enabled: true });
  }

  /**
   * 禁用层级
   */
  public disableLevel(level: RandomLevel): void {
    this.updateLevelConfig(level, { enabled: false });
  }

  /**
   * 获取层级性能统计
   */
  public getLevelPerformanceStats(level: RandomLevel): LevelPerformanceStats | null {
    return this.performanceStats[level] || null;
  }

  /**
   * 获取所有层级性能统计
   */
  public getAllPerformanceStats(): Record<RandomLevel, LevelPerformanceStats> {
    return { ...this.performanceStats };
  }

  /**
   * 重置层级性能统计
   */
  public resetLevelPerformanceStats(level: RandomLevel): void {
    if (this.performanceStats[level]) {
      this.performanceStats[level] = {
        totalUpdates: 0,
        averageUpdateTime: 0,
        errorCount: 0,
        lastUpdateTime: Date.now(),
        uptime: 0
      };
    }
  }

  /**
   * 获取活跃层级数量
   */
  public getActiveLevelCount(): number {
    return Object.values(this.states).filter(state => state.isActive).length;
  }

  /**
   * 获取层级依赖关系
   */
  public getLevelDependencies(level: RandomLevel): RandomLevel[] {
    const config = this.configs[level];
    return config ? config.dependencies : [];
  }

  /**
   * 检查层级是否依赖其他层级
   */
  public hasDependencies(level: RandomLevel): boolean {
    const dependencies = this.getLevelDependencies(level);
    return dependencies.length > 0;
  }

  /**
   * 获取依赖此层级的其他层级
   */
  public getDependentLevels(level: RandomLevel): RandomLevel[] {
    const dependents: RandomLevel[] = [];
    
    Object.values(RandomLevel).forEach(otherLevel => {
      const dependencies = this.getLevelDependencies(otherLevel);
      if (dependencies.includes(level)) {
        dependents.push(otherLevel);
      }
    });
    
    return dependents;
  }

  /**
   * 发射层级事件
   */
  private emitLevelEvent(level: RandomLevel, type: LevelEvent['type'], data: any): void {
    const event: LevelEvent = {
      level,
      type,
      data,
      timestamp: Date.now()
    };
    
    UnifiedEventBus.emit({
      namespace: 'random',
      type: 'level_event',
      timestamp: Date.now(),
      data: event
    });
  }

  /**
   * 事件处理器
   */
  private handleLevelCreated(event: any): void {
    const { level, config } = event.data;
    if (config && !this.configs[level]) {
      this.configs[level] = config;
      this.states[level] = this.createLevelState(level, config);
      this.performanceStats[level] = this.createPerformanceStats();
    }
  }

  private handleLevelError(event: any): void {
    const { level, error } = event.data;
    this.updatePerformanceStats(level, 0, true);
  }

  /**
   * 创建层级状态
   */
  private createLevelState(level: RandomLevel, config: LevelConfig): LevelState {
    return {
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
  }

  /**
   * 创建性能统计
   */
  private createPerformanceStats(): LevelPerformanceStats {
    return {
      totalUpdates: 0,
      averageUpdateTime: 0,
      errorCount: 0,
      lastUpdateTime: Date.now(),
      uptime: 0
    };
  }

  /**
   * 启动所有层级
   */
  public startAllLevels(): void {
    Object.values(RandomLevel).forEach(level => {
      if (this.configs[level].enabled) {
        this.startLevelTimer(level);
      }
    });
    
    this.isInitialized = true;
    console.log('🎲 所有随机层级已启动');
  }

  /**
   * 停止所有层级
   */
  public stopAllLevels(): void {
    Object.values(RandomLevel).forEach(level => {
      this.stopLevelTimer(level);
    });
    
    this.isInitialized = false;
    console.log('🛑 所有随机层级已停止');
  }

  /**
   * 获取初始化状态
   */
  public isInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 销毁层级管理器
   */
  public destroy(): void {
    this.stopAllLevels();
    
    // 清理事件监听器
    UnifiedEventBus.off('random', 'level_created', this.handleLevelCreated.bind(this));
    UnifiedEventBus.off('random', 'level_error', this.handleLevelError.bind(this));
    
    console.log('🛑 随机层级管理器已销毁');
  }
}
