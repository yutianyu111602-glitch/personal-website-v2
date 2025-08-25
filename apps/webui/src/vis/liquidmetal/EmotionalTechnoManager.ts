/**
 * EmotionalTechnoManager.ts - 自动情绪化Techno管理可视化算法
 * 
 * 整合优势：
 * - 新算法：LiquidMetal的精确音频分析和情绪映射
 * - 旧算法：EmotionEnergyBridge的简化情绪分类和AutoMix的BPM管理
 * - 统一：TechnoRandomizer的节奏生成和AudioReactive的微调系统
 */

import { TechnoRandomizer, TechnoState, TechnoConfig, TechnoHooks } from './TechnoRandomizer';
// 已移除未使用的导入: import { AudioReactive, AudioFeatures, MicroMod, applyMicroMods } from './AudioReactive';
// 已移除未使用的导入: import { Mood, BlendPipeline } from './LiquidMetalConductor';
import { UnifiedEventBus } from '../../components/events/UnifiedEventBus';
// AutoMixEventBus 已整合到 UnifiedEventBus 中

// 情绪化Techno状态
export interface EmotionalTechnoState {
  // 基础状态
  emotion: 'energetic' | 'bright' | 'dark' | 'calm' | 'neutral';
  energy: number;        // 0-1
  valence: number;       // -1到1（负为消极，正为积极）
  arousal: number;       // 0-1（低为平静，高为兴奋）
  
  // Techno状态
  technoState: TechnoState;
  currentPattern: string;
  patternIntensity: number;  // 0-1
  
  // 音频特征
  audioFeatures: AudioFeatures;
  bpm: number;
  
  // 可视化状态
  visualizationPreset: string;
  colorScheme: string;
  effectIntensity: number;   // 0-1
  
  // 时间戳
  timestamp: number;
}

// 情绪化Techno配置
export interface EmotionalTechnoConfig {
  // 情绪映射配置
  emotionThresholds: {
    energetic: { energy: number; arousal: number };
    bright: { valence: number; centroid: number };
    dark: { valence: number; energy: number };
    calm: { energy: number; arousal: number };
  };
  
  // Techno配置
  technoConfig: TechnoConfig;
  
  // 可视化配置
  visualizationMapping: {
    energetic: { preset: string; colorScheme: string; effects: string[] };
    bright: { preset: string; colorScheme: string; effects: string[] };
    dark: { preset: string; colorScheme: string; effects: string[] };
    calm: { preset: string; colorScheme: string; effects: string[] };
  };
  
  // 性能配置
  performance: {
    targetFPS: number;
    adaptiveQuality: boolean;
    maxMicroMods: number;
  };
}

// 默认配置
export const DEFAULT_EMOTIONAL_TECHNO_CONFIG: EmotionalTechnoConfig = {
  emotionThresholds: {
    energetic: { energy: 0.7, arousal: 0.6 },
    bright: { valence: 0.5, centroid: 0.6 },
    dark: { valence: -0.3, energy: 0.4 },
    calm: { energy: 0.3, arousal: 0.3 }
  },
  
  technoConfig: {
    steps: 16,
    phraseBars: 16,
    swing: 0.08,
    basePattern: undefined,  // 将由情绪动态生成
    hatPattern: undefined,
    accentPattern: undefined
  },
  
  visualizationMapping: {
    energetic: { 
      preset: 'particle_system', 
      colorScheme: 'energetic_red', 
      effects: ['bassDodge', 'beatSwap', 'fluxJitter'] 
    },
    bright: { 
      preset: 'wave_field', 
      colorScheme: 'bright_blue', 
      effects: ['presenceSpec', 'brillBloom', 'centroidBrake'] 
    },
    dark: { 
      preset: 'entropy_chaos', 
      colorScheme: 'dark_purple', 
      effects: ['lowMidBurn', 'midLIC', 'structKick'] 
    },
    calm: { 
      preset: 'liquid_flow', 
      colorScheme: 'calm_green', 
      effects: ['silenceHold', 'texEase', 'airColder'] 
    }
  },
  
  performance: {
    targetFPS: 60,
    adaptiveQuality: true,
    maxMicroMods: 8
  }
};

export class EmotionalTechnoManager {
  private config: EmotionalTechnoConfig;
  private currentState: EmotionalTechnoState;
  private technoRandomizer: TechnoRandomizer;
  private lastUpdateTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 60;
  
  // 事件总线集成
  private visualizationEventBus: typeof UnifiedEventBus;
  private autoMixEventBus: typeof UnifiedEventBus;
  
  constructor(config: Partial<EmotionalTechnoConfig> = {}) {
    this.config = { ...DEFAULT_EMOTIONAL_TECHNO_CONFIG, ...config };
    
    // 初始化状态
    this.currentState = this.createInitialState();
    
    // 初始化Techno随机器
    this.technoRandomizer = new TechnoRandomizer(
      this.config.technoConfig,
      this.createTechnoHooks()
    );
    
    // 集成事件总线
    this.visualizationEventBus = UnifiedEventBus;
    this.autoMixEventBus = UnifiedEventBus;
    
    // 订阅AutoMix事件
    this.setupEventSubscriptions();
  }
  
  // 创建初始状态
  private createInitialState(): EmotionalTechnoState {
    return {
      emotion: 'neutral',
      energy: 0.5,
      valence: 0,
      arousal: 0.5,
      technoState: {
        bar: 0, step: 0, steps: 16, phraseBars: 16,
        phaseInPhrase: 0, swing: 0.08,
        isBuild: false, isDrop: false, isFill: false
      },
      currentPattern: 'neutral',
      patternIntensity: 0.5,
      audioFeatures: {
        sub: 0, bass: 0, lowMid: 0, mid: 0, highMid: 0,
        presence: 0, brilliance: 0, air: 0, centroid: 0.5,
        flux: 0, crest: 0, beat: 0, rms: 0, silence: true
      },
      bpm: 128,
      visualizationPreset: 'liquid_flow',
      colorScheme: 'neutral',
      effectIntensity: 0.5,
      timestamp: Date.now()
    };
  }
  
  // 创建Techno钩子
  private createTechnoHooks(): TechnoHooks {
    return {
      onKick: () => this.handleKick(),
      onHat: () => this.handleHat(),
      onAccent: () => this.handleAccent(),
      onBuildTick: (progress: number) => this.handleBuildTick(progress),
      onDrop: () => this.handleDrop(),
      onFillTick: (time: number) => this.handleFillTick(time),
      pLock: (targetId: string, key: string, val: number) => this.handlePLock(targetId, key, val),
      mutateWeight: (id: string, delta: number) => this.handleMutateWeight(id, delta)
    };
  }
  
  // 设置事件订阅
  private setupEventSubscriptions(): void {
    // 订阅BPM变化
    this.autoMixEventBus.onBpm((bpm: number) => {
      this.currentState.bpm = bpm;
      this.updateTechnoConfig();
    });
    
    // 订阅能量变化
    this.autoMixEventBus.onEnergy((energy: number) => {
      this.currentState.energy = energy;
      this.updateEmotion();
    });
  }
  
  // 主要更新方法
  public update(audioFeatures: AudioFeatures, mood: Mood): EmotionalTechnoState {
    const now = Date.now();
    
    // 更新音频特征
    this.currentState.audioFeatures = audioFeatures;
    
    // 更新情绪状态
    this.currentState.energy = mood.energy;
    this.currentState.valence = mood.valence;
    this.currentState.arousal = mood.arousal;
    
    // 分析情绪类型
    this.currentState.emotion = this.analyzeEmotion();
    
    // 更新Techno状态
    this.technoRandomizer.tick(now);
    this.currentState.technoState = { ...this.technoRandomizer.st };
    
    // 更新可视化状态
    this.updateVisualizationState();
    
    // 应用微调
    this.applyEmotionalMicroMods();
    
    // 更新性能指标
    this.updatePerformanceMetrics(now);
    
    // 更新时间戳
    this.currentState.timestamp = now;
    
    return this.currentState;
  }
  
  // 分析情绪类型
  private analyzeEmotion(): EmotionalTechnoState['emotion'] {
    const { energy, valence, arousal } = this.currentState;
    const { emotionThresholds } = this.config;
    
    if (energy >= emotionThresholds.energetic.energy && 
        arousal >= emotionThresholds.energetic.arousal) {
      return 'energetic';
    }
    
    if (valence >= emotionThresholds.bright.valence && 
        this.currentState.audioFeatures.centroid >= emotionThresholds.bright.centroid) {
      return 'bright';
    }
    
    if (valence <= emotionThresholds.dark.valence && 
        energy >= emotionThresholds.dark.energy) {
      return 'dark';
    }
    
    if (energy <= emotionThresholds.calm.energy && 
        arousal <= emotionThresholds.calm.arousal) {
      return 'calm';
    }
    
    return 'neutral';
  }
  
  // 更新Techno配置
  private updateTechnoConfig(): void {
    const { emotion, energy, bpm } = this.currentState;
    const { technoConfig } = this.config;
    
    // 根据情绪调整Techno参数
    let newConfig: Partial<TechnoConfig> = { ...technoConfig };
    
    switch (emotion) {
      case 'energetic':
        newConfig.swing = 0.12;  // 增加摇摆感
        newConfig.phraseBars = 8; // 缩短乐句
        break;
      case 'bright':
        newConfig.swing = 0.06;  // 减少摇摆感
        newConfig.phraseBars = 16; // 标准乐句
        break;
      case 'dark':
        newConfig.swing = 0.15;  // 增加摇摆感
        newConfig.phraseBars = 32; // 延长乐句
        break;
      case 'calm':
        newConfig.swing = 0.04;  // 最小摇摆感
        newConfig.phraseBars = 16; // 标准乐句
        break;
    }
    
    // 根据BPM调整
    if (bpm > 140) {
      newConfig.steps = 32;  // 快速音乐使用更多步数
    } else if (bpm < 100) {
      newConfig.steps = 8;   // 慢速音乐使用更少步数
    } else {
      newConfig.steps = 16;  // 标准步数
    }
    
    // 应用新配置
    this.technoRandomizer.cfg = { ...this.technoRandomizer.cfg, ...newConfig };
  }
  
  // 更新可视化状态
  private updateVisualizationState(): void {
    const { emotion } = this.currentState;
    const { visualizationMapping } = this.config;
    
    const mapping = visualizationMapping[emotion] || visualizationMapping.calm;
    
    this.currentState.visualizationPreset = mapping.preset;
    this.currentState.colorScheme = mapping.colorScheme;
    
    // 通过事件总线广播变化
    this.visualizationEventBus.emitPreset(mapping.preset);
    this.visualizationEventBus.emitColor(mapping.colorScheme);
  }
  
  // 应用情绪化微调
  private applyEmotionalMicroMods(): void {
    const { audioFeatures, emotion } = this.currentState;
    const { performance } = this.config;
    
    // 检查性能
    const fpsOk = this.fps >= performance.targetFPS * 0.8;
    
    // 选择微调
    const microMods = this.selectEmotionalMicroMods(audioFeatures, emotion, fpsOk);
    
    // 限制微调数量
    const limitedMods = microMods.slice(0, performance.maxMicroMods);
    
    // 应用微调
    if (limitedMods.length > 0) {
      // 创建虚拟pipeline用于微调
      const virtualPipeline = {
        nodes: [
          { id: 'BoundedDodge', weight: 0.1, uniforms: {} },
          { id: 'SoftBurn', weight: 0.1, uniforms: {} },
          { id: 'StructureMix', weight: 0.1, uniforms: {} },
          { id: 'DualCurve', weight: 0.1, uniforms: {} },
          { id: 'EdgeTint', weight: 0.1, uniforms: {} },
          { id: 'BloomHL', weight: 0.1, uniforms: {} }
        ]
      };
      
      applyMicroMods(limitedMods, virtualPipeline, fpsOk, audioFeatures);
      
      // 更新效果强度
      this.currentState.effectIntensity = this.calculateEffectIntensity(virtualPipeline);
    }
  }
  
  // 选择情绪化微调
  private selectEmotionalMicroMods(
    audioFeatures: AudioFeatures, 
    emotion: string, 
    fpsOk: boolean
  ): MicroMod[] {
    const now = Date.now();
    const baseMods = pickMicroMods(now, audioFeatures, fpsOk);
    
    // 根据情绪过滤和增强微调
    const emotionalMods = baseMods.filter(mod => {
      switch (emotion) {
        case 'energetic':
          return ['bassDodge', 'beatSwap', 'fluxJitter', 'subRipple'].includes(mod.id);
        case 'bright':
          return ['presenceSpec', 'brillBloom', 'centroidBrake', 'airColder'].includes(mod.id);
        case 'dark':
          return ['lowMidBurn', 'midLIC', 'structKick', 'cellCrack'].includes(mod.id);
        case 'calm':
          return ['silenceHold', 'texEase', 'LBoost'].includes(mod.id);
        default:
          return true;
      }
    });
    
    return emotionalMods;
  }
  
  // 计算效果强度
  private calculateEffectIntensity(pipeline: any): number {
    const totalWeight = pipeline.nodes.reduce((sum: number, node: any) => sum + node.weight, 0);
    const avgWeight = totalWeight / pipeline.nodes.length;
    return Math.min(1, avgWeight * 5); // 标准化到0-1
  }
  
  // 更新性能指标
  private updatePerformanceMetrics(now: number): void {
    this.frameCount++;
    
    if (now - this.lastUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastUpdateTime = now;
      
      // 自适应质量调整
      if (this.config.performance.adaptiveQuality) {
        this.adjustQualityByPerformance();
      }
    }
  }
  
  // 根据性能调整质量
  private adjustQualityByPerformance(): void {
    if (this.fps < this.config.performance.targetFPS * 0.7) {
      // 降低质量
      this.config.performance.maxMicroMods = Math.max(2, this.config.performance.maxMicroMods - 1);
    } else if (this.fps > this.config.performance.targetFPS * 0.9) {
      // 提高质量
      this.config.performance.maxMicroMods = Math.min(12, this.config.performance.maxMicroMods + 1);
    }
  }
  
  // Techno事件处理器
  private handleKick(): void {
    // 通过事件总线广播kick事件
    this.autoMixEventBus.emitEnergy(this.currentState.energy);
  }
  
  private handleHat(): void {
    // 处理hi-hat事件
  }
  
  private handleAccent(): void {
    // 处理重音事件
  }
  
  private handleBuildTick(progress: number): void {
    // 处理构建阶段
    this.currentState.patternIntensity = progress;
  }
  
  private handleDrop(): void {
    // 处理drop事件
    this.currentState.patternIntensity = 1.0;
  }
  
  private handleFillTick(time: number): void {
    // 处理填充阶段
  }
  
  private handlePLock(targetId: string, key: string, val: number): void {
    // 处理参数锁定
  }
  
  private handleMutateWeight(id: string, delta: number): void {
    // 处理权重变化
  }
  
  // 获取当前状态
  public getCurrentState(): EmotionalTechnoState {
    return { ...this.currentState };
  }
  
  // 获取配置
  public getConfig(): EmotionalTechnoConfig {
    return { ...this.config };
  }
  
  // 更新配置
  public updateConfig(newConfig: Partial<EmotionalTechnoConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.updateTechnoConfig();
  }
  
  // 获取状态摘要
  public getStatusSummary(): string {
    const { emotion, energy, bpm, fps, effectIntensity } = this.currentState;
    return `🎵 ${emotion} | ⚡ ${energy.toFixed(2)} | 🎯 ${bpm} BPM | 📊 ${fps} FPS | 🎨 ${effectIntensity.toFixed(2)}`;
  }
  
  // 清理资源
  public dispose(): void {
    // 清理事件订阅等
  }
}

export default EmotionalTechnoManager;
