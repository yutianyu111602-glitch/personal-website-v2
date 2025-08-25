/**
 * 随机状态管理器
 * 实现种子持久化、状态恢复、种子池管理等高级随机功能
 * 基于现有的RandomToolkit和UnifiedEventBus架构
 */

import { UnifiedEventBus } from '../events/UnifiedEventBus';
import { makeXor, makePCG } from '../../vis/random/RandomToolkit';

// 随机状态类型定义
export interface RandomState {
  currentSeed: number;
  seedHistory: number[];
  lastReseedTime: number;
  reseedCount: number;
  randomQuality: number; // 0-1，随机性质量
  entropyLevel: number;  // 0-1，熵值水平
}

// 种子池配置
export interface SeedPoolConfig {
  poolSize: number;
  minSeedValue: number;
  maxSeedValue: number;
  qualityThreshold: number;
  entropyThreshold: number;
  autoReseedInterval: number; // 自动重播间隔(ms)
}

// 随机性控制参数
export interface RandomnessControl {
  baseRandomness: number;     // 基础随机性 (0-1)
  emotionBias: number;        // 情绪偏置 (0-1)
  energyBias: number;         // 能量偏置 (0-1)
  timeBias: number;           // 时间偏置 (0-1)
  contrastBias: number;       // 对比偏置 (0-1)
}

// 默认配置
export const DEFAULT_SEED_POOL_CONFIG: SeedPoolConfig = {
  poolSize: 50,
  minSeedValue: 1000000,
  maxSeedValue: 9999999,
  qualityThreshold: 0.7,
  entropyThreshold: 0.6,
  autoReseedInterval: 300000 // 5分钟
};

export const DEFAULT_RANDOMNESS_CONTROL: RandomnessControl = {
  baseRandomness: 0.8,
  emotionBias: 0.3,
  energyBias: 0.2,
  timeBias: 0.1,
  contrastBias: 0.2
};

/**
 * 随机状态管理器
 * 负责种子的持久化、恢复和高级随机性控制
 */
export class RandomStateManager {
  private config: SeedPoolConfig;
  private randomnessControl: RandomnessControl;
  private currentState: RandomState;
  private seedPool: number[] = [];
  private rng: () => number;
  private isInitialized: boolean = false;
  private autoReseedTimer: NodeJS.Timeout | null = null;
  private storageKey = 'tiangong_random_state';

  constructor(
    config?: Partial<SeedPoolConfig>,
    randomnessControl?: Partial<RandomnessControl>
  ) {
    this.config = { ...DEFAULT_SEED_POOL_CONFIG, ...config };
    this.randomnessControl = { ...DEFAULT_RANDOMNESS_CONTROL, ...randomnessControl };
    
    // 初始化状态
    this.currentState = {
      currentSeed: Date.now(),
      seedHistory: [],
      lastReseedTime: Date.now(),
      reseedCount: 0,
      randomQuality: 0.8,
      entropyLevel: 0.7
    };

    this.setupEventListeners();
    this.initialize();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听情绪变化事件
    UnifiedEventBus.on('emotion', 'change', this.handleEmotionChange.bind(this));
    
    // 监听音频能量事件
    UnifiedEventBus.on('audio', 'energy', this.handleAudioEnergy.bind(this));
    
    // 监听时间变化事件
    UnifiedEventBus.on('time', 'tick', this.handleTimeTick.bind(this));
  }

  /**
   * 初始化随机状态管理器
   */
  private async initialize(): Promise<void> {
    try {
      // 从localStorage恢复状态
      await this.restoreState();
      
      // 生成种子池
      this.generateSeedPool();
      
      // 设置当前种子
      this.setCurrentSeed(this.currentState.currentSeed);
      
      // 启动自动重播
      this.startAutoReseed();
      
      this.isInitialized = true;
      
      console.log('🎲 随机状态管理器初始化完成');
      
      // 发射初始化完成事件
      UnifiedEventBus.emit({
        namespace: 'random',
        type: 'manager_ready',
        timestamp: Date.now(),
        data: {
          state: this.currentState,
          seedPoolSize: this.seedPool.length
        }
      });
      
    } catch (error) {
      console.error('❌ 随机状态管理器初始化失败:', error);
      // 使用默认状态
      this.setCurrentSeed(Date.now());
    }
  }

  /**
   * 从localStorage恢复状态
   */
  private async restoreState(): Promise<void> {
    try {
      if (typeof localStorage === 'undefined') {
        console.warn('⚠️ localStorage不可用，使用默认状态');
        return;
      }

      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // 验证存储的数据
        if (this.validateStoredState(parsed)) {
          this.currentState = { ...this.currentState, ...parsed };
          console.log('💾 从localStorage恢复随机状态');
        } else {
          console.warn('⚠️ 存储的随机状态无效，使用默认状态');
        }
      }
    } catch (error) {
      console.warn('⚠️ 恢复随机状态失败:', error);
    }
  }

  /**
   * 验证存储的状态数据
   */
  private validateStoredState(data: any): boolean {
    return (
      data &&
      typeof data.currentSeed === 'number' &&
      Array.isArray(data.seedHistory) &&
      typeof data.lastReseedTime === 'number' &&
      typeof data.reseedCount === 'number' &&
      typeof data.randomQuality === 'number' &&
      typeof data.entropyLevel === 'number'
    );
  }

  /**
   * 保存状态到localStorage
   */
  private async saveState(): Promise<void> {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }

      const stateToSave = {
        currentSeed: this.currentState.currentSeed,
        seedHistory: this.currentState.seedHistory.slice(-20), // 只保存最近20个
        lastReseedTime: this.currentState.lastReseedTime,
        reseedCount: this.currentState.reseedCount,
        randomQuality: this.currentState.randomQuality,
        entropyLevel: this.currentState.entropyLevel
      };

      localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
      
    } catch (error) {
      console.warn('⚠️ 保存随机状态失败:', error);
    }
  }

  /**
   * 生成种子池
   */
  private generateSeedPool(): void {
    this.seedPool = [];
    
    // 使用高质量RNG生成种子
    const poolRNG = makePCG(Date.now());
    
    for (let i = 0; i < this.config.poolSize; i++) {
      const seed = Math.floor(
        poolRNG() * (this.config.maxSeedValue - this.config.minSeedValue) + 
        this.config.minSeedValue
      );
      
      // 确保种子唯一性
      if (!this.seedPool.includes(seed)) {
        this.seedPool.push(seed);
      }
    }
    
    console.log(`🎲 生成种子池: ${this.seedPool.length}个种子`);
  }

  /**
   * 设置当前种子
   */
  private setCurrentSeed(seed: number): void {
    this.currentState.currentSeed = seed;
    this.currentState.lastReseedTime = Date.now();
    this.currentState.reseedCount++;
    
    // 添加到历史记录
    this.currentState.seedHistory.push(seed);
    if (this.currentState.seedHistory.length > 100) {
      this.currentState.seedHistory.shift();
    }
    
    // 创建新的RNG
    this.rng = makeXor(seed);
    
    // 更新随机性质量
    this.updateRandomQuality();
    
    // 保存状态
    this.saveState();
    
    // 发射种子变化事件
    UnifiedEventBus.emit({
      namespace: 'random',
      type: 'seed_changed',
      timestamp: Date.now(),
      data: {
        seed,
        state: this.currentState
      }
    });
    
    console.log(`🎲 设置新种子: ${seed}`);
  }

  /**
   * 更新随机性质量
   */
  private updateRandomQuality(): void {
    // 基于种子池多样性和历史变化计算质量
    const diversity = this.calculateSeedDiversity();
    const changeRate = this.calculateChangeRate();
    
    this.currentState.randomQuality = Math.min(1, (diversity + changeRate) / 2);
    this.currentState.entropyLevel = this.calculateEntropy();
  }

  /**
   * 计算种子多样性
   */
  private calculateSeedDiversity(): number {
    if (this.seedPool.length < 2) return 0;
    
    const uniqueSeeds = new Set(this.seedPool).size;
    return uniqueSeeds / this.seedPool.length;
  }

  /**
   * 计算变化率
   */
  private calculateChangeRate(): number {
    if (this.currentState.seedHistory.length < 2) return 0;
    
    let changes = 0;
    for (let i = 1; i < this.currentState.seedHistory.length; i++) {
      if (this.currentState.seedHistory[i] !== this.currentState.seedHistory[i - 1]) {
        changes++;
      }
    }
    
    return changes / (this.currentState.seedHistory.length - 1);
  }

  /**
   * 计算熵值
   */
  private calculateEntropy(): number {
    if (this.currentState.seedHistory.length < 2) return 0;
    
    // 简化的熵值计算
    const recentSeeds = this.currentState.seedHistory.slice(-10);
    const uniqueSeeds = new Set(recentSeeds).size;
    
    return uniqueSeeds / recentSeeds.length;
  }

  /**
   * 启动自动重播
   */
  private startAutoReseed(): void {
    if (this.autoReseedTimer) {
      clearInterval(this.autoReseedTimer);
    }
    
    this.autoReseedTimer = setInterval(() => {
      this.autoReseed();
    }, this.config.autoReseedInterval);
  }

  /**
   * 自动重播
   */
  private autoReseed(): void {
    // 检查是否需要重播
    if (this.shouldAutoReseed()) {
      this.reseed();
    }
  }

  /**
   * 判断是否需要自动重播
   */
  private shouldAutoReseed(): boolean {
    const timeSinceLastReseed = Date.now() - this.currentState.lastReseedTime;
    const qualityThreshold = this.config.qualityThreshold;
    const entropyThreshold = this.config.entropyThreshold;
    
    return (
      timeSinceLastReseed > this.config.autoReseedInterval ||
      this.currentState.randomQuality < qualityThreshold ||
      this.currentState.entropyLevel < entropyThreshold
    );
  }

  /**
   * 手动重播
   */
  public reseed(): void {
    if (this.seedPool.length === 0) {
      this.generateSeedPool();
    }
    
    // 从种子池中选择新种子
    const randomIndex = Math.floor(Math.random() * this.seedPool.length);
    const newSeed = this.seedPool[randomIndex];
    
    // 从池中移除已使用的种子
    this.seedPool.splice(randomIndex, 1);
    
    // 设置新种子
    this.setCurrentSeed(newSeed);
  }

  /**
   * 获取随机数
   */
  public random(): number {
    if (!this.rng) {
      this.setCurrentSeed(Date.now());
    }
    return this.rng();
  }

  /**
   * 获取当前状态
   */
  public getState(): RandomState {
    return { ...this.currentState };
  }

  /**
   * 获取种子池信息
   */
  public getSeedPoolInfo(): { size: number; seeds: number[] } {
    return {
      size: this.seedPool.length,
      seeds: [...this.seedPool]
    };
  }

  /**
   * 手动添加种子到池中
   */
  public addSeedToPool(seed: number): void {
    if (seed >= this.config.minSeedValue && 
        seed <= this.config.maxSeedValue && 
        !this.seedPool.includes(seed)) {
      this.seedPool.push(seed);
      console.log(`🎲 添加种子到池中: ${seed}`);
    }
  }

  /**
   * 清理历史记录
   */
  public clearHistory(): void {
    this.currentState.seedHistory = [];
    this.saveState();
    console.log('🧹 清理随机历史记录');
  }

  /**
   * 销毁管理器
   */
  public destroy(): void {
    if (this.autoReseedTimer) {
      clearInterval(this.autoReseedTimer);
    }
    
    // 保存最终状态
    this.saveState();
    
    console.log('🎲 随机状态管理器已销毁');
  }

  // 事件处理方法
  private handleEmotionChange(event: any): void {
    // 根据情绪变化调整随机性
    const { emotion, intensity } = event.data || {};
    if (emotion && intensity) {
      this.adjustRandomnessByEmotion(emotion, intensity);
    }
  }

  private handleAudioEnergy(event: any): void {
    // 根据音频能量调整随机性
    const { energy } = event.data || {};
    if (typeof energy === 'number') {
      this.adjustRandomnessByEnergy(energy);
    }
  }

  private handleTimeTick(event: any): void {
    // 根据时间调整随机性
    const { timestamp } = event;
    if (timestamp) {
      this.adjustRandomnessByTime(timestamp);
    }
  }

  /**
   * 根据情绪调整随机性
   */
  private adjustRandomnessByEmotion(emotion: string, intensity: number): void {
    // 不同情绪对应不同的随机性调整
    const adjustments: Record<string, { randomness: number; entropy: number }> = {
      'energetic': { randomness: 0.1, entropy: 0.2 },
      'calm': { randomness: -0.1, entropy: -0.1 },
      'excited': { randomness: 0.2, entropy: 0.3 },
      'relaxed': { randomness: -0.05, entropy: -0.05 }
    };
    
    const adjustment = adjustments[emotion];
    if (adjustment) {
      this.randomnessControl.emotionBias = Math.max(0, Math.min(1, 
        this.randomnessControl.emotionBias + adjustment.randomness * intensity
      ));
    }
  }

  /**
   * 根据音频能量调整随机性
   */
  private adjustRandomnessByEnergy(energy: number): void {
    // 高能量时增加随机性
    const adjustment = (energy - 0.5) * 0.2;
    this.randomnessControl.energyBias = Math.max(0, Math.min(1, 
      this.randomnessControl.energyBias + adjustment
    ));
  }

  /**
   * 根据时间调整随机性
   */
  private adjustRandomnessByTime(timestamp: number): void {
    // 基于时间的周期性随机性变化
    const timeCycle = (timestamp % 60000) / 60000; // 1分钟周期
    const adjustment = Math.sin(timeCycle * Math.PI * 2) * 0.05;
    
    this.randomnessControl.timeBias = Math.max(0, Math.min(1, 
      this.randomnessControl.timeBias + adjustment
    ));
  }
}

// 导出单例实例
export const randomStateManager = new RandomStateManager();
