/**
 * EmotionCoreManager —— 情绪核心统一管理器（脚手架 + 可选“情绪→手法建议”桥接）
 *
 * 约束：
 * - 不改端口；不绑定真实事件总线；变量与环境名全部留空（Cursor 填写）。
 * - 默认不启用统一主循环与桥接；开启需在 new 时传配置。
 */

import type { Manager } from './ManagerTypes'; // ← 你的项目内已有；若路径不同，Cursor 替换
import { BusAdapter, onMood, onEnergy, onBpm, onTransition, emit, emitPreset } from '../bridge/BusAdapter';
import type { NowPlaying, RadioTelemetry } from '../types/shared';
import { chooseTechnique } from '../console/techniqueSelector';

export type EmotionCoreConfig = {
  tickIntervalMs?: number;            // 主循环步进间隔（默认 500）
  enableUnifiedLoop?: boolean;        // 是否启用统一主循环（默认 false）
  enableNowPlayingPull?: boolean;     // 是否内嵌 nowplaying 拉取（默认 false）
  enableTechniqueBridge?: boolean;    // 是否开启“情绪→手法建议”桥接（默认 false）
  conservativeDropout?: number;       // 抖动阈值（默认 0.05）
  // === 留空变量（Cursor 填写） ===
  AUTODJ_STATUS_URL?: string;         // 例如：'/api/autodj/status'（为空时不拉取）
  NOWPLAYING_URL?: string;            // 例如：'/api/nowplaying'（为空时不拉取）
};

const DEFAULT_CFG: Required<Omit<EmotionCoreConfig,
  'AUTODJ_STATUS_URL'|'NOWPLAYING_URL'>> & { AUTODJ_STATUS_URL?: string; NOWPLAYING_URL?: string } = {
  tickIntervalMs: 500,
  enableUnifiedLoop: false,
  enableNowPlayingPull: false,
  enableTechniqueBridge: false,
  conservativeDropout: 0.05,
  AUTODJ_STATUS_URL: undefined,
  NOWPLAYING_URL: undefined,
};

export class EmotionCoreManager implements Manager {
  readonly id = 'emotion-core' as const;
  private cfg: Required<typeof DEFAULT_CFG>;
  private loopId: number | null = null;

  // 运行态
  private mood = { energy: 0.6, valence: 0.0, arousal: 0.5 };
  private energy = 0.6;
  private bpm = 126;
  private now: NowPlaying = { bpm: 126, keyCamelot: '8A', startedAt: Date.now(), segment: 'steady' };
  private telemetry: RadioTelemetry = { dropoutRate: 0, recentErrors: 0, simpleHeadTail: false };
  private tagBias: { energyBias?: number; valenceBias?: number; arousalBias?: number } = {};

  constructor(cfg: EmotionCoreConfig = {}) {
    this.cfg = { ...DEFAULT_CFG, ...cfg } as any;
  }

  init(): void {
    // 不做副作用；仅在启用统一模式时订阅
    if (this.cfg.enableUnifiedLoop) {
      this.subscribeInputs();
      // 可选：订阅可视化 effect 提取 tagBias（Cursor 可改路径/事件名）
      BusAdapter.on('visualization', 'effect', (e) => {
        try {
          const pipeline = (e as any)?.data?.pipeline;
          if (!pipeline) return;
          this.tagBias = this.extractTagBiasFromPipeline(pipeline);
          this.emitThemeTokens();
        } catch {}
      });

      // 电台遥测（Cursor 把广播放在任意合适位置）
      BusAdapter.on('radio','telemetry',(e)=>{
        const d = (e as any)?.data || {};
        if (typeof d.dropoutRate === 'number') this.telemetry.dropoutRate = d.dropoutRate;
        if (typeof d.recentErrors === 'number') this.telemetry.recentErrors = d.recentErrors;
        if (typeof d.simpleHeadTail === 'boolean') this.telemetry.simpleHeadTail = d.simpleHeadTail;
      });

      // 段落推进（来自你的 automix 过渡事件）
      onTransition((e)=>{
        const seg = String((e as any)?.data?.segment || '').toLowerCase();
        if (seg === 'build' || seg === 'fill' || seg === 'drop' || seg === 'steady') {
          this.now.segment = seg as any;
        } else {
          // 若无 segment 字段则轮换
          const order = ['steady','build','fill','drop'] as const;
          const idx = order.indexOf((this.now.segment as any) || 'steady');
          this.now.segment = order[(idx + 1) % order.length] as any;
        }
        if (this.cfg.enableTechniqueBridge) this.emitTechniqueRecommend('transition');
      });
    }
  }

  start(): void {
    if (this.cfg.enableUnifiedLoop && this.loopId == null) {
      this.loopId = window.setInterval(() => {
        if (this.cfg.enableNowPlayingPull) this.pullAutoDjStatus().catch(()=>{});
        // tick 心跳：用于维持最新主题广播
      }, this.cfg.tickIntervalMs);
    }
  }

  stop(): void { if (this.loopId != null) { window.clearInterval(this.loopId); this.loopId = null; } }
  dispose(): void { this.stop(); }

  // ===== 订阅输入 =====
  private subscribeInputs(): void {
    onMood((e) => { const m = (e as any)?.data?.mood; if (m) { this.mood = { ...this.mood, ...m }; this.emitThemeTokens(); } });
    onEnergy((e) => { const v = (e as any)?.data?.energy; if (typeof v === 'number') { this.energy = v; this.emitThemeTokens(); } });
    onBpm((e) => { const b = (e as any)?.data?.bpm; if (typeof b === 'number') { this.bpm = b; this.now.bpm = b; } });
    // 首次广播
    this.emitThemeTokens();
  }

  // ===== 主题推导与广播 =====
  private emitThemeTokens(): void {
    const eAdj = this.deriveEnergyAdjustment();
    const vAdj = this.deriveValenceAdjustment();
    const aAdj = this.deriveArousalAdjustment();
    const energy = clamp01(this.mood.energy + eAdj);
    const valence = clampRange(this.mood.valence + vAdj, -1, 1);
    const arousal = clamp01(this.mood.arousal + aAdj);
    const t = this.mapMoodToTokens(energy, valence, arousal);
    emit({ namespace:'global', type:'config', data:{ theme: t } });

    const preset = this.pickPresetByTheme(t);
    emitPreset(preset);

    if (this.cfg.enableTechniqueBridge) this.emitTechniqueRecommend('themeTick');
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

  private pickPresetByTheme(theme: { intensity:number; motion:number; contrast:number }) {
    const { intensity, motion, contrast } = theme;
    if (intensity < 0.35 && contrast < 0.4) return 'silver_pure';
    if (motion < 0.45 && intensity < 0.55) return 'silver_mist';
    if (intensity > 0.75 && motion > 0.6) return 'metallic_flow';
    if (contrast > 0.65) return 'cosmic_silver';
    return 'liquid_chrome';
  }

  // ===== 手法建议广播 =====
  private emitTechniqueRecommend(from: 'themeTick'|'transition'): void {
    const ctx = {
      bpmFrom: this.now.bpm || this.bpm || 128,
      bpmTo: this.now.bpm || this.bpm || 128,
      keyFrom: this.now.keyCamelot,
      keyTo: this.now.keyCamelot,
      segment: (this.now.segment as any) || 'steady',
      vocality: 0, // 若你有分析链路，可通过 Bus 填写
      simpleHeadTail: !!this.telemetry.simpleHeadTail,
      dropoutRate: this.telemetry.dropoutRate,
      recentErrors: this.telemetry.recentErrors,
      emotion: { ...this.mood },
    };
    const decision = chooseTechnique(ctx);
    emit({
      namespace:'automix',
      type:'technique_recommend',
      data:{ technique: decision.technique, hint: decision.hint, reason: decision.reason, from, contextSnapshot: ctx }
    });
  }

  // ===== 可选拉取（留空 URL 即跳过） =====
  private async pullAutoDjStatus(): Promise<void> {
    try {
      if (this.cfg.AUTODJ_STATUS_URL) {
        const r = await fetch(this.cfg.AUTODJ_STATUS_URL, { cache: 'no-store' as RequestCache });
        if (r.ok) {
          const js = await r.json();
          const np = js?.nowplaying || {};
          this.now.keyCamelot = String(np?.keyCamelot || '').trim() || this.now.keyCamelot;
        }
      }
      if (this.cfg.NOWPLAYING_URL) {
        const r2 = await fetch(this.cfg.NOWPLAYING_URL, { cache: 'no-store' as RequestCache });
        if (r2.ok) {
          const j2 = await r2.json();
          const bpm = Number(j2?.bpm);
          if (Number.isFinite(bpm)) { this.bpm = bpm; this.now.bpm = bpm; }
        }
      }
    } catch {}
  }

  // ===== 辅助：tagBias 聚合与情绪偏置 =====
  private extractTagBiasFromPipeline(pipeline: any): { energyBias?: number; valenceBias?: number; arousalBias?: number } {
    const agg = { e:0, v:0, a:0, n:0 };
    const push = (tags?: any)=>{
      if(!tags) return;
      agg.e += Number(tags.energyBias ?? 0);
      agg.v += Number(tags.valenceBias ?? 0);
      agg.a += Number(tags.arousalBias ?? 0);
      agg.n += 1;
    };
    if (pipeline?.tags) push(pipeline.tags);
    if (Array.isArray(pipeline?.nodes)) for (const n of pipeline.nodes) push(n?.tags);
    if (!agg.n) return {};
    return { energyBias: agg.e/agg.n, valenceBias: agg.v/agg.n, arousalBias: agg.a/agg.n };
  }

  private deriveEnergyAdjustment(): number {
    let delta = 0;
    const tagE = clampRange(Number(this.tagBias.energyBias ?? 0), -0.2, 0.2);
    delta += tagE;
    if (typeof this.bpm === 'number') {
      const eFromBpm = clamp01((this.bpm - 90) / 60) * 0.3;
      delta += eFromBpm - 0.15;
    }
    if (this.now.keyCamelot) {
      const mode = /[AB]$/.exec(this.now.keyCamelot)?.[0];
      if (mode === 'B') delta += 0.03; else if (mode === 'A') delta -= 0.01;
    }
    return clampRange(delta, -0.25, 0.35);
  }
  private deriveValenceAdjustment(): number {
    let delta = 0;
    const tagV = clampRange(Number(this.tagBias.valenceBias ?? 0), -0.3, 0.3);
    delta += tagV;
    if (this.now.keyCamelot) {
      const mode = /[AB]$/.exec(this.now.keyCamelot)?.[0];
      if (mode === 'B') delta += 0.1;
      if (mode === 'A') delta -= 0.05;
    }
    return clampRange(delta, -0.3, 0.3);
  }
  private deriveArousalAdjustment(): number {
    return clampRange(Number(this.tagBias.arousalBias ?? 0), -0.2, 0.2);
  }
}

// 工具函数
function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }
function clampRange(x: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, x)); }

export default EmotionCoreManager;
