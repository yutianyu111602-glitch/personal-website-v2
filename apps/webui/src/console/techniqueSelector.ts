/**
 * 切歌手法选择器
 * 基于音乐特征、网络状态、情绪状态智能选择最佳切歌手法
 * 遵循安全优先级：simpleHeadTail > 网络稳定 > 调性兼容 > 人声安全 > 情绪偏置
 */

import type { 
  TechniqueName, 
  TechContext, 
  TechniqueDecision, 
  TechniqueHint,
  TechniqueConfig,
  Segment,
  EmotionInput
} from '../types/technique';

// 20种手法的完整配置
const TECHNIQUE_CONFIGS: Record<TechniqueName, TechniqueConfig> = {
  // 基础切歌手法
  simple_head_tail: {
    name: 'simple_head_tail',
    description: '简单头尾切歌，最安全的基础手法',
    minBpm: 80,
    maxBpm: 200,
    compatibleKeys: ['*'], // 兼容所有调性
    safeForVocals: true,
    networkStability: 'high',
    complexity: 'simple',
    energyBias: 0,
    valenceBias: 0,
    arousalBias: 0
  },
  
  phrase_cut_16: {
    name: 'phrase_cut_16',
    description: '16拍短语切歌，节奏感强',
    minBpm: 100,
    maxBpm: 180,
    compatibleKeys: ['*'],
    safeForVocals: true,
    networkStability: 'high',
    complexity: 'simple',
    energyBias: 0.2,
    valenceBias: 0.1,
    arousalBias: 0.3
  },
  
  phrase_cut_32: {
    name: 'phrase_cut_32',
    description: '32拍短语切歌，更长的过渡',
    minBpm: 90,
    maxBpm: 160,
    compatibleKeys: ['*'],
    safeForVocals: true,
    networkStability: 'high',
    complexity: 'medium',
    energyBias: 0.1,
    valenceBias: 0,
    arousalBias: 0.2
  },
  
  long_layer_24: {
    name: 'long_layer_24',
    description: '24拍长层叠，温和过渡',
    minBpm: 85,
    maxBpm: 150,
    compatibleKeys: ['*'],
    safeForVocals: true,
    networkStability: 'medium',
    complexity: 'medium',
    energyBias: -0.1,
    valenceBias: 0.2,
    arousalBias: -0.1
  },
  
  long_layer_32: {
    name: 'long_layer_32',
    description: '32拍长层叠，最温和的过渡',
    minBpm: 80,
    maxBpm: 140,
    compatibleKeys: ['*'],
    safeForVocals: true,
    networkStability: 'medium',
    complexity: 'medium',
    energyBias: -0.2,
    valenceBias: 0.3,
    arousalBias: -0.2
  },
  
  // 高级切歌手法
  double_drop_32: {
    name: 'double_drop_32',
    description: '32拍双重释放，高能量冲击',
    minBpm: 130,
    maxBpm: 200,
    compatibleKeys: ['1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A'],
    safeForVocals: false,
    networkStability: 'low',
    complexity: 'complex',
    energyBias: 0.8,
    valenceBias: 0.6,
    arousalBias: 0.9
  },
  
  triple_drop_48: {
    name: 'triple_drop_48',
    description: '48拍三重释放，极限能量',
    minBpm: 140,
    maxBpm: 200,
    compatibleKeys: ['1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A'],
    safeForVocals: false,
    networkStability: 'low',
    complexity: 'complex',
    energyBias: 1.0,
    valenceBias: 0.8,
    arousalBias: 1.0
  },
  
  build_up_16: {
    name: 'build_up_16',
    description: '16拍构建上升，渐进增强',
    minBpm: 100,
    maxBpm: 180,
    compatibleKeys: ['*'],
    safeForVocals: true,
    networkStability: 'medium',
    complexity: 'medium',
    energyBias: 0.4,
    valenceBias: 0.3,
    arousalBias: 0.6
  },
  
  build_up_32: {
    name: 'build_up_32',
    description: '32拍构建上升，更长渐进',
    minBpm: 90,
    maxBpm: 160,
    compatibleKeys: ['*'],
    safeForVocals: true,
    networkStability: 'medium',
    complexity: 'medium',
    energyBias: 0.3,
    valenceBias: 0.2,
    arousalBias: 0.5
  },
  
  fill_bridge_8: {
    name: 'fill_bridge_8',
    description: '8拍填充桥接，快速过渡',
    minBpm: 110,
    maxBpm: 190,
    compatibleKeys: ['*'],
    safeForVocals: true,
    networkStability: 'high',
    complexity: 'simple',
    energyBias: 0.1,
    valenceBias: 0,
    arousalBias: 0.2
  },
  
  // 特效切歌手法
  backspin_safe: {
    name: 'backspin_safe',
    description: '安全倒转，经典特效',
    minBpm: 100,
    maxBpm: 170,
    compatibleKeys: ['*'],
    safeForVocals: false,
    networkStability: 'medium',
    complexity: 'medium',
    energyBias: 0.3,
    valenceBias: 0.2,
    arousalBias: 0.4
  },
  
  brake_fx: {
    name: 'brake_fx',
    description: '刹车特效，节奏中断',
    minBpm: 110,
    maxBpm: 180,
    compatibleKeys: ['*'],
    safeForVocals: false,
    networkStability: 'medium',
    complexity: 'medium',
    energyBias: 0.4,
    valenceBias: 0.1,
    arousalBias: 0.5
  },
  
  stutter_gate: {
    name: 'stutter_gate',
    description: '口吃门控，机械感强',
    minBpm: 120,
    maxBpm: 190,
    compatibleKeys: ['*'],
    safeForVocals: false,
    networkStability: 'low',
    complexity: 'complex',
    energyBias: 0.6,
    valenceBias: 0.3,
    arousalBias: 0.7
  },
  
  echo_fade: {
    name: 'echo_fade',
    description: '回声淡出，空间感强',
    minBpm: 85,
    maxBpm: 150,
    compatibleKeys: ['*'],
    safeForVocals: true,
    networkStability: 'high',
    complexity: 'medium',
    energyBias: -0.1,
    valenceBias: 0.4,
    arousalBias: 0.1
  },
  
  filter_sweep: {
    name: 'filter_sweep',
    description: '滤波器扫频，动态变化',
    minBpm: 95,
    maxBpm: 160,
    compatibleKeys: ['*'],
    safeForVocals: true,
    networkStability: 'medium',
    complexity: 'medium',
    energyBias: 0.2,
    valenceBias: 0.1,
    arousalBias: 0.3
  },
  
  // 温和切歌手法
  mid_scoop_cross: {
    name: 'mid_scoop_cross',
    description: '中频凹陷交叉，温和过渡',
    minBpm: 80,
    maxBpm: 140,
    compatibleKeys: ['*'],
    safeForVocals: true,
    networkStability: 'high',
    complexity: 'simple',
    energyBias: -0.2,
    valenceBias: 0.1,
    arousalBias: -0.1
  },
  
  high_pass_swap: {
    name: 'high_pass_swap',
    description: '高通滤波交换，高频过渡',
    minBpm: 85,
    maxBpm: 150,
    compatibleKeys: ['*'],
    safeForVocals: true,
    networkStability: 'high',
    complexity: 'simple',
    energyBias: 0.1,
    valenceBias: 0.2,
    arousalBias: 0.1
  },
  
  low_pass_swap: {
    name: 'low_pass_swap',
    description: '低通滤波交换，低频过渡',
    minBpm: 80,
    maxBpm: 140,
    compatibleKeys: ['*'],
    safeForVocals: true,
    networkStability: 'high',
    complexity: 'simple',
    energyBias: -0.1,
    valenceBias: 0.1,
    arousalBias: -0.1
  },
  
  volume_ride: {
    name: 'volume_ride',
    description: '音量骑行，平滑过渡',
    minBpm: 75,
    maxBpm: 130,
    compatibleKeys: ['*'],
    safeForVocals: true,
    networkStability: 'high',
    complexity: 'simple',
    energyBias: -0.3,
    valenceBias: 0.4,
    arousalBias: -0.2
  },
  
  tempo_match: {
    name: 'tempo_match',
    description: '速度匹配，同步过渡',
    minBpm: 70,
    maxBpm: 120,
    compatibleKeys: ['*'],
    safeForVocals: true,
    networkStability: 'high',
    complexity: 'simple',
    energyBias: -0.2,
    valenceBias: 0.3,
    arousalBias: -0.1
  }
};

/**
 * 获取手法的提示信息
 */
export function techniqueHintOf(technique: TechniqueName): TechniqueHint {
  const config = TECHNIQUE_CONFIGS[technique];
  
  switch (technique) {
    case 'simple_head_tail':
      return {
        beats: 4,
        action: '简单切歌，保持原曲完整性'
      };
      
    case 'phrase_cut_16':
      return {
        beats: 16,
        eq: { low: 0, mid: -2, high: 0 },
        action: '16拍切歌，注意节奏对齐'
      };
      
    case 'phrase_cut_32':
      return {
        beats: 32,
        eq: { low: 0, mid: -1, high: 0 },
        action: '32拍切歌，较长过渡时间'
      };
      
    case 'long_layer_24':
      return {
        beats: 24,
        eq: { low: -1, mid: 0, high: -1 },
        loop: { length: 24, crossfade: 8 },
        action: '24拍层叠，温和过渡'
      };
      
    case 'long_layer_32':
      return {
        beats: 32,
        eq: { low: -1, mid: 0, high: -1 },
        loop: { length: 32, crossfade: 12 },
        action: '32拍层叠，最温和过渡'
      };
      
    case 'double_drop_32':
      return {
        beats: 32,
        eq: { low: 3, mid: 2, high: 1 },
        fx: { reverb: 0.3, delay: 0.2, distortion: 0.1 },
        action: '双重释放，高能量冲击'
      };
      
    case 'triple_drop_48':
      return {
        beats: 48,
        eq: { low: 4, mid: 3, high: 2 },
        fx: { reverb: 0.4, delay: 0.3, distortion: 0.2 },
        action: '三重释放，极限能量'
      };
      
    case 'build_up_16':
      return {
        beats: 16,
        eq: { low: 1, mid: 2, high: 1 },
        filter: { type: 'lowpass', frequency: 8000, resonance: 0.5 },
        action: '构建上升，渐进增强'
      };
      
    case 'build_up_32':
      return {
        beats: 32,
        eq: { low: 1, mid: 2, high: 1 },
        filter: { type: 'lowpass', frequency: 8000, resonance: 0.5 },
        action: '构建上升，更长渐进'
      };
      
    case 'fill_bridge_8':
      return {
        beats: 8,
        eq: { low: 0, mid: 1, high: 0 },
        action: '快速填充桥接'
      };
      
    case 'backspin_safe':
      return {
        beats: 8,
        eq: { low: 0, mid: -1, high: 0 },
        action: '安全倒转，经典特效'
      };
      
    case 'brake_fx':
      return {
        beats: 4,
        eq: { low: 2, mid: 1, high: 0 },
        fx: { reverb: 0.2, delay: 0.1 },
        action: '刹车特效，节奏中断'
      };
      
    case 'stutter_gate':
      return {
        beats: 4,
        eq: { low: 1, mid: 2, high: 1 },
        fx: { delay: 0.3, distortion: 0.2 },
        action: '口吃门控，机械感强'
      };
      
    case 'echo_fade':
      return {
        beats: 16,
        eq: { low: 0, mid: 0, high: 1 },
        fx: { reverb: 0.4, delay: 0.3 },
        action: '回声淡出，空间感强'
      };
      
    case 'filter_sweep':
      return {
        beats: 16,
        filter: { type: 'bandpass', frequency: 1000, resonance: 0.7 },
        action: '滤波器扫频，动态变化'
      };
      
    case 'mid_scoop_cross':
      return {
        beats: 16,
        eq: { low: 0, mid: -3, high: 0 },
        action: '中频凹陷交叉，温和过渡'
      };
      
    case 'high_pass_swap':
      return {
        beats: 16,
        filter: { type: 'highpass', frequency: 200, resonance: 0.5 },
        action: '高通滤波交换，高频过渡'
      };
      
    case 'low_pass_swap':
      return {
        beats: 16,
        filter: { type: 'lowpass', frequency: 8000, resonance: 0.5 },
        action: '低通滤波交换，低频过渡'
      };
      
    case 'volume_ride':
      return {
        beats: 32,
        action: '音量骑行，平滑过渡'
      };
      
    case 'tempo_match':
      return {
        beats: 32,
        action: '速度匹配，同步过渡'
      };
      
    default:
      return {
        action: '默认切歌手法'
      };
  }
}

/**
 * 检查调性兼容性
 */
function camelotCompat(keyFrom?: string, keyTo?: string): boolean {
  if (!keyFrom || !keyTo) return true;
  
  // 相同调性
  if (keyFrom === keyTo) return true;
  
  // 相对调性（相差7个半音）
  const fromNum = parseInt(keyFrom);
  const toNum = parseInt(keyTo);
  if (Math.abs(fromNum - toNum) === 7) return true;
  
  // 相邻调性（相差1个半音）
  if (Math.abs(fromNum - toNum) === 1) return true;
  
  // 大小调关系（A和B的关系）
  const fromMode = keyFrom.endsWith('A') ? 'A' : 'B';
  const toMode = keyTo.endsWith('A') ? 'A' : 'B';
  if (fromMode !== toMode) {
    // 检查相对大小调关系
    const relativeKey = (fromNum + 3) % 12;
    if (relativeKey === toNum) return true;
  }
  
  return false;
}

/**
 * 应用情绪偏置（不改变安全线，只在可选分支时偏向）
 */
function applyEmotionBias(
  base: TechniqueDecision,
  ctx: TechContext
): TechniqueDecision {
  const e = ctx.emotion;
  if (!e) return base;

  const reason = [...base.reason];
  
  // 高唤醒：更倾向"果断型"或"短语切"
  if (e.arousal >= 0.7) {
    if (base.technique === 'long_layer_24' || base.technique === 'long_layer_32') {
      reason.push('emotion:arousal↑ → prefer phrase_cut');
      return { 
        technique: 'phrase_cut_16', 
        hint: techniqueHintOf('phrase_cut_16'), 
        reason 
      };
    }
  }
  
  // 低能量：更倾向"层叠型/温和型"
  if (e.energy <= 0.35) {
    if (base.technique === 'phrase_cut_16') {
      reason.push('emotion:energy↓ → prefer long_layer');
      return { 
        technique: 'long_layer_24', 
        hint: techniqueHintOf('long_layer_24'), 
        reason 
      };
    }
  }
  
  // 正效价且处于drop：可放大胆一些（在满足安全线时）
  if (e.valence >= 0.2 && ctx.segment === 'drop') {
    if (camelotCompat(ctx.keyFrom, ctx.keyTo) && (ctx.bpmTo || 0) >= 138) {
      if (base.technique !== 'double_drop_32') {
        reason.push('emotion:valence↑ + drop → consider double_drop');
        return { 
          technique: 'double_drop_32', 
          hint: techniqueHintOf('double_drop_32'), 
          reason 
        };
      }
    }
  }
  
  // 负效价或人声存在：避开花哨/撕裂类FX
  if (e.valence <= -0.2 || (ctx.vocality || 0) > 0.2) {
    const risky: TechniqueName[] = ['backspin_safe', 'brake_fx', 'stutter_gate'];
    if (risky.includes(base.technique)) {
      reason.push('emotion:valence↓|vocal → safer cross');
      return { 
        technique: 'mid_scoop_cross', 
        hint: techniqueHintOf('mid_scoop_cross'), 
        reason 
      };
    }
  }

  return base;
}

/**
 * 核心手法选择函数
 * 基于安全优先级和音乐特征选择最佳切歌手法
 */
export function chooseTechnique(ctx: TechContext): TechniqueDecision {
  const { 
    bpmFrom, bpmTo, keyFrom, keyTo, segment, vocality, 
    simpleHeadTail, dropoutRate, recentErrors 
  } = ctx;
  
  const reasons: string[] = [];
  
  // 安全优先级1：simpleHeadTail强制使用
  if (simpleHeadTail) {
    reasons.push('safety:simpleHeadTail enabled → force simple_head_tail');
    return {
      technique: 'simple_head_tail',
      hint: techniqueHintOf('simple_head_tail'),
      reason: reasons
    };
  }
  
  // 安全优先级2：网络稳定性检查
  const isNetworkStable = (dropoutRate || 0) <= 0.05 && (recentErrors || 0) === 0;
  if (!isNetworkStable) {
    reasons.push('safety:network unstable → conservative techniques only');
    // 网络不稳定时只选择高稳定性手法
    const safeTechniques: TechniqueName[] = [
      'simple_head_tail', 'phrase_cut_16', 'long_layer_24', 
      'mid_scoop_cross', 'volume_ride', 'tempo_match'
    ];
    const technique = safeTechniques[Math.floor(Math.random() * safeTechniques.length)];
    return {
      technique,
      hint: techniqueHintOf(technique),
      reason: reasons
    };
  }
  
  // 安全优先级3：人声安全检查
  if ((vocality || 0) > 0.2) {
    reasons.push('safety:vocals detected → avoid destructive techniques');
    // 有人声时避免破坏性手法
    const vocalSafeTechniques: TechniqueName[] = [
      'simple_head_tail', 'phrase_cut_16', 'phrase_cut_32',
      'long_layer_24', 'long_layer_32', 'mid_scoop_cross',
      'high_pass_swap', 'low_pass_swap', 'volume_ride', 'tempo_match'
    ];
    const technique = vocalSafeTechniques[Math.floor(Math.random() * vocalSafeTechniques.length)];
    return {
      technique,
      hint: techniqueHintOf(technique),
      reason: reasons
    };
  }
  
  // 安全优先级4：调性兼容性检查
  const isKeyCompatible = camelotCompat(keyFrom, keyTo);
  if (!isKeyCompatible) {
    reasons.push('safety:incompatible keys → simple techniques only');
    // 调性不兼容时使用简单手法
    const simpleTechniques: TechniqueName[] = [
      'simple_head_tail', 'phrase_cut_16', 'long_layer_24'
    ];
    const technique = simpleTechniques[Math.floor(Math.random() * simpleTechniques.length)];
    return {
      technique,
      hint: techniqueHintOf(technique),
      reason: reasons
    };
  }
  
  // 基于段落和BPM选择基础手法
  let baseTechnique: TechniqueName;
  
  if (segment === 'drop') {
    if ((bpmTo || 0) >= 140 && isKeyCompatible) {
      baseTechnique = 'double_drop_32';
      reasons.push('segment:drop + high_bpm + compatible_keys → double_drop_32');
    } else if ((bpmTo || 0) >= 130) {
      baseTechnique = 'phrase_cut_16';
      reasons.push('segment:drop + medium_bpm → phrase_cut_16');
    } else {
      baseTechnique = 'phrase_cut_32';
      reasons.push('segment:drop + low_bpm → phrase_cut_32');
    }
  } else if (segment === 'build') {
    if ((bpmTo || 0) >= 130) {
      baseTechnique = 'build_up_16';
      reasons.push('segment:build + high_bpm → build_up_16');
    } else {
      baseTechnique = 'build_up_32';
      reasons.push('segment:build + low_bpm → build_up_32');
    }
  } else if (segment === 'fill') {
    baseTechnique = 'fill_bridge_8';
    reasons.push('segment:fill → fill_bridge_8');
  } else {
    // steady或其他段落
    if ((bpmTo || 0) >= 140) {
      baseTechnique = 'phrase_cut_16';
      reasons.push('segment:steady + high_bpm → phrase_cut_16');
    } else if ((bpmTo || 0) >= 120) {
      baseTechnique = 'long_layer_24';
      reasons.push('segment:steady + medium_bpm → long_layer_24');
    } else {
      baseTechnique = 'long_layer_32';
      reasons.push('segment:steady + low_bpm → long_layer_32');
    }
  }
  
  // 创建基础决策
  const baseDecision: TechniqueDecision = {
    technique: baseTechnique,
    hint: techniqueHintOf(baseTechnique),
    reason: reasons
  };
  
  // 应用情绪偏置（最低优先级）
  return applyEmotionBias(baseDecision, ctx);
}

/**
 * 获取所有可用手法
 */
export function getAllTechniques(): TechniqueName[] {
  return Object.keys(TECHNIQUE_CONFIGS) as TechniqueName[];
}

/**
 * 获取手法配置信息
 */
export function getTechniqueConfig(technique: TechniqueName): TechniqueConfig {
  return TECHNIQUE_CONFIGS[technique];
}
