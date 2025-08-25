import { useState, useCallback, useMemo } from "react";
import { RadioState, SnapState, SnapEdge } from "./types";
import { getPlayerDimensions } from "./positionLogic";

/**
 * 电台状态管理模块
 * 负责所有状态逻辑和状态更新
 */
export const useRadioState = () => {
  // 🎯 统一状态管理 - 使用简化的状态接口
  const [state, setState] = useState<RadioState>(() => ({
    // 位置和吸附状态
    position: { x: 20, y: Math.max(20, window.innerHeight - 300) },
    snapState: SnapState.Free,
    snappedEdge: SnapEdge.None,
    freePosition: { x: 20, y: window.innerHeight - 280 - 20 },
    
    // 🎵 播放状态（只监听，不控制）
    isPlaying: false,
    volume: 0.6,
    currentTrack: null,
    
    // 歌单信息（只监听，不加载）
    currentPlaylist: [],
    currentTrackIndex: 0,
    
    // 音频特征数据（只监听，不分析）
    bpm: null,
    energy: null,
    
    // 🎯 AidjMix智能推荐状态
    aiRecommendation: null as {
      technique: string;
      hint?: any;
      reason: string[];
    } | null,
    aiStatus: 'idle' as 'idle' | 'analyzing' | 'recommending' | 'error',
    
    // UI状态
    isLoading: false,
    playerDims: getPlayerDimensions()
  }));

  // 🎯 状态更新函数
  const updateState = useCallback((updates: Partial<RadioState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // 🎯 位置更新函数
  const updatePosition = useCallback((newPosition: { x: number; y: number }) => {
    setState(prev => ({ ...prev, position: newPosition }));
  }, []);

  // 🎯 吸附状态更新函数
  const updateSnapState = useCallback((newSnapState: SnapState, newEdge: SnapEdge, newPosition: { x: number; y: number }) => {
    setState(prev => ({
      ...prev,
      snapState: newSnapState,
      snappedEdge: newEdge,
      position: newPosition
    }));
  }, []);

  // 🎯 播放状态更新函数
  const updatePlaybackState = useCallback((isPlaying: boolean) => {
    setState(prev => ({ ...prev, isPlaying }));
  }, []);

  // 🎯 音频数据更新函数
  const updateAudioData = useCallback((bpm: number | null, energy: number | null) => {
    setState(prev => ({ ...prev, bpm, energy }));
  }, []);

  // 🎯 AI推荐更新函数
  const updateAIRecommendation = useCallback((recommendation: any, status: 'idle' | 'analyzing' | 'recommending' | 'error') => {
    setState(prev => ({ 
      ...prev, 
      aiRecommendation: recommendation,
      aiStatus: status 
    }));
  }, []);

  // 🎯 计算最小化状态
  const isMinimized = useMemo(() => state.snapState === SnapState.Snapped, [state.snapState]);

  return {
    state,
    setState,
    updateState,
    updatePosition,
    updateSnapState,
    updatePlaybackState,
    updateAudioData,
    updateAIRecommendation,
    isMinimized
  };
};
