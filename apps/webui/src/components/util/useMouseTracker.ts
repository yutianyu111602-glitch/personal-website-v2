import { useEffect, useRef, useCallback } from 'react';

interface MousePosition {
  x: number;
  y: number;
  normalizedX: number;
  normalizedY: number;
  isActive: boolean;
}

interface UseMouseTrackerOptions {
  onMouseMove?: (position: MousePosition) => void;
  smoothing?: number;
  throttleMs?: number;
}

export const useMouseTracker = ({
  onMouseMove,
  smoothing = 0.1,
  throttleMs = 16 // ~60fps
}: UseMouseTrackerOptions = {}) => {
  const mouseRef = useRef<MousePosition>({
    x: 0,
    y: 0,
    normalizedX: 0,
    normalizedY: 0,
    isActive: false
  });
  
  const targetRef = useRef<MousePosition>({
    x: 0,
    y: 0,
    normalizedX: 0,
    normalizedY: 0,
    isActive: false
  });
  
  const lastUpdateRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();
  const isMouseInsideRef = useRef<boolean>(false);

  // 平滑插值函数
  const lerp = useCallback((start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
  }, []);

  // 更新鼠标位置
  const updateMousePosition = useCallback((clientX: number, clientY: number, isInside: boolean) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < throttleMs) return;
    
    lastUpdateRef.current = now;
    
    targetRef.current = {
      x: clientX,
      y: clientY,
      normalizedX: clientX / window.innerWidth,
      normalizedY: clientY / window.innerHeight,
      isActive: isInside
    };
    
    isMouseInsideRef.current = isInside;
  }, [throttleMs]);

  // 动画循环
  const animate = useCallback(() => {
    const current = mouseRef.current;
    const target = targetRef.current;
    
    // 平滑插值
    current.x = lerp(current.x, target.x, smoothing);
    current.y = lerp(current.y, target.y, smoothing);
    current.normalizedX = lerp(current.normalizedX, target.normalizedX, smoothing);
    current.normalizedY = lerp(current.normalizedY, target.normalizedY, smoothing);
    
    // 如果鼠标在窗口外，逐渐减少活跃状态
    if (!isMouseInsideRef.current) {
      current.isActive = false;
    } else {
      current.isActive = true;
    }
    
    // 回调更新
    if (onMouseMove) {
      onMouseMove({ ...current });
    }
    
    // 继续动画
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [smoothing, onMouseMove, lerp]);

  useEffect(() => {
    // 鼠标移动事件
    const handleMouseMove = (e: MouseEvent) => {
      updateMousePosition(e.clientX, e.clientY, true);
    };

    // 鼠标进入窗口
    const handleMouseEnter = (e: MouseEvent) => {
      updateMousePosition(e.clientX, e.clientY, true);
    };

    // 鼠标离开窗口
    const handleMouseLeave = () => {
      // 保持最后位置，但标记为非活跃
      isMouseInsideRef.current = false;
    };

    // 窗口焦点变化
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isMouseInsideRef.current = false;
      }
    };

    // 窗口大小变化时更新归一化坐标
    const handleResize = () => {
      const current = mouseRef.current;
      targetRef.current.normalizedX = current.x / window.innerWidth;
      targetRef.current.normalizedY = current.y / window.innerHeight;
    };

    // 添加事件监听器
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });

    // 开始动画循环
    animationFrameRef.current = requestAnimationFrame(animate);

    // 清理函数
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateMousePosition, animate]);

  return mouseRef.current;
};