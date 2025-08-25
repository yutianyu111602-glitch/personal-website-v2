/**
 * 随机性可视化系统
 * 提供直观的随机性状态和变化可视化
 * TASK-123: 实现随机性可视化
 */

import { UnifiedEventBus } from '../events/UnifiedEventBus';
import { multiLevelRandomSystem, RandomLevel } from './multiLevelRandomSystem';
import { randomnessControlParameterManager } from './randomnessControlParameters';

// 可视化配置接口
export interface VisualizationConfig {
  // 显示配置
  showRealTimeGraphs: boolean;      // 是否显示实时图表
  showLevelBreakdown: boolean;      // 是否显示层级分解
  showParameterControls: boolean;   // 是否显示参数控制
  showPerformanceMetrics: boolean;  // 是否显示性能指标
  
  // 图表配置
  graphUpdateInterval: number;      // 图表更新间隔(ms)
  maxDataPoints: number;            // 最大数据点数量
  graphHeight: number;              // 图表高度
  graphWidth: number;               // 图表宽度
  
  // 颜色配置
  colorScheme: {
    system: string;                 // 系统级颜色
    emotion: string;                // 情绪级颜色
    preset: string;                 // 预设级颜色
    effect: string;                 // 效果级颜色
    audio: string;                  // 音频级颜色
    time: string;                   // 时间级颜色
    background: string;             // 背景颜色
    grid: string;                   // 网格颜色
    text: string;                   // 文字颜色
  };
  
  // 动画配置
  animationEnabled: boolean;        // 是否启用动画
  animationDuration: number;        // 动画持续时间(ms)
  easingFunction: string;          // 缓动函数
}

// 可视化数据接口
export interface VisualizationData {
  timestamp: number;
  levelData: Record<RandomLevel, {
    randomness: number;
    weight: number;
    isActive: boolean;
    performance: {
      updateCount: number;
      averageUpdateTime: number;
      errorCount: number;
    };
  }>;
  parameterSummary: {
    totalParameters: number;
    activeLevels: number;
    chaosFactor: number;
    performanceFactor: number;
  };
  coordinationData: {
    strategy: string;
    coordinationTime: number;
    totalUpdates: number;
  };
}

// 默认配置
export const DEFAULT_VISUALIZATION_CONFIG: VisualizationConfig = {
  showRealTimeGraphs: true,
  showLevelBreakdown: true,
  showParameterControls: true,
  showPerformanceMetrics: true,
  
  graphUpdateInterval: 100,
  maxDataPoints: 200,
  graphHeight: 300,
  graphWidth: 600,
  
  colorScheme: {
    system: '#FF6B6B',
    emotion: '#4ECDC4',
    preset: '#45B7D1',
    effect: '#96CEB4',
    audio: '#FFEAA7',
    time: '#DDA0DD',
    background: '#2C3E50',
    grid: '#34495E',
    text: '#ECF0F1'
  },
  
  animationEnabled: true,
  animationDuration: 300,
  easingFunction: 'ease-out'
};

/**
 * 随机性可视化管理器
 * 负责生成和管理随机性的可视化数据
 */
export class RandomnessVisualizationManager {
  private config: VisualizationConfig;
  private isInitialized: boolean = false;
  private visualizationData: VisualizationData[] = [];
  private updateTimer: NodeJS.Timeout | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(config?: Partial<VisualizationConfig>) {
    this.config = { ...DEFAULT_VISUALIZATION_CONFIG, ...config };
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听多层级随机系统事件
    UnifiedEventBus.on('random', 'multi_level_ready', this.handleMultiLevelReady.bind(this));
    UnifiedEventBus.on('random', 'level_updated', this.handleLevelUpdated.bind(this));
    UnifiedEventBus.on('random', 'coordination_complete', this.handleCoordinationComplete.bind(this));
    
    // 监听参数更新事件
    UnifiedEventBus.on('random', 'parameters_updated', this.handleParametersUpdated.bind(this));
    
    // 监听性能事件
    UnifiedEventBus.on('global', 'performance', this.handlePerformanceEvent.bind(this));
  }

  /**
   * 初始化可视化管理器
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    try {
      // 创建可视化数据
      this.createInitialVisualizationData();
      
      // 启动更新定时器
      this.startUpdateTimer();
      
      this.isInitialized = true;
      console.log('🎨 随机性可视化管理器初始化成功');
      
      // 发射初始化完成事件
      UnifiedEventBus.emit({
        namespace: 'random',
        type: 'visualization_ready',
        timestamp: Date.now(),
        data: {
          config: this.config,
          dataPoints: this.visualizationData.length
        }
      });
      
    } catch (error) {
      console.error('❌ 随机性可视化管理器初始化失败:', error);
    }
  }

  /**
   * 创建初始可视化数据
   */
  private createInitialVisualizationData(): void {
    const timestamp = Date.now();
    
    // 获取当前多层级随机系统状态
    const levelStates = multiLevelRandomSystem?.getLevelStates() || {};
    const parameterSummary = randomnessControlParameterManager?.getParameterSummary() || {
      totalParameters: 0,
      activeLevels: 0,
      chaosFactor: 0,
      performanceFactor: 1
    };
    
    const initialData: VisualizationData = {
      timestamp,
      levelData: Object.values(RandomLevel).reduce((acc, level) => {
        const state = levelStates[level];
        acc[level] = {
          randomness: state?.currentRandomness || 0.5,
          weight: 1.0,
          isActive: state?.isActive || false,
          performance: state?.performance || {
            updateCount: 0,
            averageUpdateTime: 0,
            errorCount: 0
          }
        };
        return acc;
      }, {} as Record<RandomLevel, any>),
      parameterSummary,
      coordinationData: {
        strategy: 'adaptive',
        coordinationTime: 0,
        totalUpdates: 0
      }
    };
    
    this.visualizationData.push(initialData);
  }

  /**
   * 启动更新定时器
   */
  private startUpdateTimer(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    
    this.updateTimer = setInterval(() => {
      this.updateVisualizationData();
    }, this.config.graphUpdateInterval);
  }

  /**
   * 更新可视化数据
   */
  private updateVisualizationData(): void {
    try {
      const timestamp = Date.now();
      
      // 获取当前状态
      const levelStates = multiLevelRandomSystem?.getLevelStates() || {};
      const parameterSummary = randomnessControlParameterManager?.getParameterSummary() || {
        totalParameters: 0,
        activeLevels: 0,
        chaosFactor: 0,
        performanceFactor: 1
      };
      const performanceMetrics = multiLevelRandomSystem?.getPerformanceMetrics() || {
        totalUpdates: 0,
        averageCoordinationTime: 0,
        lastOptimization: 0
      };
      
      // 创建新的可视化数据
      const newData: VisualizationData = {
        timestamp,
        levelData: Object.values(RandomLevel).reduce((acc, level) => {
          const state = levelStates[level];
          acc[level] = {
            randomness: state?.currentRandomness || 0.5,
            weight: 1.0,
            isActive: state?.isActive || false,
            performance: state?.performance || {
              updateCount: 0,
              averageUpdateTime: 0,
              errorCount: 0
            }
          };
          return acc;
        }, {} as Record<RandomLevel, any>),
        parameterSummary,
        coordinationData: {
          strategy: 'adaptive',
          coordinationTime: performanceMetrics.averageCoordinationTime,
          totalUpdates: performanceMetrics.totalUpdates
        }
      };
      
      // 添加到数据数组
      this.visualizationData.push(newData);
      
      // 限制数据点数量
      if (this.visualizationData.length > this.config.maxDataPoints) {
        this.visualizationData.shift();
      }
      
      // 发射数据更新事件
      UnifiedEventBus.emit({
        namespace: 'random',
        type: 'visualization_data_updated',
        timestamp,
        data: {
          newData,
          totalDataPoints: this.visualizationData.length
        }
      });
      
    } catch (error) {
      console.error('❌ 更新可视化数据失败:', error);
    }
  }

  /**
   * 事件处理器
   */
  private handleMultiLevelReady(event: any): void {
    console.log('🎲 多层级随机系统就绪，开始可视化');
    this.updateVisualizationData();
  }

  private handleLevelUpdated(event: any): void {
    const { level, randomness, performance } = event.data;
    
    // 更新对应层级的数据
    if (this.visualizationData.length > 0) {
      const latestData = this.visualizationData[this.visualizationData.length - 1];
      if (latestData.levelData[level]) {
        latestData.levelData[level].randomness = randomness;
        latestData.levelData[level].performance = performance;
      }
    }
  }

  private handleCoordinationComplete(event: any): void {
    const { coordinated, performance, strategy } = event.data;
    
    // 更新协调数据
    if (this.visualizationData.length > 0) {
      const latestData = this.visualizationData[this.visualizationData.length - 1];
      latestData.coordinationData = {
        strategy,
        coordinationTime: performance.averageCoordinationTime,
        totalUpdates: performance.totalUpdates
      };
    }
  }

  private handleParametersUpdated(event: any): void {
    const { updatedParameters, reason } = event.data;
    
    // 更新参数摘要
    this.updateVisualizationData();
    
    console.log(`🔄 参数更新已反映到可视化: ${reason}`);
  }

  private handlePerformanceEvent(event: any): void {
    // 性能事件触发可视化更新
    this.updateVisualizationData();
  }

  /**
   * 获取可视化数据
   */
  public getVisualizationData(): VisualizationData[] {
    return [...this.visualizationData];
  }

  /**
   * 获取最新的可视化数据
   */
  public getLatestVisualizationData(): VisualizationData | null {
    return this.visualizationData.length > 0 
      ? this.visualizationData[this.visualizationData.length - 1] 
      : null;
  }

  /**
   * 创建实时图表
   */
  public createRealTimeGraph(canvas: HTMLCanvasElement): void {
    this.canvasElement = canvas;
    this.ctx = canvas.getContext('2d');
    
    if (!this.ctx) {
      console.error('❌ 无法获取Canvas上下文');
      return;
    }
    
    // 设置Canvas尺寸
    canvas.width = this.config.graphWidth;
    canvas.height = this.config.graphHeight;
    
    // 绘制初始图表
    this.drawRealTimeGraph();
    
    // 启动图表更新
    this.startGraphUpdates();
  }

  /**
   * 绘制实时图表
   */
  private drawRealTimeGraph(): void {
    if (!this.ctx || !this.canvasElement) return;
    
    const ctx = this.ctx;
    const canvas = this.canvasElement;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制背景
    ctx.fillStyle = this.config.colorScheme.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格
    this.drawGrid(ctx, canvas);
    
    // 绘制数据线
    this.drawDataLines(ctx, canvas);
    
    // 绘制标签
    this.drawLabels(ctx, canvas);
  }

  /**
   * 绘制网格
   */
  private drawGrid(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    ctx.strokeStyle = this.config.colorScheme.grid;
    ctx.lineWidth = 1;
    
    // 垂直网格线
    for (let x = 0; x <= canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // 水平网格线
    for (let y = 0; y <= canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  /**
   * 绘制数据线
   */
  private drawDataLines(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    if (this.visualizationData.length < 2) return;
    
    const colors = [
      this.config.colorScheme.system,
      this.config.colorScheme.emotion,
      this.config.colorScheme.preset,
      this.config.colorScheme.effect,
      this.config.colorScheme.audio,
      this.config.colorScheme.time
    ];
    
    Object.values(RandomLevel).forEach((level, index) => {
      const color = colors[index % colors.length];
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      
      this.visualizationData.forEach((data, dataIndex) => {
        const x = (dataIndex / (this.visualizationData.length - 1)) * canvas.width;
        const y = (1 - data.levelData[level].randomness) * canvas.height;
        
        if (dataIndex === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    });
  }

  /**
   * 绘制标签
   */
  private drawLabels(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    ctx.fillStyle = this.config.colorScheme.text;
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    // 绘制层级标签
    const colors = [
      this.config.colorScheme.system,
      this.config.colorScheme.emotion,
      this.config.colorScheme.preset,
      this.config.colorScheme.effect,
      this.config.colorScheme.audio,
      this.config.colorScheme.time
    ];
    
    Object.values(RandomLevel).forEach((level, index) => {
      const color = colors[index % colors.length];
      const y = 20 + index * 20;
      
      // 绘制颜色指示器
      ctx.fillStyle = color;
      ctx.fillRect(10, y - 10, 10, 10);
      
      // 绘制文本
      ctx.fillStyle = this.config.colorScheme.text;
      ctx.fillText(level, 25, y);
    });
    
    // 绘制时间标签
    ctx.textAlign = 'right';
    ctx.fillText(`更新时间: ${new Date().toLocaleTimeString()}`, canvas.width - 10, canvas.height - 10);
  }

  /**
   * 启动图表更新
   */
  private startGraphUpdates(): void {
    if (!this.canvasElement) return;
    
    const updateGraph = () => {
      this.drawRealTimeGraph();
      requestAnimationFrame(updateGraph);
    };
    
    updateGraph();
  }

  /**
   * 生成层级分解图表
   */
  public generateLevelBreakdownChart(): {
    labels: string[];
    data: number[];
    colors: string[];
  } {
    const latestData = this.getLatestVisualizationData();
    if (!latestData) return { labels: [], data: [], colors: [] };
    
    const labels: string[] = [];
    const data: number[] = [];
    const colors: string[] = [];
    
    Object.values(RandomLevel).forEach(level => {
      const levelInfo = latestData.levelData[level];
      if (levelInfo && levelInfo.isActive) {
        labels.push(level);
        data.push(levelInfo.randomness);
        colors.push(this.config.colorScheme[level as keyof typeof this.config.colorScheme]);
      }
    });
    
    return { labels, data, colors };
  }

  /**
   * 生成性能指标图表
   */
  public generatePerformanceChart(): {
    labels: string[];
    data: number[];
    colors: string[];
  } {
    const latestData = this.getLatestVisualizationData();
    if (!latestData) return { labels: [], data: [], colors: [] };
    
    return {
      labels: ['更新次数', '平均时间', '错误次数', '协调时间'],
      data: [
        latestData.coordinationData.totalUpdates,
        latestData.coordinationData.coordinationTime,
        Object.values(latestData.levelData).reduce((sum, level) => sum + level.performance.errorCount, 0),
        latestData.coordinationData.coordinationTime
      ],
      colors: ['#4ECDC4', '#45B7D1', '#FF6B6B', '#96CEB4']
    };
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<VisualizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 如果更新间隔改变，重启定时器
    if (newConfig.graphUpdateInterval) {
      this.startUpdateTimer();
    }
    
    console.log('🔄 可视化配置已更新');
  }

  /**
   * 导出可视化数据
   */
  public exportVisualizationData(): string {
    return JSON.stringify({
      config: this.config,
      data: this.visualizationData,
      timestamp: Date.now(),
      version: '1.0.0'
    }, null, 2);
  }

  /**
   * 停止可视化
   */
  public stop(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    this.isInitialized = false;
    console.log('🛑 随机性可视化已停止');
  }

  /**
   * 销毁可视化管理器
   */
  public destroy(): void {
    this.stop();
    
    // 清理事件监听器
    UnifiedEventBus.off('random', 'multi_level_ready', this.handleMultiLevelReady.bind(this));
    UnifiedEventBus.off('random', 'level_updated', this.handleLevelUpdated.bind(this));
    UnifiedEventBus.off('random', 'coordination_complete', this.handleCoordinationComplete.bind(this));
    UnifiedEventBus.off('random', 'parameters_updated', this.handleParametersUpdated.bind(this));
    UnifiedEventBus.off('global', 'performance', this.handlePerformanceEvent.bind(this));
    
    console.log('🛑 随机性可视化管理器已销毁');
  }
}

// 创建默认实例
export const randomnessVisualizationManager = new RandomnessVisualizationManager();
