import React, { useEffect, useRef, useCallback, useState } from 'react';

// 音频频谱数据类型
export interface AudioSpectrumData {
  frequency: Uint8Array;  // 频率数据 (0-255)
  timeDomain: Uint8Array; // 时域数据 (0-255)
  rms: number;            // 均方根值 (音量)
  centroid: number;       // 频谱质心 (音色特征)
  flux: number;           // 频谱通量 (变化率)
  timestamp: number;      // 时间戳
}

// 音频分析器配置
export interface AudioAnalyzerConfig {
  fftSize: number;        // FFT大小 (256, 512, 1024, 2048)
  smoothingTimeConstant: number; // 平滑时间常数 (0-1)
  minDecibels: number;    // 最小分贝值
  maxDecibels: number;    // 最大分贝值
  sampleRate: number;     // 采样率
}

// 事件回调类型
export interface AudioDataCallbacks {
  onSpectrumUpdate?: (data: AudioSpectrumData) => void;
  onAudioStart?: () => void;
  onAudioStop?: () => void;
  onError?: (error: string) => void;
}

// 音频数据管理器属性
export interface AudioDataManagerProps {
  audioElement: HTMLAudioElement | null;
  config?: Partial<AudioAnalyzerConfig>;
  callbacks?: AudioDataCallbacks;
  enabled?: boolean;
}

/**
 * 音频数据管理器
 * 负责从HTMLAudioElement提取实时音频数据，并提供给可视化模块
 * 
 * 核心功能：
 * - 🎵 实时音频频谱分析
 * - 📊 音频特征提取 (RMS, 质心, 通量)
 * - 🔄 数据流管理
 * - 🎨 可视化数据格式化
 */
export const AudioDataManager: React.FC<AudioDataManagerProps> = ({
  audioElement,
  config = {},
  callbacks = {},
  enabled = true
}) => {
  // 状态管理
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [source, setSource] = useState<MediaElementAudioSourceNode | null>(null);
  // const [error, setError] = useState<string | null>(null); // 未使用

  // 引用
  const animationFrameRef = useRef<number | null>(null);
  const lastSpectrumDataRef = useRef<AudioSpectrumData | null>(null);

  // 默认配置
  const defaultConfig: AudioAnalyzerConfig = {
    fftSize: 256,
    smoothingTimeConstant: 0.8,
    minDecibels: -90,
    maxDecibels: -10,
    sampleRate: 44100,
    ...config
  };

  // 初始化音频分析器
  const initializeAnalyzer = useCallback(async () => {
    if (!audioElement || !enabled) return;

    try {
      // 创建AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const newAudioContext = new AudioContextClass();
      
      // 创建分析器节点
      const newAnalyser = newAudioContext.createAnalyser();
      newAnalyser.fftSize = defaultConfig.fftSize;
      newAnalyser.smoothingTimeConstant = defaultConfig.smoothingTimeConstant;
      newAnalyser.minDecibels = defaultConfig.minDecibels;
      newAnalyser.maxDecibels = defaultConfig.maxDecibels;

      // 创建音频源
      const newSource = newAudioContext.createMediaElementSource(audioElement);
      
      // 连接音频节点
      newSource.connect(newAnalyser);
      newAnalyser.connect(newAudioContext.destination);

      // 保存引用
      setAudioContext(newAudioContext);
      setAnalyser(newAnalyser);
      setSource(newSource);
      // setError(null); // 未使用

      console.log('🎵 音频分析器初始化成功');
      callbacks.onAudioStart?.();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      // setError(errorMessage); // 未使用
      callbacks.onError?.(errorMessage);
      console.error('❌ 音频分析器初始化失败:', err);
    }
  }, [audioElement, enabled, defaultConfig, callbacks]);

  // 清理音频分析器
  const cleanupAnalyzer = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (source) {
      source.disconnect();
      setSource(null);
    }

    if (analyser) {
      analyser.disconnect();
      setAnalyser(null);
    }

    // 防重复关闭 AudioContext
    try {
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
      }
    } finally {
      setAudioContext(null);
    }

    setIsAnalyzing(false);
    console.log('🧹 音频分析器已清理');
  }, [source, analyser, audioContext]);

  // 开始音频分析
  const startAnalysis = useCallback(() => {
    if (!analyser || isAnalyzing) return;

    setIsAnalyzing(true);
    console.log('🎵 开始音频分析');

    const analyzeAudio = () => {
      if (!analyser || !isAnalyzing) return;

      try {
        // 获取频率数据
        const frequencyData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(frequencyData);

        // 获取时域数据
        const timeDomainData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(timeDomainData);

        // 计算音频特征
        const rms = calculateRMS(timeDomainData);
        const centroid = calculateCentroid(frequencyData);
        const flux = calculateFlux(frequencyData, lastSpectrumDataRef.current?.frequency);

        // 创建频谱数据对象
        const spectrumData: AudioSpectrumData = {
          frequency: frequencyData,
          timeDomain: timeDomainData,
          rms,
          centroid,
          flux,
          timestamp: Date.now()
        };

        // 保存当前数据用于下次计算
        lastSpectrumDataRef.current = spectrumData;

        // 触发回调
        callbacks.onSpectrumUpdate?.(spectrumData);

        // 继续分析
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);

      } catch (err) {
        console.error('❌ 音频分析错误:', err);
        setIsAnalyzing(false);
      }
    };

    // 开始分析循环
    analyzeAudio();

  }, [analyser, isAnalyzing, callbacks]);

  // 停止音频分析
  const stopAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsAnalyzing(false);
    console.log('⏸️ 音频分析已停止');
  }, []);

  // 计算RMS (均方根值)
  const calculateRMS = useCallback((timeDomainData: Uint8Array): number => {
    let sum = 0;
    for (let i = 0; i < timeDomainData.length; i++) {
      const sample = (timeDomainData[i] - 128) / 128; // 转换为-1到1范围
      sum += sample * sample;
    }
    return Math.sqrt(sum / timeDomainData.length);
  }, []);

  // 计算频谱质心
  const calculateCentroid = useCallback((frequencyData: Uint8Array): number => {
    let weightedSum = 0;
    let totalSum = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = frequencyData[i] / 255; // 归一化到0-1
      const frequency = i * defaultConfig.sampleRate / (2 * frequencyData.length);
      
      weightedSum += magnitude * frequency;
      totalSum += magnitude;
    }
    
    return totalSum > 0 ? weightedSum / totalSum : 0;
  }, [defaultConfig.sampleRate]);

  // 计算频谱通量
  const calculateFlux = useCallback((currentFreq: Uint8Array, previousFreq: Uint8Array | undefined): number => {
    if (!previousFreq || currentFreq.length !== previousFreq.length) return 0;
    
    let flux = 0;
    for (let i = 0; i < currentFreq.length; i++) {
      const diff = currentFreq[i] - previousFreq[i];
      flux += diff * diff;
    }
    
    return Math.sqrt(flux / currentFreq.length);
  }, []);

  // 监听音频元素变化
  useEffect(() => {
    if (audioElement && enabled) {
      initializeAnalyzer();
    } else {
      cleanupAnalyzer();
    }

    return () => {
      cleanupAnalyzer();
    };
  }, [audioElement, enabled, initializeAnalyzer, cleanupAnalyzer]);

  // 监听分析状态变化
  useEffect(() => {
    if (isAnalyzing) {
      startAnalysis();
    } else {
      stopAnalysis();
    }
  }, [isAnalyzing, startAnalysis, stopAnalysis]);

  // 监听音频播放状态
  useEffect(() => {
    if (!audioElement) return;

    const handlePlay = () => {
      if (enabled && !isAnalyzing) {
        startAnalysis();
      }
    };

    const handlePause = () => {
      if (isAnalyzing) {
        stopAnalysis();
      }
    };

    const handleEnded = () => {
      stopAnalysis();
      callbacks.onAudioStop?.();
    };

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('ended', handleEnded);

    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, [audioElement, enabled, isAnalyzing, startAnalysis, stopAnalysis, callbacks]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanupAnalyzer();
    };
  }, [cleanupAnalyzer]);

  // 这个组件不需要渲染UI，只负责音频数据处理
  return null;
};

export default AudioDataManager;
