import React from "react";
import { RadioState } from "../types";

/**
 * 🎨 UI组件类型定义文件
 * 
 * 功能：
 * - 定义所有UI组件的Props接口
 * - 提供类型安全和代码提示
 * - 统一组件接口规范
 * - 支持TypeScript类型检查
 */

// 🧲 吸附切换按钮组件Props
export interface SnapToggleButtonProps {
  state: RadioState;
  setState: React.Dispatch<React.SetStateAction<RadioState>>;
  style: React.CSSProperties;
}

// 🎵 播放器头部组件Props
export interface PlayerHeaderProps {
  isMinimized: boolean;
  syncActive: boolean;
  onSyncToggle?: () => void;
  onClose?: () => void;
  t: any;
}

// 🎵 当前播放信息组件Props
export interface CurrentTrackInfoProps {
  currentTrack: any;
}

// 🎵 音频数据信息组件Props
export interface AudioDataInfoProps {
  bpm: number | null;
  energy: number | null;
}

// 🎯 AI智能反馈组件Props
export interface AIFeedbackSectionProps {
  aiStatus: string;
  aiRecommendation: any;
  aidjMixManagerRef: React.RefObject<any>;
  setState: React.Dispatch<React.SetStateAction<RadioState>>;
}

// 🎯 AI状态指示器组件Props
export interface AIStatusIndicatorProps {
  aiStatus: string;
}

// 🎯 AI推荐显示组件Props
export interface AIRecommendationDisplayProps {
  aiRecommendation: any;
}

// 🎯 AI控制开关组件Props
export interface AIControlSwitchProps {
  aidjMixManagerRef: React.RefObject<any>;
  setState: React.Dispatch<React.SetStateAction<RadioState>>;
}

// 📜 播放列表信息组件Props
export interface PlaylistInfoProps {
  currentPlaylist: any[];
  currentTrackIndex: number;
}

// ⏳ 加载状态组件Props
export interface LoadingIndicatorProps {
  isLoading: boolean;
  loadingText?: string;
}

// 🎯 通用组件Props
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

// 🔧 组件状态类型
export interface ComponentState {
  isVisible: boolean;
  isEnabled: boolean;
  isLoading: boolean;
}

// 🎨 组件样式类型
export interface ComponentStyle {
  theme: 'light' | 'dark' | 'auto';
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size: 'small' | 'medium' | 'large';
}

// 切歌手法选择器属性
export interface TechniqueSelectorProps {
  className?: string;
  language?: string;
}

// 情绪监控器属性
export interface EmotionMonitorProps {
  className?: string;
  language?: string;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

// AidjMix决策显示属性
export interface AidjMixDecisionDisplayProps {
  className?: string;
  language?: string;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

// 预设使用监控属性
export interface PresetUsageMonitorProps {
  className?: string;
  language?: string;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

// 实时向量显示属性
export interface RealTimeVectorDisplayProps {
  className?: string;
  language?: string;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}
