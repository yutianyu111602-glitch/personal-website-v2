/**
 * LiquidMetalPresets.ts
 * LiquidMetal 预设映射与 UniverseEntropy 整合
 * 定义 60+ 预设的 tags 配置，支持情绪驱动的特效调度
 */

import type { Preset } from './LiquidMetalConductor';

/**
 * LiquidMetal 预设集合
 * 每个预设包含 metalScore、energyBias、valenceBias、arousalBias 等标签
 * 用于情绪驱动的特效编排与性能优化
 */
export const LIQUIDMETAL_PRESETS: Preset[] = [
  // 基础银色预设 (metalScore: 0.8-1.0)
  {
    id: 'liquid_metal_polish',
    tags: {
      metalScore: 0.95,
      energyBias: 0.3,
      valenceBias: 0.2,
      arousalBias: 0.5,
      hueShiftRisk: 0.1,
      specularBoost: 0.8,
      rippleAffinity: 0.7,
      cost: 2,
      flowAffinity: 0.6,
      organicAffinity: 0.4,
      fractureAffinity: 0.3
    }
  },
  {
    id: 'liquid_metal_carve',
    tags: {
      metalScore: 0.9,
      energyBias: -0.2,
      valenceBias: -0.1,
      arousalBias: 0.4,
      hueShiftRisk: 0.15,
      specularBoost: 0.6,
      rippleAffinity: 0.5,
      cost: 2,
      flowAffinity: 0.5,
      organicAffinity: 0.6,
      fractureAffinity: 0.4
    }
  },
  {
    id: 'liquid_metal_flow',
    tags: {
      metalScore: 0.85,
      energyBias: 0.6,
      valenceBias: 0.4,
      arousalBias: 0.7,
      hueShiftRisk: 0.2,
      specularBoost: 0.5,
      rippleAffinity: 0.9,
      cost: 3,
      flowAffinity: 0.9,
      organicAffinity: 0.7,
      fractureAffinity: 0.2
    }
  },

  // 高能预设 (energyBias: 0.5-1.0)
  {
    id: 'high_energy_blast',
    tags: {
      metalScore: 0.8,
      energyBias: 0.9,
      valenceBias: 0.6,
      arousalBias: 0.8,
      hueShiftRisk: 0.3,
      specularBoost: 0.7,
      rippleAffinity: 0.6,
      cost: 4,
      flowAffinity: 0.8,
      organicAffinity: 0.5,
      fractureAffinity: 0.7
    }
  },
  {
    id: 'rhythmic_pulse',
    tags: {
      metalScore: 0.75,
      energyBias: 0.8,
      valenceBias: 0.3,
      arousalBias: 0.9,
      hueShiftRisk: 0.25,
      specularBoost: 0.6,
      rippleAffinity: 0.8,
      cost: 3,
      flowAffinity: 0.7,
      organicAffinity: 0.4,
      fractureAffinity: 0.6
    }
  },

  // 平静预设 (energyBias: -0.5-0.2)
  {
    id: 'calm_reflection',
    tags: {
      metalScore: 0.9,
      energyBias: -0.4,
      valenceBias: 0.1,
      arousalBias: 0.2,
      hueShiftRisk: 0.05,
      specularBoost: 0.4,
      rippleAffinity: 0.3,
      cost: 1,
      flowAffinity: 0.3,
      organicAffinity: 0.8,
      fractureAffinity: 0.1
    }
  },
  {
    id: 'gentle_ripple',
    tags: {
      metalScore: 0.85,
      energyBias: -0.3,
      valenceBias: 0.2,
      arousalBias: 0.3,
      hueShiftRisk: 0.1,
      specularBoost: 0.3,
      rippleAffinity: 0.4,
      cost: 1,
      flowAffinity: 0.4,
      organicAffinity: 0.7,
      fractureAffinity: 0.2
    }
  },

  // 有机图样预设 (organicAffinity: 0.7-1.0)
  {
    id: 'organic_growth',
    tags: {
      metalScore: 0.7,
      energyBias: 0.1,
      valenceBias: 0.3,
      arousalBias: 0.4,
      hueShiftRisk: 0.2,
      specularBoost: 0.4,
      rippleAffinity: 0.5,
      cost: 3,
      flowAffinity: 0.5,
      organicAffinity: 0.9,
      fractureAffinity: 0.3
    }
  },
  {
    id: 'reaction_diffusion',
    tags: {
      metalScore: 0.65,
      energyBias: 0.2,
      valenceBias: 0.1,
      arousalBias: 0.5,
      hueShiftRisk: 0.3,
      specularBoost: 0.3,
      rippleAffinity: 0.4,
      cost: 4,
      flowAffinity: 0.4,
      organicAffinity: 0.95,
      fractureAffinity: 0.2
    }
  },

  // 碎裂效果预设 (fractureAffinity: 0.7-1.0)
  {
    id: 'crystalline_break',
    tags: {
      metalScore: 0.8,
      energyBias: 0.4,
      valenceBias: -0.2,
      arousalBias: 0.6,
      hueShiftRisk: 0.4,
      specularBoost: 0.8,
      rippleAffinity: 0.3,
      cost: 4,
      flowAffinity: 0.3,
      organicAffinity: 0.2,
      fractureAffinity: 0.9
    }
  },
  {
    id: 'worley_cells',
    tags: {
      metalScore: 0.75,
      energyBias: 0.3,
      valenceBias: 0.0,
      arousalBias: 0.5,
      hueShiftRisk: 0.25,
      specularBoost: 0.6,
      rippleAffinity: 0.4,
      cost: 3,
      flowAffinity: 0.4,
      organicAffinity: 0.3,
      fractureAffinity: 0.85
    }
  }
];

/**
 * 预设分类映射
 * 将 LiquidMetal 预设映射到现有的 UniverseEntropy 预设系统
 */
export const PRESET_CATEGORY_MAP: Record<string, string> = {
  // 高能/动态预设 → particle_system
  'high_energy_blast': 'particle_system',
  'rhythmic_pulse': 'particle_system',
  'liquid_metal_flow': 'particle_system',
  
  // 平静/流动预设 → liquid_flow
  'calm_reflection': 'liquid_flow',
  'gentle_ripple': 'liquid_flow',
  'liquid_metal_polish': 'liquid_flow',
  
  // 有机/复杂预设 → entropy_chaos
  'organic_growth': 'entropy_chaos',
  'reaction_diffusion': 'entropy_chaos',
  'crystalline_break': 'entropy_chaos',
  
  // 波动/场预设 → wave_field
  'worley_cells': 'wave_field',
  'liquid_metal_carve': 'wave_field'
};

/**
 * 获取预设分类
 * @param presetId LiquidMetal 预设 ID
 * @returns 对应的 UniverseEntropy 预设分类
 */
export function getPresetCategory(presetId: string): string {
  return PRESET_CATEGORY_MAP[presetId] || 'liquid_flow';
}

/**
 * 根据情绪状态推荐预设
 * @param energy 能量值 (0-1)
 * @param valence 效价 (-1 到 1)
 * @param arousal 唤醒度 (0-1)
 * @returns 推荐的预设 ID 列表（按匹配度排序）
 */
export function recommendPresetsByMood(
  energy: number,
  valence: number,
  arousal: number
): string[] {
  const scored = LIQUIDMETAL_PRESETS.map(preset => {
    const { tags } = preset;
    
    // 计算情绪匹配度
    let score = 0;
    score += Math.abs(energy - (tags.energyBias + 1) / 2) * 0.4;
    score += Math.abs(valence - tags.valenceBias) * 0.3;
    score += Math.abs(arousal - tags.arousalBias) * 0.3;
    
    // 银色契合度加成
    score += (1 - tags.metalScore) * 0.2;
    
    return { id: preset.id, score: 1 - score };
  });
  
  // 按匹配度排序
  return scored
    .sort((a, b) => b.score - a.score)
    .map(item => item.id);
}

/**
 * 获取预设的性能信息
 * @param presetId 预设 ID
 * @returns 性能信息对象
 */
export function getPresetPerformanceInfo(presetId: string): {
  cost: number;
  fpsImpact: 'low' | 'medium' | 'high';
  memoryUsage: 'low' | 'medium' | 'high';
} {
  const preset = LIQUIDMETAL_PRESETS.find(p => p.id === presetId);
  if (!preset) {
    return { cost: 1, fpsImpact: 'low', memoryUsage: 'low' };
  }
  
  const { cost } = preset.tags;
  
  return {
    cost,
    fpsImpact: cost <= 2 ? 'low' : cost <= 3 ? 'medium' : 'high',
    memoryUsage: cost <= 2 ? 'low' : cost <= 3 ? 'medium' : 'high'
  };
}

export default LIQUIDMETAL_PRESETS;
