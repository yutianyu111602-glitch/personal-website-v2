# API接口和组件通信规范

## 🌐 全局接口定义

### 核心应用状态接口
```typescript
// 主应用状态管理
interface AppState {
  isWelcomeMode: boolean;      // 欢迎模式标志
  isInitialized: boolean;      // 应用初始化状态
  language: 'zh' | 'en';       // 当前语言
  showRadio: boolean;          // 电台显示状态
  syncActive: boolean;         // 同步功能状态
}

// 状态更新器类型
type AppStateUpdater = (prevState: AppState) => AppState;
type StateSetFunction = (updater: AppStateUpdater) => void;

// 全局事件处理器接口
interface GlobalEventHandlers {
  toggleLanguage: () => void;
  switchBackground: () => void;
  handleWelcomeClick: () => void;
  handleModuleClick: (e: React.MouseEvent) => void;
  toggleSync: () => void;
  handleOpenMusicVisualizer: () => void;
}
```

### 国际化系统接口
```typescript
// 翻译文本接口
interface Translations {
  // 基础UI文本
  language: string;
  switchBackground: string;
  tiangongRadio: string;
  
  // 时间和日期
  timeFormat: string;
  dateFormat: string;
  timezone: string;
  
  // 状态信息
  connecting: string;
  connected: string;
  disconnected: string;
  error: string;
  loading: string;
  
  // 控制按钮
  play: string;
  pause: string;
  stop: string;
  next: string;
  previous: string;
  volume: string;
  mute: string;
  
  // 空间站状态
  spaceStation: {
    name: string;
    status: string;
    altitude: string;
    speed: string;
    crew: string;
    mission: string;
  };
  
  // 音乐相关
  music: {
    title: string;
    artist: string;
    album: string;
    duration: string;
    currentTime: string;
    playlist: string;
    shuffle: string;
    repeat: string;
  };
  
  // 电台相关
  radio: {
    station: string;
    genre: string;
    bitrate: string;
    listeners: string;
    nowPlaying: string;
  };
}

// 国际化工具函数接口
interface I18nUtils {
  getTranslations: (language: string) => Translations;
  getSystemLanguage: () => 'zh' | 'en';
  getShaderName: (index: number, language: string) => string;
  formatTime: (seconds: number, language: string) => string;
  formatDate: (date: Date, language: string) => string;
}
```

## 🎨 背景管理系统接口

### BackgroundManager组件接口
```typescript
interface BackgroundManagerProps {
  className?: string;
  enablePreload: boolean;
  debugMode: boolean;
  onBackgroundChange?: (background: ShaderInfo) => void;
  style?: React.CSSProperties;
}

interface ShaderInfo {
  id: number;
  name: {
    zh: string;
    en: string;
  };
  type: 'particle' | 'liquid' | 'wave' | 'nebula' | 'quantum';
  vertexShader: string;
  fragmentShader: string;
  uniforms: ShaderUniforms;
  performance: {
    complexity: 'low' | 'medium' | 'high';
    fps: number;
    memory: number;
  };
}

interface ShaderUniforms {
  time: { value: number };
  resolution: { value: [number, number] };
  mouse: { value: [number, number] };
  color1: { value: [number, number, number] };
  color2: { value: [number, number, number] };
  speed: { value: number };
  intensity: { value: number };
  [key: string]: { value: any };
}

// 背景管理器内部状态
interface BackgroundState {
  currentShaderIndex: number;
  isLoading: boolean;
  preloadComplete: boolean;
  error?: string;
  animationFrameId?: number;
  startTime: number;
  mousePosition: [number, number];
}

// 背景管理器方法接口
interface BackgroundMethods {
  switchToShader: (index: number) => void;
  preloadShaders: () => Promise<void>;
  updateUniforms: (uniforms: Partial<ShaderUniforms>) => void;
  getPerformanceMetrics: () => PerformanceMetrics;
  cleanup: () => void;
}
```

### Shader系统配置接口
```typescript
// 着色器配置
interface ShaderConfig {
  id: number;
  name: {
    zh: string;
    en: string;
  };
  description: {
    zh: string;
    en: string;
  };
  category: 'abstract' | 'nature' | 'tech' | 'space';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  source: {
    vertex: string;
    fragment: string;
  };
  defaultUniforms: ShaderUniforms;
  responsive: boolean;
  mobileOptimized: boolean;
}

// 着色器性能监控
interface ShaderPerformance {
  fps: number;
  frameTime: number;
  gpuMemory: number;
  cpuUsage: number;
  renderCalls: number;
}
```

## 📻 电台播放器接口

### TiangongRadioPlayer组件接口
```typescript
interface TiangongRadioPlayerProps {
  language: 'zh' | 'en';
  syncActive: boolean;
  onSyncToggle: () => void;
  onClose: () => void;
}

// 电台播放器状态
interface RadioPlayerState {
  // 播放状态
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  
  // 音频控制
  volume: number;
  muted: boolean;
  
  // 电台信息
  currentStation: RadioStation;
  stations: RadioStation[];
  
  // 连接状态
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error' | 'reconnecting';
  lastError?: string;
  
  // UI状态
  position: { x: number; y: number };
  isDragging: boolean;
  isMinimized: boolean;
  
  // 同步功能
  syncEnabled: boolean;
  syncMode: 'auto' | 'manual';
  
  // 音频信息
  currentTrack?: {
    title: string;
    artist: string;
    duration?: number;
    artwork?: string;
  };
}

// 电台配置
interface RadioStation {
  id: string;
  name: {
    zh: string;
    en: string;
  };
  description: {
    zh: string;
    en: string;
  };
  url: string;
  streamUrl: string;
  genre: string;
  bitrate: number;
  format: 'mp3' | 'aac' | 'ogg';
  country: string;
  language: string;
  tags: string[];
  logo?: string;
  website?: string;
  social?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

// 电台播放器方法
interface RadioPlayerMethods {
  // 播放控制
  play: (station?: RadioStation) => Promise<void>;
  pause: () => void;
  stop: () => void;
  resume: () => void;
  
  // 音量控制
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
  
  // 电台切换
  switchStation: (stationId: string) => Promise<void>;
  getStations: () => RadioStation[];
  addStation: (station: RadioStation) => void;
  removeStation: (stationId: string) => void;
  
  // 位置控制
  setPosition: (x: number, y: number) => void;
  resetPosition: () => void;
  
  // 同步功能
  enableSync: () => void;
  disableSync: () => void;
  syncWithMaster: () => Promise<void>;
}
```

### 拖拽系统接口
```typescript
// 拖拽状态管理
interface DragState {
  isDragging: boolean;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  offset: { x: number; y: number };
  boundaries: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

// 拖拽事件处理器
interface DragHandlers {
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onDragMove: (e: MouseEvent | TouchEvent) => void;
  onDragEnd: (e: MouseEvent | TouchEvent) => void;
  onDragCancel: () => void;
}

// 拖拽配置
interface DragConfig {
  enabled: boolean;
  boundaries: 'screen' | 'parent' | 'custom';
  customBoundaries?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  snapToGrid: boolean;
  gridSize?: number;
  constrainToAxis?: 'x' | 'y';
}
```

## 🎵 音乐系统接口

### AdvancedMusicOrganizer组件接口
```typescript
interface AdvancedMusicOrganizerProps {
  language: 'zh' | 'en';
  onError: (error: Error) => void;
  onSuccess: (message: string) => void;
}

// 音乐整理器状态
interface MusicOrganizerState {
  // 播放列表管理
  playlists: Playlist[];
  currentPlaylist?: Playlist;
  
  // 导入导出
  importProgress: number;
  exportProgress: number;
  exportFormat: 'spotify' | 'netease' | 'json' | 'csv';
  
  // UI状态
  isLoading: boolean;
  error?: string;
  selectedTracks: string[];
  
  // 搜索和过滤
  searchQuery: string;
  filters: {
    genre?: string;
    artist?: string;
    year?: number;
    duration?: { min: number; max: number };
  };
  
  // 排序
  sortBy: 'title' | 'artist' | 'album' | 'duration' | 'dateAdded';
  sortOrder: 'asc' | 'desc';
}

// 播放列表接口
interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    trackCount: number;
    totalDuration: number;
    genres: string[];
  };
  settings: {
    isPublic: boolean;
    allowDownloads: boolean;
    collaborative: boolean;
  };
  artwork?: {
    url: string;
    color: string;
  };
}

// 音轨接口
interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  trackNumber?: number;
  year?: number;
  genre?: string;
  bpm?: number;
  key?: string;
  
  // 文件信息
  source: 'local' | 'spotify' | 'netease' | 'youtube' | 'soundcloud';
  filePath?: string;
  fileSize?: number;
  format?: 'mp3' | 'flac' | 'wav' | 'ogg';
  bitrate?: number;
  sampleRate?: number;
  
  // 元数据
  metadata: {
    addedAt: Date;
    playCount: number;
    lastPlayed?: Date;
    rating?: number;
    tags: string[];
  };
  
  // 外部ID
  externalIds: {
    spotify?: string;
    netease?: string;
    youtube?: string;
    isrc?: string;
  };
  
  // 音频分析
  audioAnalysis?: {
    loudness: number;
    tempo: number;
    danceability: number;
    energy: number;
    valence: number;
    acousticness: number;
    instrumentalness: number;
    speechiness: number;
  };
}

// 音乐整理器方法
interface MusicOrganizerMethods {
  // 播放列表管理
  createPlaylist: (name: string, description?: string) => Promise<Playlist>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  updatePlaylist: (playlistId: string, updates: Partial<Playlist>) => Promise<void>;
  duplicatePlaylist: (playlistId: string) => Promise<Playlist>;
  
  // 音轨管理
  addTrack: (playlistId: string, track: Track) => Promise<void>;
  removeTrack: (playlistId: string, trackId: string) => Promise<void>;
  moveTrack: (playlistId: string, trackId: string, newIndex: number) => Promise<void>;
  updateTrack: (trackId: string, updates: Partial<Track>) => Promise<void>;
  
  // 导入导出
  importFromSpotify: (playlistUrl: string) => Promise<Playlist>;
  importFromNetease: (playlistId: string) => Promise<Playlist>;
  importFromFile: (file: File) => Promise<Playlist>;
  exportToSpotify: (playlistId: string) => Promise<string>;
  exportToNetease: (playlistId: string) => Promise<string>;
  exportToFile: (playlistId: string, format: string) => Promise<Blob>;
  
  // 搜索和过滤
  searchTracks: (query: string) => Promise<Track[]>;
  filterTracks: (filters: TrackFilters) => Track[];
  sortTracks: (tracks: Track[], sortBy: string, order: 'asc' | 'desc') => Track[];
  
  // 音频分析
  analyzeTrack: (trackId: string) => Promise<AudioAnalysis>;
  generateRecommendations: (playlistId: string) => Promise<Track[]>;
}
```

### Wavesurfer集成接口
```typescript
// Wavesurfer播放器配置
interface WavesurferConfig {
  container: string | HTMLElement;
  waveColor: string;
  progressColor: string;
  cursorColor: string;
  barWidth: number;
  barRadius: number;
  responsive: boolean;
  height: number;
  normalize: boolean;
  backend: 'WebAudio' | 'MediaElement';
  mediaControls: boolean;
  
  // 性能优化配置
  pixelRatio: number;
  scrollParent: boolean;
  fillParent: boolean;
  minPxPerSec: number;
  maxPxPerSec: number;
  
  // 10秒窗口配置
  windowSize: number;
  bufferSize: number;
  preloadSeconds: number;
  
  // Range请求配置
  rangeRequests: boolean;
  chunkSize: number;
  maxChunks: number;
}

// Wavesurfer播放器状态
interface WavesurferState {
  isReady: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  
  duration: number;
  currentTime: number;
  
  volume: number;
  muted: boolean;
  
  audioBuffer?: AudioBuffer;
  currentWindow: {
    start: number;
    end: number;
    data: Float32Array;
  };
  
  error?: string;
}

// Wavesurfer事件接口
interface WavesurferEvents {
  onReady: () => void;
  onPlay: () => void;
  onPause: () => void;
  onFinish: () => void;
  onSeek: (position: number) => void;
  onAudioprocess: (currentTime: number) => void;
  onWaveformReady: (peaks: number[]) => void;
  onError: (error: Error) => void;
  onProgress: (progress: number) => void;
}
```

## 🕐 时间显示系统接口

### TimeDisplay组件接口
```typescript
interface TimeDisplayProps {
  isWelcomeMode: boolean;
}

// 时间状态
interface TimeState {
  currentTime: Date;
  timezone: string;
  format: '12h' | '24h';
  showSeconds: boolean;
  showDate: boolean;
  showTimezone: boolean;
  
  // 位置信息
  location?: {
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    timezone: string;
    utcOffset: number;
  };
  
  // 显示配置
  animation: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'auto';
  color: 'auto' | 'light' | 'dark' | string;
}

// 时间格式化选项
interface TimeFormatOptions {
  hour12: boolean;
  showAmPm: boolean;
  showSeconds: boolean;
  showMilliseconds: boolean;
  separator: ':' | '.' | '-';
  
  dateFormat: 'short' | 'long' | 'numeric' | 'iso';
  timeZoneDisplay: 'short' | 'long' | 'none';
  
  locale: string;
  customFormat?: string;
}

// 地理位置服务接口
interface LocationService {
  getCurrentLocation: () => Promise<GeolocationPosition>;
  getLocationInfo: (lat: number, lng: number) => Promise<LocationInfo>;
  getTimezone: (lat: number, lng: number) => Promise<string>;
  formatTimeForLocation: (time: Date, location: LocationInfo) => string;
}
```

## 🛸 空间站状态接口

### EnhancedSpaceStationStatus组件接口
```typescript
interface EnhancedSpaceStationStatusProps {
  language: 'zh' | 'en';
}

// 空间站状态数据
interface SpaceStationStatus {
  // 基本信息
  name: string;
  mission: string;
  status: 'operational' | 'maintenance' | 'emergency' | 'offline';
  
  // 轨道信息
  orbital: {
    altitude: number;          // 高度 (km)
    speed: number;             // 速度 (km/h)
    period: number;            // 轨道周期 (分钟)
    inclination: number;       // 轨道倾角 (度)
    latitude: number;          // 当前纬度
    longitude: number;         // 当前经度
  };
  
  // 系统状态
  systems: {
    power: {
      status: 'normal' | 'degraded' | 'critical';
      percentage: number;
      solarPanelAngle: number;
    };
    communication: {
      status: 'online' | 'intermittent' | 'offline';
      signalStrength: number;
      groundContact: boolean;
    };
    lifesupport: {
      status: 'nominal' | 'warning' | 'critical';
      oxygenLevel: number;
      co2Level: number;
      temperature: number;
      humidity: number;
    };
    attitude: {
      roll: number;
      pitch: number;
      yaw: number;
      stabilized: boolean;
    };
  };
  
  // 任务信息
  mission: {
    currentPhase: string;
    daysInSpace: number;
    plannedDuration: number;
    experiments: {
      active: number;
      completed: number;
      total: number;
    };
  };
  
  // 船员信息
  crew: Array<{
    name: string;
    role: string;
    nationality: string;
    daysInSpace: number;
    previousFlights: number;
    currentTask?: string;
  }>;
  
  // 时间信息
  time: {
    missionTime: number;       // 任务时间 (秒)
    nextOrbit: number;         // 下次轨道时间 (秒)
    nextContact: number;       // 下次地面接触 (秒)
    sunriseTime?: Date;        // 下次日出时间
    sunsetTime?: Date;         // 下次日落时间
  };
  
  // 最后更新时间
  lastUpdated: Date;
}

// 空间站模拟器接口
interface SpaceStationSimulator {
  getCurrentStatus: () => SpaceStationStatus;
  updateOrbitalData: () => void;
  simulateSystemStatus: () => void;
  calculateNextPass: (lat: number, lng: number) => PassInfo;
  getVisibilityWindows: (days: number) => VisibilityWindow[];
}

// 轨道过境信息
interface PassInfo {
  startTime: Date;
  maxElevationTime: Date;
  endTime: Date;
  maxElevation: number;
  direction: string;
  magnitude: number;
  duration: number;
}

// 可见性窗口
interface VisibilityWindow {
  date: Date;
  passes: PassInfo[];
  totalPasses: number;
  bestPass: PassInfo;
}
```

## 📝 任务日志系统接口

### TaskLogger组件接口
```typescript
interface TaskLoggerProps {
  maxEntries?: number;
  autoScroll?: boolean;
  showTimestamp?: boolean;
  showLevel?: boolean;
  filterLevel?: LogLevel;
}

// 日志级别
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

// 日志条目
interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  component?: string;
  category?: string;
  metadata?: Record<string, any>;
  
  // 性能相关
  duration?: number;
  memoryUsage?: number;
  
  // 用户操作相关
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  
  // 错误相关
  error?: {
    name: string;
    message: string;
    stack?: string;
    cause?: any;
  };
}

// 日志过滤器
interface LogFilter {
  level?: LogLevel;
  component?: string;
  category?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
}

// 日志统计
interface LogStatistics {
  totalEntries: number;
  entriesByLevel: Record<LogLevel, number>;
  entriesByComponent: Record<string, number>;
  averageEntriesPerMinute: number;
  errorRate: number;
  lastActivity: Date;
}

// 任务日志器方法
interface TaskLoggerMethods {
  // 日志记录
  log: (level: LogLevel, message: string, metadata?: any) => void;
  debug: (message: string, metadata?: any) => void;
  info: (message: string, metadata?: any) => void;
  warn: (message: string, metadata?: any) => void;
  error: (message: string, error?: Error, metadata?: any) => void;
  critical: (message: string, error?: Error, metadata?: any) => void;
  
  // 日志管理
  clear: () => void;
  export: (format: 'json' | 'csv' | 'txt') => Promise<Blob>;
  import: (data: LogEntry[]) => void;
  
  // 过滤和搜索
  filter: (filter: LogFilter) => LogEntry[];
  search: (term: string) => LogEntry[];
  
  // 统计
  getStatistics: () => LogStatistics;
  getRecentActivity: (minutes: number) => LogEntry[];
}
```

## 🔧 工具函数接口

### 音频处理工具
```typescript
interface AudioUtils {
  // 音频分析
  analyzeAudioFile: (file: File) => Promise<AudioAnalysis>;
  extractMetadata: (file: File) => Promise<AudioMetadata>;
  generateWaveform: (audioBuffer: AudioBuffer) => Float32Array;
  
  // 音频转换
  convertFormat: (file: File, targetFormat: string) => Promise<Blob>;
  resampleAudio: (audioBuffer: AudioBuffer, targetSampleRate: number) => AudioBuffer;
  normalizeAudio: (audioBuffer: AudioBuffer) => AudioBuffer;
  
  // 音量处理
  calculateRMS: (audioBuffer: AudioBuffer) => number;
  calculatePeakLevel: (audioBuffer: AudioBuffer) => number;
  applyGain: (audioBuffer: AudioBuffer, gain: number) => AudioBuffer;
}

// 音频元数据
interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string;
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
  format: string;
  fileSize: number;
}

// 音频分析结果
interface AudioAnalysis {
  tempo: number;
  key: string;
  loudness: number;
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
  
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlatness: number;
  mfcc: number[];
  
  peaks: number[];
  beats: number[];
  segments: Array<{
    start: number;
    duration: number;
    loudness: number;
  }>;
}
```

### 网络请求工具
```typescript
interface NetworkUtils {
  // HTTP请求
  get: <T>(url: string, options?: RequestOptions) => Promise<ApiResponse<T>>;
  post: <T>(url: string, data: any, options?: RequestOptions) => Promise<ApiResponse<T>>;
  put: <T>(url: string, data: any, options?: RequestOptions) => Promise<ApiResponse<T>>;
  delete: <T>(url: string, options?: RequestOptions) => Promise<ApiResponse<T>>;
  
  // 文件上传
  uploadFile: (file: File, url: string, options?: UploadOptions) => Promise<UploadResponse>;
  
  // 流式请求
  streamRequest: (url: string, onData: (chunk: any) => void) => Promise<void>;
  
  // 健康检查
  healthCheck: (url: string) => Promise<HealthCheckResult>;
}

// 请求选项
interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  signal?: AbortSignal;
}

// API响应
interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  timestamp: Date;
}

// 上传选项
interface UploadOptions extends RequestOptions {
  onProgress?: (progress: number) => void;
  chunkSize?: number;
  allowResume?: boolean;
}

// 上传响应
interface UploadResponse {
  success: boolean;
  fileId?: string;
  url?: string;
  metadata?: any;
  error?: string;
}

// 健康检查结果
interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  timestamp: Date;
  details?: {
    database?: boolean;
    cache?: boolean;
    externalAPIs?: boolean;
  };
}
```

### 存储工具
```typescript
interface StorageUtils {
  // 本地存储
  setItem: (key: string, value: any, expiry?: Date) => void;
  getItem: <T>(key: string) => T | null;
  removeItem: (key: string) => void;
  clear: () => void;
  keys: () => string[];
  
  // 会话存储
  setSessionItem: (key: string, value: any) => void;
  getSessionItem: <T>(key: string) => T | null;
  removeSessionItem: (key: string) => void;
  clearSession: () => void;
  
  // IndexedDB
  openDatabase: (name: string, version: number) => Promise<IDBDatabase>;
  storeData: (storeName: string, data: any) => Promise<void>;
  getData: <T>(storeName: string, key: string) => Promise<T | null>;
  deleteData: (storeName: string, key: string) => Promise<void>;
  
  // 缓存管理
  setCache: (key: string, data: any, ttl?: number) => void;
  getCache: <T>(key: string) => T | null;
  invalidateCache: (pattern?: string) => void;
}
```

---

## 📚 使用示例

### 基本组件使用
```typescript
// 应用主组件
function App() {
  const [appState, setAppState] = useState<AppState>({
    isWelcomeMode: true,
    isInitialized: false,
    language: getSystemLanguage(),
    showRadio: false,
    syncActive: false
  });

  const t = getTranslations(appState.language);

  return (
    <div className="app">
      <BackgroundManager
        enablePreload={true}
        debugMode={false}
        onBackgroundChange={(bg) => console.log('背景切换:', bg.name)}
      />
      
      {appState.showRadio && (
        <TiangongRadioPlayer
          language={appState.language}
          syncActive={appState.syncActive}
          onSyncToggle={() => setAppState(prev => ({ 
            ...prev, 
            syncActive: !prev.syncActive 
          }))}
          onClose={() => setAppState(prev => ({ 
            ...prev, 
            showRadio: false 
          }))}
        />
      )}
    </div>
  );
}
```

### 自定义Hook使用
```typescript
// 音频播放器Hook
function useAudioPlayer(track: Track) {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1
  });

  const play = useCallback(async () => {
    // 播放逻辑
  }, [track]);

  const pause = useCallback(() => {
    // 暂停逻辑
  }, []);

  return {
    ...state,
    play,
    pause,
    setVolume: (volume: number) => setState(prev => ({ ...prev, volume }))
  };
}
```

---

*文档版本: v2.1.0*  
*最后更新: 2025-01-25*  
*维护者: 天宫科技 - 麻蛇*