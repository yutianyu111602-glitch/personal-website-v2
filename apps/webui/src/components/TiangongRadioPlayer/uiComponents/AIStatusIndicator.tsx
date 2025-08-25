import React from "react";

/**
 * 🎯 AI状态指示器组件
 * 
 * 功能：
 * - 显示AI分析状态的可视化指示器
 * - 支持多种状态：待机、分析中、推荐中、错误
 * - 提供动画效果和状态文本
 * - 统一的视觉风格和交互体验
 * 
 * 职责：
 * - AI状态可视化
 * - 状态文本管理
 * - 动画效果控制
 */
export const AIStatusIndicator: React.FC<{
  aiStatus: string;
}> = ({ aiStatus }) => {
  // 获取AI状态指示器样式
  const getAIStatusStyle = () => {
    switch (aiStatus) {
      case 'idle':
        return 'bg-silver-primary-40';
      case 'analyzing':
        return 'bg-yellow-500 animate-pulse';
      case 'recommending':
        return 'bg-green-500';
      default:
        return 'bg-red-500';
    }
  };

  // 获取AI状态文本
  const getAIStatusText = () => {
    switch (aiStatus) {
      case 'idle':
        return 'AI待机';
      case 'analyzing':
        return 'AI分析中';
      case 'recommending':
        return 'AI推荐中';
      default:
        return 'AI错误';
    }
  };

  return (
    <div className="flex items-center justify-center mb-2">
      <div className={`w-3 h-3 rounded-full mr-2 ${getAIStatusStyle()}`}></div>
      <span className="text-silver-primary-40 text-xs">
        {getAIStatusText()}
      </span>
    </div>
  );
};
