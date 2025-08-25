# 接口与事件（对 Cursor 友好）

## 1) REST（已存在的后端，**这里不声明端口**）
**POST** `/api/aidjmix/autoplaylist`  
Body：
```json
{
  "tracks": [ /* TrackFeature[] */ ],
  "minutes": 60,
  "beamWidth": 24,
  "preset": "classic",
  "simpleHeadTail": false,
  "technique": "bass_swap"
}
```
Resp：
```json
{ "ok": true, "plan": {/* TransitionPlan */}, "m3u": "<string>", "txt": "<string>" }
```
> 说明：`technique` 仅用于记录/提示；后端忽略也无妨。

### TrackFeature（最小字段）
```ts
type TrackFeature = {
  id: string;
  durationSec: number;
  bpm: number;
  keyCamelot: string;
  path: string;
  title?: string; artist?: string;
  cueInSec?: number; cueOutSec?: number;
  energyCurve?: number[]; downbeats?: number[]; vocality?: number;
};
```

## 2) 事件（与 automix 对齐）
- `automix:request` → { minutes, beamWidth, preset, simpleHeadTail, technique }
- `automix:plan` → { plan, m3u, txt }
- `automix:error` → { message }
- `automix:mood` → { mood: { energy,valence,arousal } }
- `automix:bpm` → { bpm }
- `automix:transition` → { action:'next'|'prev'|'crossfade', fromTrack,toTrack,index }
- `visualization:preset` → { name }

> 监听封装：`onMood/onBpm/onTransition/onPreset/onPlan`。  
> 发送封装：`emitRequest/emitMood/emitBpm/emitPreset`。

## 3) CLI（离线流程）
```
python -m aidjmix.cli features.json out/ --minutes 60 --beam 24 --techno 1 --preset classic --simple_head_tail
```

## 4) 轮换选择（逻辑-only）
```ts
selectPreset(new Date(), DEFAULT_ROTATION, { avgBpm, dropoutRate, recentErrors }) -> { preset, simpleHeadTail, reason[] }
```
