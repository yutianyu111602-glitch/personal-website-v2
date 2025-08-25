import React from "react";
import { motion } from "motion/react";
import { RadioState, SnapState, SnapEdge } from "./types";
import { getNextSnapState } from "./positionLogic";
import { getSnapButtonIcon, getSnapButtonTitle, getSyncButtonClass, getSyncButtonTitle } from "./styleLogic";

/**
 * 电台UI组件模块
 * 包含所有UI组件的实现
 */

// 🧲 吸附切换按钮组件
export const SnapToggleButton: React.FC<{
  state: RadioState;
  setState: React.Dispatch<React.SetStateAction<RadioState>>;
  style: React.CSSProperties;
}> = ({ state, setState, style }) => (
  <motion.button
    style={style}
    onClick={() => {
      const { nextState, snappedEdge, position, freePosition } = getNextSnapState(
        state.snapState,
        state.position,
        state.freePosition,
        state.playerDims
      );
      
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
    }}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    title={getSnapButtonTitle(state.snapState === SnapState.Snapped)}
  >
    {getSnapButtonIcon(state.snapState === SnapState.Snapped)}
  </motion.button>
);

// 🎵 播放器头部组件
export const PlayerHeader: React.FC<{
  isMinimized: boolean;
  syncActive: boolean;
  onSyncToggle?: () => void;
  onClose?: () => void;
  t: any;
}> = ({ isMinimized, syncActive, onSyncToggle, onClose, t }) => (
  <div className="bg-silver-primary-90/95 backdrop-blur-md border border-silver-primary-60 rounded-t-lg p-3 flex items-center justify-between">
    <div className="flex items-center space-x-2">
      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
    </div>
    <div className="text-silver-primary-20 text-sm font-mono">
      {isMinimized ? 'RADIO' : 'TIANGONG RADIO'}
    </div>
    <div className="flex items-center space-x-2">
      <button
        onClick={onSyncToggle}
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${getSyncButtonClass(syncActive)}`}
        title={getSyncButtonTitle(syncActive)}
      >
        🔄
      </button>
      <button
        onClick={onClose}
        className="w-6 h-6 rounded-full bg-silver-primary-40 text-silver-primary-60 hover:bg-silver-primary-60 hover:text-silver-primary-20 transition-colors flex items-center justify-center text-xs"
        title="关闭播放器"
      >
        ✕
      </button>
    </div>
  </div>
);

// 🎵 当前播放信息组件
export const CurrentTrackInfo: React.FC<{
  currentTrack: any;
}> = ({ currentTrack }) => {
  if (!currentTrack) return null;
  
  return (
    <div className="mb-4 text-center">
      <div className="text-silver-primary-20 font-medium text-sm mb-1">
        {currentTrack.title}
      </div>
      {currentTrack.artist && (
        <div className="text-silver-primary-40 text-xs">
          {currentTrack.artist}
        </div>
      )}
      {currentTrack.key && (
        <div className="text-silver-primary-50 text-xs mt-1">
          调性: {currentTrack.key}
        </div>
      )}
    </div>
  );
};

// 🎵 音频数据信息组件
export const AudioDataInfo: React.FC<{
  bpm: number | null;
  energy: number | null;
}> = ({ bpm, energy }) => (
  <div className="w-full h-12 bg-silver-primary-90 rounded mb-4 flex items-center justify-center">
    <div className="text-center">
      <div className="text-silver-primary-40 text-xs">
        {bpm ? `BPM: ${bpm}` : '等待音频数据...'}
      </div>
      {energy !== null && (
        <div className="text-silver-primary-50 text-xs mt-1">
          能量: {Math.round(energy * 100)}%
        </div>
      )}
    </div>
  </div>
);

// 🎯 AI智能反馈组件
export const AIFeedbackSection: React.FC<{
  aiStatus: string;
  aiRecommendation: any;
  aidjMixManagerRef: React.RefObject<any>;
  setState: React.Dispatch<React.SetStateAction<RadioState>>;
}> = ({ aiStatus, aiRecommendation, aidjMixManagerRef, setState }) => (
  <div className="mb-4">
    {/* AI状态指示器 */}
    <div className="flex items-center justify-center mb-2">
      <div className={`w-3 h-3 rounded-full mr-2 ${
        aiStatus === 'idle' ? 'bg-silver-primary-40' :
        aiStatus === 'analyzing' ? 'bg-yellow-500 animate-pulse' :
        aiStatus === 'recommending' ? 'bg-green-500' :
        'bg-red-500'
      }`}></div>
      <span className="text-silver-primary-40 text-xs">
        {aiStatus === 'idle' ? 'AI待机' :
         aiStatus === 'analyzing' ? 'AI分析中' :
         aiStatus === 'recommending' ? 'AI推荐中' :
         'AI错误'}
      </span>
    </div>

    {/* AI推荐显示 */}
    {aiRecommendation && (
      <div className="bg-silver-primary-90/80 backdrop-blur-sm rounded-lg p-3 border border-silver-primary-60">
        <div className="text-center mb-2">
          <div className="text-silver-primary-20 font-medium text-sm">
            推荐手法: {aiRecommendation.technique}
          </div>
          {aiRecommendation.hint && (
            <div className="text-silver-primary-50 text-xs mt-1">
              参数: {JSON.stringify(aiRecommendation.hint)}
            </div>
          )}
        </div>
        
        {/* 推荐理由 */}
        <div className="space-y-1">
          <div className="text-silver-primary-40 text-xs font-medium">推荐理由:</div>
          {aiRecommendation.reason.map((reason: string, index: number) => (
            <div key={index} className="text-silver-primary-50 text-xs pl-2">
              • {reason}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* AI控制开关 */}
    <div className="flex items-center justify-center mt-2">
      <button
        onClick={() => {
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
        }}
        className="px-3 py-1 rounded-full text-xs transition-colors bg-silver-primary-60 text-silver-primary-20 hover:bg-silver-primary-80"
        title="切换AI推荐功能"
      >
        {aidjMixManagerRef.current?.getStatus()?.isEnabled ? '关闭AI' : '启用AI'}
      </button>
    </div>
  </div>
);

// 📜 播放列表信息组件
export const PlaylistInfo: React.FC<{
  currentPlaylist: any[];
  currentTrackIndex: number;
}> = ({ currentPlaylist, currentTrackIndex }) => {
  if (currentPlaylist.length === 0) return null;
  
  return (
    <div className="mt-4 text-center">
      <div className="text-silver-primary-40 text-xs">
        歌单: {currentTrackIndex + 1} / {currentPlaylist.length}
      </div>
      <div className="text-silver-primary-30 text-xs mt-1">
        {currentPlaylist[currentTrackIndex]?.title || '未选择歌曲'}
      </div>
    </div>
  );
};

// ⏳ 加载状态组件
export const LoadingIndicator: React.FC<{
  isLoading: boolean;
}> = ({ isLoading }) => {
  if (!isLoading) return null;
  
  return (
    <div className="mt-4 text-center">
      <div className="text-silver-primary-40 text-xs">加载中...</div>
    </div>
  );
};
