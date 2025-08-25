/**
 * 动画管理器模块
 * 负责管理随机性可视化的动画效果
 * TASK-127: 模块化RandomnessVisualizationManager
 */

import type { RandomLevel } from '../multiLevelRandomSystem';
import type { VisualizationData } from '../randomnessVisualization';

// 动画类型
export type AnimationType = 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce' | 'wave' | 'particle';

// 动画配置接口
export interface AnimationConfig {
  // 基础配置
  enabled: boolean;                 // 是否启用动画
  duration: number;                  // 动画持续时间(ms)
  easing: string;                    // 缓动函数
  delay: number;                     // 延迟时间(ms)
  
  // 性能配置
  maxConcurrentAnimations: number;  // 最大并发动画数
  frameRate: number;                 // 目标帧率
  enableThrottling: boolean;         // 是否启用节流
  
  // 视觉效果配置
  enableParticles: boolean;          // 是否启用粒子效果
  enableGlow: boolean;               // 是否启用发光效果
  enableShadows: boolean;            // 是否启用阴影效果
  enableBlur: boolean;               // 是否启用模糊效果
}

// 默认配置
export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  enabled: true,
  duration: 300,
  easing: 'ease-out',
  delay: 0,
  maxConcurrentAnimations: 10,
  frameRate: 60,
  enableThrottling: true,
  enableParticles: true,
  enableGlow: true,
  enableShadows: false,
  enableBlur: false
};

// 动画状态接口
export interface AnimationState {
  id: string;
  type: AnimationType;
  startTime: number;
  duration: number;
  progress: number;
  isActive: boolean;
  target: HTMLElement | null;
  parameters: Record<string, any>;
}

// 动画效果接口
export interface AnimationEffect {
  name: string;
  type: AnimationType;
  parameters: Record<string, any>;
  priority: number;
  duration: number;
}

// 缓动函数类型
export type EasingFunction = (t: number) => number;

// 缓动函数集合
export const EASING_FUNCTIONS: Record<string, EasingFunction> = {
  'linear': (t: number) => t,
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => 1 - Math.pow(1 - t, 2),
  'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  'bounce': (t: number) => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  },
  'elastic': (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
  }
};

/**
 * 动画管理器类
 * 提供完整的动画管理功能
 */
export class AnimationManager {
  private config: AnimationConfig;
  private isInitialized: boolean = false;
  private animations: Map<string, AnimationState> = new Map();
  private animationQueue: AnimationEffect[] = [];
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;

  constructor(config?: Partial<AnimationConfig>) {
    this.config = { ...DEFAULT_ANIMATION_CONFIG, ...config };
  }

  /**
   * 初始化动画管理器
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    try {
      if (this.config.enabled) {
        this.startAnimationLoop();
      }
      
      this.isInitialized = true;
      console.log('🎬 动画管理器初始化成功');
      
    } catch (error) {
      console.error('❌ 动画管理器初始化失败:', error);
    }
  }

  /**
   * 启动动画循环
   */
  private startAnimationLoop(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.animate();
  }

  /**
   * 停止动画循环
   */
  private stopAnimationLoop(): void {
    this.isRunning = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * 动画循环
   */
  private animate(): void {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    
    // 检查帧率限制
    if (deltaTime >= (1000 / this.config.frameRate)) {
      this.updateAnimations(deltaTime);
      this.lastFrameTime = currentTime;
    }
    
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  /**
   * 更新动画
   */
  private updateAnimations(deltaTime: number): void {
    const activeAnimations = Array.from(this.animations.values()).filter(a => a.isActive);
    
    // 限制并发动画数量
    if (activeAnimations.length >= this.config.maxConcurrentAnimations) {
      return;
    }
    
    // 处理动画队列
    this.processAnimationQueue();
    
    // 更新活动动画
    activeAnimations.forEach(animation => {
      this.updateAnimation(animation, deltaTime);
    });
    
    // 清理完成的动画
    this.cleanupCompletedAnimations();
  }

  /**
   * 处理动画队列
   */
  private processAnimationQueue(): void {
    if (this.animationQueue.length === 0) return;
    
    const activeCount = Array.from(this.animations.values()).filter(a => a.isActive).length;
    const availableSlots = this.config.maxConcurrentAnimations - activeCount;
    
    for (let i = 0; i < Math.min(availableSlots, this.animationQueue.length); i++) {
      const effect = this.animationQueue.shift();
      if (effect) {
        this.startAnimation(effect);
      }
    }
  }

  /**
   * 启动动画
   */
  private startAnimation(effect: AnimationEffect): void {
    const animationId = `animation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const animation: AnimationState = {
      id: animationId,
      type: effect.type,
      startTime: performance.now() + this.config.delay,
      duration: effect.duration || this.config.duration,
      progress: 0,
      isActive: true,
      target: null,
      parameters: effect.parameters
    };
    
    this.animations.set(animationId, animation);
  }

  /**
   * 更新动画
   */
  private updateAnimation(animation: AnimationState, deltaTime: number): void {
    const currentTime = performance.now();
    
    if (currentTime < animation.startTime) {
      return; // 等待延迟
    }
    
    const elapsed = currentTime - animation.startTime;
    animation.progress = Math.min(1, elapsed / animation.duration);
    
    // 应用缓动函数
    const easingFunction = EASING_FUNCTIONS[this.config.easing] || EASING_FUNCTIONS['ease-out'];
    const easedProgress = easingFunction(animation.progress);
    
    // 应用动画效果
    this.applyAnimationEffect(animation, easedProgress);
    
    // 检查动画是否完成
    if (animation.progress >= 1) {
      animation.isActive = false;
    }
  }

  /**
   * 应用动画效果
   */
  private applyAnimationEffect(animation: AnimationState, progress: number): void {
    switch (animation.type) {
      case 'fade':
        this.applyFadeEffect(animation, progress);
        break;
      case 'slide':
        this.applySlideEffect(animation, progress);
        break;
      case 'scale':
        this.applyScaleEffect(animation, progress);
        break;
      case 'rotate':
        this.applyRotateEffect(animation, progress);
        break;
      case 'bounce':
        this.applyBounceEffect(animation, progress);
        break;
      case 'wave':
        this.applyWaveEffect(animation, progress);
        break;
      case 'particle':
        this.applyParticleEffect(animation, progress);
        break;
    }
  }

  /**
   * 应用淡入淡出效果
   */
  private applyFadeEffect(animation: AnimationState, progress: number): void {
    if (!animation.target) return;
    
    const opacity = animation.parameters.direction === 'in' ? progress : 1 - progress;
    animation.target.style.opacity = opacity.toString();
  }

  /**
   * 应用滑动效果
   */
  private applySlideEffect(animation: AnimationState, progress: number): void {
    if (!animation.target) return;
    
    const direction = animation.parameters.direction || 'left';
    const distance = animation.parameters.distance || 100;
    
    let transform = '';
    switch (direction) {
      case 'left':
        transform = `translateX(${(1 - progress) * distance}px)`;
        break;
      case 'right':
        transform = `translateX(${progress * distance}px)`;
        break;
      case 'up':
        transform = `translateY(${(1 - progress) * distance}px)`;
        break;
      case 'down':
        transform = `translateY(${progress * distance}px)`;
        break;
    }
    
    animation.target.style.transform = transform;
  }

  /**
   * 应用缩放效果
   */
  private applyScaleEffect(animation: AnimationState, progress: number): void {
    if (!animation.target) return;
    
    const scale = animation.parameters.direction === 'in' ? progress : 1 - progress;
    const finalScale = animation.parameters.startScale || 0 + scale * (1 - (animation.parameters.startScale || 0));
    
    animation.target.style.transform = `scale(${finalScale})`;
  }

  /**
   * 应用旋转效果
   */
  private applyRotateEffect(animation: AnimationState, progress: number): void {
    if (!animation.target) return;
    
    const rotation = progress * (animation.parameters.angle || 360);
    animation.target.style.transform = `rotate(${rotation}deg)`;
  }

  /**
   * 应用弹跳效果
   */
  private applyBounceEffect(animation: AnimationState, progress: number): void {
    if (!animation.target) return;
    
    const bounce = this.config.enabled ? EASING_FUNCTIONS['bounce'](progress) : progress;
    const distance = animation.parameters.distance || 50;
    
    animation.target.style.transform = `translateY(${(1 - bounce) * distance}px)`;
  }

  /**
   * 应用波浪效果
   */
  private applyWaveEffect(animation: AnimationState, progress: number): void {
    if (!animation.target) return;
    
    const amplitude = animation.parameters.amplitude || 10;
    const frequency = animation.parameters.frequency || 2;
    const offset = Math.sin(progress * Math.PI * 2 * frequency) * amplitude;
    
    animation.target.style.transform = `translateY(${offset}px)`;
  }

  /**
   * 应用粒子效果
   */
  private applyParticleEffect(animation: AnimationState, progress: number): void {
    if (!animation.target || !this.config.enableParticles) return;
    
    // 创建粒子元素
    if (!animation.parameters.particles) {
      animation.parameters.particles = this.createParticles(animation.target);
    }
    
    // 更新粒子位置
    this.updateParticles(animation.parameters.particles, progress);
  }

  /**
   * 创建粒子
   */
  private createParticles(target: HTMLElement): HTMLElement[] {
    const particleCount = 20;
    const particles: HTMLElement[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'animation-particle';
      particle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: #FF6B6B;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
      `;
      
      target.appendChild(particle);
      particles.push(particle);
    }
    
    return particles;
  }

  /**
   * 更新粒子
   */
  private updateParticles(particles: HTMLElement[], progress: number): void {
    particles.forEach((particle, index) => {
      const angle = (index / particles.length) * Math.PI * 2;
      const radius = 50 + progress * 100;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      particle.style.transform = `translate(${x}px, ${y}px)`;
      particle.style.opacity = (1 - progress).toString();
    });
  }

  /**
   * 清理完成的动画
   */
  private cleanupCompletedAnimations(): void {
    const completedAnimations = Array.from(this.animations.values())
      .filter(a => !a.isActive);
    
    completedAnimations.forEach(animation => {
      this.animations.delete(animation.id);
      
      // 清理粒子
      if (animation.parameters.particles) {
        animation.parameters.particles.forEach(particle => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        });
      }
    });
  }

  /**
   * 添加动画效果
   */
  public addAnimation(effect: AnimationEffect): string {
    const animationId = `animation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 检查优先级
    if (this.animationQueue.length > 0) {
      const lastPriority = this.animationQueue[this.animationQueue.length - 1].priority;
      if (effect.priority > lastPriority) {
        // 高优先级动画插入到队列前面
        this.animationQueue.unshift(effect);
      } else {
        this.animationQueue.push(effect);
      }
    } else {
      this.animationQueue.push(effect);
    }
    
    return animationId;
  }

  /**
   * 停止动画
   */
  public stopAnimation(animationId: string): boolean {
    const animation = this.animations.get(animationId);
    if (animation) {
      animation.isActive = false;
      return true;
    }
    return false;
  }

  /**
   * 停止所有动画
   */
  public stopAllAnimations(): void {
    this.animations.forEach(animation => {
      animation.isActive = false;
    });
    
    this.animationQueue = [];
  }

  /**
   * 暂停动画
   */
  public pauseAnimations(): void {
    this.stopAnimationLoop();
  }

  /**
   * 恢复动画
   */
  public resumeAnimations(): void {
    if (this.config.enabled) {
      this.startAnimationLoop();
    }
  }

  /**
   * 获取活动动画数量
   */
  public getActiveAnimationCount(): number {
    return Array.from(this.animations.values()).filter(a => a.isActive).length;
  }

  /**
   * 获取队列中的动画数量
   */
  public getQueuedAnimationCount(): number {
    return this.animationQueue.length;
  }

  /**
   * 获取动画统计
   */
  public getAnimationStats(): {
    totalAnimations: number;
    activeAnimations: number;
    queuedAnimations: number;
    averageDuration: number;
    performanceScore: number;
  } {
    const activeAnimations = Array.from(this.animations.values()).filter(a => a.isActive);
    const totalDuration = activeAnimations.reduce((sum, a) => sum + a.duration, 0);
    const averageDuration = activeAnimations.length > 0 ? totalDuration / activeAnimations.length : 0;
    
    // 计算性能分数
    const performanceScore = Math.max(0, 1 - (activeAnimations.length / this.config.maxConcurrentAnimations));
    
    return {
      totalAnimations: this.animations.size,
      activeAnimations: activeAnimations.length,
      queuedAnimations: this.animationQueue.length,
      averageDuration,
      performanceScore
    };
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<AnimationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 根据新配置调整动画循环
    if (this.config.enabled && !this.isRunning) {
      this.startAnimationLoop();
    } else if (!this.config.enabled && this.isRunning) {
      this.stopAnimationLoop();
    }
    
    console.log('🔄 动画配置已更新');
  }

  /**
   * 获取配置
   */
  public getConfig(): AnimationConfig {
    return { ...this.config };
  }

  /**
   * 销毁动画管理器
   */
  public destroy(): void {
    this.stopAnimationLoop();
    this.stopAllAnimations();
    this.animations.clear();
    this.animationQueue = [];
    this.isInitialized = false;
    
    console.log('�� 动画管理器已销毁');
  }
}
