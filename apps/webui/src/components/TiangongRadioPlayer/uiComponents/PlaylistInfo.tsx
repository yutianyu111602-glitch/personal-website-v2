import React from "react";

/**
 * 📜 播放列表信息组件
 * 
 * 功能：
 * - 显示当前播放列表状态
 * - 展示当前曲目在列表中的位置
 * - 提供歌单信息概览
 * - 优雅处理空列表状态
 * 
 * 职责：
 * - 播放列表状态展示
 * - 曲目位置信息显示
 * - 空状态处理
 */
export const PlaylistInfo: React.FC<{
  currentPlaylist: any[];
  currentTrackIndex: number;
}> = ({ currentPlaylist, currentTrackIndex }) => {
  // 如果没有播放列表，不渲染任何内容
  if (currentPlaylist.length === 0) return null;
  
  return (
    <div className="mt-4 text-center">
      {/* 📊 播放列表统计 */}
      <div className="text-silver-primary-40 text-xs">
        歌单: {currentTrackIndex + 1} / {currentPlaylist.length}
      </div>
      
      {/* 🎵 当前曲目信息 */}
      <div className="text-silver-primary-30 text-xs mt-1">
        {currentPlaylist[currentTrackIndex]?.title || '未选择歌曲'}
      </div>
    </div>
  );
};
