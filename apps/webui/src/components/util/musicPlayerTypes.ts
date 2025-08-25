// 音乐播放器类型定义和接口
export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  coverUrl?: string;
  url?: string; // 音频文件URL，用于wavesurfer.js加载
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: 'none' | 'one' | 'all';
  shuffleMode: boolean;
}

export interface MusicPlayerState {
  currentTrack: Track | null;
  playbackState: PlaybackState;
  playlist: Track[];
  isVisible: boolean;
  isMinimized: boolean;
}

// Termusic 后端接口定义
export interface TermusicAPI {
  // 播放控制
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  
  // 音量控制
  setVolume: (volume: number) => Promise<void>;
  mute: () => Promise<void>;
  unmute: () => Promise<void>;
  
  // 播放模式
  setRepeatMode: (mode: 'none' | 'one' | 'all') => Promise<void>;
  toggleShuffle: () => Promise<void>;
  
  // 进度控制
  seek: (position: number) => Promise<void>;
  
  // 播放列表管理
  loadPlaylist: (tracks: Track[]) => Promise<void>;
  addTrack: (track: Track) => Promise<void>;
  removeTrack: (trackId: string) => Promise<void>;
  
  // 状态获取
  getCurrentTrack: () => Promise<Track | null>;
  getPlaybackState: () => Promise<PlaybackState>;
  getPlaylist: () => Promise<Track[]>;
}

// 事件监听器类型
export interface MusicPlayerEvents {
  onTrackChange: (track: Track | null) => void;
  onPlaybackStateChange: (state: PlaybackState) => void;
  onPlaylistChange: (playlist: Track[]) => void;
  onError: (error: string) => void;
}

// 默认状态
export const defaultPlaybackState: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  isMuted: false,
  repeatMode: 'none',
  shuffleMode: false,
};

export const defaultMusicPlayerState: MusicPlayerState = {
  currentTrack: null,
  playbackState: defaultPlaybackState,
  playlist: [],
  isVisible: true,
  isMinimized: false,
};

// 工具函数
export const formatTime = (seconds: number): string => {
  if (!seconds || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};