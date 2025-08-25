/**
 * 图表渲染器模块
 * 负责渲染随机性可视化的各种图表
 * TASK-127: 模块化RandomnessVisualizationManager
 */

import type { RandomLevel } from '../multiLevelRandomSystem';
import type { VisualizationConfig, VisualizationData } from '../randomnessVisualization';

// 图表类型
export type ChartType = 'line' | 'bar' | 'radar' | 'heatmap' | 'scatter';

// 图表配置接口
export interface ChartConfig {
  type: ChartType;
  width: number;
  height: number;
  backgroundColor: string;
  gridColor: string;
  textColor: string;
  showGrid: boolean;
  showLabels: boolean;
  showLegend: boolean;
  animationEnabled: boolean;
  animationDuration: number;
}

// 图表数据接口
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
    lineWidth?: number;
    fillColor?: string;
    opacity?: number;
  }[];
}

// 渲染选项接口
export interface RenderOptions {
  clearCanvas?: boolean;
  animate?: boolean;
  highlightLevel?: RandomLevel;
  showPerformance?: boolean;
  showTrends?: boolean;
}

/**
 * 图表渲染器类
 * 提供各种图表的渲染功能
 */
export class ChartRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private config: ChartConfig;
  private isInitialized: boolean = false;

  constructor(canvas: HTMLCanvasElement, config?: Partial<ChartConfig>) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.config = {
      type: 'line',
      width: 600,
      height: 300,
      backgroundColor: '#2C3E50',
      gridColor: '#34495E',
      textColor: '#ECF0F1',
      showGrid: true,
      showLabels: true,
      showLegend: true,
      animationEnabled: true,
      animationDuration: 300,
      ...config
    };
    
    this.initialize();
  }

  /**
   * 初始化渲染器
   */
  private initialize(): void {
    if (!this.ctx || !this.canvas) {
      throw new Error('无法获取Canvas上下文');
    }
    
    // 设置Canvas尺寸
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
    
    // 设置默认样式
    this.ctx.textBaseline = 'middle';
    this.ctx.textAlign = 'center';
    
    this.isInitialized = true;
    console.log('📊 图表渲染器初始化成功');
  }

  /**
   * 渲染实时图表
   */
  public renderRealTimeChart(
    data: VisualizationData[],
    options: RenderOptions = {}
  ): void {
    if (!this.ctx || !this.canvas) return;
    
    if (options.clearCanvas !== false) {
      this.clearCanvas();
    }
    
    // 绘制背景
    this.drawBackground();
    
    // 绘制网格
    if (this.config.showGrid) {
      this.drawGrid();
    }
    
    // 绘制图表
    switch (this.config.type) {
      case 'line':
        this.renderLineChart(data, options);
        break;
      case 'bar':
        this.renderBarChart(data, options);
        break;
      case 'radar':
        this.renderRadarChart(data, options);
        break;
      case 'heatmap':
        this.renderHeatmapChart(data, options);
        break;
      case 'scatter':
        this.renderScatterChart(data, options);
        break;
    }
    
    // 绘制标签
    if (this.config.showLabels) {
      this.drawLabels(data, options);
    }
    
    // 绘制图例
    if (this.config.showLegend) {
      this.drawLegend(data);
    }
  }

  /**
   * 渲染层级分解图表
   */
  public renderLevelBreakdown(
    levelData: Record<RandomLevel, any>,
    options: RenderOptions = {}
  ): void {
    if (!this.ctx || !this.canvas) return;
    
    this.clearCanvas();
    this.drawBackground();
    
    // 绘制雷达图样式的层级分解
    this.renderRadarChart([{
      timestamp: Date.now(),
      levelData,
      parameterSummary: { totalParameters: 0, activeLevels: 0, chaosFactor: 0, performanceFactor: 0 },
      coordinationData: { strategy: '', coordinationTime: 0, totalUpdates: 0 }
    }], options);
  }

  /**
   * 渲染性能指标图表
   */
  public renderPerformanceMetrics(
    data: VisualizationData[],
    options: RenderOptions = {}
  ): void {
    if (!this.ctx || !this.canvas) return;
    
    this.clearCanvas();
    this.drawBackground();
    
    // 绘制性能指标条形图
    this.renderBarChart(data, { ...options, showPerformance: true });
  }

  /**
   * 渲染线形图
   */
  private renderLineChart(data: VisualizationData[], options: RenderOptions): void {
    if (!this.ctx) return;
    
    const levels = Object.values(RandomLevel);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    
    levels.forEach((level, index) => {
      const levelData = data.map(d => d.levelData[level]?.randomness || 0);
      const color = colors[index % colors.length];
      
      this.drawLine(levelData, color, options);
    });
  }

  /**
   * 渲染条形图
   */
  private renderBarChart(data: VisualizationData[], options: RenderOptions): void {
    if (!this.ctx) return;
    
    if (options.showPerformance) {
      this.renderPerformanceBars(data);
    } else {
      this.renderRandomnessBars(data);
    }
  }

  /**
   * 渲染雷达图
   */
  private renderRadarChart(data: VisualizationData[], options: RenderOptions): void {
    if (!this.ctx || data.length === 0) return;
    
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    const radius = Math.min(centerX, centerY) * 0.7;
    
    const levels = Object.values(RandomLevel);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    
    // 绘制雷达网格
    this.drawRadarGrid(centerX, centerY, radius, levels.length);
    
    // 绘制数据
    const latestData = data[data.length - 1];
    levels.forEach((level, index) => {
      const value = latestData.levelData[level]?.randomness || 0;
      const angle = (index * 2 * Math.PI) / levels.length - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius * value;
      const y = centerY + Math.sin(angle) * radius * value;
      
      this.drawRadarPoint(x, y, colors[index % colors.length], level);
    });
  }

  /**
   * 渲染热力图
   */
  private renderHeatmapChart(data: VisualizationData[], options: RenderOptions): void {
    if (!this.ctx || data.length === 0) return;
    
    const cellWidth = this.config.width / data.length;
    const cellHeight = this.config.height / Object.values(RandomLevel).length;
    
    const levels = Object.values(RandomLevel);
    
    levels.forEach((level, levelIndex) => {
      data.forEach((d, dataIndex) => {
        const value = d.levelData[level]?.randomness || 0;
        const x = dataIndex * cellWidth;
        const y = levelIndex * cellHeight;
        
        this.drawHeatmapCell(x, y, cellWidth, cellHeight, value);
      });
    });
  }

  /**
   * 渲染散点图
   */
  private renderScatterChart(data: VisualizationData[], options: RenderOptions): void {
    if (!this.ctx || data.length === 0) return;
    
    const levels = Object.values(RandomLevel);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    
    levels.forEach((level, index) => {
      const color = colors[index % colors.length];
      
      data.forEach((d, dataIndex) => {
        const value = d.levelData[level]?.randomness || 0;
        const x = (dataIndex / data.length) * this.config.width;
        const y = (1 - value) * this.config.height;
        
        this.drawScatterPoint(x, y, color, value);
      });
    });
  }

  /**
   * 绘制线条
   */
  private drawLine(data: number[], color: string, options: RenderOptions): void {
    if (!this.ctx || data.length < 2) return;
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    
    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * this.config.width;
      const y = (1 - value) * this.config.height;
      
      if (index === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });
    
    this.ctx.stroke();
  }

  /**
   * 绘制性能条形图
   */
  private renderPerformanceBars(data: VisualizationData[]): void {
    if (!this.ctx || data.length === 0) return;
    
    const latestData = data[data.length - 1];
    const levels = Object.values(RandomLevel);
    const barWidth = this.config.width / levels.length * 0.8;
    const barSpacing = this.config.width / levels.length * 0.2;
    
    levels.forEach((level, index) => {
      const performance = latestData.levelData[level]?.performance;
      if (!performance) return;
      
      const x = index * (barWidth + barSpacing) + barSpacing / 2;
      const height = (performance.averageUpdateTime / 100) * this.config.height;
      const y = this.config.height - height;
      
      this.drawBar(x, y, barWidth, height, '#4ECDC4');
    });
  }

  /**
   * 绘制随机性条形图
   */
  private renderRandomnessBars(data: VisualizationData[]): void {
    if (!this.ctx || data.length === 0) return;
    
    const latestData = data[data.length - 1];
    const levels = Object.values(RandomLevel);
    const barWidth = this.config.width / levels.length * 0.8;
    const barSpacing = this.config.width / levels.length * 0.2;
    
    levels.forEach((level, index) => {
      const value = latestData.levelData[level]?.randomness || 0;
      const x = index * (barWidth + barSpacing) + barSpacing / 2;
      const height = value * this.config.height;
      const y = this.config.height - height;
      
      this.drawBar(x, y, barWidth, height, '#FF6B6B');
    });
  }

  /**
   * 绘制条形
   */
  private drawBar(x: number, y: number, width: number, height: number, color: string): void {
    if (!this.ctx) return;
    
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }

  /**
   * 绘制雷达网格
   */
  private drawRadarGrid(centerX: number, centerY: number, radius: number, levels: number): void {
    if (!this.ctx) return;
    
    this.ctx.strokeStyle = this.config.gridColor;
    this.ctx.lineWidth = 1;
    
    // 绘制同心圆
    for (let i = 1; i <= 5; i++) {
      const r = (radius * i) / 5;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
      this.ctx.stroke();
    }
    
    // 绘制径向线
    for (let i = 0; i < levels; i++) {
      const angle = (i * 2 * Math.PI) / levels - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    }
  }

  /**
   * 绘制雷达点
   */
  private drawRadarPoint(x: number, y: number, color: string, label: string): void {
    if (!this.ctx) return;
    
    // 绘制点
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 6, 0, 2 * Math.PI);
    this.ctx.fill();
    
    // 绘制标签
    this.ctx.fillStyle = this.config.textColor;
    this.ctx.font = '12px Arial';
    this.ctx.fillText(label, x, y + 20);
  }

  /**
   * 绘制热力图单元格
   */
  private drawHeatmapCell(x: number, y: number, width: number, height: number, value: number): void {
    if (!this.ctx) return;
    
    const intensity = Math.floor(value * 255);
    const color = `rgb(${intensity}, ${intensity}, ${intensity})`;
    
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }

  /**
   * 绘制散点
   */
  private drawScatterPoint(x: number, y: number, color: string, value: number): void {
    if (!this.ctx) return;
    
    const radius = Math.max(2, value * 8);
    
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = 0.7;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

  /**
   * 绘制背景
   */
  private drawBackground(): void {
    if (!this.ctx) return;
    
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);
  }

  /**
   * 绘制网格
   */
  private drawGrid(): void {
    if (!this.ctx) return;
    
    this.ctx.strokeStyle = this.config.gridColor;
    this.ctx.lineWidth = 1;
    
    // 绘制垂直线
    for (let x = 0; x <= this.config.width; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.config.height);
      this.ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= this.config.height; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.config.width, y);
      this.ctx.stroke();
    }
  }

  /**
   * 绘制标签
   */
  private drawLabels(data: VisualizationData[], options: RenderOptions): void {
    if (!this.ctx) return;
    
    this.ctx.fillStyle = this.config.textColor;
    this.ctx.font = '14px Arial';
    
    // 绘制标题
    this.ctx.fillText('随机性可视化', this.config.width / 2, 20);
    
    // 绘制时间标签
    if (data.length > 0) {
      const latestTime = new Date(data[data.length - 1].timestamp).toLocaleTimeString();
      this.ctx.fillText(`更新时间: ${latestTime}`, this.config.width / 2, this.config.height - 10);
    }
  }

  /**
   * 绘制图例
   */
  private drawLegend(data: VisualizationData[]): void {
    if (!this.ctx || data.length === 0) return;
    
    const levels = Object.values(RandomLevel);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    
    this.ctx.font = '12px Arial';
    
    levels.forEach((level, index) => {
      const color = colors[index % colors.length];
      const x = 20;
      const y = 40 + index * 20;
      
      // 绘制颜色块
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y - 5, 10, 10);
      
      // 绘制标签
      this.ctx.fillStyle = this.config.textColor;
      this.ctx.fillText(level, x + 20, y);
    });
  }

  /**
   * 清空画布
   */
  private clearCanvas(): void {
    if (!this.ctx || !this.canvas) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<ChartConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.canvas) {
      this.canvas.width = this.config.width;
      this.canvas.height = this.config.height;
    }
  }

  /**
   * 获取配置
   */
  public getConfig(): ChartConfig {
    return { ...this.config };
  }

  /**
   * 销毁渲染器
   */
  public destroy(): void {
    this.canvas = null;
    this.ctx = null;
    this.isInitialized = false;
    
    console.log('�� 图表渲染器已销毁');
  }
}
