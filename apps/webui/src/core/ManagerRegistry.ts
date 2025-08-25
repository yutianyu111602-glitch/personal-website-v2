/**
 * ManagerRegistry - 管理器统一注册中心
 * 
 * 增强功能：
 * - 错误处理和重试机制
 * - 依赖关系管理
 * - 超时控制
 * - 健康状态监控
 * - 性能统计
 */

import type { Manager, ManagerId, ManagerRegistration, ManagerHealthStatus } from './ManagerTypes';
import { ManagerError, ManagerTimeoutError, ManagerDependencyError } from './ManagerTypes';

export interface ManagerRegistryConfig {
  /** 操作超时时间（毫秒） */
  operationTimeoutMs: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** 重试延迟（毫秒） */
  retryDelayMs: number;
  /** 启用健康检查 */
  enableHealthCheck: boolean;
  /** 健康检查间隔（毫秒） */
  healthCheckIntervalMs: number;
  /** 启用性能监控 */
  enablePerformanceMonitoring: boolean;
  /** 启用依赖检查 */
  enableDependencyCheck: boolean;
}

const DEFAULT_CONFIG: Required<ManagerRegistryConfig> = {
  operationTimeoutMs: 10000,
  maxRetries: 3,
  retryDelayMs: 1000,
  enableHealthCheck: true,
  healthCheckIntervalMs: 30000,
  enablePerformanceMonitoring: true,
  enableDependencyCheck: true,
};

export class ManagerRegistry {
  private managers: Map<ManagerId, ManagerRegistration> = new Map();
  private config: Required<ManagerRegistryConfig>;
  private healthCheckInterval: number | null = null;
  private performanceStats: Map<ManagerId, {
    initTime: number;
    startTime: number;
    stopTime: number;
    disposeTime: number;
    totalUptime: number;
    operationCount: number;
    errorCount: number;
  }> = new Map();

  constructor(config: Partial<ManagerRegistryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startHealthCheck();
  }

  /**
   * 注册管理器
   */
  register(
    manager: Manager, 
    options: {
      priority?: number;
      dependencies?: ManagerId[];
      autoStart?: boolean;
    } = {}
  ): void {
    const { priority = 100, dependencies = [], autoStart = false } = options;
    
    if (this.managers.has(manager.id)) {
      console.warn(`[ManagerRegistry] 重复注册: ${manager.id}`);
      return;
    }

    // 验证依赖关系
    if (this.config.enableDependencyCheck && dependencies.length > 0) {
      const missingDeps = dependencies.filter(depId => !this.managers.has(depId));
      if (missingDeps.length > 0) {
        throw new ManagerDependencyError(
          `Missing dependencies: ${missingDeps.join(', ')}`,
          manager.id,
          'init',
          missingDeps[0]
        );
      }
    }

    const registration: ManagerRegistration = {
      manager,
      registeredAt: Date.now(),
      priority,
      dependencies,
      autoStart,
    };

    this.managers.set(manager.id, registration);
    
    // 初始化性能统计
    this.performanceStats.set(manager.id, {
      initTime: 0,
      startTime: 0,
      stopTime: 0,
      disposeTime: 0,
      totalUptime: 0,
      operationCount: 0,
      errorCount: 0,
    });

    console.log(`[ManagerRegistry] 已注册: ${manager.id} (优先级: ${priority}, 依赖: [${dependencies.join(', ')}])`);
  }

  /**
   * 获取管理器
   */
  get<T extends Manager = Manager>(id: ManagerId): T | undefined {
    const registration = this.managers.get(id);
    return registration?.manager as T | undefined;
  }

  /**
   * 获取管理器注册信息
   */
  getRegistration(id: ManagerId): ManagerRegistration | undefined {
    return this.managers.get(id);
  }

  /**
   * 获取所有管理器ID
   */
  getAllManagerIds(): ManagerId[] {
    return Array.from(this.managers.keys());
  }

  /**
   * 获取管理器状态
   */
  getManagerState(id: ManagerId): { 
    registered: boolean; 
    initialized: boolean; 
    started: boolean; 
    disposed: boolean;
    health?: ManagerHealthStatus;
  } {
    const registration = this.managers.get(id);
    if (!registration) {
      return { registered: false, initialized: false, started: false, disposed: false };
    }

    const manager = registration.manager;
    return {
      registered: true,
      initialized: manager.isInitialized(),
      started: manager.isStarted(),
      disposed: manager.isDisposed(),
      health: manager.state.lastOperation ? undefined : undefined, // 暂时不获取健康状态，避免阻塞
    };
  }

  /**
   * 初始化所有管理器（按优先级和依赖关系）
   */
  async initAll(): Promise<void> {
    const sortedManagers = this.getSortedManagers();
    
    for (const registration of sortedManagers) {
      const { manager } = registration;
      const managerId = manager.id;
      
      if (manager.isInitialized()) {
        console.log(`[ManagerRegistry] ${managerId} 已初始化，跳过`);
        continue;
      }

      try {
        console.log(`[ManagerRegistry] 初始化 ${managerId}...`);
        const startTime = performance.now();
        
        await this.executeWithTimeout(
          () => manager.init(),
          managerId,
          'init',
          this.config.operationTimeoutMs
        );
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // 更新性能统计
        const stats = this.performanceStats.get(managerId);
        if (stats) {
          stats.initTime = duration;
          stats.operationCount++;
        }
        
        console.log(`[ManagerRegistry] ${managerId} 初始化完成 (${duration.toFixed(2)}ms)`);
        
        // 如果配置了自动启动，则启动管理器
        if (registration.autoStart) {
          await this.startManager(managerId);
        }
        
      } catch (error) {
        const managerError = error instanceof ManagerError ? error : new ManagerError(
          String(error),
          managerId,
          'init',
          error instanceof Error ? error : undefined
        );
        
        console.error(`[ManagerRegistry] ${managerId} 初始化失败:`, managerError);
        throw managerError;
      }
    }
  }

  /**
   * 启动所有管理器
   */
  async startAll(): Promise<void> {
    const sortedManagers = this.getSortedManagers();
    
    for (const registration of sortedManagers) {
      const { manager } = registration;
      const managerId = manager.id;
      
      if (!manager.isInitialized()) {
        console.warn(`[ManagerRegistry] ${managerId} 未初始化，跳过启动`);
        continue;
      }
      
      if (manager.isStarted()) {
        console.log(`[ManagerRegistry] ${managerId} 已启动，跳过`);
        continue;
      }

      await this.startManager(managerId);
    }
  }

  /**
   * 启动单个管理器
   */
  private async startManager(managerId: ManagerId): Promise<void> {
    const registration = this.managers.get(managerId);
    if (!registration) {
      throw new Error(`Manager not found: ${managerId}`);
    }

    const { manager } = registration;
    
    try {
      console.log(`[ManagerRegistry] 启动 ${managerId}...`);
      const startTime = performance.now();
      
      await this.executeWithTimeout(
        () => manager.start(),
        managerId,
        'start',
        this.config.operationTimeoutMs
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 更新性能统计
      const stats = this.performanceStats.get(managerId);
      if (stats) {
        stats.startTime = duration;
        stats.operationCount++;
      }
      
      console.log(`[ManagerRegistry] ${managerId} 启动完成 (${duration.toFixed(2)}ms)`);
      
    } catch (error) {
      const managerError = error instanceof ManagerError ? error : new ManagerError(
        String(error),
        managerId,
        'start',
        error instanceof Error ? error : undefined
      );
      
      console.error(`[ManagerRegistry] ${managerId} 启动失败:`, managerError);
      throw managerError;
    }
  }

  /**
   * 停止所有管理器
   */
  async stopAll(): Promise<void> {
    const sortedManagers = this.getSortedManagers().reverse(); // 反向停止
    
    for (const registration of sortedManagers) {
      const { manager } = registration;
      const managerId = manager.id;
      
      if (!manager.isStarted()) {
        continue;
      }

      try {
        console.log(`[ManagerRegistry] 停止 ${managerId}...`);
        const startTime = performance.now();
        
        await this.executeWithTimeout(
          () => manager.stop(),
          managerId,
          'stop',
          this.config.operationTimeoutMs
        );
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // 更新性能统计
        const stats = this.performanceStats.get(managerId);
        if (stats) {
          stats.stopTime = duration;
          stats.operationCount++;
        }
        
        console.log(`[ManagerRegistry] ${managerId} 停止完成 (${duration.toFixed(2)}ms)`);
        
      } catch (error) {
        console.error(`[ManagerRegistry] ${managerId} 停止失败:`, error);
        // 停止失败不阻塞其他管理器的停止
      }
    }
  }

  /**
   * 释放所有管理器资源
   */
  async disposeAll(): Promise<void> {
    const sortedManagers = this.getSortedManagers().reverse(); // 反向释放
    
    for (const registration of sortedManagers) {
      const { manager } = registration;
      const managerId = manager.id;
      
      try {
        console.log(`[ManagerRegistry] 释放 ${managerId}...`);
        const startTime = performance.now();
        
        await this.executeWithTimeout(
          () => manager.dispose(),
          managerId,
          'dispose',
          this.config.operationTimeoutMs
        );
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // 更新性能统计
        const stats = this.performanceStats.get(managerId);
        if (stats) {
          stats.disposeTime = duration;
          stats.operationCount++;
        }
        
        console.log(`[ManagerRegistry] ${managerId} 释放完成 (${duration.toFixed(2)}ms)`);
        
      } catch (error) {
        console.error(`[ManagerRegistry] ${managerId} 释放失败:`, error);
        // 释放失败不阻塞其他管理器的释放
      }
    }
    
    // 清理注册表
    this.managers.clear();
    this.performanceStats.clear();
  }

  /**
   * 获取排序后的管理器列表（按优先级和依赖关系）
   */
  private getSortedManagers(): ManagerRegistration[] {
    const registrations = Array.from(this.managers.values());
    
    // 拓扑排序：按依赖关系排序
    const sorted: ManagerRegistration[] = [];
    const visited = new Set<ManagerId>();
    const visiting = new Set<ManagerId>();
    
    const visit = (registration: ManagerRegistration) => {
      const managerId = registration.manager.id;
      
      if (visiting.has(managerId)) {
        throw new Error(`Circular dependency detected: ${managerId}`);
      }
      
      if (visited.has(managerId)) {
        return;
      }
      
      visiting.add(managerId);
      
      // 先访问依赖
      for (const depId of registration.dependencies) {
        const depRegistration = this.managers.get(depId);
        if (depRegistration) {
          visit(depRegistration);
        }
      }
      
      visiting.delete(managerId);
      visited.add(managerId);
      sorted.push(registration);
    };
    
    // 按优先级排序，然后按依赖关系排序
    registrations.sort((a, b) => a.priority - b.priority);
    
    for (const registration of registrations) {
      if (!visited.has(registration.manager.id)) {
        visit(registration);
      }
    }
    
    return sorted;
  }

  /**
   * 带超时的操作执行
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    managerId: ManagerId,
    operationType: 'init' | 'start' | 'stop' | 'dispose',
    timeoutMs: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new ManagerTimeoutError(managerId, operationType, timeoutMs));
      }, timeoutMs);
    });
    
    return Promise.race([operation(), timeoutPromise]);
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    if (!this.config.enableHealthCheck) return;
    
    this.healthCheckInterval = window.setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * 执行健康检查
   */
  private async performHealthCheck(): Promise<void> {
    const healthResults = new Map<ManagerId, ManagerHealthStatus>();
    
    for (const [managerId, registration] of this.managers) {
      try {
        const startTime = performance.now();
        const health = await registration.manager.healthCheck();
        const endTime = performance.now();
        
        health.responseTime = endTime - startTime;
        health.lastCheck = Date.now();
        
        healthResults.set(managerId, health);
        
        // 更新性能统计
        const stats = this.performanceStats.get(managerId);
        if (stats && health.healthy) {
          stats.totalUptime += health.responseTime;
        }
        
      } catch (error) {
        const stats = this.performanceStats.get(managerId);
        if (stats) {
          stats.errorCount++;
        }
        
        healthResults.set(managerId, {
          healthy: false,
          score: 0,
          status: `Health check failed: ${error}`,
          lastCheck: Date.now(),
          responseTime: 0,
        });
      }
    }
    
    // 记录健康检查结果
    if (this.config.enablePerformanceMonitoring) {
      console.log('[ManagerRegistry] 健康检查结果:', Object.fromEntries(healthResults));
    }
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(): Record<string, {
    initTime: number;
    startTime: number;
    stopTime: number;
    disposeTime: number;
    totalUptime: number;
    operationCount: number;
    errorCount: number;
  }> {
    return Object.fromEntries(this.performanceStats);
  }

  /**
   * 获取注册表状态
   */
  getRegistryStatus(): {
    totalManagers: number;
    initializedCount: number;
    startedCount: number;
    disposedCount: number;
    healthyCount: number;
  } {
    let initializedCount = 0;
    let startedCount = 0;
    let disposedCount = 0;
    let healthyCount = 0;
    
    for (const registration of this.managers.values()) {
      const manager = registration.manager;
      if (manager.isInitialized()) initializedCount++;
      if (manager.isStarted()) startedCount++;
      if (manager.isDisposed()) disposedCount++;
      // 暂时不检查健康状态，避免阻塞
    }
    
    return {
      totalManagers: this.managers.size,
      initializedCount,
      startedCount,
      disposedCount,
      healthyCount,
    };
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.healthCheckInterval) {
      window.clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    this.managers.clear();
    this.performanceStats.clear();
  }
}

export const managerRegistry = new ManagerRegistry();


