/**
 * 高级音乐播放器组件
 * 集成Termusic后端、WaveSurfer波形显示、统一音量控制
 * 银色主题设计，极简交互，优化内存使用
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WaveformPlayer } from './WaveformPlayer';
import { getTermusicConnector, TermusicConnector } from './util/termusicConnector';
import { 
  Track, 
  PlaybackState, 
  MusicPlayerState, 
  MusicPlayerEvents,
  defaultMusicPlayerState,
  formatTime 
} from './util/musicPlayerTypes';

interface AdvancedMusicPlayerProps {
  isVisible?: boolean;
  isWelcomeMode?: boolean;
  events?: Partial<MusicPlayerEvents>;
  className?: string;
  enableWaveform?: boolean;
  enableTermusicBackend?: boolean;
  mousePosition?: { x: number; y: number };
}

// 播放器状态枚举
enum PlayerStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// SVG 图标组件 - 银色主题优化
const PlayIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const PauseIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V6h-4z"/>
  </svg>
);

const VolumeIcon = ({ size = 14, level = 1 }: { size?: number; level?: number }) => {
  if (level === 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.5 12c0 1.77-1.02 3.29-2.5 4.03V7.97c1.48.74 2.5 2.26 2.5 4.03z"/>
      </svg>
    );
  }
  
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3z"/>
      {level >= 0.3 && <path d="m16.5 12c0 1.77-1.02 3.29-2.5 4.03V7.97c1.48.74 2.5 2.26 2.5 4.03z"/>}
      {level >= 0.7 && <path d="M19 12c0 2.53-1.71 4.68-4 5.29v-2.06c2.29.61 4 2.76 4 5.29z"/>}
    </svg>
  );
};

const NextIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
  </svg>
);

const PrevIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
  </svg>
);

// 状态指示器组件
const StatusIndicator = ({ status }: { status: PlayerStatus }) => {
  const getStatusColor = () => {
    switch (status) {
      case PlayerStatus.CONNECTED: return 'rgba(34, 197, 94, 0.8)';
      case PlayerStatus.CONNECTING: return 'rgba(251, 191, 36, 0.8)';
      case PlayerStatus.ERROR: return 'rgba(239, 68, 68, 0.8)';
      default: return 'rgba(156, 163, 175, 0.5)';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case PlayerStatus.CONNECTED: return 'LIVE';
      case PlayerStatus.CONNECTING: return 'SYNC';
      case PlayerStatus.ERROR: return 'ERR';
      default: return 'OFF';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <motion.div
        className="w-2 h-2 rounded-full"
        style={{ background: getStatusColor() }}
        animate={status === PlayerStatus.CONNECTING ? {
          scale: [1, 1.3, 1],
          opacity: [0.7, 1, 0.7]
        } : status === PlayerStatus.CONNECTED ? {
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <div 
        className="font-mono text-xs"
        style={{ color: getStatusColor() }}
      >
        {getStatusText()}
      </div>
    </div>
  );
};

// 统一音量滑块组件
const UnifiedVolumeSlider = ({ 
  volume, 
  onChange,
  className = ''
}: { 
  volume: number; 
  onChange: (volume: number) => void;
  className?: string;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localVolume, setLocalVolume] = useState(volume);

  useEffect(() => {
    setLocalVolume(volume);
  }, [volume]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setLocalVolume(newVolume);
    onChange(newVolume);
  }, [onChange]);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <VolumeIcon 
        size={12} 
        level={localVolume} 
      />
      <div className="relative flex-1 min-w-[80px]">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={localVolume}
          onChange={handleVolumeChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className="w-full h-1 bg-transparent cursor-pointer advanced-music-volume-slider"
          style={{
            outline: 'none'
          }}
        />
        {/* 自定义轨道背景 */}
        <div 
          className="absolute top-1/2 left-0 w-full h-1 rounded-full pointer-events-none transform -translate-y-1/2"
          style={{ background: 'rgba(192, 197, 206, 0.3)' }}
        />
        {/* 动态进度条 */}
        <div 
          className="absolute top-1/2 left-0 h-1 rounded-full pointer-events-none transform -translate-y-1/2 transition-all duration-200"
          style={{ 
            width: `${localVolume * 100}%`,
            background: `linear-gradient(90deg, 
              rgba(192, 197, 206, 0.8) 0%, 
              rgba(192, 197, 206, 0.9) 50%, 
              rgba(255, 255, 255, 0.7) 100%)`,
            boxShadow: isDragging ? '0 0 8px rgba(192, 197, 206, 0.6)' : 'none'
          }}
        />
      </div>
      <div className="font-mono text-xs text-white/60 min-w-[24px] text-right">
        {Math.round(localVolume * 100)}
      </div>
    </div>
  );
};

export const AdvancedMusicPlayer: React.FC<AdvancedMusicPlayerProps> = ({
  isVisible = true,
  isWelcomeMode = false,
  events = {},
  className = '',
  enableWaveform = true,
  enableTermusicBackend = true,
  mousePosition = { x: 0, y: 0 }
}) => {
  // 状态管理
  const [playerState, setPlayerState] = useState<MusicPlayerState>(defaultMusicPlayerState);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>(PlayerStatus.DISCONNECTED);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false); // 新增：同步状态
  const [showSyncGlow, setShowSyncGlow] = useState(false); // 新增：SYNC发光状态

  // Refs
  const connectorRef = useRef<TermusicConnector | null>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const syncGlowTimerRef = useRef<NodeJS.Timeout | null>(null); // 新增：SYNC发光计时器

  // 初始化Termusic连接器
  useEffect(() => {
    if (enableTermusicBackend && !connectorRef.current) {
      try {
        connectorRef.current = getTermusicConnector({
          enableWebSocket: true,
          timeout: 3000,
        });

        // 监听连接状态变化
        connectorRef.current.addEventListener('connected', () => {
          setPlayerStatus(PlayerStatus.CONNECTED);
          console.log('🎵 Termusic后端连接成功');
        });

        connectorRef.current.addEventListener('disconnected', () => {
          setPlayerStatus(PlayerStatus.DISCONNECTED);
          console.log('🔌 Termusic后端连接断开');
        });

        connectorRef.current.addEventListener('error', (error: any) => {
          setPlayerStatus(PlayerStatus.ERROR);
          console.error('❌ Termusic后端错误:', error);
          events.onError?.(error.message || 'Backend connection error');
        });

        // 监听音乐状态变化
        connectorRef.current.addEventListener('track_change', (track: Track) => {
          setPlayerState(prev => ({ ...prev, currentTrack: track }));
          events.onTrackChange?.(track);
        });

        connectorRef.current.addEventListener('playback_state', (state: PlaybackState) => {
          setPlayerState(prev => ({ ...prev, playbackState: state }));
          events.onPlaybackStateChange?.(state);
        });

        setPlayerStatus(PlayerStatus.CONNECTING);
      } catch (error) {
        console.error('Termusic连接器初始化失败:', error);
        setPlayerStatus(PlayerStatus.ERROR);
      }
    }

    return () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
      if (syncGlowTimerRef.current) {
        clearTimeout(syncGlowTimerRef.current);
      }
    };
  }, [enableTermusicBackend, events]);

  // 获取API实例
  const api = useMemo(() => {
    return connectorRef.current || null;
  }, [connectorRef.current]);

  // 定期更新播放状态
  useEffect(() => {
    if (api && playerStatus === PlayerStatus.CONNECTED && playerState.playbackState.isPlaying) {
      updateTimerRef.current = setInterval(async () => {
        try {
          const newState = await api.getPlaybackState();
          setPlayerState(prev => ({ ...prev, playbackState: newState }));
          setLastUpdateTime(Date.now());
        } catch (error) {
          console.warn('播放状态更新失败:', error);
        }
      }, 1000);
    } else {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
        updateTimerRef.current = null;
      }
    }

    return () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
    };
  }, [api, playerStatus, playerState.playbackState.isPlaying]);

  // 初始化播放器数据
  useEffect(() => {
    const initializePlayerData = async () => {
      if (!api || playerStatus !== PlayerStatus.CONNECTED) return;

      try {
        const [currentTrack, playbackState, playlist] = await Promise.all([
          api.getCurrentTrack(),
          api.getPlaybackState(),
          api.getPlaylist()
        ]);

        setPlayerState({
          currentTrack,
          playbackState,
          playlist,
          isVisible: true,
          isMinimized: false
        });

        console.log('🎵 播放器数据初始化完成');
      } catch (error) {
        console.error('播放器数据初始化失败:', error);
        events.onError?.('Failed to load player data');
      }
    };

    if (isVisible && !isWelcomeMode) {
      initializePlayerData();
    }
  }, [api, playerStatus, isVisible, isWelcomeMode, events]);

  // 播放控制函数
  const togglePlayPause = useCallback(async () => {
    if (!api) return;

    try {
      if (playerState.playbackState.isPlaying) {
        await api.pause();
      } else {
        await api.play();
      }
    } catch (error) {
      console.error('播放控制失败:', error);
      events.onError?.('Playback control failed');
    }
  }, [api, playerState.playbackState.isPlaying, events]);

  const skipNext = useCallback(async () => {
    if (!api) return;
    
    try {
      await api.next();
    } catch (error) {
      console.error('下一首失败:', error);
      events.onError?.('Skip to next failed');
    }
  }, [api, events]);

  const skipPrevious = useCallback(async () => {
    if (!api) return;
    
    try {
      await api.previous();
    } catch (error) {
      console.error('上一首失败:', error);
      events.onError?.('Skip to previous failed');
    }
  }, [api, events]);

  const handleVolumeChange = useCallback(async (volume: number) => {
    if (!api) return;

    try {
      await api.setVolume(volume);
    } catch (error) {
      console.error('音量调节失败:', error);
      events.onError?.('Volume control failed');
    }
  }, [api, events]);

  const handleSeek = useCallback(async (time: number) => {
    if (!api) return;

    try {
      await api.seek(time);
    } catch (error) {
      console.error('进度调节失败:', error);
      events.onError?.('Seek failed');
    }
  }, [api, events]);

  // 新增：同步处理函数
  const handleSync = useCallback(async () => {
    if (!api || isSyncing) return;

    setIsSyncing(true);
    setShowSyncGlow(true); // 开始发光
    
    try {
      // TODO: 实现与Termusic服务器的歌曲同步逻辑
      // 这里应该调用API来同步当前播放状态、播放列表等
      // 示例接口调用：
      // await api.syncWithServer();
      // await api.refreshPlaylist();
      // await api.syncTrackMetadata();
      
      console.log('🔄 开始同步音乐数据...');
      
      // 模拟同步过程
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 同步完成后刷新播放器状态
      const [currentTrack, playbackState, playlist] = await Promise.all([
        api.getCurrentTrack(),
        api.getPlaybackState(),
        api.getPlaylist()
      ]);

      setPlayerState({
        currentTrack,
        playbackState,
        playlist,
        isVisible: true,
        isMinimized: false
      });

      console.log('✅ 音乐数据同步完成');
      events.onTrackChange?.(currentTrack);
      
    } catch (error) {
      console.error('同步失败:', error);
      events.onError?.('Sync failed');
    } finally {
      setIsSyncing(false);
      
      // 30秒后停止发光效果
      if (syncGlowTimerRef.current) {
        clearTimeout(syncGlowTimerRef.current);
      }
      syncGlowTimerRef.current = setTimeout(() => {
        setShowSyncGlow(false);
      }, 30000); // 30秒
    }
  }, [api, isSyncing, events]);

  // 如果在欢迎模式或不可见，则不显示
  if (isWelcomeMode || !isVisible) {
    return null;
  }

  return (
    <motion.div
      ref={playerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        x: mousePosition.x * 0.1, // 减少鼠标感应强度优化性能
        y: mousePosition.y * 0.1,
      }}
      className={`relative ${className}`}
      style={{
        transition: "transform 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)", // 延长过渡时间减少卡顿
      }}
    >
      {/* 主播放器容器 - 加宽设计 */}
      <motion.div
        className="minimal-glass rounded-2xl overflow-hidden"
        style={{
          backdropFilter: 'none', // 强制禁用backdrop-filter避免累积变暗
          WebkitBackdropFilter: 'none', // 强制禁用webkit版本
          background: 'rgba(192, 197, 206, 0.01)' // 极微弱背景
        }}
        whileHover={{ scale: 1.01 }} // 减少缩放幅度优化性能
        transition={{ duration: 0.4 }} // 延长hover动画时间
        onHoverStart={() => setIsExpanded(true)}
        onHoverEnd={() => setIsExpanded(false)}
      >
        {/* 顶部控制栏 - 加宽布局优化 */}
        <div className="flex items-center justify-between p-6"> {/* 增加padding */}
          {/* 左侧：播放控制 + 音量控制区域 - 增加间距 */}
          <div className="flex items-center space-x-6 flex-1"> {/* 增加间距 */}
            {/* 美化的播放按钮 - 更圆更大 */}
            <motion.button
              whileHover={{ scale: 1.08 }} // 减少缩放避免卡顿
              whileTap={{ scale: 0.95 }}
              onClick={togglePlayPause}
              className="w-12 h-12 rounded-full border-2 border-white/40 hover:border-white/60 flex items-center justify-center text-white/85 hover:text-white/95 transition-all duration-400"
              style={{
                background: 'transparent', // 激进修复：完全透明背景
                boxShadow: 'none', // 移除阴影
              }}
              disabled={!api}
            >
              {playerState.playbackState.isPlaying ? (
                <PauseIcon size={16} />
              ) : (
                <PlayIcon size={16} />
              )}
            </motion.button>

            {/* 音量控制区域 - 增加宽度 */}
            <div className="flex flex-col space-y-2 min-w-[160px]"> {/* 增加最小宽度 */}
              {/* SYNC状态指示器 - 可点击，支持黄光效果 */}
              <motion.button
                onClick={handleSync}
                disabled={!api || isSyncing}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all duration-400 ${
                  showSyncGlow ? 'animate-sync-yellow-glow' : (isSyncing ? 'animate-tech-glow' : '')
                }`}
                style={{
                  background: 'transparent',
                  border: `1px solid ${
                    showSyncGlow
                      ? 'rgba(251, 191, 36, 0.4)'
                      : isSyncing 
                      ? 'rgba(192, 197, 206, 0.3)' 
                      : 'rgba(192, 197, 206, 0.1)'
                  }`
                }}
              >
                <motion.div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ 
                    background: showSyncGlow
                      ? 'rgba(251, 191, 36, 0.9)' // 黄色指示点
                      : playerStatus === PlayerStatus.CONNECTED 
                      ? 'rgba(34, 197, 94, 0.8)' 
                      : 'rgba(156, 163, 175, 0.5)' 
                  }}
                  animate={isSyncing ? {
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7]
                  } : {}}
                  transition={{ duration: 1.2, repeat: isSyncing ? Infinity : 0 }} // 延长动画周期
                />
                <div 
                  className="font-mono text-xs"
                  style={{ 
                    color: showSyncGlow
                      ? 'rgba(251, 191, 36, 1)' // 黄色文字
                      : isSyncing 
                      ? 'rgba(192, 197, 206, 1)' 
                      : 'rgba(192, 197, 206, 0.7)' 
                  }}
                >
                  {isSyncing ? 'SYNC...' : showSyncGlow ? 'SYNCED' : 'SYNC'}
                </div>
              </motion.button>

              {/* 音量滑块 - 增加宽度 */}
              <UnifiedVolumeSlider
                volume={playerState.playbackState.volume}
                onChange={handleVolumeChange}
                className="w-full"
              />
            </div>
          </div>

          {/* 右侧：歌曲信息 - 增加最大宽度 */}
          <div className="text-right min-w-0 max-w-[220px]"> {/* 增加最大宽度 */}
            <div className="text-white/90 font-mono font-light tracking-tight truncate text-sm">
              {playerState.currentTrack?.title || 'RADIO'}
            </div>
            <div className="text-white/50 text-xs font-mono font-light tracking-wider truncate mt-1">
              {playerState.currentTrack?.artist || 'Electronic'}
            </div>
          </div>
        </div>

        {/* 波形显示区域 */}
        <AnimatePresence>
          {enableWaveform && (isExpanded || playerState.playbackState.isPlaying) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }} // 延长动画时间
              className="px-6 pb-4" // 增加padding
            >
              <WaveformPlayer
                track={playerState.currentTrack}
                playbackState={playerState.playbackState}
                onSeek={handleSeek}
                onPlay={togglePlayPause}
                onPause={togglePlayPause}
                className="h-16"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 底部版权信息 - 替换原时间显示 */}
        <motion.div
          initial={{ opacity: 0.4 }}
          animate={{ opacity: isExpanded ? 0.6 : 0.4 }}
          transition={{ duration: 0.4 }}
          className="px-6 pb-3 flex items-center justify-center text-xs font-mono text-white/30 pointer-events-none select-none"
        >
          <div className="text-center">
            @天宫科技 Made By 麻蛇
          </div>
        </motion.div>
      </motion.div>

      {/* 调试信息（开发模式） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -bottom-8 left-0 text-xs font-mono text-white/30">
          Status: {playerStatus} | Sync: {isSyncing ? 'Active' : showSyncGlow ? 'Glowing' : 'Idle'} | Last Update: {new Date(lastUpdateTime).toLocaleTimeString()}
        </div>
      )}
    </motion.div>
  );
};