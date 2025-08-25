import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { MusicPlayer } from './MusicPlayer';
import { useMusicPlayer } from './util/useMusicPlayer';
import { Track, PlaybackState } from './util/musicPlayerTypes';

/**
 * 音乐播放器演示组件
 * 展示如何集成和使用音乐播放器功能
 */
export const MusicPlayerDemo: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);

  // 使用音乐播放器Hook
  const { 
    playerState, 
    isConnected, 
    error, 
    connect, 
    addEventListener 
  } = useMusicPlayer({
    autoConnect: true,
    updateInterval: 1000
  });

  // 监听播放器事件
  useEffect(() => {
    const addNotification = (message: string) => {
      setNotifications(prev => [...prev.slice(-4), message]);
      setTimeout(() => {
        setNotifications(prev => prev.slice(1));
      }, 3000);
    };

    // 监听歌曲切换
    addEventListener('onTrackChange', (track: Track | null) => {
      if (track) {
        addNotification(`🎵 正在播放: ${track.title} - ${track.artist}`);
      }
    });

    // 监听播放状态变化
    addEventListener('onPlaybackStateChange', (state: PlaybackState) => {
      addNotification(`${state.isPlaying ? '▶️' : '⏸️'} ${state.isPlaying ? '播放中' : '已暂停'}`);
    });

    // 监听错误
    addEventListener('onError', (error: string) => {
      addNotification(`❌ 错误: ${error}`);
    });
  }, [addEventListener]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* 播放器组件 */}
      <div className="pointer-events-auto">
        <MusicPlayer 
          isVisible={isVisible}
          isWelcomeMode={false}
          events={{
            onError: (error: string) => {
              console.warn('🎵 Music Player Error:', error);
            },
            onTrackChange: (track: Track | null) => {
              console.log('🎵 Track Changed:', track?.title || 'None');
            },
            onPlaybackStateChange: (state: PlaybackState) => {
              console.log('🎵 Playback State:', state.isPlaying ? 'Playing' : 'Paused');
            }
          }}
        />
      </div>

      {/* 连接状态指示器 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-6 left-6 pointer-events-auto"
      >
        <div className="glass-morphism rounded-lg px-3 py-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`} />
            <span className="text-white/80">
              {isConnected ? 'Termusic 已连接' : 'Termusic 未连接'}
            </span>
          </div>
          {error && (
            <div className="mt-1 text-red-300 text-xs">
              {error}
            </div>
          )}
        </div>
      </motion.div>

      {/* 通知区域 */}
      <div className="fixed top-20 left-6 pointer-events-none max-w-xs">
        {notifications.map((notification, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -20, y: -10 }}
            transition={{ duration: 0.3 }}
            className="glass-morphism rounded-lg px-3 py-2 mb-2 text-xs text-white/80"
          >
            {notification}
          </motion.div>
        ))}
      </div>

      {/* 播放器控制面板 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-32 left-6 pointer-events-auto"
      >
        <div className="glass-morphism rounded-xl p-4 space-y-3">
          <h3 className="text-white/90 font-medium text-sm">播放器控制</h3>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-white/70">连接状态:</span>
              <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                {isConnected ? '已连接' : '未连接'}
              </span>
            </div>
            
            {playerState.currentTrack && (
              <>
                <div className="flex justify-between">
                  <span className="text-white/70">当前歌曲:</span>
                  <span className="text-white/90 max-w-32 truncate">
                    {playerState.currentTrack.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">艺术家:</span>
                  <span className="text-white/90 max-w-32 truncate">
                    {playerState.currentTrack.artist}
                  </span>
                </div>
              </>
            )}
            
            <div className="flex justify-between">
              <span className="text-white/70">音量:</span>
              <span className="text-white/90">
                {Math.round(playerState.playbackState.volume * 100)}%
              </span>
            </div>
          </div>

          <div className="flex space-x-2 pt-2 border-t border-white/10">
            <button
              onClick={() => setIsVisible(!isVisible)}
              className="flex-1 glass-morphism-lite rounded px-2 py-1 text-xs text-white/80 hover:text-white/100 transition-colors"
            >
              {isVisible ? '隐藏' : '显示'}
            </button>
            
            {!isConnected && (
              <button
                onClick={connect}
                className="flex-1 glass-morphism-lite rounded px-2 py-1 text-xs text-white/80 hover:text-white/100 transition-colors"
              >
                重连
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};