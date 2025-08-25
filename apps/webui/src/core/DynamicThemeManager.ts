/**
 * DynamicThemeManager - 动态主题管理器
 * 职责：把情绪/能量/播放等事件映射为主题 token（颜色/强度/风格），供 UI 与可视化使用。
 */

import type { Manager } from './ManagerTypes';
import { UnifiedEventBus, onMood, onEnergy, onBpm } from '../components/events/UnifiedEventBus';

export type ThemeTokens = {
  accent: string;      // 主题强调色（十六进制）
  background: string;  // 背景基色
  intensity: number;   // 效果强度 0..1
  motion: number;      // 运动感 0..1
  contrast: number;    // 对比度 0..1
};

/**
 * 简单的情绪->主题映射
 */
function mapMoodToTokens(energy: number, valence: number, arousal: number): ThemeTokens {
  // 根据能量调节强度/运动感；根据愉悦度决定色相；唤醒度影响对比
  const intensity = Math.min(1, Math.max(0, energy));
  const motion = Math.min(1, Math.max(0, (energy + arousal) / 2));
  const contrast = Math.min(1, Math.max(0, (arousal * 0.6 + 0.2)));
  // 将 valence [-1,1] 映射到冷暖色：负值偏蓝，正值偏橙
  const warm = Math.round(((valence + 1) / 2) * 255);
  const cool = 255 - warm;
  const accent = `#${warm.toString(16).padStart(2, '0')}${cool.toString(16).padStart(2, '0')}cc`;
  const background = `#0b0f14`; // 统一深色基底
  return { accent, background, intensity, motion, contrast };
}

export class DynamicThemeManager implements Manager {
  readonly id = 'dynamic-theme' as const;
  private current: ThemeTokens = { accent: '#88aaff', background: '#0b0f14', intensity: 0.6, motion: 0.5, contrast: 0.4 };
  private unsubscribers: Array<() => void> = [];

  init(): void {
    // 订阅事件：mood/energy/bpm
    this.unsubscribers.push(
      onMood((e) => {
        const m = e.data?.mood || { energy: 0.6, valence: 0.0, arousal: 0.5 };
        this.current = mapMoodToTokens(m.energy, m.valence, m.arousal);
        UnifiedEventBus.emit({ namespace: 'global', type: 'config', timestamp: Date.now(), data: { theme: this.current } });
      })
    );
    this.unsubscribers.push(
      onEnergy((e) => {
        const en = e.data?.energy ?? 0.6;
        const t = this.current;
        this.current = { ...t, intensity: Math.min(1, Math.max(0, en)) };
        UnifiedEventBus.emit({ namespace: 'global', type: 'config', timestamp: Date.now(), data: { theme: this.current } });
      })
    );
    this.unsubscribers.push(
      onBpm((e) => {
        const bpm = e.data?.bpm ?? 120;
        const t = this.current;
        const motion = Math.max(0.2, Math.min(1.0, (bpm - 80) / 120));
        this.current = { ...t, motion };
        UnifiedEventBus.emit({ namespace: 'global', type: 'config', timestamp: Date.now(), data: { theme: this.current } });
      })
    );
  }

  start(): void {
    // 启动时广播一次当前主题
    UnifiedEventBus.emit({ namespace: 'global', type: 'config', timestamp: Date.now(), data: { theme: this.current } });
  }

  stop(): void {
    // 暂无周期任务
  }

  dispose(): void {
    this.unsubscribers.forEach((u) => {
      try { u(); } catch {}
    });
    this.unsubscribers = [];
  }

  getTokens(): ThemeTokens {
    return this.current;
  }
}

export default DynamicThemeManager;


