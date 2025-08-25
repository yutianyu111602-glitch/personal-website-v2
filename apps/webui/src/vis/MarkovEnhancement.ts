/**
 * MarkovEnhancement.ts - 马尔可夫链增强选择算法
 * 使用马尔可夫链来增强节点选择的连续性，避免突兀的跳变
 */

import type { BlendID } from './LiquidMetalConductor';

// 马尔可夫转移概率矩阵
export type MarkovMatrix = {
  [from: string]: {
    [to: string]: number;
  };
};

/**
 * 创建默认的马尔可夫转移矩阵
 * 相近的效果之间有更高的转移概率
 */
export function createDefaultMarkovMatrix(): MarkovMatrix {
  const matrix: MarkovMatrix = {};
  
  // 定义相似度关系
  const addTransition = (from: BlendID, to: BlendID, weight: number) => {
    if (!matrix[from]) matrix[from] = {};
    matrix[from][to] = weight;
  };
  
  // Base层内部转换（平滑）
  addTransition('LumaSoftOverlay', 'SMix', 0.6);
  addTransition('SMix', 'OkLabLightness', 0.5);
  addTransition('OkLabLightness', 'LumaSoftOverlay', 0.5);
  
  // Accent层内部转换（中等）
  addTransition('BoundedDodge', 'DualCurve', 0.4);
  addTransition('DualCurve', 'SpecularGrad', 0.4);
  addTransition('SpecularGrad', 'StructureMix', 0.3);
  addTransition('StructureMix', 'SoftBurn', 0.3);
  addTransition('SoftBurn', 'BoundedDodge', 0.3);
  
  // Decor层内部转换（装饰性）
  addTransition('GrainMerge', 'EdgeTint', 0.4);
  addTransition('EdgeTint', 'TemporalTrail', 0.3);
  addTransition('TemporalTrail', 'BloomHL', 0.3);
  addTransition('BloomHL', 'GrainMerge', 0.3);
  
  // 跨层转换（较低概率）
  addTransition('LumaSoftOverlay', 'BoundedDodge', 0.2);
  addTransition('SMix', 'StructureMix', 0.2);
  addTransition('BoundedDodge', 'GrainMerge', 0.15);
  addTransition('StructureMix', 'EdgeTint', 0.15);
  
  return matrix;
}

/**
 * 应用马尔可夫链增强到权重计算
 */
export function applyMarkovEnhancement(
  currentWeight: number,
  fromNode: BlendID | undefined,
  toNode: BlendID,
  markovMatrix: MarkovMatrix
): number {
  if (!fromNode) return currentWeight;
  
  const transitionWeight = markovMatrix[fromNode]?.[toNode] || 0;
  
  // 增强权重：基础权重 * (1 + 转移概率)
  return currentWeight * (1 + transitionWeight);
}

/**
 * 学习和更新马尔可夫矩阵
 * 根据历史转换记录动态调整转移概率
 */
export function updateMarkovMatrix(
  matrix: MarkovMatrix,
  history: Array<{ id: string; t: number }>,
  learningRate: number = 0.1
): void {
  for (let i = 1; i < history.length; i++) {
    const from = history[i - 1].id;
    const to = history[i].id;
    
    if (!matrix[from]) matrix[from] = {};
    
    // 增强观察到的转换
    const currentWeight = matrix[from][to] || 0;
    matrix[from][to] = currentWeight + learningRate * (1 - currentWeight);
    
    // 稍微减弱其他转换
    for (const other in matrix[from]) {
      if (other !== to) {
        matrix[from][other] *= (1 - learningRate * 0.1);
      }
    }
  }
}

/**
 * 获取最可能的下一个节点（用于预测）
 */
export function predictNextNode(
  currentNode: BlendID,
  markovMatrix: MarkovMatrix
): BlendID | null {
  const transitions = markovMatrix[currentNode];
  if (!transitions) return null;
  
  let maxWeight = 0;
  let bestNode: BlendID | null = null;
  
  for (const [node, weight] of Object.entries(transitions)) {
    if (weight > maxWeight) {
      maxWeight = weight;
      bestNode = node as BlendID;
    }
  }
  
  return bestNode;
}
