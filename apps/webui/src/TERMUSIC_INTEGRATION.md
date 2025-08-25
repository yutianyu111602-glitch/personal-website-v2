# Termusic 后端集成指南

## 概述
天宫科技音乐播放器已集成对 [Termusic](https://github.com/tramhao/termusic) 开源播放器的完整支持，提供无缝的音乐播放体验。

## 快速开始

### 1. Termusic 后端设置
```bash
# 克隆 Termusic 项目
git clone https://github.com/tramhao/termusic.git
cd termusic

# 编译并运行 (需要 Rust 环境)
cargo build --release
cargo run --release
```

### 2. API 服务配置
在 Termusic 配置中启用 HTTP API 服务：
```toml
# ~/.config/termusic/config.toml
[api]
enabled = true
port = 8080
host = "127.0.0.1"
cors = true
```

### 3. 前端连接
应用会自动尝试连接到 `http://localhost:8080`，无需额外配置。

## API 接口文档

### 播放控制
| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/play` | POST | 开始播放 |
| `/api/pause` | POST | 暂停播放 |
| `/api/stop` | POST | 停止播放 |
| `/api/next` | POST | 下一首 |
| `/api/previous` | POST | 上一首 |

### 音量控制
| 端点 | 方法 | 参数 | 描述 |
|------|------|------|------|
| `/api/volume` | POST | `{"volume": 0.7}` | 设置音量 (0.0-1.0) |
| `/api/mute` | POST | - | 静音 |
| `/api/unmute` | POST | - | 取消静音 |

### 播放模式
| 端点 | 方法 | 参数 | 描述 |
|------|------|------|------|
| `/api/repeat` | POST | `{"mode": "none"}` | 设置重复模式 |
| `/api/shuffle` | POST | - | 切换随机播放 |

### 进度控制
| 端点 | 方法 | 参数 | 描述 |
|------|------|------|------|
| `/api/seek` | POST | `{"position": 120}` | 跳转到指定位置(秒) |

### 播放列表管理
| 端点 | 方法 | 参数 | 描述 |
|------|------|------|------|
| `/api/playlist` | GET | - | 获取播放列表 |
| `/api/playlist` | POST | `{"tracks": [...]}` | 加载播放列表 |
| `/api/playlist/add` | POST | `{"track": {...}}` | 添加歌曲 |
| `/api/playlist/remove/{id}` | DELETE | - | 删除歌曲 |

### 状态查询
| 端点 | 方法 | 返回 | 描述 |
|------|------|------|------|
| `/api/status` | GET | `{"status": "ok"}` | 服务状态 |
| `/api/current-track` | GET | `Track对象` | 当前播放歌曲 |
| `/api/playback-state` | GET | `PlaybackState对象` | 播放状态 |

## 数据结构

### Track 对象
```typescript
interface Track {
  id: string;          // 唯一标识符
  title: string;       // 歌曲标题  
  artist: string;      // 艺术家
  album?: string;      // 专辑名称
  duration?: number;   // 时长(秒)
  coverUrl?: string;   // 封面图片URL
}
```

### PlaybackState 对象
```typescript
interface PlaybackState {
  isPlaying: boolean;      // 是否正在播放
  currentTime: number;     // 当前播放时间(秒)
  duration: number;        // 总时长(秒)
  volume: number;          // 音量 (0.0-1.0)
  isMuted: boolean;        // 是否静音
  repeatMode: 'none' | 'one' | 'all';  // 重复模式
  shuffleMode: boolean;    // 随机播放
}
```

## 实际使用示例

### 基本播放控制
```typescript
import { useMusicPlayer } from './components/util/useMusicPlayer';

function MyComponent() {
  const { playerState, api, isConnected } = useMusicPlayer({
    autoConnect: true,
    updateInterval: 1000
  });

  const handlePlay = async () => {
    if (api && isConnected) {
      await api.play();
    }
  };

  const handleVolumeChange = async (volume: number) => {
    if (api && isConnected) {
      await api.setVolume(volume);
    }
  };

  return (
    <div>
      <h3>{playerState.currentTrack?.title || '未播放'}</h3>
      <button onClick={handlePlay}>
        {playerState.playbackState.isPlaying ? '暂停' : '播放'}
      </button>
      <input 
        type="range" 
        min="0" 
        max="1" 
        step="0.01"
        value={playerState.playbackState.volume}
        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
      />
    </div>
  );
}
```

### 事件监听
```typescript
const { addEventListener } = useMusicPlayer();

useEffect(() => {
  // 监听歌曲切换
  addEventListener('onTrackChange', (track: Track) => {
    console.log('现在播放:', track.title);
    // 更新通知、标题等
  });

  // 监听播放状态变化
  addEventListener('onPlaybackStateChange', (state: PlaybackState) => {
    console.log('播放状态:', state.isPlaying ? '播放中' : '已暂停');
    // 更新UI状态
  });

  // 监听错误
  addEventListener('onError', (error: string) => {
    console.error('播放器错误:', error);
    // 显示错误提示
  });
}, [addEventListener]);
```

## 高级功能

### 自定义播放列表
```typescript
const loadCustomPlaylist = async () => {
  const customTracks: Track[] = [
    {
      id: 'track-1',
      title: '星河漫步',
      artist: '天宫科技音乐团队',
      album: '深空之声',
      duration: 248
    },
    // 更多歌曲...
  ];

  if (api && isConnected) {
    await api.loadPlaylist(customTracks);
  }
};
```

### 实时状态同步
```typescript
// 每秒更新播放状态
useEffect(() => {
  const interval = setInterval(async () => {
    if (api && isConnected) {
      try {
        const state = await api.getPlaybackState();
        // 更新UI状态
      } catch (error) {
        console.warn('状态更新失败:', error);
      }
    }
  }, 1000);

  return () => clearInterval(interval);
}, [api, isConnected]);
```

## 错误处理

### 连接失败处理
```typescript
const { error, isConnected, connect } = useMusicPlayer();

if (!isConnected && error) {
  return (
    <div className="music-player-error">
      <p>连接Termusic失败: {error}</p>
      <button onClick={connect}>重新连接</button>
    </div>
  );
}
```

### 优雅降级
当Termusic后端不可用时，播放器会：
1. 显示友好的错误信息
2. 保持UI可交互(但功能受限)
3. 定期尝试重新连接
4. 缓存用户操作，连接恢复后执行

## 开发调试

### 启用调试日志
```typescript
// 在浏览器控制台中执行
localStorage.setItem('music-player-debug', 'true');

// 查看详细的API调用日志
localStorage.setItem('music-player-verbose', 'true');
```

### 模拟API响应
```typescript
// 用于测试的Mock API
const createMockAPI = () => ({
  play: async () => console.log('🎵 Mock Play'),
  pause: async () => console.log('⏸️ Mock Pause'),
  getCurrentTrack: async () => ({
    id: 'mock-1',
    title: '测试歌曲',
    artist: '测试艺术家',
    duration: 180
  }),
  // ... 其他方法
});
```

## 性能优化

### 减少API调用频率
- 播放状态更新：1秒间隔
- 播放列表更新：仅在变化时
- 歌曲信息缓存：本地存储

### 内存管理
- 定期清理过期缓存
- 限制播放历史记录数量
- 优化图片资源加载

## 故障排除

### 常见问题

**Q: 播放器显示"连接失败"**
A: 
1. 确认 Termusic 后端正在运行
2. 检查端口 8080 是否可访问
3. 验证 CORS 设置是否正确

**Q: 音量控制不响应**
A:
1. 检查系统音量设置
2. 验证 Termusic 音频驱动
3. 查看浏览器控制台错误信息

**Q: 播放列表不更新**
A:
1. 检查网络连接
2. 验证 Termusic API 权限
3. 清理应用缓存并重新加载

### 调试工具
```bash
# 检查 Termusic API 可用性
curl http://localhost:8080/api/status

# 查看当前播放状态
curl http://localhost:8080/api/playback-state

# 测试播放控制
curl -X POST http://localhost:8080/api/play
```

## 部署注意事项

### 生产环境
- 配置正确的API端点
- 启用HTTPS (如果需要)
- 设置适当的CORS策略
- 实现API认证 (如果需要)

### 网络环境
- 确保防火墙允许API端口
- 配置反向代理 (如使用)
- 设置适当的超时时间

## 支持的功能

### ✅ 已实现
- [x] 基本播放控制 (播放/暂停/停止)
- [x] 音量控制和静音
- [x] 歌曲切换 (上一首/下一首)
- [x] 进度条拖拽
- [x] 实时状态同步
- [x] 错误处理和重连机制
- [x] 响应式UI设计
- [x] 最小化/展开功能

### 🚧 计划中
- [ ] 播放队列管理
- [ ] 歌词显示
- [ ] 均衡器控制
- [ ] 播放历史记录
- [ ] 快捷键支持

---

**作者**: 麻蛇  
**版权**: @天宫科技  
**最后更新**: 2025年1月  

> 🎵 更多详细信息请参考 [Termusic 官方文档](https://github.com/tramhao/termusic)