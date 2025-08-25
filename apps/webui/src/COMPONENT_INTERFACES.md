# 组件接口规范文档

> **版本**: v4.2  
> **最后更新**: 2025年8月21日  
> **状态**: 最新

## 📋 组件接口总览

| 组件名 | 文件路径 | 主要功能 | API状态 |
|--------|----------|----------|---------|
| App | `/App.tsx` | 主应用容器 | ✅ 稳定 |
| BackgroundManager | `/components/BackgroundManager.tsx` | 背景管理 | ✅ 稳定 |
| AdvancedMusicPlayer | `/components/AdvancedMusicPlayer.tsx` | 高级音乐播放器 | ✅ 稳定 |
| TimeDisplay | `/components/TimeDisplay.tsx` | 时钟显示 | ✅ 稳定 |
| MusicOrganizer | `/components/MusicOrganizer.tsx` | 音乐整理器 | ✅ 稳定 |
| DevTools | `/components/DevTools.tsx` | 开发工具 | ✅ 稳定 |
| ErrorBoundary | `/components/ErrorBoundary.tsx` | 错误边界 | ✅ 稳定 |

---

## 🎯 核心组件接口

### 1. App 组件

```typescript
/**
 * 主应用组件 - 全屏视觉体验应用的根容器
 * 管理全局状态、路由和布局
 */
interface AppComponent {
  // 无外部props，完全自包含
  (): JSX.Element;
}

// 内部状态管理
interface AppState {
  /** 是否处于欢迎模式 */
  isWelcomeMode: boolean;
  
  /** 是否显示信息面板 */
  showInfo: boolean;
  
  /** 是否正在过渡动画中 */
  isTransitioning: boolean;
  
  /** 是否已完成初始化 */
  isInitialized: boolean;
}

// 内部配置常量
interface AnimationConfig {
  readonly FADE_DURATION: 0.3;
  readonly TRANSITION_DURATION: 0.5;
  readonly WELCOME_TRANSITION: 300;
  readonly CONSOLE_TRANSITION: 200;
  readonly INIT_DELAY: 100;
  readonly COMPONENT_DELAY: 300;
  readonly EASING: readonly [0.25, 0.46, 0.45, 0.94];
  readonly SMOOTH_EASING: readonly [0.23, 1, 0.32, 1];
}
```

**使用示例:**
```tsx
import App from './App';
import ReactDOM from 'react-dom/client';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
```

---

### 2. BackgroundManager 组件

```typescript
/**
 * 背景管理器 - 统一管理Shader背景和动画效果
 */
interface BackgroundManagerProps {
  /** 自定义CSS类名 */
  className?: string;
  
  /** 背景切换回调函数 */
  onBackgroundChange?: (background: BackgroundConfig) => void;
  
  /** 是否启用预加载 */
  enablePreload?: boolean;
  
  /** 是否启用调试模式 */
  debugMode?: boolean;
  
  /** 回退颜色 */
  fallbackColor?: string;
}

interface BackgroundConfig {
  /** 背景ID */
  id: number;
  
  /** 背景名称 */
  name: string;
  
  /** 背景类型 */
  type: 'shader' | 'canvas' | 'default';
  
  /** 源代码/路径 */
  source?: string;
  
  /** 主题色 */
  color: string;
  
  /** 自定义参数 */
  params?: Record<string, any>;
}

// 组件方法
interface BackgroundManagerMethods {
  /** 切换到指定背景 */
  switchBackground: (id: number) => Promise<void>;
  
  /** 获取当前背景信息 */
  getCurrentBackground: () => BackgroundConfig;
  
  /** 预加载背景资源 */
  preloadBackground: (id: number) => Promise<boolean>;
  
  /** 重置背景循环 */
  resetBackgroundCycle: () => void;
}
```

**使用示例:**
```tsx
<BackgroundManager
  className="absolute inset-0"
  onBackgroundChange={(bg) => console.log('背景切换:', bg.name)}
  enablePreload={true}
  debugMode={false}
  fallbackColor="#c0c5ce"
/>
```

---

### 3. AdvancedMusicPlayer 组件

```typescript
/**
 * 高级音乐播放器 - 集成Termusic后端和Wavesurfer.js
 * 支持10秒窗口波形显示和原生音频播放
 */
interface AdvancedMusicPlayerProps {
  /** 播放器是否可见 */
  isVisible: boolean;
  
  /** 是否处于欢迎模式 */
  isWelcomeMode: boolean;
  
  /** 是否启用波形显示 */
  enableWaveform?: boolean;
  
  /** 是否启用Termusic后端 */
  enableTermusicBackend?: boolean;
  
  /** 鼠标位置（用于视差效果） */
  mousePosition?: MousePosition;
  
  /** 事件回调函数集合 */
  events?: MusicPlayerEvents;
  
  /** 自定义CSS类名 */
  className?: string;
  
  /** 自定义样式 */
  style?: React.CSSProperties;
}

interface MousePosition {
  x: number;
  y: number;
}

interface MusicPlayerEvents {
  /** 错误事件回调 */
  onError?: (error: string) => void;
  
  /** 音轨切换回调 */
  onTrackChange?: (track: TrackInfo) => void;
  
  /** 播放状态变化回调 */
  onPlaybackStateChange?: (state: PlaybackState) => void;
  
  /** 音量变化回调 */
  onVolumeChange?: (volume: number) => void;
  
  /** 播放进度回调 */
  onProgressChange?: (progress: ProgressInfo) => void;
}

interface TrackInfo {
  /** 音轨标题 */
  title: string;
  
  /** 艺术家 */
  artist: string;
  
  /** 专辑名 */
  album?: string;
  
  /** 音轨时长（秒） */
  duration: number;
  
  /** 当前播放时间（秒） */
  currentTime: number;
  
  /** 封面图片URL */
  artwork?: string;
  
  /** 音频文件路径 */
  source: string;
}

interface PlaybackState {
  /** 是否正在播放 */
  isPlaying: boolean;
  
  /** 音量 (0-100) */
  volume: number;
  
  /** 是否静音 */
  isMuted: boolean;
  
  /** 播放模式 */
  repeatMode: 'none' | 'one' | 'all';
  
  /** 是否随机播放 */
  isShuffled: boolean;
}

interface ProgressInfo {
  /** 当前时间（秒） */
  currentTime: number;
  
  /** 总时长（秒） */
  duration: number;
  
  /** 播放进度（0-1） */
  progress: number;
  
  /** 缓冲进度（0-1） */
  buffered: number;
}

// 组件方法接口
interface AdvancedMusicPlayerMethods {
  /** 播放音乐 */
  play: () => Promise<void>;
  
  /** 暂停播放 */
  pause: () => void;
  
  /** 停止播放 */
  stop: () => void;
  
  /** 下一首 */
  next: () => void;
  
  /** 上一首 */
  previous: () => void;
  
  /** 设置音量 */
  setVolume: (volume: number) => void;
  
  /** 跳转到指定时间 */
  seek: (time: number) => void;
  
  /** 加载音轨 */
  loadTrack: (track: TrackInfo) => Promise<void>;
  
  /** 切换静音 */
  toggleMute: () => void;
  
  /** 切换播放/暂停 */
  togglePlayPause: () => void;
}
```

**使用示例:**
```tsx
<AdvancedMusicPlayer
  isVisible={true}
  isWelcomeMode={false}
  enableWaveform={true}
  enableTermusicBackend={true}
  mousePosition={{ x: 0, y: 0 }}
  events={{
    onError: (error) => console.error('播放器错误:', error),
    onTrackChange: (track) => console.log('切换音轨:', track.title),
    onPlaybackStateChange: (state) => console.log('播放状态:', state)
  }}
  className="w-96"
/>
```

---

### 4. TimeDisplay 组件

```typescript
/**
 * 时钟显示组件 - 支持欢迎模式和控制台模式的时间显示
 */
interface TimeDisplayProps {
  /** 是否处于欢迎模式 */
  isWelcomeMode: boolean;
  
  /** 自定义时区 */
  timezone?: string;
  
  /** 是否使用24小时制 */
  use24Hour?: boolean;
  
  /** 是否显示秒数 */
  showSeconds?: boolean;
  
  /** 是否显示日期 */
  showDate?: boolean;
  
  /** 自定义格式化选项 */
  formatOptions?: Intl.DateTimeFormatOptions;
  
  /** 自定义CSS类名 */
  className?: string;
  
  /** 自定义样式 */
  style?: React.CSSProperties;
}

// 内部状态
interface TimeState {
  /** 当前时间 */
  currentTime: Date;
  
  /** 时区 */
  timezone: string;
  
  /** 24小时制标志 */
  format24Hour: boolean;
  
  /** 是否已挂载 */
  isMounted: boolean;
}

// 样式配置
interface TimeDisplayStyles {
  welcome: {
    fontSize: string;
    color: string;
    fontWeight: string;
    letterSpacing: string;
    textShadow?: string;
  };
  console: {
    fontSize: string;
    color: string;
    fontWeight: string;
    letterSpacing: string;
    textShadow: string;
  };
}
```

**使用示例:**
```tsx
<TimeDisplay
  isWelcomeMode={false}
  timezone="Asia/Shanghai"
  use24Hour={true}
  showSeconds={false}
  showDate={true}
  className="text-center"
/>
```

---

### 5. MusicOrganizer 组件

```typescript
/**
 * 音乐整理器 - 提供Spotify导出、音乐库管理等功能
 */
interface MusicOrganizerProps {
  /** 自定义CSS类名 */
  className?: string;
  
  /** 是否启用Spotify集成 */
  enableSpotifyIntegration?: boolean;
  
  /** 是否启用任务监控 */
  enableTaskMonitoring?: boolean;
  
  /** 回调函数集合 */
  callbacks?: MusicOrganizerCallbacks;
}

interface MusicOrganizerCallbacks {
  /** Spotify导出完成回调 */
  onSpotifyExportComplete?: (data: SpotifyExportResult) => void;
  
  /** 音乐库组织完成回调 */
  onLibraryOrganizeComplete?: (stats: OrganizeStats) => void;
  
  /** 任务状态变化回调 */
  onTaskStatusChange?: (task: TaskInfo) => void;
  
  /** 错误回调 */
  onError?: (error: OrganizerError) => void;
}

interface FunctionModule {
  /** 模块ID */
  id: string;
  
  /** 模块名称 */
  name: string;
  
  /** 状态 */
  status: 'dormant' | 'active' | 'pulse' | 'error';
  
  /** 描述 */
  description: string;
  
  /** 进度（0-100） */
  progress?: number;
  
  /** 点击处理函数 */
  onClick: () => void;
  
  /** 是否可用 */
  enabled: boolean;
}

interface SpotifyExportResult {
  /** 导出的播放列表数量 */
  playlistCount: number;
  
  /** 导出的音轨数量 */
  trackCount: number;
  
  /** 导出文件路径 */
  exportPath: string;
  
  /** 导出格式 */
  format: 'json' | 'csv' | 'xml';
  
  /** 导出时间 */
  exportTime: Date;
}

interface OrganizeStats {
  /** 处理的文件数量 */
  processedFiles: number;
  
  /** 组织的文件数量 */
  organizedFiles: number;
  
  /** 重复文件数量 */
  duplicateFiles: number;
  
  /** 错误文件数量 */
  errorFiles: number;
  
  /** 处理时长（毫秒） */
  processingTime: number;
}

interface TaskInfo {
  /** 任务ID */
  id: string;
  
  /** 任务名称 */
  name: string;
  
  /** 任务状态 */
  status: 'pending' | 'running' | 'completed' | 'failed';
  
  /** 进度（0-100） */
  progress: number;
  
  /** 开始时间 */
  startTime: Date;
  
  /** 预计完成时间 */
  estimatedEndTime?: Date;
  
  /** 错误信息 */
  error?: string;
}

interface OrganizerError {
  /** 错误代码 */
  code: string;
  
  /** 错误消息 */
  message: string;
  
  /** 错误详情 */
  details?: any;
  
  /** 发生时间 */
  timestamp: Date;
}
```

**使用示例:**
```tsx
<MusicOrganizer
  className="w-full"
  enableSpotifyIntegration={true}
  enableTaskMonitoring={true}
  callbacks={{
    onSpotifyExportComplete: (result) => 
      console.log('导出完成:', result),
    onTaskStatusChange: (task) => 
      console.log('任务状态:', task.status),
    onError: (error) => 
      console.error('组织器错误:', error)
  }}
/>
```

---

### 6. DevTools 组件

```typescript
/**
 * 开发工具组件 - 提供Shader切换、性能监控等开发辅助功能
 */
interface DevToolsProps {
  /** 当前选中的Shader ID */
  selectedShader: number;
  
  /** Shader变化回调 */
  onShaderChange: (shaderId: number) => void;
  
  /** 是否处于欢迎模式 */
  isWelcomeMode: boolean;
  
  /** 是否显示功能面板 */
  showFunctionPanel?: boolean;
  
  /** 是否启用性能监控 */
  enablePerformanceMonitoring?: boolean;
  
  /** 是否显示调试信息 */
  showDebugInfo?: boolean;
  
  /** 自定义CSS类名 */
  className?: string;
  
  /** 开发工具回调 */
  callbacks?: DevToolsCallbacks;
}

interface DevToolsCallbacks {
  /** 性能数据回调 */
  onPerformanceData?: (data: PerformanceData) => void;
  
  /** 调试日志回调 */
  onDebugLog?: (log: DebugLog) => void;
  
  /** 错误回调 */
  onError?: (error: DevToolsError) => void;
}

interface PerformanceData {
  /** FPS */
  fps: number;
  
  /** 内存使用（MB） */
  memoryUsage: number;
  
  /** 渲染时间（ms） */
  renderTime: number;
  
  /** GPU使用率（%） */
  gpuUsage?: number;
  
  /** 时间戳 */
  timestamp: Date;
}

interface DebugLog {
  /** 日志级别 */
  level: 'debug' | 'info' | 'warn' | 'error';
  
  /** 日志消息 */
  message: string;
  
  /** 日志数据 */
  data?: any;
  
  /** 时间戳 */
  timestamp: Date;
  
  /** 来源组件 */
  source?: string;
}

interface DevToolsError {
  /** 错误类型 */
  type: 'shader' | 'performance' | 'general';
  
  /** 错误消息 */
  message: string;
  
  /** 错误堆栈 */
  stack?: string;
  
  /** 时间戳 */
  timestamp: Date;
}

// 内置工具函数
interface DevToolsMethods {
  /** 重置Shader循环 */
  resetShaderCycle: () => void;
  
  /** 导出性能报告 */
  exportPerformanceReport: () => Promise<string>;
  
  /** 清除调试日志 */
  clearDebugLogs: () => void;
  
  /** 切换调试模式 */
  toggleDebugMode: () => void;
  
  /** 强制垃圾回收 */
  forceGarbageCollection: () => void;
}
```

**使用示例:**
```tsx
<DevTools
  selectedShader={1}
  onShaderChange={(id) => setSelectedShader(id)}
  isWelcomeMode={false}
  showFunctionPanel={true}
  enablePerformanceMonitoring={true}
  showDebugInfo={true}
  callbacks={{
    onPerformanceData: (data) => 
      console.log('性能数据:', data),
    onDebugLog: (log) => 
      console.log('调试日志:', log),
    onError: (error) => 
      console.error('开发工具错误:', error)
  }}
/>
```

---

### 7. ErrorBoundary 组件

```typescript
/**
 * 错误边界组件 - 捕获和处理React组件错误
 */
interface ErrorBoundaryProps {
  /** 子组件 */
  children: React.ReactNode;
  
  /** 是否启用错误恢复 */
  enableRecovery?: boolean;
  
  /** 最大重试次数 */
  maxRetries?: number;
  
  /** 是否显示错误详情 */
  showErrorDetails?: boolean;
  
  /** 回退组件 */
  fallback?: React.ComponentType<ErrorFallbackProps> | React.ReactNode;
  
  /** 错误回调 */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  
  /** 重试回调 */
  onRetry?: () => void;
  
  /** 自定义CSS类名 */
  className?: string;
}

interface ErrorFallbackProps {
  /** 错误对象 */
  error: Error;
  
  /** 错误信息 */
  errorInfo: React.ErrorInfo;
  
  /** 重试函数 */
  retry: () => void;
  
  /** 是否可以重试 */
  canRetry: boolean;
  
  /** 重试次数 */
  retryCount: number;
}

// 内部状态
interface ErrorBoundaryState {
  /** 是否有错误 */
  hasError: boolean;
  
  /** 错误对象 */
  error: Error | null;
  
  /** 错误信息 */
  errorInfo: React.ErrorInfo | null;
  
  /** 重试次数 */
  retryCount: number;
  
  /** 错误ID（用于去重） */
  errorId: string;
}

// 错误类型枚举
enum ErrorType {
  RENDER_ERROR = 'render_error',
  CHUNK_LOAD_ERROR = 'chunk_load_error',
  NETWORK_ERROR = 'network_error',
  PERMISSION_ERROR = 'permission_error',
  TIMEOUT_ERROR = 'timeout_error',
  UNKNOWN_ERROR = 'unknown_error'
}
```

**使用示例:**
```tsx
<ErrorBoundary
  enableRecovery={true}
  maxRetries={3}
  showErrorDetails={process.env.NODE_ENV === 'development'}
  onError={(error, errorInfo) => {
    console.error('捕获到错误:', error);
    console.error('错误信息:', errorInfo);
  }}
  fallback={({ error, retry, canRetry }) => (
    <div className="error-fallback">
      <h2>出现错误</h2>
      <p>{error.message}</p>
      {canRetry && (
        <button onClick={retry}>重试</button>
      )}
    </div>
  )}
>
  <App />
</ErrorBoundary>
```

---

## 🎣 自定义Hook接口

### 1. useAppState Hook

```typescript
/**
 * 应用状态管理Hook
 */
interface UseAppStateReturn {
  /** 当前状态 */
  state: AppState;
  
  /** 状态更新函数 */
  updateState: (updates: Partial<AppState>) => void;
  
  /** 重置状态 */
  resetState: () => void;
  
  /** 获取状态历史 */
  getStateHistory: () => AppState[];
}

interface UseAppStateConfig {
  /** 初始状态 */
  initialState?: Partial<AppState>;
  
  /** 是否启用状态持久化 */
  enablePersistence?: boolean;
  
  /** 持久化键名 */
  persistenceKey?: string;
  
  /** 状态变化回调 */
  onStateChange?: (newState: AppState, prevState: AppState) => void;
}

function useAppState(config?: UseAppStateConfig): UseAppStateReturn;
```

### 2. useShaderManager Hook

```typescript
/**
 * Shader管理Hook
 */
interface UseShaderManagerReturn {
  /** 当前选中的Shader ID */
  selectedShader: number;
  
  /** Shader切换函数 */
  setSelectedShader: (id: number) => void;
  
  /** 当前Shader索引 */
  currentShaderIndex: number;
  
  /** 当前Shader信息 */
  currentShader: ShaderInfo;
  
  /** 下一个Shader信息 */
  nextShader: ShaderInfo;
  
  /** 所有Shader列表 */
  allShaders: ShaderInfo[];
  
  /** 切换到下一个Shader */
  nextShader: () => void;
  
  /** 切换到上一个Shader */
  previousShader: () => void;
  
  /** 重置Shader循环 */
  resetCycle: () => void;
}

interface UseShaderManagerConfig {
  /** 初始Shader ID */
  initialShaderId?: number;
  
  /** 是否启用自动循环 */
  enableAutoCycle?: boolean;
  
  /** 自动循环间隔（毫秒） */
  cycleInterval?: number;
  
  /** Shader切换回调 */
  onShaderChange?: (shader: ShaderInfo) => void;
}

function useShaderManager(config?: UseShaderManagerConfig): UseShaderManagerReturn;
```

### 3. useMouseInteraction Hook

```typescript
/**
 * 鼠标交互Hook
 */
interface UseMouseInteractionReturn {
  /** 鼠标位置 */
  mousePosition: MousePosition;
  
  /** 归一化的鼠标位置（0-1） */
  normalizedPosition: MousePosition;
  
  /** 鼠标速度 */
  mouseVelocity: MousePosition;
  
  /** 是否在移动 */
  isMoving: boolean;
  
  /** 重置位置 */
  resetPosition: () => void;
}

interface UseMouseInteractionConfig {
  /** 是否激活 */
  isActive: boolean;
  
  /** 平滑因子（0-1） */
  smoothing?: number;
  
  /** 节流间隔（毫秒） */
  throttleMs?: number;
  
  /** 最大偏移量 */
  maxOffset?: MousePosition;
  
  /** 鼠标移动回调 */
  onMouseMove?: (position: MousePosition) => void;
}

function useMouseInteraction(config: UseMouseInteractionConfig): UseMouseInteractionReturn;
```

### 4. useSmartPositioning Hook

```typescript
/**
 * 智能定位Hook
 */
interface UseSmartPositioningReturn {
  /** 元素引用 */
  elementRef: React.RefObject<HTMLElement>;
  
  /** 位置样式 */
  positionStyles: React.CSSProperties;
  
  /** 状态CSS类名 */
  statusClasses: string;
  
  /** 当前位置 */
  currentPosition: Position;
  
  /** 手动设置位置 */
  setPosition: (position: Partial<Position>) => void;
  
  /** 重置到首选位置 */
  resetPosition: () => void;
}

interface Position {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface UseSmartPositioningConfig {
  /** 模块ID */
  moduleId: string;
  
  /** 优先级（数字越大优先级越高） */
  priority: number;
  
  /** 是否可移动 */
  canMove: boolean;
  
  /** 首选位置 */
  preferredPosition: 'top' | 'bottom' | 'left' | 'right' | 'center';
  
  /** 避让距离 */
  avoidanceDistance: number;
  
  /** 动画持续时间 */
  animationDuration: number;
  
  /** 位置变化回调 */
  onPositionChange?: (position: Position) => void;
}

function useSmartPositioning(config: UseSmartPositioningConfig): UseSmartPositioningReturn;
```

### 5. useSmartLayout Hook

```typescript
/**
 * 智能布局Hook
 */
interface UseSmartLayoutReturn {
  /** 设置弹窗状态 */
  setPopupState: (isOpen: boolean) => void;
  
  /** 设置模态框状态 */
  setModalState: (isOpen: boolean) => void;
  
  /** 获取布局指标 */
  getLayoutMetrics: () => LayoutMetrics;
  
  /** 注册模块 */
  registerModule: (module: LayoutModule) => void;
  
  /** 注销模块 */
  unregisterModule: (moduleId: string) => void;
  
  /** 检测碰撞 */
  detectCollisions: () => CollisionInfo[];
}

interface LayoutMetrics {
  /** 可用空间 */
  availableSpace: DOMRect;
  
  /** 活跃模块列表 */
  activeModules: string[];
  
  /** 碰撞区域 */
  collisionZones: DOMRect[];
  
  /** 布局密度（0-1） */
  layoutDensity: number;
}

interface LayoutModule {
  /** 模块ID */
  id: string;
  
  /** 模块矩形区域 */
  rect: DOMRect;
  
  /** 优先级 */
  priority: number;
  
  /** 是否可移动 */
  movable: boolean;
}

interface CollisionInfo {
  /** 模块A */
  moduleA: string;
  
  /** 模块B */
  moduleB: string;
  
  /** 重叠区域 */
  overlapRect: DOMRect;
  
  /** 碰撞严重程度（0-1） */
  severity: number;
}

function useSmartLayout(): UseSmartLayoutReturn;
```

---

## 🎨 样式系统接口

### 银色主题色彩系统

```typescript
/**
 * 银色主题色彩常量
 */
interface SilverThemeColors {
  // 主色调
  readonly primary: '#c0c5ce';
  readonly secondary: '#a8b2c4';
  readonly tertiary: '#9399a8';
  
  // 透明度变体
  readonly primary05: 'rgba(192, 197, 206, 0.05)';
  readonly primary10: 'rgba(192, 197, 206, 0.1)';
  readonly primary15: 'rgba(192, 197, 206, 0.15)';
  readonly primary20: 'rgba(192, 197, 206, 0.2)';
  readonly primary30: 'rgba(192, 197, 206, 0.3)';
  readonly primary40: 'rgba(192, 197, 206, 0.4)';
  readonly primary60: 'rgba(192, 197, 206, 0.6)';
  readonly primary80: 'rgba(192, 197, 206, 0.8)';
  
  // 光效和阴影
  readonly glowSoft: 'rgba(192, 197, 206, 0.25)';
  readonly glowMedium: 'rgba(192, 197, 206, 0.4)';
  readonly glowStrong: 'rgba(192, 197, 206, 0.6)';
  readonly shadowSoft: 'rgba(0, 0, 0, 0.1)';
  readonly shadowMedium: 'rgba(0, 0, 0, 0.15)';
  readonly shadowStrong: 'rgba(0, 0, 0, 0.25)';
}
```

### CSS类名约定

```typescript
/**
 * CSS类名接口
 */
interface CSSClassNames {
  // 玻璃形态
  readonly glassomorphism: 'glass-morphism';
  readonly glassomorphismStrong: 'glass-morphism-strong';
  readonly minimalGlass: 'minimal-glass';
  
  // 功能面板
  readonly functionPanel: 'function-panel';
  readonly minimalButton: 'minimal-button';
  
  // 状态指示器
  readonly statusIndicator: 'status-indicator';
  readonly statusActive: 'active';
  readonly statusPulse: 'pulse';
  
  // 文字系统
  readonly textPrimary: 'text-primary';
  readonly textSecondary: 'text-secondary';
  readonly textTertiary: 'text-tertiary';
  
  // 布局系统
  readonly isolationSpace: 'isolation-space';
  readonly layoutGrid: 'layout-grid';
  readonly layoutStack: 'layout-stack';
  readonly isolationGap: 'isolation-gap';
  
  // 动画系统
  readonly transitionFast: 'transition-fast';
  readonly transitionSmooth: 'transition-smooth';
  readonly animateTechGlow: 'animate-tech-glow';
  readonly animatePulseSimple: 'animate-pulse-simple';
}
```

---

## 📱 响应式设计接口

### 断点系统

```typescript
/**
 * 响应式断点定义
 */
interface Breakpoints {
  readonly xs: '0px';
  readonly sm: '640px';
  readonly md: '768px';
  readonly lg: '1024px';
  readonly xl: '1280px';
  readonly '2xl': '1536px';
}

/**
 * 响应式Hook
 */
interface UseResponsiveReturn {
  /** 当前断点 */
  currentBreakpoint: keyof Breakpoints;
  
  /** 是否为移动设备 */
  isMobile: boolean;
  
  /** 是否为平板设备 */
  isTablet: boolean;
  
  /** 是否为桌面设备 */
  isDesktop: boolean;
  
  /** 屏幕尺寸 */
  screenSize: {
    width: number;
    height: number;
  };
  
  /** 是否为高分辨率屏幕 */
  isHighDPI: boolean;
}

function useResponsive(): UseResponsiveReturn;
```

---

## 🔧 配置接口

### 应用配置

```typescript
/**
 * 应用配置接口
 */
interface AppConfig {
  /** 基础配置 */
  app: {
    name: string;
    version: string;
    author: string;
    description: string;
  };
  
  /** 主题配置 */
  theme: {
    primaryColor: string;
    accentColor: string;
    darkMode: boolean;
    animations: boolean;
  };
  
  /** 性能配置 */
  performance: {
    enableHardwareAcceleration: boolean;
    maxFPS: number;
    memoryLimit: number;
    preloadAssets: boolean;
  };
  
  /** 音频配置 */
  audio: {
    enableWaveform: boolean;
    windowSize: number;
    sampleRate: number;
    bitDepth: number;
  };
  
  /** 开发配置 */
  development: {
    debugMode: boolean;
    showPerformanceMetrics: boolean;
    enableHotReload: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * 配置管理器
 */
interface ConfigManager {
  /** 获取配置 */
  getConfig: () => AppConfig;
  
  /** 更新配置 */
  updateConfig: (updates: Partial<AppConfig>) => void;
  
  /** 重置配置 */
  resetConfig: () => void;
  
  /** 保存配置 */
  saveConfig: () => Promise<void>;
  
  /** 加载配置 */
  loadConfig: () => Promise<AppConfig>;
}
```

---

## 📄 许可与使用条款

### 接口使用约定

1. **向后兼容性**: 所有公共接口保证向后兼容性
2. **版本控制**: 接口变更遵循语义化版本控制
3. **类型安全**: 所有接口提供完整的TypeScript类型定义
4. **文档更新**: 接口变更时同步更新文档

### 扩展指南

1. **自定义组件**: 继承基础接口，扩展新功能
2. **Hook开发**: 遵循React Hook规范
3. **样式系统**: 基于银色主题色彩系统
4. **性能考虑**: 注意内存泄漏和性能优化

---

> **注意**: 本文档描述的接口为稳定版本，生产环境中请使用标记为"稳定"的接口。实验性接口可能在未来版本中发生变化。