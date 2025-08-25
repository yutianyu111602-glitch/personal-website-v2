import React from "react";
import { motion } from "motion/react";
import { RadioState, SnapState } from "../types";
import { getNextSnapState } from "../positionLogic";
import { getSnapButtonIcon, getSnapButtonTitle } from "../styleLogic";

/**
 * 🧲 吸附切换按钮组件
 * 
 * 功能：
 * - 一键切换吸附/展开/自由状态
 * - 自动计算下一个状态和位置
 * - 流畅的动画过渡效果
 * - 智能边缘检测和吸附
 * 
 * 职责：
 * - 状态切换逻辑
 * - 位置计算
 * - 用户交互反馈
 */
export const SnapToggleButton: React.FC<{
  state: RadioState;
  setState: React.Dispatch<React.SetStateAction<RadioState>>;
  style: React.CSSProperties;
}> = ({ state, setState, style }) => {
  // 处理吸附状态切换
  const handleSnapToggle = () => {
    const { nextState, snappedEdge, position, freePosition } = getNextSnapState(
      state.snapState,
      state.position,
      state.freePosition,
      state.playerDims
    );
    
    // 更新状态
    setState(prevState => ({
      ...prevState,
      snapState: nextState,
      snappedEdge,
      position,
      freePosition
    }));
    
    // 日志输出
    switch (nextState) {
      case SnapState.Snapped:
        console.log(`🧲 吸附到${snappedEdge}边缘`);
        break;
      case SnapState.Expanded:
        console.log(`📖 展开窗口`);
        break;
      case SnapState.Free:
        console.log(`🆓 恢复自由状态`);
        break;
    }
  };

  return (
    <motion.button
      style={style}
      onClick={handleSnapToggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={getSnapButtonTitle(state.snapState === SnapState.Snapped)}
      className="snap-toggle-button"
      aria-label="切换吸附状态"
    >
      {getSnapButtonIcon(state.snapState === SnapState.Snapped)}
    </motion.button>
  );
};
