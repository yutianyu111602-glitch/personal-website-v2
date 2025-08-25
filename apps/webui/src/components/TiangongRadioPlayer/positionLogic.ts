import { SnapEdge, SnapState } from './types';

/**
 * 位置计算和吸附逻辑模块
 * 负责处理窗口位置、边缘检测、吸附计算等功能
 */

// 自适应窗口尺寸计算
export const getPlayerDimensions = () => {
  // 使用视口比例并限制上下界，保证在不同屏幕下比例合理
  const width = Math.min(420, Math.max(280, Math.round(window.innerWidth * 0.34)));
  const height = Math.min(340, Math.max(220, Math.round(window.innerHeight * 0.28)));
  return { width, height };
};

// 智能边缘检测 - 找到距离最近的边缘
export const findNearestEdge = (
  x: number, 
  y: number, 
  playerDims: { width: number; height: number }
) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // 仅包含可吸附的四个边（不含 none）
  type EdgeKey = Exclude<SnapEdge, SnapEdge.None>;
  const distances: Record<EdgeKey, number> = {
    left: x,
    right: viewportWidth - x - playerDims.width,
    top: y,
    bottom: viewportHeight - y - playerDims.height
  };

  // 找到距离最短的边缘
  const nearestEdge = (Object.keys(distances) as EdgeKey[]).reduce((closest, edge) => {
    return distances[edge] < distances[closest] ? edge : closest;
  });

  // 计算吸附位置
  const snapPositions: Record<EdgeKey, { x: number; y: number }> = {
    left: { x: 0, y: Math.max(50, Math.min(viewportHeight - 150, y)) },
    // 右侧吸附：使用20px极窄条，不受组件宽度影响
    right: { x: viewportWidth - 20, y: Math.max(50, Math.min(viewportHeight - 150, y)) },
    top: { x: Math.max(50, Math.min(viewportWidth - 150, x)), y: 0 },
    bottom: { x: Math.max(50, Math.min(viewportWidth - 150, x)), y: viewportHeight - 20 }
  };

  return {
    edge: nearestEdge,
    position: snapPositions[nearestEdge]
  };
};

// 获取展开位置
export const getExpandedPosition = (
  snappedEdge: SnapEdge,
  freePosition: { x: number; y: number },
  playerDims: { width: number; height: number }
) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  switch (snappedEdge) {
    case SnapEdge.Left:
      return { x: 20, y: Math.max(20, Math.min(viewportHeight - (playerDims.height + 20), freePosition.y)) };
    case SnapEdge.Right:
      return { x: viewportWidth - (playerDims.width + 20), y: Math.max(20, Math.min(viewportHeight - (playerDims.height + 20), freePosition.y)) };
    case SnapEdge.Top:
      return { x: Math.max(20, Math.min(viewportWidth - (playerDims.width + 20), freePosition.x)), y: 20 };
    case SnapEdge.Bottom:
      return { x: Math.max(20, Math.min(viewportWidth - (playerDims.width + 20), freePosition.x)), y: viewportHeight - (playerDims.height + 20) };
    default:
      return freePosition;
  }
};

// 吸附状态切换逻辑
export const getNextSnapState = (
  currentState: SnapState,
  position: { x: number; y: number },
  freePosition: { x: number; y: number },
  playerDims: { width: number; height: number }
) => {
  switch (currentState) {
    case SnapState.Free:
      // 自由状态 → 吸附状态
      const { edge, position: snapPos } = findNearestEdge(position.x, position.y, playerDims);
      return {
        nextState: SnapState.Snapped,
        snappedEdge: edge,
        position: snapPos,
        freePosition: position
      };
      
    case SnapState.Snapped:
      // 吸附状态 → 展开状态
      const expandPos = getExpandedPosition(edge, freePosition, playerDims);
      return {
        nextState: SnapState.Expanded,
        snappedEdge: edge,
        position: expandPos,
        freePosition
      };
      
    case SnapState.Expanded:
      // 展开状态 → 自由状态
      return {
        nextState: SnapState.Free,
        snappedEdge: SnapEdge.None,
        position: freePosition,
        freePosition
      };
      
    default:
      return {
        nextState: SnapState.Free,
        snappedEdge: SnapEdge.None,
        position: freePosition,
        freePosition
      };
  }
};
