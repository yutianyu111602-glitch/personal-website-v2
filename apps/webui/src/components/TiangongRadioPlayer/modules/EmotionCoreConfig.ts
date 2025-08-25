/**
 * 情绪核心配置模块
 * 定义输入进情绪核心的所有参数配置
 * 用于算法特效推算和参数管理
 */

// 情绪核心输入参数接口
export interface EmotionCoreInputParameters {
  // 音频分析参数
  audioAnalysis: {
    // 频段能量
    frequencyBands: {
      low: number;      // 低频 (20-250Hz)
      mid: number;      // 中频 (250-4000Hz)
      high: number;     // 高频 (4000-20000Hz)
      sub: number;      // 超低频 (20-60Hz)
    };
    
    // 时域特征
    temporalFeatures: {
      rms: number;      // 均方根值
      peak: number;     // 峰值
      crest: number;    // 峰值因子
      zeroCrossing: number; // 过零率
    };
    
    // 频谱特征
    spectralFeatures: {
      centroid: number; // 频谱质心
      rolloff: number;  // 频谱滚降
      flux: number;     // 频谱通量
      flatness: number; // 频谱平坦度
    };
    
    // 节奏特征
    rhythmFeatures: {
      bpm: number;      // 节拍速度
      beatStrength: number; // 节拍强度
      syncopation: number;  // 切分音强度
      groove: number;   // 律动感
    };
  };
  
  // 音乐结构参数
  musicStructure: {
    // 段落类型
    segmentType: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'build' | 'drop' | 'fill';
    
    // 段落特征
    segmentFeatures: {
      intensity: number;    // 强度 (0-1)
      complexity: number;   // 复杂度 (0-1)
      predictability: number; // 可预测性 (0-1)
      novelty: number;      // 新颖性 (0-1)
    };
    
    // 和声特征
    harmonicFeatures: {
      key: string;          // 调性
      mode: 'major' | 'minor' | 'dorian' | 'mixolydian' | 'phrygian' | 'lydian' | 'locrian';
      chordProgression: string[]; // 和弦进行
      tension: number;      // 和声张力 (0-1)
    };
    
    // 旋律特征
    melodicFeatures: {
      contour: 'ascending' | 'descending' | 'stable' | 'oscillating';
      range: number;        // 音域跨度
      complexity: number;   // 旋律复杂度
      repetition: number;   // 重复度
    };
  };
  
  // 用户交互参数
  userInteraction: {
    // 播放控制
    playback: {
      isPlaying: boolean;
      volume: number;
      speed: number;
      seekPosition: number;
      loopMode: 'none' | 'single' | 'all';
    };
    
    // 用户偏好
    preferences: {
      energyPreference: number;    // 能量偏好 (0-1)
      complexityPreference: number; // 复杂度偏好 (0-1)
      noveltyPreference: number;   // 新颖性偏好 (0-1)
      stylePreference: string[];   // 风格偏好
    };
    
    // 历史行为
    behavior: {
      skipRate: number;     // 跳过率 (0-1)
      repeatRate: number;   // 重复率 (0-1)
      sessionDuration: number; // 会话时长
      favoriteGenres: string[]; // 喜爱流派
    };
  };
  
  // 环境上下文参数
  environmentContext: {
    // 时间上下文
    time: {
      timeOfDay: number;    // 一天中的时间 (0-24)
      dayOfWeek: number;    // 星期几 (0-6)
      season: 'spring' | 'summer' | 'autumn' | 'winter';
      isWeekend: boolean;
    };
    
    // 设备上下文
    device: {
      platform: string;     // 平台
      screenSize: string;   // 屏幕尺寸
      performance: 'low' | 'medium' | 'high';
      batteryLevel: number; // 电池电量
    };
    
    // 网络上下文
    network: {
      connectionType: 'wifi' | '4g' | '5g' | 'ethernet';
      bandwidth: number;    // 带宽 (Mbps)
      latency: number;      // 延迟 (ms)
      stability: number;    // 稳定性 (0-1)
    };
  };
  
  // 算法特效参数
  algorithmEffects: {
    // 可视化特效
    visualization: {
      preset: string;       // 预设名称
      intensity: number;    // 强度 (0-1)
      speed: number;        // 速度 (0-1)
      complexity: number;   // 复杂度 (0-1)
      colorScheme: string;  // 配色方案
      motionType: string;   // 运动类型
    };
    
    // 音频特效
    audioEffects: {
      reverb: number;       // 混响 (0-1)
      delay: number;        // 延迟 (0-1)
      distortion: number;   // 失真 (0-1)
      filter: number;       // 滤波器 (0-1)
      compression: number;  // 压缩 (0-1)
    };
    
    // 随机性特效
    randomnessEffects: {
      chaosLevel: number;   // 混沌级别 (0-1)
      entropyTarget: number; // 熵目标 (0-1)
      correlationStrength: number; // 相关性强度 (0-1)
      noiseLevel: number;   // 噪声级别 (0-1)
    };
  };
}

// 情绪核心输出参数接口
export interface EmotionCoreOutputParameters {
  // 情绪状态
  emotion: {
    energy: number;         // 能量 (0-1)
    valence: number;        // 效价 (0-1)
    arousal: number;        // 激活 (0-1)
    dominance: number;      // 支配性 (0-1)
    confidence: number;     // 置信度 (0-1)
  };
  
  // 情绪变化趋势
  emotionTrend: {
    energyTrend: 'increasing' | 'decreasing' | 'stable';
    valenceTrend: 'increasing' | 'decreasing' | 'stable';
    arousalTrend: 'increasing' | 'decreasing' | 'stable';
    changeRate: number;     // 变化速率 (0-1)
  };
  
  // 情绪稳定性
  emotionStability: {
    overallStability: number; // 整体稳定性 (0-1)
    energyStability: number;  // 能量稳定性 (0-1)
    valenceStability: number; // 效价稳定性 (0-1)
    arousalStability: number; // 激活稳定性 (0-1)
  };
  
  // 情绪预测
  emotionPrediction: {
    nextEnergy: number;     // 预测下一时刻能量
    nextValence: number;    // 预测下一时刻效价
    nextArousal: number;    // 预测下一时刻激活
    predictionConfidence: number; // 预测置信度
  };
}

// 情绪核心配置接口
export interface EmotionCoreConfig {
  // 输入参数权重
  inputWeights: {
    audioAnalysis: number;      // 音频分析权重 (0-1)
    musicStructure: number;     // 音乐结构权重 (0-1)
    userInteraction: number;    // 用户交互权重 (0-1)
    environmentContext: number; // 环境上下文权重 (0-1)
    algorithmEffects: number;   // 算法特效权重 (0-1)
  };
  
  // 情绪计算参数
  emotionCalculation: {
    // 情绪响应曲线
    responseCurves: {
      energy: {
        lowThreshold: number;   // 低能量阈值
        highThreshold: number;  // 高能量阈值
        sensitivity: number;    // 敏感度
        saturation: number;     // 饱和点
      };
      valence: {
        lowThreshold: number;
        highThreshold: number;
        sensitivity: number;
        saturation: number;
      };
      arousal: {
        lowThreshold: number;
        highThreshold: number;
        sensitivity: number;
        saturation: number;
      };
    };
    
    // 情绪衰减参数
    decay: {
      energyDecay: number;      // 能量衰减率
      valenceDecay: number;     // 效价衰减率
      arousalDecay: number;     // 激活衰减率
      decayDelay: number;       // 衰减延迟
    };
    
    // 情绪平滑参数
    smoothing: {
      smoothingFactor: number;  // 平滑因子
      smoothingWindow: number;  // 平滑窗口大小
      adaptiveSmoothing: boolean; // 是否启用自适应平滑
    };
  };
  
  // 算法特效映射
  algorithmMapping: {
    // 情绪到特效的映射
    emotionToEffects: {
      highEnergy: string[];     // 高能量对应的特效
      lowEnergy: string[];      // 低能量对应的特效
      positiveValence: string[]; // 正效价对应的特效
      negativeValence: string[]; // 负效价对应的特效
      highArousal: string[];    // 高激活对应的特效
      lowArousal: string[];     // 低激活对应的特效
    };
    
    // 特效参数范围
    effectParameterRanges: {
      [effectName: string]: {
        intensity: [number, number];    // 强度范围
        speed: [number, number];        // 速度范围
        complexity: [number, number];   // 复杂度范围
        duration: [number, number];     // 持续时间范围
      };
    };
  };
  
  // 性能优化参数
  performanceOptimization: {
    // 计算频率控制
    computationFrequency: {
      minInterval: number;      // 最小计算间隔 (ms)
      maxInterval: number;      // 最大计算间隔 (ms)
      adaptiveInterval: boolean; // 是否启用自适应间隔
    };
    
    // 缓存策略
    caching: {
      enableCache: boolean;     // 是否启用缓存
      cacheSize: number;        // 缓存大小
      cacheTTL: number;         // 缓存生存时间 (ms)
    };
    
    // 并行计算
    parallelization: {
      enableParallel: boolean;  // 是否启用并行计算
      maxWorkers: number;       // 最大工作线程数
      taskQueueSize: number;    // 任务队列大小
    };
  };
}

// 默认配置
export const DEFAULT_EMOTION_CORE_CONFIG: EmotionCoreConfig = {
  inputWeights: {
    audioAnalysis: 0.4,
    musicStructure: 0.3,
    userInteraction: 0.2,
    environmentContext: 0.05,
    algorithmEffects: 0.05
  },
  
  emotionCalculation: {
    responseCurves: {
      energy: {
        lowThreshold: 0.3,
        highThreshold: 0.7,
        sensitivity: 1.0,
        saturation: 0.9
      },
      valence: {
        lowThreshold: 0.3,
        highThreshold: 0.7,
        sensitivity: 1.0,
        saturation: 0.9
      },
      arousal: {
        lowThreshold: 0.3,
        highThreshold: 0.7,
        sensitivity: 1.0,
        saturation: 0.9
      }
    },
    
    decay: {
      energyDecay: 0.1,
      valenceDecay: 0.05,
      arousalDecay: 0.15,
      decayDelay: 1000
    },
    
    smoothing: {
      smoothingFactor: 0.7,
      smoothingWindow: 5,
      adaptiveSmoothing: true
    }
  },
  
  algorithmMapping: {
    emotionToEffects: {
      highEnergy: ['intense_visuals', 'fast_motion', 'bright_colors'],
      lowEnergy: ['calm_visuals', 'slow_motion', 'muted_colors'],
      positiveValence: ['warm_colors', 'smooth_transitions', 'harmonic_effects'],
      negativeValence: ['cool_colors', 'sharp_transitions', 'dissonant_effects'],
      highArousal: ['rapid_changes', 'high_contrast', 'dynamic_effects'],
      lowArousal: ['gradual_changes', 'low_contrast', 'static_effects']
    },
    
    effectParameterRanges: {
      intense_visuals: {
        intensity: [0.7, 1.0],
        speed: [0.8, 1.0],
        complexity: [0.6, 1.0],
        duration: [1000, 5000]
      },
      calm_visuals: {
        intensity: [0.1, 0.4],
        speed: [0.1, 0.3],
        complexity: [0.2, 0.5],
        duration: [3000, 10000]
      }
    }
  },
  
  performanceOptimization: {
    computationFrequency: {
      minInterval: 100,
      maxInterval: 1000,
      adaptiveInterval: true
    },
    
    caching: {
      enableCache: true,
      cacheSize: 1000,
      cacheTTL: 60000
    },
    
    parallelization: {
      enableParallel: true,
      maxWorkers: 4,
      taskQueueSize: 100
    }
  }
};

/**
 * 情绪核心配置管理器
 * 负责管理和应用情绪核心配置
 */
export class EmotionCoreConfigManager {
  private config: EmotionCoreConfig;
  private isInitialized: boolean = false;

  constructor(config?: Partial<EmotionCoreConfig>) {
    this.config = { ...DEFAULT_EMOTION_CORE_CONFIG, ...config };
  }

  /**
   * 初始化配置管理器
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    try {
      // 验证配置
      this.validateConfig(this.config);
      
      this.isInitialized = true;
      console.log('🎭 情绪核心配置管理器初始化成功');
      
    } catch (error) {
      console.error('❌ 情绪核心配置管理器初始化失败:', error);
    }
  }

  /**
   * 验证配置
   */
  private validateConfig(config: EmotionCoreConfig): void {
    const errors: string[] = [];
    
    // 验证权重总和
    const totalWeight = Object.values(config.inputWeights).reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      errors.push(`输入权重总和必须为1.0，当前值: ${totalWeight}`);
    }
    
    // 验证阈值范围
    Object.entries(config.emotionCalculation.responseCurves).forEach(([emotion, curve]) => {
      if (curve.lowThreshold >= curve.highThreshold) {
        errors.push(`${emotion} 阈值配置错误: 低阈值必须小于高阈值`);
      }
    });
    
    if (errors.length > 0) {
      throw new Error(`配置验证失败:\n${errors.join('\n')}`);
    }
  }

  /**
   * 获取配置
   */
  public getConfig(): EmotionCoreConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<EmotionCoreConfig>): void {
    try {
      const tempConfig = { ...this.config, ...newConfig };
      this.validateConfig(tempConfig);
      
      this.config = tempConfig;
      console.log('🔄 情绪核心配置已更新');
      
    } catch (error) {
      console.error('❌ 配置更新失败:', error);
      throw error;
    }
  }

  /**
   * 根据情绪状态推算算法特效参数
   */
  public calculateEffectParameters(emotion: EmotionCoreOutputParameters['emotion']): {
    effectName: string;
    parameters: Record<string, number>;
  }[] {
    const effects: { effectName: string; parameters: Record<string, number> }[] = [];
    
    // 根据能量选择特效
    if (emotion.energy > 0.7) {
      const highEnergyEffects = this.config.algorithmMapping.emotionToEffects.highEnergy;
      highEnergyEffects.forEach(effectName => {
        const effectConfig = this.config.algorithmMapping.effectParameterRanges[effectName];
        if (effectConfig) {
          effects.push({
            effectName,
            parameters: {
              intensity: this.interpolateParameter(emotion.energy, effectConfig.intensity),
              speed: this.interpolateParameter(emotion.energy, effectConfig.speed),
              complexity: this.interpolateParameter(emotion.energy, effectConfig.complexity),
              duration: this.interpolateParameter(emotion.energy, effectConfig.duration)
            }
          });
        }
      });
    }
    
    // 根据效价选择特效
    if (emotion.valence > 0.6) {
      const positiveEffects = this.config.algorithmMapping.emotionToEffects.positiveValence;
      positiveEffects.forEach(effectName => {
        const effectConfig = this.config.algorithmMapping.effectParameterRanges[effectName];
        if (effectConfig) {
          effects.push({
            effectName,
            parameters: {
              intensity: this.interpolateParameter(emotion.valence, effectConfig.intensity),
              speed: this.interpolateParameter(emotion.valence, effectConfig.speed),
              complexity: this.interpolateParameter(emotion.valence, effectConfig.complexity),
              duration: this.interpolateParameter(emotion.valence, effectConfig.duration)
            }
          });
        }
      });
    }
    
    return effects;
  }

  /**
   * 插值计算参数值
   */
  private interpolateParameter(emotionValue: number, range: [number, number]): number {
    const [min, max] = range;
    return min + (max - min) * emotionValue;
  }

  /**
   * 导出配置
   */
  public exportConfig(): string {
    return JSON.stringify({
      config: this.config,
      timestamp: Date.now(),
      version: '1.0.0'
    }, null, 2);
  }

  /**
   * 导入配置
   */
  public importConfig(configString: string): void {
    try {
      const data = JSON.parse(configString);
      
      if (data.config && data.version) {
        this.updateConfig(data.config);
        console.log('✅ 情绪核心配置导入成功');
      } else {
        throw new Error('无效的配置格式');
      }
      
    } catch (error) {
      console.error('❌ 情绪核心配置导入失败:', error);
      throw error;
    }
  }

  /**
   * 销毁配置管理器
   */
  public destroy(): void {
    this.isInitialized = false;
    console.log('🛑 情绪核心配置管理器已销毁');
  }
}

// 创建默认配置管理器实例
export const emotionCoreConfigManager = new EmotionCoreConfigManager();
