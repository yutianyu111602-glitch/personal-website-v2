/**
 * AutoMixManager - AI DJ 混音器接入管理器
 *
 * 职责：
 * - 包装 UnifiedTechnoMoodCore（统一心脏），接收情绪/能量/BPM/过渡事件
 * - 定期从 /api/nowplaying 拉取曲目信息，打通 bpm/segment 等参数
 * - 定时推进核心 stepOnce，输出可视化预设（visualization:preset）
 * - 不直接控制音频，仅通过事件总线协作
 */

import type { Manager } from './ManagerTypes';
import { UnifiedEventBus, onMood, onEnergy, onBpm, onTransition } from '../components/events/UnifiedEventBus';
import { UnifiedCore } from '../vis/UnifiedTechnoMoodCore';
import type { Mood as UCMood, AudioFeatures, NowPlaying, Perf, Preset, BlendPipeline } from '../vis/UnifiedTechnoMoodCore';

type PartialMood = Partial<UCMood>;

export class AutoMixManager implements Manager {
  readonly id = 'automix' as const;

  private core: UnifiedCore;
  private unsubscribes: Array<() => void> = [];
  private intervalIds: Array<number> = [];

  // 运行时状态（非持久）：
  private mood: UCMood = { energy: 0.6, valence: 0.0, arousal: 0.5 };
  private bpm: number = 126;
  private energy: number = 0.6;
  private nowPlaying: NowPlaying = { title: 'Demo Track', artist: 'Tiangong', bpm: 126, startedAt: Date.now(), segment: 'steady' };
  private perf: Perf = { avgFrameMs: 16.67 };
  private lastPresetId?: string;

  constructor() {
    // 可在此注入配置（步进 16）
    this.core = new UnifiedCore({ technoSteps: 16 });
  }

  init(): void {
    // 订阅情绪/能量/BPM
    this.unsubscribes.push(
      onMood((e) => {
        const m = e.data?.mood as PartialMood | undefined;
        if (m) this.mood = { ...this.mood, ...m };
      })
    );
    this.unsubscribes.push(
      onEnergy((e) => {
        const v = e.data?.energy as number | undefined;
        if (typeof v === 'number') this.energy = v;
      })
    );
    this.unsubscribes.push(
      onBpm((e) => {
        const b = e.data?.bpm as number | undefined;
        if (typeof b === 'number') this.bpm = b;
      })
    );
    this.unsubscribes.push(
      onTransition((e) => {
        // 简单处理：切歌或跨混指令到达时，重置起始时间并推进段落
        const action = e.data?.action as 'next' | 'prev' | 'crossfade' | undefined;
        if (action) {
          this.nowPlaying.startedAt = Date.now();
          this.bumpSegment();
        }
      })
    );
  }

  start(): void {
    // 定时拉取 NowPlaying
    const id1 = window.setInterval(() => this.fetchNowPlaying().catch(() => {}), 5000);
    // 定时推进核心
    const id2 = window.setInterval(() => this.tickCore(), 500);
    this.intervalIds.push(id1, id2);
  }

  stop(): void {
    this.intervalIds.forEach((id) => window.clearInterval(id));
    this.intervalIds = [];
  }

  dispose(): void {
    this.stop();
    this.unsubscribes.forEach((u) => { try { u(); } catch {} });
    this.unsubscribes = [];
  }

  // 从后端代理拉取正在播放
  private async fetchNowPlaying(): Promise<void> {
    try {
      const res = await fetch('/api/nowplaying', { cache: 'no-store' });
      if (!res.ok) return;
      const np = await res.json();
      const bpm = typeof np?.bpm === 'number' ? np.bpm : this.bpm;
      this.bpm = bpm;
      this.nowPlaying = {
        title: np?.title,
        artist: np?.artist,
        bpm,
        startedAt: this.nowPlaying.startedAt ?? Date.now(),
        segment: this.nowPlaying.segment ?? 'steady',
        trackId: np?.trackId || undefined
      };
      // 可选：广播 BPM 变更（让其他模块感知）
      if (typeof bpm === 'number') {
        // 避免循环风暴：速率受总线节流保护
        UnifiedEventBus.emitBpm(bpm);
      }
    } catch {}
  }

  // 推进核心一次
  private tickCore(): void {
    const now = performance.now();
    const af: AudioFeatures = this.deriveAudioFeatures(now);
    const mood: UCMood = { energy: this.energy, valence: this.mood.valence, arousal: this.mood.arousal };
    const pipeline: BlendPipeline = this.core.stepOnce(now, mood, af, this.nowPlaying, this.perf as any, this.pickPresets());

    // 如果产生了新的预设，广播给前端（App 会订阅 onPreset 并切背景）
    if (pipeline?.presetId && pipeline.presetId !== this.lastPresetId) {
      this.lastPresetId = pipeline.presetId;
      UnifiedEventBus.emitPreset(this.mapPresetToName(pipeline.presetId));
    }

    // 广播完整 effect（可选：供 VisualizationEffectManager 直接读取 pipeline）
    UnifiedEventBus.emit({
      namespace: 'visualization',
      type: 'effect',
      timestamp: Date.now(),
      data: { pipeline }
    } as any);
  }

  // 简易音频特征推导（无分析器时的保底策略）
  private deriveAudioFeatures(nowMs: number): AudioFeatures {
    const beatDurMs = this.bpm > 0 ? (60_000 / this.bpm) : 500;
    const phase = ((nowMs % beatDurMs) / beatDurMs);
    const beat = phase > 0.9 ? 1 : 0; // 简单触发器
    const base = this.energy;
    return {
      sub: 0.25 + 0.25 * base,
      bass: 0.35 + 0.35 * base,
      lowMid: 0.3 + 0.3 * base,
      mid: 0.35 + 0.3 * base,
      highMid: 0.3 + 0.25 * base,
      presence: 0.35 + 0.3 * base,
      brilliance: 0.3 + 0.25 * base,
      air: 0.25 + 0.2 * base,
      centroid: 0.4 + 0.2 * base,
      flux: 0.25 + 0.3 * Math.abs(Math.sin(nowMs / 1000)),
      crest: 0.25 + 0.3 * Math.abs(Math.cos(nowMs / 1200)),
      beat,
      rms: 0.35 + 0.25 * base,
      silence: base < 0.05,
    };
  }

  // 可扩展：从配置/策略包获取预设集合
  private pickPresets(): Preset[] {
    // 先返回空数组，交由核心根据情绪与标记选择默认组合；未来可从 vis/strategy/ 加载
    return [];
  }

  // 将核心产出的 presetId 映射为前端背景名（与 App 内 mapping 对齐）
  private mapPresetToName(presetId: string): string {
    // 简单映射：按能量/段落倾向映射到五套背景
    const seg = this.nowPlaying.segment;
    if (seg === 'break') return 'silver_pure';
    if (seg === 'build') return 'silver_mist';
    if (seg === 'fill') return 'liquid_chrome';
    if (seg === 'drop') return 'metallic_flow';
    return 'cosmic_silver';
  }

  // 轮换段落，便于在无真实分析时也能演进
  private bumpSegment(): void {
    const order: NowPlaying['segment'][] = ['steady', 'build', 'fill', 'drop', 'steady'];
    const idx = order.indexOf(this.nowPlaying.segment || 'steady');
    this.nowPlaying.segment = order[(idx + 1) % order.length];
  }
}

export default AutoMixManager;


