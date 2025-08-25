/**
 * 管理器类型定义（核心）
 * 
 * 约定：所有系统级管理器（主题、遥测、性能、可视化编排等）
 * 必须实现统一生命周期接口，并通过 ManagerRegistry 进行注册与统一管理。
 */

export type ManagerId =
  | 'emotion-core'
  | 'dynamic-theme'
  | 'telemetry'
  | 'performance'
  | 'visualization'
  | 'auto-mix'
  | 'auto-dj'
  | (string & {});

/**
 * 管理器状态接口
 */
export interface ManagerState {
  /** 是否已初始化 */
  isInitialized: boolean;
  /** 是否已启动 */
  isStarted: boolean;
  /** 是否已释放资源 */
  isDisposed: boolean;
  /** 最后一次错误 */
  lastError?: Error;
  /** 最后一次操作信息 */
  lastOperation?: {
    type: 'init' | 'start' | 'stop' | 'dispose';
    timestamp: number;
    duration: number;
    success: boolean;
  };
  /** 启动时间 */
  startedAt?: number;
  /** 运行时长（毫秒） */
  uptime: number;
}

/**
 * 管理器生命周期接口
 */
export interface Manager {
  /** 管理器唯一标识 */
  readonly id: ManagerId;
  /** 管理器状态 */
  readonly state: ManagerState;
  
  /** 初始化（一次性，异步） */
  init(): Promise<void>;
  /** 启动（可多次启停，异步） */
  start(): Promise<void>;
  /** 停止（可多次启停，异步） */
  stop(): Promise<void>;
  /** 释放资源（一次性，异步） */
  dispose(): Promise<void>;
  
  /** 状态查询方法 */
  isInitialized(): boolean;
  isStarted(): boolean;
  isDisposed(): boolean;
  getLastError(): Error | undefined;
  getUptime(): number;
  
  /** 健康检查方法 */
  healthCheck(): Promise<ManagerHealthStatus>;
}

/**
 * 管理器健康状态
 */
export interface ManagerHealthStatus {
  /** 是否健康 */
  healthy: boolean;
  /** 健康分数（0-100） */
  score: number;
  /** 状态描述 */
  status: string;
  /** 详细信息 */
  details?: Record<string, unknown>;
  /** 最后检查时间 */
  lastCheck: number;
  /** 响应时间（毫秒） */
  responseTime: number;
}

/**
 * 管理器上下文（预留扩展）
 * - 可注入配置、事件总线、日志器等
 */
export interface ManagerContext {
  /** 配置对象 */
  config?: Record<string, unknown>;
  /** 事件总线 */
  eventBus?: unknown;
  /** 日志器 */
  logger?: unknown;
  /** 依赖注入容器 */
  container?: unknown;
}

/**
 * 管理器工厂接口
 */
export interface ManagerFactory<T extends Manager = Manager> {
  /** 创建管理器实例 */
  create(context?: ManagerContext): T;
  /** 管理器类型 */
  readonly type: string;
  /** 是否单例 */
  readonly singleton: boolean;
}

/**
 * 管理器注册信息
 */
export interface ManagerRegistration {
  /** 管理器实例 */
  manager: Manager;
  /** 注册时间 */
  registeredAt: number;
  /** 优先级（数字越小优先级越高） */
  priority: number;
  /** 依赖的管理器ID列表 */
  dependencies: ManagerId[];
  /** 是否自动启动 */
  autoStart: boolean;
}

/**
 * 管理器错误类型
 */
export class ManagerError extends Error {
  constructor(
    message: string,
    public readonly managerId: ManagerId,
    public readonly operation: 'init' | 'start' | 'stop' | 'dispose',
    public readonly cause?: Error
  ) {
    super(`[${managerId}] ${operation} failed: ${message}`);
    this.name = 'ManagerError';
    
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * 管理器超时错误
 */
export class ManagerTimeoutError extends ManagerError {
  constructor(
    managerId: ManagerId,
    operation: 'init' | 'start' | 'stop' | 'dispose',
    timeoutMs: number
  ) {
    super(`Operation timed out after ${timeoutMs}ms`, managerId, operation);
    this.name = 'ManagerTimeoutError';
  }
}

/**
 * 管理器依赖错误
 */
export class ManagerDependencyError extends ManagerError {
  constructor(
    message: string,
    managerId: ManagerId,
    operation: 'init' | 'start' | 'stop' | 'dispose',
    missingDependency: ManagerId
  ) {
    super(`Missing dependency: ${missingDependency} - ${message}`, managerId, operation);
    this.name = 'ManagerDependencyError';
  }
}


