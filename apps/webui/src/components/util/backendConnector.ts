/**
 * 后端API连接器 - 对接Termusic后端文档规范
 * 支持Spotify导出、音乐整理、Termusic控制、音频分析等功能
 */

// 基础配置接口
export interface BackendConfig {
  webServiceUrl: string;
  termusicGatewayUrl: string;
  audioGatewayUrl: string;
  timeout: number;
}

// 默认配置 - 匹配文档端口约定
export const defaultBackendConfig: BackendConfig = {
  // 统一走前端代理到 metadata_server（/api → metadata_port），由其反向代理/模拟
  webServiceUrl: '/api',
  termusicGatewayUrl: '/api/termusic',
  audioGatewayUrl: '/api/audio',
  timeout: 30000, // 30秒超时
};

// Spotify导出请求接口
export interface SpotifyExportRequest {
  playlist: string;
  output_dir?: string;
}

// 音乐整理请求接口
export interface MusicOrganizeRequest {
  export_path: string;
  music_roots: string[];
  aggressive?: boolean;
  auto_convert_ncm?: boolean;
  force_mp3?: boolean;
}

// 任务响应接口
export interface TaskResponse {
  status: 'success' | 'error';
  data: {
    task_id: string;
  };
  message?: string;
}

// 任务状态接口
export interface TaskStatus {
  task_status: 'pending' | 'running' | 'completed' | 'failed';
  logs: string[];
  result?: any;
  progress?: number;
}

// 整理结果接口
export interface OrganizeResult {
  playlist: string;
  total: number;
  matched: Array<{ src: string; dst: string }>;
  missing: Array<{ title: string; artists: string; album: string }>;
  multi_candidates: Array<{ title: string; candidates: string }>;
  output_dir: string;
  generated_at: string;
}

// 媒体文件接口
export interface MediaFile {
  name: string;
  url: string;
  size: number;
  mtime: string;
  suffix: string;
}

// Termusic调用请求接口
export interface TermusicCallRequest {
  method: string;
  payload: Record<string, any>;
}

// 音频峰值响应接口
export interface AudioPeaksResponse {
  peaks: number[];
  offset: number;
  duration: number;
  pps: number;
  status: 'success' | 'error';
  message?: string;
}

// 音频频段响应接口
export interface AudioBandsResponse {
  low: number[];
  mid: number[];
  high: number[];
  rms: number[];
  offset: number;
  duration: number;
  pps: number;
  sr: number;
  fft: number;
  status: 'success' | 'error';
  message?: string;
}

// 环境检查响应接口
export interface EnvironmentCheck {
  spotipy: boolean;
  pandas: boolean;
  openpyxl: boolean;
  ffmpeg: boolean;
  ncmdump: boolean;
}

/**
 * 后端API连接器类
 * 实现完整的后端API调用功能
 */
export class BackendConnector {
  private config: BackendConfig;
  private abortController: AbortController | null = null;

  constructor(config: Partial<BackendConfig> = {}) {
    this.config = { ...defaultBackendConfig, ...config };
  }

  // 通用HTTP请求方法
  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    this.abortController = new AbortController();
    
    try {
      const timeoutId = setTimeout(() => this.abortController?.abort(), this.config.timeout);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: this.abortController.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('请求超时或被中止');
        }
        if (error.message.includes('fetch')) {
          throw new Error('网络连接失败 - 无法连接到后端服务');
        }
      }
      throw error;
    }
  }

  // === Spotify导出功能 ===

  // 导出Spotify播放列表（同步模式）
  async exportSpotify(request: SpotifyExportRequest): Promise<TaskResponse> {
    return this.request(`${this.config.webServiceUrl}/export_spotify`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 导出Spotify播放列表（任务模式）
  async exportSpotifyTask(request: SpotifyExportRequest): Promise<TaskResponse> {
    return this.request(`${this.config.webServiceUrl}/task/export_spotify`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 获取导出任务状态
  async getExportTaskStatus(taskId: string): Promise<TaskStatus> {
    return this.request(`${this.config.webServiceUrl}/task/${taskId}`);
  }

  // 列出所有导出任务
  async listExports(): Promise<any[]> {
    return this.request(`${this.config.webServiceUrl}/exports`);
  }

  // === 音乐整理功能 ===

  // 触发音乐整理（同步模式）
  async organizeMusic(request: MusicOrganizeRequest): Promise<OrganizeResult> {
    return this.request(`${this.config.webServiceUrl}/organize`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 触发音乐整理（任务模式）
  async organizeMusicTask(request: MusicOrganizeRequest): Promise<TaskResponse> {
    return this.request(`${this.config.webServiceUrl}/task/organize`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 列出整理报告
  async listReports(): Promise<any[]> {
    return this.request(`${this.config.webServiceUrl}/reports`);
  }

  // 获取默认音乐根目录
  async getDefaultMusicRoots(): Promise<string[]> {
    return this.request(`${this.config.webServiceUrl}/default_music_roots`);
  }

  // === 媒体资源管理 ===

  // 自动挂载最新网易云歌单为媒体源
  async autoMountNetease(): Promise<{ ok: boolean; mounted: string; link: string }> {
    return this.request(`${this.config.webServiceUrl}/auto_mount_netease`);
  }

  // 列出媒体资源
  async listMedia(root?: string, subdir?: string): Promise<MediaFile[]> {
    const params = new URLSearchParams();
    if (root) params.append('root', root);
    if (subdir) params.append('subdir', subdir);
    
    return this.request(`${this.config.webServiceUrl}/media_list?${params.toString()}`);
  }

  // === Termusic 控制功能 ===

  // 列出可用gRPC服务
  async getTermusicServices(): Promise<string[]> {
    return this.request(`${this.config.termusicGatewayUrl}/services`);
  }

  // 获取当前UDS socket路径
  async getTermusicSocket(): Promise<{ socket: string }> {
    return this.request(`${this.config.termusicGatewayUrl}/socket`);
  }

  // 调用Termusic方法
  async callTermusic(request: TermusicCallRequest): Promise<{ response?: any; raw?: string }> {
    return this.request(`${this.config.termusicGatewayUrl}/call`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // === 音频分析功能 ===

  // 获取音频峰值（波形）
  async getAudioPeaks(
    src: string,
    offset: number = 0,
    duration: number = 10,
    pps: number = 50
  ): Promise<AudioPeaksResponse> {
    const params = new URLSearchParams({
      src,
      offset: offset.toString(),
      duration: duration.toString(),
      pps: pps.toString(),
    });

    return this.request(`${this.config.audioGatewayUrl}/peaks?${params.toString()}`);
  }

  // 获取音频频段能量
  async getAudioBands(
    src: string,
    offset: number = 0,
    duration: number = 10,
    pps: number = 50,
    sr: number = 16000,
    fft: number = 1024
  ): Promise<AudioBandsResponse> {
    const params = new URLSearchParams({
      src,
      offset: offset.toString(),
      duration: duration.toString(),
      pps: pps.toString(),
      sr: sr.toString(),
      fft: fft.toString(),
    });

    return this.request(`${this.config.audioGatewayUrl}/bands?${params.toString()}`);
  }

  // === 环境和健康检查 ===

  // 检查环境依赖
  async checkEnvironment(): Promise<EnvironmentCheck> {
    return this.request(`${this.config.webServiceUrl}/check_env`);
  }

  // 检查所有服务健康状态
  async healthCheck(): Promise<{
    webService: boolean;
    termusicGateway: boolean;
    audioGateway: boolean;
  }> {
    const results = await Promise.allSettled([
      fetch(`${this.config.webServiceUrl}/check_env`),
      fetch(`${this.config.termusicGatewayUrl}/services`),
      fetch(`${this.config.audioGatewayUrl}/peaks?src=test&duration=1`),
    ]);

    return {
      webService: results[0].status === 'fulfilled' && results[0].value.ok,
      termusicGateway: results[1].status === 'fulfilled' && results[1].value.ok,
      audioGateway: results[2].status === 'fulfilled', // 允许404等错误，只要能连接
    };
  }

  // === 便利方法 ===

  // 播放本地文件（通过Termusic）
  async playLocalFile(filePath: string): Promise<void> {
    await this.callTermusic({
      method: 'package.Service/Play',
      payload: { uri: `file://${filePath}` },
    });
  }

  // 暂停播放
  async pausePlayback(): Promise<void> {
    await this.callTermusic({
      method: 'package.Service/Pause',
      payload: {},
    });
  }

  // 停止播放
  async stopPlayback(): Promise<void> {
    await this.callTermusic({
      method: 'package.Service/Stop',
      payload: {},
    });
  }

  // 设置音量
  async setVolume(volume: number): Promise<void> {
    await this.callTermusic({
      method: 'package.Service/SetVolume',
      payload: { volume: Math.max(0, Math.min(100, Math.round(volume * 100))) },
    });
  }

  // 中止当前请求
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // 清理资源
  destroy(): void {
    this.abort();
  }
}

// 全局连接器实例
let globalBackendConnector: BackendConnector | null = null;

// 获取或创建连接器实例
export function getBackendConnector(config?: Partial<BackendConfig>): BackendConnector {
  if (!globalBackendConnector) {
    globalBackendConnector = new BackendConnector(config);
  }
  return globalBackendConnector;
}

// 销毁连接器
export function destroyBackendConnector(): void {
  if (globalBackendConnector) {
    globalBackendConnector.destroy();
    globalBackendConnector = null;
  }
}

// 导出类型和常量
// 已在文件顶部声明了这些类型，避免重复导出造成冲突