/**
 * LocalBus兜底机制
 * 确保即使UnifiedEventBus不可用也能正常工作
 * 提供本地事件总线功能，支持事件订阅和广播
 * 包含性能优化：批量处理、防抖、性能监控
 */

export type Event = { 
  namespace: string; 
  type: string; 
  data?: any; 
  timestamp?: number 
};

type Callback = (e: Event) => void;

export default class LocalBus {
  private eventMap = new Map<string, Set<Callback>>();
  private isEnabled = true;
  
  // 🚀 性能优化：批量处理
  private batchQueue: Event[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private batchSize = 10;
  private batchDelay = 16; // 60fps
  
  // 🚀 性能优化：防抖
  private debounceMap = new Map<string, NodeJS.Timeout>();
  private debounceDelay = 100;
  
  // 📊 性能监控
  private performanceMetrics = {
    totalEvents: 0,
    batchEvents: 0,
    debouncedEvents: 0,
    averageLatency: 0,
    lastUpdate: Date.now()
  };

  /**
   * 订阅事件
   * @param namespace 事件命名空间
   * @param type 事件类型
   * @param callback 回调函数
   * @returns 取消订阅函数
   */
  on(namespace: string, type: string, callback: Callback): () => void {
    const key = `${namespace}:${type}`;
    
    if (!this.eventMap.has(key)) {
      this.eventMap.set(key, new Set());
    }
    
    this.eventMap.get(key)!.add(callback);
    
    // 返回取消订阅函数
    return () => {
      const callbacks = this.eventMap.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.eventMap.delete(key);
        }
      }
    };
  }

  /**
   * 广播事件（支持批量处理）
   * @param event 事件对象
   * @param options 选项
   */
  emit(event: Event, options: { batch?: boolean; debounce?: boolean } = {}): void {
    if (!this.isEnabled) return;
    
    const startTime = performance.now();
    
    if (options.batch) {
      // 批量处理模式
      this.batchQueue.push(event);
      this.performanceMetrics.batchEvents++;
      
      if (this.batchQueue.length >= this.batchSize) {
        this.flushBatch();
      } else if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.flushBatch(), this.batchDelay);
      }
    } else if (options.debounce) {
      // 防抖模式
      const key = `${event.namespace}:${event.type}`;
      if (this.debounceMap.has(key)) {
        clearTimeout(this.debounceMap.get(key)!);
      }
      
      this.debounceMap.set(key, setTimeout(() => {
        this.debounceMap.delete(key);
        this.emitImmediate(event);
      }, this.debounceDelay));
      
      this.performanceMetrics.debouncedEvents++;
    } else {
      // 立即处理模式
      this.emitImmediate(event);
    }
    
    // 更新性能指标
    this.performanceMetrics.totalEvents++;
    const latency = performance.now() - startTime;
    this.performanceMetrics.averageLatency = 
      (this.performanceMetrics.averageLatency * (this.performanceMetrics.totalEvents - 1) + latency) / 
      this.performanceMetrics.totalEvents;
    this.performanceMetrics.lastUpdate = Date.now();
  }

  /**
   * 立即广播事件
   * @param event 事件对象
   */
  private emitImmediate(event: Event): void {
    const key = `${event.namespace}:${event.type}`;
    const callbacks = this.eventMap.get(key);
    
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.warn('LocalBus callback error:', error);
        }
      });
    }
  }

  /**
   * 刷新批量队列
   */
  private flushBatch(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    if (this.batchQueue.length === 0) return;
    
    // 批量处理事件
    const events = [...this.batchQueue];
    this.batchQueue = [];
    
    events.forEach(event => {
      this.emitImmediate(event);
    });
    
    console.log(`🚀 LocalBus: 批量处理了 ${events.length} 个事件`);
  }

  /**
   * 广播BPM更新事件
   * @param bpm BPM值
   */
  emitBpm(bpm: number): void {
    this.emit({
      namespace: 'automix',
      type: 'bpm',
      data: { bpm },
      timestamp: Date.now()
    });
  }

  /**
   * 广播播放状态事件
   * @param state 播放状态
   */
  emitPlayback(state: 'play' | 'pause' | 'stop'): void {
    this.emit({
      namespace: 'automix',
      type: 'playback',
      data: { playbackState: state },
      timestamp: Date.now()
    });
  }

  /**
   * 广播预设切换事件
   * @param name 预设名称
   */
  emitPreset(name: string): void {
    this.emit({
      namespace: 'visualization',
      type: 'preset',
      data: { name },
      timestamp: Date.now()
    });
  }

  /**
   * 广播情绪变化事件
   * @param mood 情绪数据
   */
  emitMood(mood: { energy?: number; valence?: number; arousal?: number }): void {
    this.emit({
      namespace: 'automix',
      type: 'mood',
      data: { mood },
      timestamp: Date.now()
    });
  }

  /**
   * 广播切歌事件
   * @param action 切歌动作
   * @param durationMs 持续时间（毫秒）
   */
  emitTransition(action: 'next' | 'prev' | 'crossfade', durationMs?: number): void {
    this.emit({
      namespace: 'automix',
      type: 'transition',
      data: { action, durationMs },
      timestamp: Date.now()
    });
  }

  /**
   * 广播技术选择事件
   * @param technique 技术名称
   */
  emitTechniqueSelect(technique: string): void {
    this.emit({
      namespace: 'automix',
      type: 'technique_select',
      data: { technique },
      timestamp: Date.now()
    });
  }

  /**
   * 广播预设强制切换事件
   * @param name 预设名称
   */
  emitPresetForce(name: string): void {
    this.emit({
      namespace: 'visualization',
      type: 'preset_force',
      data: { name },
      timestamp: Date.now()
    });
  }

  /**
   * 启用/禁用事件总线
   * @param enabled 是否启用
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * 获取事件总线状态
   * @returns 状态信息
   */
  getStatus(): {
    enabled: boolean;
    eventCount: number;
    activeSubscriptions: number;
    performanceMetrics: typeof this.performanceMetrics;
  } {
    let totalSubscriptions = 0;
    this.eventMap.forEach(callbacks => {
      totalSubscriptions += callbacks.size;
    });

    return {
      enabled: this.isEnabled,
      eventCount: this.eventMap.size,
      activeSubscriptions: totalSubscriptions,
      performanceMetrics: { ...this.performanceMetrics }
    };
  }

  /**
   * 清空所有事件订阅
   */
  clear(): void {
    this.eventMap.clear();
  }

  /**
   * 获取所有活跃的事件类型
   * @returns 事件类型列表
   */
  getActiveEventTypes(): string[] {
    return Array.from(this.eventMap.keys());
  }

  /**
   * 设置批量处理参数
   * @param size 批量大小
   * @param delay 延迟时间（毫秒）
   */
  setBatchConfig(size: number, delay: number): void {
    this.batchSize = Math.max(1, size);
    this.batchDelay = Math.max(1, delay);
  }

  /**
   * 设置防抖延迟
   * @param delay 延迟时间（毫秒）
   */
  setDebounceDelay(delay: number): void {
    this.debounceDelay = Math.max(0, delay);
  }

  /**
   * 广播事件（批量模式）
   * @param event 事件对象
   */
  emitBatch(event: Event): void {
    this.emit(event, { batch: true });
  }

  /**
   * 广播事件（防抖模式）
   * @param event 事件对象
   */
  emitDebounced(event: Event): void {
    this.emit(event, { debounce: true });
  }
}

// 创建全局LocalBus实例
export const localBus = new LocalBus();

// 导出到全局，作为兜底机制
if (typeof window !== 'undefined') {
  (window as any).LocalBus = LocalBus;
  (window as any).localBus = localBus;
}
