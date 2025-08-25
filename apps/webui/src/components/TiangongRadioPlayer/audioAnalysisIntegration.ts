/**
 * 音频分析集成模块
 * 将检测点系统与现有的音频分析系统连接
 * 采用结构性好的设计，避免修修补补
 */

import { detectionPointManager } from './DetectionPointManager';
import { UnifiedEventBus } from '../events/UnifiedEventBus';
import type { AudioFeatures } from '../../vis/AudioReactive';

/**
 * 音频分析集成器
 * 负责连接检测点系统与音频分析系统
 */
export class AudioAnalysisIntegrator {
  private isInitialized: boolean = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private animationFrame: number | null = null;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 16; // 60fps

  constructor() {
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听音频播放开始事件
    UnifiedEventBus.on('audio', 'play', this.handleAudioPlay.bind(this));
    
    // 监听音频播放停止事件
    UnifiedEventBus.on('audio', 'pause', this.handleAudioPause.bind(this));
    
    // 监听音频播放停止事件
    UnifiedEventBus.on('audio', 'stop', this.handleAudioStop.bind(this));
    
    // 监听音频元素变化事件
    UnifiedEventBus.on('audio', 'element_change', this.handleAudioElementChange.bind(this));
    
    console.log('🎵 音频分析集成器事件监听器设置完成');
  }

  /**
   * 处理音频播放开始
   */
  private handleAudioPlay(event: any): void {
    const { audioElement } = event.data || {};
    if (audioElement && !this.isInitialized) {
      this.initializeAudioAnalysis(audioElement);
    }
    
    if (this.isInitialized) {
      this.startAnalysis();
    }
  }

  /**
   * 处理音频播放暂停
   */
  private handleAudioPause(event: any): void {
    this.stopAnalysis();
  }

  /**
   * 处理音频播放停止
   */
  private handleAudioStop(event: any): void {
    this.stopAnalysis();
  }

  /**
   * 处理音频元素变化
   */
  private handleAudioElementChange(event: any): void {
    const { audioElement } = event.data || {};
    if (audioElement) {
      this.cleanupAudioAnalysis();
      this.initializeAudioAnalysis(audioElement);
    }
  }

  /**
   * 初始化音频分析
   */
  private async initializeAudioAnalysis(audioElement: HTMLAudioElement): Promise<void> {
    try {
      // 创建音频上下文
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 创建分析器节点
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;
      
      // 创建音频源节点
      this.source = this.audioContext.createMediaElementSource(audioElement);
      
      // 连接音频节点
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      
      this.isInitialized = true;
      console.log('🎵 音频分析系统初始化完成');
      
    } catch (error) {
      console.error('❌ 音频分析系统初始化失败:', error);
      this.isInitialized = false;
    }
  }

  /**
   * 启动音频分析
   */
  private startAnalysis(): void {
    if (!this.isInitialized || this.animationFrame) return;
    
    this.lastUpdateTime = performance.now();
    this.analyzeAudio();
    console.log('🎵 音频分析已启动');
  }

  /**
   * 停止音频分析
   */
  private stopAnalysis(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
      console.log('⏸️ 音频分析已停止');
    }
  }

  /**
   * 音频分析循环
   */
  private analyzeAudio(): void {
    if (!this.isInitialized || !this.analyser) return;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastUpdateTime;
    
    // 控制更新频率
    if (deltaTime >= this.updateInterval) {
      this.processAudioData();
      this.lastUpdateTime = currentTime;
    }
    
    // 继续分析循环
    this.animationFrame = requestAnimationFrame(this.analyzeAudio.bind(this));
  }

  /**
   * 处理音频数据
   */
  private processAudioData(): void {
    if (!this.analyser) return;
    
    try {
      // 获取频率数据
      const frequencyData = new Float32Array(this.analyser.frequencyBinCount);
      this.analyser.getFloatFrequencyData(frequencyData);
      
      // 获取时域数据
      const timeDomainData = new Float32Array(this.analyser.frequencyBinCount);
      this.analyser.getFloatTimeDomainData(timeDomainData);
      
      // 计算音频特征
      const audioFeatures = this.computeAudioFeatures(frequencyData, timeDomainData);
      
      // 发射音频特征事件
      this.emitAudioFeaturesEvent(audioFeatures);
      
    } catch (error) {
      console.error('❌ 音频数据处理错误:', error);
    }
  }

  /**
   * 计算音频特征
   * 基于现有的AudioReactive.ts中的算法
   */
  private computeAudioFeatures(frequencyData: Float32Array, timeDomainData: Float32Array): AudioFeatures {
    // 将dB值转换为线性值 (0-1)
    const linearFrequencyData = frequencyData.map(db => Math.pow(10, db / 20));
    
    // 计算频段能量
    const sub = this.calculateBandEnergy(linearFrequencyData, 20, 60);
    const bass = this.calculateBandEnergy(linearFrequencyData, 60, 150);
    const lowMid = this.calculateBandEnergy(linearFrequencyData, 150, 400);
    const mid = this.calculateBandEnergy(linearFrequencyData, 400, 1000);
    const highMid = this.calculateBandEnergy(linearFrequencyData, 1000, 2500);
    const presence = this.calculateBandEnergy(linearFrequencyData, 2500, 6000);
    const brilliance = this.calculateBandEnergy(linearFrequencyData, 6000, 12000);
    const air = this.calculateBandEnergy(linearFrequencyData, 12000, 18000);
    
    // 计算质心
    const centroid = this.calculateCentroid(linearFrequencyData);
    
    // 计算RMS
    const rms = this.calculateRMS(timeDomainData);
    
    // 计算峰均比
    const peak = Math.max(sub, bass, mid, highMid, presence, brilliance, air);
    const crest = Math.min(1, Math.max(0, peak - rms));
    
    // 计算通量
    const flux = Math.min(1, (presence + brilliance + air) / 3);
    
    // 判断静音
    const silence = rms < 0.06;
    
    // 节拍检测（简化版）
    const beat = this.detectBeat(timeDomainData, rms);
    
    return {
      sub,
      bass,
      lowMid,
      mid,
      highMid,
      presence,
      brilliance,
      air,
      centroid,
      flux,
      crest,
      beat,
      rms,
      silence
    };
  }

  /**
   * 计算频段能量
   */
  private calculateBandEnergy(frequencyData: Float32Array, minFreq: number, maxFreq: number): number {
    const sampleRate = 44100; // 假设采样率
    const binHz = sampleRate / (frequencyData.length * 2);
    
    const startBin = Math.max(0, Math.floor(minFreq / binHz));
    const endBin = Math.min(frequencyData.length - 1, Math.ceil(maxFreq / binHz));
    
    let sum = 0;
    for (let i = startBin; i <= endBin; i++) {
      sum += frequencyData[i];
    }
    
    const average = sum / Math.max(1, endBin - startBin + 1);
    return Math.min(1, Math.max(0, average));
  }

  /**
   * 计算频谱质心
   */
  private calculateCentroid(frequencyData: Float32Array): number {
    const sampleRate = 44100;
    const binHz = sampleRate / (frequencyData.length * 2);
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const frequency = i * binHz;
      const magnitude = frequencyData[i];
      
      numerator += magnitude * frequency;
      denominator += magnitude;
    }
    
    const centroidHz = denominator > 1e-6 ? numerator / denominator : 0;
    return Math.min(1, centroidHz / (sampleRate / 2));
  }

  /**
   * 计算RMS
   */
  private calculateRMS(timeDomainData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < timeDomainData.length; i++) {
      sum += timeDomainData[i] * timeDomainData[i];
    }
    return Math.sqrt(sum / timeDomainData.length);
  }

  /**
   * 节拍检测
   */
  private detectBeat(timeDomainData: Float32Array, rms: number): number {
    // 简单的节拍检测算法
    const threshold = 0.1;
    const isBeat = rms > threshold ? 1 : 0;
    return isBeat;
  }

  /**
   * 发射音频特征事件
   */
  private emitAudioFeaturesEvent(audioFeatures: AudioFeatures): void {
    UnifiedEventBus.emit({
      namespace: 'audio',
      type: 'features',
      timestamp: Date.now(),
      data: {
        audioFeatures,
        timestamp: Date.now()
      }
    });
  }

  /**
   * 清理音频分析资源
   */
  private cleanupAudioAnalysis(): void {
    this.stopAnalysis();
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isInitialized = false;
    console.log('🧹 音频分析资源已清理');
  }

  /**
   * 获取集成器状态
   */
  public getStatus(): {
    isInitialized: boolean;
    isAnalyzing: boolean;
    audioContextState: string | null;
  } {
    return {
      isInitialized: this.isInitialized,
      isAnalyzing: !!this.animationFrame,
      audioContextState: this.audioContext?.state || null
    };
  }

  /**
   * 销毁集成器
   */
  public destroy(): void {
    this.cleanupAudioAnalysis();
    
    // 移除事件监听器
    UnifiedEventBus.off('audio', 'play', this.handleAudioPlay.bind(this));
    UnifiedEventBus.off('audio', 'pause', this.handleAudioPause.bind(this));
    UnifiedEventBus.off('audio', 'stop', this.handleAudioStop.bind(this));
    UnifiedEventBus.off('audio', 'element_change', this.handleAudioElementChange.bind(this));
    
    console.log('🧹 音频分析集成器已销毁');
  }
}

// 导出单例实例
export const audioAnalysisIntegrator = new AudioAnalysisIntegrator();
