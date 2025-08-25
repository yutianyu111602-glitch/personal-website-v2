# 集成说明（逻辑注入，不改你的 Manager 结构）

## 前端（TypeScript）
```ts
import { selectPreset } from './rotation/ts/presetScheduler';
import { AidjPlaylistClient } from './clients/AidjPlaylistClient';

const client = new AidjPlaylistClient('/api/aidjmix/autoplaylist'); // 仅示例：你的实际 endpoint 保持不变
const telemetry = { avgBpm: window.__NOWPLAYING_BPM__ ?? 128, dropoutRate: 0.0, recentErrors: 0 };

const sel = selectPreset(new Date(), undefined, telemetry);
// ↓ 只把逻辑结果放进 body；不改你的事件/状态机
client.requestAutoPlaylist(tracks, 60, 24 /* beam */);
// 在请求体里附带 preset/simpleHeadTail 的位置已在后端支持：
/*
fetch('/api/aidjmix/autoplaylist', { body: JSON.stringify({ tracks, minutes:60, beamWidth:24, preset: sel.preset, simpleHeadTail: sel.simpleHeadTail }) })
*/
```

## Python CLI（离线轮播）
```py
from rotation.py.preset_scheduler import select_preset
import datetime as dt, subprocess, json, tempfile

sel = select_preset(dt.datetime.now())
args = ['python','-m','aidjmix.cli','features.json','out/','--minutes','60','--beam','24','--techno','1','--preset', sel['preset']]
if sel['simple_head_tail']:
    args.append('--simple_head_tail')
subprocess.run(args, check=True)
```
