/**
 * 可视化事件总线兼容层（旧 API 适配）
 * 目的：为仍引用旧模块的代码提供无缝过渡，内部转发到 UnifiedEventBus
 *
 * 说明：仅用于过渡期，后续请直接改为使用 UnifiedEventBus
 */
import { UnifiedEventBus } from './UnifiedEventBus';

// 基础 on/off 监听封装
export const on = (handler: (event: any) => void): (() => void) => {
  const _unsubscribe = UnifiedEventBus.subscribe(handler);
  return () => UnifiedEventBus.unsubscribe(handler);
};

export const off = (handler: (event: any) => void) => {
  try { UnifiedEventBus.unsubscribe(handler); } catch {}
};

// 统一 emit 透传（保留向后兼容）
export const emit = (event: any) => UnifiedEventBus.emit(event);

// 旧 API：配色方案
export const emitColor = (colorScheme: string) => UnifiedEventBus.emitColor(colorScheme);

// 旧 API：可视化预设
export const emitPreset = (preset: string) => UnifiedEventBus.emitPreset(preset);

// 旧 API：播放状态
export const emitPlayback = (state: 'play' | 'pause' | 'stop') => UnifiedEventBus.emitPlayback(state);

export default {
  on,
  off,
  emit,
  emitColor,
  emitPreset,
  emitPlayback,
};
