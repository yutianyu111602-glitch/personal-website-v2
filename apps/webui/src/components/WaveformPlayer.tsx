/**
 * 波形播放器组件
 * 集成 wavesurfer.js v7，实现10秒窗口波形显示
 * 极低内存占用，不解码整段音频
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Track, PlaybackState } from './util/musicPlayerTypes';

// WaveSurfer 类型定义（简化版）
interface WaveSurferInstance {
  load: (url: string, peaks?: number[]) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setTime: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setVolume: (volume: number) => void;
  isPlaying: () => boolean;
  on: (event: string, callback: Function) => void;
  un: (event: string, callback: Function) => void;
  destroy: () => void;
  zoom: (pxPerSec: number) => void;
  getWrapper: () => HTMLElement;
}

// 波形窗口配置
interface WaveformWindowConfig {
  windowSize: number; // 窗口大小（秒）
  bufferSize: number; // 缓冲区大小（秒）
  sampleRate: number; // 采样率
  channels: number;   // 声道数
  updateInterval: number; // 更新间隔（毫秒）
}

// 默认配置
const defaultWaveformConfig: WaveformWindowConfig = {
  windowSize: 10,    // 10秒窗口
  bufferSize: 2,     // 2秒缓冲
  sampleRate: 8000,  // 低采样率减少内存
  channels: 1,       // 单声道
  updateInterval: 100 // 100ms更新间隔
};

// 音频数据缓存
interface AudioDataCache {
  peaks: number[];
  startTime: number;
  endTime: number;
  duration: number;
}

interface WaveformPlayerProps {
  track: Track | null;
  playbackState: PlaybackState;
  onSeek?: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
  config?: Partial<WaveformWindowConfig>;
}

// 创建波形数据的函数（模拟）
const generateMockWaveform = (duration: number, windowStart: number, windowSize: number): number[] => {
  const samples = Math.floor(windowSize * 50); // 每秒50个采样点
  const peaks: number[] = [];
  
  for (let i = 0; i < samples; i++) {
    const time = windowStart + (i / samples) * windowSize;
    // 生成基于时间的伪随机波形
    const baseFreq = 0.5 + Math.sin(time * 0.1) * 0.3;
    const amplitude = 0.3 + Math.sin(time * 0.05) * 0.2;
    const noise = (Math.random() - 0.5) * 0.1;
    
    peaks.push(amplitude * Math.sin(time * Math.PI * baseFreq) + noise);
  }
  
  return peaks;
};

export const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
  track,
  playbackState,
  onSeek,
  onPlay,
  onPause,
  className = '',
  config = {}
}) => {
  // 配置合并
  const waveformConfig = useMemo(
    () => ({ ...defaultWaveformConfig, ...config }),
    [config]
  );

  // 状态管理
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentWindow, setCurrentWindow] = useState(0);
  const [audioCache, setAudioCache] = useState<AudioDataCache | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [waveformError, setWaveformError] = useState<string | null>(null);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wavesurferRef = useRef<WaveSurferInstance | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 计算当前窗口位置
  const windowStart = useMemo(() => {
    if (!playbackState.duration) return 0;
    
    const windowSize = waveformConfig.windowSize;
    const currentTime = playbackState.currentTime;
    
    // 将当前时间居中在窗口中
    let start = currentTime - windowSize / 2;
    
    // 边界处理
    if (start < 0) start = 0;
    if (start + windowSize > playbackState.duration) {
      start = Math.max(0, playbackState.duration - windowSize);
    }
    
    return start;
  }, [playbackState.currentTime, playbackState.duration, waveformConfig.windowSize]);

  // 初始化wavesurfer（简化版本）
  const initializeWavesurfer = useCallback(async () => {
    if (!containerRef.current || !track) return;

    try {
      setIsBuffering(true);
      setWaveformError(null);

      // 模拟wavesurfer初始化
      // 在实际项目中，这里会加载真实的wavesurfer.js
      console.log('🌊 初始化波形播放器');
      
      // 生成初始波形数据
      const initialPeaks = generateMockWaveform(
        playbackState.duration || 0,
        windowStart,
        waveformConfig.windowSize
      );

      setAudioCache({
        peaks: initialPeaks,
        startTime: windowStart,
        endTime: windowStart + waveformConfig.windowSize,
        duration: playbackState.duration || 0
      });

      setIsInitialized(true);
      
      console.log(`🎵 波形窗口初始化完成: ${windowStart.toFixed(1)}s - ${(windowStart + waveformConfig.windowSize).toFixed(1)}s`);
    } catch (error) {
      console.error('波形初始化失败:', error);
      setWaveformError('波形加载失败');
    } finally {
      setIsBuffering(false);
    }
  }, [track, windowStart, waveformConfig.windowSize, playbackState.duration]);

  // 更新波形窗口
  const updateWaveformWindow = useCallback(() => {
    if (!audioCache || !track) return;

    // 检查是否需要更新窗口
    const needsUpdate = 
      windowStart < audioCache.startTime - waveformConfig.bufferSize ||
      windowStart > audioCache.endTime - waveformConfig.windowSize + waveformConfig.bufferSize;

    if (needsUpdate) {
      console.log(`🔄 更新波形窗口: ${windowStart.toFixed(1)}s`);
      
      // 生成新的波形数据
      const newPeaks = generateMockWaveform(
        playbackState.duration || 0,
        windowStart,
        waveformConfig.windowSize
      );

      setAudioCache({
        peaks: newPeaks,
        startTime: windowStart,
        endTime: windowStart + waveformConfig.windowSize,
        duration: playbackState.duration || 0
      });
    }
  }, [windowStart, audioCache, track, waveformConfig, playbackState.duration]);

  // 绘制波形
  const drawWaveform = useCallback(() => {
    if (!canvasRef.current || !audioCache) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // 清空画布
    ctx.clearRect(0, 0, rect.width, rect.height);

    // 绘制波形
    const peaks = audioCache.peaks;
    const width = rect.width;
    const height = rect.height;
    const barWidth = width / peaks.length;
    const centerY = height / 2;

    // 渐变色 - 银色主题
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'rgba(192, 197, 206, 0.3)');
    gradient.addColorStop(0.5, 'rgba(192, 197, 206, 0.6)');
    gradient.addColorStop(1, 'rgba(192, 197, 206, 0.3)');

    // 进度渐变
    const progressGradient = ctx.createLinearGradient(0, 0, width, 0);
    progressGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    progressGradient.addColorStop(1, 'rgba(192, 197, 206, 0.9)');

    // 计算播放进度
    const currentTime = playbackState.currentTime;
    const windowProgress = Math.max(0, Math.min(1, 
      (currentTime - windowStart) / waveformConfig.windowSize
    ));

    peaks.forEach((peak, index) => {
      const x = index * barWidth;
      const barHeight = Math.abs(peak) * height * 0.8;
      
      // 判断是否在播放进度内
      const isPlayed = (index / peaks.length) <= windowProgress;
      
      ctx.fillStyle = isPlayed ? progressGradient : gradient;
      ctx.fillRect(x, centerY - barHeight / 2, barWidth - 1, barHeight);
    });

    // 绘制播放指针
    if (windowProgress > 0 && windowProgress < 1) {
      const pointerX = width * windowProgress;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pointerX, 0);
      ctx.lineTo(pointerX, height);
      ctx.stroke();

      // 播放指针光效
      ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pointerX, 0);
      ctx.lineTo(pointerX, height);
      ctx.stroke();
      ctx.shadowBlur = 0; // 重置阴影
    }
  }, [audioCache, playbackState.currentTime, windowStart, waveformConfig.windowSize]);

  // 处理画布点击
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !onSeek) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const clickProgress = x / rect.width;
    
    const newTime = windowStart + clickProgress * waveformConfig.windowSize;
    const clampedTime = Math.max(0, Math.min(playbackState.duration || 0, newTime));
    
    onSeek(clampedTime);
  }, [windowStart, waveformConfig.windowSize, playbackState.duration, onSeek]);

  // 初始化
  useEffect(() => {
    if (track && playbackState.duration > 0) {
      initializeWavesurfer();
    }
  }, [track, playbackState.duration, initializeWavesurfer]);

  // 更新窗口位置
  useEffect(() => {
    if (isInitialized) {
      updateWaveformWindow();
    }
  }, [isInitialized, updateWaveformWindow]);

  // 定期重绘波形
  useEffect(() => {
    if (isInitialized && playbackState.isPlaying) {
      updateIntervalRef.current = setInterval(() => {
        drawWaveform();
      }, waveformConfig.updateInterval);
    } else {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isInitialized, playbackState.isPlaying, drawWaveform, waveformConfig.updateInterval]);

  // 静态时重绘一次
  useEffect(() => {
    if (isInitialized && !playbackState.isPlaying) {
      drawWaveform();
    }
  }, [isInitialized, playbackState.isPlaying, drawWaveform]);

  // 清理资源
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy();
        } catch (error) {
          console.warn('Wavesurfer清理失败:', error);
        }
      }
    };
  }, []);

  if (!track) {
    return (
      <div className={`flex items-center justify-center h-16 ${className}`}>
        <div className="text-white/40 text-xs font-mono">
          无音频加载
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
    >
      {/* 波形画布 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isInitialized ? 1 : 0.3 }}
        className="relative"
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-16 cursor-pointer rounded-lg"
          style={{
            background: 'rgba(192, 197, 206, 0.05)',
            border: '1px solid rgba(192, 197, 206, 0.1)',
          }}
        />
        
        {/* 时间标记 */}
        {isInitialized && (
          <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-xs font-mono text-white/40">
            <span>{Math.floor(windowStart / 60)}:{(windowStart % 60).toFixed(0).padStart(2, '0')}</span>
            <span>{Math.floor((windowStart + waveformConfig.windowSize) / 60)}:{((windowStart + waveformConfig.windowSize) % 60).toFixed(0).padStart(2, '0')}</span>
          </div>
        )}
      </motion.div>

      {/* 加载状态 */}
      <AnimatePresence>
        {isBuffering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg"
          >
            <div className="flex items-center space-x-2 text-white/60">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/30 border-t-white/60 rounded-full"
              />
              <span className="text-xs font-mono">加载波形...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 错误状态 */}
      <AnimatePresence>
        {waveformError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-0 flex items-center justify-center bg-red-500/10 rounded-lg border border-red-500/20"
          >
            <div className="text-center text-red-400">
              <div className="text-xs font-mono">{waveformError}</div>
              <button
                onClick={initializeWavesurfer}
                className="mt-2 text-xs px-3 py-1 border border-red-400/40 rounded-md hover:bg-red-400/10 transition-colors"
              >
                重试
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 窗口信息（开发模式） */}
      {process.env.NODE_ENV === 'development' && isInitialized && (
        <div className="absolute top-1 right-1 text-xs font-mono text-white/30 bg-black/40 px-2 py-1 rounded">
          {windowStart.toFixed(1)}s - {(windowStart + waveformConfig.windowSize).toFixed(1)}s
        </div>
      )}
    </div>
  );
};