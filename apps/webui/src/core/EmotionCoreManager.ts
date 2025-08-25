/**
 * 情绪核心统一管理器（EmotionCoreManager）
 *
 * 目标（阶段一 - 脚手架）：
 * - 定义统一核心的输入/输出/主循环/配置接口，作为后续合并的承载层。
 * - 当前不接管现有子管理器（DynamicTheme/VisualizationEffect/AutoMix）的职责，避免重复事件。
 * - 逐步将三者的职责收敛到本管理器后，再通过灰度开关切换完全统一模式。
 *
 * I/O 约定（之后会逐步落地）：
 * - 输入：mood/energy/bpm/nowplaying/audioFeatures/perf（来源：事件总线与内部轮询）
 * - 输出：theme tokens、visualization preset/color、pipeline（面向渲染/背景）
 * - 主循环：统一步进tick，减少多处interval与事件抖动，降低通信开销
 * 
 * 新增：随机算法集成
 * - 集成RandomStateManager进行智能随机性控制
 * - 情绪驱动的随机性调整
 * - AI控制的预设选择
 */

import type { Manager, ManagerId, ManagerHealthStatus } from './ManagerTypes';
import { UnifiedEventBus, onMood, onEnergy, onBpm } from '../components/events/UnifiedEventBus';
// 导入随机算法模块 - 修复导入路径
import { randomStateManager } from '../components/TiangongRadioPlayer/randomStateManager';
import { randomStateRecovery } from '../components/TiangongRadioPlayer/randomStateRecovery';
import { randomEmotionIntegration } from '../components/TiangongRadioPlayer/randomEmotionIntegration';

export type EmotionCoreConfig = {
  tickIntervalMs?: number;          // 主循环步进间隔
  enableUnifiedLoop?: boolean;      // 是否启用统一主循环（阶段二启用）
  enableNowPlayingPull?: boolean;   // 是否内嵌 nowplaying 拉取
  
  // === 切歌手法桥接系统配置 ===
  enableTechniqueBridge?: boolean;  // 是否开启"情绪→手法建议"桥接
  conservativeDropout?: number;     // 网络抖动阈值（默认 0.05）
  
  // === 随机算法集成配置 ===
  enableRandomAlgorithm?: boolean;  // 是否启用随机算法集成
  enableEmotionDrivenRandomness?: boolean; // 是否启用情绪驱动随机性
  enableAIControl?: boolean;       // 是否启用AI完全控制预设
  
  // === 留空变量（Cursor 填写） ===
  AUTODJ_STATUS_URL?: string;       // 例如：'/api/autodj/status'（为空时不拉取）
  NOWPLAYING_URL?: string;          // 例如：'/api/nowplaying'（为空时不拉取）
};

const DEFAULT_CFG: Required<Omit<EmotionCoreConfig, 'AUTODJ_STATUS_URL'|'NOWPLAYING_URL'>> & { AUTODJ_STATUS_URL?: string; NOWPLAYING_URL?: string } = {
  tickIntervalMs: 500,
  enableUnifiedLoop: false,
  enableNowPlayingPull: false,
  enableTechniqueBridge: false,
  conservativeDropout: 0.05,
  enableRandomAlgorithm: true,
  enableEmotionDrivenRandomness: true,
  enableAIControl: true,
  AUTODJ_STATUS_URL: undefined,
  NOWPLAYING_URL: undefined,
};

export class EmotionCoreManager implements Manager {
  readonly id: 'emotion-core' = 'emotion-core';
  
  // 管理器状态
  private _state = {
    isInitialized: false,
    isStarted: false,
    isDisposed: false,
    lastError: undefined as Error | undefined,
    lastOperation: undefined as {
      type: 'init' | 'start' | 'stop' | 'dispose';
      timestamp: number;
      duration: number;
      success: boolean;
    } | undefined,
    startedAt: undefined as number | undefined,
    uptime: 0,
  };

  get state() {
    return { ...this._state };
  }

  private cfg: Required<Omit<EmotionCoreConfig, 'AUTODJ_STATUS_URL'|'NOWPLAYING_URL'>> & { AUTODJ_STATUS_URL?: string; NOWPLAYING_URL?: string };
  private loopId: number | null = null;
  private startTime: number = 0;
  
  // === 随机算法集成 ===
  private randomStateManager: typeof randomStateManager;
  private randomStateRecovery: typeof randomStateRecovery;
  private randomEmotionIntegration: typeof randomEmotionIntegration;
  private isRandomAlgorithmInitialized: boolean = false;
  
  // 运行态：外部来源/标签对能量的影响
  private nowKeyCamelot: string | null = null;
  private nowBpm: number | null = null;
  private tagBias: { energyBias?: number; valenceBias?: number; arousalBias?: number } = {};
  
  // === 切歌手法桥接系统 ===
  private nowPlaying: { 
    bpm?: number; 
    keyCamelot?: string; 
    startedAt?: number; 
    segment?: 'steady'|'build'|'fill'|'drop' 
  } = {};
  private telemetry: { 
    dropoutRate: number; 
    recentErrors: number; 
    simpleHeadTail: boolean 
  } = { dropoutRate: 0, recentErrors: 0, simpleHeadTail: false };

  constructor(cfg: EmotionCoreConfig = {}) {
    this.cfg = { ...DEFAULT_CFG, ...cfg } as any;
    
    // === 初始化随机算法模块 ===
    if (this.cfg.enableRandomAlgorithm) {
      this.randomStateManager = randomStateManager;
      this.randomStateRecovery = randomStateRecovery;
      this.randomEmotionIntegration = randomEmotionIntegration;
    }
  }

  /** 初始化：仅建立脚手架，不接管子管理器 */
  async init(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // 预留：读取 data-config.json 并覆盖默认值（后续阶段接入）
      // 预留：注入事件总线与监控
      // 当前阶段仅作为占位，不产生任何副作用
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[emotion-core] initialized (scaffold)');
      }

      // === 初始化随机算法集成 ===
      if (this.cfg.enableRandomAlgorithm && !this.isRandomAlgorithmInitialized) {
        this.initializeRandomAlgorithm();
      }

      // 若启用统一模式，订阅基础输入并直接产出主题/预设
      if (this.cfg.enableUnifiedLoop) {
        this.subscribeInputs();
        // 订阅可视化effect，尝试读取 tags 对情绪的偏置（参考策略包约定）
        UnifiedEventBus.on('visualization', 'effect', (e) => {
          try {
            const pipeline = (e as any).data?.pipeline;
            if (!pipeline) return;
            // 优先读取顶层 tags；否则遍历 nodes 聚合 tags
            const tb = this.extractTagBiasFromPipeline(pipeline);
            this.tagBias = tb;
            // 标签变化应触发主题重算
            this.emitThemeTokens();
          } catch {}
        });
        
        // === 切歌手法桥接系统订阅 ===
        if (this.cfg.enableTechniqueBridge) {
          this.subscribeTechniqueBridge();
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this._state.isInitialized = true;
      this._state.lastOperation = {
        type: 'init',
        timestamp: Date.now(),
        duration,
        success: true,
      };
      
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this._state.lastError = error instanceof Error ? error : new Error(String(error));
      this._state.lastOperation = {
        type: 'init',
        timestamp: Date.now(),
        duration,
        success: false,
      };
      
      throw error;
    }
  }

  /** 启动：如未启用统一循环，则仅保持占位 */
  async start(): Promise<void> {
    const startTime = performance.now();
    
    try {
      if (this.cfg.enableUnifiedLoop && this.loopId == null) {
        this.loopId = window.setInterval(() => {
          // 统一tick：心跳 + 可选拉取 AutoDJ 状态（键位/BPM→能量耦合）
          this.pullAutoDjStatus().catch(() => {});
          // 心跳本身用于维持"最近一次主题广播"
          
          // === 随机算法心跳更新 ===
          if (this.cfg.enableRandomAlgorithm && this.isRandomAlgorithmInitialized) {
            this.updateRandomAlgorithmWithEmotion();
          }
          
          // 更新运行时长
          this._state.uptime = Date.now() - (this._state.startedAt || Date.now());
        }, this.cfg.tickIntervalMs);
        
        this._state.startedAt = Date.now();
      }
      
      // === 如果启用随机算法但未初始化，尝试初始化 ===
      if (this.cfg.enableRandomAlgorithm && !this.isRandomAlgorithmInitialized) {
        this.initializeRandomAlgorithm();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this._state.isStarted = true;
      this._state.lastOperation = {
        type: 'start',
        timestamp: Date.now(),
        duration,
        success: true,
      };
      
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this._state.lastError = error instanceof Error ? error : new Error(String(error));
      this._state.lastOperation = {
        type: 'start',
        timestamp: Date.now(),
        duration,
        success: false,
      };
      
      throw error;
    }
  }

  async stop(): Promise<void> {
    const startTime = performance.now();
    
    try {
      if (this.loopId != null) {
        window.clearInterval(this.loopId);
        this.loopId = null;
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this._state.isStarted = false;
      this._state.lastOperation = {
        type: 'stop',
        timestamp: Date.now(),
        duration,
        success: true,
      };
      
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this._state.lastError = error instanceof Error ? error : new Error(String(error));
      this._state.lastOperation = {
        type: 'stop',
        timestamp: Date.now(),
        duration,
        success: false,
      };
      
      throw error;
    }
  }

  async dispose(): Promise<void> {
    const startTime = performance.now();
    
    try {
      this.stop();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this._state.isDisposed = true;
      this._state.lastOperation = {
        type: 'dispose',
        timestamp: Date.now(),
        duration,
        success: true,
      };
      
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this._state.lastError = error instanceof Error ? error : new Error(String(error));
      this._state.lastOperation = {
        type: 'dispose',
        timestamp: Date.now(),
        duration,
        success: false,
      };
      
      throw error;
    }
  }

  // 状态查询方法
  isInitialized(): boolean { return this._state.isInitialized; }
  isStarted(): boolean { return this._state.isStarted; }
  isDisposed(): boolean { return this._state.isDisposed; }
  getLastError(): Error | undefined { return this._state.lastError; }
  getUptime(): number { return this._state.uptime; }

  // 健康检查方法
  async healthCheck(): Promise<ManagerHealthStatus> {
    const startTime = performance.now();
    
    try {
      // 基础健康检查
      const isHealthy = this._state.isInitialized && !this._state.isDisposed;
      const score = isHealthy ? 100 : 0;
      
      // 检查随机算法状态
      let details: Record<string, unknown> = {};
      if (this.cfg.enableRandomAlgorithm) {
        details.randomAlgorithmInitialized = this.isRandomAlgorithmInitialized;
        details.randomAlgorithmEnabled = this.cfg.enableRandomAlgorithm;
      }
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      return {
        healthy: isHealthy,
        score,
        status: isHealthy ? 'Healthy' : 'Not initialized or disposed',
        details,
        lastCheck: Date.now(),
        responseTime,
      };
      
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      return {
        healthy: false,
        score: 0,
        status: `Health check failed: ${error}`,
        lastCheck: Date.now(),
        responseTime,
      };
    }
  }

  // =============== 统一输入订阅与直接输出（阶段一） ===============
  private mood = { energy: 0.6, valence: 0.0, arousal: 0.5 };
  private energy = 0.6;
  private bpm = 126;

  private subscribeInputs(): void {
    onMood((e) => {
      const m = e.data?.mood; if (!m) return;
      this.mood = { ...this.mood, ...m };
      
      // === 更新随机算法情绪状态 ===
      this.updateRandomAlgorithmWithEmotion();
      
      this.emitThemeTokens();
    });
    onEnergy((e) => {
      const v = e.data?.energy; if (typeof v !== 'number') return;
      this.energy = v;
      // 能量也影响主题强度
      this.emitThemeTokens();
    });
    onBpm((e) => {
      const b = e.data?.bpm; if (typeof b !== 'number') return;
      this.bpm = b;
    });
    // 启动时广播一次
    this.emitThemeTokens();
  }

  private emitThemeTokens(): void {
    // 基础 E/V/A → 应用 AutoDJ 键位与 BPM、标签偏置
    const eAdj = this.deriveEnergyAdjustment();
    const vAdj = this.deriveValenceAdjustment();
    const aAdj = this.deriveArousalAdjustment();
    const t = this.mapMoodToTokens(
      clamp01(this.mood.energy + eAdj),
      clampRange(this.mood.valence + vAdj, -1, 1),
      clamp01(this.mood.arousal + aAdj)
    );
    
    // === 修复事件发射：使用正确的事件类型和命名空间 ===
    UnifiedEventBus.emitGlobalConfig({
      theme: {
        accent: t.accent,
        background: t.background,
        intensity: t.intensity,
        motion: t.motion,
        contrast: t.contrast,
        warm: Math.round(((t.intensity + 1) / 2) * 255),
        cool: 255 - Math.round(((t.intensity + 1) / 2) * 255),
      }
    });
    
    // === 使用随机算法增强的预设选择 ===
    const preset = this.pickPresetByThemeWithRandomness(t);
    UnifiedEventBus.emitPreset(preset);
    
    // === 切歌手法建议广播 ===
    if (this.cfg.enableTechniqueBridge) {
      this.emitTechniqueRecommend('themeTick');
    }
  }

  private mapMoodToTokens(energy: number, valence: number, arousal: number) {
    const intensity = Math.min(1, Math.max(0, energy));
    const motion = Math.min(1, Math.max(0, (energy + arousal) / 2));
    const contrast = Math.min(1, Math.max(0, (arousal * 0.6 + 0.2)));
    const warm = Math.round(((valence + 1) / 2) * 255);
    const cool = 255 - warm;
    const accent = `#${warm.toString(16).padStart(2, '0')}${cool.toString(16).padStart(2, '0')}cc`;
    const background = `#0b0f14`;
    return { accent, background, intensity, motion, contrast };
  }

  // === 增强的预设选择方法，集成随机算法 ===
  private pickPresetByThemeWithRandomness(theme: { intensity:number; motion:number; contrast:number }): string {
    const { intensity, motion, contrast } = theme;
    
    // 基础预设选择逻辑
    let basePreset = '';
    if (intensity < 0.35 && contrast < 0.4) basePreset = 'silver_pure';
    else if (motion < 0.45 && intensity < 0.55) basePreset = 'silver_mist';
    else if (intensity > 0.75 && motion > 0.6) basePreset = 'metallic_flow';
    else if (contrast > 0.65) basePreset = 'cosmic_silver';
    else basePreset = 'liquid_chrome';
    
    // === 如果启用随机算法，使用AI控制的预设选择 ===
    if (this.cfg.enableRandomAlgorithm && this.cfg.enableAIControl && this.isRandomAlgorithmInitialized) {
      try {
        // 获取随机情绪集成的预设推荐
        const integrationStatus = this.randomEmotionIntegration.getIntegrationStatus();
        if (integrationStatus && integrationStatus.recommendedPresets && integrationStatus.recommendedPresets.length > 0) {
          // 使用随机算法推荐的预设
          const randomIndex = Math.floor(this.randomStateManager.random() * integrationStatus.recommendedPresets.length);
          const aiPreset = integrationStatus.recommendedPresets[randomIndex];
          
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[emotion-core] AI选择预设: ${aiPreset} (替代基础选择: ${basePreset})`);
          }
          
          return aiPreset;
        }
      } catch (error) {
        console.warn('[emotion-core] AI预设选择失败，使用基础选择:', error);
      }
    }
    
    return basePreset;
  }

  // =============== 能量/标签/AutoDJ 耦合逻辑 ===============
  private extractTagBiasFromPipeline(pipeline: any): { energyBias?: number; valenceBias?: number; arousalBias?: number } {
    // 约定：优先 pipeline.tags；否则聚合 nodes[*].tags 并按权重/出现次数平均
    const agg = { energyBias: 0, valenceBias: 0, arousalBias: 0, n: 0 } as any;
    const pushTag = (tags?: any) => {
      if (!tags) return;
      const eb = Number(tags.energyBias ?? 0);
      const vb = Number(tags.valenceBias ?? 0);
      const ab = Number(tags.arousalBias ?? 0);
      agg.energyBias += eb; agg.valenceBias += vb; agg.arousalBias += ab; agg.n += 1;
    };
    if (pipeline?.tags) pushTag(pipeline.tags);
    if (Array.isArray(pipeline?.nodes)) {
      for (const node of pipeline.nodes) pushTag(node?.tags);
    }
    if (agg.n === 0) return {};
    return { energyBias: agg.energyBias / agg.n, valenceBias: agg.valenceBias / agg.n, arousalBias: agg.arousalBias / agg.n };
  }

  // 修复：移除直接API调用，改为通过事件系统获取信息
  private async pullAutoDjStatus(): Promise<void> {
    // 不再直接调用API，而是通过事件系统获取信息
    // 电台模块会通过事件系统广播播放状态信息
    console.log('🎵 EmotionCoreManager: 通过事件系统获取播放状态，不再直接调用API');
    
    // 这里可以监听事件系统的事件来获取信息
    // 例如：监听 'automix:nowplaying' 事件获取当前播放信息
    // 例如：监听 'automix:bpm' 事件获取BPM信息
    // 例如：监听 'automix:key' 事件获取调性信息
  }

  private deriveEnergyAdjustment(): number {
    let delta = 0;
    // 标签能量偏置（直接叠加，收敛到 [-0.2, 0.2]）
    const tagE = clampRange(Number(this.tagBias.energyBias ?? 0), -0.2, 0.2);
    delta += tagE;
    // BPM → 能量（90..150 线性映射到 0..+0.3）
    if (typeof this.nowBpm === 'number') {
      const eFromBpm = clamp01((this.nowBpm - 90) / 60) * 0.3; // 90→0, 150→0.3
      delta += eFromBpm - 0.15; // 居中
    }
    // Camelot 模式轻微影响能量：Major(+0.03)/Minor(-0.01)
    if (this.nowKeyCamelot) {
      const mode = /[AB]$/.exec(this.nowKeyCamelot)?.[0];
      if (mode === 'B') delta += 0.03; else if (mode === 'A') delta -= 0.01;
    }
    return clampRange(delta, -0.25, 0.35);
  }

  private deriveValenceAdjustment(): number {
    let delta = 0;
    const tagV = clampRange(Number(this.tagBias.valenceBias ?? 0), -0.3, 0.3);
    delta += tagV;
    if (this.nowKeyCamelot) {
      const mode = /[AB]$/.exec(this.nowKeyCamelot)?.[0];
      if (mode === 'B') delta += 0.1; // Major 更明亮
      if (mode === 'A') delta -= 0.05; // Minor 更暗
    }
    return clampRange(delta, -0.3, 0.3);
  }

  private deriveArousalAdjustment(): number {
    const tagA = clampRange(Number(this.tagBias.arousalBias ?? 0), -0.2, 0.2);
    return tagA;
  }

  // === 切歌手法桥接系统方法 ===
  private subscribeTechniqueBridge(): void {
    // 订阅电台遥测事件
    UnifiedEventBus.on('radio', 'telemetry', (e) => {
      try {
        const d = (e as any)?.data || {};
        if (typeof d.dropoutRate === 'number') this.telemetry.dropoutRate = d.dropoutRate;
        if (typeof d.recentErrors === 'number') this.telemetry.recentErrors = d.recentErrors;
        if (typeof d.simpleHeadTail === 'boolean') this.telemetry.simpleHeadTail = d.simpleHeadTail;
      } catch {}
    });

    // 订阅段落推进事件
    UnifiedEventBus.on('automix', 'transition', (e) => {
      try {
        const seg = String((e as any)?.data?.segment || '').toLowerCase();
        if (seg === 'build' || seg === 'fill' || seg === 'drop' || seg === 'steady') {
          this.nowPlaying.segment = seg as any;
        } else {
          // 若无 segment 字段则轮换
          const order = ['steady','build','fill','drop'] as const;
          const idx = order.indexOf((this.nowPlaying.segment as any) || 'steady');
          this.nowPlaying.segment = order[(idx + 1) % order.length] as any;
        }
        if (this.cfg.enableTechniqueBridge) {
          this.emitTechniqueRecommend('transition');
        }
      } catch {}
    });
  }

  private emitTechniqueRecommend(from: 'themeTick'|'transition'): void {
    // 这里将调用AidjMix的chooseTechnique函数
    // 暂时使用占位实现，后续集成真实模块
    const techniqueRecommendation = {
      technique: 'simple_head_tail',
      hint: { beats: 16, hintVersion: 'emotion-core-v1' },
      reason: ['emotion-core:default'],
      from,
      contextSnapshot: {
        bpmFrom: this.nowPlaying.bpm || this.bpm || 128,
        bpmTo: this.nowPlaying.bpm || this.bpm || 128,
        keyFrom: this.nowPlaying.keyCamelot,
        keyTo: this.nowPlaying.keyCamelot,
        segment: this.nowPlaying.segment || 'steady',
        vocality: 0,
        simpleHeadTail: !!this.telemetry.simpleHeadTail,
        dropoutRate: this.telemetry.dropoutRate,
        recentErrors: this.telemetry.recentErrors,
        emotion: { ...this.mood }
      }
    };

    // === 修复：使用正确的事件发射方法 ===
    UnifiedEventBus.emitTechniqueRecommend(techniqueRecommendation);
  }

  // === 随机算法集成方法 ===
  private initializeRandomAlgorithm(): void {
    try {
      if (this.cfg.enableRandomAlgorithm) {
        // 这些模块在构造函数中自动初始化，不需要手动调用init
        
        // 设置情绪状态到随机集成模块
        this.randomEmotionIntegration.setEmotionState(
          this.mood.energy,
          this.mood.valence,
          this.mood.arousal
        );
        
        this.isRandomAlgorithmInitialized = true;
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('[emotion-core] 随机算法集成初始化完成');
        }
      }
    } catch (error) {
      console.error('[emotion-core] 随机算法集成初始化失败:', error);
    }
  }

  private updateRandomAlgorithmWithEmotion(): void {
    if (!this.cfg.enableRandomAlgorithm || !this.isRandomAlgorithmInitialized) {
      return;
    }
    
    try {
      // 更新随机情绪集成模块的情绪状态
      this.randomEmotionIntegration.setEmotionState(
        this.mood.energy,
        this.mood.valence,
        this.mood.arousal
      );
      
      // 触发随机性更新
      this.randomEmotionIntegration.triggerRandomnessUpdate();
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('[emotion-core] 随机算法情绪状态已更新');
      }
    } catch (error) {
      console.error('[emotion-core] 更新随机算法情绪状态失败:', error);
    }
  }
}

export default EmotionCoreManager;

// =============== 工具函数 ===============
function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }
function clampRange(x: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, x)); }


