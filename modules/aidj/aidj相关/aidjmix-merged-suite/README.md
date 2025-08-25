# aidjmix · Merged Suite (Techno 预设已集成)

包含：
- python-cli/  —— Python CLI（已集成预设与 simple_head_tail）
- ts-api/      —— TypeScript REST API（已集成预设与 simpleHeadTail）
- frontend-bridge/ —— 前端桥接（AidjPlaylistClient.ts + 指南）
- docs/        —— 设计/契约/清单/补丁

## 运行（TS API）
```bash
cd ts-api
npm i
npm run dev   # PORT=8787
# 测试：
curl -X POST http://localhost:8787/api/aidjmix/autoplaylist   -H 'Content-Type: application/json'   -d '{"tracks":[{"id":"t1","durationSec":240,"bpm":128,"keyCamelot":"8A","path":"/music/a.mp3"}],"preset":"peak_warehouse","simpleHeadTail":true}'
```

## 运行（Python CLI）
```bash
cd python-cli
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m aidjmix.cli data/tracks.example.json out/ --minutes 60 --beam 24 --techno 1 --preset classic --simple_head_tail
```

## 前端接入
将 frontend-bridge/AidjPlaylistClient.ts 放到你的前端工程，指向 ts-api 的地址，收到 plan/m3u 事件后导入电台播放队列。
