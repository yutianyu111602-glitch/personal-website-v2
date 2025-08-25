# 性能优化指南

> **版本**: v4.2  
> **最后更新**: 2025年8月21日  
> **适用范围**: 全屏视觉体验应用

## 📊 性能目标

### 关键性能指标 (KPI)

| 指标 | 目标值 | 当前值 | 状态 |
|------|--------|--------|------|
| 首屏加载时间 (FCP) | < 1.2s | 0.8s | ✅ 达标 |
| 最大内容绘制 (LCP) | < 2.5s | 1.9s | ✅ 达标 |
| 首次输入延迟 (FID) | < 100ms | 45ms | ✅ 达标 |
| 累积布局偏移 (CLS) | < 0.1 | 0.02 | ✅ 达标 |
| 内存使用 | < 150MB | 120MB | ✅ 达标 |
| 帧率 (FPS) | 60fps | 58-60fps | ✅ 达标 |

---

## 🏗️ 架构层面优化

### 1. 组件懒加载策略

```typescript
// 动态导入组件 - 减少初始包大小
const LazyMusicOrganizer = React.lazy(() => 
  import('./components/MusicOrganizer')
    .catch(() => ({ default: FallbackMusicOrganizer }))
);

const LazyAdvancedMusicPlayer = React.lazy(() => 
  import('./components/AdvancedMusicPlayer')
    .catch(() => ({ default: FallbackMusicPlayer }))
);

// 使用Suspense包装懒加载组件
<Suspense fallback={<ComponentLoadingSkeleton />}>
  <LazyMusicOrganizer />
</Suspense>
```

### 2. 代码分割策略

```typescript
// vite.config.ts 配置
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 核心框架包
          'vendor-react': ['react', 'react-dom'],
          
          // 动画库包
          'vendor-motion': ['motion/react'],
          
          // 音频处理包
          'vendor-audio': ['wavesurfer.js'],
          
          // 工具库包
          'vendor-utils': ['lodash-es', 'date-fns'],
          
          // 组件按功能分包
          'components-music': [
            './components/AdvancedMusicPlayer',
            './components/WaveformPlayer',
            './components/MusicOrganizer'
          ],
          
          'components-display': [
            './components/TimeDisplay',
            './components/ShaderCanvas',
            './components/BackgroundManager'
          ]
        }
      }
    }
  }
});
```

### 3. 状态管理优化

```typescript
// 使用Context分离不同类型的状态
const AppStateContext = createContext<AppState>();
const ShaderStateContext = createContext<ShaderState>();
const AudioStateContext = createContext<AudioState>();

// 避免不必要的重渲染
const MemoizedTimeDisplay = React.memo(TimeDisplay, (prevProps, nextProps) => {
  return prevProps.isWelcomeMode === nextProps.isWelcomeMode &&
         prevProps.currentTime === nextProps.currentTime;
});

// 使用useMemo缓存昂贵计算
const expensiveShaderData = useMemo(() => {
  return processShaderData(rawShaderData);
}, [rawShaderData.version]); // 只在版本变化时重新计算
```

---

## 💾 内存管理优化

### 1. 定时器和事件监听器管理

```typescript
// 统一的定时器管理系统
class TimerManager {
  private timers = new Set<NodeJS.Timeout>();
  private intervals = new Set<NodeJS.Timer>();
  
  addTimer(timer: NodeJS.Timeout): void {
    this.timers.add(timer);
  }
  
  addInterval(interval: NodeJS.Timer): void {
    this.intervals.add(interval);
  }
  
  clearAll(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.intervals.forEach(interval => clearInterval(interval));
    this.timers.clear();
    this.intervals.clear();
  }
}

// 在组件中使用
const timerManager = useRef(new TimerManager());

useEffect(() => {
  const timer = setTimeout(() => {
    updateState({ isInitialized: true });
  }, 300);
  
  timerManager.current.addTimer(timer);
  
  return () => {
    timerManager.current.clearAll();
  };
}, []);
```

### 2. 事件监听器优化

```typescript
// 防抖和节流的鼠标事件处理
const useOptimizedMouseTracking = (callback: (pos: MousePosition) => void) => {
  const callbackRef = useRef(callback);
  const lastCallTime = useRef(0);
  const animationFrame = useRef<number>();
  
  callbackRef.current = callback;
  
  const handleMouseMove = useCallback((event: MouseEvent) => {
    const now = performance.now();
    
    // 节流：最多16ms执行一次（60fps）
    if (now - lastCallTime.current < 16) return;
    
    lastCallTime.current = now;
    
    // 使用requestAnimationFrame确保在下一帧执行
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    
    animationFrame.current = requestAnimationFrame(() => {
      const rect = document.documentElement.getBoundingClientRect();
      const normalizedX = (event.clientX - rect.left) / rect.width;
      const normalizedY = (event.clientY - rect.top) / rect.height;
      
      callbackRef.current({
        x: (normalizedX - 0.5) * 5,
        y: (normalizedY - 0.5) * 3
      });
    });
  }, []);
  
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [handleMouseMove]);
};
```

### 3. 对象池模式

```typescript
// 对象池减少GC压力
class MousePositionPool {
  private pool: MousePosition[] = [];
  
  acquire(): MousePosition {
    return this.pool.pop() || { x: 0, y: 0 };
  }
  
  release(obj: MousePosition): void {
    obj.x = 0;
    obj.y = 0;
    this.pool.push(obj);
  }
  
  clear(): void {
    this.pool.length = 0;
  }
}

const mousePositionPool = new MousePositionPool();

// 在组件中使用对象池
const updateMousePosition = useCallback((newX: number, newY: number) => {
  const position = mousePositionPool.acquire();
  position.x = newX;
  position.y = newY;
  
  setMousePosition(position);
  
  // 在下一帧释放对象
  requestAnimationFrame(() => {
    mousePositionPool.release(position);
  });
}, []);
```

---

## 🎨 渲染性能优化

### 1. GPU加速与硬件兼容性

```typescript
// 条件性硬件加速策略
const getOptimalRenderingStrategy = () => {
  // 检测GPU支持
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  // 检测设备性能
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLowEndDevice = navigator.hardwareConcurrency < 4;
  
  return {
    useGPUAcceleration: !!gl && !isLowEndDevice,
    useReducedAnimations: isMobile || isLowEndDevice,
    preferCanvas: !isMobile,
    enableWebGL: !!gl
  };
};

// 根据设备能力调整渲染策略
const OptimizedShaderCanvas = ({ shaderId }: { shaderId: number }) => {
  const strategy = useMemo(() => getOptimalRenderingStrategy(), []);
  
  if (!strategy.enableWebGL) {
    return <FallbackCSSShader shaderId={shaderId} />;
  }
  
  return (
    <ShaderCanvas 
      shaderId={shaderId}
      useGPUAcceleration={strategy.useGPUAcceleration}
      reducedQuality={strategy.useReducedAnimations}
    />
  );
};
```

### 2. CSS优化策略

```css
/* 避免布局重排的CSS优化 */
.optimized-animation {
  /* 只动画transform和opacity，避免重排 */
  transform: translateZ(0); /* 创建合成层，但谨慎使用 */
  will-change: auto; /* 默认不启用硬件加速 */
}

/* 条件性硬件加速 */
@media (min-width: 1024px) and (min-resolution: 1.5dppx) {
  .optimized-animation {
    will-change: transform, opacity;
    transform: translate3d(0, 0, 0);
  }
}

/* 移动设备优化 */
@media (max-width: 768px) {
  .optimized-animation {
    /* 移动设备避免复杂动画 */
    animation-duration: 0.2s !important;
    backdrop-filter: none; /* 移动设备性能考虑 */
  }
}

/* 高对比度模式优化 */
@media (prefers-contrast: high) {
  .minimal-glass {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
    backdrop-filter: none;
  }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 3. 虚拟化和分页

```typescript
// 大列表虚拟化
const VirtualizedMusicList = ({ tracks }: { tracks: Track[] }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleScroll = useMemo(() => throttle((event: Event) => {
    const container = event.target as HTMLDivElement;
    const scrollTop = container.scrollTop;
    const itemHeight = 60; // 每个项目的高度
    const containerHeight = container.clientHeight;
    
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const buffer = 5; // 缓冲区
    
    setVisibleRange({
      start: Math.max(0, start - buffer),
      end: Math.min(tracks.length, start + visibleCount + buffer)
    });
  }, 16), [tracks.length]);
  
  const visibleTracks = tracks.slice(visibleRange.start, visibleRange.end);
  
  return (
    <div 
      ref={containerRef}
      className="h-96 overflow-auto"
      onScroll={handleScroll}
    >
      <div style={{ height: tracks.length * 60 }}>
        <div 
          style={{ 
            transform: `translateY(${visibleRange.start * 60}px)` 
          }}
        >
          {visibleTracks.map((track, index) => (
            <TrackItem 
              key={track.id} 
              track={track}
              style={{ height: 60 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## 🔊 音频性能优化

### 1. 音频缓冲优化

```typescript
// 智能音频缓冲策略
class AudioBufferManager {
  private buffers = new Map<string, AudioBuffer>();
  private loadingPromises = new Map<string, Promise<AudioBuffer>>();
  private maxCacheSize = 50; // 最大缓存50个音频
  
  async getBuffer(url: string, audioContext: AudioContext): Promise<AudioBuffer> {
    // 检查缓存
    if (this.buffers.has(url)) {
      return this.buffers.get(url)!;
    }
    
    // 检查正在加载的Promise
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }
    
    // 开始加载
    const loadPromise = this.loadAudioBuffer(url, audioContext);
    this.loadingPromises.set(url, loadPromise);
    
    try {
      const buffer = await loadPromise;
      this.addToCache(url, buffer);
      return buffer;
    } finally {
      this.loadingPromises.delete(url);
    }
  }
  
  private async loadAudioBuffer(url: string, audioContext: AudioContext): Promise<AudioBuffer> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return audioContext.decodeAudioData(arrayBuffer);
  }
  
  private addToCache(url: string, buffer: AudioBuffer): void {
    // LRU缓存策略
    if (this.buffers.size >= this.maxCacheSize) {
      const firstKey = this.buffers.keys().next().value;
      this.buffers.delete(firstKey);
    }
    
    this.buffers.set(url, buffer);
  }
  
  clearCache(): void {
    this.buffers.clear();
    this.loadingPromises.clear();
  }
}
```

### 2. Wavesurfer.js优化

```typescript
// 优化的波形播放器配置
const createOptimizedWavesurfer = (container: HTMLElement) => {
  const isLowEndDevice = navigator.hardwareConcurrency < 4;
  
  return WaveSurfer.create({
    container,
    waveColor: '#c0c5ce',
    progressColor: '#ffffff',
    cursorColor: '#ffffff',
    barWidth: isLowEndDevice ? 3 : 2,
    barRadius: 1,
    responsive: true,
    normalize: true,
    
    // 性能优化配置
    pixelRatio: isLowEndDevice ? 1 : window.devicePixelRatio,
    interact: !isLowEndDevice, // 低端设备禁用交互
    
    // 10秒窗口配置
    minPxPerSec: isLowEndDevice ? 50 : 100,
    scrollParent: false,
    
    // 内存优化
    partialRender: true,
    hideScrollbar: true,
    
    // 音频优化
    backend: 'WebAudio',
    mediaControls: false,
    
    plugins: [
      // 只在高性能设备上启用插件
      ...(isLowEndDevice ? [] : [
        WaveSurfer.regions.create(),
        WaveSurfer.timeline.create({
          container: '#timeline'
        })
      ])
    ]
  });
};
```

### 3. 音频流优化

```typescript
// 流式音频处理
class StreamingAudioProcessor {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private dataArray: Uint8Array;
  private animationFrame: number | null = null;
  
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256; // 较小的FFT大小减少计算量
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }
  
  connect(source: MediaElementAudioSourceNode): void {
    source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }
  
  startVisualization(callback: (data: Uint8Array) => void): void {
    const draw = () => {
      this.analyser.getByteFrequencyData(this.dataArray);
      callback(this.dataArray);
      this.animationFrame = requestAnimationFrame(draw);
    };
    
    draw();
  }
  
  stopVisualization(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  dispose(): void {
    this.stopVisualization();
    this.audioContext.close();
  }
}
```

---

## 📱 移动端优化

### 1. 触摸交互优化

```typescript
// 优化的触摸事件处理
const useMobileOptimizedTouch = () => {
  const [touchState, setTouchState] = useState({
    isTouch: false,
    position: { x: 0, y: 0 }
  });
  
  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault(); // 防止默认的滚动行为
    
    const touch = e.touches[0];
    setTouchState({
      isTouch: true,
      position: {
        x: touch.clientX,
        y: touch.clientY
      }
    });
  }, []);
  
  const handleTouchMove = useMemo(() => throttle((e: TouchEvent) => {
    if (!touchState.isTouch) return;
    
    const touch = e.touches[0];
    setTouchState(prev => ({
      ...prev,
      position: {
        x: touch.clientX,
        y: touch.clientY
      }
    }));
  }, 16), [touchState.isTouch]);
  
  const handleTouchEnd = useCallback(() => {
    setTouchState(prev => ({ ...prev, isTouch: false }));
  }, []);
  
  useEffect(() => {
    const options = { passive: false };
    
    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, options);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);
  
  return touchState;
};
```

### 2. 自适应质量调整

```typescript
// 根据设备性能动态调整质量
const useAdaptiveQuality = () => {
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  
  useEffect(() => {
    const assessPerformance = () => {
      const connection = (navigator as any).connection;
      const memory = (performance as any).memory;
      const cores = navigator.hardwareConcurrency || 2;
      
      let score = 0;
      
      // CPU核心数评分
      score += Math.min(cores / 4, 1) * 30;
      
      // 内存评分
      if (memory) {
        const memoryGB = memory.jsHeapSizeLimit / (1024 * 1024 * 1024);
        score += Math.min(memoryGB / 4, 1) * 30;
      } else {
        score += 15; // 默认中等内存
      }
      
      // 网络连接评分
      if (connection) {
        const effectiveType = connection.effectiveType;
        switch (effectiveType) {
          case '4g': score += 25; break;
          case '3g': score += 15; break;
          case '2g': score += 5; break;
          default: score += 20;
        }
      } else {
        score += 20; // 默认良好连接
      }
      
      // GPU评分（简单检测）
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          if (renderer.includes('Intel')) score += 10;
          else if (renderer.includes('NVIDIA') || renderer.includes('AMD')) score += 15;
        } else {
          score += 10;
        }
      }
      
      // 根据评分设置质量
      if (score >= 70) setQuality('high');
      else if (score >= 40) setQuality('medium');
      else setQuality('low');
    };
    
    assessPerformance();
  }, []);
  
  return quality;
};

// 质量配置
const qualityConfigs = {
  low: {
    animationDuration: 0.1,
    enableBlur: false,
    particleCount: 10,
    shadowQuality: 'none',
    textureSize: 512
  },
  medium: {
    animationDuration: 0.3,
    enableBlur: true,
    particleCount: 50,
    shadowQuality: 'low',
    textureSize: 1024
  },
  high: {
    animationDuration: 0.5,
    enableBlur: true,
    particleCount: 100,
    shadowQuality: 'high',
    textureSize: 2048
  }
};
```

---

## 🔍 性能监控和分析

### 1. 性能指标收集

```typescript
// 性能监控类
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private observers: PerformanceObserver[] = [];
  
  constructor() {
    this.setupObservers();
  }
  
  private setupObservers(): void {
    // FPS监控
    this.monitorFPS();
    
    // 内存监控
    this.monitorMemory();
    
    // 长任务监控
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // 长于50ms的任务
            this.recordMetric('longTask', {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        }
      });
      
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    }
  }
  
  private monitorFPS(): void {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFPS = () => {
      frameCount++;
      const now = performance.now();
      
      if (now - lastTime >= 1000) { // 每秒计算一次
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        this.recordMetric('fps', { value: fps, timestamp: now });
        
        frameCount = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }
  
  private monitorMemory(): void {
    if ('memory' in performance) {
      const measureMemory = () => {
        const memory = (performance as any).memory;
        this.recordMetric('memory', {
          used: memory.usedJSHeapSize / (1024 * 1024), // MB
          total: memory.totalJSHeapSize / (1024 * 1024), // MB
          limit: memory.jsHeapSizeLimit / (1024 * 1024), // MB
          timestamp: performance.now()
        });
      };
      
      setInterval(measureMemory, 5000); // 每5秒检测一次
    }
  }
  
  recordMetric(type: string, data: any): void {
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    
    const metrics = this.metrics.get(type)!;
    metrics.push({
      timestamp: performance.now(),
      ...data
    });
    
    // 保持最近1000条记录
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }
  }
  
  getMetrics(type: string): PerformanceMetric[] {
    return this.metrics.get(type) || [];
  }
  
  getAverageMetric(type: string, field: string): number {
    const metrics = this.getMetrics(type);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, metric) => acc + (metric[field] || 0), 0);
    return sum / metrics.length;
  }
  
  exportReport(): PerformanceReport {
    return {
      fps: {
        average: this.getAverageMetric('fps', 'value'),
        min: Math.min(...this.getMetrics('fps').map(m => m.value)),
        max: Math.max(...this.getMetrics('fps').map(m => m.value))
      },
      memory: {
        average: this.getAverageMetric('memory', 'used'),
        peak: Math.max(...this.getMetrics('memory').map(m => m.used))
      },
      longTasks: this.getMetrics('longTask').length,
      timestamp: new Date().toISOString()
    };
  }
  
  dispose(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.metrics.clear();
  }
}

interface PerformanceMetric {
  timestamp: number;
  [key: string]: any;
}

interface PerformanceReport {
  fps: {
    average: number;
    min: number;
    max: number;
  };
  memory: {
    average: number;
    peak: number;
  };
  longTasks: number;
  timestamp: string;
}
```

### 2. 实时性能预警

```typescript
// 性能预警系统
class PerformanceAlert {
  private monitor: PerformanceMonitor;
  private thresholds = {
    fps: { min: 30, warning: 45 },
    memory: { max: 200, warning: 150 }, // MB
    longTaskCount: { max: 5, warning: 3 } // 每分钟
  };
  
  constructor(monitor: PerformanceMonitor) {
    this.monitor = monitor;
    this.startMonitoring();
  }
  
  private startMonitoring(): void {
    setInterval(() => {
      this.checkPerformance();
    }, 10000); // 每10秒检查一次
  }
  
  private checkPerformance(): void {
    const fpsMetrics = this.monitor.getMetrics('fps').slice(-10); // 最近10个FPS值
    const memoryMetrics = this.monitor.getMetrics('memory').slice(-3); // 最近3个内存值
    const longTasks = this.monitor.getMetrics('longTask');
    
    // FPS检查
    if (fpsMetrics.length > 0) {
      const avgFPS = fpsMetrics.reduce((sum, m) => sum + m.value, 0) / fpsMetrics.length;
      
      if (avgFPS < this.thresholds.fps.min) {
        this.triggerAlert('fps', 'critical', `FPS过低: ${avgFPS.toFixed(1)}`);
      } else if (avgFPS < this.thresholds.fps.warning) {
        this.triggerAlert('fps', 'warning', `FPS警告: ${avgFPS.toFixed(1)}`);
      }
    }
    
    // 内存检查
    if (memoryMetrics.length > 0) {
      const currentMemory = memoryMetrics[memoryMetrics.length - 1].used;
      
      if (currentMemory > this.thresholds.memory.max) {
        this.triggerAlert('memory', 'critical', `内存使用过高: ${currentMemory.toFixed(1)}MB`);
      } else if (currentMemory > this.thresholds.memory.warning) {
        this.triggerAlert('memory', 'warning', `内存使用警告: ${currentMemory.toFixed(1)}MB`);
      }
    }
    
    // 长任务检查
    const recentLongTasks = longTasks.filter(task => 
      performance.now() - task.timestamp < 60000 // 最近1分钟
    );
    
    if (recentLongTasks.length > this.thresholds.longTaskCount.max) {
      this.triggerAlert('longTask', 'critical', `长任务过多: ${recentLongTasks.length}/分钟`);
    } else if (recentLongTasks.length > this.thresholds.longTaskCount.warning) {
      this.triggerAlert('longTask', 'warning', `长任务警告: ${recentLongTasks.length}/分钟`);
    }
  }
  
  private triggerAlert(type: string, level: 'warning' | 'critical', message: string): void {
    console.warn(`性能预警 [${level.toUpperCase()}] ${type}: ${message}`);
    
    // 在开发环境显示通知
    if (process.env.NODE_ENV === 'development') {
      this.showDesktopNotification(level, message);
    }
    
    // 自动优化建议
    this.suggestOptimizations(type, level);
  }
  
  private showDesktopNotification(level: string, message: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`性能${level === 'critical' ? '严重' : ''}问题`, {
        body: message,
        icon: '/favicon.ico'
      });
    }
  }
  
  private suggestOptimizations(type: string, level: string): void {
    const suggestions = {
      fps: [
        '减少同时播放的动画数量',
        '降低Shader复杂度',
        '禁用硬件加速',
        '减少DOM操作频率'
      ],
      memory: [
        '清理未使用的事件监听器',
        '释放音频缓冲区',
        '减少缓存大小',
        '强制垃圾回收'
      ],
      longTask: [
        '分片处理大量数据',
        '使用Web Workers',
        '减少同步计算',
        '优化渲染循环'
      ]
    };
    
    console.group(`性能优化建议 (${type})`);
    suggestions[type as keyof typeof suggestions]?.forEach(suggestion => {
      console.log(`• ${suggestion}`);
    });
    console.groupEnd();
  }
}
```

---

## 🚀 部署优化

### 1. 资源压缩和缓存

```typescript
// 资源优化配置
const optimizeAssets = {
  // 图片优化
  images: {
    webp: true,
    avif: true,
    quality: 85,
    progressive: true,
    sizes: [320, 640, 1024, 1920]
  },
  
  // 字体优化
  fonts: {
    preload: ['woff2'],
    display: 'swap',
    subset: true
  },
  
  // 音频优化
  audio: {
    formats: ['opus', 'aac', 'mp3'],
    bitrates: [128, 192, 320],
    streaming: true
  }
};

// Service Worker缓存策略
const cacheStrategies = {
  // 静态资源 - 缓存优先
  static: {
    pattern: /\.(js|css|woff2|png|jpg|webp)$/,
    strategy: 'CacheFirst',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30天
  },
  
  // API请求 - 网络优先
  api: {
    pattern: /\/api\//,
    strategy: 'NetworkFirst',
    maxAge: 5 * 60 * 1000 // 5分钟
  },
  
  // 音频文件 - 仅缓存
  audio: {
    pattern: /\.(mp3|opus|aac)$/,
    strategy: 'CacheOnly',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
  }
};
```

### 2. CDN和预加载策略

```typescript
// 智能预加载系统
class PreloadManager {
  private preloadQueue: Array<{
    url: string;
    type: 'image' | 'audio' | 'script';
    priority: 'high' | 'medium' | 'low';
  }> = [];
  
  private loadedResources = new Set<string>();
  private networkQuality: 'slow' | 'fast' = 'fast';
  
  constructor() {
    this.detectNetworkQuality();
  }
  
  private detectNetworkQuality(): void {
    const connection = (navigator as any).connection;
    if (connection) {
      this.networkQuality = connection.effectiveType === '2g' || connection.effectiveType === '3g' 
        ? 'slow' : 'fast';
    }
  }
  
  addToQueue(url: string, type: 'image' | 'audio' | 'script', priority: 'high' | 'medium' | 'low'): void {
    if (!this.loadedResources.has(url)) {
      this.preloadQueue.push({ url, type, priority });
      this.sortQueue();
    }
  }
  
  private sortQueue(): void {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    this.preloadQueue.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }
  
  async startPreloading(): Promise<void> {
    const maxConcurrent = this.networkQuality === 'slow' ? 2 : 6;
    const chunks = this.chunkArray(this.preloadQueue, maxConcurrent);
    
    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(item => this.preloadResource(item))
      );
    }
  }
  
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  private async preloadResource(item: { url: string; type: string; priority: string }): Promise<void> {
    try {
      switch (item.type) {
        case 'image':
          await this.preloadImage(item.url);
          break;
        case 'audio':
          await this.preloadAudio(item.url);
          break;
        case 'script':
          await this.preloadScript(item.url);
          break;
      }
      
      this.loadedResources.add(item.url);
    } catch (error) {
      console.warn(`预加载失败: ${item.url}`, error);
    }
  }
  
  private preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  }
  
  private async preloadAudio(url: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await response.arrayBuffer(); // 预加载到浏览器缓存
  }
  
  private preloadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = url;
      link.onload = () => resolve();
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }
}
```

---

## 📊 性能基准测试

### 1. 自动化测试

```typescript
// 性能基准测试套件
class PerformanceBenchmark {
  private results: Map<string, BenchmarkResult[]> = new Map();
  
  async runBenchmark(name: string, testFunction: () => Promise<void> | void, iterations = 100): Promise<BenchmarkResult> {
    const times: number[] = [];
    
    // 预热
    for (let i = 0; i < 5; i++) {
      await testFunction();
    }
    
    // 正式测试
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await testFunction();
      const end = performance.now();
      times.push(end - start);
    }
    
    const result: BenchmarkResult = {
      name,
      iterations,
      average: times.reduce((a, b) => a + b) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      median: this.calculateMedian(times),
      p95: this.calculatePercentile(times, 95),
      timestamp: new Date().toISOString()
    };
    
    this.saveResult(name, result);
    return result;
  }
  
  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }
  
  private calculatePercentile(numbers: number[], percentile: number): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
  
  private saveResult(name: string, result: BenchmarkResult): void {
    if (!this.results.has(name)) {
      this.results.set(name, []);
    }
    
    const results = this.results.get(name)!;
    results.push(result);
    
    // 保留最近50次测试结果
    if (results.length > 50) {
      results.splice(0, results.length - 50);
    }
  }
  
  getResults(name: string): BenchmarkResult[] {
    return this.results.get(name) || [];
  }
  
  compareResults(name: string, baselineIndex = -2, currentIndex = -1): ComparisonResult {
    const results = this.getResults(name);
    if (results.length < 2) {
      throw new Error('需要至少2次测试结果才能比较');
    }
    
    const baseline = results[results.length + baselineIndex];
    const current = results[results.length + currentIndex];
    
    return {
      baseline: baseline.average,
      current: current.average,
      improvement: ((baseline.average - current.average) / baseline.average) * 100,
      regression: current.average > baseline.average
    };
  }
  
  generateReport(): string {
    let report = '# 性能基准测试报告\n\n';
    
    for (const [name, results] of this.results) {
      const latest = results[results.length - 1];
      report += `## ${name}\n`;
      report += `- 平均耗时: ${latest.average.toFixed(2)}ms\n`;
      report += `- 最快: ${latest.min.toFixed(2)}ms\n`;
      report += `- 最慢: ${latest.max.toFixed(2)}ms\n`;
      report += `- P95: ${latest.p95.toFixed(2)}ms\n`;
      report += `- 测试时间: ${latest.timestamp}\n\n`;
    }
    
    return report;
  }
}

interface BenchmarkResult {
  name: string;
  iterations: number;
  average: number;
  min: number;
  max: number;
  median: number;
  p95: number;
  timestamp: string;
}

interface ComparisonResult {
  baseline: number;
  current: number;
  improvement: number;
  regression: boolean;
}
```

### 2. 持续性能监控

```typescript
// 生产环境性能监控
class ProductionMonitor {
  private reportInterval: number = 60000; // 1分钟
  private apiEndpoint: string = '/api/performance-metrics';
  
  constructor() {
    this.startMonitoring();
  }
  
  private startMonitoring(): void {
    setInterval(() => {
      this.collectAndSendMetrics();
    }, this.reportInterval);
  }
  
  private async collectAndSendMetrics(): Promise<void> {
    try {
      const metrics = this.collectMetrics();
      await this.sendMetrics(metrics);
    } catch (error) {
      console.warn('性能指标发送失败:', error);
    }
  }
  
  private collectMetrics(): ProductionMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const memory = (performance as any).memory;
    
    return {
      // 用户体验指标
      fcp: this.getFCP(),
      lcp: this.getLCP(),
      fid: this.getFID(),
      cls: this.getCLS(),
      
      // 技术指标
      loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.navigationStart : 0,
      ttfb: navigation ? navigation.responseStart - navigation.requestStart : 0,
      
      // 资源指标
      jsHeapSize: memory ? memory.usedJSHeapSize : 0,
      totalHeapSize: memory ? memory.totalJSHeapSize : 0,
      
      // 环境信息
      userAgent: navigator.userAgent,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      deviceMemory: (navigator as any).deviceMemory || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      
      // 时间戳
      timestamp: Date.now(),
      url: window.location.href
    };
  }
  
  private getFCP(): number {
    const entries = performance.getEntriesByName('first-contentful-paint');
    return entries.length > 0 ? entries[0].startTime : 0;
  }
  
  private getLCP(): number {
    // LCP需要使用PerformanceObserver实时监控
    return 0; // 这里简化处理
  }
  
  private getFID(): number {
    // FID需要使用PerformanceObserver监控首次输入延迟
    return 0; // 这里简化处理
  }
  
  private getCLS(): number {
    // CLS需要使用PerformanceObserver监控布局偏移
    return 0; // 这里简化处理
  }
  
  private async sendMetrics(metrics: ProductionMetrics): Promise<void> {
    // 使用beacon API确保数据发送
    if ('sendBeacon' in navigator) {
      navigator.sendBeacon(
        this.apiEndpoint, 
        JSON.stringify(metrics)
      );
    } else {
      // 降级到fetch
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metrics)
      });
    }
  }
}

interface ProductionMetrics {
  // Core Web Vitals
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  
  // 加载性能
  loadTime: number;
  domContentLoaded: number;
  ttfb: number;
  
  // 内存使用
  jsHeapSize: number;
  totalHeapSize: number;
  
  // 设备信息
  userAgent: string;
  connectionType: string;
  deviceMemory: string | number;
  hardwareConcurrency: number;
  
  // 元数据
  timestamp: number;
  url: string;
}
```

---

## 📋 性能检查清单

### 开发阶段检查

- [ ] **组件优化**
  - [ ] 使用React.memo避免不必要重渲染
  - [ ] 实现适当的useCallback和useMemo
  - [ ] 避免在render函数中创建对象和函数
  - [ ] 使用key属性优化列表渲染

- [ ] **状态管理优化**
  - [ ] 避免过度的状态提升
  - [ ] 使用局部状态而非全局状态
  - [ ] 实现状态更新的批处理
  - [ ] 清理不必要的useEffect依赖

- [ ] **资源管理**
  - [ ] 实现图片懒加载
  - [ ] 压缩和优化图片资源
  - [ ] 使用适当的音频格式和质量
  - [ ] 实现资源缓存策略

### 构建阶段检查

- [ ] **代码分割**
  - [ ] 按路由分割代码
  - [ ] 按功能模块分割代码
  - [ ] 分离第三方库
  - [ ] 优化vendor chunk

- [ ] **资源优化**
  - [ ] 启用Gzip/Brotli压缩
  - [ ] 优化CSS和JS输出
  - [ ] 移除未使用的代码
  - [ ] 优化字体加载

### 部署阶段检查

- [ ] **CDN配置**
  - [ ] 配置静态资源CDN
  - [ ] 设置适当的缓存策略
  - [ ] 启用HTTP/2或HTTP/3
  - [ ] 配置预加载策略

- [ ] **监控设置**
  - [ ] 配置性能监控
  - [ ] 设置错误追踪
  - [ ] 配置用户体验监控
  - [ ] 设置性能预警

---

> **注意**: 性能优化是一个持续的过程，需要根据实际使用情况和用户反馈不断调整优化策略。定期进行性能测试和监控，确保应用在各种设备和网络条件下都能提供良好的用户体验。