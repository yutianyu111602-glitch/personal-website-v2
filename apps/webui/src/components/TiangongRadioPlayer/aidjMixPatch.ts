/**
 * AidjMix 0侵入补丁包集成模块
 * 
 * 功能：
 * - 情绪/能量/BPM/段落推导切歌手法建议
 * - automix过渡事件路由到电台REST API
 * - 可选从/api/nowplaying同步BPM/键位
 * - 预设命名与UI背景保持一致
 * 
 * 特点：
 * - 完全0侵入，不影响现有功能
 * - 支持一键启用/禁用
 * - 具备完整退路机制
 */

// 类型定义
export type TransitionAction = 'next' | 'prev' | 'crossfade';

export interface RouterAdapterConfig {
  ENDPOINT_NEXT: string;
  ENDPOINT_PREV: string;
  ENDPOINT_CROSSF?: string;
  ENDPOINT_VOLUME?: string;
  DEFAULT_CROSSFADE_MS?: number;
  SAFETY_RATE_LIMIT_MS?: number;
}

export interface TransitionEventPayload {
  action: TransitionAction;
  durationMs?: number;
  fromTrack?: string;
  toTrack?: string;
  reason?: string;
}

export interface VolumeEventPayload { 
  level: number; 
}

export interface NowPlaying {
  title?: string;
  artist?: string;
  bpm?: number;
  keyCamelot?: string;
  trackId?: string | number;
  segment?: 'steady'|'build'|'fill'|'drop'|'break';
}

export interface TechniqueRecommendation {
  technique: string;
  hint?: any;
  reason: string[];
}

export interface TechniqueBridgeConfig {
  enable?: boolean;
  minBpmForDoubleDrop?: number;
  crossfadeMs?: number;
  EventBus: any;
}

export interface MirrorConfig {
  NOWPLAYING_URL: string;
  INTERVAL_MS?: number;
  EventBus: any;
}

export type PresetName = 'silver_pure'|'silver_mist'|'liquid_chrome'|'metallic_flow'|'cosmic_silver';

// 情绪技术桥接器
export class EmotionTechniqueBridge {
  private bpm = 126;
  private mood: { energy: number; valence: number; arousal: number } = { energy: 0.6, valence: 0, arousal: 0.5 };
  private segment: 'steady'|'build'|'fill'|'drop'|'break' = 'steady';
  private cfg: Required<TechniqueBridgeConfig>;

  constructor(cfg: TechniqueBridgeConfig) {
    this.cfg = {
      enable: cfg.enable ?? true,
      minBpmForDoubleDrop: cfg.minBpmForDoubleDrop ?? 140,
      crossfadeMs: cfg.crossfadeMs ?? 4000,
      EventBus: cfg.EventBus
    };
  }

  attach() {
    const bus = this.cfg.EventBus;
    if (!bus) return;

    console.log('🎯 AidjMix: 情绪技术桥接器已启用');

    // 订阅情绪/能量/BPM/过渡
    bus.on('mood', 'update', (e: any) => {
      const m = e?.data?.mood; 
      if (!m) return;
      this.mood = { ...this.mood, ...m };
      this.tick();
    });

    bus.on('bpm', 'update', (e: any) => {
      const b = Number(e?.data?.bpm); 
      if (!Number.isFinite(b)) return;
      this.bpm = b; 
      this.tick();
    });

    bus.on('automix', 'transition', (e: any) => {
      const seg = e?.data?.segment; 
      if (seg) this.segment = seg;
      this.tick();
    });

    // 订阅可视化段落
    bus.on('visualization', 'effect', (e: any) => {
      const seg = e?.data?.pipeline?.segment; 
      if (seg) this.segment = seg;
    });

    // 启动时广播一次
    this.tick();
  }

  private tick() {
    if (!this.cfg.enable) return;
    const rec = this.choose();
    this.cfg.EventBus.emit({
      namespace: 'automix',
      type: 'technique_recommend',
      timestamp: Date.now(),
      data: rec
    });
  }

  private choose(): TechniqueRecommendation {
    const { bpm, mood, segment } = this;
    const reason: string[] = [];
    const energy = mood.energy, arousal = mood.arousal;

    // 1) 兜底：若无 bpm → 极简稳定手法
    if (!Number.isFinite(bpm) || bpm <= 0) {
      reason.push('no_bpm');
      return { 
        technique: 'simple_head_tail', 
        hint: { crossfadeMs: this.cfg.crossfadeMs }, 
        reason 
      };
    }

    // 2) 高速 + 高能量 + drop 段落 → 双落
    if (bpm >= this.cfg.minBpmForDoubleDrop && energy >= 0.7 && (segment === 'drop' || arousal >= 0.7)) {
      reason.push('high_bpm', 'high_energy', 'drop_segment');
      return { 
        technique: 'double_drop_32', 
        hint: { bars: 32 }, 
        reason 
      };
    }

    // 3) 中高能量 & build/fill → 16 拍短切
    if (energy >= 0.55 && (segment === 'build' || segment === 'fill' || arousal >= 0.6)) {
      reason.push('mid_energy', 'build_or_fill');
      return { 
        technique: 'phrase_cut_16', 
        hint: { bars: 16 }, 
        reason 
      };
    }

    // 4) 低能量 / 稳态 → 24/32 拍长层叠
    if (energy < 0.45 || segment === 'steady' || segment === 'break') {
      reason.push('low_energy_or_steady');
      return { 
        technique: 'long_layer_24', 
        hint: { bars: 24 }, 
        reason 
      };
    }

    // 5) 默认：安全 crossfade
    reason.push('default_fallback');
    return { 
      technique: 'simple_head_tail', 
      hint: { crossfadeMs: this.cfg.crossfadeMs }, 
      reason 
    };
  }
}

// 自动混音路由适配器
export class AutoMixRouterAdapter {
  private cfg: Required<RouterAdapterConfig>;
  private lastAt = 0;
  private attached = false;

  constructor(cfg: RouterAdapterConfig) {
    this.cfg = {
      ENDPOINT_NEXT: cfg.ENDPOINT_NEXT,
      ENDPOINT_PREV: cfg.ENDPOINT_PREV,
      ENDPOINT_CROSSF: cfg.ENDPOINT_CROSSF,
      ENDPOINT_VOLUME: cfg.ENDPOINT_VOLUME,
      DEFAULT_CROSSFADE_MS: cfg.DEFAULT_CROSSFADE_MS ?? 4000,
      SAFETY_RATE_LIMIT_MS: cfg.SAFETY_RATE_LIMIT_MS ?? 1200,
    } as Required<RouterAdapterConfig>;
  }

  attach() {
    if (this.attached) return;
    this.attached = true;

    const Bus: any = (window as any).UnifiedEventBus;
    if (!Bus || typeof Bus.on !== 'function') {
      console.warn('[AidjMix] UnifiedEventBus missing, adapter idle');
      return;
    }

    Bus.on('automix', 'transition', (e: any) => this.onTransition(e));
    Bus.on('playback', 'volume', (e: any) => this.onVolume(e));
    console.log('🎯 AidjMix: 自动混音路由适配器已启用');
  }

  private async onTransition(e: any) {
    const now = Date.now();
    if (now - this.lastAt < this.cfg.SAFETY_RATE_LIMIT_MS) return; // 防抖
    this.lastAt = now;

    const data: TransitionEventPayload = e?.data || {};
    const action = data.action;
    
    try {
      if (action === 'next' && this.cfg.ENDPOINT_NEXT) {
        await fetch(this.cfg.ENDPOINT_NEXT, { cache: 'no-store' });
        console.log('🎯 AidjMix: 下一曲事件已路由');
      } else if (action === 'prev' && this.cfg.ENDPOINT_PREV) {
        await fetch(this.cfg.ENDPOINT_PREV, { cache: 'no-store' });
        console.log('🎯 AidjMix: 上一曲事件已路由');
      } else if (action === 'crossfade' && this.cfg.ENDPOINT_CROSSF) {
        const dur = data.durationMs ?? this.cfg.DEFAULT_CROSSFADE_MS;
        const url = this.cfg.ENDPOINT_CROSSF.replace('{ms}', String(dur));
        await fetch(url, { cache: 'no-store' });
        console.log('🎯 AidjMix: 交叉淡入事件已路由');
      }
    } catch (err) {
      console.warn('[AidjMix] transition failed', err);
    }
  }

  private async onVolume(e: any) {
    if (!this.cfg.ENDPOINT_VOLUME) return;
    const data: VolumeEventPayload = e?.data || {};
    const v = data.level;
    if (typeof v !== 'number') return;
    
    try {
      const url = this.cfg.ENDPOINT_VOLUME.replace('{v}', String(v));
      await fetch(url, { cache: 'no-store' });
      console.log('🎯 AidjMix: 音量事件已路由');
    } catch (err) {
      console.warn('[AidjMix] volume failed', err);
    }
  }
}

// 当前播放镜像器
export class NowPlayingMirror {
  private id: number | null = null;
  private lastKey = '';
  private interval = 5000;

  constructor(private cfg: MirrorConfig) {
    this.interval = cfg.INTERVAL_MS ?? 5000;
  }

  attach() {
    if (this.id != null) return;
    const bus = this.cfg.EventBus;
    if (!bus) return;
    
    this.id = window.setInterval(() => this.tick().catch(() => {}), this.interval);
    this.tick().catch(() => {});
    console.log('🎯 AidjMix: 当前播放镜像器已启用');
  }

  detach() {
    if (this.id != null) { 
      clearInterval(this.id); 
      this.id = null; 
    }
  }

  private async tick() {
    try {
      const res = await fetch(this.cfg.NOWPLAYING_URL, { cache: 'no-store' });
      if (!res.ok) return;
      
      const np: NowPlaying = await res.json();
      const key = `${np.artist || ''} - ${np.title || ''} @${np.bpm || ''}`;
      
      if (key && key !== this.lastKey) {
        this.lastKey = key;
        this.cfg.EventBus.emit({
          namespace: 'automix',
          type: 'transition',
          timestamp: Date.now(),
          data: { 
            action: 'next', 
            toTrack: key, 
            segment: np.segment || 'steady' 
          }
        });
      }
      
      if (typeof np.bpm === 'number') {
        this.cfg.EventBus.emit({
          namespace: 'bpm',
          type: 'update',
          timestamp: Date.now(),
          data: { bpm: np.bpm }
        });
      }
    } catch (err) {
      // 静默处理错误，避免影响主流程
    }
  }
}

// 安全预设映射器
export function mapPresetIdToUiName(presetId?: string, fallback: PresetName = 'cosmic_silver'): PresetName {
  if (!presetId) return fallback;
  const id = String(presetId).toLowerCase();
  
  if (id.includes('break')) return 'silver_pure';
  if (id.includes('build')) return 'silver_mist';
  if (id.includes('fill')) return 'liquid_chrome';
  if (id.includes('drop') || id.includes('flow')) return 'metallic_flow';
  if (id.includes('silver') || id.includes('cosmic')) return 'cosmic_silver';
  
  return fallback;
}

// 补丁包管理器
export class AidjMixPatchManager {
  private techniqueBridge: EmotionTechniqueBridge | null = null;
  private routerAdapter: AutoMixRouterAdapter | null = null;
  private nowPlayingMirror: NowPlayingMirror | null = null;
  private isEnabled = false;

  constructor(private eventBus: any) {}

  // 启用补丁包
  enable(config: {
    enableTechniqueBridge?: boolean;
    enableRouterAdapter?: boolean;
    enableNowPlayingMirror?: boolean;
    routerConfig?: RouterAdapterConfig;
    mirrorConfig?: MirrorConfig;
  } = {}) {
    if (this.isEnabled) return;
    
    console.log('🎯 AidjMix: 开始启用补丁包...');
    
    // 启用情绪技术桥接器
    if (config.enableTechniqueBridge !== false) {
      this.techniqueBridge = new EmotionTechniqueBridge({
        enable: true,
        minBpmForDoubleDrop: 140,
        crossfadeMs: 4000,
        EventBus: this.eventBus
      });
      this.techniqueBridge.attach();
    }

    // 启用自动混音路由适配器
    if (config.enableRouterAdapter !== false) {
      const routerConfig: RouterAdapterConfig = {
        ENDPOINT_NEXT: '/api/music/next',
        ENDPOINT_PREV: '/api/music/previous',
        ENDPOINT_CROSSF: '/api/music/crossfade?duration={ms}',
        ENDPOINT_VOLUME: '/api/music/volume?level={v}',
        DEFAULT_CROSSFADE_MS: 4000,
        SAFETY_RATE_LIMIT_MS: 1200,
        ...config.routerConfig
      };
      
      this.routerAdapter = new AutoMixRouterAdapter(routerConfig);
      this.routerAdapter.attach();
    }

    // 启用当前播放镜像器
    if (config.enableNowPlayingMirror !== false) {
      const mirrorConfig: MirrorConfig = {
        NOWPLAYING_URL: '/api/nowplaying',
        INTERVAL_MS: 5000,
        EventBus: this.eventBus,
        ...config.mirrorConfig
      };
      
      this.nowPlayingMirror = new NowPlayingMirror(mirrorConfig);
      this.nowPlayingMirror.attach();
    }

    this.isEnabled = true;
    console.log('🎯 AidjMix: 补丁包已启用');
  }

  // 禁用补丁包
  disable() {
    if (!this.isEnabled) return;
    
    console.log('🎯 AidjMix: 开始禁用补丁包...');
    
    if (this.nowPlayingMirror) {
      this.nowPlayingMirror.detach();
      this.nowPlayingMirror = null;
    }
    
    this.techniqueBridge = null;
    this.routerAdapter = null;
    this.isEnabled = false;
    
    console.log('🎯 AidjMix: 补丁包已禁用');
  }

  // 获取当前状态
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      techniqueBridge: !!this.techniqueBridge,
      routerAdapter: !!this.routerAdapter,
      nowPlayingMirror: !!this.nowPlayingMirror
    };
  }
}
