import React, { useEffect, useCallback, useMemo } from "react";
import { getPlayerDimensions, findNearestEdge, getExpandedPosition } from "./positionLogic";
import { RadioState, SnapState } from "./types";

/**
 * 电台窗口管理模块
 * 负责窗口大小变化、位置计算和样式管理
 */
export const useWindowManager = (
  state: RadioState,
  setState: React.Dispatch<React.SetStateAction<RadioState>>,
  updatePosition: (position: { x: number; y: number }) => void
) => {
  // 📏 窗口大小变化处理 - 优化：使用useCallback减少重新创建
  const findNearestEdgeMemo = useCallback(findNearestEdge, []);
  const getExpandedPositionMemo = useCallback(getExpandedPosition, []);

  // 🎨 根据状态决定样式 - 优化：使用useMemo缓存计算结果
  const uiState = useMemo(() => {
    // 这里需要根据实际的getUIState函数实现
    return {
      isMinimized: state.snapState === SnapState.Snapped,
      isExpanded: state.snapState === SnapState.Expanded
    };
  }, [state.snapState]);

  const containerStyle = useMemo(() => {
    // 这里需要根据实际的getContainerStyle函数实现
    return {
      position: 'fixed' as const,
      left: state.position.x,
      top: state.position.y,
      zIndex: 1000,
      transform: uiState.isMinimized ? 'scale(0.8)' : 'scale(1)',
      transition: 'all 0.3s ease'
    };
  }, [state.position, uiState.isMinimized]);

  const contentStyle = useMemo(() => {
    // 这里需要根据实际的getContentStyle函数实现
    return {
      display: uiState.isMinimized ? 'none' : 'block',
      opacity: uiState.isMinimized ? 0 : 1,
      transition: 'opacity 0.3s ease'
    };
  }, [uiState.isMinimized]);

  const snapButtonStyle = useMemo(() => {
    // 这里需要根据实际的getSnapButtonStyle函数实现
    return {
      position: 'absolute' as const,
      top: '10px',
      right: '10px',
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      backgroundColor: '#666',
      border: 'none',
      cursor: 'pointer',
      zIndex: 1001
    };
  }, [uiState.isMinimized]);

  // 📏 窗口大小变化处理
  useEffect(() => {
    const handleResize = () => {
      const newDims = getPlayerDimensions();
      
      setState(prevState => {
        const newState = { ...prevState, playerDims: newDims };
        
        if (prevState.snapState === SnapState.Snapped) {
          // 重新计算吸附位置
          const { position: newSnapPos } = findNearestEdgeMemo(prevState.freePosition.x, prevState.freePosition.y);
          newState.position = newSnapPos;
        } else if (prevState.snapState === SnapState.Expanded) {
          // 重新计算展开位置
          const newExpandPos = getExpandedPositionMemo();
          newState.position = newExpandPos;
        } else {
          // 自由状态，确保在安全区域内
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;
          const safeX = Math.max(20, Math.min(windowWidth - (newDims.width + 20), prevState.position.x));
          const safeY = Math.max(20, Math.min(windowHeight - (newDims.height + 20), prevState.position.y));
          newState.position = { x: safeX, y: safeY };
          newState.freePosition = { x: safeX, y: safeY };
        }
        
        return newState;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [findNearestEdgeMemo, getExpandedPositionMemo, setState]);

  return {
    uiState,
    containerStyle,
    contentStyle,
    snapButtonStyle
  };
};
