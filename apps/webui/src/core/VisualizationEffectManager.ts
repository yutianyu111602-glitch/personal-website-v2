/**
 * VisualizationEffectManager - 主题到可视化预设映射
 * 输入：global:config { theme }
 * 输出：visualization:preset / visualization:color
 */

import type { Manager } from './ManagerTypes';
import { UnifiedEventBus } from '../components/events/UnifiedEventBus';

type ThemeTokens = {
  accent: string;
  background: string;
  intensity: number; // 0..1
  motion: number;    // 0..1
  contrast: number;  // 0..1
};

// 预设名称与 App 中的背景索引映射建议：
// silver_pure -> 0, liquid_chrome -> 1, silver_mist -> 2, metallic_flow -> 3, cosmic_silver -> 4
function pickPresetByTheme(theme: ThemeTokens): string {
  const { intensity, motion, contrast } = theme;
  if (intensity < 0.35 && contrast < 0.4) return 'silver_pure';
  if (motion < 0.45 && intensity < 0.55) return 'silver_mist';
  if (intensity > 0.75 && motion > 0.6) return 'metallic_flow';
  if (contrast > 0.65) return 'cosmic_silver';
  return 'liquid_chrome';
}

export class VisualizationEffectManager implements Manager {
  readonly id = 'visualization' as const;
  private unsubscribes: Array<() => void> = [];
  private lastPreset?: string;

  init(): void {
    // 优先：订阅 pipeline 效果，直接将颜色/预设下发给前端（App 已订阅 onPreset）
    const offEffect = UnifiedEventBus.on('visualization', 'effect', (e) => {
      const pipeline = (e as any).data?.pipeline;
      if (!pipeline) return;
      // 如果 pipeline 带有 presetId，映射为可用的背景名
      const presetId: string | undefined = pipeline?.presetId;
      if (presetId) {
        const preset = this.mapPresetIdToName(presetId);
        if (preset && preset !== this.lastPreset) {
          this.lastPreset = preset;
          UnifiedEventBus.emitPreset(preset);
        }
      }
    });
    this.unsubscribes.push(offEffect);

    // 回退：订阅主题，按主题推导预设与颜色
    const offTheme = UnifiedEventBus.on('global', 'config', (e) => {
      const theme: ThemeTokens | undefined = (e as any).data?.theme;
      if (!theme) return;
      const preset = pickPresetByTheme(theme);
      UnifiedEventBus.emitColor(theme.accent);
      if (preset !== this.lastPreset) {
        this.lastPreset = preset;
        UnifiedEventBus.emitPreset(preset);
      }
    });
    this.unsubscribes.push(offTheme);
  }
  start(): void {}
  stop(): void {}
  dispose(): void {
    this.unsubscribes.forEach(u => { try { u(); } catch {} });
    this.unsubscribes = [];
  }

  private mapPresetIdToName(presetId: string): string | undefined {
    // 简单映射策略，可与 AutoMixManager 的 map 保持一致
    const id = presetId.toLowerCase();
    if (id.includes('pure') || id.includes('calm')) return 'silver_pure';
    if (id.includes('mist') || id.includes('ambient')) return 'silver_mist';
    if (id.includes('metal') || id.includes('flow')) return 'metallic_flow';
    if (id.includes('cosmic') || id.includes('space')) return 'cosmic_silver';
    return 'liquid_chrome';
  }
}

export default VisualizationEffectManager;


