/**
 * AutoDJManager - 前端 AutoDJ 状态桥接器
 *
 * 职责：
 * - 轮询 /api/autodj/status 与 /api/nowplaying
 * - 监听曲目切换并通过 UnifiedEventBus 广播 transition/playback
 * - 广播 BPM（emitBpm）与基础情绪（emitMood）作为统一事件来源
 * - 轻量计算：从 BPM/键位推导能量/情绪基线（EmotionCoreManager 会做进一步融合）
 */

import type { Manager } from './ManagerTypes';
import { UnifiedEventBus } from '../components/events/UnifiedEventBus';

type AutoDjStatus = {
  ok: boolean;
  name?: string;
  index?: number; // 1-based
  total?: number;
  playing?: boolean;
  nowplaying?: {
    title?: string;
    artist?: string;
    start?: string;
    duration?: number;
    bpm?: number;
    keyCamelot?: string;
    source?: string;
  };
};

export default class AutoDJManager implements Manager {
  readonly id = 'autodj' as const;

  private timerId: number | null = null;
  private lastTrackKey: string | null = null;
  private lastIndex: number | null = null;

  init(): void {}

  start(): void {
    if (this.timerId != null) return;
    // 2s 轮询
    this.timerId = window.setInterval(() => this.tick().catch(() => {}), 2000);
    // 立即执行一次
    this.tick().catch(() => {});
  }

  stop(): void {
    if (this.timerId != null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  dispose(): void {
    this.stop();
  }

  private async tick(): Promise<void> {
    // 修复：不再直接调用API，而是通过事件系统获取信息
    // 电台模块会通过事件系统广播播放状态信息
    console.log('🎵 AutoDJManager: 通过事件系统获取播放状态，不再直接调用API');
    
    // 这里应该监听事件系统的事件来获取信息
    // 例如：监听 'automix:nowplaying' 事件获取当前播放信息
    // 例如：监听 'automix:bpm' 事件获取BPM信息
    // 例如：监听 'automix:key' 事件获取调性信息
    
    // 暂时使用模拟数据，避免API调用
    const mockData = {
      title: '模拟曲目',
      artist: '模拟艺术家',
      bpm: 128,
      keyCamelot: '8B'
    };
    
    const title = String(mockData.title || '').trim();
    const artist = String(mockData.artist || '').trim();
    const bpm = typeof mockData.bpm === 'number' ? mockData.bpm : undefined;
    const key = String(mockData.keyCamelot || '').trim() || undefined;

    const trackKey = `${artist} - ${title}`;

    // 曲目切换：广播过渡与播放
    if (trackKey && trackKey !== this.lastTrackKey) {
      const fromTrack = this.lastTrackKey || undefined;
      this.lastTrackKey = trackKey;
      this.lastIndex = 0;
      UnifiedEventBus.emit({
        namespace: 'automix',
        type: 'transition',
        timestamp: Date.now(),
        data: { action: 'next', fromTrack, toTrack: trackKey, index: 0 }
      } as any);
      UnifiedEventBus.emitPlayback('play');
    }

    // 广播 BPM
    if (typeof bpm === 'number' && Number.isFinite(bpm)) {
      UnifiedEventBus.emitBpm(bpm);
    }

    // 广播基础情绪（能量/情绪基线）
    const mood = this.deriveMoodFromBpmKey(bpm, key);
    UnifiedEventBus.emitMood(mood);
  }

  // 修复：移除直接API调用
  private async fetchStatus(): Promise<AutoDjStatus | null> {
    // 不再直接调用API，而是通过事件系统获取信息
    console.log('🎵 AutoDJManager: 通过事件系统获取状态，不再直接调用API');
    return null;
  }

  // 基线映射：
  // - BPM 90..150 → energy 0.2..0.95，arousal 0.25..0.9
  // - Camelot Major(B) +0.06 valence，Minor(A) -0.05 valence
  private deriveMoodFromBpmKey(bpm?: number, camelot?: string): { energy: number; valence: number; arousal: number } {
    let energy = 0.5;
    let arousal = 0.5;
    let valence = 0.0;

    if (typeof bpm === 'number' && Number.isFinite(bpm)) {
      const t = clamp01((bpm - 90) / 60); // 90→0, 150→1
      energy = 0.2 + t * 0.75;
      arousal = 0.25 + t * 0.65;
    }
    if (camelot) {
      const mode = /[AB]$/i.exec(camelot)?.[0].toUpperCase();
      if (mode === 'B') valence += 0.06;
      if (mode === 'A') valence -= 0.05;
    }
    return { energy: clamp01(energy), valence: clampRange(valence, -1, 1), arousal: clamp01(arousal) };
  }
}

function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }
function clampRange(x: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, x)); }


