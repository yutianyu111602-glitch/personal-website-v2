/**
 * 随机算法与情绪核心集成模块
 * 将新生成的随机算法模块接入到情绪核心中
 * 实现智能随机性控制和预设协调
 */

import { UnifiedEventBus } from '../events/UnifiedEventBus';
import { randomStateManager } from './randomStateManager';
import { randomStateRecovery } from './randomStateRecovery';
import type { RandomState, RandomnessControl } from './randomStateManager';
import type { RecoveryResult } from './randomStateRecovery';

// 情绪-随机性映射配置
export interface EmotionRandomnessMapping {
  energy: {
    low: { randomness: number; entropy: number; presetBias: string[] };
    medium: { randomness: number; entropy: number; presetBias: string[] };
    high: { randomness: number; entropy: number; presetBias: string[] };
  };
  valence: {
    negative: { randomness: number; entropy: number; presetBias: string[] };
    neutral: { randomness: number; entropy: number; presetBias: string[] };
    positive: { randomness: number; entropy: number; presetBias: string[] };
  };
  arousal: {
    low: { randomness: number; entropy: number; presetBias: string[] };
    medium: { randomness: number; entropy: number; presetBias: number[] };
    high: { randomness: number; entropy: number; presetBias: string[] };
  };
}

// 智能随机性控制配置
export interface IntelligentRandomnessConfig {
  enableEmotionDriven: boolean;      // 启用情绪驱动随机性
  enablePresetCoordination: boolean; // 启用预设协调
  enableAdaptiveSeeding: boolean;    // 启用自适应种子
  enablePerformanceGuard: boolean;   // 启用性能保护
  maxRandomnessLevel: number;        // 最大随机性级别 (0-1)
  minRandomnessLevel: number;        // 最小随机性级别 (0-1)
  emotionInfluenceWeight: number;    // 情绪影响权重 (0-1)
  presetInfluenceWeight: number;     // 预设影响权重 (0-1)
}

// 默认配置
export const DEFAULT_EMOTION_RANDOMNESS_MAPPING: EmotionRandomnessMapping = {
  energy: {
    low: { randomness: 0.3, entropy: 0.4, presetBias: ['deep_minimal', 'hypnotic', 'liquid_metal_carve'] },
    medium: { randomness: 0.6, entropy: 0.6, presetBias: ['classic', 'liquid_metal_polish', 'rhythmic_pulse'] },
    high: { randomness: 0.8, entropy: 0.8, presetBias: ['peak_warehouse', 'hard_techno', 'high_energy_blast'] }
  },
  valence: {
    negative: { randomness: 0.7, entropy: 0.7, presetBias: ['dark_purple', 'entropy_chaos', 'liquid_metal_carve'] },
    neutral: { randomness: 0.5, entropy: 0.5, presetBias: ['classic', 'liquid_metal_polish', 'balanced_silver'] },
    positive: { randomness: 0.6, entropy: 0.6, presetBias: ['bright_blue', 'wave_field', 'liquid_metal_flow'] }
  },
  arousal: {
    low: { randomness: 0.4, entropy: 0.4, presetBias: ['calm_green', 'liquid_flow', 'deep_minimal'] },
    medium: { randomness: 0.6, entropy: 0.6, presetBias: ['classic', 'liquid_metal_polish', 'rhythmic_pulse'] },
    high: { randomness: 0.8, entropy: 0.8, presetBias: ['energetic_red', 'particle_system', 'peak_warehouse'] }
  }
};

export const DEFAULT_INTELLIGENT_RANDOMNESS_CONFIG: IntelligentRandomnessConfig = {
  enableEmotionDriven: true,
  enablePresetCoordination: true,
  enableAdaptiveSeeding: true,
  enablePerformanceGuard: true,
  maxRandomnessLevel: 0.9,
  minRandomnessLevel: 0.2,
  emotionInfluenceWeight: 0.6,
  presetInfluenceWeight: 0.4
};

/**
 * 随机算法与情绪核心集成管理器
 * 负责协调随机算法、情绪核心和预设系统
 */
export class RandomEmotionIntegration {
  private config: IntelligentRandomnessConfig;
  private emotionMapping: EmotionRandomnessMapping;
  private currentEmotion: { energy: number; valence: number; arousal: number } = { energy: 0.5, valence: 0, arousal: 0.5 };
  private currentPreset: string = 'classic';
  private performanceMetrics: { fps: number; memoryUsage: number; cpuUsage: number } = { fps: 60, memoryUsage: 0, cpuUsage: 0 };
  private isInitialized: boolean = false;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 1000; // 1秒更新间隔

  constructor(
    config?: Partial<IntelligentRandomnessConfig>,
    emotionMapping?: Partial<EmotionRandomnessMapping>
  ) {
    this.config = { ...DEFAULT_INTELLIGENT_RANDOMNESS_CONFIG, ...config };
    this.emotionMapping = { ...DEFAULT_EMOTION_RANDOMNESS_MAPPING, ...emotionMapping };
    
    this.setupEventListeners();
    this.initialize();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听情绪变化事件
    UnifiedEventBus.on('emotion', 'change', this.handleEmotionChange.bind(this));
    
    // 监听预设变化事件
    UnifiedEventBus.on('visualization', 'preset_change', this.handlePresetChange.bind(this));
    
    // 监听性能指标事件
    UnifiedEventBus.on('performance', 'metrics', this.handlePerformanceMetrics.bind(this));
    
    // 监听随机状态变化事件
    UnifiedEventBus.on('random', 'seed_changed', this.handleRandomSeedChange.bind(this));
    
    // 监听恢复事件
    UnifiedEventBus.on('recovery', 'state_recovered', this.handleStateRecovery.bind(this));
  }

  /**
   * 初始化集成管理器
   */
  private async initialize(): Promise<void> {
    try {
      // 等待随机状态管理器就绪
      await this.waitForRandomManager();
      
      // 启动自动更新
      this.startAutoUpdate();
      
      this.isInitialized = true;
      
      console.log('🎲 随机算法与情绪核心集成管理器初始化完成');
      
      // 发射初始化完成事件
      UnifiedEventBus.emit({
        namespace: 'random_emotion',
        type: 'integration_ready',
        timestamp: Date.now(),
        data: {
          config: this.config,
          emotionMapping: this.emotionMapping
        }
      });
      
    } catch (error) {
      console.error('❌ 随机算法与情绪核心集成管理器初始化失败:', error);
    }
  }

  /**
   * 等待随机状态管理器就绪
   */
  private async waitForRandomManager(): Promise<void> {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (randomStateManager && randomStateRecovery) {
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });
  }

  /**
   * 启动自动更新
   */
  private startAutoUpdate(): void {
    setInterval(() => {
      this.updateIntegration();
    }, this.updateInterval);
  }

  /**
   * 更新集成状态
   */
  private updateIntegration(): void {
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval) {
      return;
    }

    try {
      // 更新情绪驱动的随机性
      this.updateEmotionDrivenRandomness();
      
      // 更新预设协调
      this.updatePresetCoordination();
      
      // 更新自适应种子
      this.updateAdaptiveSeeding();
      
      // 更新性能保护
      this.updatePerformanceGuard();
      
      this.lastUpdateTime = now;
      
    } catch (error) {
      console.error('❌ 更新集成状态失败:', error);
    }
  }

  /**
   * 更新情绪驱动的随机性
   */
  private updateEmotionDrivenRandomness(): void {
    if (!this.config.enableEmotionDriven) {
      return;
    }

    const { energy, valence, arousal } = this.currentEmotion;
    
    // 计算情绪驱动的随机性参数
    const energyRandomness = this.calculateEnergyRandomness(energy);
    const valenceRandomness = this.calculateValenceRandomness(valence);
    const arousalRandomness = this.calculateArousalRandomness(arousal);
    
    // 综合计算最终随机性
    const totalRandomness = (
      energyRandomness * 0.4 +
      valenceRandomness * 0.3 +
      arousalRandomness * 0.3
    );
    
    // 应用配置限制
    const clampedRandomness = Math.max(
      this.config.minRandomnessLevel,
      Math.min(this.config.maxRandomnessLevel, totalRandomness)
    );
    
    // 更新随机状态管理器的随机性控制
    this.updateRandomnessControl({
      baseRandomness: clampedRandomness,
      emotionBias: this.config.emotionInfluenceWeight,
      energyBias: energyRandomness,
      timeBias: 0.1,
      contrastBias: 0.2
    });
    
    console.log(`🎲 情绪驱动随机性更新: ${clampedRandomness.toFixed(3)}`);
  }

  /**
   * 计算能量驱动的随机性
   */
  private calculateEnergyRandomness(energy: number): number {
    if (energy < 0.33) {
      return this.emotionMapping.energy.low.randomness;
    } else if (energy < 0.66) {
      return this.emotionMapping.energy.medium.randomness;
    } else {
      return this.emotionMapping.energy.high.randomness;
    }
  }

  /**
   * 计算效价驱动的随机性
   */
  private calculateValenceRandomness(valence: number): number {
    if (valence < -0.33) {
      return this.emotionMapping.valence.negative.randomness;
    } else if (valence < 0.33) {
      return this.emotionMapping.valence.neutral.randomness;
    } else {
      return this.emotionMapping.valence.positive.randomness;
    }
  }

  /**
   * 计算激活驱动的随机性
   */
  private calculateArousalRandomness(arousal: number): number {
    if (arousal < 0.33) {
      return this.emotionMapping.arousal.low.randomness;
    } else if (arousal < 0.66) {
      return this.emotionMapping.arousal.medium.randomness;
    } else {
      return this.emotionMapping.arousal.high.randomness;
    }
  }

  /**
   * 更新随机性控制参数
   */
  private updateRandomnessControl(control: Partial<RandomnessControl>): void {
    // 这里应该调用RandomStateManager的方法来更新控制参数
    // 暂时记录日志
    console.log('🎲 更新随机性控制参数:', control);
  }

  /**
   * 更新预设协调
   */
  private updatePresetCoordination(): void {
    if (!this.config.enablePresetCoordination) {
      return;
    }

    const { energy, valence, arousal } = this.currentEmotion;
    
    // 根据情绪状态推荐预设
    const recommendedPresets = this.getRecommendedPresets(energy, valence, arousal);
    
    // 发射预设推荐事件
    UnifiedEventBus.emit({
      namespace: 'random_emotion',
      type: 'preset_recommendation',
      timestamp: Date.now(),
      data: {
        emotion: this.currentEmotion,
        recommendedPresets,
        currentPreset: this.currentPreset
      }
    });
    
    console.log(`🎲 预设协调更新: 推荐 ${recommendedPresets.join(', ')}`);
  }

  /**
   * 获取推荐的预设列表
   */
  private getRecommendedPresets(energy: number, valence: number, arousal: number): string[] {
    const recommendations: string[] = [];
    
    // 基于能量推荐
    if (energy < 0.33) {
      recommendations.push(...this.emotionMapping.energy.low.presetBias);
    } else if (energy < 0.66) {
      recommendations.push(...this.emotionMapping.energy.medium.presetBias);
    } else {
      recommendations.push(...this.emotionMapping.energy.high.presetBias);
    }
    
    // 基于效价推荐
    if (valence < -0.33) {
      recommendations.push(...this.emotionMapping.valence.negative.presetBias);
    } else if (valence < 0.33) {
      recommendations.push(...this.emotionMapping.valence.neutral.presetBias);
    } else {
      recommendations.push(...this.emotionMapping.valence.positive.presetBias);
    }
    
    // 基于激活推荐
    if (arousal < 0.33) {
      recommendations.push(...this.emotionMapping.arousal.low.presetBias);
    } else if (arousal < 0.66) {
      recommendations.push(...this.emotionMapping.arousal.medium.presetBias);
    } else {
      recommendations.push(...this.emotionMapping.arousal.high.presetBias);
    }
    
    // 去重并限制数量
    return [...new Set(recommendations)].slice(0, 5);
  }

  /**
   * 更新自适应种子
   */
  private updateAdaptiveSeeding(): void {
    if (!this.config.enableAdaptiveSeeding) {
      return;
    }

    const { energy, valence, arousal } = this.currentEmotion;
    
    // 根据情绪状态计算种子调整
    const seedAdjustment = this.calculateSeedAdjustment(energy, valence, arousal);
    
    // 应用种子调整
    if (Math.abs(seedAdjustment) > 0.1) {
      // 触发重播
      randomStateManager.reseed();
      
      console.log(`🎲 自适应种子更新: 调整 ${seedAdjustment.toFixed(3)}`);
    }
  }

  /**
   * 计算种子调整值
   */
  private calculateSeedAdjustment(energy: number, valence: number, arousal: number): number {
    // 基于情绪变化计算种子调整
    const energyChange = Math.abs(energy - 0.5) * 2; // 0-1
    const valenceChange = Math.abs(valence) * 2; // 0-1
    const arousalChange = Math.abs(arousal - 0.5) * 2; // 0-1
    
    const totalChange = (energyChange + valenceChange + arousalChange) / 3;
    
    // 变化越大，种子调整越大
    return totalChange * 0.5 - 0.25; // -0.25 到 0.25
  }

  /**
   * 更新性能保护
   */
  private updatePerformanceGuard(): void {
    if (!this.config.enablePerformanceGuard) {
      return;
    }

    const { fps, memoryUsage, cpuUsage } = this.performanceMetrics;
    
    // 性能下降时降低随机性
    if (fps < 30 || memoryUsage > 0.8 || cpuUsage > 0.8) {
      const reducedRandomness = this.config.minRandomnessLevel;
      
      this.updateRandomnessControl({
        baseRandomness: reducedRandomness,
        emotionBias: 0.3, // 降低情绪影响
        energyBias: 0.2,
        timeBias: 0.1,
        contrastBias: 0.1
      });
      
      console.log(`🎲 性能保护激活: 随机性降至 ${reducedRandomness}`);
    }
  }

  // 事件处理方法
  private handleEmotionChange(event: any): void {
    const { emotion, energy, valence, arousal } = event.data || {};
    
    this.currentEmotion = {
      energy: energy || 0.5,
      valence: valence || 0,
      arousal: arousal || 0.5
    };
    
    console.log('🎲 情绪变化:', this.currentEmotion);
  }

  private handlePresetChange(event: any): void {
    const { preset } = event.data || {};
    if (preset) {
      this.currentPreset = preset;
      console.log('🎲 预设变化:', preset);
    }
  }

  private handlePerformanceMetrics(event: any): void {
    const { fps, memoryUsage, cpuUsage } = event.data || {};
    
    this.performanceMetrics = {
      fps: fps || 60,
      memoryUsage: memoryUsage || 0,
      cpuUsage: cpuUsage || 0
    };
  }

  private handleRandomSeedChange(event: any): void {
    const { seed, state } = event.data || {};
    console.log('🎲 随机种子变化:', seed);
    
    // 发射种子变化事件到情绪核心
    UnifiedEventBus.emit({
      namespace: 'emotion',
      type: 'randomness_update',
      timestamp: Date.now(),
      data: {
        seed,
        randomness: state.randomQuality,
        entropy: state.entropyLevel
      }
    });
  }

  private handleStateRecovery(event: any): void {
    const { backup, result } = event.data || {};
    console.log('🎲 状态恢复:', backup?.id);
    
    // 恢复后重新初始化随机性控制
    this.updateEmotionDrivenRandomness();
  }

  /**
   * 获取当前集成状态
   */
  public getIntegrationStatus(): any {
    return {
      isInitialized: this.isInitialized,
      currentEmotion: this.currentEmotion,
      currentPreset: this.currentPreset,
      performanceMetrics: this.performanceMetrics,
      config: this.config,
      lastUpdateTime: this.lastUpdateTime
    };
  }

  /**
   * 手动触发随机性更新
   */
  public triggerRandomnessUpdate(): void {
    this.updateIntegration();
  }

  /**
   * 手动设置情绪状态
   */
  public setEmotionState(energy: number, valence: number, arousal: number): void {
    this.currentEmotion = { energy, valence, arousal };
    this.updateEmotionDrivenRandomness();
  }

  /**
   * 手动设置预设
   */
  public setPreset(preset: string): void {
    this.currentPreset = preset;
    this.updatePresetCoordination();
  }

  /**
   * 销毁集成管理器
   */
  public destroy(): void {
    console.log('🎲 随机算法与情绪核心集成管理器已销毁');
  }
}

// 导出单例实例
export const randomEmotionIntegration = new RandomEmotionIntegration();
