import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BackgroundManager } from "./components/BackgroundManager";
import { getTranslations, getSystemLanguage, getShaderName } from "./components/util/i18n";
import AdvancedMusicOrganizer from "./components/AdvancedMusicOrganizer";
import { TimeDisplay } from "./components/TimeDisplay";
import { TiangongRadioPlayer } from "./components/TiangongRadioPlayer";
import { EnhancedSpaceStationStatus } from "./components/EnhancedSpaceStationStatus";
import { TaskLogger } from "./components/TaskLogger";

/**
 * ============================================================================
 * 天宫科技后端集成UI展示页面 v4.0
 * Tiangong Technology Backend Integration UI Showcase
 * ============================================================================
 * 
 * 🎯 专用于前后端对接的UI展示页面
 * 🔌 包含完整的后端接口规范和配置变量
 * 📋 所有功能均为UI展示，实际逻辑需后端实现
 * 🚀 基于现有App.tsx结构，保持UI一致性
 * 
 * ============================================================================
 * 🔌 后端服务端口配置 (Backend Service Port Configuration)
 * ============================================================================
 * 
 * 主要服务端口分配:
 * - Termusic REST API:     7533 (HTTP)
 * - Termusic WebSocket:    7533 (WS)
 * - 数据库服务:            5432 (PostgreSQL) / 无端口 (SQLite)
 * - 音乐可视化器:          8080 (HTTP)
 * - 前端开发服务器:        5173 (Vite)
 * - 配置管理服务:          8081 (HTTP)
 * - 日志服务:              8082 (HTTP)
 * - 健康检查服务:          8083 (HTTP)
 * 
 * ============================================================================
 * 📡 后端API接口清单 (Backend API Interface List)
 * ============================================================================
 * 
 * 🎵 Termusic音频服务 (端口: 7533):
 * ├── GET    /api/v1/current-track        - 获取当前播放音轨
 * ├── POST   /api/v1/play                 - 播放音轨 {trackId?: string}
 * ├── POST   /api/v1/pause                - 暂停播放
 * ├── POST   /api/v1/stop                 - 停止播放
 * ├── POST   /api/v1/volume               - 设置音量 {volume: number}
 * ├── GET    /api/v1/waveform/{trackId}   - 获取波形数据 (10秒窗口)
 * ├── GET    /api/v1/library              - 获取音乐库
 * ├── GET    /api/v1/playlists            - 获取播放列表
 * ├── POST   /api/v1/playlists            - 创建播放列表
 * ├── GET    /api/v1/status               - 获取播放器状态
 * ├── POST   /api/v1/seek                 - 跳转到指定时间 {time: number}
 * ├── GET    /api/v1/metadata/{trackId}   - 获取音轨元数据
 * └── POST   /api/v1/queue                - 队列管理 {action: string, trackId?: string}
 * 
 * 📊 数据管理服务 (端口: 8081):
 * ├── GET    /api/v1/music/library        - 获取音乐库数据
 * ├── POST   /api/v1/music/library        - 更新音乐库
 * ├── GET    /api/v1/music/organization   - 获取音乐组织数据
 * ├── POST   /api/v1/music/organization   - 保存音乐组织
 * ├── GET    /api/v1/playlists/netease    - 获取网易云音乐播放列表
 * ├── POST   /api/v1/playlists/netease    - 导入网易云音乐播放列表
 * ├── GET    /api/v1/playlists/spotify    - 获取Spotify播放列表
 * ├── POST   /api/v1/playlists/spotify    - 导出到Spotify
 * ├── GET    /api/v1/config               - 获取用户配置
 * ├── POST   /api/v1/config               - 保存用户配置
 * ├── GET    /api/v1/preferences          - 获取用户偏好
 * └── POST   /api/v1/preferences          - 更新用户偏好
 * 
 * 📋 任务日志服务 (端口: 8082):
 * ├── GET    /api/v1/logs                 - 获取系统日志
 * ├── POST   /api/v1/logs                 - 添加日志条目
 * ├── GET    /api/v1/logs/tasks           - 获取任务日志
 * ├── POST   /api/v1/logs/tasks           - 记录任务操作
 * ├── GET    /api/v1/logs/system          - 获取系统运行日志
 * └── DELETE /api/v1/logs/cleanup         - 清理过期日志
 * 
 * 🛰️ 空间站数据服务 (端口: 8083):
 * ├── GET    /api/v1/station/status       - 获取空间站实时状态
 * ├── GET    /api/v1/station/orbit        - 获取轨道数据
 * ├── GET    /api/v1/station/telemetry    - 获取遥测数据
 * └── GET    /api/v1/station/schedule     - 获取过境时刻表
 * 
 * 🎨 背景管理服务:
 * ├── GET    /api/v1/backgrounds          - 获取背景列表
 * ├── POST   /api/v1/backgrounds/switch   - 切换背景
 * ├── GET    /api/v1/backgrounds/current  - 获取当前背景
 * └── POST   /api/v1/backgrounds/preference - 保存背景偏好
 * 
 * 📡 WebSocket实时通信 (端口: 7533/ws):
 * ├── connection                          - WebSocket连接建立
 * ├── track_change                        - 音轨切换事件
 * ├── playback_state                      - 播放状态变化
 * ├── volume_change                       - 音量变化
 * ├── sync_start                          - 开始同步
 * ├── sync_stop                           - 停止同步
 * ├── system_status                       - 系统状态更新
 * ├── log_update                          - 日志更新
 * └── heartbeat                           - 心跳检测
 * 
 * ============================================================================
 * 🔧 配置变量系统 (Configuration Variables System)
 * ============================================================================
 * 
 * 环境变量 (.env文件):
 * TERMUSIC_API_URL=http://localhost:7533          # Termusic API地址
 * TERMUSIC_WS_URL=ws://localhost:7533/ws          # WebSocket地址
 * DATA_SERVICE_URL=http://localhost:8081          # 数据服务地址
 * LOG_SERVICE_URL=http://localhost:8082           # 日志服务地址
 * HEALTH_SERVICE_URL=http://localhost:8083        # 健康检查地址
 * VISUALIZER_URL=http://localhost:8080            # 音乐可视化器地址
 * 
 * DATABASE_TYPE=sqlite                            # 数据库类型: sqlite|postgresql
 * DATABASE_URL=./tiangong.db                      # SQLite路径或PostgreSQL连接串
 * 
 * API_TIMEOUT=30000                               # API超时时间(毫秒)
 * WEBSOCKET_RECONNECT_INTERVAL=5000               # WebSocket重连间隔
 * WEBSOCKET_MAX_RECONNECT_ATTEMPTS=10             # 最大重连次数
 * 
 * LOG_LEVEL=info                                  # 日志级别: debug|info|warn|error
 * LOG_MAX_ENTRIES=1000                            # 最大日志条目数
 * LOG_RETENTION_DAYS=7                            # 日志保留天数
 * 
 * WAVEFORM_WINDOW_SIZE=10                         # 波形窗口大小(秒)
 * WAVEFORM_SAMPLE_RATE=44100                      # 波形采样率
 * WAVEFORM_BUFFER_SIZE=1024                       # 波形缓冲大小
 * 
 * NETEASE_API_KEY=YOUR_NETEASE_API_KEY_HERE       # 网易云音乐API密钥
 * SPOTIFY_CLIENT_ID=YOUR_SPOTIFY_CLIENT_ID_HERE   # Spotify客户端ID  
 * SPOTIFY_CLIENT_SECRET=YOUR_SPOTIFY_SECRET_HERE  # Spotify客户端密钥
 * 
 * STATION_DATA_SOURCE=tle                         # 空间站数据源: tle|api
 * STATION_UPDATE_INTERVAL=300000                  # 空间站数据更新间隔(毫秒)
 * 
 * UI_ANIMATION_ENABLED=true                       # UI动画开关
 * UI_THEME=silver                                 # UI主题: silver|dark|light
 * UI_LANGUAGE=auto                                # UI语言: auto|zh|en
 * 
 * DEBUG_MODE=false                                # 调试模式开关
 * PERFORMANCE_MONITORING=true                     # 性能监控开关
 * ERROR_REPORTING=true                            # 错误报告开关
 * 
 * @version 4.0.0
 * @author 天宫科技 - 麻蛇
 * @since 2025-01-25
 * @updated 2025-01-25 - 后端集成UI展示页面创建
 */

// ============================================================================
// 🔧 配置常量定义 (Configuration Constants)
// ============================================================================

/**
 * 🌐 服务端点配置 (Service Endpoints Configuration)
 * TODO: 这些URL需要根据实际部署环境进行配置
 */
const SERVICE_ENDPOINTS = {
  // Termusic音频服务
  TERMUSIC: {
    BASE_URL: process.env.TERMUSIC_API_URL || 'http://localhost:7533',
    WS_URL: process.env.TERMUSIC_WS_URL || 'ws://localhost:7533/ws',
    API_VERSION: 'v1',
    TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000'),
    
    // API端点定义
    ENDPOINTS: {
      CURRENT_TRACK: '/api/v1/current-track',
      PLAY: '/api/v1/play',
      PAUSE: '/api/v1/pause', 
      STOP: '/api/v1/stop',
      VOLUME: '/api/v1/volume',
      WAVEFORM: '/api/v1/waveform',
      LIBRARY: '/api/v1/library',
      PLAYLISTS: '/api/v1/playlists',
      STATUS: '/api/v1/status',
      SEEK: '/api/v1/seek',
      METADATA: '/api/v1/metadata',
      QUEUE: '/api/v1/queue'
    }
  },
  
  // 数据管理服务
  DATA_SERVICE: {
    BASE_URL: process.env.DATA_SERVICE_URL || 'http://localhost:8081',
    API_VERSION: 'v1',
    TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000'),
    
    ENDPOINTS: {
      MUSIC_LIBRARY: '/api/v1/music/library',
      MUSIC_ORGANIZATION: '/api/v1/music/organization',
      NETEASE_PLAYLISTS: '/api/v1/playlists/netease',
      SPOTIFY_PLAYLISTS: '/api/v1/playlists/spotify',
      CONFIG: '/api/v1/config',
      PREFERENCES: '/api/v1/preferences'
    }
  },
  
  // 日志服务
  LOG_SERVICE: {
    BASE_URL: process.env.LOG_SERVICE_URL || 'http://localhost:8082',
    API_VERSION: 'v1',
    
    ENDPOINTS: {
      LOGS: '/api/v1/logs',
      TASKS: '/api/v1/logs/tasks',
      SYSTEM: '/api/v1/logs/system',
      CLEANUP: '/api/v1/logs/cleanup'
    }
  },
  
  // 健康检查服务
  HEALTH_SERVICE: {
    BASE_URL: process.env.HEALTH_SERVICE_URL || 'http://localhost:8083',
    
    ENDPOINTS: {
      STATION_STATUS: '/api/v1/station/status',
      STATION_ORBIT: '/api/v1/station/orbit',
      STATION_TELEMETRY: '/api/v1/station/telemetry',
      STATION_SCHEDULE: '/api/v1/station/schedule'
    }
  },
  
  // 音乐可视化器
  VISUALIZER: {
    BASE_URL: process.env.VISUALIZER_URL || 'http://localhost:8080',
    WINDOW_OPTIONS: 'width=1200,height=800,resizable=yes,scrollbars=yes'
  }
} as const;

/**
 * 🔗 WebSocket配置 (WebSocket Configuration)
 */
const WEBSOCKET_CONFIG = {
  URL: SERVICE_ENDPOINTS.TERMUSIC.WS_URL,
  RECONNECT_INTERVAL: parseInt(process.env.WEBSOCKET_RECONNECT_INTERVAL || '5000'),
  MAX_RECONNECT_ATTEMPTS: parseInt(process.env.WEBSOCKET_MAX_RECONNECT_ATTEMPTS || '10'),
  HEARTBEAT_INTERVAL: 30000, // 30秒心跳
  
  // 消息类型定义
  MESSAGE_TYPES: {
    CONNECTION: 'connection',
    TRACK_CHANGE: 'track_change',
    PLAYBACK_STATE: 'playback_state', 
    VOLUME_CHANGE: 'volume_change',
    SYNC_START: 'sync_start',
    SYNC_STOP: 'sync_stop',
    SYSTEM_STATUS: 'system_status',
    LOG_UPDATE: 'log_update',
    HEARTBEAT: 'heartbeat'
  }
} as const;

/**
 * 🎵 音频配置 (Audio Configuration)
 */
const AUDIO_CONFIG = {
  WAVEFORM: {
    WINDOW_SIZE: parseInt(process.env.WAVEFORM_WINDOW_SIZE || '10'), // 10秒窗口
    SAMPLE_RATE: parseInt(process.env.WAVEFORM_SAMPLE_RATE || '44100'),
    BUFFER_SIZE: parseInt(process.env.WAVEFORM_BUFFER_SIZE || '1024'),
    UPDATE_INTERVAL: 100, // 100ms更新间隔
    MEMORY_LIMIT: 50 * 1024 * 1024 // 50MB内存限制
  },
  
  FORMATS: {
    SUPPORTED: ['mp3', 'wav', 'ogg', 'flac', 'm4a'],
    PREFERRED: 'mp3'
  },
  
  QUALITY: {
    DEFAULT_BITRATE: 320,
    SAMPLE_RATES: [44100, 48000, 96000],
    CHANNELS: [1, 2] // mono, stereo
  }
} as const;

/**
 * 📊 数据库配置 (Database Configuration)
 */
const DATABASE_CONFIG = {
  TYPE: process.env.DATABASE_TYPE || 'sqlite', // sqlite | postgresql
  URL: process.env.DATABASE_URL || './tiangong.db',
  
  TABLES: {
    TRACKS: 'music_tracks',
    PLAYLISTS: 'playlists',
    USER_PREFERENCES: 'user_preferences',
    SYSTEM_LOGS: 'system_logs',
    TASK_LOGS: 'task_logs'
  },
  
  PERFORMANCE: {
    CONNECTION_POOL_SIZE: 10,
    QUERY_TIMEOUT: 30000,
    IDLE_TIMEOUT: 300000
  }
} as const;

/**
 * 📋 日志配置 (Logging Configuration)
 */
const LOG_CONFIG = {
  LEVEL: process.env.LOG_LEVEL || 'info', // debug | info | warn | error
  MAX_ENTRIES: parseInt(process.env.LOG_MAX_ENTRIES || '1000'),
  RETENTION_DAYS: parseInt(process.env.LOG_RETENTION_DAYS || '7'),
  
  CATEGORIES: {
    SYSTEM: 'SYSTEM',
    AUDIO: 'AUDIO',
    UI: 'UI',
    API: 'API',
    WEBSOCKET: 'WEBSOCKET',
    DATABASE: 'DATABASE'
  },
  
  LEVELS: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  }
} as const;

/**
 * 🌐 第三方API配置 (Third-party API Configuration)
 */
const THIRD_PARTY_CONFIG = {
  NETEASE: {
    API_KEY: process.env.NETEASE_API_KEY || 'YOUR_NETEASE_API_KEY_HERE',
    BASE_URL: 'https://api.music.163.com',
    TIMEOUT: 10000
  },
  
  SPOTIFY: {
    CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || 'YOUR_SPOTIFY_CLIENT_ID_HERE',
    CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || 'YOUR_SPOTIFY_SECRET_HERE',
    REDIRECT_URI: 'http://localhost:5173/callback/spotify',
    SCOPES: [
      'playlist-read-private',
      'playlist-modify-private', 
      'playlist-modify-public',
      'user-library-read'
    ]
  }
} as const;

/**
 * 🛰️ 空间站数据配置 (Space Station Configuration)
 */
const STATION_CONFIG = {
  DATA_SOURCE: process.env.STATION_DATA_SOURCE || 'tle', // tle | api
  UPDATE_INTERVAL: parseInt(process.env.STATION_UPDATE_INTERVAL || '300000'), // 5分钟
  
  TLE_SOURCES: [
    'https://celestrak.com/NORAD/elements/stations.txt',
    'https://www.amsat.org/amsat/ftp/keps/current/nasabare.txt'
  ],
  
  ISS_CATALOG_NUMBER: 25544,
  
  PREDICTION: {
    ELEVATION_THRESHOLD: 10, // 度
    PREDICTION_DAYS: 7,
    MAX_PASSES: 20
  }
} as const;

/**
 * 🎨 UI配置 (UI Configuration)
 */
const UI_CONFIG = {
  ANIMATION_ENABLED: process.env.UI_ANIMATION_ENABLED !== 'false',
  THEME: process.env.UI_THEME || 'silver',
  LANGUAGE: process.env.UI_LANGUAGE || 'auto',
  
  PERFORMANCE: {
    TARGET_FPS: 60,
    ANIMATION_DURATION: {
      FAST: 150,
      MEDIUM: 300,
      SLOW: 500
    }
  },
  
  RESPONSIVE_BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1440,
    LARGE: 1920
  }
} as const;

/**
 * 🐛 调试配置 (Debug Configuration)
 */
const DEBUG_CONFIG = {
  ENABLED: process.env.DEBUG_MODE === 'true',
  PERFORMANCE_MONITORING: process.env.PERFORMANCE_MONITORING !== 'false',
  ERROR_REPORTING: process.env.ERROR_REPORTING !== 'false',
  
  CONSOLE_STYLES: {
    API: 'color: #10b981; font-weight: bold;',
    WEBSOCKET: 'color: #3b82f6; font-weight: bold;',
    AUDIO: 'color: #f59e0b; font-weight: bold;',
    ERROR: 'color: #ef4444; font-weight: bold;',
    SUCCESS: 'color: #22c55e; font-weight: bold;'
  }
} as const;

// ============================================================================
// 🔌 后端接口模拟层 (Backend API Mock Layer)  
// ============================================================================

/**
 * 🎵 Termusic音频服务接口 (Termusic Audio Service Interface)
 * 
 * TODO: 替换所有console.log为实际的HTTP请求
 * 基础URL: http://localhost:7533/api/v1
 */
class TermusicAPI {
  private static baseURL = SERVICE_ENDPOINTS.TERMUSIC.BASE_URL;
  private static timeout = SERVICE_ENDPOINTS.TERMUSIC.TIMEOUT;
  
  /**
   * 获取当前播放音轨
   * GET /api/v1/current-track
   */
  static async getCurrentTrack(): Promise<AudioTrack | null> {
    console.log(`%c[TERMUSIC API]%c GET ${this.baseURL}/api/v1/current-track`, 
      DEBUG_CONFIG.CONSOLE_STYLES.API, '');
    
    // TODO: 实现实际的HTTP请求
    /*
    try {
      const response = await fetch(`${this.baseURL}/api/v1/current-track`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(this.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('获取当前音轨失败:', error);
      throw error;
    }
    */
    
    // 模拟返回数据
    return {
      id: 'track_001',
      title: '银色星云',
      artist: '天宫乐团',
      album: '宇宙交响曲',
      duration: 245,
      currentTime: 67,
      url: `${this.baseURL}/stream/track_001`,
      metadata: {
        genre: 'Electronic',
        year: 2025,
        bitrate: 320,
        sampleRate: 44100,
        format: 'mp3',
        fileSize: 9876543
      }
    };
  }
  
  /**
   * 播放音轨
   * POST /api/v1/play
   */
  static async play(trackId?: string): Promise<void> {
    console.log(`%c[TERMUSIC API]%c POST ${this.baseURL}/api/v1/play`, 
      DEBUG_CONFIG.CONSOLE_STYLES.API, '', { trackId });
    
    // TODO: 实现实际的HTTP请求
    /*
    try {
      const response = await fetch(`${this.baseURL}/api/v1/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId }),
        signal: AbortSignal.timeout(this.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('播放音轨失败:', error);
      throw error;
    }
    */
  }
  
  /**
   * 暂停播放
   * POST /api/v1/pause
   */
  static async pause(): Promise<void> {
    console.log(`%c[TERMUSIC API]%c POST ${this.baseURL}/api/v1/pause`, 
      DEBUG_CONFIG.CONSOLE_STYLES.API, '');
    
    // TODO: 实现实际的HTTP请求
  }
  
  /**
   * 停止播放
   * POST /api/v1/stop
   */
  static async stop(): Promise<void> {
    console.log(`%c[TERMUSIC API]%c POST ${this.baseURL}/api/v1/stop`, 
      DEBUG_CONFIG.CONSOLE_STYLES.API, '');
    
    // TODO: 实现实际的HTTP请求
  }
  
  /**
   * 设置音量
   * POST /api/v1/volume
   */
  static async setVolume(volume: number): Promise<void> {
    console.log(`%c[TERMUSIC API]%c POST ${this.baseURL}/api/v1/volume`, 
      DEBUG_CONFIG.CONSOLE_STYLES.API, '', { volume });
    
    // TODO: 实现实际的HTTP请求
    /*
    try {
      const response = await fetch(`${this.baseURL}/api/v1/volume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume: Math.max(0, Math.min(1, volume)) }),
        signal: AbortSignal.timeout(this.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('设置音量失败:', error);
      throw error;
    }
    */
  }
  
  /**
   * 获取波形数据 (10秒窗口)
   * GET /api/v1/waveform/{trackId}?start={startTime}&duration={duration}
   */
  static async getWaveformData(
    trackId: string, 
    startTime: number, 
    duration: number = AUDIO_CONFIG.WAVEFORM.WINDOW_SIZE
  ): Promise<Float32Array> {
    console.log(`%c[TERMUSIC API]%c GET ${this.baseURL}/api/v1/waveform/${trackId}`, 
      DEBUG_CONFIG.CONSOLE_STYLES.API, '', { startTime, duration });
    
    // TODO: 实现实际的HTTP请求
    /*
    try {
      const response = await fetch(
        `${this.baseURL}/api/v1/waveform/${trackId}?start=${startTime}&duration=${duration}`, {
        method: 'GET',
        headers: { 'Accept': 'application/octet-stream' },
        signal: AbortSignal.timeout(this.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return new Float32Array(arrayBuffer);
    } catch (error) {
      console.error('获取波形数据失败:', error);
      throw error;
    }
    */
    
    // 模拟波形数据 (10秒窗口)
    const samples = new Float32Array(AUDIO_CONFIG.WAVEFORM.BUFFER_SIZE);
    for (let i = 0; i < samples.length; i++) {
      samples[i] = Math.sin(i * 0.1) * Math.random() * 0.5;
    }
    return samples;
  }
  
  /**
   * 获取音乐库
   * GET /api/v1/library
   */
  static async getLibrary(): Promise<AudioTrack[]> {
    console.log(`%c[TERMUSIC API]%c GET ${this.baseURL}/api/v1/library`, 
      DEBUG_CONFIG.CONSOLE_STYLES.API, '');
    
    // TODO: 实现实际的HTTP请求
    
    // 模拟返回数据
    return [
      {
        id: 'track_001',
        title: '银色星云',
        artist: '天宫乐团',
        album: '宇宙交响曲',
        duration: 245,
        currentTime: 0,
        url: `${this.baseURL}/stream/track_001`
      },
      {
        id: 'track_002', 
        title: '宇宙漫步',
        artist: '天宫乐团',
        album: '宇宙交响曲',
        duration: 198,
        currentTime: 0,
        url: `${this.baseURL}/stream/track_002`
      },
      {
        id: 'track_003',
        title: '星际穿越',
        artist: '银河交响乐团',
        album: '深空探索',
        duration: 312,
        currentTime: 0,
        url: `${this.baseURL}/stream/track_003`
      }
    ];
  }
  
  /**
   * 跳转到指定时间
   * POST /api/v1/seek
   */
  static async seek(time: number): Promise<void> {
    console.log(`%c[TERMUSIC API]%c POST ${this.baseURL}/api/v1/seek`, 
      DEBUG_CONFIG.CONSOLE_STYLES.API, '', { time });
    
    // TODO: 实现实际的HTTP请求
  }
  
  /**
   * 获取播放器状态
   * GET /api/v1/status
   */
  static async getStatus(): Promise<PlaybackStatus> {
    console.log(`%c[TERMUSIC API]%c GET ${this.baseURL}/api/v1/status`, 
      DEBUG_CONFIG.CONSOLE_STYLES.API, '');
    
    // TODO: 实现实际的HTTP请求
    
    // 模拟返回数据
    return {
      isPlaying: false,
      currentTrack: null,
      volume: 0.75,
      position: 0,
      duration: 0,
      queue: [],
      repeatMode: 'none',
      shuffleEnabled: false
    };
  }
}

/**
 * 📊 数据管理服务接口 (Data Management Service Interface)
 * 
 * TODO: 替换所有console.log为实际的HTTP请求
 * 基础URL: http://localhost:8081/api/v1
 */
class DataService {
  private static baseURL = SERVICE_ENDPOINTS.DATA_SERVICE.BASE_URL;
  private static timeout = SERVICE_ENDPOINTS.DATA_SERVICE.TIMEOUT;
  
  /**
   * 获取音乐组织数据
   * GET /api/v1/music/organization
   */
  static async getMusicOrganization(): Promise<MusicOrganizationData> {
    console.log(`%c[DATA SERVICE]%c GET ${this.baseURL}/api/v1/music/organization`, 
      DEBUG_CONFIG.CONSOLE_STYLES.API, '');
    
    // TODO: 实现实际的HTTP请求
    /*
    try {
      const response = await fetch(`${this.baseURL}/api/v1/music/organization`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(this.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('获取音乐组织数据失败:', error);
      throw error;
    }
    */
    
    // 模拟返回数据
    return {
      playlists: [
        {
          id: 'playlist_001',
          name: '我的收藏',
          tracks: ['track_001', 'track_002'],
          createdAt: Date.now() - 86400000
        }
      ],
      tags: ['电子', '古典', '摇滚'],
      filters: {
        genre: [],
        year: null,
        artist: null
      },
      lastUpdated: Date.now()
    };
  }
  
  /**
   * 保存音乐组织数据
   * POST /api/v1/music/organization
   */
  static async saveMusicOrganization(data: MusicOrganizationData): Promise<void> {
    console.log(`%c[DATA SERVICE]%c POST ${this.baseURL}/api/v1/music/organization`, 
      DEBUG_CONFIG.CONSOLE_STYLES.API, '', data);
    
    // TODO: 实现实际的HTTP请求
  }
  
  /**
   * 获取网易云音乐播放列表
   * GET /api/v1/playlists/netease
   */
  static async getNeteasePlaylist(playlistId: string): Promise<NeteasePlaylist> {
    console.log(`%c[DATA SERVICE]%c GET ${this.baseURL}/api/v1/playlists/netease?id=${playlistId}`, 
      DEBUG_CONFIG.CONSOLE_STYLES.API, '');
    
    // TODO: 实现实际的网易云API调用
    /*
    try {
      const response = await fetch(`${this.baseURL}/api/v1/playlists/netease?id=${playlistId}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${THIRD_PARTY_CONFIG.NETEASE.API_KEY}`
        },
        signal: AbortSignal.timeout(this.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('获取网易云播放列表失败:', error);
      throw error;
    }
    */
    
    // 模拟返回数据
    return {
      id: playlistId,
      name: '网易云收藏',
      description: '从网易云音乐导入的播放列表',
      tracks: [
        { title: '歌曲1', artist: '艺术家1', duration: 240 },
        { title: '歌曲2', artist: '艺术家2', duration: 200 }
      ],
      totalCount: 2,
      importedAt: Date.now()
    };
  }
  
  /**
   * 导出到Spotify
   * POST /api/v1/playlists/spotify
   */
  static async exportToSpotify(playlist: SpotifyExportData): Promise<SpotifyExportResult> {
    console.log(`%c[DATA SERVICE]%c POST ${this.baseURL}/api/v1/playlists/spotify`, 
      DEBUG_CONFIG.CONSOLE_STYLES.API, '', playlist);
    
    // TODO: 实现实际的Spotify API调用
    /*
    try {
      const response = await fetch(`${this.baseURL}/api/v1/playlists/spotify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${spotifyAccessToken}`
        },
        body: JSON.stringify(playlist),
        signal: AbortSignal.timeout(this.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('导出到Spotify失败:', error);
      throw error;
    }
    */
    
    // 模拟返回数据
    return {
      playlistId: 'spotify_playlist_' + Date.now(),
      url: 'https://open.spotify.com/playlist/mock',
      tracksAdded: playlist.tracks.length,
      tracksFailed: 0,
      exportedAt: Date.now()
    };
  }
  
  /**
   * 获取用户配置
   * GET /api/v1/config
   */
  static async getConfig(): Promise<UserConfig> {
    console.log(`%c[DATA SERVICE]%c GET ${this.baseURL}/api/v1/config`, 
      DEBUG_CONFIG.CONSOLE_STYLES.API, '');
    
    // TODO: 实现实际的HTTP请求
    
    // 模拟返回数据
    return {
      theme: 'silver',
      language: 'zh',
      audioQuality: 'high',
      autoPlay: true,
      notifications: true,
      syncEnabled: false,
      backgroundIndex: 0
    };
  }
  
  /**
   * 保存用户配置
   * POST /api/v1/config
   */
  static async saveConfig(config: UserConfig): Promise<void> {
    console.log(`%c[DATA SERVICE]%c POST ${this.baseURL}/api/v1/config`, 
      DEBUG_CONFIG.CONSOLE_STYLES.API, '', config);
    
    // TODO: 实现实际的HTTP请求
  }
}

/**
 * 📋 任务日志服务接口 (Task Logger Service Interface)
 * 
 * TODO: 替换所有console.log为实际的HTTP请求
 * 基础URL: http://localhost:8082/api/v1
 */
class LogService {
  private static baseURL = SERVICE_ENDPOINTS.LOG_SERVICE.BASE_URL;
  
  /**
   * 获取任务日志
   * GET /api/v1/logs/tasks
   */
  static async getTaskLogs(limit: number = LOG_CONFIG.MAX_ENTRIES): Promise<TaskLog[]> {
    console.log(`%c[LOG SERVICE]%c GET ${this.baseURL}/api/v1/logs/tasks?limit=${limit}`, 
      DEBUG_CONFIG.CONSOLE_STYLES.API, '');
    
    // TODO: 实现实际的HTTP请求
    /*
    try {
      const response = await fetch(`${this.baseURL}/api/v1/logs/tasks?limit=${limit}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('获取任务日志失败:', error);
      throw error;
    }
    */
    
    // 模拟返回数据
    return [
      {
        id: 'task_001',
        timestamp: Date.now(),
        level: 'INFO',
        category: 'AUDIO',
        message: '音频服务连接成功',
        source: 'TermusicAPI',
        details: {
          port: SERVICE_ENDPOINTS.TERMUSIC.BASE_URL,
          responseTime: 125
        }
      },
      {
        id: 'task_002',
        timestamp: Date.now() - 5000,
        level: 'SUCCESS',
        category: 'SYSTEM',
        message: '背景切换完成',
        source: 'BackgroundManager',
        details: {
          fromIndex: 0,
          toIndex: 1,
          duration: 300
        }
      },
      {
        id: 'task_003',
        timestamp: Date.now() - 10000,
        level: 'WARN',
        category: 'WEBSOCKET',
        message: 'WebSocket连接中断，正在重连...',
        source: 'WebSocketManager',
        details: {
          reconnectAttempt: 1,
          maxAttempts: WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS
        }
      }
    ];
  }
  
  /**
   * 添加任务日志
   * POST /api/v1/logs/tasks
   */
  static async addTaskLog(log: Omit<TaskLog, 'id' | 'timestamp'>): Promise<void> {
    console.log(`%c[LOG SERVICE]%c POST ${this.baseURL}/api/v1/logs/tasks`, 
      DEBUG_CONFIG.CONSOLE_STYLES.API, '', log);
    
    // TODO: 实现实际的HTTP请求
  }
  
  /**
   * 清理过期日志
   * DELETE /api/v1/logs/cleanup
   */
  static async cleanupLogs(): Promise<{ deletedCount: number }> {
    console.log(`%c[LOG SERVICE]%c DELETE ${this.baseURL}/api/v1/logs/cleanup`, 
      DEBUG_CONFIG.CONSOLE_STYLES.API, '');
    
    // TODO: 实现实际的HTTP请求
    
    // 模拟返回数据
    return { deletedCount: 45 };
  }
}

/**
 * 🛰️ 空间站数据服务接口 (Space Station Data Service Interface)
 * 
 * TODO: 替换所有console.log为实际的HTTP请求
 * 基础URL: http://localhost:8083/api/v1
 */
class StationService {
  private static baseURL = SERVICE_ENDPOINTS.HEALTH_SERVICE.BASE_URL;
  
  /**
   * 获取空间站实时状态
   * GET /api/v1/station/status
   */
  static async getStationStatus(): Promise<StationStatus> {
    console.log(`%c[STATION SERVICE]%c GET ${this.baseURL}/api/v1/station/status`, 
      DEBUG_CONFIG.CONSOLE_STYLES.API, '');
    
    // TODO: 实现实际的HTTP请求和TLE数据解析
    /*
    try {
      const response = await fetch(`${this.baseURL}/api/v1/station/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('获取空间站状态失败:', error);
      throw error;
    }
    */
    
    // 模拟返回数据
    return {
      altitude: 408.2,
      velocity: 27580,
      location: {
        latitude: 25.2048,
        longitude: 121.6024,
        region: '太平洋上空'
      },
      nextPass: {
        time: Date.now() + 3600000, // 1小时后
        elevation: 45,
        direction: 'SW'
      },
      signal: 'STRONG',
      orbitalPeriod: 93.2,
      apogee: 415.3,
      perigee: 401.1
    };
  }
  
  /**
   * 获取轨道数据
   * GET /api/v1/station/orbit
   */
  static async getOrbitData(): Promise<OrbitData> {
    console.log(`%c[STATION SERVICE]%c GET ${this.baseURL}/api/v1/station/orbit`, 
      DEBUG_CONFIG.CONSOLE_STYLES.API, '');
    
    // TODO: 实现实际的HTTP请求
    
    // 模拟返回数据
    return {
      tle: [
        '1 25544U 98067A   25025.12345678  .00002182  00000-0  40864-4 0  9990',
        '2 25544  51.6461 339.0017 0003572  83.6532 276.4935 15.48919103123456'
      ],
      epoch: Date.now(),
      inclination: 51.6461,
      eccentricity: 0.0003572,
      meanMotion: 15.48919103
    };
  }
}

/**
 * 📡 WebSocket连接管理器 (WebSocket Connection Manager)
 * 
 * TODO: 实现实际的WebSocket连接和消息处理
 */
class WebSocketManager {
  private static connection: WebSocket | null = null;
  private static reconnectAttempts = 0;
  private static heartbeatInterval: NodeJS.Timeout | null = null;
  
  /**
   * 建立WebSocket连接
   */
  static async connect(): Promise<void> {
    console.log(`%c[WEBSOCKET]%c 连接到 ${WEBSOCKET_CONFIG.URL}`, 
      DEBUG_CONFIG.CONSOLE_STYLES.WEBSOCKET, '');
    
    // TODO: 实现实际的WebSocket连接
    /*
    try {
      this.connection = new WebSocket(WEBSOCKET_CONFIG.URL);
      
      this.connection.onopen = this.handleOpen.bind(this);
      this.connection.onmessage = this.handleMessage.bind(this);
      this.connection.onclose = this.handleClose.bind(this);
      this.connection.onerror = this.handleError.bind(this);
      
      // 等待连接建立
      await new Promise((resolve, reject) => {
        if (this.connection) {
          this.connection.onopen = () => {
            this.handleOpen();
            resolve(void 0);
          };
          this.connection.onerror = (error) => {
            this.handleError(error);
            reject(error);
          };
        }
      });
      
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      throw error;
    }
    */
    
    // 模拟连接成功
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`%c[WEBSOCKET]%c 连接成功`, 
          DEBUG_CONFIG.CONSOLE_STYLES.SUCCESS, '');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        resolve();
      }, 1000);
    });
  }
  
  /**
   * 断开WebSocket连接
   */
  static disconnect(): void {
    console.log(`%c[WEBSOCKET]%c 断开连接`, 
      DEBUG_CONFIG.CONSOLE_STYLES.WEBSOCKET, '');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
  }
  
  /**
   * 发送消息
   */
  static sendMessage(type: string, data: any): void {
    console.log(`%c[WEBSOCKET]%c 发送消息 ${type}`, 
      DEBUG_CONFIG.CONSOLE_STYLES.WEBSOCKET, '', data);
    
    // TODO: 实现实际的消息发送
    /*
    if (this.connection && this.connection.readyState === WebSocket.OPEN) {
      const message = {
        type,
        data,
        timestamp: Date.now(),
        id: crypto.randomUUID()
      };
      
      this.connection.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
    */
  }
  
  /**
   * 处理连接打开
   */
  private static handleOpen(): void {
    console.log(`%c[WEBSOCKET]%c 连接已建立`, 
      DEBUG_CONFIG.CONSOLE_STYLES.SUCCESS, '');
    this.reconnectAttempts = 0;
    this.startHeartbeat();
  }
  
  /**
   * 处理接收到的消息
   */
  private static handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      console.log(`%c[WEBSOCKET]%c 收到消息 ${message.type}`, 
        DEBUG_CONFIG.CONSOLE_STYLES.WEBSOCKET, '', message.data);
      
      // TODO: 根据消息类型分发处理
      switch (message.type) {
        case WEBSOCKET_CONFIG.MESSAGE_TYPES.TRACK_CHANGE:
          this.handleTrackChange(message.data);
          break;
        case WEBSOCKET_CONFIG.MESSAGE_TYPES.PLAYBACK_STATE:
          this.handlePlaybackState(message.data);
          break;
        case WEBSOCKET_CONFIG.MESSAGE_TYPES.VOLUME_CHANGE:
          this.handleVolumeChange(message.data);
          break;
        case WEBSOCKET_CONFIG.MESSAGE_TYPES.SYSTEM_STATUS:
          this.handleSystemStatus(message.data);
          break;
        case WEBSOCKET_CONFIG.MESSAGE_TYPES.LOG_UPDATE:
          this.handleLogUpdate(message.data);
          break;
        default:
          console.warn('未知的消息类型:', message.type);
      }
    } catch (error) {
      console.error('解析WebSocket消息失败:', error);
    }
  }
  
  /**
   * 处理连接关闭
   */
  private static handleClose(event: CloseEvent): void {
    console.warn(`%c[WEBSOCKET]%c 连接关闭 (${event.code}): ${event.reason}`, 
      DEBUG_CONFIG.CONSOLE_STYLES.ERROR, '');
    
    this.connection = null;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // 自动重连
    if (this.reconnectAttempts < WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      console.log(`%c[WEBSOCKET]%c 尝试重连 (${this.reconnectAttempts}/${WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS})`, 
        DEBUG_CONFIG.CONSOLE_STYLES.WEBSOCKET, '');
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('重连失败:', error);
        });
      }, WEBSOCKET_CONFIG.RECONNECT_INTERVAL);
    } else {
      console.error(`%c[WEBSOCKET]%c 重连次数已达上限，停止重连`, 
        DEBUG_CONFIG.CONSOLE_STYLES.ERROR, '');
    }
  }
  
  /**
   * 处理连接错误
   */
  private static handleError(event: Event): void {
    console.error(`%c[WEBSOCKET]%c 连接错误`, 
      DEBUG_CONFIG.CONSOLE_STYLES.ERROR, '', event);
  }
  
  /**
   * 开始心跳检测
   */
  private static startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendMessage(WEBSOCKET_CONFIG.MESSAGE_TYPES.HEARTBEAT, {
        timestamp: Date.now()
      });
    }, WEBSOCKET_CONFIG.HEARTBEAT_INTERVAL);
  }
  
  /**
   * 处理音轨变化
   */
  private static handleTrackChange(data: any): void {
    // TODO: 更新UI中的当前音轨信息
    console.log('音轨变化:', data);
  }
  
  /**
   * 处理播放状态变化
   */
  private static handlePlaybackState(data: any): void {
    // TODO: 更新UI中的播放状态
    console.log('播放状态变化:', data);
  }
  
  /**
   * 处理音量变化
   */
  private static handleVolumeChange(data: any): void {
    // TODO: 更新UI中的音量显示
    console.log('音量变化:', data);
  }
  
  /**
   * 处理系统状态更新
   */
  private static handleSystemStatus(data: any): void {
    // TODO: 更新UI中的系统状态
    console.log('系统状态更新:', data);
  }
  
  /**
   * 处理日志更新
   */
  private static handleLogUpdate(data: any): void {
    // TODO: 更新UI中的日志显示
    console.log('日志更新:', data);
  }
}

// ============================================================================
// 🔧 类型定义 (Type Definitions)
// ============================================================================

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
    format?: string;
    fileSize?: number;
  };
}

interface PlaybackStatus {
  isPlaying: boolean;
  currentTrack: AudioTrack | null;
  volume: number;
  position: number;
  duration: number;
  queue: AudioTrack[];
  repeatMode: 'none' | 'one' | 'all';
  shuffleEnabled: boolean;
}

interface MusicOrganizationData {
  playlists: {
    id: string;
    name: string;
    tracks: string[];
    createdAt: number;
  }[];
  tags: string[];
  filters: {
    genre: string[];
    year: number | null;
    artist: string | null;
  };
  lastUpdated: number;
}

interface NeteasePlaylist {
  id: string;
  name: string;
  description: string;
  tracks: {
    title: string;
    artist: string;
    duration: number;
  }[];
  totalCount: number;
  importedAt: number;
}

interface SpotifyExportData {
  name: string;
  description: string;
  tracks: {
    title: string;
    artist: string;
    album?: string;
  }[];
  isPublic: boolean;
}

interface SpotifyExportResult {
  playlistId: string;
  url: string;
  tracksAdded: number;
  tracksFailed: number;
  exportedAt: number;
}

interface UserConfig {
  theme: string;
  language: string;
  audioQuality: 'low' | 'medium' | 'high';
  autoPlay: boolean;
  notifications: boolean;
  syncEnabled: boolean;
  backgroundIndex: number;
}

interface TaskLog {
  id: string;
  timestamp: number;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  category: 'SYSTEM' | 'AUDIO' | 'UI' | 'API' | 'WEBSOCKET' | 'DATABASE';
  message: string;
  source: string;
  details?: any;
}

interface StationStatus {
  altitude: number;
  velocity: number;
  location: {
    latitude: number;
    longitude: number;
    region: string;
  };
  nextPass: {
    time: number;
    elevation: number;
    direction: string;
  };
  signal: 'STRONG' | 'MEDIUM' | 'WEAK' | 'NONE';
  orbitalPeriod: number;
  apogee: number;
  perigee: number;
}

interface OrbitData {
  tle: [string, string];
  epoch: number;
  inclination: number;
  eccentricity: number;
  meanMotion: number;
}

interface AppState {
  isWelcomeMode: boolean;
  isInitialized: boolean;
  language: string;
  showRadio: boolean;
  syncActive: boolean;
}

interface BackendConnectionStatus {
  termusic: {
    connected: boolean;
    port: number;
    responseTime?: number;
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
  dataService: {
    connected: boolean;
    port: number;
  };
  logService: {
    connected: boolean;
    port: number;
  };
  stationService: {
    connected: boolean;
    port: number;
  };
}

// ============================================================================
// 🏗️ 主UI展示组件 (Main UI Showcase Component)
// ============================================================================

/**
 * 天宫科技后端集成UI展示组件
 * 
 * 这个组件展示完整的UI界面，所有功能都通过后端API模拟层实现
 * 实际部署时，需要将所有console.log标记的地方替换为真实的HTTP请求
 */
export const TiangongBackendIntegrationUI: React.FC = () => {
  // 状态管理
  const [appState, setAppState] = useState<AppState>({
    isWelcomeMode: true,
    isInitialized: false,
    language: getSystemLanguage(),
    showRadio: false,
    syncActive: false
  });
  
  const [backendStatus, setBackendStatus] = useState<BackendConnectionStatus>({
    termusic: { connected: false, port: 7533 },
    database: { connected: false, type: 'sqlite' },
    websocket: { connected: false, endpoint: WEBSOCKET_CONFIG.URL, reconnectAttempts: 0 },
    dataService: { connected: false, port: 8081 },
    logService: { connected: false, port: 8082 },
    stationService: { connected: false, port: 8083 }
  });
  
  const [visible, setVisible] = useState(false);
  const [currentShaderIndex, setCurrentShaderIndex] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [systemLogs, setSystemLogs] = useState<TaskLog[]>([]);
  
  // 获取翻译
  const t = getTranslations(appState.language);
  
  // 初始化应用和后端连接
  useEffect(() => {
    console.log(`%c[TIANGONG UI]%c 开始初始化后端集成UI展示页面`, 
      DEBUG_CONFIG.CONSOLE_STYLES.SUCCESS, '');
    
    const initializeApp = async () => {
      try {
        // 设置基本样式
        document.documentElement.classList.add("dark");
        document.body.style.backgroundColor = "#000000";
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.body.style.overflow = "hidden";
        
        // 初始化shader循环
        const initializeShader = () => {
          try {
            const storedIndex = localStorage.getItem("autoShaderIndex");
            let nextIndex = 0;

            if (storedIndex !== null) {
              const currentIndex = parseInt(storedIndex, 10);
              if (!isNaN(currentIndex) && currentIndex >= 0 && currentIndex < 5) {
                nextIndex = (currentIndex + 1) % 5;
              }
            }

            setCurrentShaderIndex(nextIndex);
            localStorage.setItem("autoShaderIndex", nextIndex.toString());
            
            console.log(`🎨 自动切换背景: ${getShaderName(nextIndex, appState.language)} (${nextIndex + 1}/5)`);
          } catch (error) {
            console.error("背景初始化失败:", error);
            setCurrentShaderIndex(0);
          }
        };

        initializeShader();
        setVisible(true);
        
        // 模拟后端服务连接
        console.log(`%c[BACKEND INIT]%c 开始连接后端服务...`, 
          DEBUG_CONFIG.CONSOLE_STYLES.API, '');
        
        // 1. 连接Termusic服务
        try {
          console.log(`%c[BACKEND INIT]%c 连接Termusic服务 (${SERVICE_ENDPOINTS.TERMUSIC.BASE_URL})...`, 
            DEBUG_CONFIG.CONSOLE_STYLES.API, '');
          
          // TODO: 实际部署时替换为真实的健康检查
          // const healthCheck = await fetch(`${SERVICE_ENDPOINTS.TERMUSIC.BASE_URL}/health`);
          
          await new Promise(resolve => setTimeout(resolve, 800)); // 模拟网络延迟
          
          setBackendStatus(prev => ({
            ...prev,
            termusic: { ...prev.termusic, connected: true, responseTime: 125, lastPing: Date.now() }
          }));
          
          console.log(`%c[BACKEND INIT]%c ✅ Termusic服务连接成功`, 
            DEBUG_CONFIG.CONSOLE_STYLES.SUCCESS, '');
          
        } catch (error) {
          console.error(`%c[BACKEND INIT]%c ❌ Termusic服务连接失败:`, 
            DEBUG_CONFIG.CONSOLE_STYLES.ERROR, '', error);
        }
        
        // 2. 连接WebSocket
        try {
          console.log(`%c[BACKEND INIT]%c 建立WebSocket连接...`, 
            DEBUG_CONFIG.CONSOLE_STYLES.WEBSOCKET, '');
          
          await WebSocketManager.connect();
          
          setBackendStatus(prev => ({
            ...prev,
            websocket: { ...prev.websocket, connected: true }
          }));
          
        } catch (error) {
          console.error(`%c[BACKEND INIT]%c ❌ WebSocket连接失败:`, 
            DEBUG_CONFIG.CONSOLE_STYLES.ERROR, '', error);
        }
        
        // 3. 连接数据服务
        try {
          console.log(`%c[BACKEND INIT]%c 连接数据管理服务...`, 
            DEBUG_CONFIG.CONSOLE_STYLES.API, '');
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          setBackendStatus(prev => ({
            ...prev,
            dataService: { ...prev.dataService, connected: true },
            database: { ...prev.database, connected: true, size: 2048576 }
          }));
          
          console.log(`%c[BACKEND INIT]%c ✅ 数据服务连接成功`, 
            DEBUG_CONFIG.CONSOLE_STYLES.SUCCESS, '');
          
        } catch (error) {
          console.error(`%c[BACKEND INIT]%c ❌ 数据服务连接失败:`, 
            DEBUG_CONFIG.CONSOLE_STYLES.ERROR, '', error);
        }
        
        // 4. 连接日志服务
        try {
          console.log(`%c[BACKEND INIT]%c 连接日志服务...`, 
            DEBUG_CONFIG.CONSOLE_STYLES.API, '');
          
          await new Promise(resolve => setTimeout(resolve, 300));
          
          setBackendStatus(prev => ({
            ...prev,
            logService: { ...prev.logService, connected: true }
          }));
          
          // 加载初始日志
          const logs = await LogService.getTaskLogs();
          setSystemLogs(logs);
          
          console.log(`%c[BACKEND INIT]%c ✅ 日志服务连接成功`, 
            DEBUG_CONFIG.CONSOLE_STYLES.SUCCESS, '');
          
        } catch (error) {
          console.error(`%c[BACKEND INIT]%c ❌ 日志服务连接失败:`, 
            DEBUG_CONFIG.CONSOLE_STYLES.ERROR, '', error);
        }
        
        // 5. 连接空间站数据服务
        try {
          console.log(`%c[BACKEND INIT]%c 连接空间站数据服务...`, 
            DEBUG_CONFIG.CONSOLE_STYLES.API, '');
          
          await new Promise(resolve => setTimeout(resolve, 400));
          
          setBackendStatus(prev => ({
            ...prev,
            stationService: { ...prev.stationService, connected: true }
          }));
          
          console.log(`%c[BACKEND INIT]%c ✅ 空间站服务连接成功`, 
            DEBUG_CONFIG.CONSOLE_STYLES.SUCCESS, '');
          
        } catch (error) {
          console.error(`%c[BACKEND INIT]%c ❌ 空间站服务连接失败:`, 
            DEBUG_CONFIG.CONSOLE_STYLES.ERROR, '', error);
        }
        
        // 6. 加载当前播放音轨
        try {
          const track = await TermusicAPI.getCurrentTrack();
          setCurrentTrack(track);
          
          console.log(`%c[BACKEND INIT]%c ✅ 当前音轨加载完成:`, 
            DEBUG_CONFIG.CONSOLE_STYLES.SUCCESS, '', track?.title);
          
        } catch (error) {
          console.error(`%c[BACKEND INIT]%c ❌ 音轨加载失败:`, 
            DEBUG_CONFIG.CONSOLE_STYLES.ERROR, '', error);
        }
        
        // 初始化完成
        setTimeout(() => {
          setAppState(prev => ({ ...prev, isInitialized: true }));
          
          console.log(`%c[BACKEND INIT]%c ✅ 后端集成UI展示页面初始化完成`, 
            DEBUG_CONFIG.CONSOLE_STYLES.SUCCESS, '');
          
          // 添加初始化完成日志
          LogService.addTaskLog({
            level: 'SUCCESS',
            category: 'SYSTEM',
            message: '后端集成UI展示页面初始化完成',
            source: 'TiangongBackendIntegrationUI',
            details: {
              services: Object.keys(backendStatus).length,
              initTime: Date.now() - startTime
            }
          });
          
        }, 200);
        
      } catch (error) {
        console.error(`%c[BACKEND INIT]%c ❌ 初始化失败:`, 
          DEBUG_CONFIG.CONSOLE_STYLES.ERROR, '', error);
        
        setAppState(prev => ({ ...prev, isInitialized: true }));
      }
    };
    
    const startTime = Date.now();
    initializeApp();
  }, [appState.language]);
  
  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (appState.isWelcomeMode && appState.isInitialized) {
        if (event.code === 'Space' || event.code === 'Enter') {
          event.preventDefault();
          console.log(`⌨️ 键盘快捷键触发: ${event.code}`);
          setAppState(prev => ({
            ...prev,
            isWelcomeMode: false,
            showRadio: true
          }));
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [appState.isWelcomeMode, appState.isInitialized]);
  
  // 定期更新系统日志
  useEffect(() => {
    if (!appState.isInitialized) return;
    
    const interval = setInterval(async () => {
      try {
        const newLogs = await LogService.getTaskLogs(5);
        setSystemLogs(prev => {
          const combined = [...newLogs, ...prev];
          const unique = combined.filter((log, index, arr) => 
            arr.findIndex(l => l.id === log.id) === index
          );
          return unique.slice(0, LOG_CONFIG.MAX_ENTRIES);
        });
      } catch (error) {
        console.error('更新系统日志失败:', error);
      }
    }, 30000); // 30秒更新一次
    
    return () => clearInterval(interval);
  }, [appState.isInitialized]);
  
  // 事件处理器
  const handleWelcomeClick = useCallback(() => {
    console.log('🎯 欢迎页面点击');
    
    if (!appState.isWelcomeMode || !appState.isInitialized) {
      return;
    }
    
    setAppState(prev => ({
      ...prev,
      isWelcomeMode: false,
      showRadio: true
    }));
    
    LogService.addTaskLog({
      level: 'INFO',
      category: 'UI',
      message: '用户进入控制台模式',
      source: 'UIInteraction'
    });
  }, [appState.isWelcomeMode, appState.isInitialized]);

  const handleModuleClick = useCallback((e: React.MouseEvent) => {
    console.log('🎯 时钟模块点击');
    e.stopPropagation();
    
    if (appState.isWelcomeMode || !appState.isInitialized) {
      return;
    }
    
    setAppState(prev => ({
      ...prev,
      isWelcomeMode: true
    }));
    
    LogService.addTaskLog({
      level: 'INFO',
      category: 'UI',
      message: '用户返回欢迎模式',
      source: 'UIInteraction'
    });
  }, [appState.isWelcomeMode, appState.isInitialized]);

  const toggleLanguage = useCallback(() => {
    console.log('🌐 语言切换');
    
    if (!appState.isInitialized) {
      return;
    }
    
    const newLanguage = appState.language === 'zh' ? 'en' : 'zh';
    setAppState(prev => ({
      ...prev,
      language: newLanguage
    }));
    
    // 保存语言偏好到后端
    DataService.saveConfig({
      theme: 'silver',
      language: newLanguage,
      audioQuality: 'high',
      autoPlay: true,
      notifications: true,
      syncEnabled: appState.syncActive,
      backgroundIndex: currentShaderIndex
    });
    
    LogService.addTaskLog({
      level: 'INFO',
      category: 'UI',
      message: `语言切换至: ${newLanguage}`,
      source: 'LanguageToggle'
    });
  }, [appState.isInitialized, appState.language, appState.syncActive, currentShaderIndex]);

  const switchBackground = useCallback(() => {
    console.log('🎨 手动切换背景');
    
    if (!appState.isInitialized) {
      return;
    }
    
    const nextIndex = (currentShaderIndex + 1) % 5;
    setCurrentShaderIndex(nextIndex);
    localStorage.setItem("autoShaderIndex", nextIndex.toString());
    
    LogService.addTaskLog({
      level: 'SUCCESS',
      category: 'SYSTEM',
      message: `背景切换: ${getShaderName(nextIndex, appState.language)}`,
      source: 'BackgroundManager',
      details: { fromIndex: currentShaderIndex, toIndex: nextIndex }
    });
  }, [currentShaderIndex, appState.language, appState.isInitialized]);

  const toggleSync = useCallback(() => {
    console.log('🔄 Sync按钮点击');
    
    const newSyncState = !appState.syncActive;
    setAppState(prev => ({
      ...prev,
      syncActive: newSyncState
    }));
    
    // 发送WebSocket消息
    if (newSyncState) {
      WebSocketManager.sendMessage('sync_start', { timestamp: Date.now() });
    } else {
      WebSocketManager.sendMessage('sync_stop', { timestamp: Date.now() });
    }
    
    LogService.addTaskLog({
      level: 'INFO',
      category: 'WEBSOCKET',
      message: `同步状态: ${newSyncState ? '激活' : '停止'}`,
      source: 'SyncToggle'
    });
  }, [appState.syncActive]);

  const handleOpenMusicVisualizer = useCallback(() => {
    console.log('🎵 打开音乐可视化器');
    
    try {
      const visualizerWindow = window.open(
        SERVICE_ENDPOINTS.VISUALIZER.BASE_URL + '/visualizer',
        '_blank',
        SERVICE_ENDPOINTS.VISUALIZER.WINDOW_OPTIONS
      );
      
      if (visualizerWindow) {
        LogService.addTaskLog({
          level: 'SUCCESS',
          category: 'UI',
          message: '音乐可视化器已打开',
          source: 'MusicVisualizerButton',
          details: { url: SERVICE_ENDPOINTS.VISUALIZER.BASE_URL }
        });
        
        // 监听窗口关闭
        const checkClosed = setInterval(() => {
          if (visualizerWindow.closed) {
            console.log('🎵 音乐可视化器窗口已关闭');
            clearInterval(checkClosed);
          }
        }, 1000);
        
        setTimeout(() => clearInterval(checkClosed), 600000);
      } else {
        console.warn('🎵 无法打开音乐可视化器 - 可能被浏览器阻止');
        
        LogService.addTaskLog({
          level: 'WARN',
          category: 'UI',
          message: '音乐可视化器被浏览器阻止',
          source: 'MusicVisualizerButton'
        });
      }
    } catch (error) {
      console.error('🎵 音乐可视化器打开失败:', error);
      
      LogService.addTaskLog({
        level: 'ERROR',
        category: 'UI',
        message: '音乐可视化器打开失败',
        source: 'MusicVisualizerButton',
        details: { error: error instanceof Error ? error.message : '未知错误' }
      });
    }
  }, []);

  const handleBackgroundChange = useCallback((background: { name: string }) => {
    console.log(`🎨 背景已切换: ${background.name}`);
    
    LogService.addTaskLog({
      level: 'INFO',
      category: 'SYSTEM',
      message: `背景切换完成: ${background.name}`,
      source: 'BackgroundManager'
    });
  }, []);
  
  // 动画配置 (复用原有的优化配置)
  const animationConfigs = useMemo(() => ({
    clockTransition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 28,
      mass: 0.8,
      duration: 0.1
    },
    
    clockInnerTransition: {
      type: "spring" as const,
      stiffness: 550,
      damping: 26,
      mass: 0.7,
      duration: 0.08
    },
    
    exitTransition: {
      duration: 0.4,
      type: "spring" as const,
      stiffness: 300,
      damping: 22
    },
    
    panelTransition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
      mass: 0.9,
      duration: 0.35
    },
    
    buttonHover: {
      scale: 1.05,
      y: -1,
      transition: {
        type: "spring" as const,
        stiffness: 600,
        damping: 15,
        duration: 0.12
      }
    },
    
    buttonTap: {
      scale: 0.95,
      transition: {
        type: "spring" as const,
        stiffness: 800,
        damping: 20,
        duration: 0.08
      }
    }
  }), []);

  const cssTransitions = useMemo(() => ({
    fast: 'all 0.12s cubic-bezier(0.4, 0, 0.2, 1)',
    medium: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    slow: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    smooth: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
  }), []);

  // 早期返回 - 未初始化状态
  if (!appState.isInitialized) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white/70 text-sm animate-pulse mb-4 font-mono tracking-wider uppercase">
            {appState.language === 'zh' ? '天宫科技后端集成UI初始化中...' : 'Tiangong Backend Integration UI Initializing...'}
          </div>
          
          {/* 服务连接状态指示器 */}
          <div className="grid grid-cols-3 gap-4 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <div 
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  backendStatus.termusic.connected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                }`}
              />
              <span className="text-white/60">
                Termusic:{SERVICE_ENDPOINTS.TERMUSIC.BASE_URL.split('//')[1]}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  backendStatus.websocket.connected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                }`}
              />
              <span className="text-white/60">WebSocket</span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  backendStatus.database.connected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                }`}
              />
              <span className="text-white/60">{backendStatus.database.type.toUpperCase()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  backendStatus.dataService.connected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                }`}
              />
              <span className="text-white/60">Data Service</span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  backendStatus.logService.connected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                }`}
              />
              <span className="text-white/60">Log Service</span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  backendStatus.stationService.connected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                }`}
              />
              <span className="text-white/60">Station Service</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 🎨 酷炫的Shadertoy背景 */}
      <BackgroundManager
        className="absolute inset-0"
        enablePreload={true}
        debugMode={DEBUG_CONFIG.ENABLED}
        onBackgroundChange={handleBackgroundChange}
        currentShaderIndex={currentShaderIndex}
        style={{ zIndex: 0 }}
      />
      
      {/* 时钟模块 */}
      <motion.div
        className={`absolute ${
          appState.isWelcomeMode 
            ? 'left-1/2 top-32 transform -translate-x-1/2'
            : 'left-8 top-8'
        }`}
        style={{
          cursor: 'pointer',
          zIndex: appState.isWelcomeMode ? 70 : 60,
          pointerEvents: 'auto',
          transformOrigin: appState.isWelcomeMode ? 'center' : 'top left',
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform'
        }}
        onClick={appState.isWelcomeMode ? handleWelcomeClick : handleModuleClick}
        animate={appState.isWelcomeMode ? {
          x: '0%',
          y: 0
        } : {
          x: 0,
          y: 0
        }}
        transition={animationConfigs.clockTransition}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={appState.isWelcomeMode ? {
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0
          } : {
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0
          }}
          transition={animationConfigs.clockInnerTransition}
          className={`${
            appState.isWelcomeMode ? 'px-10 py-8' : 'px-4 py-3'
          }`}
          style={{
            minWidth: appState.isWelcomeMode ? 'auto' : '140px',
            minHeight: appState.isWelcomeMode ? 'auto' : '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: appState.isWelcomeMode ? 'transparent' : 'rgba(192, 197, 206, 0.05)',
            borderRadius: appState.isWelcomeMode ? 0 : '8px',
            border: appState.isWelcomeMode ? 'none' : '1px solid rgba(192, 197, 206, 0.15)',
            transition: cssTransitions.fast,
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform'
          }}
        >
          <TimeDisplay isWelcomeMode={appState.isWelcomeMode} />
        </motion.div>
      </motion.div>

      {/* 卫星信息面板 */}
      <AnimatePresence>
        {appState.isWelcomeMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: { 
                delay: 1.2,
                duration: 0.6,
                type: "tween",
                ease: "easeInOut"
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.1,
              x: appState.language === 'zh' ? -520 : -440,
              y: -200,
              transition: {
                delay: 0,
                ...animationConfigs.exitTransition
              }
            }}
            className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
            style={{ zIndex: 40 }}
          >
            <EnhancedSpaceStationStatus language={appState.language} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 欢迎模式键盘提示 */}
      <AnimatePresence>
        {appState.isWelcomeMode && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { 
                delay: 2.0,
                duration: 0.5,
                type: "tween",
                ease: "easeInOut"
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.1,
              x: appState.language === 'zh' ? -520 : -440,
              y: -300,
              transition: {
                delay: 0,
                ...animationConfigs.exitTransition
              }
            }}
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 text-center max-w-md"
            style={{ zIndex: 50 }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5, duration: 0.5 }}
              className="text-white/60 text-xs font-mono uppercase tracking-widest"
            >
              <div className="flex items-center justify-center space-x-3">
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-xs border border-white/20 font-mono">
                    SPACE
                  </kbd>
                  <span>OR</span>
                  <kbd className="px-2 py-1 bg-white/10 rounded text-xs border border-white/20 font-mono">
                    ENTER
                  </kbd>
                </div>
                <span>•</span>
                <span>{appState.language === 'zh' ? '快速进入' : 'QUICK ENTER'}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 欢迎模式覆盖层 */}
      <AnimatePresence>
        {appState.isWelcomeMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: visible ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 cursor-pointer"
            style={{ 
              zIndex: 10,
              pointerEvents: 'auto'
            }}
            onClick={handleWelcomeClick}
          />
        )}
      </AnimatePresence>

      {/* 控制台模式主界面 */}
      <AnimatePresence>
        {!appState.isWelcomeMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="absolute inset-0 overflow-hidden"
            style={{ zIndex: 20 }}
          >
            {/* 主功能面板 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="absolute left-52 right-80 top-20 bottom-8 overflow-auto"
              style={{ 
                zIndex: 25,
                pointerEvents: 'auto'
              }}
            >
              <AdvancedMusicOrganizer 
                language={appState.language}
                onError={(error) => {
                  console.error('Music Organizer Error:', error);
                  LogService.addTaskLog({
                    level: 'ERROR',
                    category: 'UI',
                    message: 'Music Organizer错误',
                    source: 'AdvancedMusicOrganizer',
                    details: { error: error.message }
                  });
                }}
                onSuccess={(message) => {
                  console.log('Music Organizer Success:', message);
                  LogService.addTaskLog({
                    level: 'SUCCESS',
                    category: 'UI',
                    message: message,
                    source: 'AdvancedMusicOrganizer'
                  });
                }}
              />
            </motion.div>

            {/* 任务日志面板 */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={animationConfigs.panelTransition}
              className="fixed right-8 top-40 bottom-40 w-64"
              style={{ 
                zIndex: 30,
                transform: 'translate3d(0, 0, 0)',
                willChange: 'transform'
              }}
            >
              <TaskLogger />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 右上角控制面板 */}
      
      {/* 电台切换按钮 */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        whileHover={animationConfigs.buttonHover}
        whileTap={animationConfigs.buttonTap}
        onClick={() => setAppState(prev => ({ ...prev, showRadio: !prev.showRadio }))}
        className="fixed top-8 right-8 w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer"
        style={{
          background: 'rgba(192, 197, 206, 0.08)',
          border: '1px solid rgba(192, 197, 206, 0.15)',
          color: 'rgba(192, 197, 206, 0.8)',
          zIndex: 90,
          pointerEvents: 'auto',
          transition: cssTransitions.fast,
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform'
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
        onClick={toggleLanguage}
        className="fixed top-8 right-24 w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer"
        style={{
          background: 'rgba(192, 197, 206, 0.08)',
          border: '1px solid rgba(192, 197, 206, 0.15)',
          color: 'rgba(192, 197, 206, 0.8)',
          zIndex: 90,
          pointerEvents: 'auto',
          transition: cssTransitions.fast,
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform'
        }}
        title={t.language}
      >
        <div className="font-mono text-xs tracking-wider">
          {appState.language === 'zh' ? 'EN' : '中'}
        </div>
      </motion.button>

      {/* 背景切换按钮 */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        whileHover={animationConfigs.buttonHover}
        whileTap={animationConfigs.buttonTap}
        onClick={switchBackground}
        className="fixed top-8 right-40 w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer"
        style={{
          background: 'rgba(192, 197, 206, 0.08)',
          border: '1px solid rgba(192, 197, 206, 0.15)',
          color: 'rgba(192, 197, 206, 0.8)',
          zIndex: 90,
          pointerEvents: 'auto',
          transition: cssTransitions.fast,
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform'
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
        onClick={handleOpenMusicVisualizer}
        className="fixed top-8 right-56 w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer"
        style={{
          background: 'rgba(192, 197, 206, 0.08)',
          border: '1px solid rgba(192, 197, 206, 0.15)',
          color: 'rgba(192, 197, 206, 0.8)',
          zIndex: 90,
          pointerEvents: 'auto',
          transition: cssTransitions.fast,
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform'
        }}
        title={appState.language === 'zh' ? '音乐可视化器' : 'Music Visualizer'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          <path d="M8 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          <circle cx="10" cy="17" r="1"/>
          <circle cx="14" cy="11" r="1"/>
          <circle cx="18" cy="7" r="1"/>
        </svg>
      </motion.button>

      {/* 电台浮窗 */}
      <AnimatePresence>
        {appState.showRadio && (
          <TiangongRadioPlayer 
            language={appState.language} 
            syncActive={appState.syncActive}
            onSyncToggle={toggleSync}
            onClose={() => setAppState(prev => ({ ...prev, showRadio: false }))}
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
                ? 'rgba(34, 197, 94, 0.8)' 
                : 'rgba(220, 38, 38, 0.8)'
            }}
          />
          <span className="font-mono text-xs uppercase tracking-wider text-white/60">
            Termusic:{backendStatus.termusic.port}
            {backendStatus.termusic.responseTime && (
              <span className="ml-1 text-white/40">
                ({backendStatus.termusic.responseTime}ms)
              </span>
            )}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ 
              background: backendStatus.websocket.connected 
                ? 'rgba(34, 197, 94, 0.8)' 
                : 'rgba(220, 38, 38, 0.8)'
            }}
          />
          <span className="font-mono text-xs uppercase tracking-wider text-white/60">
            WebSocket
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ 
              background: backendStatus.database.connected 
                ? 'rgba(34, 197, 94, 0.8)' 
                : 'rgba(220, 38, 38, 0.8)'
            }}
          />
          <span className="font-mono text-xs uppercase tracking-wider text-white/60">
            {backendStatus.database.type.toUpperCase()}
            {backendStatus.database.size && (
              <span className="ml-1 text-white/40">
                ({Math.round(backendStatus.database.size / 1024 / 1024)}MB)
              </span>
            )}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ 
              background: backendStatus.dataService.connected 
                ? 'rgba(34, 197, 94, 0.8)' 
                : 'rgba(220, 38, 38, 0.8)'
            }}
          />
          <span className="font-mono text-xs uppercase tracking-wider text-white/60">
            Data:{backendStatus.dataService.port}
          </span>
        </div>
      </div>

      {/* 版权信息 */}
      <div 
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-center"
        style={{ 
          zIndex: 5,
          opacity: 0.25,
        }}
      >
        <div className="text-system-quaternary font-mono text-xs tracking-widest uppercase transition-opacity duration-300 hover:opacity-60">
          @天宫科技 Made By 麻蛇 | Backend Integration UI v4.0
        </div>
      </div>
      
      {/* 开发模式标识 */}
      <div 
        className="fixed top-4 left-4 font-mono text-xs"
        style={{ 
          zIndex: 100,
          background: 'rgba(192, 197, 206, 0.1)',
          border: '1px solid rgba(192, 197, 206, 0.2)',
          borderRadius: '4px',
          padding: '8px 12px',
          color: 'rgba(192, 197, 206, 0.7)'
        }}
      >
        <div className="flex items-center space-x-2">
          <div 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: 'rgba(251, 191, 36, 0.8)' }}
          />
          <span className="uppercase tracking-wider">
            BACKEND INTEGRATION MODE
          </span>
        </div>
        <div className="text-xs mt-1 text-white/50">
          All APIs are mocked - Replace console.log with HTTP calls
        </div>
        {DEBUG_CONFIG.ENABLED && (
          <div className="text-xs mt-1 text-yellow-400">
            DEBUG MODE ENABLED
          </div>
        )}
      </div>
    </div>
  );
};

export default TiangongBackendIntegrationUI;

// ============================================================================
// 📋 部署检查清单 (Deployment Checklist)
// ============================================================================

/**
 * 🔌 后端接口实现检查清单:
 * 
 * ✅ 服务端配置:
 * [ ] Termusic服务运行在端口7533
 * [ ] WebSocket服务启用在端口7533/ws
 * [ ] 数据管理服务运行在端口8081
 * [ ] 日志服务运行在端口8082
 * [ ] 空间站数据服务运行在端口8083
 * [ ] 音乐可视化器运行在端口8080
 * 
 * ✅ API端点实现:
 * [ ] 所有TermusicAPI类中的方法
 * [ ] 所有DataService类中的方法
 * [ ] 所有LogService类中的方法
 * [ ] 所有StationService类中的方法
 * 
 * ✅ WebSocket实现:
 * [ ] WebSocketManager.connect()方法
 * [ ] WebSocketManager.sendMessage()方法
 * [ ] 所有消息类型的处理器
 * [ ] 心跳检测和自动重连
 * 
 * ✅ 数据库配置:
 * [ ] 根据DATABASE_CONFIG设置数据库连接
 * [ ] 创建必要的数据表
 * [ ] 实现数据备份和恢复
 * 
 * ✅ 第三方API配置:
 * [ ] 网易云音乐API密钥配置
 * [ ] Spotify API配置和OAuth流程
 * [ ] 空间站TLE数据源配置
 * 
 * ✅ 环境变量配置:
 * [ ] 复制.env.example到.env
 * [ ] 填写所有必需的API密钥和配置
 * [ ] 验证所有服务端口可用性
 * 
 * ✅ 性能优化:
 * [ ] 实现API响应缓存
 * [ ] 数据库查询优化
 * [ ] WebSocket连接池管理
 * [ ] 音频数据流优化
 * 
 * ✅ 错误处理:
 * [ ] 实现统一的错误处理中间件
 * [ ] 添加API限制和防护
 * [ ] 实现服务监控和报警
 * 
 * ✅ 测试验证:
 * [ ] API端点单元测试
 * [ ] WebSocket连接测试
 * [ ] 数据库操作测试
 * [ ] 前后端集成测试
 * 
 * 🚀 部署完成后，将所有console.log标记的位置替换为实际的HTTP请求调用
 */