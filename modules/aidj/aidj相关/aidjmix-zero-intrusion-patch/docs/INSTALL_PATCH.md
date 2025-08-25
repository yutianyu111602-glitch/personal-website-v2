# 安装与集成（零侵入）

## 1) 放置文件
把 `src/adapter/*.ts` 与 `src/types/contracts.ts` 复制到你的前端工程（路径随意）。

## 2) 初始化（入口处）
```ts
import { AutoMixRouterAdapter } from './adapter/AutoMixRouterAdapter';
import { EmotionTechniqueBridge } from './adapter/EmotionTechniqueBridge';
import { NowPlayingMirror } from './adapter/NowPlayingMirror';

// 事件总线（页面已存在）
const Bus = (window as any).UnifiedEventBus;

// A) 建议手法桥（仅建议，不强制）
new EmotionTechniqueBridge({ EventBus: Bus, enable: true }).attach();

// B) 过渡路由（把 transition 事件转发到后端 API）
new AutoMixRouterAdapter({
  ENDPOINT_NEXT: '',                 // ← Cursor 填 '/api/music/next'
  ENDPOINT_PREV: '',                 // ← '/api/music/previous'
  ENDPOINT_CROSSF: '',               // ← '/api/music/crossfade?duration={ms}'
  ENDPOINT_VOLUME: '',               // ← '/api/music/volume?level={v}'
  DEFAULT_CROSSFADE_MS: 4000,
  SAFETY_RATE_LIMIT_MS: 1200
}).attach();

// C) （可选）统一拉取 nowplaying → 广播 bpm/transition
// new NowPlayingMirror({ NOWPLAYING_URL: '', EventBus: Bus }).attach();
```

## 3) UI 侧采用推荐值（不强制）
当未手动选择手法时，使用总线 `automix:technique_recommend` 的 technique：
```ts
let rec: any = null;
Bus.on('automix','technique_recommend',(e:any)=>{ rec = e.data; });

const technique = userSelectedTechnique ?? rec?.technique ?? 'simple_head_tail';
await client.requestAutoPlaylist(tracks, { minutes: 60, technique });
```

## 4) 安全与回滚
- 关闭建议：`enable:false`（EmotionTechniqueBridge 构造参数）  
- 关闭路由：不调用 `attach()` 即可  
- 即刻回滚：UI 仍然可手动选择手法（不给推荐值）

