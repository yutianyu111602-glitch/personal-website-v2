/**
 * 统一事件类型定义（unified.ts）
 *
 * 目标：为全局事件总线（UnifiedEventBus）提供集中、可复用、可演进的类型约束，
 * 避免在各处重复定义类型导致的不一致与难以维护。
 */

// 命名空间（按模块划分）
export type EventNamespace = 'visualization' | 'automix' | 'liquidmetal' | 'global' | 'radio' | 'random';

// 基础事件类型
export interface BaseEvent<TNamespace extends EventNamespace = EventNamespace, TType extends string = string, TData = unknown> {
  /** 事件命名空间（模块） */
  namespace: TNamespace;
  /** 事件类型（细分类别） */
  type: TType;
  /** 毫秒时间戳 */
  timestamp: number;
  /** 事件负载（结构由具体事件决定） */
  data?: TData;
}

// 可视化事件
export interface VisualizationEvent extends BaseEvent<'visualization', 'preset' | 'color' | 'playback' | 'effect', {
  preset?: string;
  colorScheme?: string;
  playbackState?: 'play' | 'pause' | 'stop';
  effect?: string;
  pipeline?: VisualizationPipeline;
}> {}

// 可视化管线接口
export interface VisualizationPipeline {
  id: string;
  name: string;
  nodes: VisualizationNode[];
  tags?: VisualizationTags;
  metadata?: Record<string, unknown>;
}

// 可视化节点接口
export interface VisualizationNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  parameters: Record<string, unknown>;
  tags?: VisualizationTags;
  weight?: number;
}

// 可视化标签接口
export interface VisualizationTags {
  energyBias?: number;
  valenceBias?: number;
  arousalBias?: number;
  style?: string;
  intensity?: number;
  motion?: number;
  contrast?: number;
}

// 混音/自动混音事件
export interface AutoMixEvent extends BaseEvent<'automix', 'bpm' | 'energy' | 'transition' | 'technique_recommend', {
  bpm?: number;
  energy?: number;
  fromTrack?: string;
  toTrack?: string;
  parameters?: Record<string, unknown>;
  technique?: string;
  hint?: {
    beats?: number;
    hintVersion?: string;
    duration?: number;
    crossfade?: number;
  };
  reason?: string[];
  from?: string;
  contextSnapshot?: {
    bpmFrom: number;
    bpmTo: number;
    keyFrom?: string;
    keyTo?: string;
    segment?: 'steady' | 'build' | 'fill' | 'drop';
    vocality: number;
    simpleHeadTail: boolean;
    dropoutRate: number;
    recentErrors: number;
    emotion: {
      energy: number;
      valence: number;
      arousal: number;
    };
  };
}> {}

// LiquidMetal 可视化体系事件
export interface LiquidMetalEvent extends BaseEvent<'liquidmetal', 'mood' | 'preset' | 'pipeline', {
  mood?: { energy: number; valence: number; arousal: number };
  preset?: string;
  pipeline?: VisualizationPipeline;
}> {}

// 全局事件（性能/错误/配置）
export interface GlobalEvent extends BaseEvent<'global', 'performance' | 'error' | 'config', {
  performance?: { fps: number; memory: number; cpu?: number };
  error?: { message: string; stack?: string; code?: string; context?: Record<string, unknown> };
  config?: {
    theme?: {
      accent: string;
      background: string;
      intensity: number;
      motion: number;
      contrast: number;
      warm?: number;
      cool?: number;
    };
    layout?: {
      focus?: {
        organizer?: { width: number; height: number };
        taskLogger?: { width: number };
      };
    };
    featureFlags?: {
      emotionCoreUnifiedLoop?: boolean;
      enableTechniqueBridge?: boolean;
      enableRandomAlgorithm?: boolean;
    };
    [key: string]: unknown;
  };
}> {}

// 电台事件（遥测/状态）
export interface RadioEvent extends BaseEvent<'radio', 'telemetry' | 'status' | 'playback', {
  dropoutRate?: number;
  recentErrors?: number;
  simpleHeadTail?: boolean;
  listeners?: number;
  avgBpm?: number;
  playbackState?: 'play' | 'pause' | 'stop';
  currentTrack?: {
    title: string;
    artist: string;
    bpm: number;
    keyCamelot?: string;
    duration: number;
  };
}> {}

// 随机性控制事件
export interface RandomEvent extends BaseEvent<'random', 'parameters_ready' | 'parameters_updated' | 'parameters_error' | 'parameters_optimized', {
  parameters?: Record<string, unknown>;
  validationStatus?: 'success' | 'failed';
  validationWarnings?: string[];
  updatedParameters?: Record<string, unknown>;
  reason?: string;
  allParameters?: Record<string, unknown>;
  error?: string;
  attemptedParameters?: Record<string, unknown>;
  optimizedParameters?: Record<string, unknown>;
  appliedStrategies?: string[];
  performanceImprovement?: number;
  warnings?: string[];
}> {}

// 扩展联合事件，便于日后按需扩充
export type UnifiedEvent = VisualizationEvent | AutoMixEvent | LiquidMetalEvent | GlobalEvent | RadioEvent | RandomEvent;

// 事件监听器与过滤器
export type EventListener<T extends UnifiedEvent = UnifiedEvent> = (event: T) => void;
export type EventFilter = (event: UnifiedEvent) => boolean;

// 事件验证器
export class EventValidator {
  /**
   * 验证事件的基本结构
   */
  static validateEvent(event: unknown): event is UnifiedEvent {
    if (!event || typeof event !== 'object') return false;
    
    const e = event as Record<string, unknown>;
    
    // 检查必需字段
    if (typeof e.namespace !== 'string' || typeof e.type !== 'string' || typeof e.timestamp !== 'number') {
      return false;
    }
    
    // 验证命名空间
    const validNamespaces: EventNamespace[] = ['visualization', 'automix', 'liquidmetal', 'global', 'radio', 'random'];
    if (!validNamespaces.includes(e.namespace as EventNamespace)) {
      return false;
    }
    
    // 验证时间戳
    if (e.timestamp < 0 || e.timestamp > Date.now() + 60000) { // 允许1分钟的未来时间
      return false;
    }
    
    return true;
  }
  
  /**
   * 验证特定类型的事件
   */
  static validateEventType<T extends UnifiedEvent>(
    event: unknown, 
    namespace: EventNamespace, 
    type: string
  ): event is T {
    if (!this.validateEvent(event)) return false;
    
    const e = event as UnifiedEvent;
    return e.namespace === namespace && e.type === type;
  }
  
  /**
   * 验证事件数据
   */
  static validateEventData(event: UnifiedEvent): boolean {
    try {
      // 根据命名空间和类型验证数据
      switch (event.namespace) {
        case 'global':
          if (event.type === 'config' && event.data?.config?.theme) {
            const theme = event.data.config.theme;
            return typeof theme.accent === 'string' && 
                   typeof theme.background === 'string' &&
                   typeof theme.intensity === 'number' &&
                   typeof theme.motion === 'number' &&
                   typeof theme.contrast === 'number';
          }
          break;
        case 'automix':
          if (event.type === 'bpm' && event.data?.bpm) {
            return typeof event.data.bpm === 'number' && 
                   event.data.bpm >= 0 && 
                   event.data.bpm <= 300;
          }
          if (event.type === 'energy' && event.data?.energy) {
            return typeof event.data.energy === 'number' && 
                   event.data.energy >= 0 && 
                   event.data.energy <= 1;
          }
          break;
        case 'liquidmetal':
          if (event.type === 'mood' && event.data?.mood) {
            const mood = event.data.mood;
            return typeof mood.energy === 'number' && 
                   typeof mood.valence === 'number' &&
                   typeof mood.arousal === 'number' &&
                   mood.energy >= 0 && mood.energy <= 1 &&
                   mood.valence >= -1 && mood.valence <= 1 &&
                   mood.arousal >= 0 && mood.arousal <= 1;
          }
          break;
      }
      return true;
    } catch {
      return false;
    }
  }
}

// 类型守卫函数
export const isVisualizationEvent = (event: UnifiedEvent): event is VisualizationEvent => 
  event.namespace === 'visualization';

export const isAutoMixEvent = (event: UnifiedEvent): event is AutoMixEvent => 
  event.namespace === 'automix';

export const isLiquidMetalEvent = (event: UnifiedEvent): event is LiquidMetalEvent => 
  event.namespace === 'liquidmetal';

export const isGlobalEvent = (event: UnifiedEvent): event is GlobalEvent => 
  event.namespace === 'global';

export const isRadioEvent = (event: UnifiedEvent): event is RadioEvent => 
  event.namespace === 'radio';


