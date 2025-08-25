import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

/**
 * ============================================================================
 * 天宫科技银色主题UI展示页面 v4.0
 * Tiangong Technology Silver Theme UI Showcase
 * ============================================================================
 * 
 * 🎯 目的: 纯UI逻辑展示页面，用于前后端接口对接和设计验证
 * 🔧 状态: 仅包含UI逻辑，所有实际功能通过注释标记后端接口需求
 * 📋 用途: 后端开发团队参考，前端设计验证，接口规范制定
 * 
 * ============================================================================
 * 🔌 后端接口依赖总览 (Backend API Dependencies Overview)
 * ============================================================================
 * 
 * 1. 🎵 音频服务 (Audio Service) - Termusic Integration
 *    - 端口: 7533
 *    - 协议: HTTP REST API + WebSocket
 *    - 功能: 音频播放控制、元数据获取、波形数据
 * 
 * 2. 🎨 背景管理服务 (Background Management Service)
 *    - 存储: LocalStorage + 可选云端同步
 *    - 功能: Shader背景循环、偏好设置
 * 
 * 3. 📊 数据服务 (Data Service)
 *    - 功能: 音乐库管理、播放列表、用户偏好
 *    - 存储: SQLite/PostgreSQL
 * 
 * 4. 🌐 本地化服务 (Localization Service)
 *    - 功能: 多语言支持、区域设置
 * 
 * 5. 📡 实时通信服务 (Real-time Communication)
 *    - 协议: WebSocket
 *    - 功能: 状态同步、实时更新
 * 
 * ============================================================================
 * 🎨 UI组件层级结构 (UI Component Hierarchy)
 * ============================================================================
 * 
 * TiangongUIShowcase (Root)
 * ├── BackgroundShowcase (背景展示)
 * ├── WelcomeModeShowcase (欢迎模式)
 * │   ├── TimeDisplayShowcase (时钟显示)
 * │   ├── SpaceStationStatusShowcase (卫星状态)
 * │   └── KeyboardHintShowcase (键盘提示)
 * ├── ConsoleModeShowcase (控制台模式)
 * │   ├── TimeDisplayMini (迷你时钟)
 * │   ├── MusicOrganizerShowcase (音乐组织器)
 * │   ├── TaskLoggerShowcase (任务日志)
 * │   └── RadioPlayerShowcase (电台播放器)
 * └── ControlPanelShowcase (控制面板)
 *     ├── RadioToggleButton (电台切换)
 *     ├── LanguageToggleButton (语言切换)
 *     ├── BackgroundSwitchButton (背景切换)
 *     └── VisualizerButton (可视化器)
 * 
 * ============================================================================
 * 📱 响应式断点系统 (Responsive Breakpoints)
 * ============================================================================
 * 
 * - Mobile: 320px - 768px (移动端)
 * - Tablet: 768px - 1024px (平板)
 * - Desktop: 1024px+ (桌面端)
 * - Large: 1440px+ (大屏幕)
 * - Ultra: 1920px+ (超大屏幕)
 * 
 * ============================================================================
 * 🔄 状态管理系统 (State Management System)
 * ============================================================================
 * 
 * AppState: 应用主状态
 * UIState: UI交互状态  
 * AudioState: 音频播放状态
 * ThemeState: 主题配置状态
 * LocalizationState: 本地化状态
 * 
 * @version 4.0.0
 * @author 天宫科技 - 麻蛇
 * @since 2025-01-25
 * @updated 2025-01-25 - UI展示页面首次创建
 */

// ============================================================================
// 🔧 类型定义 (Type Definitions)
// ============================================================================

interface UIShowcaseState {
  // 应用模式状态
  isWelcomeMode: boolean;
  isInitialized: boolean;
  
  // 语言和本地化
  language: 'zh' | 'en';
  
  // UI组件状态
  showRadio: boolean;
  showMusicOrganizer: boolean;
  showTaskLogger: boolean;
  
  // 音频相关状态
  audioPlaying: boolean;
  currentTrack: AudioTrack | null;
  volume: number;
  
  // 同步和连接状态
  syncActive: boolean;
  backendConnected: boolean;
  
  // 背景和主题
  currentShaderIndex: number;
  themeMode: 'auto' | 'dark' | 'light';
}

interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  currentTime: number;
  url: string;
  metadata?: {
    genre?: string;
    year?: number;
    bitrate?: number;
    sampleRate?: number;
  };
}

interface BackendStatus {
  termusic: {
    connected: boolean;
    port: number;
    version?: string;
    lastPing?: number;
  };
  database: {
    connected: boolean;
    type: 'sqlite' | 'postgresql';
    size?: number;
  };
  websocket: {
    connected: boolean;
    endpoint: string;
    reconnectAttempts: number;
  };
}

// ============================================================================
// 🌐 模拟翻译系统 (Mock Translation System)
// ============================================================================

const mockTranslations = {
  zh: {
    tiangongRadio: "天宫电台",
    language: "语言切换",
    switchBackground: "切换背景",
    musicVisualizer: "音乐可视化器",
    musicOrganizer: "音乐整理器",
    taskLogger: "任务日志",
    spaceStation: "空间站状态",
    quickEnter: "快速进入",
    currentlyPlaying: "正在播放",
    volume: "音量",
    sync: "同步",
    connect: "连接",
    disconnect: "断开",
    loading: "加载中...",
    error: "错误",
    success: "成功",
    retry: "重试"
  },
  en: {
    tiangongRadio: "Tiangong Radio",
    language: "Language",
    switchBackground: "Switch Background",
    musicVisualizer: "Music Visualizer",
    musicOrganizer: "Music Organizer",
    taskLogger: "Task Logger",
    spaceStation: "Space Station",
    quickEnter: "Quick Enter",
    currentlyPlaying: "Now Playing",
    volume: "Volume",
    sync: "Sync",
    connect: "Connect",
    disconnect: "Disconnect",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    retry: "Retry"
  }
};

// ============================================================================
// 🎨 银色主题配色常量 (Silver Theme Color Constants)
// ============================================================================

const SilverTheme = {
  colors: {
    primary: '#c0c5ce',
    secondary: '#a8b2c4',
    tertiary: '#9399a8',
    
    primaryAlpha: {
      5: 'rgba(192, 197, 206, 0.05)',
      10: 'rgba(192, 197, 206, 0.1)',
      15: 'rgba(192, 197, 206, 0.15)',
      20: 'rgba(192, 197, 206, 0.2)',
      30: 'rgba(192, 197, 206, 0.3)',
      40: 'rgba(192, 197, 206, 0.4)',
      60: 'rgba(192, 197, 206, 0.6)',
      80: 'rgba(192, 197, 206, 0.8)'
    },
    
    status: {
      sync: 'rgba(255, 193, 7, 0.35)',
      active: 'rgba(34, 197, 94, 0.8)',
      error: 'rgba(220, 38, 38, 0.8)',
      warning: 'rgba(251, 191, 36, 0.8)'
    }
  },
  
  fonts: {
    mono: "'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace",
    body: "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif",
    heading: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px'
  },
  
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px'
  },
  
  transitions: {
    fast: 'all 0.12s cubic-bezier(0.4, 0, 0.2, 1)',
    medium: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    slow: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  }
} as const;

// ============================================================================
// 🔌 后端接口模拟层 (Backend API Mock Layer)
// ============================================================================

/**
 * 🎵 音频服务接口 (Audio Service Interface)
 * 
 * TODO: 替换为实际的Termusic REST API调用
 * 端口: 7533
 * 基础URL: http://localhost:7533/api/v1
 */
class AudioServiceMock {
  static async getCurrentTrack(): Promise<AudioTrack | null> {
    // TODO: 实现 GET /api/v1/current-track
    console.log('🔌 [MOCK] AudioService.getCurrentTrack() - 需要后端实现');
    
    // 模拟返回数据
    return {
      id: 'track_001',
      title: '银色星云',
      artist: '天宫乐团',
      album: '宇宙交响曲',
      duration: 245,
      currentTime: 67,
      url: 'http://localhost:7533/stream/track_001',
      metadata: {
        genre: 'Electronic',
        year: 2025,
        bitrate: 320,
        sampleRate: 44100
      }
    };
  }
  
  static async play(trackId?: string): Promise<void> {
    // TODO: 实现 POST /api/v1/play
    console.log('🔌 [MOCK] AudioService.play() - 需要后端实现', { trackId });
  }
  
  static async pause(): Promise<void> {
    // TODO: 实现 POST /api/v1/pause
    console.log('🔌 [MOCK] AudioService.pause() - 需要后端实现');
  }
  
  static async setVolume(volume: number): Promise<void> {
    // TODO: 实现 POST /api/v1/volume
    console.log('🔌 [MOCK] AudioService.setVolume() - 需要后端实现', { volume });
  }
  
  static async getWaveformData(trackId: string, startTime: number, duration: number): Promise<Float32Array> {
    // TODO: 实现 GET /api/v1/waveform/{trackId}?start={startTime}&duration={duration}
    console.log('🔌 [MOCK] AudioService.getWaveformData() - 需要后端实现', { trackId, startTime, duration });
    
    // 模拟波形数据 (10秒窗口)
    const samples = new Float32Array(1024);
    for (let i = 0; i < samples.length; i++) {
      samples[i] = Math.sin(i * 0.1) * Math.random() * 0.5;
    }
    return samples;
  }
}

/**
 * 📊 数据服务接口 (Data Service Interface)
 * 
 * TODO: 实现音乐库管理、播放列表等数据操作
 */
class DataServiceMock {
  static async getMusicLibrary(): Promise<AudioTrack[]> {
    // TODO: 实现 GET /api/v1/library
    console.log('🔌 [MOCK] DataService.getMusicLibrary() - 需要后端实现');
    
    return [
      {
        id: 'track_001',
        title: '银色星云',
        artist: '天宫乐团',
        duration: 245,
        currentTime: 0,
        url: 'http://localhost:7533/stream/track_001'
      },
      {
        id: 'track_002', 
        title: '宇宙漫步',
        artist: '天宫乐团',
        duration: 198,
        currentTime: 0,
        url: 'http://localhost:7533/stream/track_002'
      }
    ];
  }
  
  static async saveMusicOrganization(data: any): Promise<void> {
    // TODO: 实现 POST /api/v1/organization
    console.log('🔌 [MOCK] DataService.saveMusicOrganization() - 需要后端实现', data);
  }
  
  static async getTaskLogs(): Promise<any[]> {
    // TODO: 实现 GET /api/v1/tasks
    console.log('🔌 [MOCK] DataService.getTaskLogs() - 需要后端实现');
    
    return [
      {
        id: 'task_001',
        timestamp: Date.now(),
        type: 'INFO',
        message: '音频服务连接成功',
        source: 'AudioService'
      },
      {
        id: 'task_002',
        timestamp: Date.now() - 5000,
        type: 'SUCCESS',
        message: '背景切换完成',
        source: 'BackgroundManager'
      }
    ];
  }
}

/**
 * 🌐 WebSocket连接管理 (WebSocket Connection Manager)
 * 
 * TODO: 实现实时状态同步
 */
class WebSocketManagerMock {
  static connection: WebSocket | null = null;
  
  static connect(): Promise<void> {
    // TODO: 实现 WebSocket连接到 ws://localhost:7533/ws
    console.log('🔌 [MOCK] WebSocketManager.connect() - 需要后端实现');
    
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('🔌 [MOCK] WebSocket连接模拟成功');
        resolve();
      }, 1000);
    });
  }
  
  static disconnect(): void {
    // TODO: 实现WebSocket断开连接
    console.log('🔌 [MOCK] WebSocketManager.disconnect() - 需要后端实现');
  }
  
  static sendMessage(type: string, data: any): void {
    // TODO: 实现WebSocket消息发送
    console.log('🔌 [MOCK] WebSocketManager.sendMessage() - 需要后端实现', { type, data });
  }
}

// ============================================================================
// 🧩 UI组件展示层 (UI Component Showcase Layer)
// ============================================================================

/**
 * 📱 时钟显示组件展示 (Time Display Showcase)
 */
const TimeDisplayShowcase: React.FC<{ isWelcomeMode: boolean; language: string }> = ({ 
  isWelcomeMode, 
  language 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const timeString = currentTime.toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const dateString = currentTime.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return (
    <div className="text-center">
      <div 
        className="font-mono tracking-wider"
        style={{
          fontSize: isWelcomeMode ? '48px' : '18px',
          fontWeight: 300,
          color: SilverTheme.colors.primaryAlpha[80],
          marginBottom: isWelcomeMode ? '12px' : '4px',
          fontFeatureSettings: "'tnum' 1, 'kern' 1",
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        {timeString}
      </div>
      
      {isWelcomeMode && (
        <div 
          className="font-mono tracking-wider uppercase"
          style={{
            fontSize: '14px',
            fontWeight: 400,
            color: SilverTheme.colors.primaryAlpha[60],
            letterSpacing: '0.08em'
          }}
        >
          {dateString}
        </div>
      )}
    </div>
  );
};

/**
 * 🛰️ 空间站状态组件展示 (Space Station Status Showcase)
 */
const SpaceStationStatusShowcase: React.FC<{ language: string }> = ({ language }) => {
  const t = mockTranslations[language as keyof typeof mockTranslations];
  
  // TODO: 连接实际的空间站状态API
  const mockStatus = {
    altitude: 408.2,
    velocity: 27580,
    location: language === 'zh' ? '太平洋上空' : 'Pacific Ocean',
    nextPass: '14:32',
    signal: 'STRONG'
  };
  
  return (
    <div 
      className="p-6 rounded-lg"
      style={{
        background: SilverTheme.colors.primaryAlpha[5],
        border: `1px solid ${SilverTheme.colors.primaryAlpha[15]}`,
        minWidth: '320px'
      }}
    >
      <div 
        className="text-center mb-4 font-mono tracking-wider uppercase"
        style={{
          fontSize: '12px',
          fontWeight: 400,
          color: SilverTheme.colors.primaryAlpha[80],
          letterSpacing: '0.08em'
        }}
      >
        {t.spaceStation}
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span 
            className="font-mono text-xs uppercase tracking-wider"
            style={{ color: SilverTheme.colors.primaryAlpha[60] }}
          >
            {language === 'zh' ? '高度' : 'Altitude'}
          </span>
          <span 
            className="font-mono text-xs"
            style={{ color: SilverTheme.colors.primaryAlpha[80] }}
          >
            {mockStatus.altitude} KM
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span 
            className="font-mono text-xs uppercase tracking-wider"
            style={{ color: SilverTheme.colors.primaryAlpha[60] }}
          >
            {language === 'zh' ? '速度' : 'Velocity'}
          </span>
          <span 
            className="font-mono text-xs"
            style={{ color: SilverTheme.colors.primaryAlpha[80] }}
          >
            {mockStatus.velocity.toLocaleString()} KM/H
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span 
            className="font-mono text-xs uppercase tracking-wider"
            style={{ color: SilverTheme.colors.primaryAlpha[60] }}
          >
            {language === 'zh' ? '位置' : 'Location'}
          </span>
          <span 
            className="font-mono text-xs"
            style={{ color: SilverTheme.colors.primaryAlpha[80] }}
          >
            {mockStatus.location}
          </span>
        </div>
        
        <div className="pt-2 border-t" style={{ borderColor: SilverTheme.colors.primaryAlpha[10] }}>
          <div className="flex items-center justify-center space-x-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ 
                background: SilverTheme.colors.status.active,
                boxShadow: `0 0 8px ${SilverTheme.colors.status.active}`
              }}
            />
            <span 
              className="font-mono text-xs uppercase tracking-wider"
              style={{ color: SilverTheme.colors.primaryAlpha[80] }}
            >
              {language === 'zh' ? '信号良好' : 'Signal Strong'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 🎵 音乐组织器组件展示 (Music Organizer Showcase)
 */
const MusicOrganizerShowcase: React.FC<{ language: string }> = ({ language }) => {
  const t = mockTranslations[language as keyof typeof mockTranslations];
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // TODO: 替换为实际的API调用
    const loadMusicLibrary = async () => {
      try {
        const library = await DataServiceMock.getMusicLibrary();
        setTracks(library);
      } catch (error) {
        console.error('加载音乐库失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMusicLibrary();
  }, []);
  
  const handleTrackSelect = useCallback((track: AudioTrack) => {
    // TODO: 实现音轨选择和播放
    console.log('🔌 [MOCK] 选择音轨:', track.title);
    AudioServiceMock.play(track.id);
  }, []);
  
  if (loading) {
    return (
      <div 
        className="p-6 rounded-lg flex items-center justify-center"
        style={{
          background: SilverTheme.colors.primaryAlpha[5],
          border: `1px solid ${SilverTheme.colors.primaryAlpha[15]}`,
          minHeight: '200px'
        }}
      >
        <div 
          className="font-mono text-sm uppercase tracking-wider"
          style={{ color: SilverTheme.colors.primaryAlpha[60] }}
        >
          {t.loading}
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="p-6 rounded-lg"
      style={{
        background: SilverTheme.colors.primaryAlpha[5],
        border: `1px solid ${SilverTheme.colors.primaryAlpha[15]}`,
        maxHeight: '400px',
        overflowY: 'auto'
      }}
    >
      <div 
        className="mb-4 font-mono tracking-wider uppercase"
        style={{
          fontSize: '12px',
          fontWeight: 400,
          color: SilverTheme.colors.primaryAlpha[80],
          letterSpacing: '0.08em'
        }}
      >
        {t.musicOrganizer}
      </div>
      
      <div className="space-y-2">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="p-3 rounded cursor-pointer transition-all duration-200"
            style={{
              background: SilverTheme.colors.primaryAlpha[5],
              border: `1px solid ${SilverTheme.colors.primaryAlpha[10]}`,
              transition: SilverTheme.transitions.fast
            }}
            onClick={() => handleTrackSelect(track)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = SilverTheme.colors.primaryAlpha[10];
              e.currentTarget.style.borderColor = SilverTheme.colors.primaryAlpha[20];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = SilverTheme.colors.primaryAlpha[5];
              e.currentTarget.style.borderColor = SilverTheme.colors.primaryAlpha[10];
            }}
          >
            <div 
              className="font-mono text-sm"
              style={{ color: SilverTheme.colors.primaryAlpha[80] }}
            >
              {track.title}
            </div>
            <div 
              className="font-mono text-xs mt-1"
              style={{ color: SilverTheme.colors.primaryAlpha[60] }}
            >
              {track.artist} • {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 📋 任务日志组件展示 (Task Logger Showcase)
 */
const TaskLoggerShowcase: React.FC<{ language: string }> = ({ language }) => {
  const t = mockTranslations[language as keyof typeof mockTranslations];
  const [logs, setLogs] = useState<any[]>([]);
  
  useEffect(() => {
    // TODO: 替换为实际的WebSocket连接和日志API
    const loadTaskLogs = async () => {
      try {
        const taskLogs = await DataServiceMock.getTaskLogs();
        setLogs(taskLogs);
      } catch (error) {
        console.error('加载任务日志失败:', error);
      }
    };
    
    loadTaskLogs();
    
    // 模拟新日志添加
    const interval = setInterval(() => {
      const newLog = {
        id: `task_${Date.now()}`,
        timestamp: Date.now(),
        type: ['INFO', 'SUCCESS', 'WARNING'][Math.floor(Math.random() * 3)],
        message: language === 'zh' ? '系统状态正常' : 'System status normal',
        source: 'System'
      };
      
      setLogs(prev => [newLog, ...prev.slice(0, 9)]); // 保持最新10条
    }, 10000);
    
    return () => clearInterval(interval);
  }, [language]);
  
  const getLogColor = (type: string) => {
    switch (type) {
      case 'SUCCESS': return SilverTheme.colors.status.active;
      case 'WARNING': return SilverTheme.colors.status.warning;
      case 'ERROR': return SilverTheme.colors.status.error;
      default: return SilverTheme.colors.primaryAlpha[60];
    }
  };
  
  return (
    <div 
      className="p-4 rounded-lg"
      style={{
        background: SilverTheme.colors.primaryAlpha[5],
        border: `1px solid ${SilverTheme.colors.primaryAlpha[15]}`,
        height: '300px',
        overflowY: 'auto'
      }}
    >
      <div 
        className="mb-3 font-mono tracking-wider uppercase"
        style={{
          fontSize: '11px',
          fontWeight: 400,
          color: SilverTheme.colors.primaryAlpha[80],
          letterSpacing: '0.08em'
        }}
      >
        {t.taskLogger}
      </div>
      
      <div className="space-y-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-2 rounded text-xs"
            style={{
              background: SilverTheme.colors.primaryAlpha[5],
              border: `1px solid ${SilverTheme.colors.primaryAlpha[10]}`
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span 
                className="font-mono text-xs font-semibold"
                style={{ color: getLogColor(log.type) }}
              >
                {log.type}
              </span>
              <span 
                className="font-mono text-xs"
                style={{ color: SilverTheme.colors.primaryAlpha[40] }}
              >
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div 
              className="font-mono text-xs"
              style={{ color: SilverTheme.colors.primaryAlpha[70] }}
            >
              {log.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 📻 电台播放器组件展示 (Radio Player Showcase)
 */
const RadioPlayerShowcase: React.FC<{ 
  language: string; 
  syncActive: boolean; 
  onSyncToggle: () => void;
  onClose: () => void;
}> = ({ language, syncActive, onSyncToggle, onClose }) => {
  const t = mockTranslations[language as keyof typeof mockTranslations];
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [volume, setVolume] = useState(75);
  const [isPlaying, setIsPlaying] = useState(false);
  
  useEffect(() => {
    // TODO: 连接Wavesurfer.js和Termusic后端
    const loadCurrentTrack = async () => {
      try {
        const track = await AudioServiceMock.getCurrentTrack();
        setCurrentTrack(track);
      } catch (error) {
        console.error('获取当前音轨失败:', error);
      }
    };
    
    loadCurrentTrack();
  }, []);
  
  const handlePlayPause = useCallback(async () => {
    try {
      if (isPlaying) {
        await AudioServiceMock.pause();
      } else {
        await AudioServiceMock.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('播放控制失败:', error);
    }
  }, [isPlaying]);
  
  const handleVolumeChange = useCallback(async (newVolume: number) => {
    try {
      await AudioServiceMock.setVolume(newVolume / 100);
      setVolume(newVolume);
    } catch (error) {
      console.error('音量调节失败:', error);
    }
  }, []);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 50, y: 50 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 50, y: 50 }}
      className="fixed bottom-8 right-8 w-80"
      style={{
        background: SilverTheme.colors.primaryAlpha[10],
        border: `1px solid ${SilverTheme.colors.primaryAlpha[20]}`,
        borderRadius: SilverTheme.borderRadius.lg,
        padding: SilverTheme.spacing.lg,
        zIndex: 85,
        boxShadow: `0 8px 32px ${SilverTheme.colors.primaryAlpha[20]}`
      }}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <div 
          className="font-mono text-sm uppercase tracking-wider"
          style={{ color: SilverTheme.colors.primaryAlpha[80] }}
        >
          <div className="flex items-center space-x-2">
            <div className="rotate-90 font-mono text-xs tracking-widest">RADIO</div>
            <div 
              className="w-1 h-4"
              style={{ background: SilverTheme.colors.primaryAlpha[60] }}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Sync按钮 */}
          <button
            onClick={onSyncToggle}
            className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider transition-all duration-300 ${
              syncActive ? 'radio-sync-active' : 'radio-sync-inactive'
            }`}
            style={{
              background: syncActive ? SilverTheme.colors.status.sync : SilverTheme.colors.primaryAlpha[10],
              border: `1px solid ${syncActive ? 'rgba(255, 193, 7, 0.5)' : SilverTheme.colors.primaryAlpha[15]}`,
              color: SilverTheme.colors.primaryAlpha[80]
            }}
          >
            {t.sync}
          </button>
          
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center text-xs font-mono transition-all duration-200"
            style={{
              background: SilverTheme.colors.primaryAlpha[10],
              border: `1px solid ${SilverTheme.colors.primaryAlpha[15]}`,
              color: SilverTheme.colors.primaryAlpha[60]
            }}
          >
            ×
          </button>
        </div>
      </div>
      
      {/* 当前播放信息 */}
      {currentTrack && (
        <div className="mb-4">
          <div 
            className="font-mono text-sm mb-1"
            style={{ color: SilverTheme.colors.primaryAlpha[80] }}
          >
            {currentTrack.title}
          </div>
          <div 
            className="font-mono text-xs"
            style={{ color: SilverTheme.colors.primaryAlpha[60] }}
          >
            {currentTrack.artist}
          </div>
        </div>
      )}
      
      {/* 波形显示区域 - Wavesurfer.js集成点 */}
      <div 
        className="mb-4 rounded"
        style={{
          height: '60px',
          background: SilverTheme.colors.primaryAlpha[5],
          border: `1px solid ${SilverTheme.colors.primaryAlpha[10]}`,
          position: 'relative'
        }}
      >
        {/* TODO: 集成Wavesurfer.js v7 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="font-mono text-xs uppercase tracking-wider"
            style={{ color: SilverTheme.colors.primaryAlpha[40] }}
          >
            {language === 'zh' ? '波形加载中...' : 'Loading Waveform...'}
          </div>
        </div>
        
        {/* 模拟波形条 */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center space-x-1 p-2">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-t"
              style={{
                height: `${Math.random() * 30 + 5}px`,
                background: SilverTheme.colors.primaryAlpha[30],
                opacity: Math.random() * 0.7 + 0.3
              }}
            />
          ))}
        </div>
      </div>
      
      {/* 控制按钮 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePlayPause}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            background: SilverTheme.colors.primaryAlpha[15],
            border: `1px solid ${SilverTheme.colors.primaryAlpha[20]}`,
            color: SilverTheme.colors.primaryAlpha[80]
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        
        <div className="flex-1 mx-4">
          <div 
            className="font-mono text-xs mb-1"
            style={{ color: SilverTheme.colors.primaryAlpha[60] }}
          >
            {t.volume}: {volume}%
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
            className="w-full h-1 rounded-full"
            style={{
              background: SilverTheme.colors.primaryAlpha[20],
              appearance: 'none',
              outline: 'none'
            }}
          />
        </div>
      </div>
      
      {/* 状态指示器 */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ 
              background: syncActive ? SilverTheme.colors.status.sync : SilverTheme.colors.primaryAlpha[40]
            }}
          />
          <span 
            className="font-mono uppercase tracking-wider"
            style={{ color: SilverTheme.colors.primaryAlpha[60] }}
          >
            {syncActive ? (language === 'zh' ? '同步中' : 'Syncing') : (language === 'zh' ? '本地' : 'Local')}
          </span>
        </div>
        
        <div 
          className="font-mono uppercase tracking-wider"
          style={{ color: SilverTheme.colors.primaryAlpha[40] }}
        >
          TIANGONG RADIO
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// 🏗️ 主展示组件 (Main Showcase Component)  
// ============================================================================

export const TiangongUIShowcase: React.FC = () => {
  // 状态管理
  const [uiState, setUIState] = useState<UIShowcaseState>({
    isWelcomeMode: true,
    isInitialized: false,
    language: 'zh',
    showRadio: false,
    showMusicOrganizer: true,
    showTaskLogger: true,
    audioPlaying: false,
    currentTrack: null,
    volume: 75,
    syncActive: false,
    backendConnected: false,
    currentShaderIndex: 0,
    themeMode: 'dark'
  });
  
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    termusic: { connected: false, port: 7533 },
    database: { connected: false, type: 'sqlite' },
    websocket: { connected: false, endpoint: 'ws://localhost:7533/ws', reconnectAttempts: 0 }
  });
  
  const t = mockTranslations[uiState.language];
  
  // 初始化
  useEffect(() => {
    console.log('🚀 天宫科技UI展示页面初始化开始');
    
    // 模拟初始化过程
    const initializeApp = async () => {
      try {
        // TODO: 连接后端服务
        console.log('🔌 [MOCK] 连接Termusic服务...');
        await WebSocketManagerMock.connect();
        
        console.log('🔌 [MOCK] 加载用户偏好...');
        // 模拟加载偏好设置
        
        console.log('🔌 [MOCK] 初始化音频系统...');
        // 模拟音频系统初始化
        
        setBackendStatus(prev => ({
          ...prev,
          termusic: { ...prev.termusic, connected: true },
          database: { ...prev.database, connected: true },
          websocket: { ...prev.websocket, connected: true }
        }));
        
        setUIState(prev => ({ ...prev, isInitialized: true, backendConnected: true }));
        
        console.log('✅ 天宫科技UI展示页面初始化完成');
      } catch (error) {
        console.error('❌ 初始化失败:', error);
        setUIState(prev => ({ ...prev, isInitialized: true }));
      }
    };
    
    // 设置基本样式
    document.documentElement.classList.add("dark");
    document.body.style.backgroundColor = "#000000";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    
    setTimeout(initializeApp, 500);
  }, []);
  
  // 事件处理器
  const handleWelcomeModeToggle = useCallback(() => {
    console.log('🎯 切换欢迎模式');
    setUIState(prev => ({ 
      ...prev, 
      isWelcomeMode: !prev.isWelcomeMode,
      showRadio: !prev.isWelcomeMode ? true : prev.showRadio
    }));
  }, []);
  
  const handleLanguageToggle = useCallback(() => {
    console.log('🌐 切换语言');
    setUIState(prev => ({
      ...prev,
      language: prev.language === 'zh' ? 'en' : 'zh'
    }));
  }, []);
  
  const handleBackgroundSwitch = useCallback(() => {
    console.log('🎨 切换背景');
    setUIState(prev => ({
      ...prev,
      currentShaderIndex: (prev.currentShaderIndex + 1) % 5
    }));
  }, []);
  
  const handleSyncToggle = useCallback(() => {
    console.log('🔄 切换同步状态');
    setUIState(prev => ({ ...prev, syncActive: !prev.syncActive }));
    
    // TODO: 实现实际的同步逻辑
    if (!uiState.syncActive) {
      WebSocketManagerMock.sendMessage('sync_start', { timestamp: Date.now() });
    } else {
      WebSocketManagerMock.sendMessage('sync_stop', { timestamp: Date.now() });
    }
  }, [uiState.syncActive]);
  
  const handleMusicVisualizerOpen = useCallback(() => {
    console.log('🎵 打开音乐可视化器');
    
    // TODO: 实现音乐可视化器窗口
    const visualizerUrl = 'http://localhost:8080/visualizer';
    window.open(visualizerUrl, '_blank', 'width=1200,height=800');
  }, []);
  
  // 动画配置
  const animationConfigs = useMemo(() => ({
    buttonHover: {
      scale: 1.05,
      y: -1,
      transition: { type: "spring", stiffness: 600, damping: 15, duration: 0.12 }
    },
    buttonTap: {
      scale: 0.95,
      transition: { type: "spring", stiffness: 800, damping: 20, duration: 0.08 }
    }
  }), []);
  
  // 早期返回 - 未初始化状态
  if (!uiState.isInitialized) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div 
            className="text-white/70 text-sm animate-pulse mb-4 font-mono tracking-wider uppercase"
            style={{ letterSpacing: '0.1em' }}
          >
            {uiState.language === 'zh' ? '天宫科技UI系统初始化中...' : 'Tiangong UI System Initializing...'}
          </div>
          
          {/* 初始化状态指示器 */}
          <div className="flex items-center justify-center space-x-4 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <div 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: SilverTheme.colors.status.warning }}
              />
              <span style={{ color: SilverTheme.colors.primaryAlpha[60] }}>
                {uiState.language === 'zh' ? '后端连接' : 'Backend'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: SilverTheme.colors.status.warning }}
              />
              <span style={{ color: SilverTheme.colors.primaryAlpha[60] }}>
                {uiState.language === 'zh' ? '音频系统' : 'Audio'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: SilverTheme.colors.status.warning }}
              />
              <span style={{ color: SilverTheme.colors.primaryAlpha[60] }}>
                {uiState.language === 'zh' ? 'UI组件' : 'UI Components'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 🎨 背景展示区域 */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${SilverTheme.colors.primaryAlpha[5]} 0%, transparent 50%, ${SilverTheme.colors.primaryAlpha[10]} 100%)`,
          zIndex: 0
        }}
      >
        {/* TODO: 集成实际的BackgroundManager组件 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="font-mono text-xs uppercase tracking-wider opacity-30"
            style={{ color: SilverTheme.colors.primaryAlpha[40] }}
          >
            Shader {uiState.currentShaderIndex + 1} / 5 - {uiState.language === 'zh' ? '背景渲染中' : 'Background Rendering'}
          </div>
        </div>
      </div>
      
      {/* 时钟模块 */}
      <motion.div
        className={`absolute ${
          uiState.isWelcomeMode 
            ? 'left-1/2 top-32 transform -translate-x-1/2' 
            : 'left-8 top-8'
        }`}
        style={{
          cursor: 'pointer',
          zIndex: uiState.isWelcomeMode ? 70 : 60,
          pointerEvents: 'auto'
        }}
        onClick={handleWelcomeModeToggle}
        animate={uiState.isWelcomeMode ? {
          x: '0%',
          y: 0
        } : {
          x: 0,
          y: 0
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
      >
        <motion.div
          className={`${
            uiState.isWelcomeMode ? 'px-10 py-8' : 'px-4 py-3'
          }`}
          style={{
            minWidth: uiState.isWelcomeMode ? 'auto' : '140px',
            minHeight: uiState.isWelcomeMode ? 'auto' : '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: uiState.isWelcomeMode ? 'transparent' : SilverTheme.colors.primaryAlpha[5],
            borderRadius: uiState.isWelcomeMode ? 0 : SilverTheme.borderRadius.lg,
            border: uiState.isWelcomeMode ? 'none' : `1px solid ${SilverTheme.colors.primaryAlpha[15]}`,
            transition: SilverTheme.transitions.fast
          }}
        >
          <TimeDisplayShowcase 
            isWelcomeMode={uiState.isWelcomeMode} 
            language={uiState.language}
          />
        </motion.div>
      </motion.div>
      
      {/* 欢迎模式内容 */}
      <AnimatePresence>
        {uiState.isWelcomeMode && (
          <>
            {/* 空间站状态 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                transition: { delay: 1.2, duration: 0.6 }
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.1,
                x: uiState.language === 'zh' ? -520 : -440,
                y: -200,
                transition: { duration: 0.4 }
              }}
              className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{ zIndex: 40 }}
            >
              <SpaceStationStatusShowcase language={uiState.language} />
            </motion.div>
            
            {/* 键盘提示 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { delay: 2.0, duration: 0.5 }
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.1,
                x: uiState.language === 'zh' ? -520 : -440,
                y: -300,
                transition: { duration: 0.4 }
              }}
              className="fixed bottom-24 left-1/2 transform -translate-x-1/2 text-center max-w-md"
              style={{ zIndex: 50 }}
            >
              <div className="flex items-center justify-center space-x-3">
                <div className="flex items-center space-x-1">
                  <kbd 
                    className="px-2 py-1 rounded text-xs border font-mono"
                    style={{
                      background: SilverTheme.colors.primaryAlpha[10],
                      borderColor: SilverTheme.colors.primaryAlpha[20],
                      color: SilverTheme.colors.primaryAlpha[80]
                    }}
                  >
                    SPACE
                  </kbd>
                  <span style={{ color: SilverTheme.colors.primaryAlpha[60] }}>OR</span>
                  <kbd 
                    className="px-2 py-1 rounded text-xs border font-mono"
                    style={{
                      background: SilverTheme.colors.primaryAlpha[10],
                      borderColor: SilverTheme.colors.primaryAlpha[20],
                      color: SilverTheme.colors.primaryAlpha[80]
                    }}
                  >
                    ENTER
                  </kbd>
                </div>
                <span style={{ color: SilverTheme.colors.primaryAlpha[60] }}>•</span>
                <span 
                  className="font-mono text-xs uppercase tracking-wider"
                  style={{ color: SilverTheme.colors.primaryAlpha[60] }}
                >
                  {t.quickEnter}
                </span>
              </div>
            </motion.div>
            
            {/* 欢迎模式覆盖层 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 cursor-pointer"
              style={{ 
                zIndex: 10,
                pointerEvents: 'auto'
              }}
              onClick={handleWelcomeModeToggle}
            />
          </>
        )}
      </AnimatePresence>
      
      {/* 控制台模式内容 */}
      <AnimatePresence>
        {!uiState.isWelcomeMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="absolute inset-0 overflow-hidden"
            style={{ zIndex: 20 }}
          >
            {/* 音乐组织器 */}
            {uiState.showMusicOrganizer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute left-52 right-80 top-20 bottom-8 overflow-auto"
                style={{ zIndex: 25 }}
              >
                <MusicOrganizerShowcase language={uiState.language} />
              </motion.div>
            )}
            
            {/* 任务日志 */}
            {uiState.showTaskLogger && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.35 }}
                className="fixed right-8 top-40 bottom-40 w-64"
                style={{ zIndex: 30 }}
              >
                <TaskLoggerShowcase language={uiState.language} />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 右上角控制面板 */}
      <div className="fixed top-8 right-8 flex items-center space-x-4" style={{ zIndex: 90 }}>
        {/* 电台切换按钮 */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          whileHover={animationConfigs.buttonHover}
          whileTap={animationConfigs.buttonTap}
          onClick={() => setUIState(prev => ({ ...prev, showRadio: !prev.showRadio }))}
          className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer"
          style={{
            background: SilverTheme.colors.primaryAlpha[8],
            border: `1px solid ${SilverTheme.colors.primaryAlpha[15]}`,
            color: SilverTheme.colors.primaryAlpha[80],
            transition: SilverTheme.transitions.fast
          }}
          title={t.tiangongRadio}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 6h-2.28l.9-2.7L17.3 3l-1.02 3.04c-1.1-.08-2.24-.04-3.37.15C11.24 6.5 9.64 7.13 8.23 8c-.49.3-1.03.7-1.52 1.14L5.1 7.52 3.7 8.9l1.62 1.63c-.9 1.13-1.6 2.39-2 3.76-.41 1.4-.51 2.88-.3 4.32h1.9c-.15-1.2-.08-2.4.2-3.54.28-1.14.79-2.22 1.49-3.16l2.1 2.1c.95-.65 2.03-1.13 3.17-1.4 1.14-.28 2.34-.35 3.54-.2V18h2V8c1.1 0 2-.9 2-2z"/>
          </svg>
        </motion.button>
        
        {/* 语言切换按钮 */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          whileHover={animationConfigs.buttonHover}
          whileTap={animationConfigs.buttonTap}
          onClick={handleLanguageToggle}
          className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer"
          style={{
            background: SilverTheme.colors.primaryAlpha[8],
            border: `1px solid ${SilverTheme.colors.primaryAlpha[15]}`,
            color: SilverTheme.colors.primaryAlpha[80],
            transition: SilverTheme.transitions.fast
          }}
          title={t.language}
        >
          <div className="font-mono text-xs tracking-wider">
            {uiState.language === 'zh' ? 'EN' : '中'}
          </div>
        </motion.button>
        
        {/* 背景切换按钮 */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          whileHover={animationConfigs.buttonHover}
          whileTap={animationConfigs.buttonTap}
          onClick={handleBackgroundSwitch}
          className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer"
          style={{
            background: SilverTheme.colors.primaryAlpha[8],
            border: `1px solid ${SilverTheme.colors.primaryAlpha[15]}`,
            color: SilverTheme.colors.primaryAlpha[80],
            transition: SilverTheme.transitions.fast
          }}
          title={t.switchBackground}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9l-5.91 8.74L12 22l-4.09-4.26L2 9l6.91-.74L12 2z"/>
          </svg>
        </motion.button>
        
        {/* 音乐可视化器按钮 */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          whileHover={animationConfigs.buttonHover}
          whileTap={animationConfigs.buttonTap}
          onClick={handleMusicVisualizerOpen}
          className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer"
          style={{
            background: SilverTheme.colors.primaryAlpha[8],
            border: `1px solid ${SilverTheme.colors.primaryAlpha[15]}`,
            color: SilverTheme.colors.primaryAlpha[80],
            transition: SilverTheme.transitions.fast
          }}
          title={t.musicVisualizer}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            <path d="M8 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            <circle cx="10" cy="17" r="1"/>
            <circle cx="14" cy="11" r="1"/>
            <circle cx="18" cy="7" r="1"/>
          </svg>
        </motion.button>
      </div>
      
      {/* 电台播放器浮窗 */}
      <AnimatePresence>
        {uiState.showRadio && (
          <RadioPlayerShowcase 
            language={uiState.language}
            syncActive={uiState.syncActive}
            onSyncToggle={handleSyncToggle}
            onClose={() => setUIState(prev => ({ ...prev, showRadio: false }))}
          />
        )}
      </AnimatePresence>
      
      {/* 后端连接状态指示器 */}
      <div 
        className="fixed bottom-4 left-4 flex items-center space-x-4"
        style={{ zIndex: 5 }}
      >
        <div className="flex items-center space-x-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ 
              background: backendStatus.termusic.connected 
                ? SilverTheme.colors.status.active 
                : SilverTheme.colors.status.error
            }}
          />
          <span 
            className="font-mono text-xs uppercase tracking-wider"
            style={{ color: SilverTheme.colors.primaryAlpha[60] }}
          >
            Termusic:{backendStatus.termusic.port}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ 
              background: backendStatus.websocket.connected 
                ? SilverTheme.colors.status.active 
                : SilverTheme.colors.status.error
            }}
          />
          <span 
            className="font-mono text-xs uppercase tracking-wider"
            style={{ color: SilverTheme.colors.primaryAlpha[60] }}
          >
            WebSocket
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ 
              background: backendStatus.database.connected 
                ? SilverTheme.colors.status.active 
                : SilverTheme.colors.status.error
            }}
          />
          <span 
            className="font-mono text-xs uppercase tracking-wider"
            style={{ color: SilverTheme.colors.primaryAlpha[60] }}
          >
            {backendStatus.database.type.toUpperCase()}
          </span>
        </div>
      </div>
      
      {/* 版权信息 */}
      <div 
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-center"
        style={{ zIndex: 5, opacity: 0.25 }}
      >
        <div 
          className="font-mono text-xs tracking-widest uppercase transition-opacity duration-300 hover:opacity-60"
          style={{ color: SilverTheme.colors.primaryAlpha[40] }}
        >
          @天宫科技 Made By 麻蛇 | UI Showcase v4.0
        </div>
      </div>
      
      {/* TODO注释提示 */}
      <div 
        className="fixed top-4 left-4 font-mono text-xs"
        style={{ 
          zIndex: 100,
          background: SilverTheme.colors.primaryAlpha[10],
          border: `1px solid ${SilverTheme.colors.primaryAlpha[20]}`,
          borderRadius: SilverTheme.borderRadius.sm,
          padding: '8px 12px',
          color: SilverTheme.colors.primaryAlpha[70]
        }}
      >
        <div className="flex items-center space-x-2">
          <div 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: SilverTheme.colors.status.warning }}
          />
          <span className="uppercase tracking-wider">
            UI SHOWCASE MODE
          </span>
        </div>
        <div className="text-xs mt-1" style={{ color: SilverTheme.colors.primaryAlpha[50] }}>
          All functions are mocked for backend integration
        </div>
      </div>
    </div>
  );
};

export default TiangongUIShowcase;

// ============================================================================
// 📋 后端接口清单 (Backend API Checklist)
// ============================================================================

/**
 * 🔌 必需的后端接口实现清单:
 * 
 * ✅ 1. Termusic REST API (端口 7533)
 *    - GET  /api/v1/current-track      - 获取当前播放音轨
 *    - POST /api/v1/play               - 播放音轨
 *    - POST /api/v1/pause              - 暂停播放
 *    - POST /api/v1/volume             - 设置音量
 *    - GET  /api/v1/waveform/{id}      - 获取波形数据
 *    - GET  /api/v1/library            - 获取音乐库
 * 
 * ✅ 2. WebSocket实时通信 (ws://localhost:7533/ws)
 *    - 消息类型: sync_start, sync_stop, track_change, volume_change
 *    - 心跳检测和自动重连机制
 * 
 * ✅ 3. 数据存储API
 *    - GET  /api/v1/organization       - 获取音乐组织数据
 *    - POST /api/v1/organization       - 保存音乐组织数据
 *    - GET  /api/v1/tasks              - 获取任务日志
 *    - POST /api/v1/tasks              - 添加任务日志
 * 
 * ✅ 4. 系统状态API
 *    - GET  /api/v1/status             - 获取系统状态
 *    - GET  /api/v1/health             - 健康检查
 * 
 * ✅ 5. 配置管理API
 *    - GET  /api/v1/config             - 获取配置
 *    - POST /api/v1/config             - 保存配置
 * 
 * 📋 前端已预留的集成点:
 * - AudioServiceMock → 替换为实际的Termusic API调用
 * - DataServiceMock → 替换为实际的数据库操作
 * - WebSocketManagerMock → 替换为实际的WebSocket连接
 * - 所有console.log标记🔌的位置都是需要后端实现的接口调用点
 */