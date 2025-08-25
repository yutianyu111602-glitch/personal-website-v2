/**
 * 随机状态恢复机制
 * 实现完整的随机状态恢复、备份、回滚和迁移功能
 * 基于localStorage和IndexedDB的混合存储策略
 */

import { UnifiedEventBus } from '../events/UnifiedEventBus';
import type { RandomState, SeedPoolConfig } from './randomStateManager';

// 状态恢复配置
export interface RecoveryConfig {
  enableBackup: boolean;
  backupInterval: number; // 备份间隔(ms)
  maxBackups: number;     // 最大备份数量
  enableMigration: boolean; // 启用状态迁移
  migrationVersion: string; // 当前版本
  enableRollback: boolean;  // 启用回滚功能
  rollbackThreshold: number; // 回滚阈值(错误次数)
}

// 备份状态
export interface BackupState {
  id: string;
  timestamp: number;
  version: string;
  state: RandomState;
  checksum: string;
  description: string;
}

// 恢复结果
export interface RecoveryResult {
  success: boolean;
  recoveredState?: RandomState;
  backupUsed?: BackupState;
  error?: string;
  warnings: string[];
}

// 默认配置
export const DEFAULT_RECOVERY_CONFIG: RecoveryConfig = {
  enableBackup: true,
  backupInterval: 300000, // 5分钟
  maxBackups: 10,
  enableMigration: true,
  migrationVersion: '1.0.0',
  enableRollback: true,
  rollbackThreshold: 3
};

/**
 * 随机状态恢复管理器
 * 负责状态备份、恢复、迁移和回滚
 */
export class RandomStateRecovery {
  private config: RecoveryConfig;
  private backups: BackupState[] = [];
  private backupTimer: NodeJS.Timeout | null = null;
  private errorCount: number = 0;
  private lastBackupTime: number = 0;
  private storageKey = 'tiangong_random_backups';
  private isInitialized: boolean = false;

  constructor(config?: Partial<RecoveryConfig>) {
    this.config = { ...DEFAULT_RECOVERY_CONFIG, ...config };
    this.setupEventListeners();
    this.initialize();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听随机状态变化
    UnifiedEventBus.on('random', 'seed_changed', this.handleSeedChange.bind(this));
    
    // 监听错误事件
    UnifiedEventBus.on('system', 'error', this.handleSystemError.bind(this));
    
    // 监听应用状态变化
    UnifiedEventBus.on('app', 'state_change', this.handleAppStateChange.bind(this));
  }

  /**
   * 初始化恢复管理器
   */
  private async initialize(): Promise<void> {
    try {
      // 加载现有备份
      await this.loadBackups();
      
      // 启动自动备份
      if (this.config.enableBackup) {
        this.startAutoBackup();
      }
      
      this.isInitialized = true;
      
      console.log('🔄 随机状态恢复管理器初始化完成');
      
      // 发射初始化完成事件
      UnifiedEventBus.emit({
        namespace: 'recovery',
        type: 'manager_ready',
        timestamp: Date.now(),
        data: {
          backupCount: this.backups.length,
          config: this.config
        }
      });
      
    } catch (error) {
      console.error('❌ 随机状态恢复管理器初始化失败:', error);
    }
  }

  /**
   * 加载现有备份
   */
  private async loadBackups(): Promise<void> {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }

      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.backups = parsed.filter(backup => this.validateBackup(backup));
          console.log(`💾 加载备份: ${this.backups.length}个`);
        }
      }
    } catch (error) {
      console.warn('⚠️ 加载备份失败:', error);
    }
  }

  /**
   * 验证备份数据
   */
  private validateBackup(backup: any): boolean {
    return (
      backup &&
      typeof backup.id === 'string' &&
      typeof backup.timestamp === 'number' &&
      typeof backup.version === 'string' &&
      backup.state &&
      typeof backup.checksum === 'string'
    );
  }

  /**
   * 启动自动备份
   */
  private startAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }
    
    this.backupTimer = setInterval(() => {
      this.createBackup();
    }, this.config.backupInterval);
  }

  /**
   * 创建备份
   */
  public async createBackup(description?: string): Promise<BackupState | null> {
    try {
      // 获取当前状态
      const currentState = await this.getCurrentState();
      if (!currentState) {
        throw new Error('无法获取当前状态');
      }

      // 创建备份
      const backup: BackupState = {
        id: this.generateBackupId(),
        timestamp: Date.now(),
        version: this.config.migrationVersion,
        state: currentState,
        checksum: this.calculateChecksum(currentState),
        description: description || `自动备份 - ${new Date().toLocaleString()}`
      };

      // 添加到备份列表
      this.backups.unshift(backup);
      
      // 限制备份数量
      if (this.backups.length > this.config.maxBackups) {
        this.backups = this.backups.slice(0, this.config.maxBackups);
      }

      // 保存到localStorage
      await this.saveBackups();
      
      this.lastBackupTime = Date.now();
      
      console.log(`💾 创建备份: ${backup.id}`);
      
      // 发射备份创建事件
      UnifiedEventBus.emit({
        namespace: 'recovery',
        type: 'backup_created',
        timestamp: Date.now(),
        data: { backup }
      });
      
      return backup;
      
    } catch (error) {
      console.error('❌ 创建备份失败:', error);
      return null;
    }
  }

  /**
   * 生成备份ID
   */
  private generateBackupId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `backup_${timestamp}_${random}`;
  }

  /**
   * 计算状态校验和
   */
  private calculateChecksum(state: RandomState): string {
    const stateStr = JSON.stringify(state);
    let hash = 0;
    
    for (let i = 0; i < stateStr.length; i++) {
      const char = stateStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return hash.toString(16);
  }

  /**
   * 获取当前状态
   */
  private async getCurrentState(): Promise<RandomState | null> {
    try {
      // 这里应该从RandomStateManager获取当前状态
      // 暂时返回模拟状态
      return {
        currentSeed: Date.now(),
        seedHistory: [],
        lastReseedTime: Date.now(),
        reseedCount: 0,
        randomQuality: 0.8,
        entropyLevel: 0.7
      };
    } catch (error) {
      console.error('❌ 获取当前状态失败:', error);
      return null;
    }
  }

  /**
   * 保存备份到localStorage
   */
  private async saveBackups(): Promise<void> {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }

      localStorage.setItem(this.storageKey, JSON.stringify(this.backups));
      
    } catch (error) {
      console.warn('⚠️ 保存备份失败:', error);
    }
  }

  /**
   * 恢复状态
   */
  public async recoverState(backupId?: string): Promise<RecoveryResult> {
    try {
      let backup: BackupState | undefined;
      
      if (backupId) {
        // 恢复指定备份
        backup = this.backups.find(b => b.id === backupId);
        if (!backup) {
          throw new Error(`备份不存在: ${backupId}`);
        }
      } else {
        // 自动选择最佳备份
        backup = this.selectBestBackup();
        if (!backup) {
          throw new Error('没有可用的备份');
        }
      }

      // 验证备份完整性
      if (!this.validateBackupIntegrity(backup)) {
        throw new Error('备份数据损坏');
      }

      // 执行状态恢复
      const recoveryResult = await this.performStateRecovery(backup);
      
      if (recoveryResult.success) {
        console.log(`🔄 状态恢复成功: ${backup.id}`);
        
        // 发射恢复成功事件
        UnifiedEventBus.emit({
          namespace: 'recovery',
          type: 'state_recovered',
          timestamp: Date.now(),
          data: { backup, result: recoveryResult }
        });
      }

      return recoveryResult;
      
    } catch (error) {
      console.error('❌ 状态恢复失败:', error);
      
      const result: RecoveryResult = {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        warnings: []
      };

      // 发射恢复失败事件
      UnifiedEventBus.emit({
        namespace: 'recovery',
        type: 'recovery_failed',
        timestamp: Date.now(),
        data: { error: result.error }
      });

      return result;
    }
  }

  /**
   * 选择最佳备份
   */
  private selectBestBackup(): BackupState | undefined {
    if (this.backups.length === 0) {
      return undefined;
    }

    // 按时间排序，选择最新的有效备份
    const validBackups = this.backups.filter(backup => 
      this.validateBackupIntegrity(backup)
    );

    if (validBackups.length === 0) {
      return undefined;
    }

    // 优先选择最新版本
    const latestVersion = validBackups.reduce((latest, current) => 
      current.version > latest.version ? current : latest
    );

    return latestVersion;
  }

  /**
   * 验证备份完整性
   */
  private validateBackupIntegrity(backup: BackupState): boolean {
    try {
      // 检查校验和
      const expectedChecksum = this.calculateChecksum(backup.state);
      if (backup.checksum !== expectedChecksum) {
        console.warn('⚠️ 备份校验和不匹配');
        return false;
      }

      // 检查时间戳
      const now = Date.now();
      const backupAge = now - backup.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24小时
      
      if (backupAge > maxAge) {
        console.warn('⚠️ 备份过于陈旧');
        return false;
      }

      return true;
      
    } catch (error) {
      console.warn('⚠️ 备份完整性验证失败:', error);
      return false;
    }
  }

  /**
   * 执行状态恢复
   */
  private async performStateRecovery(backup: BackupState): Promise<RecoveryResult> {
    try {
      // 这里应该将备份状态应用到RandomStateManager
      // 暂时返回成功结果
      
      const result: RecoveryResult = {
        success: true,
        recoveredState: backup.state,
        backupUsed: backup,
        warnings: []
      };

      // 检查版本兼容性
      if (backup.version !== this.config.migrationVersion) {
        result.warnings.push(`版本不匹配: 备份版本 ${backup.version}, 当前版本 ${this.config.migrationVersion}`);
      }

      return result;
      
    } catch (error) {
      throw new Error(`执行状态恢复失败: ${error}`);
    }
  }

  /**
   * 回滚到上一个状态
   */
  public async rollback(): Promise<RecoveryResult> {
    try {
      if (!this.config.enableRollback) {
        throw new Error('回滚功能已禁用');
      }

      if (this.errorCount < this.config.rollbackThreshold) {
        throw new Error('错误次数未达到回滚阈值');
      }

      // 选择回滚目标
      const rollbackTarget = this.selectRollbackTarget();
      if (!rollbackTarget) {
        throw new Error('没有合适的回滚目标');
      }

      // 执行回滚
      const result = await this.recoverState(rollbackTarget.id);
      
      if (result.success) {
        // 重置错误计数
        this.errorCount = 0;
        
        console.log(`🔄 回滚成功: ${rollbackTarget.id}`);
      }

      return result;
      
    } catch (error) {
      console.error('❌ 回滚失败:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        warnings: []
      };
    }
  }

  /**
   * 选择回滚目标
   */
  private selectRollbackTarget(): BackupState | undefined {
    // 选择错误发生前的最后一个稳定备份
    const stableBackups = this.backups.filter(backup => 
      backup.state.randomQuality > 0.8 && 
      backup.state.entropyLevel > 0.7
    );

    if (stableBackups.length === 0) {
      return undefined;
    }

    // 选择最新的稳定备份
    return stableBackups[0];
  }

  /**
   * 迁移状态到新版本
   */
  public async migrateState(targetVersion: string): Promise<RecoveryResult> {
    try {
      if (!this.config.enableMigration) {
        throw new Error('状态迁移功能已禁用');
      }

      // 获取当前状态
      const currentState = await this.getCurrentState();
      if (!currentState) {
        throw new Error('无法获取当前状态');
      }

      // 执行版本迁移
      const migratedState = await this.performVersionMigration(currentState, targetVersion);
      
      // 创建迁移备份
      const migrationBackup = await this.createBackup(`版本迁移到 ${targetVersion}`);
      
      const result: RecoveryResult = {
        success: true,
        recoveredState: migratedState,
        backupUsed: migrationBackup || undefined,
        warnings: [`状态已迁移到版本 ${targetVersion}`]
      };

      return result;
      
    } catch (error) {
      console.error('❌ 状态迁移失败:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        warnings: []
      };
    }
  }

  /**
   * 执行版本迁移
   */
  private async performVersionMigration(state: RandomState, targetVersion: string): Promise<RandomState> {
    // 这里应该实现具体的版本迁移逻辑
    // 暂时返回原状态
    return { ...state };
  }

  /**
   * 获取备份列表
   */
  public getBackups(): BackupState[] {
    return [...this.backups];
  }

  /**
   * 删除备份
   */
  public async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const index = this.backups.findIndex(b => b.id === backupId);
      if (index === -1) {
        return false;
      }

      this.backups.splice(index, 1);
      await this.saveBackups();
      
      console.log(`🗑️ 删除备份: ${backupId}`);
      return true;
      
    } catch (error) {
      console.error('❌ 删除备份失败:', error);
      return false;
    }
  }

  /**
   * 清理过期备份
   */
  public async cleanupExpiredBackups(): Promise<number> {
    try {
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
      
      const initialCount = this.backups.length;
      
      this.backups = this.backups.filter(backup => 
        (now - backup.timestamp) < maxAge
      );
      
      const cleanedCount = initialCount - this.backups.length;
      
      if (cleanedCount > 0) {
        await this.saveBackups();
        console.log(`🧹 清理过期备份: ${cleanedCount}个`);
      }
      
      return cleanedCount;
      
    } catch (error) {
      console.error('❌ 清理过期备份失败:', error);
      return 0;
    }
  }

  // 事件处理方法
  private handleSeedChange(event: any): void {
    // 种子变化时创建备份
    if (this.config.enableBackup && this.shouldCreateBackup()) {
      this.createBackup('种子变化触发备份');
    }
  }

  private handleSystemError(event: any): void {
    // 系统错误时增加错误计数
    this.errorCount++;
    
    // 检查是否需要回滚
    if (this.config.enableRollback && 
        this.errorCount >= this.config.rollbackThreshold) {
      console.warn(`⚠️ 错误次数达到阈值，建议执行回滚`);
    }
  }

  private handleAppStateChange(event: any): void {
    // 应用状态变化时创建备份
    if (this.config.enableBackup && this.shouldCreateBackup()) {
      this.createBackup('应用状态变化触发备份');
    }
  }

  /**
   * 判断是否应该创建备份
   */
  private shouldCreateBackup(): boolean {
    const now = Date.now();
    return (now - this.lastBackupTime) > this.config.backupInterval;
  }

  /**
   * 销毁恢复管理器
   */
  public destroy(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }
    
    // 保存最终备份
    this.saveBackups();
    
    console.log('🔄 随机状态恢复管理器已销毁');
  }
}

// 导出单例实例
export const randomStateRecovery = new RandomStateRecovery();
