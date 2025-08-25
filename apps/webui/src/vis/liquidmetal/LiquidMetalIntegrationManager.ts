/**
 * LiquidMetalIntegrationManager.ts
 * LiquidMetal 系统集成管理器
 * 协调 LiquidMetal 调度器与现有的可视化系统
 */

// 已移除未使用的导入: import { scheduler, Mood, BlendPipeline } from './LiquidMetalConductor';
// 已移除未使用的导入: import { LIQUIDMETAL_PRESETS, getPresetCategory, recommendPresetsByMood } from './LiquidMetalPresets';
import { UnifiedEventBus } from '../../components/events/UnifiedEventBus';

export type LiquidMetalIntegrationConfig = {
  enabled: boolean;
  autoSwitch: boolean;
  performanceMode: 'low' | 'medium' | 'high';
  moodSensitivity: number; // 0-1
};

export type LiquidMetalState = {
  currentPipeline: BlendPipeline | null;
  currentPreset: string;
  performance: {
    fps: number;
    memoryUsage: number;
    cost: number;
  };
  mood: Mood;
};

export class LiquidMetalIntegrationManager {
  private config: LiquidMetalIntegrationConfig;
  private state: LiquidMetalState;
  private lastUpdate = 0;
  private frameCount = 0;
  private lastFrameTime = 0;

  constructor(config: Partial<LiquidMetalIntegrationConfig> = {}) {
    this.config = {
      enabled: true,
      autoSwitch: true,
      performanceMode: 'medium',
      moodSensitivity: 0.7,
      ...config
    };

    this.state = {
      currentPipeline: null,
      currentPreset: 'liquid_flow',
      performance: {
        fps: 60,
        memoryUsage: 0,
        cost: 1
      },
      mood: {
        energy: 0.5,
        valence: 0,
        arousal: 0.5
      }
    };

    this.initialize();
  }

  private initialize(): void {
    if (this.config.enabled) {
      // 订阅可视化事件
      this.setupEventListeners();
      console.log('🔧 LiquidMetal 集成管理器已启动');
    }
  }

  private setupEventListeners(): void {
    // 监听音频事件，更新情绪状态
    // 这里可以接入现有的音频分析系统
  }

  /**
   * 更新情绪状态
   * @param mood 新的情绪状态
   */
  public updateMood(mood: Partial<Mood>): void {
    this.state.mood = { ...this.state.mood, ...mood };
    
    if (this.config.autoSwitch) {
      this.autoSwitchPreset();
    }
  }

  /**
   * 自动切换预设
   */
  private autoSwitchPreset(): void {
    const { energy, valence, arousal } = this.state.mood;
    const recommended = recommendPresetsByMood(energy, valence, arousal);
    
    if (recommended.length > 0) {
      const newPreset = recommended[0];
      if (newPreset !== this.state.currentPreset) {
        this.switchPreset(newPreset);
      }
    }
  }

  /**
   * 切换预设
   * @param presetId 预设 ID
   */
  public switchPreset(presetId: string): void {
    const oldPreset = this.state.currentPreset;
    this.state.currentPreset = presetId;
    
    // 通过事件总线通知可视化系统
    const category = getPresetCategory(presetId);
    UnifiedEventBus.emitPreset(category);
    
    console.log(`🔄 LiquidMetal 预设切换: ${oldPreset} → ${presetId} (${category})`);
  }

  /**
   * 获取当前管线
   * @returns 当前的 BlendPipeline
   */
  public getCurrentPipeline(): BlendPipeline | null {
    return this.state.currentPipeline;
  }

  /**
   * 更新性能指标
   * @param deltaTime 帧间隔时间
   */
  public updatePerformance(deltaTime: number): void {
    this.frameCount++;
    const now = Date.now();
    
    if (now - this.lastFrameTime >= 1000) {
      this.state.performance.fps = Math.round(this.frameCount * 1000 / (now - this.lastFrameTime));
      this.frameCount = 0;
      this.lastFrameTime = now;
    }

    // 根据性能模式调整质量
    this.adjustQualityByPerformance();
  }

  /**
   * 根据性能调整质量
   */
  private adjustQualityByPerformance(): void {
    const { fps } = this.state.performance;
    
    if (fps < 30 && this.config.performanceMode !== 'low') {
      this.config.performanceMode = 'low';
      console.log('⚠️ 性能下降，切换到低质量模式');
    } else if (fps > 55 && this.config.performanceMode === 'low') {
      this.config.performanceMode = 'medium';
      console.log('✅ 性能恢复，切换到中等质量模式');
    }
  }

  /**
   * 获取渲染参数
   * @returns 渲染参数对象
   */
  public getRenderParams(): {
    preset: string;
    category: string;
    pipeline: BlendPipeline | null;
    performance: typeof this.state.performance;
  } {
    return {
      preset: this.state.currentPreset,
      category: getPresetCategory(this.state.currentPreset),
      pipeline: this.state.currentPipeline,
      performance: this.state.performance
    };
  }

  /**
   * 获取配置
   * @returns 当前配置
   */
  public getConfig(): LiquidMetalIntegrationConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   * @param newConfig 新配置
   */
  public updateConfig(newConfig: Partial<LiquidMetalIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.enabled !== undefined) {
      if (newConfig.enabled) {
        this.initialize();
      } else {
        console.log('🔧 LiquidMetal 集成管理器已禁用');
      }
    }
  }

  /**
   * 获取状态摘要
   * @returns 状态摘要字符串
   */
  public getStatusSummary(): string {
    const { currentPreset, performance } = this.state;
    const category = getPresetCategory(currentPreset);
    
    return `LiquidMetal: ${currentPreset} (${category}) | FPS: ${performance.fps} | Cost: ${performance.cost}`;
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    // 清理事件监听器等资源
    console.log('🔧 LiquidMetal 集成管理器已清理');
  }
}

export default LiquidMetalIntegrationManager;
