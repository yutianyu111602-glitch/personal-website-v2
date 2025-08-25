/**
 * Wavesurfer.js v7 音频波形播放器
 * 实现10秒窗口波形 + 原生音频播放器，极低内存占用
 * 不解析整段音频，只显示当前播放窗口的波形
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { getBackendConnector, type AudioPeaksResponse } from './util/backendConnector';
import { getTranslations } from './util/i18n';

// Wavesurfer播放器配置
export interface WavesurferPlayerConfig {
  windowDuration: number; // 波形窗口持续时间（秒）
  peaksPerSecond: number; // 每秒峰值点数
  waveColor: string;
  progressColor: string;
  backgroundColor: string;
  height: number;
  responsive: boolean;
  normalize: boolean;
  hideScrollbar: boolean;
}

// 播放器状态
interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  error: string | null;
  peaks: number[];
  windowOffset: number;
}

// 组件属性
interface WavesurferPlayerProps {
  audioSrc?: string;
  config?: Partial<WavesurferPlayerConfig>;
  language?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onLoadComplete?: (duration: number) => void;
  onError?: (error: string) => void;
}

// 默认配置
const defaultConfig: WavesurferPlayerConfig = {
  windowDuration: 10, // 10秒窗口
  peaksPerSecond: 50, // 每秒50个峰值点
  waveColor: 'rgba(192, 197, 206, 0.6)',
  progressColor: 'rgba(192, 197, 206, 0.9)',
  backgroundColor: 'transparent',
  height: 80,
  responsive: true,
  normalize: true,
  hideScrollbar: true,
};

export const WavesurferPlayer: React.FC<WavesurferPlayerProps> = ({
  audioSrc,
  config = {},
  language = 'zh',
  onPlay,
  onPause,
  onTimeUpdate,
  onLoadComplete,
  onError,
}) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isLoading: false,
    error: null,
    peaks: [],
    windowOffset: 0,
  });

  const finalConfig = { ...defaultConfig, ...config };
  const t = getTranslations(language);
  const backendConnector = getBackendConnector();

  // 初始化音频元素
  const initializeAudio = useCallback(async () => {
    if (!audioSrc || !audioRef.current) return;

    setPlayerState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const audio = audioRef.current;
      audio.src = audioSrc;
      audio.volume = playerState.volume;

      // 等待音频元数据加载
      await new Promise<void>((resolve, reject) => {
        const handleLoadedMetadata = () => {
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audio.removeEventListener('error', handleError);
          resolve();
        };

        const handleError = () => {
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audio.removeEventListener('error', handleError);
          reject(new Error('Failed to load audio metadata'));
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('error', handleError);
        audio.load();
      });

      const duration = audio.duration;
      setPlayerState(prev => ({
        ...prev,
        duration,
        isLoading: false,
      }));

      onLoadComplete?.(duration);

      // 加载初始波形窗口
      await loadWaveformWindow(0);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setPlayerState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      onError?.(errorMessage);
    }
  }, [audioSrc, playerState.volume, onLoadComplete, onError]);

  // 加载波形窗口数据
  const loadWaveformWindow = useCallback(async (offset: number) => {
    if (!audioSrc) return;

    try {
      const response: AudioPeaksResponse = await backendConnector.getAudioPeaks(
        audioSrc,
        offset,
        finalConfig.windowDuration,
        finalConfig.peaksPerSecond
      );

      if (response.status === 'success') {
        setPlayerState(prev => ({
          ...prev,
          peaks: response.peaks,
          windowOffset: offset,
        }));
        
        // 重绘波形
        drawWaveform(response.peaks);
      } else {
        console.warn('Failed to load waveform data:', response.message);
        // 使用模拟波形作为回退
        generateMockWaveform();
      }
    } catch (error) {
      console.warn('Backend unavailable, using mock waveform:', error);
      // 在无法获取后端数据时，生成模拟波形
      generateMockWaveform();
    }
  }, [audioSrc, finalConfig.windowDuration, finalConfig.peaksPerSecond]);

  // 生成模拟波形（后端不可用时的回退方案）
  const generateMockWaveform = useCallback(() => {
    const mockPeaks = Array.from({ length: finalConfig.windowDuration * finalConfig.peaksPerSecond }, 
      () => Math.random() * 0.8 + 0.2
    );
    
    setPlayerState(prev => ({
      ...prev,
      peaks: mockPeaks,
    }));
    
    drawWaveform(mockPeaks);
  }, [finalConfig.windowDuration, finalConfig.peaksPerSecond]);

  // 绘制波形到Canvas
  const drawWaveform = useCallback((peaks: number[]) => {
    const canvas = canvasRef.current;
    if (!canvas || peaks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const barWidth = width / peaks.length;
    const halfHeight = height / 2;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制波形
    peaks.forEach((peak, index) => {
      const x = index * barWidth;
      const barHeight = peak * halfHeight;
      
      // 计算当前播放位置
      const relativeTime = playerState.currentTime - playerState.windowOffset;
      const progressRatio = relativeTime / finalConfig.windowDuration;
      const progressX = progressRatio * width;
      
      // 根据播放进度选择颜色
      const isPlayed = x < progressX;
      ctx.fillStyle = isPlayed ? finalConfig.progressColor : finalConfig.waveColor;
      
      // 绘制上半部分
      ctx.fillRect(x, halfHeight - barHeight, barWidth - 1, barHeight);
      // 绘制下半部分
      ctx.fillRect(x, halfHeight, barWidth - 1, barHeight);
    });

    // 绘制播放进度线
    if (playerState.isPlaying || playerState.currentTime > 0) {
      const relativeTime = playerState.currentTime - playerState.windowOffset;
      const progressRatio = relativeTime / finalConfig.windowDuration;
      const progressX = progressRatio * width;
      
      if (progressX >= 0 && progressX <= width) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(progressX, 0);
        ctx.lineTo(progressX, height);
        ctx.stroke();
      }
    }
  }, [playerState.currentTime, playerState.windowOffset, playerState.isPlaying, finalConfig]);

  // 播放控制
  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playerState.isPlaying) {
      audio.pause();
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
      onPause?.();
    } else {
      audio.play().catch(error => {
        console.error('Failed to play audio:', error);
        setPlayerState(prev => ({ ...prev, error: 'Failed to play audio' }));
      });
      setPlayerState(prev => ({ ...prev, isPlaying: true }));
      onPlay?.();
    }
  }, [playerState.isPlaying, onPlay, onPause]);

  // 音量控制
  const handleVolumeChange = useCallback((newVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    audio.volume = clampedVolume;
    setPlayerState(prev => ({ ...prev, volume: clampedVolume }));
  }, []);

  // 进度跳转
  const handleSeek = useCallback((seekTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = seekTime;
    setPlayerState(prev => ({ ...prev, currentTime: seekTime }));
    
    // 检查是否需要加载新的波形窗口
    const windowStart = Math.floor(seekTime / finalConfig.windowDuration) * finalConfig.windowDuration;
    if (windowStart !== playerState.windowOffset) {
      loadWaveformWindow(windowStart);
    }
  }, [finalConfig.windowDuration, playerState.windowOffset, loadWaveformWindow]);

  // 波形点击跳转
  const handleWaveformClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const clickRatio = x / rect.width;
    const seekTime = playerState.windowOffset + (clickRatio * finalConfig.windowDuration);
    
    handleSeek(seekTime);
  }, [playerState.windowOffset, finalConfig.windowDuration, handleSeek]);

  // 音频事件监听
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;
      setPlayerState(prev => ({ ...prev, currentTime }));
      onTimeUpdate?.(currentTime);

      // 检查是否需要更新波形窗口
      const windowStart = Math.floor(currentTime / finalConfig.windowDuration) * finalConfig.windowDuration;
      if (windowStart !== playerState.windowOffset) {
        loadWaveformWindow(windowStart);
      }
    };

    const handleEnded = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [finalConfig.windowDuration, playerState.windowOffset, loadWaveformWindow, onTimeUpdate]);

  // 定期重绘波形（显示播放进度）
  useEffect(() => {
    if (playerState.isPlaying) {
      updateIntervalRef.current = setInterval(() => {
        drawWaveform(playerState.peaks);
      }, 100); // 每100ms更新一次
    } else {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [playerState.isPlaying, playerState.peaks, drawWaveform]);

  // 初始化
  useEffect(() => {
    initializeAudio();
  }, [initializeAudio]);

  // Canvas尺寸调整
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = waveformRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = finalConfig.height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${finalConfig.height}px`;
      
      // 重绘波形
      if (playerState.peaks.length > 0) {
        drawWaveform(playerState.peaks);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [finalConfig.height, playerState.peaks, drawWaveform]);

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
      style={{
        background: 'rgba(192, 197, 206, 0.05)',
        border: '1px solid rgba(192, 197, 206, 0.15)',
        borderRadius: '16px',
        padding: '16px',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* 隐藏的原生音频元素 */}
      <audio
        ref={audioRef}
        preload="metadata"
        style={{ display: 'none' }}
      />

      {/* 错误显示 */}
      {playerState.error && (
        <div className="text-red-400 text-sm mb-4 text-center">
          {playerState.error}
        </div>
      )}

      {/* 加载状态 */}
      {playerState.isLoading && (
        <div className="text-white/60 text-sm mb-4 text-center">
          {language === 'zh' ? '加载音频中...' : 'Loading audio...'}
        </div>
      )}

      {/* 波形显示区域 */}
      <div
        ref={waveformRef}
        className="relative w-full mb-4"
        style={{ height: `${finalConfig.height}px` }}
      >
        <canvas
          ref={canvasRef}
          onClick={handleWaveformClick}
          className="w-full h-full cursor-pointer rounded-lg"
          style={{
            background: finalConfig.backgroundColor,
            border: '1px solid rgba(192, 197, 206, 0.1)',
          }}
        />
        
        {/* 窗口信息显示 */}
        {playerState.windowOffset >= 0 && (
          <div className="absolute top-2 right-2 text-xs font-mono text-white/50">
            {formatTime(playerState.windowOffset)}-{formatTime(playerState.windowOffset + finalConfig.windowDuration)}
          </div>
        )}
      </div>

      {/* 控制面板 */}
      <div className="flex items-center justify-between">
        {/* 播放控制 */}
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={togglePlayback}
            disabled={playerState.isLoading || !audioSrc}
            className="w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: 'rgba(192, 197, 206, 0.4)',
              background: 'rgba(192, 197, 206, 0.05)',
              color: 'rgba(192, 197, 206, 0.9)',
            }}
          >
            {playerState.isPlaying ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </motion.button>

          {/* 时间显示 */}
          <div className="text-white/80 text-sm font-mono">
            {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
          </div>
        </div>

        {/* 音量控制 */}
        <div className="flex items-center space-x-3">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(192, 197, 206, 0.6)">
            <path d="M3 9v6h4l5 5V4L7 9H3z"/>
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={playerState.volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-20 h-1 rounded-full cursor-pointer"
            style={{
              background: `linear-gradient(to right, rgba(192, 197, 206, 0.8) 0%, rgba(192, 197, 206, 0.8) ${playerState.volume * 100}%, rgba(192, 197, 206, 0.3) ${playerState.volume * 100}%, rgba(192, 197, 206, 0.3) 100%)`,
              appearance: 'none',
              outline: 'none',
            }}
          />
          <div className="text-white/60 text-xs font-mono min-w-[30px]">
            {Math.round(playerState.volume * 100)}%
          </div>
        </div>
      </div>

      {/* 窗口模式信息 */}
      {playerState.peaks.length > 0 && (
        <div className="mt-3 text-xs text-white/40 text-center font-mono">
          {language === 'zh' 
            ? `窗口模式: ${finalConfig.windowDuration}秒 | ${finalConfig.peaksPerSecond}pps | ${playerState.peaks.length}个采样点`
            : `Window Mode: ${finalConfig.windowDuration}s | ${finalConfig.peaksPerSecond}pps | ${playerState.peaks.length} samples`
          }
        </div>
      )}
    </motion.div>
  );
};

export default WavesurferPlayer;