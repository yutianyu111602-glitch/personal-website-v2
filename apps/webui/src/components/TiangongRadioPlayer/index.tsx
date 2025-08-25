import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { getTranslations } from "../util/i18n";
import { TiangongRadioPlayerProps } from "./types";
import { useRadioState } from "./stateManager";
import { useEventManager } from "./eventManager";
import { useWindowManager } from "./windowManager";
import {
  SnapToggleButton,
  PlayerHeader,
  CurrentTrackInfo,
  AudioDataInfo,
  AIFeedbackSection,
  PlaylistInfo,
  LoadingIndicator,
  TechniqueSelector
} from "./uiComponents";

/**
 * 天宫电台协调器 - V2版本重构（模块化版）
 * 
 * 核心特性：
 * - 🎯 纯事件协调 - 不直接播放音乐，只负责协调
 * - 🧲 智能边缘吸附 - 自动检测最近边缘
 * - 👆 一键切换状态 - 吸附/展开/自由状态循环
 * - 🎬 流畅动画过渡 - 状态间平滑切换
 * - 📍 位置记忆 - 记住用户偏好位置
 * - 🎵 事件系统集成 - 通过事件总线协调播放状态和歌单信息
 * - 📜 滚动适配 - 吸附状态下不受页面滚动影响
 * - 🔄 完全融入V2版本事件系统 - 与情绪核心完全兼容
 * - ⚡ 状态管理优化 - 简化的状态接口和高效的更新逻辑
 * - 🤖 AI智能建议 - 提供混音技术和情绪分析建议
 * - 🧩 模块化架构 - 代码分段，避免超时问题
 */
export const TiangongRadioPlayer: React.FC<TiangongRadioPlayerProps> = ({
  language,
  syncActive = false,
  onSyncToggle,
  onClose,
  autoPlayOnMount = false,
  preloadOnly = false
}) => {
  // 🎯 使用状态管理模块
  const {
    state,
    setState,
    updateSnapState,
    isMinimized
  } = useRadioState();

  // 🎯 使用事件管理模块
  const { aidjMixManagerRef } = useEventManager(state, setState, updateSnapState);

  // 🎯 使用窗口管理模块
  const { containerStyle, contentStyle, snapButtonStyle } = useWindowManager(state, setState, () => {});

  // 🎯 获取翻译
  const t = getTranslations(language);

  // 🎵 自动播放准备状态
  const autoplayArmedRef = useRef(false);

  // 首次用户点击后自动尝试播放（满足浏览器手势策略）
  useEffect(() => {
    const onFirstUserGesture = async () => {
      if (!autoplayArmedRef.current) return;
      autoplayArmedRef.current = false;
      
      // 通过事件系统尝试播放
      if (state.currentPlaylist.length > 0) {
        // 🎯 电台不直接控制播放，只监听
        console.log('🎵 电台: 监听到播放请求，但不直接控制');
      }
    };
    window.addEventListener('click', onFirstUserGesture, { once: true, capture: true });
    return () => {
      try { window.removeEventListener('click', onFirstUserGesture, true as any); } catch {}
    };
  }, [state.currentPlaylist]);

  if (preloadOnly) {
    return null;
  }

  return (
    <motion.div
      style={containerStyle}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* 🧲 吸附切换按钮 */}
      <SnapToggleButton
        state={state}
        setState={setState}
        style={snapButtonStyle}
      />

      {/* 🎵 主内容区域 */}
      <motion.div style={contentStyle}>
        {/* 🎵 播放器头部 */}
        <PlayerHeader
          isMinimized={isMinimized}
          syncActive={syncActive}
          onSyncToggle={onSyncToggle}
          onClose={onClose}
          t={t}
        />

        {/* 🎵 播放器主体 */}
        <div className="bg-silver-primary-95/95 backdrop-blur-md border-x border-b border-silver-primary-60 rounded-b-lg p-4">
          {/* 🎵 当前播放信息 */}
          <CurrentTrackInfo currentTrack={state.currentTrack} />

          {/* 🎵 音频数据信息 - 通过事件系统获取 */}
          <AudioDataInfo bpm={state.bpm} energy={state.energy} />

          {/* 🎯 AI智能反馈区域 */}
          <AIFeedbackSection
            aiStatus={state.aiStatus}
            aiRecommendation={state.aiRecommendation}
            aidjMixManagerRef={aidjMixManagerRef}
            setState={setState}
          />

          {/* 📜 播放列表信息 */}
          <PlaylistInfo
            currentPlaylist={state.currentPlaylist}
            currentTrackIndex={state.currentTrackIndex}
          />

          {/* ⏳ 加载状态 */}
          <LoadingIndicator isLoading={state.isLoading} />
        </div>
      </motion.div>

      {/* 🎯 AI切歌手法建议选择器 */}
      <TechniqueSelector language={language} />
    </motion.div>
  );
};