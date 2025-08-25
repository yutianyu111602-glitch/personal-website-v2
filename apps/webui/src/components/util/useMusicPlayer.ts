import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Track, 
  PlaybackState, 
  MusicPlayerState, 
  TermusicAPI,
  MusicPlayerEvents,
  defaultMusicPlayerState
} from './musicPlayerTypes';

interface UseMusicPlayerOptions {
  termusicAPI?: TermusicAPI;
  updateInterval?: number;
  autoConnect?: boolean;
}

interface UseMusicPlayerReturn {
  playerState: MusicPlayerState;
  api: TermusicAPI | null;
  isConnected: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  updateState: () => Promise<void>;
  addEventListener: (eventName: keyof MusicPlayerEvents, handler: Function) => void;
  removeEventListener: (eventName: keyof MusicPlayerEvents, handler: Function) => void;
}

// 创建默认的Termusic API连接
const createTermusicConnection = async (): Promise<TermusicAPI> => {
  // 这里应该实现与实际Termusic后端的连接逻辑
  // 例如通过WebSocket、HTTP API或进程间通信
  
  // 检查是否有可用的Termusic实例
  const checkTermusicAvailable = async (): Promise<boolean> => {
    try {
      // 尝试连接到Termusic后端
      // 这可能是HTTP请求到localhost:port或其他通信方式
      const response = await fetch('http://localhost:8080/api/status', {
        method: 'GET',
        timeout: 2000,
      } as RequestInit);
      return response.ok;
    } catch {
      return false;
    }
  };

  const isAvailable = await checkTermusicAvailable();
  
  if (!isAvailable) {
    throw new Error('Termusic backend not available');
  }

  // 创建实际的API接口
  return {
    play: async () => {
      await fetch('http://localhost:8080/api/play', { method: 'POST' });
    },
    pause: async () => {
      await fetch('http://localhost:8080/api/pause', { method: 'POST' });
    },
    stop: async () => {
      await fetch('http://localhost:8080/api/stop', { method: 'POST' });
    },
    next: async () => {
      await fetch('http://localhost:8080/api/next', { method: 'POST' });
    },
    previous: async () => {
      await fetch('http://localhost:8080/api/previous', { method: 'POST' });
    },
    setVolume: async (volume: number) => {
      await fetch('http://localhost:8080/api/volume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume })
      });
    },
    mute: async () => {
      await fetch('http://localhost:8080/api/mute', { method: 'POST' });
    },
    unmute: async () => {
      await fetch('http://localhost:8080/api/unmute', { method: 'POST' });
    },
    setRepeatMode: async (mode) => {
      await fetch('http://localhost:8080/api/repeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
    },
    toggleShuffle: async () => {
      await fetch('http://localhost:8080/api/shuffle', { method: 'POST' });
    },
    seek: async (position: number) => {
      await fetch('http://localhost:8080/api/seek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position })
      });
    },
    loadPlaylist: async (tracks) => {
      await fetch('http://localhost:8080/api/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracks })
      });
    },
    addTrack: async (track) => {
      await fetch('http://localhost:8080/api/playlist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track })
      });
    },
    removeTrack: async (trackId) => {
      await fetch(`http://localhost:8080/api/playlist/remove/${trackId}`, {
        method: 'DELETE'
      });
    },
    getCurrentTrack: async () => {
      const response = await fetch('http://localhost:8080/api/current-track');
      return response.json();
    },
    getPlaybackState: async () => {
      const response = await fetch('http://localhost:8080/api/playback-state');
      return response.json();
    },
    getPlaylist: async () => {
      const response = await fetch('http://localhost:8080/api/playlist');
      return response.json();
    }
  };
};

export const useMusicPlayer = (options: UseMusicPlayerOptions = {}): UseMusicPlayerReturn => {
  const {
    termusicAPI,
    updateInterval = 1000,
    autoConnect = true
  } = options;

  const [playerState, setPlayerState] = useState<MusicPlayerState>(defaultMusicPlayerState);
  const [api, setApi] = useState<TermusicAPI | null>(termusicAPI || null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventListenersRef = useRef<Map<keyof MusicPlayerEvents, Set<Function>>>(new Map());

  // 事件监听器管理
  const addEventListener = useCallback((eventName: keyof MusicPlayerEvents, handler: Function) => {
    if (!eventListenersRef.current.has(eventName)) {
      eventListenersRef.current.set(eventName, new Set());
    }
    eventListenersRef.current.get(eventName)!.add(handler);
  }, []);

  const removeEventListener = useCallback((eventName: keyof MusicPlayerEvents, handler: Function) => {
    eventListenersRef.current.get(eventName)?.delete(handler);
  }, []);

  const emitEvent = useCallback((eventName: keyof MusicPlayerEvents, ...args: any[]) => {
    const listeners = eventListenersRef.current.get(eventName);
    if (listeners) {
      listeners.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in ${eventName} event handler:`, error);
        }
      });
    }
  }, []);

  // 连接到Termusic后端
  const connect = useCallback(async () => {
    try {
      setError(null);
      
      let apiInstance: TermusicAPI;
      
      if (termusicAPI) {
        apiInstance = termusicAPI;
      } else {
        apiInstance = await createTermusicConnection();
      }
      
      setApi(apiInstance);
      setIsConnected(true);
      
      // 初始化状态
      await updateState();
      
      console.log('✅ Connected to Termusic backend');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Termusic';
      setError(errorMessage);
      setIsConnected(false);
      console.warn('❌ Failed to connect to Termusic backend:', errorMessage);
      
      emitEvent('onError', errorMessage);
    }
  }, [termusicAPI]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    
    setApi(null);
    setIsConnected(false);
    setError(null);
    
    console.log('🔌 Disconnected from Termusic backend');
  }, []);

  // 更新播放器状态
  const updateState = useCallback(async () => {
    if (!api || !isConnected) return;

    try {
      const [currentTrack, playbackState, playlist] = await Promise.all([
        api.getCurrentTrack(),
        api.getPlaybackState(),
        api.getPlaylist()
      ]);

      setPlayerState(prev => {
        const newState = {
          ...prev,
          currentTrack,
          playbackState,
          playlist
        };

        // 触发相应的事件
        if (prev.currentTrack?.id !== currentTrack?.id) {
          emitEvent('onTrackChange', currentTrack);
        }
        
        if (JSON.stringify(prev.playbackState) !== JSON.stringify(playbackState)) {
          emitEvent('onPlaybackStateChange', playbackState);
        }
        
        if (JSON.stringify(prev.playlist) !== JSON.stringify(playlist)) {
          emitEvent('onPlaylistChange', playlist);
        }

        return newState;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update player state';
      setError(errorMessage);
      emitEvent('onError', errorMessage);
    }
  }, [api, isConnected, emitEvent]);

  // 自动连接
  useEffect(() => {
    if (autoConnect && !api && !isConnected) {
      connect();
    }
  }, [autoConnect, api, isConnected, connect]);

  // 定期更新状态
  useEffect(() => {
    if (isConnected && api) {
      updateIntervalRef.current = setInterval(updateState, updateInterval);
      
      return () => {
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
          updateIntervalRef.current = null;
        }
      };
    }
  }, [isConnected, api, updateState, updateInterval]);

  // 清理资源
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    playerState,
    api,
    isConnected,
    error,
    connect,
    disconnect,
    updateState,
    addEventListener,
    removeEventListener
  };
};