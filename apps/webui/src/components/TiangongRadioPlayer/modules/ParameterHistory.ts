/**
 * 参数历史管理模块
 * 负责管理随机性控制参数的历史记录和版本控制
 * TASK-126: 模块化RandomnessControlParameterManager
 */

import type { RandomnessControlParameters } from '../randomnessControlParameters';

// 参数历史记录接口
export interface ParameterHistoryEntry {
  timestamp: number;
  parameters: Partial<RandomnessControlParameters>;
  reason: string;
  version: string;
  metadata?: {
    emotionState?: any;
    performanceMetrics?: any;
    userAction?: string;
  };
}

// 历史记录配置接口
export interface HistoryConfig {
  maxHistoryLength: number;
  enableCompression: boolean;
  enableMetadata: boolean;
  autoCleanup: boolean;
  cleanupInterval: number;
}

// 默认历史配置
export const DEFAULT_HISTORY_CONFIG: HistoryConfig = {
  maxHistoryLength: 100,
  enableCompression: true,
  enableMetadata: true,
  autoCleanup: true,
  cleanupInterval: 24 * 60 * 60 * 1000 // 24小时
};

// 历史记录统计接口
export interface HistoryStats {
  totalEntries: number;
  oldestEntry: number;
  newestEntry: number;
  averageEntrySize: number;
  compressionRatio: number;
  memoryUsage: number;
}

/**
 * 参数历史管理器类
 * 提供完整的参数历史管理功能
 */
export class ParameterHistory {
  private history: ParameterHistoryEntry[] = [];
  private config: HistoryConfig;
  private isInitialized: boolean = false;
  private cleanupTimer?: NodeJS.Timeout;
  private compressionCache: Map<string, string> = new Map();

  constructor(config?: Partial<HistoryConfig>) {
    this.config = { ...DEFAULT_HISTORY_CONFIG, ...config };
    this.setupAutoCleanup();
  }

  /**
   * 初始化历史管理器
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    try {
      // 加载历史记录（如果存在）
      this.loadHistoryFromStorage();
      
      // 启动自动清理
      if (this.config.autoCleanup) {
        this.startAutoCleanup();
      }
      
      this.isInitialized = true;
      console.log('📚 参数历史管理器初始化成功');
      
    } catch (error) {
      console.error('❌ 参数历史管理器初始化失败:', error);
    }
  }

  /**
   * 添加历史记录
   */
  public addEntry(
    parameters: Partial<RandomnessControlParameters>,
    reason: string,
    metadata?: any
  ): void {
    const entry: ParameterHistoryEntry = {
      timestamp: Date.now(),
      parameters,
      reason,
      version: this.generateVersion(),
      metadata: this.config.enableMetadata ? metadata : undefined
    };

    // 添加到历史记录
    this.history.push(entry);

    // 限制历史记录长度
    if (this.history.length > this.config.maxHistoryLength) {
      this.history.shift();
    }

    // 保存到存储
    this.saveHistoryToStorage();

    // 清理压缩缓存
    this.clearCompressionCache();
  }

  /**
   * 获取历史记录
   */
  public getHistory(
    filter?: {
      startTime?: number;
      endTime?: number;
      reason?: string;
      limit?: number;
    }
  ): ParameterHistoryEntry[] {
    let filteredHistory = [...this.history];

    // 时间过滤
    if (filter?.startTime) {
      filteredHistory = filteredHistory.filter(entry => entry.timestamp >= filter.startTime!);
    }
    if (filter?.endTime) {
      filteredHistory = filteredHistory.filter(entry => entry.timestamp <= filter.endTime!);
    }

    // 原因过滤
    if (filter?.reason) {
      filteredHistory = filteredHistory.filter(entry => 
        entry.reason.toLowerCase().includes(filter.reason!.toLowerCase())
      );
    }

    // 限制数量
    if (filter?.limit) {
      filteredHistory = filteredHistory.slice(-filter.limit);
    }

    return filteredHistory;
  }

  /**
   * 获取最新的历史记录
   */
  public getLatestEntry(): ParameterHistoryEntry | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  /**
   * 获取指定时间点的历史记录
   */
  public getEntryAtTime(timestamp: number): ParameterHistoryEntry | null {
    // 找到最接近指定时间的记录
    const closestEntry = this.history.reduce((closest, entry) => {
      const closestDiff = Math.abs(closest.timestamp - timestamp);
      const currentDiff = Math.abs(entry.timestamp - timestamp);
      return currentDiff < closestDiff ? entry : closest;
    });

    return closestEntry || null;
  }

  /**
   * 回滚到指定的历史记录
   */
  public rollbackToEntry(entryIndex: number): Partial<RandomnessControlParameters> | null {
    if (entryIndex < 0 || entryIndex >= this.history.length) {
      return null;
    }

    const targetEntry = this.history[entryIndex];
    
    // 添加回滚记录
    this.addEntry(
      targetEntry.parameters,
      `回滚到历史记录 ${entryIndex} (${new Date(targetEntry.timestamp).toLocaleString()})`,
      { rollbackFrom: entryIndex, originalReason: targetEntry.reason }
    );

    return targetEntry.parameters;
  }

  /**
   * 比较两个历史记录
   */
  public compareEntries(
    entry1Index: number,
    entry2Index: number
  ): {
    changedParameters: string[];
    unchangedParameters: string[];
    parameterDiffs: Record<string, { old: any; new: any }>;
  } {
    if (entry1Index < 0 || entry1Index >= this.history.length ||
        entry2Index < 0 || entry2Index >= this.history.length) {
      return { changedParameters: [], unchangedParameters: [], parameterDiffs: {} };
    }

    const entry1 = this.history[entry1Index];
    const entry2 = this.history[entry2Index];
    const changedParameters: string[] = [];
    const unchangedParameters: string[] = [];
    const parameterDiffs: Record<string, { old: any; new: any }> = {};

    // 比较所有参数
    Object.keys(entry1.parameters).forEach(param => {
      const oldValue = entry1.parameters[param as keyof RandomnessControlParameters];
      const newValue = entry2.parameters[param as keyof RandomnessControlParameters];

      if (oldValue !== newValue) {
        changedParameters.push(param);
        parameterDiffs[param] = { old: oldValue, new: newValue };
      } else {
        unchangedParameters.push(param);
      }
    });

    return { changedParameters, unchangedParameters, parameterDiffs };
  }

  /**
   * 获取历史统计信息
   */
  public getHistoryStats(): HistoryStats {
    if (this.history.length === 0) {
      return {
        totalEntries: 0,
        oldestEntry: 0,
        newestEntry: 0,
        averageEntrySize: 0,
        compressionRatio: 1.0,
        memoryUsage: 0
      };
    }

    const oldestEntry = Math.min(...this.history.map(entry => entry.timestamp));
    const newestEntry = Math.max(...this.history.map(entry => entry.timestamp));
    
    // 计算平均条目大小
    const totalSize = this.history.reduce((sum, entry) => 
      sum + JSON.stringify(entry).length, 0
    );
    const averageEntrySize = totalSize / this.history.length;

    // 计算压缩比
    const compressedSize = this.config.enableCompression ? 
      this.calculateCompressedSize() : totalSize;
    const compressionRatio = compressedSize / totalSize;

    // 估算内存使用
    const memoryUsage = this.estimateMemoryUsage();

    return {
      totalEntries: this.history.length,
      oldestEntry,
      newestEntry,
      averageEntrySize,
      compressionRatio,
      memoryUsage
    };
  }

  /**
   * 清理历史记录
   */
  public cleanupHistory(options?: {
    keepLast?: number;
    olderThan?: number;
    reason?: string;
  }): number {
    const initialLength = this.history.length;
    let removedCount = 0;

    if (options?.keepLast) {
      // 保留最后N条记录
      const toRemove = this.history.length - options.keepLast;
      if (toRemove > 0) {
        this.history.splice(0, toRemove);
        removedCount += toRemove;
      }
    }

    if (options?.olderThan) {
      // 删除指定时间之前的记录
      const cutoffTime = Date.now() - options.olderThan;
      this.history = this.history.filter(entry => entry.timestamp >= cutoffTime);
      removedCount += initialLength - this.history.length;
    }

    if (options?.reason) {
      // 删除指定原因的记录
      this.history = this.history.filter(entry => 
        !entry.reason.toLowerCase().includes(options.reason!.toLowerCase())
      );
      removedCount += initialLength - this.history.length;
    }

    // 保存到存储
    this.saveHistoryToStorage();

    console.log(`🧹 清理了 ${removedCount} 条历史记录`);
    return removedCount;
  }

  /**
   * 导出历史记录
   */
  public exportHistory(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportToCSV();
    } else {
      return JSON.stringify({
        history: this.history,
        config: this.config,
        stats: this.getHistoryStats(),
        exportTime: Date.now(),
        version: '1.0.0'
      }, null, 2);
    }
  }

  /**
   * 导入历史记录
   */
  public importHistory(historyData: string): void {
    try {
      const data = JSON.parse(historyData);
      
      if (data.history && Array.isArray(data.history)) {
        // 验证历史记录格式
        const validEntries = data.history.filter((entry: any) => 
          entry.timestamp && entry.parameters && entry.reason
        );

        // 合并历史记录
        this.history = [...this.history, ...validEntries];
        
        // 按时间排序
        this.history.sort((a, b) => a.timestamp - b.timestamp);
        
        // 限制长度
        if (this.history.length > this.config.maxHistoryLength) {
          this.history = this.history.slice(-this.config.maxHistoryLength);
        }

        // 保存到存储
        this.saveHistoryToStorage();
        
        console.log(`✅ 成功导入 ${validEntries.length} 条历史记录`);
      } else {
        throw new Error('无效的历史记录格式');
      }
      
    } catch (error) {
      console.error('❌ 历史记录导入失败:', error);
      throw error;
    }
  }

  /**
   * 设置自动清理
   */
  private setupAutoCleanup(): void {
    if (this.config.autoCleanup && this.config.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.autoCleanup();
      }, this.config.cleanupInterval);
    }
  }

  /**
   * 启动自动清理
   */
  private startAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.setupAutoCleanup();
  }

  /**
   * 自动清理
   */
  private autoCleanup(): void {
    const stats = this.getHistoryStats();
    
    // 如果记录数量超过限制，清理旧记录
    if (stats.totalEntries > this.config.maxHistoryLength) {
      const toRemove = stats.totalEntries - this.config.maxHistoryLength;
      this.history.splice(0, toRemove);
      console.log(`🧹 自动清理了 ${toRemove} 条旧记录`);
    }

    // 清理超过7天的记录
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const oldEntries = this.history.filter(entry => entry.timestamp < weekAgo);
    if (oldEntries.length > 0) {
      this.history = this.history.filter(entry => entry.timestamp >= weekAgo);
      console.log(`🧹 自动清理了 ${oldEntries.length} 条过期记录`);
    }

    // 保存到存储
    this.saveHistoryToStorage();
  }

  /**
   * 生成版本号
   */
  private generateVersion(): string {
    const now = new Date();
    return `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}-${now.getTime()}`;
  }

  /**
   * 计算压缩后的大小
   */
  private calculateCompressedSize(): number {
    // 简化的压缩大小计算
    return this.history.reduce((sum, entry) => {
      const key = JSON.stringify(entry.parameters);
      if (this.compressionCache.has(key)) {
        return sum + this.compressionCache.get(key)!.length;
      }
      
      const compressed = this.compressEntry(entry);
      this.compressionCache.set(key, compressed);
      return sum + compressed.length;
    }, 0);
  }

  /**
   * 压缩条目
   */
  private compressEntry(entry: ParameterHistoryEntry): string {
    // 简化的压缩算法
    return JSON.stringify(entry).replace(/\s+/g, '');
  }

  /**
   * 清理压缩缓存
   */
  private clearCompressionCache(): void {
    if (this.compressionCache.size > 100) {
      this.compressionCache.clear();
    }
  }

  /**
   * 估算内存使用
   */
  private estimateMemoryUsage(): number {
    // 简化的内存使用估算
    return this.history.reduce((sum, entry) => 
      sum + JSON.stringify(entry).length * 2, 0
    );
  }

  /**
   * 保存历史记录到存储
   */
  private saveHistoryToStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = this.config.enableCompression ? 
          this.compressHistory() : JSON.stringify(this.history);
        localStorage.setItem('parameterHistory', data);
      }
    } catch (error) {
      console.warn('⚠️ 无法保存历史记录到存储:', error);
    }
  }

  /**
   * 从存储加载历史记录
   */
  private loadHistoryFromStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem('parameterHistory');
        if (data) {
          this.history = this.config.enableCompression ? 
            this.decompressHistory(data) : JSON.parse(data);
        }
      }
    } catch (error) {
      console.warn('⚠️ 无法从存储加载历史记录:', error);
      this.history = [];
    }
  }

  /**
   * 压缩历史记录
   */
  private compressHistory(): string {
    return JSON.stringify(this.history).replace(/\s+/g, '');
  }

  /**
   * 解压历史记录
   */
  private decompressHistory(compressedData: string): ParameterHistoryEntry[] {
    try {
      return JSON.parse(compressedData);
    } catch {
      // 如果解压失败，尝试作为未压缩数据解析
      return JSON.parse(compressedData);
    }
  }

  /**
   * 导出为CSV格式
   */
  private exportToCSV(): string {
    if (this.history.length === 0) return '';

    const headers = ['时间戳', '原因', '版本', '参数变更'];
    const rows = this.history.map(entry => [
      new Date(entry.timestamp).toISOString(),
      entry.reason,
      entry.version,
      Object.keys(entry.parameters).join(', ')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * 销毁历史管理器
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.saveHistoryToStorage();
    this.history = [];
    this.isInitialized = false;
    
    console.log('🛑 参数历史管理器已销毁');
  }
}

// 创建默认历史管理器实例
export const parameterHistory = new ParameterHistory();
