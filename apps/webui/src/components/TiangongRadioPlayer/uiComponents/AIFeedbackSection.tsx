import React from "react";
import { RadioState } from "../types";
import { AIStatusIndicator } from "./AIStatusIndicator";
import { AIRecommendationDisplay } from "./AIRecommendationDisplay";
import { AIControlSwitch } from "./AIControlSwitch";

/**
 * 🎯 AI智能反馈组件 (重构后)
 * 
 * 功能：
 * - 组合AI状态指示器、推荐显示和控制开关
 * - 提供完整的AI功能交互界面
 * - 协调各个AI子组件的状态
 * - 保持组件的整体性和一致性
 * 
 * 职责：
 * - AI组件组合管理
 * - 状态协调和传递
 * - 组件间通信管理
 */
export const AIFeedbackSection: React.FC<{
  aiStatus: string;
  aiRecommendation: any;
  aidjMixManagerRef: React.RefObject<any>;
  setState: React.Dispatch<React.SetStateAction<RadioState>>;
}> = ({ aiStatus, aiRecommendation, aidjMixManagerRef, setState }) => {
  return (
    <div className="mb-4">
      {/* 🎯 AI状态指示器 */}
      <AIStatusIndicator aiStatus={aiStatus} />

      {/* 🤖 AI推荐显示 */}
      <AIRecommendationDisplay aiRecommendation={aiRecommendation} />

      {/* 🔧 AI控制开关 */}
      <AIControlSwitch 
        aidjMixManagerRef={aidjMixManagerRef}
        setState={setState}
      />
    </div>
  );
};
