/**
 * EnhancedEngineBridge.ts - 增强版集成桥接模块
 * 基于深度思考内容的精华算法，增强原有的EngineBridge功能
 */

import type { BlendPipeline, BlendNode } from './LiquidMetalConductor';
import type { UnifiedDriveVector } from './UnifiedDrive';
import type { PerformanceMetrics } from './PerformanceAdaptive';

export type UniformAssignment = {
  scope: 'global' | 'node' | 'category';
  nodeId?: string;
  category?: 'Base' | 'Accent' | 'Decor';
  key: string;
  value: number | number[] | boolean;
};

export type WeightAssignment = {
  id: string;
  weight: number;
  category?: 'Base' | 'Accent' | 'Decor';
};

export type RenderInstructions = {
  weights: WeightAssignment[];
  uniforms: UniformAssignment[];
  metadata: {
    driveVector: UnifiedDriveVector;
    performanceTier: 'high' | 'medium' | 'low';
    totalWeight: number;
    nodeCount: number;
    extras?: BlendPipeline['extras'];
  };
};

/**
 * 将Pipeline转换为渲染指令
 * 增强版：包含更多元数据和智能映射
 */
export function pipelineToRenderInstructions(
  pipeline: BlendPipeline,
  driveVector: UnifiedDriveVector,
  metrics: PerformanceMetrics
): RenderInstructions {
  const weights: WeightAssignment[] = [];
  const uniforms: UniformAssignment[] = [];
  
  // 1. 处理节点权重
  for (const node of pipeline.nodes) {
    weights.push({
      id: node.id,
      weight: node.weight,
      category: node.category
    });
    
    // 2. 处理节点特定的uniforms
    if (node.uniforms) {
      for (const [key, value] of Object.entries(node.uniforms)) {
        uniforms.push({
          scope: 'node',
          nodeId: node.id,
          key,
          value
        });
      }
    }
  }
  
  // 3. 添加全局uniforms
  const globalUniforms: Record<string, number | number[]> = {
    // 基础全局参数
    uBrightCap: metrics.fps < 48 ? 0.85 : 0.95,
    uJitter: 0.015,
    
    // 驱动向量
    uDriveEnergy: driveVector.E,
    uDriveArousal: driveVector.A,
    uDriveValence: driveVector.V,
    
    // 性能相关
    uQuality: metrics.fps >= 55 ? 1.0 : metrics.fps >= 48 ? 0.7 : 0.5,
    uFrameMs: metrics.avgFrameMs
  };
  
  for (const [key, value] of Object.entries(globalUniforms)) {
    uniforms.push({
      scope: 'global',
      key,
      value
    });
  }
  
  // 4. 处理extras（生成器参数）
  if (pipeline.extras) {
    if (pipeline.extras.flow) {
      const flow = pipeline.extras.flow;
      uniforms.push({
        scope: 'global',
        key: 'uFlowType',
        value: ['CurlNoise', 'StableFluid', 'DomainWarp', 'LIC'].indexOf(flow.id)
      });
      
      if (flow.uniforms) {
        for (const [key, value] of Object.entries(flow.uniforms)) {
          uniforms.push({
            scope: 'global',
            key: `uFlow_${key}`,
            value
          });
        }
      }
    }
    
    if (pipeline.extras.texture) {
      const texture = pipeline.extras.texture;
      uniforms.push({
        scope: 'global',
        key: 'uTextureType',
        value: ['Simplex', 'fBm', 'Ridged', 'Worley', 'Gabor'].indexOf(texture.id)
      });
      
      if (texture.uniforms) {
        for (const [key, value] of Object.entries(texture.uniforms)) {
          uniforms.push({
            scope: 'global',
            key: `uTex_${key}`,
            value
          });
        }
      }
    }
    
    if (pipeline.extras.pattern) {
      const pattern = pipeline.extras.pattern;
      uniforms.push({
        scope: 'global',
        key: 'uPatternType',
        value: ['ReactionDiffusion', 'Lenia', 'WFC'].indexOf(pattern.id)
      });
      
      if (pattern.uniforms) {
        for (const [key, value] of Object.entries(pattern.uniforms)) {
          uniforms.push({
            scope: 'global',
            key: `uPat_${key}`,
            value
          });
        }
      }
    }
  }
  
  // 5. 类别特定的uniforms
  const categoryDefaults = {
    Base: { smoothness: 0.8, persistence: 0.9 },
    Accent: { intensity: 0.7, sharpness: 0.6 },
    Decor: { opacity: 0.5, variation: 0.3 }
  };
  
  for (const [category, defaults] of Object.entries(categoryDefaults)) {
    for (const [key, value] of Object.entries(defaults)) {
      uniforms.push({
        scope: 'category',
        category: category as 'Base' | 'Accent' | 'Decor',
        key: `u${category}_${key}`,
        value
      });
    }
  }
  
  // 计算元数据
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  const performanceTier = 
    metrics.fps >= 55 ? 'high' :
    metrics.fps >= 48 ? 'medium' : 'low';
  
  return {
    weights,
    uniforms,
    metadata: {
      driveVector,
      performanceTier,
      totalWeight,
      nodeCount: pipeline.nodes.length,
      extras: pipeline.extras
    }
  };
}

/**
 * 策略DSL规则类型定义（从深度思考内容提取）
 */
export type RenderRule = {
  id: string;
  when?: {
    hour?: [number, number];
    fpsMin?: number;
    fpsMax?: number;
    segment?: string[];
  };
  allow?: string[];
  forbid?: string[];
  maxWeight?: number;
  ttl?: [number, number];
};

/**
 * 应用渲染规则
 */
export function applyRenderRules(
  instructions: RenderInstructions,
  rules: RenderRule[],
  currentHour: number,
  currentSegment?: string
): RenderInstructions {
  const activeRules = rules.filter(rule => {
    if (rule.when) {
      // 检查时间
      if (rule.when.hour) {
        const [start, end] = rule.when.hour;
        if (currentHour < start || currentHour >= end) return false;
      }
      
      // 检查FPS
      if (rule.when.fpsMin || rule.when.fpsMax) {
        const fps = 1000 / instructions.metadata.driveVector.E; // 简化计算
        if (rule.when.fpsMin && fps < rule.when.fpsMin) return false;
        if (rule.when.fpsMax && fps > rule.when.fpsMax) return false;
      }
      
      // 检查段落
      if (rule.when.segment && currentSegment) {
        if (!rule.when.segment.includes(currentSegment)) return false;
      }
    }
    return true;
  });
  
  // 应用规则
  let modifiedInstructions = { ...instructions };
  
  for (const rule of activeRules) {
    // 禁用节点
    if (rule.forbid) {
      const forbidSet = new Set(rule.forbid);
      modifiedInstructions.weights = modifiedInstructions.weights.filter(
        w => !forbidSet.has(w.id)
      );
    }
    
    // 限制最大权重
    if (rule.maxWeight !== undefined) {
      const currentTotal = modifiedInstructions.weights.reduce(
        (sum, w) => sum + w.weight, 0
      );
      
      if (currentTotal > rule.maxWeight) {
        const scale = rule.maxWeight / currentTotal;
        modifiedInstructions.weights.forEach(w => {
          w.weight *= scale;
        });
      }
    }
  }
  
  return modifiedInstructions;
}

/**
 * 观测和遥测接口
 */
export type TelemetryEvent = {
  type: 'fps' | 'pipeline_change' | 'rule_applied' | 'performance_tier' | 'error';
  timestamp: number;
  data: any;
};

export class TelemetryCollector {
  private events: TelemetryEvent[] = [];
  private maxEvents = 1000;
  
  record(event: Omit<TelemetryEvent, 'timestamp'>): void {
    this.events.push({
      ...event,
      timestamp: Date.now()
    });
    
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }
  
  getEvents(type?: TelemetryEvent['type']): TelemetryEvent[] {
    if (type) {
      return this.events.filter(e => e.type === type);
    }
    return this.events;
  }
  
  getStats(): Record<string, any> {
    const now = Date.now();
    const recentEvents = this.events.filter(e => now - e.timestamp < 60000); // 最近1分钟
    
    const stats: Record<string, any> = {
      totalEvents: this.events.length,
      recentEvents: recentEvents.length,
      eventTypes: {}
    };
    
    // 统计各类事件
    for (const event of recentEvents) {
      stats.eventTypes[event.type] = (stats.eventTypes[event.type] || 0) + 1;
    }
    
    // 计算平均FPS
    const fpsEvents = recentEvents.filter(e => e.type === 'fps');
    if (fpsEvents.length > 0) {
      stats.avgFps = fpsEvents.reduce((sum, e) => sum + e.data.fps, 0) / fpsEvents.length;
    }
    
    return stats;
  }
}
