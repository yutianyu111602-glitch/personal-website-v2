import { SnapState } from './types';

/**
 * 样式计算和UI逻辑模块
 * 负责处理组件样式、动画状态、UI计算等功能
 */

// 根据状态决定样式
export const getUIState = (snapState: SnapState) => {
  const isMinimized = snapState === SnapState.Snapped;
  const isExpanded = snapState === SnapState.Expanded;
  
  return { isMinimized, isExpanded };
};

// 计算容器样式
export const getContainerStyle = (
  position: { x: number; y: number },
  isMinimized: boolean
) => ({
  position: 'fixed' as const,
  left: position.x,
  top: position.y,
  width: isMinimized ? 60 : 360,
  height: 280,
  zIndex: 85,
  cursor: isMinimized ? 'pointer' : 'move',
  userSelect: 'none' as const,
  touchAction: 'none' as const,
});

// 计算内容样式
export const getContentStyle = (isMinimized: boolean) => ({
  opacity: isMinimized ? 0 : 1,
  transform: isMinimized ? 'scale(0.8)' : 'scale(1)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
});

// 计算吸附按钮样式
export const getSnapButtonStyle = (isMinimized: boolean) => ({
  position: 'absolute' as const,
  top: isMinimized ? '50%' : '10px',
  right: isMinimized ? '50%' : '10px',
  transform: isMinimized ? 'translate(50%, -50%)' : 'none',
  width: isMinimized ? 40 : 32,
  height: isMinimized ? 40 : 32,
  borderRadius: '50%',
  background: 'var(--silver-primary-80)',
  border: '2px solid var(--silver-primary-60)',
  color: 'var(--silver-primary-20)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: isMinimized ? '20px' : '16px',
  transition: 'all 0.2s ease',
  zIndex: 10,
});

// 获取吸附按钮图标
export const getSnapButtonIcon = (isMinimized: boolean) => {
  return isMinimized ? '▶' : '🧲';
};

// 获取吸附按钮标题
export const getSnapButtonTitle = (isMinimized: boolean) => {
  return isMinimized ? '展开播放器' : '吸附到边缘';
};

// 获取播放按钮图标
export const getPlayButtonIcon = (isPlaying: boolean) => {
  return isPlaying ? '⏸️' : '▶️';
};

// 获取播放按钮标题
export const getPlayButtonTitle = (isPlaying: boolean) => {
  return isPlaying ? '暂停' : '播放';
};

// 获取同步按钮样式类
export const getSyncButtonClass = (syncActive: boolean) => {
  return syncActive 
    ? 'bg-silver-primary-60 text-silver-primary-20' 
    : 'bg-silver-primary-40 text-silver-primary-60';
};

// 获取同步按钮标题
export const getSyncButtonTitle = (syncActive: boolean) => {
  return syncActive ? '同步已启用' : '同步已禁用';
};

// 获取音量显示文本
export const getVolumeText = (volume: number) => {
  return `${Math.round(volume * 100)}%`;
};

// 获取音量滑块标题
export const getVolumeSliderTitle = (volume: number) => {
  return `音量: ${Math.round(volume * 100)}%`;
};
