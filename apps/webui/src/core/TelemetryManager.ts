/**
 * TelemetryManager - 遥测管理器
 * 职责：订阅统一事件总线，将关键事件（性能/主题/情绪/能量/BPM）上报到 /api/event
 */

import type { Manager } from './ManagerTypes';
import throttle from 'lodash/throttle';
import { UnifiedEventBus, onEnergy, onBpm, onMood } from '../components/events/UnifiedEventBus';

type TelemetryEvent = {
  kind: 'performance' | 'theme' | 'mood' | 'energy' | 'bpm' | 'custom';
  payload: any;
};

export class TelemetryManager implements Manager {
  readonly id = 'telemetry' as const;
  private sendThrottled: (evt: TelemetryEvent) => void;
  private unsubscribers: Array<() => void> = [];

  constructor() {
    // 500ms 节流：合并高频事件，降低后端压力
    this.sendThrottled = throttle((evt: TelemetryEvent) => {
      // 使用相对路径交由 Vite 代理（开发模式）
      // 生产环境可能跨域，当前仅用于开发/调试
      fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evt),
      }).catch(() => {});
    }, 500, { leading: true, trailing: true });
  }

  init(): void {
    // 订阅统一事件
    this.unsubscribers.push(
      onEnergy((e) => this.sendThrottled({ kind: 'energy', payload: { value: e.data?.energy } })),
    );
    this.unsubscribers.push(
      onBpm((e) => this.sendThrottled({ kind: 'bpm', payload: { value: e.data?.bpm } })),
    );
    this.unsubscribers.push(
      onMood((e) => this.sendThrottled({ kind: 'mood', payload: e.data?.mood })),
    );
    // 监听主题广播（global:config 中的 theme）
    UnifiedEventBus.on('global', 'config', (e) => {
      const theme = e.data?.theme;
      if (theme) this.sendThrottled({ kind: 'theme', payload: theme });
    });
    // 监听性能指标（global:performance）
    UnifiedEventBus.on('global', 'performance', (e) => {
      this.sendThrottled({ kind: 'performance', payload: e.data?.performance });
    });
  }

  start(): void {}
  stop(): void {}

  dispose(): void {
    this.unsubscribers.forEach((u) => {
      try { u(); } catch {}
    });
    this.unsubscribers = [];
  }
}

export default TelemetryManager;


