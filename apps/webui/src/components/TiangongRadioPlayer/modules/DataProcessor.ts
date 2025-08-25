/**
 * 数据处理器模块
 * 负责处理随机性可视化的数据
 * TASK-127: 模块化RandomnessVisualizationManager
 */

import type { RandomLevel } from '../multiLevelRandomSystem';
import type { VisualizationData } from '../randomnessVisualization';

// 数据处理配置接口
export interface DataProcessingConfig {
  // 数据过滤配置
  filterConfig: {
    minDataPoints: number;          // 最小数据点数量
    maxDataPoints: number;          // 最大数据点数量
    timeWindow: number;             // 时间窗口(ms)
    enableSmoothing: boolean;       // 是否启用平滑
    smoothingFactor: number;        // 平滑因子
  };
  
  // 统计分析配置
  analysisConfig: {
    enableTrendAnalysis: boolean;   // 是否启用趋势分析
    enableAnomalyDetection: boolean; // 是否启用异常检测
    enableCorrelationAnalysis: boolean; // 是否启用相关性分析
    analysisWindow: number;         // 分析窗口大小
  };
  
  // 性能监控配置
  performanceConfig: {
    enablePerformanceTracking: boolean; // 是否启用性能跟踪
    performanceThreshold: number;    // 性能阈值
    enableAutoOptimization: boolean; // 是否启用自动优化
  };
}

// 默认配置
export const DEFAULT_DATA_PROCESSING_CONFIG: DataProcessingConfig = {
  filterConfig: {
    minDataPoints: 10,
    maxDataPoints: 1000,
    timeWindow: 60000, // 1分钟
    enableSmoothing: true,
    smoothingFactor: 0.7
  },
  
  analysisConfig: {
    enableTrendAnalysis: true,
    enableAnomalyDetection: true,
    enableCorrelationAnalysis: true,
    analysisWindow: 50
  },
  
  performanceConfig: {
    enablePerformanceTracking: true,
    performanceThreshold: 0.8,
    enableAutoOptimization: true
  }
};

// 趋势分析结果接口
export interface TrendAnalysisResult {
  level: RandomLevel;
  trend: 'increasing' | 'decreasing' | 'stable' | 'oscillating';
  trendStrength: number;            // 趋势强度 (0-1)
  changeRate: number;               // 变化速率
  confidence: number;               // 置信度 (0-1)
  prediction: number;               // 预测值
}

// 异常检测结果接口
export interface AnomalyDetectionResult {
  level: RandomLevel;
  isAnomaly: boolean;
  anomalyScore: number;             // 异常分数 (0-1)
  anomalyType: 'spike' | 'drop' | 'drift' | 'none';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

// 相关性分析结果接口
export interface CorrelationAnalysisResult {
  level1: RandomLevel;
  level2: RandomLevel;
  correlation: number;               // 相关系数 (-1 to 1)
  significance: number;              // 显著性 (0-1)
  relationship: 'positive' | 'negative' | 'none';
  strength: 'weak' | 'moderate' | 'strong';
}

// 性能指标接口
export interface PerformanceMetrics {
  processingTime: number;            // 处理时间(ms)
  memoryUsage: number;               // 内存使用(MB)
  dataThroughput: number;            // 数据吞吐量(点/秒)
  errorRate: number;                 // 错误率 (0-1)
  optimizationLevel: number;         // 优化级别 (0-1)
}

/**
 * 数据处理器类
 * 提供完整的数据处理功能
 */
export class DataProcessor {
  private config: DataProcessingConfig;
  private isInitialized: boolean = false;
  private performanceHistory: PerformanceMetrics[] = [];
  private maxPerformanceHistory: number = 100;

  constructor(config?: Partial<DataProcessingConfig>) {
    this.config = { ...DEFAULT_DATA_PROCESSING_CONFIG, ...config };
  }

  /**
   * 初始化数据处理器
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    try {
      this.isInitialized = true;
      console.log('🔧 数据处理器初始化成功');
      
    } catch (error) {
      console.error('❌ 数据处理器初始化失败:', error);
    }
  }

  /**
   * 处理可视化数据
   */
  public processVisualizationData(
    rawData: VisualizationData[]
  ): {
    processedData: VisualizationData[];
    trends: TrendAnalysisResult[];
    anomalies: AnomalyDetectionResult[];
    correlations: CorrelationAnalysisResult[];
    performance: PerformanceMetrics;
  } {
    const startTime = performance.now();
    
    try {
      // 数据过滤
      const filteredData = this.filterData(rawData);
      
      // 数据平滑
      const smoothedData = this.config.filterConfig.enableSmoothing 
        ? this.smoothData(filteredData)
        : filteredData;
      
      // 趋势分析
      const trends = this.config.analysisConfig.enableTrendAnalysis
        ? this.analyzeTrends(smoothedData)
        : [];
      
      // 异常检测
      const anomalies = this.config.analysisConfig.enableAnomalyDetection
        ? this.detectAnomalies(smoothedData)
        : [];
      
      // 相关性分析
      const correlations = this.config.analysisConfig.enableCorrelationAnalysis
        ? this.analyzeCorrelations(smoothedData)
        : [];
      
      // 计算性能指标
      const processingTime = performance.now() - startTime;
      const performance = this.calculatePerformanceMetrics(processingTime, rawData.length);
      
      // 记录性能历史
      this.recordPerformanceMetrics(performance);
      
      return {
        processedData: smoothedData,
        trends,
        anomalies,
        correlations,
        performance
      };
      
    } catch (error) {
      console.error('❌ 数据处理失败:', error);
      
      // 返回空结果
      return {
        processedData: [],
        trends: [],
        anomalies: [],
        correlations: [],
        performance: this.createDefaultPerformanceMetrics()
      };
    }
  }

  /**
   * 过滤数据
   */
  private filterData(data: VisualizationData[]): VisualizationData[] {
    if (data.length <= this.config.filterConfig.minDataPoints) {
      return data;
    }
    
    // 时间窗口过滤
    const cutoffTime = Date.now() - this.config.filterConfig.timeWindow;
    let filteredData = data.filter(d => d.timestamp >= cutoffTime);
    
    // 数据点数量限制
    if (filteredData.length > this.config.filterConfig.maxDataPoints) {
      const step = Math.ceil(filteredData.length / this.config.filterConfig.maxDataPoints);
      filteredData = filteredData.filter((_, index) => index % step === 0);
    }
    
    return filteredData;
  }

  /**
   * 平滑数据
   */
  private smoothData(data: VisualizationData[]): VisualizationData[] {
    if (data.length < 3) return data;
    
    const smoothingFactor = this.config.filterConfig.smoothingFactor;
    const smoothedData: VisualizationData[] = [];
    
    // 复制第一个数据点
    smoothedData.push({ ...data[0] });
    
    // 应用指数平滑
    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const previous = smoothedData[i - 1];
      
      const smoothed: VisualizationData = {
        timestamp: current.timestamp,
        levelData: {} as any,
        parameterSummary: { ...current.parameterSummary },
        coordinationData: { ...current.coordinationData }
      };
      
      // 平滑每个层级的数据
      Object.keys(current.levelData).forEach(level => {
        const currentValue = current.levelData[level as RandomLevel]?.randomness || 0;
        const previousValue = previous.levelData[level as RandomLevel]?.randomness || 0;
        
        const smoothedValue = previousValue * (1 - smoothingFactor) + currentValue * smoothingFactor;
        
        smoothed.levelData[level as RandomLevel] = {
          ...current.levelData[level as RandomLevel],
          randomness: smoothedValue
        };
      });
      
      smoothedData.push(smoothed);
    }
    
    return smoothedData;
  }

  /**
   * 分析趋势
   */
  private analyzeTrends(data: VisualizationData[]): TrendAnalysisResult[] {
    if (data.length < this.config.analysisConfig.analysisWindow) {
      return [];
    }
    
    const levels = Object.values(RandomLevel);
    const results: TrendAnalysisResult[] = [];
    
    levels.forEach(level => {
      const levelData = data.map(d => d.levelData[level]?.randomness || 0);
      const trend = this.calculateTrend(levelData);
      
      results.push({
        level,
        ...trend
      });
    });
    
    return results;
  }

  /**
   * 计算趋势
   */
  private calculateTrend(data: number[]): Omit<TrendAnalysisResult, 'level'> {
    if (data.length < 2) {
      return {
        trend: 'stable',
        trendStrength: 0,
        changeRate: 0,
        confidence: 0,
        prediction: data[0] || 0
      };
    }
    
    // 线性回归
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * data[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // 计算趋势强度
    const trendStrength = Math.abs(slope);
    const changeRate = slope;
    
    // 确定趋势类型
    let trend: 'increasing' | 'decreasing' | 'stable' | 'oscillating';
    if (trendStrength < 0.01) {
      trend = 'stable';
    } else if (slope > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }
    
    // 检查是否振荡
    if (this.isOscillating(data)) {
      trend = 'oscillating';
    }
    
    // 计算置信度
    const confidence = this.calculateConfidence(data, slope, intercept);
    
    // 预测下一个值
    const prediction = slope * n + intercept;
    
    return {
      trend,
      trendStrength: Math.min(1, trendStrength * 100),
      changeRate,
      confidence,
      prediction: Math.max(0, Math.min(1, prediction))
    };
  }

  /**
   * 检查是否振荡
   */
  private isOscillating(data: number[]): boolean {
    if (data.length < 4) return false;
    
    let directionChanges = 0;
    let previousDirection = 0;
    
    for (let i = 1; i < data.length; i++) {
      const currentDirection = Math.sign(data[i] - data[i - 1]);
      
      if (currentDirection !== 0 && currentDirection !== previousDirection) {
        directionChanges++;
      }
      
      if (currentDirection !== 0) {
        previousDirection = currentDirection;
      }
    }
    
    return directionChanges >= 3;
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(data: number[], slope: number, intercept: number): number {
    if (data.length < 3) return 0;
    
    // 计算R²值
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const totalSS = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    
    const residuals = data.map((val, i) => val - (slope * i + intercept));
    const residualSS = residuals.reduce((sum, val) => sum + Math.pow(val, 2), 0);
    
    const rSquared = 1 - (residualSS / totalSS);
    return Math.max(0, Math.min(1, rSquared));
  }

  /**
   * 检测异常
   */
  private detectAnomalies(data: VisualizationData[]): AnomalyDetectionResult[] {
    if (data.length < this.config.analysisConfig.analysisWindow) {
      return [];
    }
    
    const levels = Object.values(RandomLevel);
    const results: AnomalyDetectionResult[] = [];
    
    levels.forEach(level => {
      const levelData = data.map(d => d.levelData[level]?.randomness || 0);
      const anomaly = this.detectLevelAnomaly(level, levelData);
      
      if (anomaly.isAnomaly) {
        results.push(anomaly);
      }
    });
    
    return results;
  }

  /**
   * 检测层级异常
   */
  private detectLevelAnomaly(level: RandomLevel, data: number[]): AnomalyDetectionResult {
    if (data.length < 3) {
      return {
        level,
        isAnomaly: false,
        anomalyScore: 0,
        anomalyType: 'none',
        severity: 'low',
        description: '数据点不足，无法检测异常'
      };
    }
    
    // 计算统计指标
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    
    // 检测最新值的异常
    const latestValue = data[data.length - 1];
    const zScore = Math.abs((latestValue - mean) / stdDev);
    
    let isAnomaly = false;
    let anomalyType: 'spike' | 'drop' | 'drift' | 'none' = 'none';
    let severity: 'low' | 'medium' | 'high' = 'low';
    let description = '';
    
    if (zScore > 3) {
      isAnomaly = true;
      if (latestValue > mean + 2 * stdDev) {
        anomalyType = 'spike';
        severity = zScore > 4 ? 'high' : 'medium';
        description = `检测到异常峰值，Z分数: ${zScore.toFixed(2)}`;
      } else if (latestValue < mean - 2 * stdDev) {
        anomalyType = 'drop';
        severity = zScore > 4 ? 'high' : 'medium';
        description = `检测到异常下降，Z分数: ${zScore.toFixed(2)}`;
      }
    } else if (zScore > 2) {
      // 检查是否有漂移趋势
      const recentData = data.slice(-10);
      const recentMean = recentData.reduce((sum, val) => sum + val, 0) / recentData.length;
      
      if (Math.abs(recentMean - mean) > stdDev) {
        isAnomaly = true;
        anomalyType = 'drift';
        severity = 'low';
        description = `检测到数据漂移，偏移量: ${(recentMean - mean).toFixed(3)}`;
      }
    }
    
    return {
      level,
      isAnomaly,
      anomalyScore: Math.min(1, zScore / 5),
      anomalyType,
      severity,
      description
    };
  }

  /**
   * 分析相关性
   */
  private analyzeCorrelations(data: VisualizationData[]): CorrelationAnalysisResult[] {
    if (data.length < this.config.analysisConfig.analysisWindow) {
      return [];
    }
    
    const levels = Object.values(RandomLevel);
    const results: CorrelationAnalysisResult[] = [];
    
    // 分析所有层级对的相关性
    for (let i = 0; i < levels.length; i++) {
      for (let j = i + 1; j < levels.length; j++) {
        const level1 = levels[i];
        const level2 = levels[j];
        
        const data1 = data.map(d => d.levelData[level1]?.randomness || 0);
        const data2 = data.map(d => d.levelData[level2]?.randomness || 0);
        
        const correlation = this.calculateCorrelation(data1, data2);
        const significance = this.calculateSignificance(correlation, data.length);
        
        if (Math.abs(correlation) > 0.3) { // 只报告显著相关性
          results.push({
            level1,
            level2,
            correlation,
            significance,
            relationship: correlation > 0 ? 'positive' : 'negative',
            strength: Math.abs(correlation) > 0.7 ? 'strong' : 
                     Math.abs(correlation) > 0.5 ? 'moderate' : 'weak'
          });
        }
      }
    }
    
    return results;
  }

  /**
   * 计算相关系数
   */
  private calculateCorrelation(data1: number[], data2: number[]): number {
    if (data1.length !== data2.length || data1.length < 2) return 0;
    
    const n = data1.length;
    const mean1 = data1.reduce((sum, val) => sum + val, 0) / n;
    const mean2 = data2.reduce((sum, val) => sum + val, 0) / n;
    
    const numerator = data1.reduce((sum, val, i) => 
      sum + (val - mean1) * (data2[i] - mean2), 0
    );
    
    const denominator1 = data1.reduce((sum, val) => 
      sum + Math.pow(val - mean1, 2), 0
    );
    const denominator2 = data2.reduce((sum, val) => 
      sum + Math.pow(val - mean2, 2), 0
    );
    
    const denominator = Math.sqrt(denominator1 * denominator2);
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * 计算显著性
   */
  private calculateSignificance(correlation: number, sampleSize: number): number {
    if (sampleSize < 3) return 0;
    
    // 简化的t检验
    const t = correlation * Math.sqrt((sampleSize - 2) / (1 - correlation * correlation));
    const df = sampleSize - 2;
    
    // 简化的p值计算
    const pValue = 1 / (1 + Math.exp(t - df / 2));
    
    return Math.max(0, Math.min(1, 1 - pValue));
  }

  /**
   * 计算性能指标
   */
  private calculatePerformanceMetrics(processingTime: number, dataPoints: number): PerformanceMetrics {
    const memoryUsage = this.estimateMemoryUsage();
    const dataThroughput = dataPoints / (processingTime / 1000);
    const errorRate = this.calculateErrorRate();
    const optimizationLevel = this.calculateOptimizationLevel();
    
    return {
      processingTime,
      memoryUsage,
      dataThroughput,
      errorRate,
      optimizationLevel
    };
  }

  /**
   * 估算内存使用
   */
  private estimateMemoryUsage(): number {
    // 简化的内存使用估算
    const baseMemory = 50; // 基础内存使用 (MB)
    const dataMemory = this.performanceHistory.length * 0.1; // 每个性能记录 0.1MB
    
    return baseMemory + dataMemory;
  }

  /**
   * 计算错误率
   */
  private calculateErrorRate(): number {
    if (this.performanceHistory.length === 0) return 0;
    
    const totalErrors = this.performanceHistory.filter(p => p.errorRate > 0).length;
    return totalErrors / this.performanceHistory.length;
  }

  /**
   * 计算优化级别
   */
  private calculateOptimizationLevel(): number {
    if (this.performanceHistory.length === 0) return 0;
    
    const recentPerformance = this.performanceHistory.slice(-10);
    const avgThroughput = recentPerformance.reduce((sum, p) => sum + p.dataThroughput, 0) / recentPerformance.length;
    
    // 基于吞吐量的优化级别
    return Math.min(1, avgThroughput / 1000);
  }

  /**
   * 记录性能指标
   */
  private recordPerformanceMetrics(metrics: PerformanceMetrics): void {
    this.performanceHistory.push(metrics);
    
    if (this.performanceHistory.length > this.maxPerformanceHistory) {
      this.performanceHistory.shift();
    }
  }

  /**
   * 创建默认性能指标
   */
  private createDefaultPerformanceMetrics(): PerformanceMetrics {
    return {
      processingTime: 0,
      memoryUsage: 0,
      dataThroughput: 0,
      errorRate: 0,
      optimizationLevel: 0
    };
  }

  /**
   * 获取性能历史
   */
  public getPerformanceHistory(): PerformanceMetrics[] {
    return [...this.performanceHistory];
  }

  /**
   * 获取性能统计
   */
  public getPerformanceStats(): {
    averageProcessingTime: number;
    averageMemoryUsage: number;
    averageThroughput: number;
    totalErrors: number;
  } {
    if (this.performanceHistory.length === 0) {
      return {
        averageProcessingTime: 0,
        averageMemoryUsage: 0,
        averageThroughput: 0,
        totalErrors: 0
      };
    }
    
    const avgProcessingTime = this.performanceHistory.reduce((sum, p) => sum + p.processingTime, 0) / this.performanceHistory.length;
    const avgMemoryUsage = this.performanceHistory.reduce((sum, p) => sum + p.memoryUsage, 0) / this.performanceHistory.length;
    const avgThroughput = this.performanceHistory.reduce((sum, p) => sum + p.dataThroughput, 0) / this.performanceHistory.length;
    const totalErrors = this.performanceHistory.filter(p => p.errorRate > 0).length;
    
    return {
      averageProcessingTime: avgProcessingTime,
      averageMemoryUsage: avgMemoryUsage,
      averageThroughput: avgThroughput,
      totalErrors
    };
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<DataProcessingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔄 数据处理配置已更新');
  }

  /**
   * 获取配置
   */
  public getConfig(): DataProcessingConfig {
    return { ...this.config };
  }

  /**
   * 销毁数据处理器
   */
  public destroy(): void {
    this.performanceHistory = [];
    this.isInitialized = false;
    
    console.log('�� 数据处理器已销毁');
  }
}
