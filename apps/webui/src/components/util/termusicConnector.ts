/**
 * Termusic 后端连接器
 * 负责与Termusic Rust后端进行通信
 * 支持HTTP API和WebSocket实时连接
 */

import { Track, PlaybackState, TermusicAPI } from './musicPlayerTypes';

// Termusic 后端配置
export interface TermusicConfig {
  baseUrl: string;
  port: number;
  enableWebSocket: boolean;
  enableHttps: boolean;
  timeout: number;
}

// 默认配置
export const defaultTermusicConfig: TermusicConfig = {
  baseUrl: import.meta.env.VITE_TERMUSIC_HOST || 'localhost',
  port: parseInt(import.meta.env.VITE_TERMUSIC_PORT) || 7533,
  enableWebSocket: import.meta.env.VITE_TERMUSIC_WEBSOCKET_ENABLED !== 'false',
  enableHttps: import.meta.env.VITE_TERMUSIC_PROTOCOL === 'https',
  timeout: parseInt(import.meta.env.VITE_TERMUSIC_TIMEOUT) || 5000,
};

// WebSocket 消息类型
export interface TermusicMessage {
  type: 'track_change' | 'playback_state' | 'playlist_update' | 'error';
  data: any;
  timestamp: number;
}

// 后端响应类型
export interface TermusicResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/**
 * Termusic 连接器类
 * 管理与后端的HTTP和WebSocket连接
 */
export class TermusicConnector implements TermusicAPI {
  private config: TermusicConfig;
  private wsConnection: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeoutId: NodeJS.Timeout | null = null; // 🔧 添加timeout ID跟踪
  private eventListeners: Map<string, Function[]> = new Map();
  private isConnected = false;

  constructor(config: Partial<TermusicConfig> = {}) {
    this.config = { ...defaultTermusicConfig, ...config };
    this.initializeConnection();
  }

  // 获取基础URL
  private getBaseUrl(): string {
    const protocol = this.config.enableHttps ? 'https' : 'http';
    return `${protocol}://${this.config.baseUrl}:${this.config.port}`;
  }

  // 获取WebSocket URL
  private getWebSocketUrl(): string {
    const protocol = this.config.enableHttps ? 'wss' : 'ws';
    return `${protocol}://${this.config.baseUrl}:${this.config.port}/ws`;
  }

  // 初始化连接
  private async initializeConnection(): Promise<void> {
    try {
      // 检查后端是否可用
      await this.healthCheck();
      
      // 初始化WebSocket连接
      if (this.config.enableWebSocket) {
        this.connectWebSocket();
      }
      
      this.isConnected = true;
      console.log('🎵 Termusic 后端连接成功');
    } catch (error) {
      console.warn('🚧 Termusic 后端连接失败，使用Mock模式:', error);
      this.isConnected = false;
      // 不再抛出错误，静默切换到Mock模式
    }
  }

  // 健康检查
  private async healthCheck(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      
      const response = await fetch(`${this.getBaseUrl()}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      // 将错误转换为更友好的消息
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('连接超时 - Termusic后端未响应');
        }
        if (error.message.includes('fetch')) {
          throw new Error('网络错误 - 无法连接到Termusic后端');
        }
      }
      throw error;
    }
  }

  // WebSocket连接
  private connectWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
    }

    try {
      this.wsConnection = new WebSocket(this.getWebSocketUrl());

      this.wsConnection.onopen = () => {
        console.log('🔗 WebSocket 连接已建立');
        this.reconnectAttempts = 0;
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const message: TermusicMessage = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('WebSocket 消息解析失败:', error);
        }
      };

      this.wsConnection.onclose = () => {
        console.log('🔌 WebSocket 连接已断开');
        this.attemptReconnect();
      };

      this.wsConnection.onerror = (error) => {
        console.error('WebSocket 连接错误:', error);
      };
    } catch (error) {
      console.error('WebSocket 初始化失败:', error);
    }
  }

  // 处理WebSocket消息
  private handleWebSocketMessage(message: TermusicMessage): void {
    const listeners = this.eventListeners.get(message.type) || [];
    listeners.forEach(listener => {
      try {
        listener(message.data);
      } catch (error) {
        console.error('事件监听器执行错误:', error);
      }
    });
  }

  // 重连尝试
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // 指数退避

      console.log(`🔄 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts}) - ${delay}ms 后重试`);
      
      // 🔧 优化：使用类方法引用，避免内存泄漏
      const timeoutId = setTimeout(() => {
        this.connectWebSocket();
      }, delay);
      
      // 🔧 存储timeout ID以便清理
      this.reconnectTimeoutId = timeoutId;
    } else {
      console.error('❌ WebSocket 重连失败，已达到最大尝试次数');
    }
  }

  // HTTP请求封装
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<TermusicResponse<T>> {
    try {
      const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(this.config.timeout),
        ...options,
      });

      const data = await response.json();
      
      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.error || `HTTP ${response.status}`,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  // 事件监听器管理
  public addEventListener(type: string, listener: Function): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  public removeEventListener(type: string, listener: Function): void {
    const listeners = this.eventListeners.get(type) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  // === TermusicAPI 接口实现 ===

  // 播放控制
  async play(): Promise<void> {
    if (!this.isConnected) {
      console.log('🎵 Mock: Play');
      return;
    }
    
    const response = await this.request('/api/player/play', { method: 'POST' });
    if (!response.success) {
      throw new Error(response.error || 'Failed to play');
    }
  }

  async pause(): Promise<void> {
    if (!this.isConnected) {
      console.log('⏸️ Mock: Pause');
      return;
    }
    
    const response = await this.request('/api/player/pause', { method: 'POST' });
    if (!response.success) {
      throw new Error(response.error || 'Failed to pause');
    }
  }

  async stop(): Promise<void> {
    if (!this.isConnected) {
      console.log('⏹️ Mock: Stop');
      return;
    }
    
    const response = await this.request('/api/player/stop', { method: 'POST' });
    if (!response.success) {
      throw new Error(response.error || 'Failed to stop');
    }
  }

  async next(): Promise<void> {
    if (!this.isConnected) {
      console.log('⏭️ Mock: Next');
      return;
    }
    
    const response = await this.request('/api/player/next', { method: 'POST' });
    if (!response.success) {
      throw new Error(response.error || 'Failed to skip to next track');
    }
  }

  async previous(): Promise<void> {
    if (!this.isConnected) {
      console.log('⏮️ Mock: Previous');
      return;
    }
    
    const response = await this.request('/api/player/previous', { method: 'POST' });
    if (!response.success) {
      throw new Error(response.error || 'Failed to skip to previous track');
    }
  }

  // 音量控制
  async setVolume(volume: number): Promise<void> {
    if (!this.isConnected) {
      console.log(`🔊 Mock: Set volume to ${Math.round(volume * 100)}%`);
      return;
    }
    
    const response = await this.request('/api/player/volume', {
      method: 'POST',
      body: JSON.stringify({ volume: Math.max(0, Math.min(1, volume)) })
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to set volume');
    }
  }

  async mute(): Promise<void> {
    if (!this.isConnected) {
      console.log('🔇 Mock: Mute');
      return;
    }
    
    const response = await this.request('/api/player/mute', { method: 'POST' });
    if (!response.success) {
      throw new Error(response.error || 'Failed to mute');
    }
  }

  async unmute(): Promise<void> {
    if (!this.isConnected) {
      console.log('🔊 Mock: Unmute');
      return;
    }
    
    const response = await this.request('/api/player/unmute', { method: 'POST' });
    if (!response.success) {
      throw new Error(response.error || 'Failed to unmute');
    }
  }

  // 播放模式
  async setRepeatMode(mode: 'none' | 'one' | 'all'): Promise<void> {
    if (!this.isConnected) {
      console.log(`🔁 Mock: Set repeat mode to ${mode}`);
      return;
    }
    
    const response = await this.request('/api/player/repeat', {
      method: 'POST',
      body: JSON.stringify({ mode })
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to set repeat mode');
    }
  }

  async toggleShuffle(): Promise<void> {
    if (!this.isConnected) {
      console.log('🔀 Mock: Toggle shuffle');
      return;
    }
    
    const response = await this.request('/api/player/shuffle', { method: 'POST' });
    if (!response.success) {
      throw new Error(response.error || 'Failed to toggle shuffle');
    }
  }

  // 进度控制
  async seek(position: number): Promise<void> {
    if (!this.isConnected) {
      console.log(`⏯️ Mock: Seek to ${position}s`);
      return;
    }
    
    const response = await this.request('/api/player/seek', {
      method: 'POST',
      body: JSON.stringify({ position: Math.max(0, position) })
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to seek');
    }
  }

  // 播放列表管理
  async loadPlaylist(tracks: Track[]): Promise<void> {
    if (!this.isConnected) {
      console.log('📂 Mock: Load playlist', tracks.length, 'tracks');
      return;
    }
    
    const response = await this.request('/api/playlist/load', {
      method: 'POST',
      body: JSON.stringify({ tracks })
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to load playlist');
    }
  }

  async addTrack(track: Track): Promise<void> {
    if (!this.isConnected) {
      console.log('➕ Mock: Add track', track.title);
      return;
    }
    
    const response = await this.request('/api/playlist/add', {
      method: 'POST',
      body: JSON.stringify({ track })
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to add track');
    }
  }

  async removeTrack(trackId: string): Promise<void> {
    if (!this.isConnected) {
      console.log('➖ Mock: Remove track', trackId);
      return;
    }
    
    const response = await this.request(`/api/playlist/remove/${trackId}`, {
      method: 'DELETE'
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to remove track');
    }
  }

  // 状态获取
  async getCurrentTrack(): Promise<Track | null> {
    if (!this.isConnected) {
      // Mock数据 - 320kbps电子音乐电台演示
      return {
        id: 'electronic-demo-1',
        title: '深空电子脉冲',
        artist: '天宫科技电台',
        album: 'Electronic Space Sessions',
        duration: 248,
        coverUrl: undefined,
        url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3' // 高品质电子音乐演示
      };
    }
    
    const response = await this.request<Track>('/api/player/current-track');
    return response.success ? response.data || null : null;
  }

  async getPlaybackState(): Promise<PlaybackState> {
    if (!this.isConnected) {
      // Mock数据
      return {
        isPlaying: false,
        currentTime: 0,
        duration: 248,
        volume: 0.7,
        isMuted: false,
        repeatMode: 'none',
        shuffleMode: false,
      };
    }
    
    const response = await this.request<PlaybackState>('/api/player/state');
    if (response.success && response.data) {
      return response.data;
    }
    
    // 返回默认状态
    return {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.7,
      isMuted: false,
      repeatMode: 'none',
      shuffleMode: false,
    };
  }

  async getPlaylist(): Promise<Track[]> {
    if (!this.isConnected) {
      return []; // Mock空播放列表
    }
    
    const response = await this.request<Track[]>('/api/playlist');
    return response.success ? response.data || [] : [];
  }

  // 连接状态管理
  public isHealthy(): boolean {
    return this.isConnected;
  }

  public getConnectionStatus(): string {
    if (!this.isConnected) return 'disconnected';
    if (this.wsConnection?.readyState === WebSocket.OPEN) return 'connected';
    if (this.wsConnection?.readyState === WebSocket.CONNECTING) return 'connecting';
    return 'http-only';
  }

  // 清理资源
  public destroy(): void {
    // 🔧 清理WebSocket连接
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    
    // 🔧 清理重连定时器
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    // 🔧 清理事件监听器
    this.eventListeners.clear();
    
    // 🔧 重置状态
    this.isConnected = false;
    this.reconnectAttempts = 0;
    
    console.log('🧹 Termusic连接器已清理');
  }
}

// 全局连接器实例
let globalConnector: TermusicConnector | null = null;

// 获取或创建连接器实例
export function getTermusicConnector(config?: Partial<TermusicConfig>): TermusicConnector {
  if (!globalConnector) {
    globalConnector = new TermusicConnector(config);
  }
  return globalConnector;
}

// 销毁连接器
export function destroyTermusicConnector(): void {
  if (globalConnector) {
    globalConnector.destroy();
    globalConnector = null;
  }
}