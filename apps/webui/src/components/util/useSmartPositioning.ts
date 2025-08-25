import { useState, useEffect, useCallback, useRef } from 'react';
import { useCollisionDetection } from './useCollisionDetection';
import { useSmartLayout } from './useSmartLayout';

// 智能定位配置
interface SmartPositioningConfig {
  moduleId: string;
  priority: number;
  canMove: boolean;
  preferredPosition: 'top' | 'bottom' | 'left' | 'right' | 'center';
  avoidanceDistance: number;
  animationDuration: number;
}

// 位置状态
interface PositionState {
  x: number;
  y: number;
  isAvoiding: boolean;
  originalPosition: { x: number; y: number } | null;
  currentZone: string;
}

const DEFAULT_POSITIONS = {
  'clock-console': { x: 0, y: -6 }, // top: -6px, centered
  'radio-player': { x: 0, y: 0 }, // bottom-8, centered
  'info-panel': { x: 0, y: 0 }, // bottom-20, centered
  'control-button': { x: 0, y: 0 }, // bottom-8 right-8
  'status-indicator': { x: 0, y: 0 } // top-8 right-8
};

export const useSmartPositioning = (config: SmartPositioningConfig) => {
  const elementRef = useRef<HTMLElement>(null);
  const [positionState, setPositionState] = useState<PositionState>({
    x: DEFAULT_POSITIONS[config.moduleId as keyof typeof DEFAULT_POSITIONS]?.x || 0,
    y: DEFAULT_POSITIONS[config.moduleId as keyof typeof DEFAULT_POSITIONS]?.y || 0,
    isAvoiding: false,
    originalPosition: null,
    currentZone: 'center'
  });

  const { 
    registerElement, 
    unregisterElement, 
    hasCollision, 
    suggestedAdjustments 
  } = useCollisionDetection({
    buffer: config.avoidanceDistance,
    autoAdjust: false, // 我们手动处理调整
    animationDuration: config.animationDuration
  });

  const {
    requestPosition,
    releasePosition,
    getAvoidanceSuggestion,
    hasActivePopup,
    screenSize
  } = useSmartLayout();

  // 注册元素到碰撞检测系统
  useEffect(() => {
    if (elementRef.current) {
      registerElement(config.moduleId, elementRef.current, {
        priority: config.priority,
        canMove: config.canMove,
        preferredPosition: config.preferredPosition
      });

      return () => {
        unregisterElement(config.moduleId);
        releasePosition(config.moduleId);
      };
    }
  }, [config, registerElement, unregisterElement, releasePosition]);

  // 处理碰撞避让
  const handleAvoidance = useCallback(() => {
    const adjustment = suggestedAdjustments[config.moduleId];
    const avoidanceSuggestion = getAvoidanceSuggestion(config.moduleId);
    
    let needsAvoidance = false;
    let newPosition = { ...positionState };

    // 处理碰撞调整
    if (adjustment && config.canMove) {
      needsAvoidance = true;
      if (!positionState.originalPosition) {
        newPosition.originalPosition = { x: positionState.x, y: positionState.y };
      }
      
      // 应用建议的位置调整
      if (adjustment.newPosition.top !== undefined) {
        newPosition.y = adjustment.newPosition.top;
      }
      if (adjustment.newPosition.left !== undefined) {
        newPosition.x = adjustment.newPosition.left;
      }
    }

    // 处理弹窗避让
    if (avoidanceSuggestion && config.canMove) {
      needsAvoidance = true;
      if (!positionState.originalPosition) {
        newPosition.originalPosition = { x: positionState.x, y: positionState.y };
      }
      
      newPosition.x += avoidanceSuggestion.offset?.x || 0;
      newPosition.y += avoidanceSuggestion.offset?.y || 0;
    }

    // 恢复原始位置
    if (!adjustment && !avoidanceSuggestion && positionState.isAvoiding && positionState.originalPosition) {
      needsAvoidance = false;
      newPosition.x = positionState.originalPosition.x;
      newPosition.y = positionState.originalPosition.y;
      newPosition.originalPosition = null;
    }

    if (needsAvoidance !== positionState.isAvoiding || 
        newPosition.x !== positionState.x || 
        newPosition.y !== positionState.y) {
      
      setPositionState({
        ...newPosition,
        isAvoiding: needsAvoidance
      });
    }
  }, [
    config,
    positionState,
    suggestedAdjustments,
    getAvoidanceSuggestion
  ]);

  // 响应式位置调整
  const getResponsivePosition = useCallback(() => {
    const base = positionState;
    
    // 根据屏幕尺寸调整位置
    switch (screenSize) {
      case 'mobile':
        if (config.moduleId === 'clock-console') {
          return { ...base, y: base.y + 20 }; // 移动端时钟稍微下移
        }
        if (config.moduleId === 'radio-player') {
          return { ...base, y: base.y + 10 }; // 移动端电台稍微上移
        }
        break;
        
      case 'tablet':
        if (config.moduleId === 'status-indicator') {
          return { ...base, x: base.x - 20 }; // 平板端状态指示器左移
        }
        break;
        
      case 'ultrawide':
        if (config.moduleId === 'info-panel') {
          return { ...base, x: base.x + 100 }; // 超宽屏信息面板右移
        }
        break;
        
      default:
        break;
    }
    
    return base;
  }, [positionState, screenSize, config.moduleId]);

  // 监听碰撞和弹窗状态变化
  useEffect(() => {
    handleAvoidance();
  }, [handleAvoidance]);

  // 获取当前样式属性
  const getPositionStyles = useCallback(() => {
    const responsive = getResponsivePosition();
    
    const styles: React.CSSProperties = {
      transition: `all ${config.animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
      willChange: 'transform'
    };

    // 根据模块ID应用特定的定位逻辑
    switch (config.moduleId) {
      case 'clock-console':
        styles.top = `${responsive.y}px`;
        styles.left = '50%';
        styles.transform = `translateX(-50%) translateX(${responsive.x}px)`;
        break;
        
      case 'radio-player':
        styles.bottom = `${32 - responsive.y}px`; // 8 * 4 = 32px base
        styles.left = '50%';
        styles.transform = `translateX(-50%) translateX(${responsive.x}px)`;
        break;
        
      case 'info-panel':
        styles.bottom = `${80 - responsive.y}px`; // 20 * 4 = 80px base
        styles.left = '50%';
        styles.transform = `translateX(-50%) translateX(${responsive.x}px)`;
        break;
        
      case 'control-button':
        styles.bottom = `${32 - responsive.y}px`;
        styles.right = `${32 - responsive.x}px`;
        break;
        
      case 'status-indicator':
        styles.top = `${32 + responsive.y}px`;
        styles.right = `${32 - responsive.x}px`;
        break;
        
      default:
        styles.transform = `translate(${responsive.x}px, ${responsive.y}px)`;
        break;
    }

    return styles;
  }, [getResponsivePosition, config]);

  // 获取状态类名
  const getStatusClasses = useCallback(() => {
    const classes = ['smart-position'];
    
    if (positionState.isAvoiding) {
      classes.push('avoidance-animation', 'interaction-state-active');
    } else {
      classes.push('interaction-state-inactive');
    }
    
    if (hasCollision) {
      classes.push('collision-detected');
    }
    
    return classes.join(' ');
  }, [positionState.isAvoiding, hasCollision]);

  // 强制重置位置
  const resetPosition = useCallback(() => {
    const defaultPos = DEFAULT_POSITIONS[config.moduleId as keyof typeof DEFAULT_POSITIONS];
    if (defaultPos) {
      setPositionState({
        x: defaultPos.x,
        y: defaultPos.y,
        isAvoiding: false,
        originalPosition: null,
        currentZone: 'center'
      });
    }
  }, [config.moduleId]);

  return {
    // Ref for the element
    elementRef,
    
    // Position state
    positionState,
    isAvoiding: positionState.isAvoiding,
    hasCollision,
    
    // Styling
    positionStyles: getPositionStyles(),
    statusClasses: getStatusClasses(),
    
    // Controls
    resetPosition,
    
    // Responsive info
    screenSize
  };
};