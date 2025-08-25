/**
 * 简化的背景修复工具 - 轻量级版本
 * 移除复杂的监控和批处理逻辑，只保留基本修复功能
 */

/**
 * 强制清除元素的背景效果
 */
export function forceTransparency(element: HTMLElement): void {
  if (!element || !element.style) return;
  
  try {
    element.style.setProperty('background', 'transparent', 'important');
    element.style.setProperty('background-color', 'transparent', 'important');
    element.style.setProperty('backdrop-filter', 'none', 'important');
    element.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
  } catch (error) {
    console.warn('透明化失败:', error);
  }
}

/**
 * 简单的深度修复
 */
export async function deepTransparencyFix(): Promise<void> {
  try {
    const elements = document.querySelectorAll('.minimal-glass, .function-panel, [data-motion-component]');
    
    elements.forEach(element => {
      if (element instanceof HTMLElement) {
        forceTransparency(element);
      }
    });
    
    console.log('✅ 简单背景修复完成');
  } catch (error) {
    console.error('背景修复失败:', error);
  }
}

/**
 * 初始化简化版背景修复
 */
export function initializeBackgroundFixer(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  
  // 只执行一次初始修���
  setTimeout(() => {
    deepTransparencyFix();
  }, 100);
  
  return () => {
    // 空的清理函数
  };
}