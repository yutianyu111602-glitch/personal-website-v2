/**
 * EnhancedLiquidMetalConductor.ts - 增强版液态金属调度器
 * 整合了TGR_FullStack_VisualSuite的精华算法
 */

import type { Mood, BlendPipeline, Preset, BlendNode, BlendID } from './LiquidMetalConductor';
import type { AudioFeatures } from './AudioReactive';
import type { NowPlaying, UnifiedDriveVector, Segment, StepState } from './UnifiedDrive';
import { unifyDrive, nextStep, segmentFromStep } from './UnifiedDrive';
import { createDefaultMarkovMatrix, applyMarkovEnhancement, updateMarkovMatrix, MarkovMatrix } from './MarkovEnhancement';
import { PerformanceMetrics, applyPerformanceAdaptation, PerformancePredictor } from './PerformanceAdaptive';
import { pickMicroMods, applyMicroMods } from './AudioReactive';
import { selectExtras } from './LiquidMetalConductor';
import { StrategyRuntime, type Combo } from './strategy/StrategyPack';
import { blueJitter, makePCG } from './random/RandomToolkit';

export type EnhancedConfig = {
  // 基础配置
  ttlRangeMs?: [number, number];
  maxTotalWeight?: number;
  maxNodeWeight?: number;
  cooldownMs?: number;
  diversity?: number;
  
  // 增强配置
  enableMarkov?: boolean;
  enablePerformanceAdaptation?: boolean;
  enableSegmentAwareness?: boolean;
  enableDynamicTTL?: boolean;
  
  // Techno配置
  technoSteps?: 16 | 32;
  phraseBars?: number;
};

const DEFAULT_CONFIG: Required<EnhancedConfig> = {
  ttlRangeMs: [15000, 90000],
  maxTotalWeight: 0.35,
  maxNodeWeight: 0.22,
  cooldownMs: 45000,
  diversity: 0.6,
  enableMarkov: true,
  enablePerformanceAdaptation: true,
  enableSegmentAwareness: true,
  enableDynamicTTL: true,
  technoSteps: 16,
  phraseBars: 16
};

/**
 * 增强版液态金属调度器
 */
export class EnhancedLiquidMetalConductor {
  private config: Required<EnhancedConfig>;
  private current: BlendPipeline | null = null;
  private until = 0;
  private history: Array<{ id: string; t: number }> = [];
  private markovMatrix: MarkovMatrix;
  private performancePredictor: PerformancePredictor;
  private stepState: StepState;
  private lastDriveVector?: UnifiedDriveVector;
  private rng: () => number;
  private strategy: StrategyRuntime | null = null;
  private mainRng = makePCG(0x5a5a);
  
  constructor(config?: EnhancedConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.markovMatrix = createDefaultMarkovMatrix();
    this.performancePredictor = new PerformancePredictor();
    this.stepState = {
      bar: 0,
      step: 0,
      steps: this.config.technoSteps,
      phaseInPhrase: 0,
      phraseBars: this.config.phraseBars
    };
    this.rng = this.createRNG();
  }
  
  /**
   * 创建确定性随机数生成器
   */
  private createRNG(seed?: number): () => number {
    let x = seed || Date.now();
    return () => {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      return (x >>> 0) / 0xFFFFFFFF;
    };
  }
  
  /**
   * 根据音乐信息重新设置种子
   */
  private reseed(nowPlaying?: NowPlaying): void {
    const seed = nowPlaying?.trackId
      ? Array.from(nowPlaying.trackId).reduce((a, c) => a + c.charCodeAt(0), 0)
      : Date.now();
    this.rng = this.createRNG(seed);
  }
  
  /**
   * 计算冷却惩罚
   */
  private cooldownPenalty(id: string, now: number): number {
    let score = 1.0;
    
    // 最近使用惩罚
    const lastUse = [...this.history].reverse().find(h => h.id === id);
    if (lastUse && (now - lastUse.t) < this.config.cooldownMs) {
      score *= 0.2;
    }
    
    // 多样性惩罚
    const recentIds = this.history.slice(-6).map(h => h.id);
    const lastIndex = recentIds.lastIndexOf(id);
    if (lastIndex >= 0) {
      score *= (1 - this.config.diversity * (1 - lastIndex / 6));
    }
    
    return score;
  }
  
  /**
   * 选择混合节点
   */
  private selectNodes(
    driveVector: UnifiedDriveVector,
    segment: Segment,
    performanceMetrics: PerformanceMetrics,
    presets: Preset[],
    now: number
  ): { nodes: BlendNode[]; presetId?: string } {
    const { E, A, V } = driveVector;
    
    // 节点池
    const baseCandidates: BlendID[] = ['LumaSoftOverlay', 'SMix', 'OkLabLightness'];
    const accentCandidates: BlendID[] = ['BoundedDodge', 'SoftBurn', 'StructureMix', 'DualCurve', 'SpecularGrad'];
    const decorCandidates: BlendID[] = ['GrainMerge', 'BloomHL', 'EdgeTint', 'TemporalTrail'];
    
    // 根据段落调整权重
    const segmentMultiplier = {
      build: 1.1,
      drop: 1.2,
      fill: 1.15,
      steady: 1.0,
      break: 0.9
    }[segment];
    
    // 选择函数
    const selectFromPool = (pool: BlendID[], previousNode?: BlendID): BlendID => {
      const weights = pool.map(id => {
        // 基础分数（从原始算法）
        let score = this.scoreByMood(id, E, A, V);
        
        // 应用马尔可夫增强
        if (this.config.enableMarkov && previousNode) {
          score = applyMarkovEnhancement(score, previousNode, id, this.markovMatrix);
        }
        
        // 应用冷却惩罚
        score *= this.cooldownPenalty(id, now);
        
        // 段落调整
        score *= segmentMultiplier;
        
        return { id, weight: Math.max(0.001, score) };
      });
      
      // 轮盘赌选择
      const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
      let random = this.rng() * totalWeight;
      
      for (const { id, weight } of weights) {
        random -= weight;
        if (random <= 0) return id;
      }
      
      return weights[weights.length - 1].id;
    };
    
    // 选择节点
    const lastNode = this.current?.nodes[this.current.nodes.length - 1]?.id as BlendID | undefined;
    const baseNode = selectFromPool(baseCandidates, lastNode);
    const accentNode = selectFromPool(accentCandidates, baseNode);
    const decorNode = selectFromPool(decorCandidates, accentNode);
    
    // 构建节点列表
    const nodes: BlendNode[] = [];
    let totalWeight = 0;
    
    const addNode = (id: BlendID, category: BlendNode['category']) => {
      const weight = this.calculateNodeWeight(id, E, A, V, performanceMetrics);
      if (totalWeight + weight <= this.config.maxTotalWeight) {
        nodes.push({ id, weight, category });
        totalWeight += weight;
      }
    };
    
    addNode(baseNode, 'Base');
    addNode(accentNode, 'Accent');
    if (performanceMetrics.fps >= 48) { // 只在性能良好时添加装饰层
      addNode(decorNode, 'Decor');
    }
    
    // 选择预设
    const presetScores = presets.map(preset => {
      let score = this.scorePreset(preset, E, A, V);
      score *= this.cooldownPenalty(preset.id, now);
      if (performanceMetrics.fps < 55 && preset.tags.cost > 3) {
        score *= 0.5;
      }
      return { preset, score };
    });
    
    const selectedPreset = this.selectByWeight(presetScores);
    
    return {
      nodes,
      presetId: selectedPreset?.preset.id
    };
  }
  
  /**
   * 计算节点权重
   */
  private calculateNodeWeight(
    id: BlendID,
    E: number,
    A: number,
    V: number,
    metrics: PerformanceMetrics
  ): number {
    // 基础权重计算（从原始算法）
    const baseWeight = this.paramFor(id, E, A, V);
    
    // 性能调整
    const performanceMultiplier = metrics.fps >= 55 ? 1.0 : 0.7;
    
    // 特殊节点处理
    if ((id === 'BloomHL' || id === 'TemporalTrail') && metrics.fps < 55) {
      return 0; // 低性能时禁用
    }
    
    return Math.min(this.config.maxNodeWeight, baseWeight * performanceMultiplier);
  }
  
  /**
   * 主调度函数
   */
  public schedule(
    mood: Mood,
    audioFeatures: AudioFeatures,
    nowPlaying: NowPlaying | undefined,
    performanceMetrics: PerformanceMetrics,
    presets: Preset[],
    now: number = Date.now()
  ): BlendPipeline {
    // 更新性能预测
    this.performancePredictor.addFrame(performanceMetrics.avgFrameMs);
    
    // 更新步进状态
    if (audioFeatures.beat > 0.6 || (now % 120 < 16)) {
      nextStep(this.stepState);
    }
    
    // 获取当前段落
    const segment = nowPlaying?.segment || segmentFromStep(this.stepState);
    
    // 计算统一驱动向量
    const driveVector = unifyDrive(mood, audioFeatures, { ...nowPlaying, segment });
    
    // 检查是否需要重建pipeline
    const needsRebuild = this.checkNeedsRebuild(driveVector, segment, now);
    
    if (needsRebuild || !this.current) {
      // 重新设置随机种子
      if (!this.current) {
        this.reseed(nowPlaying);
      }
      // 选择新的节点组合
      const { nodes, presetId } = this.selectNodes(
        driveVector,
        segment,
        performanceMetrics,
        presets,
        now
      );
      // 选择extras（生成器）
      const extras = selectExtras(mood);
      // 应用策略组合（若存在策略运行时）
      let pipelineDraft: BlendPipeline = { nodes: [...nodes], ttlMs: 0, presetId, extras };
      if (this.strategy){
        const stage = segment==='drop'?'drop':segment==='build'?'build':segment==='fill'?'fill':'idle';
        const combo = this.strategy.pick(now, mood as any, stage as any, 1000/Math.max(1, performanceMetrics.avgFrameMs));
        pipelineDraft = this.strategy.mergePipeline(pipelineDraft, combo as any) as any;
      }
      // 计算TTL
      const ttl = this.calculateTTL(driveVector, segment);
      // 创建新的pipeline
      this.current = { ...pipelineDraft, ttlMs: ttl };
      this.until = now + ttl;
      // 更新历史记录
      this.current.nodes.forEach(node => { this.history.push({ id: node.id, t: now }); });
      if (presetId) { this.history.push({ id: presetId, t: now }); }
      // 更新马尔可夫矩阵
      if (this.config.enableMarkov) { updateMarkovMatrix(this.markovMatrix, this.history); }
    }
    
    // 应用音频微策略
    if (this.current) {
      const microMods = pickMicroMods(now, audioFeatures, performanceMetrics.fps >= 55);
      applyMicroMods(microMods, this.current, performanceMetrics.fps >= 55, audioFeatures);
    }
    
    // 应用性能自适应
    if (this.config.enablePerformanceAdaptation && this.current) {
      this.current = applyPerformanceAdaptation(this.current, performanceMetrics);
    }
    
    // 保存驱动向量
    this.lastDriveVector = driveVector;
    
    // 输出前为部分权重添加蓝噪抖动，避免条带
    if (this.current){
      for (const n of this.current.nodes){
        const base = n.weight; n.weight = blueJitter(base, 0.02, this.mainRng);
      }
    }
    
    return this.current!;
  }
  
  public attachStrategy(runtime: StrategyRuntime){ this.strategy = runtime; }
  
  /**
   * 检查是否需要重建pipeline
   */
  private checkNeedsRebuild(
    driveVector: UnifiedDriveVector,
    segment: Segment,
    now: number
  ): boolean {
    if (!this.current || now > this.until) return true;
    
    // 段落变化
    if (segment === 'drop' && this.stepState.step === 0) return true;
    
    // 驱动向量大幅变化
    if (this.lastDriveVector) {
      const energyDiff = Math.abs(driveVector.E - this.lastDriveVector.E);
      const arousalDiff = Math.abs(driveVector.A - this.lastDriveVector.A);
      
      if (energyDiff > 0.18 || arousalDiff > 0.18) return true;
    }
    
    return false;
  }
  
  /**
   * 计算动态TTL
   */
  private calculateTTL(
    driveVector: UnifiedDriveVector,
    segment: Segment
  ): number {
    const [minTTL, maxTTL] = this.config.ttlRangeMs;
    
    if (!this.config.enableDynamicTTL) {
      return minTTL + this.rng() * (maxTTL - minTTL);
    }
    
    // 高能量或特殊段落使用较短TTL
    const isHighEnergy = driveVector.E > 0.75 || driveVector.A > 0.7;
    const isSpecialSegment = segment !== 'steady';
    
    if (isHighEnergy || isSpecialSegment) {
      return minTTL + this.rng() * (minTTL); // 15-30秒
    }
    
    return minTTL * 3 + this.rng() * (maxTTL - minTTL * 3); // 45-90秒
  }
  
  // 辅助函数（从原始LiquidMetalConductor移植）
  private scoreByMood(id: BlendID, E: number, A: number, V: number): number {
    switch (id) {
      case 'LumaSoftOverlay': return 0.6 + 0.4 * (1 - A);
      case 'SMix': return 0.55 + 0.3 * (1 - Math.abs(V));
      case 'OkLabLightness': return 0.5 + 0.4 * ((1 + V) / 2);
      case 'BoundedDodge': return 0.2 + 0.9 * E + 0.3 * A;
      case 'SoftBurn': return 0.2 + 0.8 * ((-V + 1) / 2);
      case 'StructureMix': return 0.45 + 0.5 * A;
      case 'DualCurve': return 0.3 + 0.9 * E + 0.2 * A;
      case 'SpecularGrad': return 0.35 + 0.5 * A;
      case 'GrainMerge': return 0.4 + 0.4 * (1 - A);
      case 'BloomHL': return 0.2 + 0.7 * E;
      case 'EdgeTint': return 0.35 + 0.4 * A + 0.2 * ((1 + V) / 2);
      case 'TemporalTrail': return 0.4 + 0.4 * (1 - A) + 0.2 * E;
    }
  }
  
  private paramFor(id: BlendID, E: number, V: number, A: number): number {
    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
    
    switch (id) {
      case 'LumaSoftOverlay': return clamp(0.08 + 0.06 * (1 - A), 0.06, 0.16);
      case 'SMix': return clamp(0.07 + 0.05 * (1 - Math.abs(V)), 0.05, 0.13);
      case 'OkLabLightness': return clamp(0.06 + 0.06 * ((1 + V) / 2), 0.05, 0.14);
      case 'BoundedDodge': return clamp(0.05 + 0.1 * E, 0.04, 0.16);
      case 'SoftBurn': return clamp(0.05 + 0.08 * ((-V + 1) / 2), 0.04, 0.14);
      case 'StructureMix': return clamp(0.05 + 0.09 * A, 0.04, 0.14);
      case 'DualCurve': return clamp(0.05 + 0.1 * E, 0.05, 0.16);
      case 'SpecularGrad': return clamp(0.04 + 0.08 * A, 0.03, 0.12);
      case 'GrainMerge': return clamp(0.04 + 0.06 * (1 - A), 0.03, 0.10);
      case 'BloomHL': return clamp(0.04 + 0.08 * E, 0.03, 0.12);
      case 'EdgeTint': return clamp(0.03 + 0.06 * (A * 0.7 + (1 + V) / 3), 0.02, 0.09);
      case 'TemporalTrail': return clamp(0.03 + 0.06 * (1 - A) + 0.03 * E, 0.02, 0.09);
      default: return 0.08;
    }
  }
  
  private scorePreset(preset: Preset, E: number, A: number, V: number): number {
    let score = 0.6 * preset.tags.metalScore + 
                0.2 * preset.tags.specularBoost + 
                0.2 * preset.tags.rippleAffinity;
    
    score += 0.35 * E * preset.tags.energyBias;
    score += 0.25 * A * preset.tags.arousalBias;
    score += 0.15 * ((V + 1) / 2) * preset.tags.valenceBias;
    score *= (1 - 0.5 * preset.tags.hueShiftRisk);
    
    return Math.max(0.001, score);
  }
  
  private selectByWeight<T>(items: Array<{ score: number } & T>): T | null {
    if (items.length === 0) return null;
    
    const totalWeight = items.reduce((sum, item) => sum + item.score, 0);
    let random = this.rng() * totalWeight;
    
    for (const item of items) {
      random -= item.score;
      if (random <= 0) return item;
    }
    
    return items[items.length - 1];
  }
}
