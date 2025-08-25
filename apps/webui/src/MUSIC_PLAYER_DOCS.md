# 天宫科技音乐播放器文档

## 概述

天宫科技音乐播放器是一个现代化的Web音乐播放器组件，专为全屏视觉体验应用设计，具有银色主题的流动配色方案和shader动画效果。播放器采用极简悬浮设计，支持电台节目表功能和智能音量控制。

## 主要特性

### 🎵 播放功能
- **基本控制**：播放/暂停、上一首/下一首
- **音量控制**：智能音量滑块、鼠标滚轮调节、快速静音
- **进度控制**：拖拽进度条、精确定位播放
- **循环模式**：支持单曲循环、列表循环、随机播放

### 📻 电台功能
- **24小时节目表**：完整的节目安排展示
- **实时节目信息**：自动更新当前播放节目
- **节目切换**：点击选择特定节目
- **直播状态**：实时显示节目状态

### 🎨 视觉效果
- **鼠标响应**：播放器随鼠标位置微调
- **播放动画**：动态音频可视化波形
- **状态指示**：播放状态脉冲效果
- **流畅动画**：Motion.js驱动的流畅过渡

### 🖱️ 交互优化
- **智能音量**：悬停显示、滚轮调节、点击静音
- **底部节目表**：不干扰主界面的节目列表
- **拖拽指示器**：类似移动端的操作体验
- **键盘支持**：完整的键盘快捷键

## 组件架构

### 核心组件
```typescript
MusicPlayer: React.FC<MusicPlayerProps>
```

### 类型定义
- `MusicPlayerProps`: 组件属性接口
- `MusicPlayerState`: 播放器状态
- `TermusicAPI`: 后端API接口
- `Program`: 节目信息类型

### 关键文件
- `/components/MusicPlayer.tsx` - 主播放器组件
- `/components/util/musicPlayerTypes.ts` - 音乐播放器类型定义
- `/components/util/programTypes.ts` - 节目表类型和数据

## API 接口

### Termusic API 集成

播放器设计为与[termusic](https://github.com/tramhao/termusic)后端集成：

```typescript
interface TermusicAPI {
  // 播放控制
  play(): Promise<void>
  pause(): Promise<void>
  stop(): Promise<void>
  next(): Promise<void>
  previous(): Promise<void>
  
  // 音量控制
  setVolume(volume: number): Promise<void>
  mute(): Promise<void>
  unmute(): Promise<void>
  
  // 播放列表
  loadPlaylist(tracks: Track[]): Promise<void>
  addTrack(track: Track): Promise<void>
  removeTrack(trackId: string): Promise<void>
  
  // 状态查询
  getCurrentTrack(): Promise<Track | null>
  getPlaybackState(): Promise<PlaybackState>
  getPlaylist(): Promise<Track[]>
}
```

### Mock API 开发模式

在没有后端连接时，播放器使用Mock API进行开发和演示：

```typescript
const createMockTermusicAPI = (): TermusicAPI => {
  // 返回模拟的API实现
  // 自动根据当前时间显示对应的节目信息
}
```

## 使用方法

### 基础使用

```tsx
import { MusicPlayer } from './components/MusicPlayer';

function App() {
  return (
    <div className="app">
      {/* 其他应用内容 */}
      <MusicPlayer 
        isVisible={true}
        isWelcomeMode={false}
      />
    </div>
  );
}
```

### 高级配置

```tsx
const termusicAPI = new TermusicAPIClient();

const musicPlayerEvents = {
  onPlaybackStateChange: (state) => console.log('播放状态变化:', state),
  onTrackChange: (track) => console.log('歌曲切换:', track),
  onError: (error) => console.error('播放器错误:', error)
};

<MusicPlayer 
  isVisible={!isWelcomeMode}
  termusicAPI={termusicAPI}
  events={musicPlayerEvents}
  className="custom-player"
/>
```

## 音量控制说明

### 多种调节方式

1. **鼠标滚轮**：在播放器上滚动鼠标滚轮调节音量
2. **滑块拖拽**：拖动水平滑块精确设置音量
3. **快速静音**：点击音量图标快速静音/取消静音
4. **键盘控制**：使用方向键或数字键调节

### 视觉反馈

- 音量变化时显示百分比
- 静音状态图标变化
- 实时音量条更新
- 操作提示显示

## 节目表功能

### 节目数据结构

```typescript
interface Program {
  id: string                // 节目唯一标识
  title: string            // 节目名称
  description: string      // 节目描述
  startTime: string        // 开始时间 (HH:MM)
  endTime: string          // 结束时间 (HH:MM)
  duration: number         // 时长（分钟）
  genre: string           // 节目类型
  host?: string           // 主持人
  coverUrl?: string       // 封面图片
  isLive?: boolean        // 是否直播
  tags?: string[]         // 标签
}
```

### 默认节目安排

播放器包含24小时的默认节目安排：

- **06:00-08:00** 星河晨光 - 轻音乐
- **08:00-10:00** 深空漫步 - 科幻音乐
- **10:00-12:00** 银河咖啡厅 - 爵士音乐
- **12:00-14:00** 星际午餐 - 流行音乐
- **14:00-16:00** 宇宙下午茶 - 古典音乐
- **16:00-18:00** 黄昏交响 - 交响乐
- **18:00-20:00** 星夜电台 - 电子音乐
- **20:00-22:00** 深夜漫谈 - 心灵音乐
- **22:00-00:00** 午夜星河 - 新世纪音乐
- **00:00-06:00** 凌晨冥想 - 冥想音乐

## 兼容性优化

### CSS 兼容性

播放器使用了增强的CSS兼容性：

```css
/* Webkit前缀支持 */
-webkit-backdrop-filter: blur(20px);
backdrop-filter: blur(20px);

/* 硬件加速优化 */
transform: translate3d(0, 0, 0);
-webkit-transform: translate3d(0, 0, 0);

/* 3D变换支持 */
-webkit-backface-visibility: hidden;
backface-visibility: hidden;
```

### JavaScript 兼容性

- ���用现代ES6+语法，通过Babel转译
- 支持所有主流浏览器
- 渐进式增强，基础功能在所有浏览器中可用

### 响应式设计

- 移动端优化的触摸交互
- 自适应不同屏幕尺寸
- 高DPI屏幕支持

## 性能优化

### 动画性能

```typescript
// 硬件加速优化
style={{
  willChange: 'transform, opacity',
  perspective: '1000px',
  transformStyle: 'preserve-3d'
}}

// 防抖音量调节
const volumeTimeoutRef = useRef<NodeJS.Timeout>();
```

### 内存管理

- 及时清理定时器和事件监听器
- 使用useCallback和useMemo避免重复渲染
- 组件卸载时的资源清理

### 网络优化

- 音频文件预加载策略
- 节目信息缓存机制
- API请求防抖和重试

## 主题定制

### 银色主题配色

```css
--player-bg: radial-gradient(ellipse at center, 
  rgba(255,255,255,0.08) 0%, 
  rgba(255,255,255,0.02) 70%);
  
--player-accent: rgba(59, 130, 246, 0.8);
--player-text: rgba(255, 255, 255, 0.95);
--player-secondary: rgba(255, 255, 255, 0.65);
```

### 自定义样式

可以通过CSS变量或className属性自定义播放器外观：

```css
.custom-player {
  --player-accent: rgba(147, 51, 234, 0.8); /* 紫色主题 */
}
```

## 故障排除

### 常见问题

1. **播放器不显示**
   - 检查`isVisible`和`isWelcomeMode`属性
   - 确认CSS样式正确加载

2. **音量控制无响应**
   - 检查Termusic API连接
   - 确认音频权限已获取

3. **节目信息不更新**
   - 检查系统时间设置
   - 确认定时器正常运行

4. **动画卡顿**
   - 检查浏览器硬件加速设置
   - 减少同时运行的动画数量

### 调试模式

启用详细日志：

```typescript
const musicPlayerEvents = {
  onError: (error) => {
    console.error('播放器错误:', error);
    // 发送错误报告
  }
};
```

## 更新历史

### v2.0.0 (最新)
- ✅ 重新设计为底部节目表，不干扰主界面
- ✅ 移除播放器外线框，纯悬浮设计
- ✅ 改进音量控制为多种调节方式
- ✅ 全面兼容性优化和代码检查
- ✅ 统一图标设计和尺寸

### v1.0.0
- 基础播放功能实现
- 电台节目表集成
- 鼠标响应效果
- Termusic API支持

## 技术栈

- **React 18+** - 组件框架
- **TypeScript** - 类型安全
- **Motion/React** - 动画引擎
- **Tailwind CSS** - 样式框架
- **Termusic** - 后端播放引擎

## 许可证

本项目遵循 MIT 许可证。

---

**© 天宫科技 Made By 麻蛇**

如有问题或建议，请联系开发团队。