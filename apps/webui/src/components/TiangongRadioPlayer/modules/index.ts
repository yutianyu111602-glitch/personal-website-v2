/**
 * 模块导出文件
 * 导出所有参数管理相关的模块
 * TASK-126: 模块化RandomnessControlParameterManager
 * TASK-127: 模块化RandomnessVisualizationManager
 * TASK-128: 模块化AdvancedSeedGenerator
 */

// 参数验证器模块
export { 
  ParameterValidator, 
  parameterValidator,
  type ParameterValidationRule,
  type ValidationResult,
  PARAMETER_VALIDATION_RULES
} from './ParameterValidator';

// 参数历史管理模块
export { 
  ParameterHistory, 
  parameterHistory,
  type ParameterHistoryEntry,
  type HistoryConfig,
  type HistoryStats,
  DEFAULT_HISTORY_CONFIG
} from './ParameterHistory';

// 参数优化器模块
export { 
  ParameterOptimizer, 
  parameterOptimizer,
  type OptimizationStrategy as ParameterOptimizationStrategy,
  type OptimizationContext as ParameterOptimizationContext,
  type OptimizationResult as ParameterOptimizationResult,
  type OptimizationConfig as ParameterOptimizationConfig,
  DEFAULT_OPTIMIZATION_CONFIG as DEFAULT_PARAMETER_OPTIMIZATION_CONFIG
} from './ParameterOptimizer';

// 情绪核心配置模块
export {
  EmotionCoreConfigManager,
  emotionCoreConfigManager,
  type EmotionCoreInputParameters,
  type EmotionCoreOutputParameters,
  type EmotionCoreConfig,
  DEFAULT_EMOTION_CORE_CONFIG
} from './EmotionCoreConfig';

// 图表渲染器模块
export {
  ChartRenderer,
  type ChartType,
  type ChartConfig,
  type ChartData,
  type RenderOptions
} from './ChartRenderer';

// 数据处理器模块
export {
  DataProcessor,
  type DataProcessingConfig,
  type TrendAnalysisResult,
  type AnomalyDetectionResult,
  type CorrelationAnalysisResult,
  type PerformanceMetrics,
  DEFAULT_DATA_PROCESSING_CONFIG
} from './DataProcessor';

// 动画管理器模块
export {
  AnimationManager,
  type AnimationType,
  type AnimationConfig,
  type AnimationState,
  type AnimationEffect,
  type EasingFunction,
  EASING_FUNCTIONS,
  DEFAULT_ANIMATION_CONFIG
} from './AnimationManager';

// 种子策略管理器模块
export {
  SeedStrategyManager,
  type SeedGenerationStrategy,
  type StrategyConfig,
  type StrategyPerformanceMetrics,
  type StrategySelectionResult,
  DEFAULT_STRATEGY_CONFIG
} from './SeedStrategyManager';

// 种子质量评估器模块
export {
  QualityEvaluator,
  type SeedQualityMetrics,
  type QualityEvaluationConfig,
  type DistributionTestResult,
  type CorrelationTestResult,
  type PeriodTestResult,
  DEFAULT_QUALITY_EVALUATION_CONFIG
} from './QualityEvaluator';

// 策略优化器模块
export {
  StrategyOptimizer,
  type OptimizationConfig as SeedOptimizationConfig,
  type OptimizationResult as SeedOptimizationResult,
  type ParameterTuningResult,
  type StrategySwitchingResult,
  type HybridOptimizationResult,
  DEFAULT_OPTIMIZATION_CONFIG as DEFAULT_SEED_OPTIMIZATION_CONFIG
} from './StrategyOptimizer';

// 模块版本信息
export const MODULE_VERSION = '1.0.0';
export const MODULE_BUILD_DATE = '2025-08-25';
export const MODULE_DESCRIPTION = '随机性控制参数管理模块化系统 + 情绪核心配置系统 + 可视化模块化系统 + 种子生成模块化系统';
