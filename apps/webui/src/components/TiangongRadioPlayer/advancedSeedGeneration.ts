/**
 * 高级种子生成算法系统
 * 实现多种种子生成策略和优化算法
 * TASK-124: 优化种子生成算法
 */

import { UnifiedEventBus } from '../events/UnifiedEventBus';
import { multiLevelRandomSystem, RandomLevel } from './multiLevelRandomSystem';
import { randomnessControlParameterManager } from './randomnessControlParameters';

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

// 种子质量评估指标
export interface SeedQualityMetrics {
  entropy: number;                // 熵值 (0-1)
  distribution: number;           // 分布均匀性 (0-1)
  correlation: number;            // 相关性 (0-1)
  period: number;                 // 周期长度
  bias: number;                   // 偏置 (0-1)
  overall: number;                // 综合评分 (0-1)
}

// 种子生成配置
export interface SeedGenerationConfig {
  strategy: SeedGenerationStrategy;
  seedLength: number;             // 种子长度(bits)
  qualityThreshold: number;       // 质量阈值 (0-1)
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

// 种子状态接口
export interface SeedState {
  seed: number;
  quality: SeedQualityMetrics;
  generationTime: number;
  strategy: SeedGenerationStrategy;
  metadata: {
    source: string;
    timestamp: number;
    version: string;
  };
}

// 默认配置
export const DEFAULT_SEED_GENERATION_CONFIG: SeedGenerationConfig = {
  strategy: SeedGenerationStrategy.HYBRID,
  seedLength: 32,
  qualityThreshold: 0.8,
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

/**
 * 高级种子生成器
 * 实现多种种子生成策略和质量评估
 */
export class AdvancedSeedGenerator {
  private config: SeedGenerationConfig;
  private isInitialized: boolean = false;
  private seedHistory: SeedState[] = [];
  private maxHistoryLength: number = 1000;
  private currentSeed: number = 0;
  private qualityCache: Map<number, SeedQualityMetrics> = new Map();

  constructor(config?: Partial<SeedGenerationConfig>) {
    this.config = { ...DEFAULT_SEED_GENERATION_CONFIG, ...config };
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听多层级随机系统事件
    UnifiedEventBus.on('random', 'multi_level_ready', this.handleMultiLevelReady.bind(this));
    UnifiedEventBus.on('random', 'level_updated', this.handleLevelUpdated.bind(this));
    
    // 监听参数更新事件
    UnifiedEventBus.on('random', 'parameters_updated', this.handleParametersUpdated.bind(this));
  }

  /**
   * 初始化种子生成器
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    try {
      // 生成初始种子
      this.currentSeed = this.generateSeed();
      
      this.isInitialized = true;
      console.log('🌱 高级种子生成器初始化成功');
      
      // 发射初始化完成事件
      UnifiedEventBus.emit({
        namespace: 'random',
        type: 'seed_generator_ready',
        timestamp: Date.now(),
        data: {
          initialSeed: this.currentSeed,
          strategy: this.config.strategy
        }
      });
      
    } catch (error) {
      console.error('❌ 高级种子生成器初始化失败:', error);
    }
  }

  /**
   * 生成新种子
   */
  public generateSeed(): number {
    let seed: number;
    let quality: SeedQualityMetrics;
    let attempts = 0;
    
    do {
      seed = this.generateSeedByStrategy();
      quality = this.evaluateSeedQuality(seed);
      attempts++;
      
      if (attempts >= this.config.maxAttempts) {
        console.warn('⚠️ 达到最大尝试次数，使用当前最佳种子');
        break;
      }
    } while (quality.overall < this.config.qualityThreshold);
    
    // 创建种子状态
    const seedState: SeedState = {
      seed,
      quality,
      generationTime: performance.now(),
      strategy: this.config.strategy,
      metadata: {
        source: 'advanced_generator',
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
    
    // 添加到历史记录
    this.seedHistory.push(seedState);
    if (this.seedHistory.length > this.maxHistoryLength) {
      this.seedHistory.shift();
    }
    
    // 缓存质量评估结果
    this.qualityCache.set(seed, quality);
    
    // 更新当前种子
    this.currentSeed = seed;
    
    // 发射种子生成事件
    UnifiedEventBus.emit({
      namespace: 'random',
      type: 'seed_generated',
      timestamp: Date.now(),
      data: {
        seed,
        quality,
        strategy: this.config.strategy,
        attempts
      }
    });
    
    return seed;
  }

  /**
   * 根据策略生成种子
   */
  private generateSeedByStrategy(): number {
    switch (this.config.strategy) {
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
        return this.generateHybridSeed();
    }
  }

  /**
   * 线性同余法种子生成
   */
  private generateLinearCongruentialSeed(): number {
    const { multiplier, increment, modulus } = this.config.strategyParams.linearCongruential!;
    const timestamp = Date.now();
    
    return (multiplier * timestamp + increment) % modulus;
  }

  /**
   * Xorshift种子生成
   */
  private generateXorsiftSeed(): number {
    const { shiftA, shiftB, shiftC } = this.config.strategyParams.xorsift!;
    let seed = Date.now();
    
    seed ^= seed << shiftA;
    seed ^= seed >> shiftB;
    seed ^= seed << shiftC;
    
    return seed >>> 0; // 转换为无符号32位整数
  }

  /**
   * PCG种子生成
   */
  private generatePCGSeed(): number {
    const { multiplier, increment } = this.config.strategyParams.pcg!;
    const timestamp = Date.now();
    
    let state = timestamp;
    state = state * multiplier + increment;
    
    // PCG输出函数
    const xorshifted = ((state >> 18) ^ state) >>> 27;
    const rot = state >> 59;
    
    return ((xorshifted >> rot) | (xorshifted << ((-rot) & 31))) >>> 0;
  }

  /**
   * ChaCha20种子生成
   */
  private generateChaCha20Seed(): number {
    // 简化的ChaCha20实现
    const key = new Uint8Array(32);
    const nonce = new Uint8Array(12);
    const timestamp = Date.now();
    
    // 填充密钥和nonce
    for (let i = 0; i < 32; i++) {
      key[i] = (timestamp >> (i % 32)) & 0xFF;
    }
    for (let i = 0; i < 12; i++) {
      nonce[i] = (timestamp >> (i % 24)) & 0xFF;
    }
    
    // 简化的ChaCha20轮函数
    let state = new Uint32Array(16);
    state[0] = 0x61707865; // "expa"
    state[1] = 0x3320646e; // "nd 3"
    state[2] = 0x79622d32; // "2-by"
    state[3] = 0x6b206574; // "te k"
    
    // 复制密钥和nonce
    for (let i = 0; i < 8; i++) {
      state[4 + i] = (key[i * 4] << 24) | (key[i * 4 + 1] << 16) | (key[i * 4 + 2] << 8) | key[i * 4 + 3];
    }
    for (let i = 0; i < 3; i++) {
      state[12 + i] = (nonce[i * 4] << 24) | (nonce[i * 4 + 1] << 16) | (nonce[i * 4 + 2] << 8) | nonce[i * 4 + 3];
    }
    
    // 应用ChaCha20轮函数（简化版）
    for (let round = 0; round < 10; round++) {
      this.chacha20QuarterRound(state, 0, 4, 8, 12);
      this.chacha20QuarterRound(state, 1, 5, 9, 13);
      this.chacha20QuarterRound(state, 2, 6, 10, 14);
      this.chacha20QuarterRound(state, 3, 7, 11, 15);
      this.chacha20QuarterRound(state, 0, 5, 10, 15);
      this.chacha20QuarterRound(state, 1, 6, 11, 12);
      this.chacha20QuarterRound(state, 2, 7, 8, 13);
      this.chacha20QuarterRound(state, 3, 4, 9, 14);
    }
    
    return state[0] ^ state[1] ^ state[2] ^ state[3];
  }

  /**
   * ChaCha20四分之一轮函数
   */
  private chacha20QuarterRound(state: Uint32Array, a: number, b: number, c: number, d: number): void {
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
   * Blum-Blum-Shub种子生成
   */
  private generateBlumBlumShubSeed(): number {
    // 简化的BBS实现
    const p = 11; // 小素数，实际应用中应使用大素数
    const q = 23;
    const n = p * q;
    
    let seed = Date.now() % n;
    let result = 0;
    
    // 生成32位种子
    for (let i = 0; i < 32; i++) {
      seed = (seed * seed) % n;
      result = (result << 1) | (seed & 1);
    }
    
    return result >>> 0;
  }

  /**
   * Mersenne Twister种子生成
   */
  private generateMersenneTwisterSeed(): number {
    // 简化的MT种子生成
    const timestamp = Date.now();
    const seed = timestamp & 0xFFFFFFFF;
    
    // 简单的MT初始化
    let mt = new Array(624);
    mt[0] = seed;
    
    for (let i = 1; i < 624; i++) {
      mt[i] = (1812433253 * (mt[i - 1] ^ (mt[i - 1] >> 30)) + i) >>> 0;
    }
    
    return mt[Math.floor(Math.random() * 624)];
  }

  /**
   * 混合策略种子生成
   */
  private generateHybridSeed(): number {
    const { primaryStrategy, secondaryStrategy, blendRatio } = this.config.strategyParams.hybrid!;
    
    // 临时切换策略
    const originalStrategy = this.config.strategy;
    
    this.config.strategy = primaryStrategy;
    const primarySeed = this.generateSeedByStrategy();
    
    this.config.strategy = secondaryStrategy;
    const secondarySeed = this.generateSeedByStrategy();
    
    // 恢复原策略
    this.config.strategy = originalStrategy;
    
    // 混合种子
    return Math.floor(primarySeed * blendRatio + secondarySeed * (1 - blendRatio));
  }

  /**
   * 自适应策略种子生成
   */
  private generateAdaptiveSeed(): number {
    // 根据当前系统状态选择最佳策略
    const levelStates = multiLevelRandomSystem?.getLevelStates();
    const parameterSummary = randomnessControlParameterManager?.getParameterSummary();
    
    if (!levelStates || !parameterSummary) {
      return this.generateHybridSeed();
    }
    
    // 计算系统复杂度
    const complexity = this.calculateSystemComplexity(levelStates, parameterSummary);
    
    // 根据复杂度选择策略
    if (complexity > 0.8) {
      this.config.strategy = SeedGenerationStrategy.CHACHA20;
    } else if (complexity > 0.6) {
      this.config.strategy = SeedGenerationStrategy.PCG;
    } else if (complexity > 0.4) {
      this.config.strategy = SeedGenerationStrategy.XORSIFT;
    } else {
      this.config.strategy = SeedGenerationStrategy.LINEAR_CONGRUENTIAL;
    }
    
    return this.generateSeedByStrategy();
  }

  /**
   * 计算系统复杂度
   */
  private calculateSystemComplexity(levelStates: any, parameterSummary: any): number {
    let complexity = 0;
    
    // 基于活跃层级数量
    const activeLevels = Object.values(levelStates).filter((state: any) => state.isActive).length;
    complexity += (activeLevels / 6) * 0.3;
    
    // 基于参数数量
    complexity += Math.min(parameterSummary.totalParameters / 50, 1) * 0.2;
    
    // 基于混沌因子
    complexity += parameterSummary.chaosFactor * 0.3;
    
    // 基于性能因子
    complexity += (1 - parameterSummary.performanceFactor) * 0.2;
    
    return Math.min(1, complexity);
  }

  /**
   * 评估种子质量
   */
  private evaluateSeedQuality(seed: number): SeedQualityMetrics {
    // 检查缓存
    if (this.qualityCache.has(seed)) {
      return this.qualityCache.get(seed)!;
    }
    
    const entropy = this.calculateEntropy(seed);
    const distribution = this.calculateDistribution(seed);
    const correlation = this.calculateCorrelation(seed);
    const period = this.calculatePeriod(seed);
    const bias = this.calculateBias(seed);
    
    const overall = (entropy + distribution + (1 - correlation) + Math.min(period / 1000, 1) + (1 - bias)) / 5;
    
    const metrics: SeedQualityMetrics = {
      entropy,
      distribution,
      correlation,
      period,
      bias,
      overall
    };
    
    return metrics;
  }

  /**
   * 计算熵值
   */
  private calculateEntropy(seed: number): number {
    // 计算种子中1的位数
    let ones = 0;
    let temp = seed;
    
    for (let i = 0; i < 32; i++) {
      if (temp & 1) ones++;
      temp >>= 1;
    }
    
    const p = ones / 32;
    const q = 1 - p;
    
    if (p === 0 || q === 0) return 0;
    
    return -(p * Math.log2(p) + q * Math.log2(q));
  }

  /**
   * 计算分布均匀性
   */
  private calculateDistribution(seed: number): number {
    // 将种子分成8个4位段，检查分布
    const segments = [];
    for (let i = 0; i < 8; i++) {
      segments.push((seed >> (i * 4)) & 0xF);
    }
    
    // 计算方差
    const mean = segments.reduce((sum, val) => sum + val, 0) / 8;
    const variance = segments.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / 8;
    
    // 方差越小，分布越均匀
    return Math.max(0, 1 - variance / 64);
  }

  /**
   * 计算相关性
   */
  private calculateCorrelation(seed: number): number {
    // 计算相邻位之间的相关性
    let correlations = 0;
    let totalPairs = 0;
    
    for (let i = 0; i < 31; i++) {
      const bit1 = (seed >> i) & 1;
      const bit2 = (seed >> (i + 1)) & 1;
      
      if (bit1 === bit2) correlations++;
      totalPairs++;
    }
    
    return correlations / totalPairs;
  }

  /**
   * 计算周期长度
   */
  private calculatePeriod(seed: number): number {
    // 简化的周期计算
    let period = 1;
    let current = seed;
    
    for (let i = 0; i < 1000; i++) {
      current = this.nextPseudoRandom(current);
      if (current === seed) {
        period = i + 1;
        break;
      }
    }
    
    return period;
  }

  /**
   * 下一个伪随机数
   */
  private nextPseudoRandom(current: number): number {
    return (current * 1103515245 + 12345) >>> 0;
  }

  /**
   * 计算偏置
   */
  private calculateBias(seed: number): number {
    // 计算种子中1和0的偏置
    let ones = 0;
    let temp = seed;
    
    for (let i = 0; i < 32; i++) {
      if (temp & 1) ones++;
      temp >>= 1;
    }
    
    const bias = Math.abs(ones - 16) / 16;
    return bias;
  }

  /**
   * 获取当前种子
   */
  public getCurrentSeed(): number {
    return this.currentSeed;
  }

  /**
   * 获取种子历史
   */
  public getSeedHistory(): SeedState[] {
    return [...this.seedHistory];
  }

  /**
   * 获取种子质量
   */
  public getSeedQuality(seed?: number): SeedQualityMetrics | null {
    const targetSeed = seed || this.currentSeed;
    return this.qualityCache.get(targetSeed) || null;
  }

  /**
   * 优化种子生成策略
   */
  public optimizeStrategy(): void {
    if (!this.config.enableOptimization) return;
    
    const optimizationLevel = this.config.optimizationLevel;
    
    // 根据优化级别调整参数
    switch (optimizationLevel) {
      case 1:
        this.config.qualityThreshold = Math.max(0.6, this.config.qualityThreshold - 0.1);
        break;
      case 2:
        this.config.qualityThreshold = Math.max(0.7, this.config.qualityThreshold - 0.05);
        break;
      case 3:
        // 保持当前设置
        break;
      case 4:
        this.config.qualityThreshold = Math.min(0.95, this.config.qualityThreshold + 0.05);
        break;
      case 5:
        this.config.qualityThreshold = Math.min(0.98, this.config.qualityThreshold + 0.1);
        break;
    }
    
    console.log(`⚡ 种子生成策略已优化到级别 ${optimizationLevel}`);
  }

  /**
   * 事件处理器
   */
  private handleMultiLevelReady(event: any): void {
    // 多层级系统就绪时生成新种子
    this.generateSeed();
  }

  private handleLevelUpdated(event: any): void {
    // 层级更新时检查是否需要生成新种子
    const { level, randomness } = event.data;
    
    // 如果随机性变化很大，考虑生成新种子
    if (Math.abs(randomness - 0.5) > 0.4) {
      this.generateSeed();
    }
  }

  private handleParametersUpdated(event: any): void {
    // 参数更新时优化策略
    this.optimizeStrategy();
  }

  /**
   * 导出配置
   */
  public exportConfiguration(): string {
    return JSON.stringify({
      config: this.config,
      currentSeed: this.currentSeed,
      seedHistoryCount: this.seedHistory.length,
      timestamp: Date.now(),
      version: '1.0.0'
    }, null, 2);
  }

  /**
   * 导入配置
   */
  public importConfiguration(configString: string): void {
    try {
      const config = JSON.parse(configString);
      
      if (config.config && config.version) {
        this.config = { ...this.config, ...config.config };
        console.log('✅ 种子生成器配置导入成功');
      } else {
        throw new Error('无效的配置格式');
      }
      
    } catch (error) {
      console.error('❌ 种子生成器配置导入失败:', error);
      throw error;
    }
  }

  /**
   * 销毁种子生成器
   */
  public destroy(): void {
    // 清理事件监听器
    UnifiedEventBus.off('random', 'multi_level_ready', this.handleMultiLevelReady.bind(this));
    UnifiedEventBus.off('random', 'level_updated', this.handleLevelUpdated.bind(this));
    UnifiedEventBus.off('random', 'parameters_updated', this.handleParametersUpdated.bind(this));
    
    this.isInitialized = false;
    console.log('🛑 高级种子生成器已销毁');
  }
}

// 创建默认实例
export const advancedSeedGenerator = new AdvancedSeedGenerator();
