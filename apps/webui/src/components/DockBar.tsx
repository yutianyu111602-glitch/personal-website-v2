import React from 'react';

export interface DockBarProps {
  isPlaying: boolean;
  onExit: () => void;
  onPlayPause: () => void;
  onNext: () => void;
}

/**
 * DockBar - 底部最小化控制条（Focus 模式）
 * 无副作用：仅触发回调，由上层决定是否控制播放器
 */
export const DockBar: React.FC<DockBarProps> = ({ isPlaying, onExit, onPlayPause, onNext }) => {
  return (
    <div
      role="toolbar"
      aria-label="Focus Dock"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 'max(16px, env(safe-area-inset-bottom))',
        transform: 'translateX(-50%)',
        zIndex: 120,
        display: 'flex',
        gap: 12,
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 12,
        padding: '8px 10px',
        backdropFilter: 'blur(2px)',
      }}
    >
      <button
        onClick={onExit}
        title="返回"
        aria-label="返回"
        style={buttonStyle}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
      </button>
      <button
        onClick={onPlayPause}
        title={isPlaying ? '暂停' : '播放'}
        aria-label={isPlaying ? '暂停' : '播放'}
        style={buttonStyle}
      >
        {isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>
      <button
        onClick={onNext}
        title="下一首"
        aria-label="下一首"
        style={buttonStyle}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm9-12h2v12h-2V6z"/></svg>
      </button>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.05)',
  color: 'rgba(220,220,220,0.9)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

export default DockBar;


