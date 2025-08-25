import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { getTranslations } from "./util/i18n";
import { getTermusicConnector } from "./util/termusicConnector";
import { Track, PlaybackState } from "./util/musicPlayerTypes";

// Wavesurfer.js v7 导入
import WaveSurfer from 'wavesurfer.js';
import Regions from 'wavesurfer.js/dist/plugins/regions.js';

interface SimpleMusicPlayerProps {
  language: string;
  syncActive?: boolean;
  onSyncToggle?: () => void;
}

// 波形播放器状态
interface WaveformState {
  isInitialized: boolean;
  currentWindow: { start: number; end: number } | null;
  isAnalyzing: boolean;
  windowSize: number; // 10秒窗口
  audioBuffer: AudioBuffer | null;
}

// 拖动状态类型
interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startPosition: { x: number; y: number };
}

// 极低内存的音频波形管理器
class LowMemoryWaveformManager {
  private audioContext: AudioContext | null = null;
  private currentWindowData: Float32Array | null = null;
  private windowSize: number = 10; // 10秒窗口
  private sampleRate: number = 44100;
  
  constructor(windowSize: number = 10) {
    this.windowSize = windowSize;
  }

  // 初始化音频上下文 - 320kbps高品质配置
  private async initAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 44100, // 高品质采样率
        latencyHint: 'playback' // 优化播放延迟
      });
    }
    return this.audioContext;
  }

  // 获取指定时间窗口的音频数据（不解析整个文件）- 320kbps优化
  async getWindowAudioData(audioUrl: string, startTime: number): Promise<Float32Array | null> {
    try {
      const audioContext = await this.initAudioContext();
      
      // 320kbps音频文件字节计算 (约40KB/秒)
      const bytesPerSecond = 40000; // 320kbps ≈ 40KB/s
      const startByte = Math.floor(startTime * bytesPerSecond);
      const endByte = startByte + (this.windowSize * bytesPerSecond);
      
      // 使用Range请求只下载需要的音频片段 - 支持高品质音频
      const response = await fetch(audioUrl, {
        headers: {
          'Range': `bytes=${startByte}-${endByte}`,
          'Accept': 'audio/mpeg, audio/mp3, audio/wav, audio/ogg' // 支持高品质格式
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // 保持高品质 - 轻度降采样保持音质
      const channelData = audioBuffer.getChannelData(0);
      
      // 电子音乐优化：较少降采样以保持高频细节
      const downsampleFactor = 2; // 从4改为2，保持更高音质
      const downsampledLength = Math.floor(channelData.length / downsampleFactor);
      const downsampledData = new Float32Array(downsampledLength);
      
      for (let i = 0; i < downsampledLength; i++) {
        downsampledData[i] = channelData[i * downsampleFactor];
      }
      
      this.currentWindowData = downsampledData;
      return downsampledData;
      
    } catch (error) {
      console.error('获取320kbps音频窗口数据失败:', error);
      return null;
    }
  }

  // 清理当前窗口数据
  clearWindow(): void {
    this.currentWindowData = null;
  }

  // 销毁管理器
  destroy(): void {
    this.clearWindow();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// 多语言音乐播放器增强版 - 集成Wavesurfer.js (简化版，无拖动)
export const SimpleMusicPlayer: React.FC<SimpleMusicPlayerProps> = ({ 
  language, 
  syncActive = false, 
  onSyncToggle
}) => {
  // 基础状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  
  // 波形状态
  const [waveformState, setWaveformState] = useState<WaveformState>({
    isInitialized: false,
    currentWindow: null,
    isAnalyzing: false,
    windowSize: 10,
    audioBuffer: null
  });
  
  // 引用
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const waveformManagerRef = useRef<LowMemoryWaveformManager>(new LowMemoryWaveformManager(10));
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const termusicConnectorRef = useRef(getTermusicConnector());
  const playerRef = useRef<HTMLDivElement>(null);
  
  const t = getTranslations(language);

  // 初始化Wavesurfer
  const initializeWavesurfer = useCallback(async () => {
    if (!waveformContainerRef.current || waveformState.isInitialized) return;

    try {
      const wavesurfer = WaveSurfer.create({
        container: waveformContainerRef.current,
        waveColor: 'rgba(192, 197, 206, 0.6)',
        progressColor: 'rgba(192, 197, 206, 0.9)',
        cursorColor: 'rgba(255, 255, 255, 0.8)',
        barWidth: 2,
        barRadius: 3,
        responsive: true,
        height: 40,
        normalize: true,
        backend: 'WebAudio',
        mediaControls: false,
        interact: true,
        scrollParent: false,
        minPxPerSec: 20,
        fillParent: true,
        plugins: [
          Regions.create({
            regionsMinLength: 1,
            dragSelection: false,
          })
        ]
      });

      // 事件监听器
      wavesurfer.on('ready', () => {
        console.log('🌊 Wavesurfer初始化完成');
        setWaveformState(prev => ({ ...prev, isInitialized: true }));
      });

      wavesurfer.on('audioprocess', (currentTime: number) => {
        // 检查是否需要更新10秒窗口
        if (waveformState.currentWindow) {
          const { start, end } = waveformState.currentWindow;
          if (currentTime < start || currentTime > end) {
            updateWaveformWindow(currentTime);
          }
        }
      });

      wavesurfer.on('seek', (progress: number) => {
        const newTime = progress * (currentTrack?.duration || 0);
        termusicConnectorRef.current.seek(newTime);
      });

      wavesurferRef.current = wavesurfer;
      
    } catch (error) {
      console.error('Wavesurfer初始化失败:', error);
    }
  }, [waveformState.isInitialized, currentTrack?.duration]);

  // 更新10秒波形窗口
  const updateWaveformWindow = useCallback(async (currentTime: number) => {
    if (!currentTrack || !wavesurferRef.current) return;

    setWaveformState(prev => ({ ...prev, isAnalyzing: true }));

    try {
      const windowStart = Math.max(0, currentTime - 5); // 当前时间前5秒
      const windowEnd = Math.min(currentTrack.duration, windowStart + 10); // 10秒窗口

      // 使用低内存管理器获取窗口数据
      const audioData = await waveformManagerRef.current.getWindowAudioData(
        currentTrack.url || '',
        windowStart
      );

      if (audioData) {
        // 更新Wavesurfer的音频数据（仅10秒窗口）
        const audioBuffer = new AudioBuffer({
          length: audioData.length,
          sampleRate: 44100,
          numberOfChannels: 1
        });
        
        audioBuffer.copyToChannel(audioData, 0);
        
        // 重新加载Wavesurfer with new window data
        await wavesurferRef.current.loadDecodedBuffer(audioBuffer);
        
        setWaveformState(prev => ({
          ...prev,
          currentWindow: { start: windowStart, end: windowEnd },
          audioBuffer: audioBuffer,
          isAnalyzing: false
        }));

        console.log(`🌊 波形窗口更新: ${windowStart}s - ${windowEnd}s`);
      }
    } catch (error) {
      console.error('更新波形窗口失败:', error);
      setWaveformState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, [currentTrack]);

  // 播放控制
  const handlePlayPause = useCallback(async () => {
    try {
      if (isPlaying) {
        await termusicConnectorRef.current.pause();
        wavesurferRef.current?.pause();
      } else {
        await termusicConnectorRef.current.play();
        wavesurferRef.current?.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('播放控制失败:', error);
    }
  }, [isPlaying]);

  // 音量控制
  const handleVolumeChange = useCallback(async (newVolume: number) => {
    try {
      setVolume(newVolume);
      await termusicConnectorRef.current.setVolume(newVolume);
      if (wavesurferRef.current) {
        wavesurferRef.current.setVolume(newVolume);
      }
    } catch (error) {
      console.error('音量设置失败:', error);
    }
  }, []);

  // 获取当前播放状态
  const updatePlaybackState = useCallback(async () => {
    try {
      const [track, state] = await Promise.all([
        termusicConnectorRef.current.getCurrentTrack(),
        termusicConnectorRef.current.getPlaybackState()
      ]);

      if (track && track.id !== currentTrack?.id) {
        setCurrentTrack(track);
        // 新曲目时重置波形窗口
        if (track.url) {
          await updateWaveformWindow(0);
        }
      }

      setPlaybackState(state);
      setIsPlaying(state.isPlaying);
      setVolume(state.volume);
    } catch (error) {
      console.error('更新播放状态失败:', error);
    }
  }, [currentTrack?.id, updateWaveformWindow]);

  // 组件初始化
  useEffect(() => {
    initializeWavesurfer();
    updatePlaybackState();

    // 定期更新播放状态
    const statusInterval = setInterval(updatePlaybackState, 1000);

    return () => {
      clearInterval(statusInterval);
      waveformManagerRef.current.destroy();
      wavesurferRef.current?.destroy();
    };
  }, [initializeWavesurfer, updatePlaybackState]);

  return (
    <motion.div
      ref={playerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(0, 0, 0, 0.6)',
        border: '2px solid rgba(192, 197, 206, 0.25)',
        width: '384px',
        userSelect: 'none'
      }}
    >
      <div className="p-6">
        {/* 轨道信息显示 */}
        {currentTrack && (
          <div className="mb-4 text-center">
            <div className="text-white/90 font-mono text-sm truncate">
              {currentTrack.title}
            </div>
            <div className="text-white/60 font-mono text-xs truncate">
              {currentTrack.artist} • {currentTrack.album}
            </div>
          </div>
        )}

        {/* 10秒窗口波形显示 */}
        <div className="mb-4">
          <div className="relative">
            {/* 波形容器 */}
            <div 
              ref={waveformContainerRef}
              className="w-full h-10 rounded-lg overflow-hidden"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(192, 197, 206, 0.2)'
              }}
            />
            
            {/* 窗口信息显示 */}
            <div className="flex justify-between items-center mt-2 text-xs font-mono text-white/50">
              <span>
                {waveformState.currentWindow 
                  ? `${Math.floor(waveformState.currentWindow.start)}s` 
                  : '--'}
              </span>
              <span className="flex items-center space-x-1">
                {waveformState.isAnalyzing && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-3 h-3"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8z"/>
                    </svg>
                  </motion.div>
                )}
              </span>
              <span>
                {waveformState.currentWindow 
                  ? `${Math.floor(waveformState.currentWindow.end)}s` 
                  : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* 播放控制 */}
        <div className="flex items-center justify-between mb-4">
          {/* 播放按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayPause}
            className="w-12 h-12 rounded-full border-2 flex items-center justify-center cursor-pointer"
            style={{
              borderColor: 'rgba(255, 255, 255, 0.4)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'rgba(255, 255, 255, 0.85)'
            }}
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5h-4v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </motion.button>

          {/* Sync按钮 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSyncToggle}
            className="w-16 h-10 rounded-lg flex items-center justify-center cursor-pointer relative overflow-hidden"
            style={{
              background: syncActive 
                ? 'rgba(255, 193, 7, 0.15)' 
                : 'rgba(192, 197, 206, 0.08)',
              border: syncActive 
                ? '1px solid rgba(255, 193, 7, 0.4)' 
                : '1px solid rgba(192, 197, 206, 0.15)',
              color: syncActive 
                ? 'rgba(255, 193, 7, 0.9)' 
                : 'rgba(255, 255, 255, 0.6)'
            }}
          >
            {syncActive && (
              <motion.div
                className="absolute inset-0 rounded-lg"
                style={{
                  background: 'rgba(255, 193, 7, 0.3)',
                }}
                animate={{
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
            
            <motion.svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              animate={syncActive ? {
                rotate: [0, 360]
              } : {}}
              transition={syncActive ? {
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              } : {}}
            >
              <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
            </motion.svg>
          </motion.button>

          {/* 标题 */}
          <div className="text-white/90 font-mono text-sm">PLAYER</div>
        </div>

        {/* 音量控制 */}
        <div className="flex items-center space-x-3">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)">
            <path d="M3 9v6h4l5 5V4L7 9z"/>
          </svg>
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1 rounded-full cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgba(192, 197, 206, 0.8) 0%, rgba(192, 197, 206, 0.8) ${volume * 100}%, rgba(192, 197, 206, 0.3) ${volume * 100}%, rgba(192, 197, 206, 0.3) 100%)`,
                appearance: 'none',
                outline: 'none'
              }}
            />
          </div>
          <div className="text-white/60 text-xs font-mono min-w-[24px] text-right">
            {Math.round(volume * 100)}
          </div>
        </div>

        {/* 播放时间显示 */}
        {playbackState && (
          <div className="mt-3 flex justify-between items-center text-xs font-mono text-white/50">
            <span>{Math.floor(playbackState.currentTime / 60)}:{String(Math.floor(playbackState.currentTime % 60)).padStart(2, '0')}</span>
            <span>•</span>
            <span>{Math.floor(playbackState.duration / 60)}:{String(Math.floor(playbackState.duration % 60)).padStart(2, '0')}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};