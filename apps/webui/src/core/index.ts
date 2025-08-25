/**
 * 核心统一入口 - 注册所有管理器
 */

import { managerRegistry } from './ManagerRegistry';
import DynamicThemeManager from './DynamicThemeManager';
import TelemetryManager from './TelemetryManager';
import VisualizationEffectManager from './VisualizationEffectManager';
import AutoMixManager from './AutoMixManager';
import EmotionCoreManager from './EmotionCoreManager';
import AutoDJManager from './AutoDJManager';
// 从配置启用统一循环（灰度）
import cfg from '../data-config.json';

export async function initCoreManagers(): Promise<void> {
  // 注册内置管理器
  const unified = Boolean((cfg as any).featureFlags?.emotionCoreUnifiedLoop);
  const enableTechniqueBridge = Boolean((cfg as any).featureFlags?.enableTechniqueBridge);
  
  const emotionCore = new EmotionCoreManager({
    enableUnifiedLoop: Boolean((cfg as any).featureFlags?.emotionCoreUnifiedLoop),
    tickIntervalMs: Number((cfg as any).emotionCore?.tickIntervalMs ?? 500),
    enableTechniqueBridge: enableTechniqueBridge,
    conservativeDropout: Number((cfg as any).emotionCore?.conservativeDropout ?? 0.05),
    AUTODJ_STATUS_URL: (cfg as any).aidjMix?.mirrorConfig?.NOWPLAYING_URL,
    NOWPLAYING_URL: (cfg as any).aidjMix?.mirrorConfig?.NOWPLAYING_URL
  });

  if (unified) {
    // 统一核心开启：仅注册 EmotionCore + Telemetry，避免重复职责与事件风暴
    managerRegistry.register(emotionCore);
    managerRegistry.register(new TelemetryManager());
    // 注册 AutoDJ 桥接器（事件来源轻量，交由 EmotionCore 融合）
    managerRegistry.register(new AutoDJManager());
  } else {
    // 兼容模式：沿用既有管理器
    managerRegistry.register(new DynamicThemeManager());
    managerRegistry.register(new TelemetryManager());
    managerRegistry.register(new VisualizationEffectManager());
    managerRegistry.register(new AutoMixManager());
    managerRegistry.register(emotionCore);
    managerRegistry.register(new AutoDJManager());
  }
  await managerRegistry.initAll();
}

export async function startCoreManagers(): Promise<void> {
  await managerRegistry.startAll();
}

export async function stopCoreManagers(): Promise<void> {
  await managerRegistry.stopAll();
}

export async function disposeCoreManagers(): Promise<void> {
  await managerRegistry.disposeAll();
}

export { managerRegistry } from './ManagerRegistry';
export type { Manager, ManagerId } from './ManagerTypes';


