/**
 * 性能优化器
 * 负责监控系统性能并自动优化随机算法
 * 从MultiLevelRandomSystem中提取的模块
 */

import { UnifiedEventBus } from '../../events/UnifiedEventBus';
import { RandomLevel, LevelConfig } from '../multiLevelRandomSystem';
import { RandomLevelManager } from './RandomLevelManager';

// 性能指标接口
export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
  frameTime: number;
  timestamp: number;
}

// 优化建议接口
export interface OptimizationSuggestion {
  type: 'performance' | 'memory' | 'cpu' | 'quality';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  action: string;
  impact: 'positive' | 'negative' | 'neutral';
}

// 优化配置接口
export interface OptimizationConfig {
  enableAutoOptimization: boolean;
  performanceThreshold: number;
  memoryThreshold: number;
  cpuThreshold: number;
  optimizationInterval: number;
  maxOptimizationLevel: number;
}

// 默认配置
export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  enableAutoOptimization: true,
  performanceThreshold: 0.8,
  memoryThreshold: 0.8,
  cpuThreshold: 0.8,
  optimizationInterval: 5000, // 5秒
  maxOptimizationLevel: 3
};

/**
 * 性能优化器
 * 监控系统性能并自动调整随机算法参数
 */
export class PerformanceOptimizer {
  private config: OptimizationConfig;
  private levelManager: RandomLevelManager;
  private isInitialized: boolean = false;
  private optimizationTimer: NodeJS.Timeout | null = null;
  private performanceHistory: PerformanceMetrics[] = [];
  private maxHistoryLength: number = 100;
  private currentOptimizationLevel: number = 1;
  private optimizationSuggestions: OptimizationSuggestion[] = [];

  constructor(levelManager: RandomLevelManager, config?: Partial<OptimizationConfig>) {
    this.config = { ...DEFAULT_OPTIMIZATION_CONFIG, ...config };
    this.levelManager = levelManager;
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听性能事件
    UnifiedEventBus.on('global', 'performance', this.handlePerformanceEvent.bind(this));
    
    // 监听层级事件
    UnifiedEventBus.on('random', 'level_event', this.handleLevelEvent.bind(this));
    
    // 监听优化事件
    UnifiedEventBus.on('random', 'optimization_request', this.handleOptimizationRequest.bind(this));
  }

  /**
   * 初始化性能优化器
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    try {
      // 启动性能监控
      this.startPerformanceMonitoring();
      
      this.isInitialized = true;
      console.log('⚡ 性能优化器初始化成功');
      
      // 发射初始化完成事件
      UnifiedEventBus.emit({
        namespace: 'random',
        type: 'performance_optimizer_ready',
        timestamp: Date.now(),
        data: {
          config: this.config,
          currentLevel: this.currentOptimizationLevel
        }
      });
      
    } catch (error) {
      console.error('❌ 性能优化器初始化失败:', error);
    }
  }

  /**
   * 启动性能监控
   */
  private startPerformanceMonitoring(): void {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
    }
    
    this.optimizationTimer = setInterval(() => {
      this.monitorPerformance();
    }, this.config.optimizationInterval);
  }

  /**
   * 监控性能
   */
  private monitorPerformance(): void {
    try {
      const metrics = this.collectPerformanceMetrics();
      this.performanceHistory.push(metrics);
      
      // 限制历史记录长度
      if (this.performanceHistory.length > this.maxHistoryLength) {
        this.performanceHistory.shift();
      }
      
      // 分析性能并生成优化建议
      this.analyzePerformance(metrics);
      
      // 如果启用自动优化，执行优化
      if (this.config.enableAutoOptimization) {
        this.autoOptimize(metrics);
      }
      
      // 发射性能监控事件
      UnifiedEventBus.emit({
        namespace: 'random',
        type: 'performance_monitored',
        timestamp: Date.now(),
        data: {
          metrics,
          suggestions: this.optimizationSuggestions,
          optimizationLevel: this.currentOptimizationLevel
        }
      });
      
    } catch (error) {
      console.error('❌ 性能监控失败:', error);
    }
  }

  /**
   * 收集性能指标
   */
  private collectPerformanceMetrics(): PerformanceMetrics {
    // 获取FPS（简化实现）
    const fps = this.estimateFPS();
    
    // 获取内存使用情况
    const memoryUsage = this.getMemoryUsage();
    
    // 获取CPU使用情况（简化实现）
    const cpuUsage = this.estimateCPUUsage();
    
    // 获取帧时间
    const frameTime = this.getFrameTime();
    
    return {
      fps,
      memoryUsage,
      cpuUsage,
      frameTime,
      timestamp: Date.now()
    };
  }

  /**
   * 估算FPS
   */
  private estimateFPS(): number {
    // 基于历史数据估算FPS
    if (this.performanceHistory.length < 2) return 60;
    
    const recentMetrics = this.performanceHistory.slice(-10);
    const avgFrameTime = recentMetrics.reduce((sum, m) => sum + m.frameTime, 0) / recentMetrics.length;
    
    return avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 60;
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): number {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
    }
    return 0.5; // 默认值
  }

  /**
   * 估算CPU使用情况
   */
  private estimateCPUUsage(): number {
    // 基于帧时间变化估算CPU使用
    if (this.performanceHistory.length < 2) return 0.5;
    
    const recentMetrics = this.performanceHistory.slice(-5);
    const frameTimeVariance = this.calculateVariance(recentMetrics.map(m => m.frameTime));
    
    // 帧时间变化越大，CPU使用越高
    return Math.min(1, frameTimeVariance / 100);
  }

  /**
   * 获取帧时间
   */
  private getFrameTime(): number {
    const now = performance.now();
    const frameTime = now - (this.lastFrameTime || now);
    this.lastFrameTime = now;
    
    return frameTime;
  }

  private lastFrameTime: number = 0;

  /**
   * 计算方差
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  /**
   * 分析性能
   */
  private analyzePerformance(metrics: PerformanceMetrics): void {
    this.optimizationSuggestions = [];
    
    // 检查FPS
    if (metrics.fps < 30) {
      this.optimizationSuggestions.push({
        type: 'performance',
        priority: 'critical',
        description: 'FPS过低，需要立即优化',
        action: '降低更新频率，简化计算',
        impact: 'positive'
      });
    } else if (metrics.fps < 45) {
      this.optimizationSuggestions.push({
        type: 'performance',
        priority: 'high',
        description: 'FPS偏低，建议优化',
        action: '调整层级权重，优化协调策略',
        impact: 'positive'
      });
    }
    
    // 检查内存使用
    if (metrics.memoryUsage > 0.9) {
      this.optimizationSuggestions.push({
        type: 'memory',
        priority: 'critical',
        description: '内存使用过高，可能导致崩溃',
        action: '清理缓存，减少数据存储',
        impact: 'positive'
      });
    } else if (metrics.memoryUsage > 0.8) {
      this.optimizationSuggestions.push({
        type: 'memory',
        priority: 'high',
        description: '内存使用较高，建议优化',
        action: '优化数据结构，减少内存占用',
        impact: 'positive'
      });
    }
    
    // 检查CPU使用
    if (metrics.cpuUsage > 0.9) {
      this.optimizationSuggestions.push({
        type: 'cpu',
        priority: 'critical',
        description: 'CPU使用过高，系统可能卡顿',
        action: '简化算法，减少计算复杂度',
        impact: 'positive'
      });
    } else if (metrics.cpuUsage > 0.8) {
      this.optimizationSuggestions.push({
        type: 'cpu',
        priority: 'high',
        description: 'CPU使用较高，建议优化',
        action: '优化算法，使用更高效的计算方法',
        impact: 'positive'
      });
    }
  }

  /**
   * 自动优化
   */
  private autoOptimize(metrics: PerformanceMetrics): void {
    const optimizationLevel = this.calculateOptimizationLevel(metrics);
    
    if (optimizationLevel !== this.currentOptimizationLevel) {
      this.currentOptimizationLevel = optimizationLevel;
      this.applyOptimization(optimizationLevel);
      
      console.log(`⚡ 自动优化已调整到级别 ${optimizationLevel}`);
    }
  }

  /**
   * 计算优化级别
   */
  private calculateOptimizationLevel(metrics: PerformanceMetrics): number {
    let level = 1;
    
    // FPS影响
    if (metrics.fps < 30) level = 3;
    else if (metrics.fps < 45) level = 2;
    
    // 内存影响
    if (metrics.memoryUsage > 0.9) level = Math.max(level, 3);
    else if (metrics.memoryUsage > 0.8) level = Math.max(level, 2);
    
    // CPU影响
    if (metrics.cpuUsage > 0.9) level = Math.max(level, 3);
    else if (metrics.cpuUsage > 0.8) level = Math.max(level, 2);
    
    return Math.min(level, this.config.maxOptimizationLevel);
  }

  /**
   * 应用优化
   */
  private applyOptimization(level: number): void {
    switch (level) {
      case 1:
        this.applyLevel1Optimization();
        break;
      case 2:
        this.applyLevel2Optimization();
        break;
      case 3:
        this.applyLevel3Optimization();
        break;
    }
    
    // 发射优化应用事件
    UnifiedEventBus.emit({
      namespace: 'random',
      type: 'optimization_applied',
      timestamp: Date.now(),
      data: {
        level,
        description: `已应用级别 ${level} 优化`
      }
    });
  }

  /**
   * 应用级别1优化（轻微优化）
   */
  private applyLevel1Optimization(): void {
    // 轻微调整更新间隔
    Object.values(RandomLevel).forEach(level => {
      const config = this.levelManager.getLevelConfig(level);
      if (config && config.updateInterval < 10000) {
        this.levelManager.updateLevelConfig(level, {
          updateInterval: Math.min(config.updateInterval * 1.2, 10000)
        });
      }
    });
  }

  /**
   * 应用级别2优化（中等优化）
   */
  private applyLevel2Optimization(): void {
    // 中等调整更新间隔和权重
    Object.values(RandomLevel).forEach(level => {
      const config = this.levelManager.getLevelConfig(level);
      if (config) {
        this.levelManager.updateLevelConfig(level, {
          updateInterval: Math.min(config.updateInterval * 1.5, 15000),
          weight: Math.max(config.weight * 0.8, 0.3)
        });
      }
    });
  }

  /**
   * 应用级别3优化（激进优化）
   */
  private applyLevel3Optimization(): void {
    // 激进调整，禁用部分层级
    Object.values(RandomLevel).forEach(level => {
      if (level !== RandomLevel.SYSTEM) {
        const config = this.levelManager.getLevelConfig(level);
        if (config) {
          this.levelManager.updateLevelConfig(level, {
            enabled: false,
            updateInterval: 30000
          });
        }
      }
    });
    
    // 只保留系统级和情绪级
    this.levelManager.enableLevel(RandomLevel.EMOTION);
  }

  /**
   * 手动优化
   */
  public manualOptimize(level: number): void {
    if (level < 1 || level > this.config.maxOptimizationLevel) {
      console.warn(`⚠️ 无效的优化级别: ${level}`);
      return;
    }
    
    this.currentOptimizationLevel = level;
    this.applyOptimization(level);
    
    console.log(`🔧 手动优化已调整到级别 ${level}`);
  }

  /**
   * 获取性能历史
   */
  public getPerformanceHistory(): PerformanceMetrics[] {
    return [...this.performanceHistory];
  }

  /**
   * 获取当前优化级别
   */
  public getCurrentOptimizationLevel(): number {
    return this.currentOptimizationLevel;
  }

  /**
   * 获取优化建议
   */
  public getOptimizationSuggestions(): OptimizationSuggestion[] {
    return [...this.optimizationSuggestions];
  }

  /**
   * 获取性能摘要
   */
  public getPerformanceSummary(): {
    currentFPS: number;
    averageFPS: number;
    memoryUsage: number;
    cpuUsage: number;
    optimizationLevel: number;
    suggestionsCount: number;
  } {
    const currentMetrics = this.performanceHistory[this.performanceHistory.length - 1];
    const avgFPS = this.performanceHistory.length > 0 
      ? this.performanceHistory.reduce((sum, m) => sum + m.fps, 0) / this.performanceHistory.length
      : 60;
    
    return {
      currentFPS: currentMetrics?.fps || 60,
      averageFPS: Math.round(avgFPS),
      memoryUsage: currentMetrics?.memoryUsage || 0.5,
      cpuUsage: currentMetrics?.cpuUsage || 0.5,
      optimizationLevel: this.currentOptimizationLevel,
      suggestionsCount: this.optimizationSuggestions.length
    };
  }

  /**
   * 事件处理器
   */
  private handlePerformanceEvent(event: any): void {
    const performanceData = event.data;
    if (performanceData) {
      // 外部性能事件触发优化检查
      this.analyzePerformance({
        fps: performanceData.fps || 60,
        memoryUsage: performanceData.memoryUsage || 0.5,
        cpuUsage: performanceData.cpuUsage || 0.5,
        frameTime: performanceData.frameTime || 16.67,
        timestamp: Date.now()
      });
    }
  }

  private handleLevelEvent(event: any): void {
    const { level, type } = event.data;
    
    if (type === 'error') {
      // 层级错误时考虑优化
      this.considerOptimizationForError(level);
    }
  }

  private handleOptimizationRequest(event: any): void {
    const { level, reason } = event.data;
    if (level && reason) {
      this.manualOptimize(level);
      console.log(`🔧 响应优化请求: 级别 ${level}, 原因: ${reason}`);
    }
  }

  /**
   * 为错误考虑优化
   */
  private considerOptimizationForError(level: RandomLevel): void {
    const errorCount = this.levelManager.getLevelPerformanceStats(level)?.errorCount || 0;
    
    if (errorCount > 5) {
      // 错误过多时提高优化级别
      const newLevel = Math.min(this.currentOptimizationLevel + 1, this.config.maxOptimizationLevel);
      if (newLevel !== this.currentOptimizationLevel) {
        this.manualOptimize(newLevel);
      }
    }
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 如果优化间隔改变，重启监控
    if (newConfig.optimizationInterval) {
      this.startPerformanceMonitoring();
    }
    
    console.log('🔄 性能优化配置已更新');
  }

  /**
   * 导出配置
   */
  public exportConfiguration(): string {
    return JSON.stringify({
      config: this.config,
      currentLevel: this.currentOptimizationLevel,
      performanceSummary: this.getPerformanceSummary(),
      timestamp: Date.now(),
      version: '1.0.0'
    }, null, 2);
  }

  /**
   * 停止性能监控
   */
  public stop(): void {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = null;
    }
    
    this.isInitialized = false;
    console.log('🛑 性能优化器已停止');
  }

  /**
   * 销毁性能优化器
   */
  public destroy(): void {
    this.stop();
    
    // 清理事件监听器
    UnifiedEventBus.off('global', 'performance', this.handlePerformanceEvent.bind(this));
    UnifiedEventBus.off('random', 'level_event', this.handleLevelEvent.bind(this));
    UnifiedEventBus.off('random', 'optimization_request', this.handleOptimizationRequest.bind(this));
    
    console.log('�� 性能优化器已销毁');
  }
}
