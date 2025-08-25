# 集成指南（给 Cursor）

## 1) 后端：任选其一
- Python CLI：解压 `aidjmix-autoplaylist-python.zip`，按 README 跑，周期性写入 out/。
- TypeScript REST API：解压 `aidjmix-autoplaylist-api-ts.zip`，`npm i && npm run dev`，得到 `/api/aidjmix/autoplaylist`。

## 2) 前端桥接（保持你现有接口不变）
- 把 `AidjPlaylistClient.ts` 放到 `src/clients/` 或任意目录；
- 在你的 Manager 初始化时添加：
```ts
import { AidjPlaylistClient } from './clients/AidjPlaylistClient';
const client = new AidjPlaylistClient('/api/aidjmix/autoplaylist');
// TODO: 从你的曲库/后台取 TrackFeature[]
client.requestAutoPlaylist(tracks, 60, 24);
```

事件：
- `namespace:'automix', type:'plan'` —— 拿到 `{ plan, m3u, txt }`；
- `namespace:'automix', type:'error'` —— 失败信息。

## 3) TrackFeature 最小字段
```ts
type TrackFeature = { id: string; durationSec: number; bpm: number; keyCamelot: string; cueInSec?: number; cueOutSec?: number; path: string; };
// 可选：energyCurve / downbeats / vocality / title / artist
```

## 4) 参数建议（Techno）
- minutes: 60（或电台时段长度）
- beamWidth: 24（>2000首时降到 12~16）
- BPM 124–136，理想 128±4；小调更优；过渡 24 拍；bass swap。

## 5) 容错
- 前端 fetch 超时 30s；失败时回退到你现有播放逻辑。
