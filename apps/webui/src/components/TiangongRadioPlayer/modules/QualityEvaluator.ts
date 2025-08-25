/**
 * 种子质量评估器模块
 * 负责评估种子生成的质量
 * TASK-128: 模块化AdvancedSeedGenerator
 */

import type { SeedGenerationStrategy } from './SeedStrategyManager';

// 种子质量评估指标接口
export interface SeedQualityMetrics {
  entropy: number;                // 熵值 (0-1)
  distribution: number;           // 分布均匀性 (0-1)
  correlation: number;            // 相关性 (0-1)
  period: number;                 // 周期长度
  bias: number;                   // 偏置 (0-1)
  overall: number;                // 综合评分 (0-1)
}

// 质量评估配置接口
export interface QualityEvaluationConfig {
  // 评估参数
  entropyThreshold: number;       // 熵值阈值 (0-1)
  distributionThreshold: number;  // 分布阈值 (0-1)
  correlationThreshold: number;   // 相关性阈值 (0-1)
  biasThreshold: number;          // 偏置阈值 (0-1)
  
  // 测试参数
  testSequenceLength: number;     // 测试序列长度
  correlationWindowSize: number;  // 相关性窗口大小
  distributionBins: number;       // 分布直方图箱数
  
  // 权重配置
  weights: {
    entropy: number;              // 熵值权重
    distribution: number;         // 分布权重
    correlation: number;          // 相关性权重
    period: number;               // 周期权重
    bias: number;                 // 偏置权重
  };
}

// 默认配置
export const DEFAULT_QUALITY_EVALUATION_CONFIG: QualityEvaluationConfig = {
  entropyThreshold: 0.7,
  distributionThreshold: 0.8,
  correlationThreshold: 0.3,
  biasThreshold: 0.2,
  testSequenceLength: 1000,
  correlationWindowSize: 100,
  distributionBins: 32,
  weights: {
    entropy: 0.3,
    distribution: 0.25,
    correlation: 0.2,
    period: 0.15,
    bias: 0.1
  }
};

// 分布测试结果接口
export interface DistributionTestResult {
  bins: number[];                 // 各箱的计数
  expectedCount: number;          // 期望计数
  chiSquare: number;              // 卡方统计量
  pValue: number;                 // p值
  isUniform: boolean;             // 是否均匀分布
}

// 相关性测试结果接口
export interface CorrelationTestResult {
  lag1Correlation: number;        // 滞后1相关性
  lag2Correlation: number;        // 滞后2相关性
  lag5Correlation: number;        // 滞后5相关性
  maxCorrelation: number;         // 最大相关性
  isIndependent: boolean;         // 是否独立
}

// 周期测试结果接口
export interface PeriodTestResult {
  estimatedPeriod: number;        // 估计周期
  periodConfidence: number;       // 周期置信度
  hasPeriod: boolean;             // 是否有周期
  periodStrength: number;         // 周期强度
}

/**
 * 种子质量评估器类
 * 提供完整的种子质量评估功能
 */
export class QualityEvaluator {
  private config: QualityEvaluationConfig;
  private isInitialized: boolean = false;
  private evaluationHistory: Array<{
    timestamp: number;
    seed: number;
    metrics: SeedQualityMetrics;
    strategy: SeedGenerationStrategy;
  }> = [];
  private maxHistoryLength: number = 1000;

  constructor(config?: Partial<QualityEvaluationConfig>) {
    this.config = { ...DEFAULT_QUALITY_EVALUATION_CONFIG, ...config };
  }

  /**
   * 初始化质量评估器
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    try {
      this.isInitialized = true;
      console.log('🔍 种子质量评估器初始化成功');
      
    } catch (error) {
      console.error('❌ 种子质量评估器初始化失败:', error);
    }
  }

  /**
   * 评估种子质量
   */
  public evaluateSeedQuality(seed: number, strategy: SeedGenerationStrategy): SeedQualityMetrics {
    const startTime = performance.now();
    
    try {
      // 生成测试序列
      const testSequence = this.generateTestSequence(seed, strategy);
      
      // 计算各项指标
      const entropy = this.calculateEntropy(testSequence);
      const distribution = this.evaluateDistribution(testSequence);
      const correlation = this.evaluateCorrelation(testSequence);
      const period = this.evaluatePeriod(testSequence);
      const bias = this.evaluateBias(testSequence);
      
      // 计算综合评分
      const overall = this.calculateOverallScore({
        entropy,
        distribution,
        correlation,
        period,
        bias
      });
      
      const metrics: SeedQualityMetrics = {
        entropy,
        distribution,
        correlation,
        period,
        bias,
        overall
      };
      
      // 记录评估历史
      this.recordEvaluation(seed, metrics, strategy);
      
      const evaluationTime = performance.now() - startTime;
      console.log(`🔍 种子质量评估完成，耗时: ${evaluationTime.toFixed(2)}ms`);
      
      return metrics;
      
    } catch (error) {
      console.error('❌ 种子质量评估失败:', error);
      
      // 返回默认指标
      return this.createDefaultMetrics();
    }
  }

  /**
   * 生成测试序列
   */
  private generateTestSequence(seed: number, strategy: SeedGenerationStrategy): number[] {
    const sequence: number[] = [];
    let currentSeed = seed;
    
    for (let i = 0; i < this.config.testSequenceLength; i++) {
      // 根据策略生成下一个值
      currentSeed = this.generateNextValue(currentSeed, strategy);
      sequence.push(currentSeed);
    }
    
    return sequence;
  }

  /**
   * 根据策略生成下一个值
   */
  private generateNextValue(seed: number, strategy: SeedGenerationStrategy): number {
    switch (strategy) {
      case 'linear_congruential':
        return this.linearCongruentialNext(seed);
      case 'xorsift':
        return this.xorsiftNext(seed);
      case 'pcg':
        return this.pcgNext(seed);
      case 'chacha20':
        return this.chacha20Next(seed);
      case 'blum_blum_shub':
        return this.blumBlumShubNext(seed);
      case 'mersenne_twister':
        return this.mersenneTwisterNext(seed);
      default:
        return this.linearCongruentialNext(seed);
    }
  }

  /**
   * 线性同余法下一个值
   */
  private linearCongruentialNext(seed: number): number {
    const multiplier = 1664525;
    const increment = 1013904223;
    const modulus = 2 ** 32;
    
    return (multiplier * seed + increment) % modulus;
  }

  /**
   * Xorsift下一个值
   */
  private xorsiftNext(seed: number): number {
    let x = seed;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    return x >>> 0;
  }

  /**
   * PCG下一个值
   */
  private pcgNext(seed: number): number {
    const multiplier = 6364136223846793005;
    const increment = 1442695040888963407;
    
    let state = seed;
    state = state * multiplier + increment;
    
    const xorshifted = ((state >> 18) ^ state) >> 27;
    const rot = state >> 59;
    
    return ((xorshifted >> rot) | (xorshifted << ((-rot) & 31))) >>> 0;
  }

  /**
   * ChaCha20下一个值
   */
  private chacha20Next(seed: number): number {
    // 简化的ChaCha20实现
    const key = new Uint8Array(32);
    const nonce = new Uint8Array(12);
    
    // 使用种子填充key和nonce
    for (let i = 0; i < 8; i++) {
      key[i] = (seed >> (i * 8)) & 0xFF;
      nonce[i] = (seed >> (i * 8)) & 0xFF;
    }
    
    let state = new Uint32Array(16);
    state[0] = 0x61707865;
    state[1] = 0x3320646e;
    state[2] = 0x79622d32;
    state[3] = 0x6b206574;
    
    for (let i = 0; i < 8; i++) {
      state[4 + i] = (key[i * 4] << 24) | (key[i * 4 + 1] << 16) | (key[i * 4 + 2] << 8) | key[i * 4 + 3];
    }
    for (let i = 0; i < 3; i++) {
      state[12 + i] = (nonce[i * 4] << 24) | (nonce[i * 4 + 1] << 16) | (nonce[i * 4 + 2] << 8) | nonce[i * 4 + 3];
    }
    
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
   * Blum-Blum-Shub下一个值
   */
  private blumBlumShubNext(seed: number): number {
    const p = 11;
    const q = 23;
    const n = p * q;
    
    return (seed * seed) % n;
  }

  /**
   * Mersenne Twister下一个值
   */
  private mersenneTwisterNext(seed: number): number {
    // 简化的MT实现
    const n = 624;
    const mt = new Array(n);
    
    mt[0] = seed;
    for (let i = 1; i < n; i++) {
      mt[i] = (1812433253 * (mt[i - 1] ^ (mt[i - 1] >> 30)) + i) >>> 0;
    }
    
    let y = mt[0];
    y ^= (y >> 11);
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= (y >> 18);
    
    return y;
  }

  /**
   * 计算熵值
   */
  private calculateEntropy(sequence: number[]): number {
    if (sequence.length === 0) return 0;
    
    // 计算每个值的出现频率
    const frequency = new Map<number, number>();
    sequence.forEach(value => {
      frequency.set(value, (frequency.get(value) || 0) + 1);
    });
    
    // 计算熵值
    let entropy = 0;
    const total = sequence.length;
    
    frequency.forEach(count => {
      const probability = count / total;
      if (probability > 0) {
        entropy -= probability * Math.log2(probability);
      }
    });
    
    // 标准化到0-1范围
    const maxEntropy = Math.log2(frequency.size);
    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }

  /**
   * 评估分布均匀性
   */
  private evaluateDistribution(sequence: number[]): number {
    if (sequence.length === 0) return 0;
    
    const bins = this.config.distributionBins;
    const binCounts = new Array(bins).fill(0);
    
    // 统计每个箱的计数
    sequence.forEach(value => {
      const binIndex = Math.floor((value / (2 ** 32)) * bins);
      if (binIndex >= 0 && binIndex < bins) {
        binCounts[binIndex]++;
      }
    });
    
    // 计算卡方统计量
    const expectedCount = sequence.length / bins;
    let chiSquare = 0;
    
    binCounts.forEach(count => {
      const diff = count - expectedCount;
      chiSquare += (diff * diff) / expectedCount;
    });
    
    // 计算p值（简化版本）
    const degreesOfFreedom = bins - 1;
    const pValue = this.chiSquarePValue(chiSquare, degreesOfFreedom);
    
    // 返回分布均匀性评分
    return Math.max(0, 1 - pValue);
  }

  /**
   * 卡方分布p值计算（简化版本）
   */
  private chiSquarePValue(chiSquare: number, degreesOfFreedom: number): number {
    // 简化的p值计算
    if (degreesOfFreedom === 1) {
      return Math.exp(-chiSquare / 2) / Math.sqrt(2 * Math.PI * chiSquare);
    }
    
    // 对于多自由度，使用近似
    const k = degreesOfFreedom;
    const x = chiSquare;
    
    if (x <= 0) return 1;
    
    // 使用Gamma函数近似
    const logP = -x / 2 + (k / 2 - 1) * Math.log(x / 2) - (k / 2) * Math.log(2) - this.logGamma(k / 2);
    return Math.exp(logP);
  }

  /**
   * 对数Gamma函数（简化版本）
   */
  private logGamma(z: number): number {
    // 使用Stirling近似
    return (z - 0.5) * Math.log(z) - z + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * z);
  }

  /**
   * 评估相关性
   */
  private evaluateCorrelation(sequence: number[]): number {
    if (sequence.length < 2) return 0;
    
    const windowSize = this.config.correlationWindowSize;
    const maxLag = Math.min(windowSize, sequence.length - 1);
    
    let maxCorrelation = 0;
    
    // 计算不同滞后的相关性
    for (let lag = 1; lag <= maxLag; lag++) {
      const correlation = this.calculateCorrelation(sequence, lag);
      maxCorrelation = Math.max(maxCorrelation, Math.abs(correlation));
    }
    
    // 返回相关性评分（越低越好）
    return Math.max(0, 1 - maxCorrelation);
  }

  /**
   * 计算特定滞后的相关性
   */
  private calculateCorrelation(sequence: number[], lag: number): number {
    if (sequence.length < lag + 1) return 0;
    
    const n = sequence.length - lag;
    const x = sequence.slice(0, n);
    const y = sequence.slice(lag);
    
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let denominatorX = 0;
    let denominatorY = 0;
    
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      
      numerator += dx * dy;
      denominatorX += dx * dx;
      denominatorY += dy * dy;
    }
    
    if (denominatorX === 0 || denominatorY === 0) return 0;
    
    return numerator / Math.sqrt(denominatorX * denominatorY);
  }

  /**
   * 评估周期
   */
  private evaluatePeriod(sequence: number[]): number {
    if (sequence.length < 4) return 0;
    
    const maxPeriod = Math.floor(sequence.length / 2);
    let bestPeriod = 1;
    let bestCorrelation = 0;
    
    // 寻找最佳周期
    for (let period = 2; period <= maxPeriod; period++) {
      const correlation = this.calculatePeriodCorrelation(sequence, period);
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    // 计算周期强度
    const periodStrength = bestCorrelation;
    
    // 返回周期评分（无周期为好）
    return Math.max(0, 1 - periodStrength);
  }

  /**
   * 计算周期相关性
   */
  private calculatePeriodCorrelation(sequence: number[], period: number): number {
    if (sequence.length < period * 2) return 0;
    
    const cycles = Math.floor(sequence.length / period);
    let correlation = 0;
    
    for (let cycle = 0; cycle < cycles - 1; cycle++) {
      const start1 = cycle * period;
      const start2 = (cycle + 1) * period;
      
      for (let i = 0; i < period; i++) {
        const val1 = sequence[start1 + i];
        const val2 = sequence[start2 + i];
        
        correlation += Math.abs(val1 - val2);
      }
    }
    
    // 标准化相关性
    const totalComparisons = (cycles - 1) * period;
    return totalComparisons > 0 ? 1 - (correlation / totalComparisons) / (2 ** 32) : 0;
  }

  /**
   * 评估偏置
   */
  private evaluateBias(sequence: number[]): number {
    if (sequence.length === 0) return 0;
    
    // 计算位级别的偏置
    const bitCounts = new Array(32).fill(0);
    const totalBits = sequence.length * 32;
    
    sequence.forEach(value => {
      for (let bit = 0; bit < 32; bit++) {
        if ((value >> bit) & 1) {
          bitCounts[bit]++;
        }
      }
    });
    
    // 计算总体偏置
    let totalBias = 0;
    bitCounts.forEach(count => {
      const bitBias = Math.abs(count - totalBits / 64) / (totalBits / 64);
      totalBias += bitBias;
    });
    
    // 返回偏置评分（无偏置为好）
    return Math.max(0, 1 - (totalBias / 32));
  }

  /**
   * 计算综合评分
   */
  private calculateOverallScore(metrics: Omit<SeedQualityMetrics, 'overall'>): number {
    const { weights } = this.config;
    
    return metrics.entropy * weights.entropy +
           metrics.distribution * weights.distribution +
           metrics.correlation * weights.correlation +
           metrics.period * weights.period +
           metrics.bias * weights.bias;
  }

  /**
   * 记录评估历史
   */
  private recordEvaluation(seed: number, metrics: SeedQualityMetrics, strategy: SeedGenerationStrategy): void {
    this.evaluationHistory.push({
      timestamp: Date.now(),
      seed,
      metrics,
      strategy
    });
    
    if (this.evaluationHistory.length > this.maxHistoryLength) {
      this.evaluationHistory.shift();
    }
  }

  /**
   * 创建默认指标
   */
  private createDefaultMetrics(): SeedQualityMetrics {
    return {
      entropy: 0,
      distribution: 0,
      correlation: 0,
      period: 0,
      bias: 0,
      overall: 0
    };
  }

  /**
   * 获取评估历史
   */
  public getEvaluationHistory(): Array<{
    timestamp: number;
    seed: number;
    metrics: SeedQualityMetrics;
    strategy: SeedGenerationStrategy;
  }> {
    return [...this.evaluationHistory];
  }

  /**
   * 获取质量统计
   */
  public getQualityStats(): {
    averageEntropy: number;
    averageDistribution: number;
    averageCorrelation: number;
    averagePeriod: number;
    averageBias: number;
    averageOverall: number;
    totalEvaluations: number;
  } {
    if (this.evaluationHistory.length === 0) {
      return {
        averageEntropy: 0,
        averageDistribution: 0,
        averageCorrelation: 0,
        averagePeriod: 0,
        averageBias: 0,
        averageOverall: 0,
        totalEvaluations: 0
      };
    }
    
    const total = this.evaluationHistory.length;
    const sum = this.evaluationHistory.reduce((acc, eval) => ({
      entropy: acc.entropy + eval.metrics.entropy,
      distribution: acc.distribution + eval.metrics.distribution,
      correlation: acc.correlation + eval.metrics.correlation,
      period: acc.period + eval.metrics.period,
      bias: acc.bias + eval.metrics.bias,
      overall: acc.overall + eval.metrics.overall
    }), { entropy: 0, distribution: 0, correlation: 0, period: 0, bias: 0, overall: 0 });
    
    return {
      averageEntropy: sum.entropy / total,
      averageDistribution: sum.distribution / total,
      averageCorrelation: sum.correlation / total,
      averagePeriod: sum.period / total,
      averageBias: sum.bias / total,
      averageOverall: sum.overall / total,
      totalEvaluations: total
    };
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<QualityEvaluationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔄 质量评估配置已更新');
  }

  /**
   * 获取配置
   */
  public getConfig(): QualityEvaluationConfig {
    return { ...this.config };
  }

  /**
   * 销毁质量评估器
   */
  public destroy(): void {
    this.evaluationHistory = [];
    this.isInitialized = false;
    
    console.log('🛑 种子质量评估器已销毁');
  }
}
