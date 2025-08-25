import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Track, 
  PlaybackState, 
  MusicPlayerState, 
  TermusicAPI,
  MusicPlayerEvents,
  defaultMusicPlayerState,
  formatTime,
  truncateText
} from './util/musicPlayerTypes';

interface MusicPlayerProps {
  isVisible?: boolean;
  isWelcomeMode?: boolean;
  termusicAPI?: TermusicAPI;
  events?: Partial<MusicPlayerEvents>;
  className?: string;
}

// 简化的SVG图标组件 - 重新设计为极简风格
const PlayIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-white/80">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const PauseIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-white/80">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
  </svg>
);

const VolumeIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
  </svg>
);

// Mock Termusic API for development
const createMockTermusicAPI = (): TermusicAPI => ({
  play: async () => console.log('🎵 Mock: Play'),
  pause: async () => console.log('⏸️ Mock: Pause'),
  stop: async () => console.log('⏹️ Mock: Stop'),
  next: async () => console.log('⏭️ Mock: Next'),  
  previous: async () => console.log('⏮️ Mock: Previous'),
  setVolume: async (volume: number) => console.log(`🔊 Mock: Set volume to ${volume}`),
  mute: async () => console.log('🔇 Mock: Mute'),
  unmute: async () => console.log('🔊 Mock: Unmute'),
  setRepeatMode: async (mode) => console.log(`🔁 Mock: Set repeat mode to ${mode}`),
  toggleShuffle: async () => console.log('🔀 Mock: Toggle shuffle'),
  seek: async (position: number) => console.log(`⏯️ Mock: Seek to ${position}`),
  loadPlaylist: async (tracks) => console.log('📂 Mock: Load playlist', tracks),
  addTrack: async (track) => console.log('➕ Mock: Add track', track),
  removeTrack: async (trackId) => console.log('➖ Mock: Remove track', trackId),
  getCurrentTrack: async () => ({
    id: 'demo-track-1',
    title: 'Deep Space Session',
    artist: 'Electronic Radio',
    album: 'Ambient Collection',
    duration: 248 * 60,
    coverUrl: undefined
  }),
  getPlaybackState: async () => ({
    isPlaying: false,
    currentTime: 0,
    duration: 248,
    volume: 0.7,
    isMuted: false,
    repeatMode: 'none' as const,
    shuffleMode: false,
  }),
  getPlaylist: async () => [],
});

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  isVisible = true,
  isWelcomeMode = false,
  termusicAPI,
  events = {},
  className = ''
}) => {
  // 状态管理
  const [playerState, setPlayerState] = useState<MusicPlayerState>(defaultMusicPlayerState);
  const [isHovered, setIsHovered] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  // 动画缓存清除功能
  useEffect(() => {
    const clearAnimationCache = () => {
      if (playerRef.current) {
        const elements = playerRef.current.querySelectorAll('[style*="will-change"]');
        elements.forEach(element => {
          if (element instanceof HTMLElement) {
            element.style.willChange = 'auto';
            setTimeout(() => {
              element.style.willChange = 'transform, opacity';
            }, 100);
          }
        });
      }
      
      if (window.gc) {
        window.gc();
      }
    };

    const interval = setInterval(clearAnimationCache, 30000); // 每30秒清理一次
    return () => clearInterval(interval);
  }, []);

  // 使用提供的API或Mock API
  const api = useMemo(() => termusicAPI || createMockTermusicAPI(), [termusicAPI]);

  // 初始化播放器状态
  useEffect(() => {
    const initializePlayer = async () => {
      try {
        const [currentTrack, playbackState, playlist] = await Promise.all([
          api.getCurrentTrack(),
          api.getPlaybackState(),
          api.getPlaylist()
        ]);

        setPlayerState(prev => ({
          ...prev,
          currentTrack,
          playbackState,
          playlist
        }));
      } catch (error) {
        console.warn('Failed to initialize music player:', error);
        events.onError?.('Failed to initialize music player');
      }
    };

    if (isVisible && !isWelcomeMode) {
      initializePlayer();
    }
  }, [isVisible, isWelcomeMode, api, events]);

  // 播放/暂停控制
  const togglePlayPause = useCallback(async () => {
    try {
      if (playerState.playbackState.isPlaying) {
        await api.pause();
      } else {
        await api.play();
      }
      
      const newState = await api.getPlaybackState();
      setPlayerState(prev => ({
        ...prev,
        playbackState: newState
      }));
      
      events.onPlaybackStateChange?.(newState);
    } catch (error) {
      console.error('Failed to toggle play/pause:', error);
      events.onError?.('Failed to control playback');
    }
  }, [api, playerState.playbackState.isPlaying, events]);

  // 音量控制
  const handleVolumeChange = useCallback(async (newVolume: number) => {
    try {
      await api.setVolume(newVolume);
      const newState = await api.getPlaybackState();
      setPlayerState(prev => ({
        ...prev,
        playbackState: newState
      }));
      events.onPlaybackStateChange?.(newState);
    } catch (error) {
      console.error('Failed to change volume:', error);
      events.onError?.('Failed to change volume');
    }
  }, [api, events]);

  // 如果在欢迎模式或不可见，则不显示
  if (isWelcomeMode || !isVisible) {
    return null;
  }

  return (
    <div
      ref={playerRef}
      className={`flex items-center space-x-4 text-white/80 h-full ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        willChange: 'transform, opacity',
      }}
    >
      {/* 播放/暂停按钮 - 与时钟风格统一 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          togglePlayPause();
        }}
        className="w-8 h-8 rounded-full border border-white/20 hover:border-white/40 flex items-center justify-center text-white/70 hover:text-white/90 transition-all duration-300 flex-shrink-0"
        aria-label={playerState.playbackState.isPlaying ? "暂停" : "播放"}
      >
        {playerState.playbackState.isPlaying ? (
          <PauseIcon size={12} />
        ) : (
          <PlayIcon size={12} />
        )}
      </motion.button>

      {/* 歌曲信息 - 中间区域 */}
      <div className="flex-1 min-w-0 max-w-[160px]">
        <div className="text-white/90 text-sm font-mono font-light tracking-tight truncate leading-tight">
          {playerState.currentTrack?.title 
            ? truncateText(playerState.currentTrack.title, 18)
            : 'RADIO'
          }
        </div>
        <div className="text-white/50 text-xs font-mono font-light tracking-wider truncate mt-0.5 leading-tight">
          {playerState.currentTrack?.artist 
            ? truncateText(playerState.currentTrack.artist, 20)
            : 'Electronic'
          }
        </div>
      </div>

      {/* 音量控制区域 - 右侧 */}
      <motion.div
        initial={{ opacity: 0.8 }}
        animate={{ opacity: isHovered ? 1 : 0.8 }}
        className="flex items-center space-x-3 flex-shrink-0"
      >
        <VolumeIcon size={12} />
        <div className="relative">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={playerState.playbackState.volume}
            onChange={(e) => {
              e.stopPropagation();
              handleVolumeChange(parseFloat(e.target.value));
            }}
            className="w-20 h-1 simple-slider"
            style={{
              background: `linear-gradient(to right, 
                rgba(255, 255, 255, 0.5) 0%, 
                rgba(255, 255, 255, 0.5) ${playerState.playbackState.volume * 100}%, 
                rgba(255, 255, 255, 0.15) ${playerState.playbackState.volume * 100}%, 
                rgba(255, 255, 255, 0.15) 100%)`,
            }}
            aria-label={`音量 ${Math.round(playerState.playbackState.volume * 100)}%`}
          />
        </div>

        {/* 播放状态指示器 */}
        <AnimatePresence>
          {playerState.playbackState.isPlaying && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse flex-shrink-0"
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};