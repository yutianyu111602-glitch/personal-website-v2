/**
 * 种子策略管理器模块
 * 负责管理各种种子生成策略
 * TASK-128: 模块化AdvancedSeedGenerator
 */

import type { RandomLevel } from '../multiLevelRandomSystem';

// 种子生成策略枚举
export enum SeedGenerationStrategy {
  LINEAR_CONGRUENTIAL = 'linear_congruential',     // 线性同余法
  XORSIFT = 'xorsift',                            // Xorshift算法
  PCG = 'pcg',                                    // PCG算法
  CHACHA20 = 'chacha20',                          // ChaCha20算法
  BLUM_BLUM_SHUB = 'blum_blum_shub',             // Blum-Blum-Shub算法
  MERSENNE_TWISTER = 'mersenne_twister',         // Mersenne Twister算法
  HYBRID = 'hybrid',                              // 混合策略
  ADAPTIVE = 'adaptive'                           // 自适应策略
}

// 策略配置接口
export interface StrategyConfig {
  strategy: SeedGenerationStrategy;
  seedLength: number;             // 种子长度(bits)
  maxAttempts: number;            // 最大尝试次数
  enableOptimization: boolean;    // 是否启用优化
  optimizationLevel: number;      // 优化级别 (1-5)
  
  // 策略特定参数
  strategyParams: {
    linearCongruential?: {
      multiplier: number;
      increment: number;
      modulus: number;
    };
    xorsift?: {
      shiftA: number;
      shiftB: number;
      shiftC: number;
    };
    pcg?: {
      multiplier: number;
      increment: number;
    };
    hybrid?: {
      primaryStrategy: SeedGenerationStrategy;
      secondaryStrategy: SeedGenerationStrategy;
      blendRatio: number;
    };
  };
}

// 默认配置
export const DEFAULT_STRATEGY_CONFIG: StrategyConfig = {
  strategy: SeedGenerationStrategy.HYBRID,
  seedLength: 32,
  maxAttempts: 100,
  enableOptimization: true,
  optimizationLevel: 3,
  
  strategyParams: {
    linearCongruential: {
      multiplier: 1664525,
      increment: 1013904223,
      modulus: 2 ** 32
    },
    xorsift: {
      shiftA: 13,
      shiftB: 17,
      shiftC: 5
    },
    pcg: {
      multiplier: 6364136223846793005,
      increment: 1442695040888963407
    },
    hybrid: {
      primaryStrategy: SeedGenerationStrategy.PCG,
      secondaryStrategy: SeedGenerationStrategy.XORSIFT,
      blendRatio: 0.7
    }
  }
};

// 策略性能指标接口
export interface StrategyPerformanceMetrics {
  strategy: SeedGenerationStrategy;
  averageGenerationTime: number;   // 平均生成时间(ms)
  successRate: number;             // 成功率 (0-1)
  averageQuality: number;          // 平均质量 (0-1)
  memoryUsage: number;             // 内存使用(KB)
  cpuUsage: number;                // CPU使用率 (0-1)
}

// 策略选择结果接口
export interface StrategySelectionResult {
  selectedStrategy: SeedGenerationStrategy;
  confidence: number;              // 置信度 (0-1)
  reasoning: string[];             // 选择原因
  alternatives: SeedGenerationStrategy[]; // 备选策略
}

/**
 * 种子策略管理器类
 * 提供完整的种子策略管理功能
 */
export class SeedStrategyManager {
  private config: StrategyConfig;
  private isInitialized: boolean = false;
  private strategyPerformance: Map<SeedGenerationStrategy, StrategyPerformanceMetrics> = new Map();
  private strategyHistory: Array<{
    timestamp: number;
    strategy: SeedGenerationStrategy;
    success: boolean;
    quality: number;
    generationTime: number;
  }> = [];
  private maxHistoryLength: number = 1000;

  constructor(config?: Partial<StrategyConfig>) {
    this.config = { ...DEFAULT_STRATEGY_CONFIG, ...config };
    this.initializeStrategyPerformance();
  }

  /**
   * 初始化策略性能记录
   */
  private initializeStrategyPerformance(): void {
    Object.values(SeedGenerationStrategy).forEach(strategy => {
      this.strategyPerformance.set(strategy, {
        strategy,
        averageGenerationTime: 0,
        successRate: 0,
        averageQuality: 0,
        memoryUsage: 0,
        cpuUsage: 0
      });
    });
  }

  /**
   * 初始化策略管理器
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    try {
      this.isInitialized = true;
      console.log('🎯 种子策略管理器初始化成功');
      
    } catch (error) {
      console.error('❌ 种子策略管理器初始化失败:', error);
    }
  }

  /**
   * 根据策略生成种子
   */
  public generateSeedByStrategy(strategy?: SeedGenerationStrategy): number {
    const selectedStrategy = strategy || this.config.strategy;
    
    switch (selectedStrategy) {
      case SeedGenerationStrategy.LINEAR_CONGRUENTIAL:
        return this.generateLinearCongruentialSeed();
      case SeedGenerationStrategy.XORSIFT:
        return this.generateXorsiftSeed();
      case SeedGenerationStrategy.PCG:
        return this.generatePCGSeed();
      case SeedGenerationStrategy.CHACHA20:
        return this.generateChaCha20Seed();
      case SeedGenerationStrategy.BLUM_BLUM_SHUB:
        return this.generateBlumBlumShubSeed();
      case SeedGenerationStrategy.MERSENNE_TWISTER:
        return this.generateMersenneTwisterSeed();
      case SeedGenerationStrategy.HYBRID:
        return this.generateHybridSeed();
      case SeedGenerationStrategy.ADAPTIVE:
        return this.generateAdaptiveSeed();
      default:
        return this.generateLinearCongruentialSeed();
    }
  }

  /**
   * 生成线性同余法种子
   */
  private generateLinearCongruentialSeed(): number {
    const params = this.config.strategyParams.linearCongruential;
    if (!params) return Math.floor(Math.random() * 2 ** 32);
    
    const { multiplier, increment, modulus } = params;
    const timestamp = Date.now();
    
    return (multiplier * timestamp + increment) % modulus;
  }

  /**
   * 生成Xorsift种子
   */
  private generateXorsiftSeed(): number {
    const params = this.config.strategyParams.xorsift;
    if (!params) return Math.floor(Math.random() * 2 ** 32);
    
    const { shiftA, shiftB, shiftC } = params;
    let x = Date.now();
    
    x ^= x << shiftA;
    x ^= x >> shiftB;
    x ^= x << shiftC;
    
    return x >>> 0; // 转换为无符号32位整数
  }

  /**
   * 生成PCG种子
   */
  private generatePCGSeed(): number {
    const params = this.config.strategyParams.pcg;
    if (!params) return Math.floor(Math.random() * 2 ** 32);
    
    const { multiplier, increment } = params;
    const timestamp = Date.now();
    
    let state = timestamp;
    state = state * multiplier + increment;
    
    // PCG输出函数
    const xorshifted = ((state >> 18) ^ state) >> 27;
    const rot = state >> 59;
    
    return ((xorshifted >> rot) | (xorshifted << ((-rot) & 31))) >>> 0;
  }

  /**
   * 生成ChaCha20种子
   */
  private generateChaCha20Seed(): number {
    // 简化的ChaCha20实现
    const key = new Uint8Array(32);
    const nonce = new Uint8Array(12);
    const timestamp = Date.now();
    
    // 使用时间戳填充key和nonce
    for (let i = 0; i < 8; i++) {
      key[i] = (timestamp >> (i * 8)) & 0xFF;
      nonce[i] = (timestamp >> (i * 8)) & 0xFF;
    }
    
    // 简化的ChaCha20轮函数
    let state = new Uint32Array(16);
    state[0] = 0x61707865; // "expa"
    state[1] = 0x3320646e; // "nd 3"
    state[2] = 0x79622d32; // "2-by"
    state[3] = 0x6b206574; // "te k"
    
    // 填充key和nonce
    for (let i = 0; i < 8; i++) {
      state[4 + i] = (key[i * 4] << 24) | (key[i * 4 + 1] << 16) | (key[i * 4 + 2] << 8) | key[i * 4 + 3];
    }
    for (let i = 0; i < 3; i++) {
      state[12 + i] = (nonce[i * 4] << 24) | (nonce[i * 4 + 1] << 16) | (nonce[i * 4 + 2] << 8) | nonce[i * 4 + 3];
    }
    
    // 简化的轮函数（只执行几轮）
    for (let round = 0; round < 4; round++) {
      this.chachaQuarterRound(state, 0, 4, 8, 12);
      this.chachaQuarterRound(state, 1, 5, 9, 13);
      this.chachaQuarterRound(state, 2, 6, 10, 14);
      this.chachaQuarterRound(state, 3, 7, 11, 15);
    }
    
    return state[0];
  }

  /**
   * ChaCha20四分之一轮函数
   */
  private chachaQuarterRound(state: Uint32Array, a: number, b: number, c: number, d: number): void {
    state[a] = (state[a] + state[b]) >>> 0;
    state[d] ^= state[a];
    state[d] = ((state[d] << 16) | (state[d] >> 16)) >>> 0;
    
    state[c] = (state[c] + state[d]) >>> 0;
    state[b] ^= state[c];
    state[b] = ((state[b] << 12) | (state[b] >> 20)) >>> 0;
    
    state[a] = (state[a] + state[b]) >>> 0;
    state[d] ^= state[a];
    state[d] = ((state[d] << 8) | (state[d] >> 24)) >>> 0;
    
    state[c] = (state[c] + state[d]) >>> 0;
    state[b] ^= state[c];
    state[b] = ((state[b] << 7) | (state[b] >> 25)) >>> 0;
  }

  /**
   * 生成Blum-Blum-Shub种子
   */
  private generateBlumBlumShubSeed(): number {
    // 简化的BBS实现
    const p = 11; // 小素数，实际应用中应使用大素数
    const q = 23;
    const n = p * q;
    
    let x = Date.now() % n;
    if (x === 0) x = 1;
    
    // 计算x^2 mod n
    x = (x * x) % n;
    
    return x;
  }

  /**
   * 生成Mersenne Twister种子
   */
  private generateMersenneTwisterSeed(): number {
    // 简化的MT实现
    const n = 624;
    const mt = new Array(n);
    
    // 初始化
    mt[0] = Date.now();
    for (let i = 1; i < n; i++) {
      mt[i] = (1812433253 * (mt[i - 1] ^ (mt[i - 1] >> 30)) + i) >>> 0;
    }
    
    // 生成随机数
    let y = mt[0];
    y ^= (y >> 11);
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= (y >> 18);
    
    return y;
  }

  /**
   * 生成混合策略种子
   */
  private generateHybridSeed(): number {
    const params = this.config.strategyParams.hybrid;
    if (!params) return this.generatePCGSeed();
    
    const { primaryStrategy, secondaryStrategy, blendRatio } = params;
    
    const primarySeed = this.generateSeedByStrategy(primaryStrategy);
    const secondarySeed = this.generateSeedByStrategy(secondaryStrategy);
    
    // 混合两个种子
    return Math.floor(primarySeed * blendRatio + secondarySeed * (1 - blendRatio));
  }

  /**
   * 生成自适应策略种子
   */
  private generateAdaptiveSeed(): number {
    // 根据性能指标选择最佳策略
    const bestStrategy = this.selectBestStrategy();
    return this.generateSeedByStrategy(bestStrategy);
  }

  /**
   * 选择最佳策略
   */
  public selectBestStrategy(): StrategySelectionResult {
    const strategies = Array.from(this.strategyPerformance.values());
    
    // 按综合性能排序
    strategies.sort((a, b) => {
      const scoreA = this.calculateStrategyScore(a);
      const scoreB = this.calculateStrategyScore(b);
      return scoreB - scoreA;
    });
    
    const bestStrategy = strategies[0];
    const alternatives = strategies.slice(1, 4).map(s => s.strategy);
    
    const confidence = Math.min(1, bestStrategy.successRate * bestStrategy.averageQuality);
    const reasoning = [
      `策略 ${bestStrategy.strategy} 具有最高成功率: ${(bestStrategy.successRate * 100).toFixed(1)}%`,
      `平均质量: ${(bestStrategy.averageQuality * 100).toFixed(1)}%`,
      `平均生成时间: ${bestStrategy.averageGenerationTime.toFixed(2)}ms`
    ];
    
    return {
      selectedStrategy: bestStrategy.strategy,
      confidence,
      reasoning,
      alternatives
    };
  }

  /**
   * 计算策略综合分数
   */
  private calculateStrategyScore(metrics: StrategyPerformanceMetrics): number {
    const qualityWeight = 0.4;
    const successWeight = 0.3;
    const timeWeight = 0.2;
    const resourceWeight = 0.1;
    
    const qualityScore = metrics.averageQuality;
    const successScore = metrics.successRate;
    const timeScore = Math.max(0, 1 - (metrics.averageGenerationTime / 1000)); // 标准化到1秒
    const resourceScore = Math.max(0, 1 - (metrics.memoryUsage / 1024)); // 标准化到1MB
    
    return qualityScore * qualityWeight +
           successScore * successWeight +
           timeScore * timeWeight +
           resourceScore * resourceWeight;
  }

  /**
   * 记录策略性能
   */
  public recordStrategyPerformance(
    strategy: SeedGenerationStrategy,
    success: boolean,
    quality: number,
    generationTime: number
  ): void {
    // 更新历史记录
    this.strategyHistory.push({
      timestamp: Date.now(),
      strategy,
      success,
      quality,
      generationTime
    });
    
    // 限制历史记录长度
    if (this.strategyHistory.length > this.maxHistoryLength) {
      this.strategyHistory.shift();
    }
    
    // 更新性能指标
    this.updateStrategyPerformance(strategy, success, quality, generationTime);
  }

  /**
   * 更新策略性能指标
   */
  private updateStrategyPerformance(
    strategy: SeedGenerationStrategy,
    success: boolean,
    quality: number,
    generationTime: number
  ): void {
    const metrics = this.strategyPerformance.get(strategy);
    if (!metrics) return;
    
    // 计算新的平均值
    const strategyHistory = this.strategyHistory.filter(h => h.strategy === strategy);
    const recentHistory = strategyHistory.slice(-100); // 最近100次
    
    if (recentHistory.length > 0) {
      metrics.averageGenerationTime = recentHistory.reduce((sum, h) => sum + h.generationTime, 0) / recentHistory.length;
      metrics.successRate = recentHistory.filter(h => h.success).length / recentHistory.length;
      metrics.averageQuality = recentHistory.reduce((sum, h) => sum + h.quality, 0) / recentHistory.length;
    }
    
    // 估算资源使用
    metrics.memoryUsage = this.estimateMemoryUsage(strategy);
    metrics.cpuUsage = this.estimateCpuUsage(strategy);
  }

  /**
   * 估算内存使用
   */
  private estimateMemoryUsage(strategy: SeedGenerationStrategy): number {
    const baseMemory = 10; // 基础内存使用 (KB)
    
    switch (strategy) {
      case SeedGenerationStrategy.MERSENNE_TWISTER:
        return baseMemory + 2.5; // 需要存储状态数组
      case SeedGenerationStrategy.CHACHA20:
        return baseMemory + 1.0; // 需要存储密钥和nonce
      case SeedGenerationStrategy.BLUM_BLUM_SHUB:
        return baseMemory + 0.5; // 需要存储素数
      default:
        return baseMemory;
    }
  }

  /**
   * 估算CPU使用
   */
  private estimateCpuUsage(strategy: SeedGenerationStrategy): number {
    const baseCpu = 0.1; // 基础CPU使用率
    
    switch (strategy) {
      case SeedGenerationStrategy.CHACHA20:
        return baseCpu + 0.3; // 计算密集型
      case SeedGenerationStrategy.MERSENNE_TWISTER:
        return baseCpu + 0.2; // 中等复杂度
      case SeedGenerationStrategy.BLUM_BLUM_SHUB:
        return baseCpu + 0.4; // 模幂运算
      default:
        return baseCpu;
    }
  }

  /**
   * 获取策略性能统计
   */
  public getStrategyPerformanceStats(): StrategyPerformanceMetrics[] {
    return Array.from(this.strategyPerformance.values());
  }

  /**
   * 获取策略历史
   */
  public getStrategyHistory(): Array<{
    timestamp: number;
    strategy: SeedGenerationStrategy;
    success: boolean;
    quality: number;
    generationTime: number;
  }> {
    return [...this.strategyHistory];
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<StrategyConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔄 种子策略配置已更新');
  }

  /**
   * 获取配置
   */
  public getConfig(): StrategyConfig {
    return { ...this.config };
  }

  /**
   * 销毁策略管理器
   */
  public destroy(): void {
    this.strategyPerformance.clear();
    this.strategyHistory = [];
    this.isInitialized = false;
    
    console.log('🛑 种子策略管理器已销毁');
  }
}
