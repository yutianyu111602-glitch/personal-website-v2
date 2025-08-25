/**
 * UnifiedPerformanceMonitor.ts - 统一性能监控模块
 * 
 * 整合功能：
 * - VisualizationPerformanceMonitor: 轻量FPS/内存监控
 * - GPUPerformanceMonitor: GPU性能监控
 * - 自适应质量调整
 * - 统一性能指标接口
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

// 监控级别
export type MonitorLevel = 'light' | 'standard' | 'detailed';

// 性能指标
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memory: {
    used: number;      // MB
    total: number;     // MB
    limit: number;     // MB
    percentage: number; // 使用百分比
  };
  gpu: {
    renderer: string;
    vendor: string;
    extensions: string[];
    contextLost: boolean;
  };
  loadTime: number;    // ms
  timestamp: number;
}

// 性能配置
export interface PerformanceConfig {
  targetFPS: number;
  adaptiveQuality: boolean;
  updateInterval: number;  // ms
  historyLength: number;   // 保存历史帧数
  thresholds: {
    fps: number;
    frameTime: number;
    memoryUsage: number;   // MB
  };
}

// 默认配置
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  targetFPS: 60,
  adaptiveQuality: true,
  updateInterval: 1000,
  historyLength: 60,
  thresholds: {
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 200
  }
};

// 性能监控钩子
export interface PerformanceHooks {
  onFPSChange?: (fps: number) => void;
  onMemoryWarning?: (usage: number, limit: number) => void;
  onQualityAdjust?: (level: 'low' | 'medium' | 'high') => void;
  onContextLost?: () => void;
  onContextRestored?: () => void;
}

export interface UnifiedPerformanceMonitorProps {
  level?: MonitorLevel;
  config?: Partial<PerformanceConfig>;
  hooks?: PerformanceHooks;
  compact?: boolean;
  showGPUInfo?: boolean;
}

export const UnifiedPerformanceMonitor: React.FC<UnifiedPerformanceMonitorProps> = ({
  level = 'standard',
  config = {},
  hooks = {},
  compact = true,
  showGPUInfo = true
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    memory: { used: 0, total: 0, limit: 0, percentage: 0 },
    gpu: { renderer: '', vendor: '', extensions: [], contextLost: false },
    loadTime: 0,
    timestamp: 0
  });
  
  const [qualityLevel, setQualityLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [isVisible, setIsVisible] = useState(true);
  
  const rafRef = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(performance.now());
  const frameCount = useRef<number>(0);
  const frameTimeHistory = useRef<number[]>([]);
  const performanceConfig = useRef<PerformanceConfig>({ ...DEFAULT_PERFORMANCE_CONFIG, ...config });
  
  // 初始化GPU信息
  const initGPUInfo = useCallback(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
    
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER) : 'Unknown';
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR) : 'Unknown';
      
      setMetrics(prev => ({
        ...prev,
        gpu: {
          ...prev.gpu,
          renderer: renderer.substring(0, 30) + '...',
          vendor: vendor.substring(0, 20) + '...',
          extensions: gl.getSupportedExtensions()?.slice(0, 5) || []
        }
      }));
      
      // 监听上下文丢失/恢复
      canvas.addEventListener('webglcontextlost', () => {
        setMetrics(prev => ({ ...prev, gpu: { ...prev.gpu, contextLost: true } }));
        hooks.onContextLost?.();
      });
      
      canvas.addEventListener('webglcontextrestored', () => {
        setMetrics(prev => ({ ...prev, gpu: { ...prev.gpu, contextLost: false } }));
        hooks.onContextRestored?.();
      });
    }
  }, [hooks]);
  
  // 更新性能指标
  const updateMetrics = useCallback(() => {
    const now = performance.now();
    const frameTime = now - lastFrameTime.current;
    
    frameCount.current++;
    frameTimeHistory.current.push(frameTime);
    
    // 保持历史记录长度
    if (frameTimeHistory.current.length > performanceConfig.current.historyLength) {
      frameTimeHistory.current.shift();
    }
    
    // 计算平均帧时间
    const avgFrameTime = frameTimeHistory.current.reduce((sum, time) => sum + time, 0) / frameTimeHistory.current.length;
    
    // 更新指标
    setMetrics(prev => ({
      ...prev,
      fps: frameCount.current,
      frameTime: avgFrameTime,
      timestamp: now
    }));
    
    lastFrameTime.current = now;
  }, []);
  
  // 更新内存信息
  const updateMemoryInfo = useCallback(() => {
    const perf: any = performance as any;
    if (perf && perf.memory) {
      const used = Math.round(perf.memory.usedJSHeapSize / (1024 * 1024));
      const total = Math.round(perf.memory.totalJSHeapSize / (1024 * 1024));
      const limit = Math.round(perf.memory.jsHeapSizeLimit / (1024 * 1024));
      const percentage = Math.round((used / limit) * 100);
      
      setMetrics(prev => ({
        ...prev,
        memory: { used, total, limit, percentage }
      }));
      
      // 内存警告
      if (used > performanceConfig.current.thresholds.memoryUsage) {
        hooks.onMemoryWarning?.(used, limit);
      }
    }
  }, [hooks]);
  
  // 自适应质量调整
  const adjustQuality = useCallback(() => {
    if (!performanceConfig.current.adaptiveQuality) return;
    
    const { fps, frameTime } = metrics;
    const { targetFPS } = performanceConfig.current;
    
    let newQuality: 'low' | 'medium' | 'high' = qualityLevel;
    
    if (fps < targetFPS * 0.7 || frameTime > performanceConfig.current.thresholds.frameTime * 1.5) {
      newQuality = 'low';
    } else if (fps > targetFPS * 0.9 && frameTime < performanceConfig.current.thresholds.frameTime * 0.8) {
      newQuality = 'high';
    } else {
      newQuality = 'medium';
    }
    
    if (newQuality !== qualityLevel) {
      setQualityLevel(newQuality);
      hooks.onQualityAdjust?.(newQuality);
    }
  }, [metrics, qualityLevel, hooks]);
  
  // 主循环
  useEffect(() => {
    const loop = () => {
      updateMetrics();
      
      if (frameCount.current % Math.ceil(performanceConfig.current.updateInterval / 16.67) === 0) {
        updateMemoryInfo();
        adjustQuality();
        frameCount.current = 0;
      }
      
      rafRef.current = requestAnimationFrame(loop);
    };
    
    rafRef.current = requestAnimationFrame(loop);
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [updateMetrics, updateMemoryInfo, adjustQuality]);
  
  // 初始化
  useEffect(() => {
    setMetrics(prev => ({ ...prev, loadTime: performance.now() }));
    initGPUInfo();
  }, [initGPUInfo]);
  
  // 清理
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
  
  // 渲染
  if (!isVisible) return null;
  
  const renderLightLevel = () => (
    <div style={{ fontSize: 10, color: 'rgba(220,220,220,0.85)' }}>
      <div>FPS: {metrics.fps}</div>
      <div>Mem: {metrics.memory.used}MB</div>
    </div>
  );
  
  const renderStandardLevel = () => (
    <div style={{ fontSize: 11, color: 'rgba(220,220,220,0.85)' }}>
      <div>FPS: {metrics.fps}</div>
      <div>Frame: {metrics.frameTime.toFixed(1)}ms</div>
      <div>Mem: {metrics.memory.used}MB ({metrics.memory.percentage}%)</div>
      <div>Quality: {qualityLevel}</div>
    </div>
  );
  
  const renderDetailedLevel = () => (
    <div style={{ fontSize: 12, color: 'rgba(220,220,220,0.85)' }}>
      <div>FPS: {metrics.fps}</div>
      <div>Frame: {metrics.frameTime.toFixed(1)}ms</div>
      <div>Memory: {metrics.memory.used}/{metrics.memory.total}MB ({metrics.memory.percentage}%)</div>
      <div>Quality: {qualityLevel}</div>
      <div>Load: {metrics.loadTime.toFixed(1)}ms</div>
      {showGPUInfo && (
        <>
          <div>GPU: {metrics.gpu.renderer}</div>
          <div>Vendor: {metrics.gpu.vendor}</div>
          <div>Context: {metrics.gpu.contextLost ? '❌ Lost' : '✅ OK'}</div>
        </>
      )}
    </div>
  );
  
  const renderContent = () => {
    switch (level) {
      case 'light':
        return renderLightLevel();
      case 'detailed':
        return renderDetailedLevel();
      default:
        return renderStandardLevel();
    }
  };
  
  return (
    <div style={{
      position: 'fixed',
      left: 8,
      bottom: 8,
      zIndex: 200,
      fontFamily: 'monospace',
      background: 'rgba(0,0,0,0.35)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 6,
      padding: compact ? '4px 6px' : '6px 8px',
      cursor: 'pointer',
      userSelect: 'none'
    }}
    onClick={() => setIsVisible(false)}
    title="点击隐藏性能监控器"
    >
      {renderContent()}
    </div>
  );
};

export default UnifiedPerformanceMonitor;
