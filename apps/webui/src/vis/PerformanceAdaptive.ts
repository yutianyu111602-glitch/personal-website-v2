/**
 * PerformanceAdaptive.ts - 性能自适应系统
 * 更智能的性能监控和自适应降级策略
 */

import type { BlendNode, BlendPipeline } from './LiquidMetalConductor';

export type PerformanceTier = 'high' | 'medium' | 'low';

export type PerformanceMetrics = {
  avgFrameMs: number;
  fps: number;
  gpuTier?: PerformanceTier;
  memoryPressure?: number;
  cpuUtilization?: number;
};

export type AdaptiveConfig = {
  fpsThresholds: {
    high: number;
    medium: number;
    low: number;
  };
  maxNodes: {
    high: number;
    medium: number;
    low: number;
  };
  maxWeight: {
    high: number;
    medium: number;
    low: number;
  };
  disabledNodes: {
    high: string[];
    medium: string[];
    low: string[];
  };
};

// 默认配置
export const DEFAULT_ADAPTIVE_CONFIG: AdaptiveConfig = {
  fpsThresholds: {
    high: 55,
    medium: 48,
    low: 30
  },
  maxNodes: {
    high: 3,
    medium: 2,
    low: 1
  },
  maxWeight: {
    high: 0.35,
    medium: 0.28,
    low: 0.20
  },
  disabledNodes: {
    high: [],
    medium: ['BloomHL', 'TemporalTrail'],
    low: ['BloomHL', 'TemporalTrail', 'EdgeTint', 'GrainMerge', 'SpecularGrad']
  }
};

/**
 * 计算当前性能层级
 */
export function calculatePerformanceTier(
  metrics: PerformanceMetrics,
  config: AdaptiveConfig
): PerformanceTier {
  const { fps } = metrics;
  
  if (fps >= config.fpsThresholds.high) return 'high';
  if (fps >= config.fpsThresholds.medium) return 'medium';
  return 'low';
}

/**
 * 应用性能自适应降级
 */
export function applyPerformanceAdaptation(
  pipeline: BlendPipeline,
  metrics: PerformanceMetrics,
  config: AdaptiveConfig = DEFAULT_ADAPTIVE_CONFIG
): BlendPipeline {
  const tier = calculatePerformanceTier(metrics, config);
  const adapted = { ...pipeline };
  
  // 1. 过滤禁用的节点
  const disabledSet = new Set(config.disabledNodes[tier]);
  adapted.nodes = adapted.nodes.filter(node => !disabledSet.has(node.id));
  
  // 2. 限制节点数量
  if (adapted.nodes.length > config.maxNodes[tier]) {
    // 按权重排序，保留最重要的节点
    adapted.nodes.sort((a, b) => {
      // Base > Accent > Decor
      const categoryOrder = { Base: 3, Accent: 2, Decor: 1 };
      const catA = categoryOrder[a.category || 'Decor'];
      const catB = categoryOrder[b.category || 'Decor'];
      if (catA !== catB) return catB - catA;
      return b.weight - a.weight;
    });
    adapted.nodes = adapted.nodes.slice(0, config.maxNodes[tier]);
  }
  
  // 3. 调整权重上限
  const maxWeight = config.maxWeight[tier];
  let totalWeight = adapted.nodes.reduce((sum, node) => sum + node.weight, 0);
  
  if (totalWeight > maxWeight) {
    const scale = maxWeight / totalWeight;
    adapted.nodes.forEach(node => {
      node.weight *= scale;
    });
  }
  
  // 4. 特殊处理低性能情况
  if (tier === 'low') {
    // 降低所有Decor节点权重
    adapted.nodes.forEach(node => {
      if (node.category === 'Decor') {
        node.weight = Math.min(node.weight, 0.06);
      }
    });
    
    // 简化uniforms
    adapted.nodes.forEach(node => {
      if (node.uniforms) {
        // 降低迭代次数、精度等
        if ('iterations' in node.uniforms) {
          node.uniforms.iterations = Math.min(node.uniforms.iterations as number, 4);
        }
        if ('quality' in node.uniforms) {
          node.uniforms.quality = 0.5;
        }
      }
    });
  }
  
  return adapted;
}

/**
 * 性能预测 - 基于历史数据预测下一帧性能
 */
export class PerformancePredictor {
  private history: number[] = [];
  private maxHistory = 60; // 保留1秒的历史数据
  
  addFrame(frameMs: number): void {
    this.history.push(frameMs);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }
  
  predictNext(): number {
    if (this.history.length === 0) return 16.67; // 60fps default
    
    // 使用加权移动平均，最近的帧权重更高
    let weightedSum = 0;
    let weightSum = 0;
    
    for (let i = 0; i < this.history.length; i++) {
      const weight = (i + 1) / this.history.length;
      weightedSum += this.history[i] * weight;
      weightSum += weight;
    }
    
    return weightedSum / weightSum;
  }
  
  getTrend(): 'improving' | 'stable' | 'degrading' {
    if (this.history.length < 10) return 'stable';
    
    const recent = this.history.slice(-10);
    const older = this.history.slice(-20, -10);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    
    if (diff < -2) return 'improving';
    if (diff > 2) return 'degrading';
    return 'stable';
  }
}

/**
 * 智能降级建议
 */
export function getPerformanceRecommendations(
  metrics: PerformanceMetrics,
  pipeline: BlendPipeline
): string[] {
  const recommendations: string[] = [];
  
  if (metrics.fps < 30) {
    recommendations.push('严重性能问题：建议切换到低质量模式');
  }
  
  if (metrics.fps < 48) {
    const heavyNodes = pipeline.nodes.filter(n => 
      ['BloomHL', 'TemporalTrail', 'SpecularGrad'].includes(n.id)
    );
    if (heavyNodes.length > 0) {
      recommendations.push(`建议禁用高消耗节点：${heavyNodes.map(n => n.id).join(', ')}`);
    }
  }
  
  const totalWeight = pipeline.nodes.reduce((sum, n) => sum + n.weight, 0);
  if (totalWeight > 0.3 && metrics.fps < 55) {
    recommendations.push(`总权重过高 (${totalWeight.toFixed(2)})，建议降低到0.3以下`);
  }
  
  if (metrics.memoryPressure && metrics.memoryPressure > 0.8) {
    recommendations.push('内存压力过高，建议减少纹理使用');
  }
  
  return recommendations;
}
