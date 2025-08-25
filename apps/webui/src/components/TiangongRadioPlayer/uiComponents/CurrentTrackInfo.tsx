import React from "react";

/**
 * 🎵 当前播放信息组件
 * 
 * 功能：
 * - 显示当前播放曲目的详细信息
 * - 支持曲目标题、艺术家、调性等信息
 * - 响应式设计，优雅处理空数据状态
 * - 统一的视觉风格和布局
 * 
 * 职责：
 * - 曲目信息展示
 * - 空状态处理
 * - UI渲染管理
 */
export const CurrentTrackInfo: React.FC<{
  currentTrack: any;
}> = ({ currentTrack }) => {
  // 如果没有当前曲目，不渲染任何内容
  if (!currentTrack) return null;
  
  return (
    <div className="mb-4 text-center">
      {/* 🎵 曲目标题 */}
      <div className="text-silver-primary-20 font-medium text-sm mb-1">
        {currentTrack.title}
      </div>
      
      {/* 👤 艺术家信息 */}
      {currentTrack.artist && (
        <div className="text-silver-primary-40 text-xs">
          {currentTrack.artist}
        </div>
      )}
      
      {/* 🎼 调性信息 */}
      {currentTrack.key && (
        <div className="text-silver-primary-50 text-xs mt-1">
          调性: {currentTrack.key}
        </div>
      )}
    </div>
  );
};
