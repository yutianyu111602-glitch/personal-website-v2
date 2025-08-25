import throttle from 'lodash/throttle';
import debounce from 'lodash/debounce';
import type { EventNamespace, UnifiedEvent, EventListener, VisualizationEvent, AutoMixEvent, LiquidMetalEvent, GlobalEvent, RadioEvent } from '../../types/unified';
import { EventValidator } from '../../types/unified';

/**
 * UnifiedEventBus.ts - 统一事件总线系统
 * 
 * 整合功能：
 * - VisualizationEventBus: 可视化事件总线
 * - AutoMixEventBus: 混音事件总线
 * - 支持多命名空间（visualization, automix, liquidmetal）
 * - 统一的事件类型定义
 * - 跨模块事件路由
 */

// 事件过滤器
export type EventFilter = (event: UnifiedEvent) => boolean;

// 事件总线配置
export interface EventBusConfig {
  enableLogging: boolean;
  maxListeners: number;
  eventHistorySize: number;
  enableCrossNamespaceRouting: boolean;
  enableEventValidation: boolean;
}

// 默认配置
export const DEFAULT_EVENT_BUS_CONFIG: EventBusConfig = {
  enableLogging: true,
  maxListeners: 100,
  eventHistorySize: 100,
  enableCrossNamespaceRouting: true,
  enableEventValidation: true,
};

// 事件历史记录
interface EventHistoryEntry {
  event: UnifiedEvent;
  timestamp: number;
}

class UnifiedEventBusImpl {
  private config: EventBusConfig;
  private listeners: Map<string, Set<EventListener>> = new Map();
  private eventHistory: EventHistoryEntry[] = [];
  private crossNamespaceRoutes: Map<string, string[]> = new Map();
  // 事件速率限制器（按 namespace:type 粒度）
  private rateLimiters: Map<string, (event: UnifiedEvent) => void> = new Map();
  
  constructor(config: Partial<EventBusConfig> = {}) {
    this.config = { ...DEFAULT_EVENT_BUS_CONFIG, ...config };
    this.setupCrossNamespaceRouting();
    this.setupDefaultRateLimits();
  }
  
  // 设置跨命名空间路由
  private setupCrossNamespaceRouting(): void {
    if (!this.config.enableCrossNamespaceRouting) return;
    
    // 可视化 ↔ 混音 路由
    this.crossNamespaceRoutes.set('visualization:preset', ['automix:energy']);
    this.crossNamespaceRoutes.set('automix:energy', ['visualization:effect']);
    
    // LiquidMetal ↔ 可视化 路由
    this.crossNamespaceRoutes.set('liquidmetal:mood', ['visualization:preset', 'visualization:color']);
    this.crossNamespaceRoutes.set('visualization:preset', ['liquidmetal:pipeline']);
    
    // 全局性能事件路由
    this.crossNamespaceRoutes.set('global:performance', ['visualization:effect', 'liquidmetal:pipeline']);
  }
  
  // 默认速率限制（根据部署计划：对高频事件做 250–500ms 节流/去抖）
  private setupDefaultRateLimits(): void {
    // automix:bpm / automix:energy 使用节流，避免高频抖动
    this.configureRateLimit('automix', 'bpm', 'throttle', 250);
    this.configureRateLimit('automix', 'energy', 'throttle', 250);
    // global:performance 频率更高，放宽到 500ms
    this.configureRateLimit('global', 'performance', 'throttle', 500);
    // visualization:effect 交互触发，使用轻去抖以合并突发
    this.configureRateLimit('visualization', 'effect', 'debounce', 250);
  }
  
  /**
   * 配置速率限制器
   * @param namespace 命名空间
   * @param type      事件类型
   * @param mode      限制模式：throttle | debounce
   * @param waitMs    时间窗口
   */
  public configureRateLimit(
    namespace: EventNamespace,
    type: string,
    mode: 'throttle' | 'debounce',
    waitMs: number
  ): void {
    const eventKey = this.getEventKey(namespace, type);
    if (mode === 'throttle') {
      const throttled = throttle((e: UnifiedEvent) => this.emitImmediate(e), waitMs, { leading: true, trailing: true });
      this.rateLimiters.set(eventKey, (e: UnifiedEvent) => throttled(e));
    } else {
      const debounced = debounce((e: UnifiedEvent) => this.emitImmediate(e), waitMs, { leading: false, trailing: true });
      this.rateLimiters.set(eventKey, (e: UnifiedEvent) => debounced(e));
    }
  }
  
  /**
   * 清除速率限制（可选）
   */
  public clearRateLimit(namespace?: EventNamespace, type?: string): void {
    if (!namespace) {
      this.rateLimiters.clear();
      return;
    }
    const eventKey = this.getEventKey(namespace, type || '*');
    // 精确匹配
    if (this.rateLimiters.has(eventKey)) {
      this.rateLimiters.delete(eventKey);
      return;
    }
    // 模糊：清除此 namespace 下所有类型
    Array.from(this.rateLimiters.keys()).forEach((k) => {
      if (k.startsWith(`${namespace}:`)) this.rateLimiters.delete(k);
    });
  }
  
  // 生成事件键
  private getEventKey(namespace: EventNamespace, type: string): string {
    return `${namespace}:${type}`;
  }
  
  // 添加事件监听器
  public on<T extends UnifiedEvent>(
    namespace: EventNamespace, 
    type: string, 
    listener: EventListener<T>
  ): () => void {
    const eventKey = this.getEventKey(namespace, type);
    
    if (!this.listeners.has(eventKey)) {
      this.listeners.set(eventKey, new Set());
    }
    
    const listenerSet = this.listeners.get(eventKey)!;
    
    // 检查监听器数量限制
    if (listenerSet.size >= this.config.maxListeners) {
      console.warn(`事件监听器数量超过限制: ${eventKey} (${listenerSet.size}/${this.config.maxListeners})`);
    }
    
    listenerSet.add(listener as EventListener);
    
    // 返回取消订阅函数
    return () => {
      listenerSet.delete(listener as EventListener);
      if (listenerSet.size === 0) {
        this.listeners.delete(eventKey);
      }
    };
  }
  
  // 移除事件监听器
  public off(namespace: EventNamespace, type: string, listener: EventListener): void {
    const eventKey = this.getEventKey(namespace, type);
    const listenerSet = this.listeners.get(eventKey);
    
    if (listenerSet) {
      listenerSet.delete(listener);
      if (listenerSet.size === 0) {
        this.listeners.delete(eventKey);
      }
    }
  }
  
  // 发射事件（对高频事件应用速率限制）
  public emit(event: UnifiedEvent): void {
    // 事件验证
    if (this.config.enableEventValidation) {
      if (!EventValidator.validateEvent(event)) {
        console.error('事件验证失败:', event);
        return;
      }
      if (!EventValidator.validateEventData(event)) {
        console.warn('事件数据验证失败:', event);
        // 数据验证失败不阻止事件发射，但记录警告
      }
    }
    
    const eventKey = this.getEventKey(event.namespace, event.type);
    const limiter = this.rateLimiters.get(eventKey);
    if (limiter) {
      limiter(event);
    } else {
      this.emitImmediate(event);
    }
  }

  // 立即发射事件（内部使用，不应用限流）
  private emitImmediate(event: UnifiedEvent): void {
    const eventKey = this.getEventKey(event.namespace, event.type);
    this.recordEvent(event);
    if (this.config.enableLogging) {
      console.log(`🚀 [${event.namespace}:${event.type}]`, event.data);
    }
    const listenerSet = this.listeners.get(eventKey);
    if (listenerSet) {
      listenerSet.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`事件监听器执行错误 [${eventKey}]:`, error);
        }
      });
    }
    this.handleCrossNamespaceRouting(event);
  }
  
  // 记录事件历史
  private recordEvent(event: UnifiedEvent): void {
    this.eventHistory.push({
      event: { ...event },
      timestamp: Date.now()
    });
    
    // 限制历史记录大小
    if (this.eventHistory.length > this.config.eventHistorySize) {
      this.eventHistory.shift();
    }
  }
  
  // 处理跨命名空间路由
  private handleCrossNamespaceRouting(event: UnifiedEvent): void {
    if (!this.config.enableCrossNamespaceRouting) return;
    
    const eventKey = this.getEventKey(event.namespace, event.type);
    const routes = this.crossNamespaceRoutes.get(eventKey);
    
    if (routes) {
      routes.forEach(route => {
        const [targetNamespace, targetType] = route.split(':') as [EventNamespace, any];
        const targetEvent: any = {
          ...event,
          namespace: targetNamespace,
          type: targetType,
          timestamp: Date.now()
        };
        
        // 递归发射，但避免无限循环
        if (targetEvent.namespace !== event.namespace || targetEvent.type !== event.type) {
          this.emit(targetEvent);
        }
      });
    }
  }
  
  // 便捷方法：可视化事件
  public emitPreset(preset: string): void {
    this.emit({
      namespace: 'visualization',
      type: 'preset',
      timestamp: Date.now(),
      data: { preset }
    });
  }
  
  public emitColor(colorScheme: string): void {
    this.emit({
      namespace: 'visualization',
      type: 'color',
      timestamp: Date.now(),
      data: { colorScheme }
    });
  }
  
  public emitPlayback(state: 'play' | 'pause' | 'stop'): void {
    this.emit({
      namespace: 'visualization',
      type: 'playback',
      timestamp: Date.now(),
      data: { playbackState: state }
    });
  }
  
  // 便捷方法：混音事件
  public emitBpm(bpm: number): void {
    this.emit({
      namespace: 'automix',
      type: 'bpm',
      timestamp: Date.now(),
      data: { bpm }
    });
  }
  
  public emitEnergy(energy: number): void {
    this.emit({
      namespace: 'automix',
      type: 'energy',
      timestamp: Date.now(),
      data: { energy }
    });
  }
  
  // 便捷方法：LiquidMetal事件
  public emitMood(mood: { energy: number; valence: number; arousal: number }): void {
    this.emit({
      namespace: 'liquidmetal',
      type: 'mood',
      timestamp: Date.now(),
      data: { mood }
    });
  }
  
  public emitLiquidMetalPreset(preset: string): void {
    this.emit({
      namespace: 'liquidmetal',
      type: 'preset',
      timestamp: Date.now(),
      data: { preset }
    });
  }
  
  // 便捷方法：全局事件
  public emitPerformance(performance: { fps: number; memory: number; cpu?: number }): void {
    this.emit({
      namespace: 'global',
      type: 'performance',
      timestamp: Date.now(),
      data: { performance }
    });
  }
  
  public emitError(error: { message: string; stack?: string; code?: string; context?: Record<string, unknown> }): void {
    this.emit({
      namespace: 'global',
      type: 'error',
      timestamp: Date.now(),
      data: { error }
    });
  }

  // 新增：全局配置事件发射方法
  public emitGlobalConfig(config: Record<string, unknown>): void {
    this.emit({
      namespace: 'global',
      type: 'config',
      timestamp: Date.now(),
      data: { config }
    });
  }

  // 新增：技术推荐事件发射方法
  public emitTechniqueRecommend(recommendation: Record<string, unknown>): void {
    this.emit({
      namespace: 'automix',
      type: 'technique_recommend',
      timestamp: Date.now(),
      data: recommendation
    });
  }
  
  // 获取事件历史
  public getEventHistory(): EventHistoryEntry[] {
    return [...this.eventHistory];
  }
  
  // 获取监听器统计
  public getListenerStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    this.listeners.forEach((listenerSet, eventKey) => {
      stats[eventKey] = listenerSet.size;
    });
    
    return stats;
  }
  
  // 清除所有监听器
  public clearAllListeners(): void {
    this.listeners.clear();
  }
  
  // 清除事件历史
  public clearEventHistory(): void {
    this.eventHistory = [];
  }
  
  // 更新配置
  public updateConfig(newConfig: Partial<EventBusConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.enableCrossNamespaceRouting !== undefined) {
      this.setupCrossNamespaceRouting();
    }
  }
  
  // 获取配置
  public getConfig(): EventBusConfig {
    return { ...this.config };
  }
}

// 导出单例实例
export const UnifiedEventBus = new UnifiedEventBusImpl();

// 向后兼容的别名
export const VisualizationEventBus = UnifiedEventBus;
export const AutoMixEventBus = UnifiedEventBus;

// 便捷的监听器函数
export const onPreset = (listener: EventListener<VisualizationEvent>) => 
  UnifiedEventBus.on('visualization', 'preset', listener);

export const onColor = (listener: EventListener<VisualizationEvent>) => 
  UnifiedEventBus.on('visualization', 'color', listener);

export const onBpm = (listener: EventListener<AutoMixEvent>) => 
  UnifiedEventBus.on('automix', 'bpm', listener);

export const onEnergy = (listener: EventListener<AutoMixEvent>) => 
  UnifiedEventBus.on('automix', 'energy', listener);

export const onMood = (listener: EventListener<LiquidMetalEvent>) => 
  UnifiedEventBus.on('liquidmetal', 'mood', listener);

// 便捷监听：播放与过渡
export const onPlayback = (listener: EventListener<VisualizationEvent>) =>
  UnifiedEventBus.on('visualization', 'playback', listener);

export const onTransition = (listener: EventListener<AutoMixEvent>) =>
  UnifiedEventBus.on('automix', 'transition', listener);

// 便捷发射：过渡
export const emitTransition = (payload: { 
  fromTrack?: string; 
  toTrack?: string; 
  parameters?: Record<string, unknown>; 
  action?: 'next' | 'prev' | 'crossfade';
  segment?: 'steady' | 'build' | 'fill' | 'drop';
}) =>
  UnifiedEventBus.emit({
    namespace: 'automix',
    type: 'transition',
    timestamp: Date.now(),
    data: payload
  });

export default UnifiedEventBus;
