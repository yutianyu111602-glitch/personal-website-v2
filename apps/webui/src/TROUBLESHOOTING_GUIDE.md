# 故障排除和维护指南

> **版本**: v4.2  
> **最后更新**: 2025年8月21日  
> **维护者**: 天宫科技 - 麻蛇

## 🚨 常见问题快速解决

### 1. 应用无法启动/白屏问题

**症状**: 页面显示白屏，控制台可能有JavaScript错误

**可能原因和解决方案**:

```typescript
// 检查1: 依赖版本冲突
npm ls --depth=0
npm audit

// 解决方案: 更新依赖或降级冲突包
npm update
npm install --legacy-peer-deps

// 检查2: 模块导入错误
// 常见错误: import路径错误
❌ import { Component } from "./Component"; // 缺少文件扩展名
✅ import { Component } from "./Component.tsx";

// 检查3: TypeScript编译错误
npx tsc --noEmit --skipLibCheck

// 检查4: Vite配置问题
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './components')
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'motion/react']
  }
});
```

**调试步骤**:
1. 打开浏览器开发者工具
2. 查看Console标签页的错误信息
3. 检查Network标签页是否有资源加载失败
4. 查看Sources标签页确认文件是否正确加载

### 2. 背景变暗/视觉效果异常

**症状**: 背景越来越暗，视觉效果不符合预期

**根本原因**: 多层半透明效果叠加

```css
/* 问题诊断 */
/* 检查以下CSS类是否有背景色累积 */
.minimal-glass,
.glass-morphism,
.function-panel,
.card {
  /* 确保背景是透明的 */
  background: transparent !important;
}

/* 解决方案1: 激进透明化 */
.minimal-glass {
  background: transparent; /* 完全透明 */
  backdrop-filter: blur(2px) saturate(101%); /* 极微弱模糊 */
  border: 1px solid rgba(192, 197, 206, 0.03);
  box-shadow: none; /* 移除所有阴影 */
}

/* 解决方案2: 禁用backdrop-filter兼容性fallback */
@supports not (backdrop-filter: blur(1px)) {
  .minimal-glass {
    background: transparent; /* 不使用任何fallback背景 */
  }
}
```

**检查工具**:
```javascript
// 浏览器控制台运行此代码检查背景累积
function checkBackgroundLayers() {
  const elements = document.querySelectorAll('.minimal-glass, .glass-morphism, .function-panel');
  elements.forEach((el, index) => {
    const styles = getComputedStyle(el);
    console.log(`Element ${index}:`, {
      background: styles.background,
      backdropFilter: styles.backdropFilter,
      opacity: styles.opacity
    });
  });
}
checkBackgroundLayers();
```

### 3. 音乐播放器问题

**症状**: 音频无法播放、波形不显示、Termusic连接失败

**解决方案**:

```typescript
// 问题1: 音频上下文被暂停
const resumeAudioContext = async () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContext();
  
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
      console.log('音频上下文已恢复');
    } catch (error) {
      console.error('无法恢复音频上下文:', error);
    }
  }
};

// 问题2: 权限被拒绝
const checkAudioPermissions = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    console.log('音频权限已获得');
    return true;
  } catch (error) {
    console.error('音频权限被拒绝:', error);
    return false;
  }
};

// 问题3: Wavesurfer.js初始化失败
const diagnoseWavesurfer = () => {
  console.log('Wavesurfer版本:', WaveSurfer.VERSION);
  console.log('WebAudio支持:', WaveSurfer.WebAudio.supportsWebAudio());
  console.log('MediaElement支持:', typeof Audio !== 'undefined');
};

// 问题4: Termusic后端连接检查
const checkTermusicConnection = async () => {
  try {
    const response = await fetch('http://localhost:8080/health', {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      console.log('Termusic后端连接正常');
      return true;
    } else {
      console.error('Termusic后端返回错误:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Termusic后端连接失败:', error);
    return false;
  }
};
```

### 4. 性能问题

**症状**: 卡顿、掉帧、内存占用过高

**诊断工具**:
```typescript
// 性能诊断脚本
const performanceDiagnostic = () => {
  // 内存使用检查
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    const memoryInfo = {
      used: Math.round(memory.usedJSHeapSize / 1048576),
      total: Math.round(memory.totalJSHeapSize / 1048576),
      limit: Math.round(memory.jsHeapSizeLimit / 1048576)
    };
    console.log('内存使用情况:', memoryInfo);
    
    if (memoryInfo.used > 150) {
      console.warn('⚠️ 内存使用过高，建议优化');
    }
  }
  
  // FPS检测
  let frameCount = 0;
  let lastTime = performance.now();
  
  const measureFPS = () => {
    frameCount++;
    const now = performance.now();
    
    if (now - lastTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (now - lastTime));
      console.log('当前FPS:', fps);
      
      if (fps < 30) {
        console.warn('⚠️ FPS过低，存在性能问题');
      }
      
      frameCount = 0;
      lastTime = now;
    }
    
    requestAnimationFrame(measureFPS);
  };
  
  measureFPS();
  
  // 长任务检测
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) {
          console.warn('⚠️ 检测到长任务:', {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['longtask'] });
  }
};

// 在控制台运行性能诊断
performanceDiagnostic();
```

**常见解决方案**:
```typescript
// 解决方案1: 禁用硬件加速
document.documentElement.style.transform = 'none';
document.documentElement.style.willChange = 'auto';

// 解决方案2: 清理定时器和监听器
const cleanupMemory = () => {
  // 清理全局定时器
  for (let i = 1; i < 99999; i++) {
    window.clearTimeout(i);
    window.clearInterval(i);
  }
  
  // 强制垃圾回收（仅Chrome DevTools）
  if (window.gc) {
    window.gc();
  }
  
  console.log('内存清理完成');
};

// 解决方案3: 降低动画质量
const reduceAnimationQuality = () => {
  const style = document.createElement('style');
  style.textContent = `
    * {
      animation-duration: 0.1s !important;
      transition-duration: 0.1s !important;
    }
    .glass-morphism,
    .minimal-glass {
      backdrop-filter: none !important;
    }
  `;
  document.head.appendChild(style);
  console.log('已降低动画质量');
};
```

### 5. 移动端兼容性问题

**症状**: 移动设备上功能异常、样式错乱

**解决方案**:

```typescript
// 移动端检测和适配
const mobileOptimizations = () => {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLowEndDevice = navigator.hardwareConcurrency < 4;
  
  if (isMobile) {
    // 禁用复杂动画
    document.documentElement.classList.add('mobile-device');
    
    // 添加移动端专用样式
    const mobileStyle = document.createElement('style');
    mobileStyle.textContent = `
      .mobile-device * {
        animation-duration: 0.2s !important;
        transition-duration: 0.2s !important;
      }
      .mobile-device .glass-morphism,
      .mobile-device .minimal-glass {
        backdrop-filter: none !important;
        background: rgba(192, 197, 206, 0.1) !important;
      }
    `;
    document.head.appendChild(mobileStyle);
  }
  
  if (isLowEndDevice) {
    // 低端设备优化
    document.documentElement.classList.add('low-end-device');
  }
};

// 触摸事件优化
const optimizeTouchEvents = () => {
  // 防止默认的触摸行为
  document.addEventListener('touchstart', (e) => {
    if (e.target.closest('.prevent-default')) {
      e.preventDefault();
    }
  }, { passive: false });
  
  // 防止双击缩放
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
};

mobileOptimizations();
optimizeTouchEvents();
```

---

## 🔧 开发工具和调试

### 1. 开发者工具集成

```typescript
// 开发者调试工具
class DevDebugger {
  private originalConsole = { ...console };
  
  enableVerboseLogging(): void {
    console.log = (...args) => {
      this.originalConsole.log(`[${new Date().toISOString()}]`, ...args);
    };
    
    console.warn = (...args) => {
      this.originalConsole.warn(`[${new Date().toISOString()}] ⚠️`, ...args);
    };
    
    console.error = (...args) => {
      this.originalConsole.error(`[${new Date().toISOString()}] ❌`, ...args);
    };
  }
  
  logComponentRenders(): void {
    // React DevTools Profiler集成
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = (id, root) => {
        console.log('组件重新渲染:', root);
      };
    }
  }
  
  monitorStateChanges(): void {
    // 监控状态变化
    const originalSetState = React.Component.prototype.setState;
    React.Component.prototype.setState = function(state, callback) {
      console.log('状态变化:', this.constructor.name, state);
      return originalSetState.call(this, state, callback);
    };
  }
  
  trackMemoryLeaks(): void {
    const objectCounts = new Map();
    
    const trackCreation = (constructor: any) => {
      const original = constructor;
      return function(...args: any[]) {
        const instance = new original(...args);
        const name = constructor.name;
        objectCounts.set(name, (objectCounts.get(name) || 0) + 1);
        console.log(`对象创建: ${name}, 总数: ${objectCounts.get(name)}`);
        return instance;
      };
    };
    
    // 追踪常见对象
    window.AudioContext = trackCreation(window.AudioContext);
    window.Image = trackCreation(window.Image);
  }
}

// 在开发环境启用调试工具
if (process.env.NODE_ENV === 'development') {
  const debugger = new DevDebugger();
  debugger.enableVerboseLogging();
  debugger.logComponentRenders();
  debugger.monitorStateChanges();
  debugger.trackMemoryLeaks();
}
```

### 2. 错误追踪和报告

```typescript
// 错误收集和报告系统
class ErrorTracker {
  private errors: ErrorReport[] = [];
  private maxErrors = 100;
  
  init(): void {
    // 捕获JavaScript错误
    window.addEventListener('error', (event) => {
      this.recordError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });
    
    // 捕获Promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        type: 'promise',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });
    
    // 捕获资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.recordError({
          type: 'resource',
          message: `资源加载失败: ${(event.target as any)?.src || (event.target as any)?.href}`,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        });
      }
    }, true);
  }
  
  recordError(error: ErrorReport): void {
    this.errors.push(error);
    
    // 保持错误列表大小
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
    
    // 在开发环境立即输出
    if (process.env.NODE_ENV === 'development') {
      console.error('错误记录:', error);
    }
    
    // 严重错误立即发送
    if (this.isCriticalError(error)) {
      this.sendErrorReport([error]);
    }
  }
  
  private isCriticalError(error: ErrorReport): boolean {
    const criticalPatterns = [
      /cannot read property/i,
      /undefined is not a function/i,
      /network error/i,
      /chunk load error/i
    ];
    
    return criticalPatterns.some(pattern => 
      pattern.test(error.message || '')
    );
  }
  
  async sendErrorReport(errors: ErrorReport[] = this.errors): Promise<void> {
    try {
      await fetch('/api/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          errors,
          sessionId: this.getSessionId(),
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.warn('错误报告发送失败:', error);
    }
  }
  
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('errorTrackerSessionId');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('errorTrackerSessionId', sessionId);
    }
    return sessionId;
  }
  
  getErrorSummary(): ErrorSummary {
    const typeCount = this.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalErrors: this.errors.length,
      typeBreakdown: typeCount,
      recentErrors: this.errors.slice(-10),
      criticalErrors: this.errors.filter(this.isCriticalError)
    };
  }
}

interface ErrorReport {
  type: 'javascript' | 'promise' | 'resource' | 'custom';
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  timestamp: number;
  userAgent: string;
  url: string;
}

interface ErrorSummary {
  totalErrors: number;
  typeBreakdown: Record<string, number>;
  recentErrors: ErrorReport[];
  criticalErrors: ErrorReport[];
}

// 初始化错误追踪
const errorTracker = new ErrorTracker();
errorTracker.init();

// 定期发送错误报告
setInterval(() => {
  errorTracker.sendErrorReport();
}, 5 * 60 * 1000); // 每5分钟发送一次
```

---

## 🛠️ 维护和更新

### 1. 依赖更新策略

```bash
# 检查过时的依赖
npm outdated

# 安全漏洞检查
npm audit

# 自动修复安全问题
npm audit fix

# 更新依赖的安全策略
# 1. 先更新补丁版本
npm update --save

# 2. 手动更新次要版本
npm install package@^1.2.0

# 3. 谨慎更新主要版本
npm install package@2.0.0

# 4. 测试每次更新
npm test
npm run build
```

### 2. 性能监控脚本

```typescript
// 自动化性能监控
class MaintenanceMonitor {
  private checkInterval = 24 * 60 * 60 * 1000; // 24小时
  
  startMonitoring(): void {
    setInterval(() => {
      this.runMaintenance();
    }, this.checkInterval);
  }
  
  async runMaintenance(): Promise<void> {
    try {
      await this.checkSystemHealth();
      await this.cleanupResources();
      await this.updatePerformanceBaseline();
      await this.validateCriticalPaths();
    } catch (error) {
      console.error('维护任务失败:', error);
    }
  }
  
  private async checkSystemHealth(): Promise<void> {
    const healthChecks = [
      this.checkMemoryUsage(),
      this.checkStorageQuota(),
      this.checkNetworkConnectivity(),
      this.checkAudioSystem()
    ];
    
    const results = await Promise.allSettled(healthChecks);
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn(`健康检查 ${index} 失败:`, result.reason);
      }
    });
  }
  
  private async checkMemoryUsage(): Promise<void> {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      
      if (usedMB > 200) {
        throw new Error(`内存使用过高: ${usedMB.toFixed(1)}MB`);
      }
    }
  }
  
  private async checkStorageQuota(): Promise<void> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usedMB = (estimate.usage || 0) / (1024 * 1024);
      const quotaMB = (estimate.quota || 0) / (1024 * 1024);
      
      if (usedMB > quotaMB * 0.8) {
        throw new Error(`存储空间不足: ${usedMB.toFixed(1)}MB / ${quotaMB.toFixed(1)}MB`);
      }
    }
  }
  
  private async checkNetworkConnectivity(): Promise<void> {
    try {
      const response = await fetch('/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error(`网络检查失败: ${response.status}`);
      }
    } catch (error) {
      throw new Error('网络连接异常');
    }
  }
  
  private async checkAudioSystem(): Promise<void> {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      await audioContext.close();
    } catch (error) {
      throw new Error('音频系统异常');
    }
  }
  
  private async cleanupResources(): Promise<void> {
    // 清理过期的缓存
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.includes('v1') || name.includes('v2') // 假设当前版本是v3
      );
      
      await Promise.all(
        oldCaches.map(name => caches.delete(name))
      );
    }
    
    // 清理localStorage中的过期数据
    const expiredKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('temp_') && 
          Date.now() - parseInt(key.split('_')[1]) > 7 * 24 * 60 * 60 * 1000) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => localStorage.removeItem(key));
  }
  
  private async updatePerformanceBaseline(): Promise<void> {
    // 运行性能基准测试
    const benchmark = new PerformanceBenchmark();
    
    const results = await Promise.all([
      benchmark.runBenchmark('component-render', () => {
        // 模拟组件渲染
        const div = document.createElement('div');
        div.innerHTML = '<div class="minimal-glass">Test</div>';
        document.body.appendChild(div);
        document.body.removeChild(div);
      }),
      
      benchmark.runBenchmark('shader-switch', () => {
        // 模拟Shader切换
        const event = new CustomEvent('shaderChange', { 
          detail: { shaderId: Math.floor(Math.random() * 5) }
        });
        document.dispatchEvent(event);
      })
    ]);
    
    // 保存基准数据
    const baselineData = {
      timestamp: Date.now(),
      results: results.map(r => ({
        name: r.name,
        average: r.average,
        p95: r.p95
      }))
    };
    
    localStorage.setItem('performanceBaseline', JSON.stringify(baselineData));
  }
  
  private async validateCriticalPaths(): Promise<void> {
    const criticalPaths = [
      // 检查欢迎页面到控制台的切换
      () => {
        const event = new CustomEvent('welcomeClick');
        document.dispatchEvent(event);
      },
      
      // 检查音乐播放器初始化
      () => {
        const event = new CustomEvent('initMusicPlayer');
        document.dispatchEvent(event);
      },
      
      // 检查背景切换
      () => {
        const event = new CustomEvent('backgroundSwitch');
        document.dispatchEvent(event);
      }
    ];
    
    for (const test of criticalPaths) {
      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('测试超时')), 5000);
          test();
          setTimeout(() => {
            clearTimeout(timeout);
            resolve(void 0);
          }, 1000);
        });
      } catch (error) {
        console.error('关键路径验证失败:', error);
      }
    }
  }
}

// 启动维护监控
const maintenanceMonitor = new MaintenanceMonitor();
maintenanceMonitor.startMonitoring();
```

### 3. 自动化测试脚本

```typescript
// 自动化端到端测试
class E2ETestSuite {
  private testResults: TestResult[] = [];
  
  async runAllTests(): Promise<TestSummary> {
    const tests = [
      this.testApplicationLoad,
      this.testWelcomeToConsoleTransition,
      this.testMusicPlayerFunctionality,
      this.testShaderSwitching,
      this.testMobileCompatibility,
      this.testPerformanceRequirements
    ];
    
    for (const test of tests) {
      try {
        const result = await test.call(this);
        this.testResults.push(result);
      } catch (error) {
        this.testResults.push({
          name: test.name,
          passed: false,
          error: error.message,
          duration: 0,
          timestamp: Date.now()
        });
      }
    }
    
    return this.generateSummary();
  }
  
  private async testApplicationLoad(): Promise<TestResult> {
    const startTime = Date.now();
    
    // 检查关键元素是否加载
    await this.waitForElement('[data-testid="welcome-screen"]', 5000);
    await this.waitForElement('[data-testid="time-display"]', 5000);
    
    // 检查CSS是否加载
    const computedStyle = getComputedStyle(document.body);
    if (computedStyle.backgroundColor !== 'rgb(0, 0, 0)') {
      throw new Error('CSS未正确加载');
    }
    
    // 检查JavaScript是否执行
    if (!window.React) {
      throw new Error('React未加载');
    }
    
    return {
      name: 'Application Load',
      passed: true,
      duration: Date.now() - startTime,
      timestamp: Date.now()
    };
  }
  
  private async testWelcomeToConsoleTransition(): Promise<TestResult> {
    const startTime = Date.now();
    
    // 点击欢迎屏幕
    const welcomeScreen = document.querySelector('[data-testid="welcome-screen"]') as HTMLElement;
    if (!welcomeScreen) {
      throw new Error('欢迎屏幕未找到');
    }
    
    welcomeScreen.click();
    
    // 等待过渡完成
    await this.sleep(1000);
    
    // 检查控制台元素是否出现
    await this.waitForElement('[data-testid="control-panel"]', 3000);
    
    return {
      name: 'Welcome to Console Transition',
      passed: true,
      duration: Date.now() - startTime,
      timestamp: Date.now()
    };
  }
  
  private async testMusicPlayerFunctionality(): Promise<TestResult> {
    const startTime = Date.now();
    
    // 等待音乐播放器加载
    await this.waitForElement('[data-testid="music-player"]', 5000);
    
    // 测试播放按钮
    const playButton = document.querySelector('[data-testid="play-button"]') as HTMLElement;
    if (!playButton) {
      throw new Error('播放按钮未找到');
    }
    
    playButton.click();
    await this.sleep(500);
    
    // 检查播放状态
    const isPlaying = playButton.getAttribute('aria-label')?.includes('暂停');
    if (!isPlaying) {
      throw new Error('播放功能异常');
    }
    
    // 测试音量控制
    const volumeSlider = document.querySelector('[data-testid="volume-slider"]') as HTMLInputElement;
    if (volumeSlider) {
      volumeSlider.value = '50';
      volumeSlider.dispatchEvent(new Event('input'));
    }
    
    return {
      name: 'Music Player Functionality',
      passed: true,
      duration: Date.now() - startTime,
      timestamp: Date.now()
    };
  }
  
  private async testShaderSwitching(): Promise<TestResult> {
    const startTime = Date.now();
    
    // 模拟Shader切换
    const event = new CustomEvent('shaderChange', { 
      detail: { shaderId: 2 }
    });
    document.dispatchEvent(event);
    
    await this.sleep(1000);
    
    // 检查背景是否变化
    const backgroundElement = document.querySelector('[data-testid="background-canvas"]');
    if (!backgroundElement) {
      throw new Error('背景元素未找到');
    }
    
    return {
      name: 'Shader Switching',
      passed: true,
      duration: Date.now() - startTime,
      timestamp: Date.now()
    };
  }
  
  private async testMobileCompatibility(): Promise<TestResult> {
    const startTime = Date.now();
    
    // 模拟移动设备viewport
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      throw new Error('移动端viewport未设置');
    }
    
    // 检查触摸事件支持
    if (!('ontouchstart' in window)) {
      console.warn('触摸事件不受支持（可能在桌面环境）');
    }
    
    // 检查响应式布局
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375 // iPhone宽度
    });
    
    window.dispatchEvent(new Event('resize'));
    await this.sleep(500);
    
    // 恢复原始宽度
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalWidth
    });
    
    return {
      name: 'Mobile Compatibility',
      passed: true,
      duration: Date.now() - startTime,
      timestamp: Date.now()
    };
  }
  
  private async testPerformanceRequirements(): Promise<TestResult> {
    const startTime = Date.now();
    
    // 内存检查
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      
      if (usedMB > 150) {
        throw new Error(`内存使用超标: ${usedMB.toFixed(1)}MB`);
      }
    }
    
    // FPS检查
    const fps = await this.measureFPS(2000); // 测量2秒
    if (fps < 30) {
      throw new Error(`FPS过低: ${fps}`);
    }
    
    // 加载时间检查
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      if (loadTime > 2000) {
        throw new Error(`加载时间过长: ${loadTime}ms`);
      }
    }
    
    return {
      name: 'Performance Requirements',
      passed: true,
      duration: Date.now() - startTime,
      timestamp: Date.now()
    };
  }
  
  private async waitForElement(selector: string, timeout = 5000): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`元素未找到: ${selector}`));
      }, timeout);
    });
  }
  
  private async measureFPS(duration = 1000): Promise<number> {
    return new Promise((resolve) => {
      let frameCount = 0;
      const startTime = performance.now();
      
      const countFrame = () => {
        frameCount++;
        const elapsed = performance.now() - startTime;
        
        if (elapsed < duration) {
          requestAnimationFrame(countFrame);
        } else {
          const fps = Math.round((frameCount * 1000) / elapsed);
          resolve(fps);
        }
      };
      
      requestAnimationFrame(countFrame);
    });
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private generateSummary(): TestSummary {
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.length - passed;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    
    return {
      totalTests: this.testResults.length,
      passed,
      failed,
      passRate: (passed / this.testResults.length) * 100,
      totalDuration,
      results: this.testResults,
      timestamp: Date.now()
    };
  }
}

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
  timestamp: number;
}

interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  totalDuration: number;
  results: TestResult[];
  timestamp: number;
}

// 自动化测试调度
const scheduleTests = () => {
  const testSuite = new E2ETestSuite();
  
  // 每日自动测试
  setInterval(async () => {
    try {
      const summary = await testSuite.runAllTests();
      console.log('自动化测试完成:', summary);
      
      // 发送测试报告
      await fetch('/api/test-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summary)
      });
    } catch (error) {
      console.error('自动化测试失败:', error);
    }
  }, 24 * 60 * 60 * 1000); // 每24小时
};

if (process.env.NODE_ENV === 'development') {
  scheduleTests();
}
```

---

## 📋 维护检查清单

### 日常检查 (每日)

- [ ] **应用状态检查**
  - [ ] 应用能否正常启动
  - [ ] 欢迎页面是否正常显示
  - [ ] 背景切换是否正常工作
  - [ ] 音乐播放器是否可用

- [ ] **性能监控**
  - [ ] 检查控制台是否有错误
  - [ ] 监控内存使用情况
  - [ ] 检查FPS是否稳定
  - [ ] 验证加载时间

### 周度检查 (每周)

- [ ] **依赖和安全**
  - [ ] 运行 `npm audit` 检查安全漏洞
  - [ ] 检查依赖是否有更新
  - [ ] 更新开发依赖
  - [ ] 运行单元测试

- [ ] **性能分析**
  - [ ] 运行性能基准测试
  - [ ] 分析性能监控数据
  - [ ] 检查内存泄漏
  - [ ] 优化慢查询和长任务

### 月度检查 (每月)

- [ ] **深度测试**
  - [ ] 运行完整的E2E测试套件
  - [ ] 在不同浏览器中测试
  - [ ] 移动设备兼容性测试
  - [ ] 网络条件测试 (慢网络)

- [ ] **代码质量**
  - [ ] 代码静态分析
  - [ ] 依赖版本审查
  - [ ] 重构过时代码
  - [ ] 更新文档

### 季度检查 (每3个月)

- [ ] **架构审查**
  - [ ] 评估架构决策
  - [ ] 重构核心组件
  - [ ] 更新技术栈
  - [ ] 优化构建配置

- [ ] **安全审查**
  - [ ] 全面安全扫描
  - [ ] 更新安全策略
  - [ ] 审查第三方依赖
  - [ ] 漏洞修复

---

## 🆘 紧急故障处理

### 1. 生产环境崩溃

**立即行动**:
```bash
# 1. 回滚到上一个稳定版本
git log --oneline -10
git revert <problematic-commit>
git push origin main

# 2. 紧急热修复部署
npm run build:emergency
npm run deploy:hotfix

# 3. 监控恢复状态
npm run monitor:health
```

### 2. 内存泄漏导致崩溃

**诊断和修复**:
```javascript
// 紧急内存清理
const emergencyCleanup = () => {
  // 清理全局定时器
  for (let i = 1; i < 999999; i++) {
    clearTimeout(i);
    clearInterval(i);
  }
  
  // 清理事件监听器
  const events = ['mousemove', 'scroll', 'resize', 'touchmove'];
  events.forEach(event => {
    document.removeEventListener(event, () => {});
    window.removeEventListener(event, () => {});
  });
  
  // 强制垃圾回收
  if (window.gc) window.gc();
  
  // 重新加载页面
  setTimeout(() => window.location.reload(), 1000);
};

// 内存使用监控
if ('memory' in performance) {
  const checkMemory = () => {
    const used = (performance as any).memory.usedJSHeapSize / 1048576;
    if (used > 200) {
      console.error('紧急内存清理触发');
      emergencyCleanup();
    }
  };
  
  setInterval(checkMemory, 10000); // 每10秒检查
}
```

### 3. 联系和上报

**紧急联系信息**:
- **技术负责人**: 麻蛇
- **GitHub Issues**: [项目仓库/issues](https://github.com/your-repo/issues)
- **技术支持邮箱**: support@tiangongtech.com

**故障报告模板**:
```markdown
## 紧急故障报告

**故障时间**: YYYY-MM-DD HH:MM:SS
**故障描述**: [详细描述故障现象]
**影响范围**: [影响的功能和用户]
**错误信息**: [相关错误日志]
**复现步骤**: [如何复现问题]
**临时解决方案**: [已采取的临时措施]
**环境信息**: 
- 浏览器: [Chrome/Firefox/Safari version]
- 操作系统: [Windows/macOS/Linux]
- 设备: [Desktop/Mobile]
- 应用版本: [v4.2]

**附加信息**: [任何其他相关信息]
```

---

> **重要提醒**: 定期备份配置文件和重要数据，确保在紧急情况下能够快速恢复服务。保持文档更新，确保团队成员都能够快速响应和处理故障。