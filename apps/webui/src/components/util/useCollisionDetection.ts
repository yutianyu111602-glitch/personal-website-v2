import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// 元素位置和尺寸信息
interface ElementBounds {
  id: string;
  element: HTMLElement;
  rect: DOMRect;
  zIndex: number;
  priority: number; // 优先级，数值越高越优先保持位置
  canMove: boolean; // 是否可以移动
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

// 碰撞检测结果
interface CollisionInfo {
  hasCollision: boolean;
  collidingElements: string[];
  suggestedAdjustments: Record<string, PositionAdjustment>;
}

// 位置调整建议
interface PositionAdjustment {
  elementId: string;
  newPosition: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  transform?: string;
  transition?: string;
}

// 配置选项
interface CollisionDetectionOptions {
  // 碰撞检测的缓冲区域（像素）
  buffer: number;
  // 检测频率（毫秒）
  interval: number;
  // 是否启用自动调整
  autoAdjust: boolean;
  // 动画持续时间
  animationDuration: number;
  // 是否启用调试模式
  debug: boolean;
}

const DEFAULT_OPTIONS: CollisionDetectionOptions = {
  buffer: 20,
  interval: 100,
  autoAdjust: true,
  animationDuration: 300,
  debug: false
};

export const useCollisionDetection = (options: Partial<CollisionDetectionOptions> = {}) => {
  const config = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);
  
  const [registeredElements, setRegisteredElements] = useState<Map<string, ElementBounds>>(new Map());
  const [collisionInfo, setCollisionInfo] = useState<CollisionInfo>({
    hasCollision: false,
    collidingElements: [],
    suggestedAdjustments: {}
  });
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const isProcessingRef = useRef(false);

  // 检查两个矩形是否碰撞（包含缓冲区）
  const checkRectCollision = useCallback((rect1: DOMRect, rect2: DOMRect, buffer: number = 0): boolean => {
    return !(
      rect1.right + buffer < rect2.left ||
      rect1.left - buffer > rect2.right ||
      rect1.bottom + buffer < rect2.top ||
      rect1.top - buffer > rect2.bottom
    );
  }, []);

  // 计算最佳避让位置
  const calculateAvoidancePosition = useCallback((
    element: ElementBounds,
    collidingElements: ElementBounds[],
    viewportWidth: number,
    viewportHeight: number
  ): PositionAdjustment => {
    const rect = element.rect;
    const buffer = config.buffer;
    
    // 可能的新位置选项
    const positionOptions = [];
    
    // 尝试向上移动
    let canMoveUp = true;
    const upPosition = rect.top - buffer;
    for (const colliding of collidingElements) {
      if (colliding.rect.bottom > upPosition - rect.height - buffer) {
        canMoveUp = false;
        break;
      }
    }
    if (canMoveUp && upPosition - rect.height >= 0) {
      positionOptions.push({
        top: upPosition - rect.height,
        score: element.preferredPosition === 'top' ? 10 : 5
      });
    }

    // 尝试向下移动
    let canMoveDown = true;
    const downPosition = rect.bottom + buffer;
    for (const colliding of collidingElements) {
      if (colliding.rect.top < downPosition + rect.height + buffer) {
        canMoveDown = false;
        break;
      }
    }
    if (canMoveDown && downPosition + rect.height <= viewportHeight) {
      positionOptions.push({
        top: downPosition,
        score: element.preferredPosition === 'bottom' ? 10 : 5
      });
    }

    // 尝试向左移动
    let canMoveLeft = true;
    const leftPosition = rect.left - buffer;
    for (const colliding of collidingElements) {
      if (colliding.rect.right > leftPosition - rect.width - buffer) {
        canMoveLeft = false;
        break;
      }
    }
    if (canMoveLeft && leftPosition - rect.width >= 0) {
      positionOptions.push({
        left: leftPosition - rect.width,
        score: element.preferredPosition === 'left' ? 10 : 3
      });
    }

    // 尝试向右移动
    let canMoveRight = true;
    const rightPosition = rect.right + buffer;
    for (const colliding of collidingElements) {
      if (colliding.rect.left < rightPosition + rect.width + buffer) {
        canMoveRight = false;
        break;
      }
    }
    if (canMoveRight && rightPosition + rect.width <= viewportWidth) {
      positionOptions.push({
        left: rightPosition,
        score: element.preferredPosition === 'right' ? 10 : 3
      });
    }

    // 选择最佳位置（优先级最高的）
    const bestOption = positionOptions.reduce((best, current) => 
      current.score > best.score ? current : best, 
      { score: -1 }
    );

    if (bestOption.score > -1) {
      return {
        elementId: element.id,
        newPosition: {
          top: bestOption.top,
          left: bestOption.left
        },
        transition: `all ${config.animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
      };
    }

    // 如果没有合适的位置，尝试缩放或透明度调整
    return {
      elementId: element.id,
      newPosition: {},
      transform: 'scale(0.9)',
      transition: `all ${config.animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
    };
  }, [config.buffer, config.animationDuration]);

  // 执行碰撞检测
  const performCollisionDetection = useCallback(() => {
    if (isProcessingRef.current || registeredElements.size < 2) return;
    
    isProcessingRef.current = true;
    
    try {
      const elements = Array.from(registeredElements.values());
      const collisions: string[] = [];
      const adjustments: Record<string, PositionAdjustment> = {};
      
      // 更新所有元素的边界信息
      elements.forEach(element => {
        if (element.element && element.element.isConnected) {
          element.rect = element.element.getBoundingClientRect();
        }
      });

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // 检查每一对元素的碰撞
      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          const element1 = elements[i];
          const element2 = elements[j];
          
          if (!element1.element.isConnected || !element2.element.isConnected) continue;
          
          if (checkRectCollision(element1.rect, element2.rect, config.buffer)) {
            collisions.push(element1.id, element2.id);
            
            if (config.autoAdjust) {
              // 优先级低的元素需要移动
              const movableElement = element1.priority < element2.priority ? element1 : element2;
              const staticElement = element1.priority >= element2.priority ? element1 : element2;
              
              if (movableElement.canMove && !adjustments[movableElement.id]) {
                adjustments[movableElement.id] = calculateAvoidancePosition(
                  movableElement,
                  [staticElement],
                  viewportWidth,
                  viewportHeight
                );
              }
            }
          }
        }
      }

      const newCollisionInfo: CollisionInfo = {
        hasCollision: collisions.length > 0,
        collidingElements: [...new Set(collisions)],
        suggestedAdjustments: adjustments
      };

      setCollisionInfo(newCollisionInfo);

      if (config.debug && newCollisionInfo.hasCollision) {
        console.log('🔴 Collision detected:', newCollisionInfo);
      }

    } catch (error) {
      console.error('Collision detection error:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [registeredElements, checkRectCollision, calculateAvoidancePosition, config]);

  // 注册元素
  const registerElement = useCallback((
    id: string,
    element: HTMLElement,
    options: {
      zIndex?: number;
      priority?: number;
      canMove?: boolean;
      preferredPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    } = {}
  ) => {
    if (!element) return;

    const elementBounds: ElementBounds = {
      id,
      element,
      rect: element.getBoundingClientRect(),
      zIndex: options.zIndex || parseInt(getComputedStyle(element).zIndex) || 1,
      priority: options.priority || 1,
      canMove: options.canMove !== false,
      preferredPosition: options.preferredPosition
    };

    setRegisteredElements(prev => new Map(prev).set(id, elementBounds));
    
    if (config.debug) {
      console.log('📍 Element registered:', id, elementBounds);
    }
  }, [config.debug]);

  // 注销元素
  const unregisterElement = useCallback((id: string) => {
    setRegisteredElements(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
    
    if (config.debug) {
      console.log('📍 Element unregistered:', id);
    }
  }, [config.debug]);

  // 手动触发检测
  const triggerDetection = useCallback(() => {
    performCollisionDetection();
  }, [performCollisionDetection]);

  // 应用建议的调整
  const applyAdjustments = useCallback((adjustments: Record<string, PositionAdjustment>) => {
    Object.values(adjustments).forEach(adjustment => {
      const element = registeredElements.get(adjustment.elementId);
      if (!element?.element) return;

      const { style } = element.element;
      
      // 应用过渡动画
      if (adjustment.transition) {
        style.transition = adjustment.transition;
      }

      // 应用位置调整
      if (adjustment.newPosition.top !== undefined) {
        style.top = `${adjustment.newPosition.top}px`;
      }
      if (adjustment.newPosition.bottom !== undefined) {
        style.bottom = `${adjustment.newPosition.bottom}px`;
      }
      if (adjustment.newPosition.left !== undefined) {
        style.left = `${adjustment.newPosition.left}px`;
      }
      if (adjustment.newPosition.right !== undefined) {
        style.right = `${adjustment.newPosition.right}px`;
      }

      // 应用变换
      if (adjustment.transform) {
        style.transform = adjustment.transform;
      }
    });
  }, [registeredElements]);

  // 自动应用调整
  useEffect(() => {
    if (config.autoAdjust && Object.keys(collisionInfo.suggestedAdjustments).length > 0) {
      applyAdjustments(collisionInfo.suggestedAdjustments);
    }
  }, [collisionInfo.suggestedAdjustments, config.autoAdjust, applyAdjustments]);

  // 启动周期性检测
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(performCollisionDetection, config.interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [performCollisionDetection, config.interval]);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setTimeout(performCollisionDetection, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [performCollisionDetection]);

  return {
    // 状态
    hasCollision: collisionInfo.hasCollision,
    collidingElements: collisionInfo.collidingElements,
    registeredElements: Array.from(registeredElements.keys()),
    
    // 方法
    registerElement,
    unregisterElement,
    triggerDetection,
    applyAdjustments,
    
    // 建议调整
    suggestedAdjustments: collisionInfo.suggestedAdjustments
  };
};

// 便捷的元素注册Hook
export const useElementRegistration = (
  id: string,
  options: {
    zIndex?: number;
    priority?: number;
    canMove?: boolean;
    preferredPosition?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  } = {}
) => {
  const elementRef = useRef<HTMLElement>(null);
  const { registerElement, unregisterElement } = useCollisionDetection();

  useEffect(() => {
    if (elementRef.current) {
      registerElement(id, elementRef.current, options);
      
      return () => {
        unregisterElement(id);
      };
    }
  }, [id, registerElement, unregisterElement, options]);

  return elementRef;
};