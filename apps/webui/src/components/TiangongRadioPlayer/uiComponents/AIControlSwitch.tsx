import React from "react";
import { RadioState } from "../types";

/**
 * 🔧 AI控制开关组件
 * 
 * 功能：
 * - 提供AI功能的启用/禁用控制
 * - 显示当前AI功能状态
 * - 处理AI功能的开关逻辑
 * - 与状态管理系统协调
 * 
 * 职责：
 * - AI功能控制
 * - 状态同步管理
 * - 用户交互处理
 */
export const AIControlSwitch: React.FC<{
  aidjMixManagerRef: React.RefObject<any>;
  setState: React.Dispatch<React.SetStateAction<RadioState>>;
}> = ({ aidjMixManagerRef, setState }) => {
  // 处理AI功能开关
  const handleAIToggle = () => {
    if (aidjMixManagerRef.current) {
      const status = aidjMixManagerRef.current.getStatus();
      if (status.isEnabled) {
        aidjMixManagerRef.current.disable();
        setState(prev => ({ ...prev, aiStatus: 'idle', aiRecommendation: null }));
      } else {
        aidjMixManagerRef.current.enable();
        setState(prev => ({ ...prev, aiStatus: 'analyzing' }));
      }
    }
  };

  // 获取当前AI状态
  const isAIEnabled = aidjMixManagerRef.current?.getStatus()?.isEnabled || false;

  return (
    <div className="flex items-center justify-center mt-2">
      <button
        onClick={handleAIToggle}
        className="px-3 py-1 rounded-full text-xs transition-colors bg-silver-primary-60 text-silver-primary-20 hover:bg-silver-primary-80"
        title="切换AI推荐功能"
        aria-label="切换AI推荐功能"
      >
        {isAIEnabled ? '关闭AI' : '启用AI'}
      </button>
    </div>
  );
};
