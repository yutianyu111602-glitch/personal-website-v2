import React from "react";

/**
 * ⏳ 加载状态组件
 * 
 * 功能：
 * - 显示加载状态指示器
 * - 优雅处理加载和非加载状态
 * - 提供用户友好的加载反馈
 * - 支持自定义加载文本
 * 
 * 职责：
 * - 加载状态展示
 * - 条件渲染管理
 * - 用户体验优化
 */
export const LoadingIndicator: React.FC<{
  isLoading: boolean;
  loadingText?: string;
}> = ({ isLoading, loadingText = "加载中..." }) => {
  // 如果没有加载，不渲染任何内容
  if (!isLoading) return null;
  
  return (
    <div className="mt-4 text-center">
      {/* ⏳ 加载指示器 */}
      <div className="text-silver-primary-40 text-xs">
        {loadingText}
      </div>
      
      {/* 🎨 可选的加载动画 */}
      <div className="mt-2 flex justify-center">
        <div className="w-2 h-2 bg-silver-primary-40 rounded-full animate-pulse mx-1"></div>
        <div className="w-2 h-2 bg-silver-primary-40 rounded-full animate-pulse mx-1" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-silver-primary-40 rounded-full animate-pulse mx-1" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
};
