/**
 * 参数验证器模块
 * 负责验证随机性控制参数的完整性和有效性
 * TASK-126: 模块化RandomnessControlParameterManager
 */

import type { RandomnessControlParameters } from '../randomnessControlParameters';

// 参数验证规则接口
export interface ParameterValidationRule {
  parameter: keyof RandomnessControlParameters;
  min: number;
  max: number;
  type: 'number' | 'boolean';
  required: boolean;
}

// 验证结果接口
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 参数验证规则配置
export const PARAMETER_VALIDATION_RULES: ParameterValidationRule[] = [
  { parameter: 'baseRandomness', min: 0, max: 1, type: 'number', required: true },
  { parameter: 'randomnessAmplitude', min: 0, max: 1, type: 'number', required: true },
  { parameter: 'randomnessFrequency', min: 0, max: 1, type: 'number', required: true },
  { parameter: 'emotionInfluence', min: 0, max: 1, type: 'number', required: true },
  { parameter: 'energyRandomnessBias', min: -1, max: 1, type: 'number', required: true },
  { parameter: 'valenceRandomnessBias', min: -1, max: 1, type: 'number', required: true },
  { parameter: 'arousalRandomnessBias', min: -1, max: 1, type: 'number', required: true },
  { parameter: 'timeDecay', min: 0, max: 1, type: 'number', required: true },
  { parameter: 'timeAcceleration', min: 0, max: 2, type: 'number', required: true },
  { parameter: 'timeRandomnessPhase', min: 0, max: 2 * Math.PI, type: 'number', required: true },
  { parameter: 'performanceThreshold', min: 0, max: 1, type: 'number', required: true },
  { parameter: 'adaptiveRandomness', min: 0, max: 1, type: 'boolean', required: true },
  { parameter: 'performanceScaling', min: 0, max: 1, type: 'number', required: true },
  { parameter: 'chaosLevel', min: 0, max: 1, type: 'number', required: true },
  { parameter: 'entropyTarget', min: 0, max: 1, type: 'number', required: true },
  { parameter: 'correlationStrength', min: 0, max: 1, type: 'number', required: true },
  { parameter: 'noiseLevel', min: 0, max: 1, type: 'number', required: true }
];

/**
 * 参数验证器类
 * 提供完整的参数验证功能
 */
export class ParameterValidator {
  private validationRules: ParameterValidationRule[];
  private customRules: ParameterValidationRule[] = [];

  constructor(validationRules?: ParameterValidationRule[]) {
    this.validationRules = validationRules || PARAMETER_VALIDATION_RULES;
  }

  /**
   * 验证完整的参数对象
   */
  public validateParameters(parameters: RandomnessControlParameters): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证所有必需参数
    this.validationRules.forEach(rule => {
      const validationResult = this.validateSingleParameter(parameters, rule);
      
      if (!validationResult.isValid) {
        errors.push(validationResult.error);
      } else if (validationResult.warning) {
        warnings.push(validationResult.warning);
      }
    });

    // 验证层级特定控制
    const levelValidationResult = this.validateLevelSpecificControls(parameters);
    if (!levelValidationResult.isValid) {
      errors.push(...levelValidationResult.errors);
    }

    // 验证参数一致性
    const consistencyResult = this.validateParameterConsistency(parameters);
    if (!consistencyResult.isValid) {
      warnings.push(...consistencyResult.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证单个参数
   */
  private validateSingleParameter(
    parameters: RandomnessControlParameters, 
    rule: ParameterValidationRule
  ): { isValid: boolean; error?: string; warning?: string } {
    const value = parameters[rule.parameter];
    
    // 检查必需参数
    if (rule.required && value === undefined) {
      return {
        isValid: false,
        error: `参数 ${rule.parameter} 是必需的`
      };
    }
    
    // 类型检查
    if (rule.type === 'number' && typeof value === 'number') {
      if (value < rule.min || value > rule.max) {
        return {
          isValid: false,
          error: `参数 ${rule.parameter} 必须在 ${rule.min} 和 ${rule.max} 之间，当前值: ${value}`
        };
      }
      
      // 检查边界值警告
      if (value === rule.min || value === rule.max) {
        return {
          isValid: true,
          warning: `参数 ${rule.parameter} 处于边界值 ${value}，可能影响系统性能`
        };
      }
    }
    
    return { isValid: true };
  }

  /**
   * 验证层级特定控制
   */
  private validateLevelSpecificControls(parameters: RandomnessControlParameters): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    Object.entries(parameters.levelSpecificControls).forEach(([level, control]) => {
      // 验证权重范围
      if (control.weight < 0 || control.weight > 1) {
        errors.push(`层级 ${level} 的权重必须在 0-1 之间，当前值: ${control.weight}`);
      }
      
      // 验证随机性范围
      const [min, max] = control.randomnessRange;
      if (min < 0 || max > 1 || min >= max) {
        errors.push(`层级 ${level} 的随机性范围无效: [${min}, ${max}]`);
      }
      
      // 验证更新间隔
      if (control.updateInterval < 50) {
        warnings.push(`层级 ${level} 的更新间隔过短 (${control.updateInterval}ms)，可能影响性能`);
      }
      
      if (control.updateInterval > 10000) {
        warnings.push(`层级 ${level} 的更新间隔过长 (${control.updateInterval}ms)，可能影响响应性`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证参数一致性
   */
  private validateParameterConsistency(parameters: RandomnessControlParameters): ValidationResult {
    const warnings: string[] = [];

    // 检查情绪影响与偏置的一致性
    if (parameters.emotionInfluence > 0.8 && 
        Math.abs(parameters.energyRandomnessBias) < 0.1) {
      warnings.push('情绪影响强度较高但能量偏置较低，可能影响情绪响应效果');
    }

    // 检查混沌级别与熵目标的一致性
    if (parameters.chaosLevel > 0.7 && parameters.entropyTarget < 0.3) {
      warnings.push('混沌级别较高但熵目标较低，可能导致系统不稳定');
    }

    // 检查性能阈值与自适应设置的一致性
    if (parameters.performanceThreshold < 0.5 && !parameters.adaptiveRandomness) {
      warnings.push('性能阈值较低但未启用自适应随机性，可能导致性能问题');
    }

    return {
      isValid: true,
      errors: [],
      warnings
    };
  }

  /**
   * 添加自定义验证规则
   */
  public addCustomRule(rule: ParameterValidationRule): void {
    this.customRules.push(rule);
  }

  /**
   * 获取所有验证规则
   */
  public getAllValidationRules(): ParameterValidationRule[] {
    return [...this.validationRules, ...this.customRules];
  }

  /**
   * 验证参数更新
   */
  public validateParameterUpdate(
    currentParameters: RandomnessControlParameters,
    newParameters: Partial<RandomnessControlParameters>
  ): ValidationResult {
    // 创建临时参数对象
    const tempParameters = { ...currentParameters, ...newParameters };
    
    // 验证临时参数
    return this.validateParameters(tempParameters);
  }

  /**
   * 获取参数验证摘要
   */
  public getValidationSummary(parameters: RandomnessControlParameters): {
    totalParameters: number;
    validatedParameters: number;
    validationErrors: number;
    validationWarnings: number;
  } {
    const validationResult = this.validateParameters(parameters);
    
    return {
      totalParameters: this.validationRules.length,
      validatedParameters: this.validationRules.length - validationResult.errors.length,
      validationErrors: validationResult.errors.length,
      validationWarnings: validationResult.warnings.length
    };
  }
}

// 创建默认验证器实例
export const parameterValidator = new ParameterValidator();
