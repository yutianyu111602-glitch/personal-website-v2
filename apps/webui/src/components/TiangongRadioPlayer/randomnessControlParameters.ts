/**
 * 随机性控制参数系统
 * 提供细粒度的随机性控制参数
 * TASK-126: 模块化重构完成 - 使用模块化组件
 */

import { UnifiedEventBus } from '../events/UnifiedEventBus';
import { multiLevelRandomSystem, RandomLevel } from './multiLevelRandomSystem';
import type { RandomnessControl } from './randomStateManager';

// 导入模块化组件
import { 
  parameterValidator, 
  parameterHistory, 
  parameterOptimizer,
  type ValidationResult,
  type OptimizationContext,
  type OptimizationResult
} from './modules';

// 随机性控制参数接口
export interface RandomnessControlParameters {
  // 基础随机性控制
  baseRandomness: number;           // 基础随机性 (0-1)
  randomnessAmplitude: number;      // 随机性振幅 (0-1)
  randomnessFrequency: number;      // 随机性变化频率 (0-1)
  
  // 情绪相关控制
  emotionInfluence: number;         // 情绪影响强度 (0-1)
  energyRandomnessBias: number;     // 能量随机性偏置 (-1 to 1)
  valenceRandomnessBias: number;    // 效价随机性偏置 (-1 to 1)
  arousalRandomnessBias: number;    // 激活随机性偏置 (-1 to 1)
  
  // 时间相关控制
  timeDecay: number;                // 时间衰减因子 (0-1)
  timeAcceleration: number;         // 时间加速因子 (0-2)
  timeRandomnessPhase: number;      // 时间随机性相位 (0-2π)
  
  // 性能相关控制
  performanceThreshold: number;     // 性能阈值 (0-1)
  adaptiveRandomness: boolean;      // 是否启用自适应随机性
  performanceScaling: number;       // 性能缩放因子 (0-1)
  
  // 层级特定控制
  levelSpecificControls: Record<RandomLevel, {
    enabled: boolean;               // 是否启用
    weight: number;                 // 权重 (0-1)
    randomnessRange: [number, number]; // 随机性范围
    updateInterval: number;         // 更新间隔(ms)
  }>;
  
  // 高级控制
  chaosLevel: number;               // 混沌级别 (0-1)
  entropyTarget: number;            // 熵目标值 (0-1)
  correlationStrength: number;      // 相关性强度 (0-1)
  noiseLevel: number;               // 噪声级别 (0-1)
}

// 默认参数配置
export const DEFAULT_RANDOMNESS_CONTROL_PARAMETERS: RandomnessControlParameters = {
  // 基础随机性控制
  baseRandomness: 0.5,
  randomnessAmplitude: 0.3,
  randomnessFrequency: 0.5,
  
  // 情绪相关控制
  emotionInfluence: 0.6,
  energyRandomnessBias: 0.0,
  valenceRandomnessBias: 0.0,
  arousalRandomnessBias: 0.0,
  
  // 时间相关控制
  timeDecay: 0.1,
  timeAcceleration: 1.0,
  timeRandomnessPhase: 0.0,
  
  // 性能相关控制
  performanceThreshold: 0.8,
  adaptiveRandomness: true,
  performanceScaling: 1.0,
  
  // 层级特定控制
  levelSpecificControls: {
    [RandomLevel.SYSTEM]: {
      enabled: true,
      weight: 1.0,
      randomnessRange: [0.1, 0.9],
      updateInterval: 1000
    },
    [RandomLevel.EMOTION]: {
      enabled: true,
      weight: 0.8,
      randomnessRange: [0.2, 0.8],
      updateInterval: 500
    },
    [RandomLevel.PRESET]: {
      enabled: true,
      weight: 0.6,
      randomnessRange: [0.3, 0.7],
      updateInterval: 2000
    },
    [RandomLevel.EFFECT]: {
      enabled: true,
      weight: 0.7,
      randomnessRange: [0.2, 0.8],
      updateInterval: 300
    },
    [RandomLevel.AUDIO]: {
      enabled: true,
      weight: 0.5,
      randomnessRange: [0.4, 0.6],
      updateInterval: 100
    },
    [RandomLevel.TIME]: {
      enabled: true,
      weight: 0.3,
      randomnessRange: [0.1, 0.5],
      updateInterval: 5000
    }
  },
  
  // 高级控制
  chaosLevel: 0.3,
  entropyTarget: 0.6,
  correlationStrength: 0.4,
  noiseLevel: 0.2
};

/**
 * 随机性控制参数管理器
 * 负责管理和应用随机性控制参数
 * 重构后使用模块化组件，代码更清晰
 */
export class RandomnessControlParameterManager {
  private parameters: RandomnessControlParameters;
  private isInitialized: boolean = false;

  constructor(initialParameters?: Partial<RandomnessControlParameters>) {
    this.parameters = { ...DEFAULT_RANDOMNESS_CONTROL_PARAMETERS, ...initialParameters };
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听情绪变化事件
    UnifiedEventBus.on('automix', 'energy', this.handleEmotionChange.bind(this));
    
    // 监听性能事件
    UnifiedEventBus.on('global', 'performance', this.handlePerformanceEvent.bind(this));
    
    // 监听时间事件 - 使用全局事件
    UnifiedEventBus.on('global', 'config', this.handleTimeTick.bind(this));
  }

  /**
   * 初始化参数管理器
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    try {
      // 使用参数验证器验证参数
      const validationResult = parameterValidator.validateParameters(this.parameters);
      
      if (!validationResult.isValid) {
        throw new Error(`参数验证失败:\n${validationResult.errors.join('\n')}`);
      }
      
      // 初始化模块化组件
      parameterHistory.initialize();
      parameterOptimizer.initialize();
      
      // 应用参数到多层级随机系统
      this.applyParametersToMultiLevelSystem();
      
      this.isInitialized = true;
      console.log('🎛️ 随机性控制参数管理器初始化成功');
      
      // 发射初始化完成事件
      UnifiedEventBus.emit({
        namespace: 'random',
        type: 'parameters_ready',
        timestamp: Date.now(),
        data: {
          parameters: this.parameters as unknown as Record<string, unknown>,
          validationStatus: 'success',
          validationWarnings: validationResult.warnings
        }
      });
      
    } catch (error) {
      console.error('❌ 随机性控制参数管理器初始化失败:', error);
      
      // 发射初始化失败事件
      UnifiedEventBus.emit({
        namespace: 'random',
        type: 'parameters_error',
        timestamp: Date.now(),
        data: {
          error: error.message,
          validationStatus: 'failed'
        }
      });
    }
  }

  /**
   * 应用参数到多层级随机系统
   */
  private applyParametersToMultiLevelSystem(): void {
    if (!multiLevelRandomSystem) return;
    
    // 更新层级特定控制
    Object.entries(this.parameters.levelSpecificControls).forEach(([level, control]) => {
      multiLevelRandomSystem.updateLevelConfig(level as RandomLevel, {
        enabled: control.enabled,
        weight: control.weight,
        randomnessRange: control.randomnessRange,
        updateInterval: control.updateInterval
      });
    });
  }

  /**
   * 更新参数
   */
  public updateParameters(
    newParameters: Partial<RandomnessControlParameters>,
    reason: string = '手动更新'
  ): void {
    try {
      // 使用参数验证器验证更新
      const validationResult = parameterValidator.validateParameterUpdate(
        this.parameters, 
        newParameters
      );
      
      if (!validationResult.isValid) {
        throw new Error(`参数更新验证失败:\n${validationResult.errors.join('\n')}`);
      }
      
      // 使用参数历史管理器记录历史
      parameterHistory.addEntry(newParameters, reason, {
        emotionState: this.getCurrentEmotionState(),
        performanceMetrics: this.getCurrentPerformanceMetrics(),
        userAction: reason
      });
      
      // 更新参数
      this.parameters = { ...this.parameters, ...newParameters };
      
      // 应用参数到多层级随机系统
      this.applyParametersToMultiLevelSystem();
      
      console.log(`🔄 随机性控制参数已更新: ${reason}`);
      
      // 发射参数更新事件
      UnifiedEventBus.emit({
        namespace: 'random',
        type: 'parameters_updated',
        timestamp: Date.now(),
        data: {
          updatedParameters: newParameters as Record<string, unknown>,
          reason,
          allParameters: this.parameters as unknown as Record<string, unknown>,
          validationWarnings: validationResult.warnings
        }
      });
      
    } catch (error) {
      console.error('❌ 参数更新失败:', error);
      
      // 发射参数更新失败事件
      UnifiedEventBus.emit({
        namespace: 'random',
        type: 'parameters_error',
        timestamp: Date.now(),
        data: {
          error: error.message,
          attemptedParameters: newParameters as Record<string, unknown>
        }
      });
    }
  }

  /**
   * 获取当前参数
   */
  public getParameters(): RandomnessControlParameters {
    return { ...this.parameters };
  }

  /**
   * 获取参数历史
   */
  public getParameterHistory() {
    return parameterHistory.getHistory();
  }

  /**
   * 重置参数到默认值
   */
  public resetToDefaults(): void {
    this.updateParameters(DEFAULT_RANDOMNESS_CONTROL_PARAMETERS, '重置到默认值');
  }

  /**
   * 根据情绪调整参数
   */
  private handleEmotionChange(event: any): void {
    const emotionData = event.data?.mood;
    if (!emotionData || !this.parameters.emotionInfluence) return;
    
    const { energy, valence, arousal } = emotionData;
    
    // 计算情绪驱动的参数调整
    const energyAdjustment = (energy - 0.5) * this.parameters.energyRandomnessBias;
    const valenceAdjustment = valence * this.parameters.valenceRandomnessBias;
    const arousalAdjustment = (arousal - 0.5) * this.parameters.arousalRandomnessBias;
    
    // 应用调整
    const adjustedParameters: Partial<RandomnessControlParameters> = {
      baseRandomness: Math.max(0, Math.min(1, 
        this.parameters.baseRandomness + 
        (energyAdjustment + valenceAdjustment + arousalAdjustment) * this.parameters.emotionInfluence
      )),
      randomnessAmplitude: Math.max(0, Math.min(1,
        this.parameters.randomnessAmplitude * (1 + energy * 0.2)
      ))
    };
    
    this.updateParameters(adjustedParameters, '情绪驱动调整');
  }

  /**
   * 根据性能调整参数
   */
  private handlePerformanceEvent(event: any): void {
    if (!this.parameters.adaptiveRandomness) return;
    
    const performanceData = event.data;
    if (!performanceData) return;
    
    const { fps, memoryUsage, cpuUsage } = performanceData;
    
    // 计算性能因子
    const performanceFactor = this.calculatePerformanceFactor(fps, memoryUsage, cpuUsage);
    
    // 根据性能调整参数
    const adjustedParameters: Partial<RandomnessControlParameters> = {
      randomnessAmplitude: this.parameters.randomnessAmplitude * performanceFactor,
      randomnessFrequency: this.parameters.randomnessFrequency * performanceFactor,
      performanceScaling: performanceFactor
    };
    
    this.updateParameters(adjustedParameters, '性能自适应调整');
  }

  /**
   * 计算性能因子
   */
  private calculatePerformanceFactor(fps: number, memoryUsage: number, cpuUsage: number): number {
    let factor = 1.0;
    
    // FPS影响
    if (fps < 30) factor *= 0.5;
    else if (fps < 45) factor *= 0.7;
    else if (fps < 60) factor *= 0.9;
    
    // 内存使用影响
    if (memoryUsage > 0.8) factor *= 0.6;
    else if (memoryUsage > 0.6) factor *= 0.8;
    
    // CPU使用影响
    if (cpuUsage > 0.8) factor *= 0.6;
    else if (cpuUsage > 0.6) factor *= 0.8;
    
    return Math.max(0.3, Math.min(1.0, factor));
  }

  /**
   * 处理时间事件
   */
  private handleTimeTick(event: any): void {
    // 应用时间衰减
    if (this.parameters.timeDecay > 0) {
      const timeAdjustment = Math.sin(
        Date.now() * this.parameters.timeAcceleration / 10000 + 
        this.parameters.timeRandomnessPhase
      ) * this.parameters.timeDecay;
      
      const adjustedParameters: Partial<RandomnessControlParameters> = {
        baseRandomness: Math.max(0, Math.min(1,
          this.parameters.baseRandomness + timeAdjustment
        ))
      };
      
      this.updateParameters(adjustedParameters, '时间衰减调整');
    }
  }

  /**
   * 计算混沌因子
   */
  public calculateChaosFactor(): number {
    const { chaosLevel, entropyTarget, correlationStrength, noiseLevel } = this.parameters;
    
    // 基础混沌因子
    let chaosFactor = chaosLevel;
    
    // 熵影响
    const entropyDeviation = Math.abs(this.calculateCurrentEntropy() - entropyTarget);
    chaosFactor += entropyDeviation * 0.3;
    
    // 相关性影响
    chaosFactor += (1 - correlationStrength) * 0.2;
    
    // 噪声影响
    chaosFactor += noiseLevel * 0.1;
    
    return Math.max(0, Math.min(1, chaosFactor));
  }

  /**
   * 计算当前熵值
   */
  private calculateCurrentEntropy(): number {
    // 基于多层级随机系统的当前状态计算熵值
    if (!multiLevelRandomSystem) return 0.5;
    
    const levelStates = multiLevelRandomSystem.getLevelStates();
    let totalEntropy = 0;
    let activeLevels = 0;
    
    Object.values(levelStates).forEach(state => {
      if (state.isActive) {
        // 使用当前随机性值作为熵的估计
        totalEntropy += state.currentRandomness;
        activeLevels++;
      }
    });
    
    return activeLevels > 0 ? totalEntropy / activeLevels : 0.5;
  }

  /**
   * 获取参数摘要
   */
  public getParameterSummary(): {
    totalParameters: number;
    activeLevels: number;
    chaosFactor: number;
    performanceFactor: number;
    lastUpdate: number;
  } {
    const activeLevels = Object.values(this.parameters.levelSpecificControls)
      .filter(control => control.enabled).length;
    
    return {
      totalParameters: Object.keys(this.parameters).length,
      activeLevels,
      chaosFactor: this.calculateChaosFactor(),
      performanceFactor: this.parameters.performanceScaling,
      lastUpdate: parameterHistory.getLatestEntry()?.timestamp || 0
    };
  }

  /**
   * 导出参数配置
   */
  public exportConfiguration(): string {
    return JSON.stringify({
      parameters: this.parameters,
      timestamp: Date.now(),
      version: '1.0.0'
    }, null, 2);
  }

  /**
   * 导入参数配置
   */
  public importConfiguration(configString: string): void {
    try {
      const config = JSON.parse(configString);
      
      if (config.parameters && config.version) {
        this.updateParameters(config.parameters, `导入配置 v${config.version}`);
        console.log('✅ 参数配置导入成功');
      } else {
        throw new Error('无效的配置格式');
      }
      
    } catch (error) {
      console.error('❌ 参数配置导入失败:', error);
      throw error;
    }
  }

  /**
   * 优化参数
   */
  public optimizeParameters(context: OptimizationContext): OptimizationResult {
    return parameterOptimizer.optimizeParameters(this.parameters, context);
  }

  /**
   * 获取优化历史
   */
  public getOptimizationHistory(): OptimizationResult[] {
    return parameterOptimizer.getOptimizationHistory();
  }

  /**
   * 获取优化统计
   */
  public getOptimizationStats() {
    return parameterOptimizer.getOptimizationStats();
  }

  /**
   * 获取验证摘要
   */
  public getValidationSummary() {
    return parameterValidator.getValidationSummary(this.parameters);
  }

  /**
   * 获取历史统计
   */
  public getHistoryStats() {
    return parameterHistory.getHistoryStats();
  }

  /**
   * 获取当前情绪状态
   */
  private getCurrentEmotionState() {
    // 这里应该从情绪核心获取当前状态
    // 暂时返回默认值
    return {
      energy: 0.5,
      valence: 0.5,
      arousal: 0.5
    };
  }

  /**
   * 获取当前性能指标
   */
  private getCurrentPerformanceMetrics() {
    // 这里应该从性能监控系统获取当前指标
    // 暂时返回默认值
    return {
      fps: 60,
      memoryUsage: 0.5,
      cpuUsage: 0.3
    };
  }

  /**
   * 销毁管理器
   */
  public destroy(): void {
    // 清理事件监听器
    UnifiedEventBus.off('automix', 'energy', this.handleEmotionChange.bind(this));
    UnifiedEventBus.off('global', 'performance', this.handlePerformanceEvent.bind(this));
    UnifiedEventBus.off('global', 'config', this.handleTimeTick.bind(this));
    
    // 销毁模块化组件
    parameterHistory.destroy();
    parameterOptimizer.destroy();
    
    this.isInitialized = false;
    console.log('🛑 随机性控制参数管理器已销毁');
  }
}

// 创建默认实例
export const randomnessControlParameterManager = new RandomnessControlParameterManager();
