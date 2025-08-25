# aidjmix · AutoPlaylist REST API (Techno 优化)

一个极简的 **Express + TypeScript** 服务：接受曲目特征，返回自动编排结果（M3U/TXT/JSON）。
- 仅算法与输出逻辑；**所有音频分析接口留空**（注释已标明）。
- 默认使用 **Techno** 的权重与规则；可通过环境变量覆盖。

## 运行
```bash
npm i
npm run dev   # 默认端口 8787
# 生产：npm run build && npm start
```

## API
### POST /api/aidjmix/autoplaylist
- Body(JSON)：
```jsonc
{
  "tracks": [ /* TrackFeature[]，见 src/types.ts */ ],
  "minutes": 60,
  "beamWidth": 24,
  "techno": true
}
```
- 返回：
```jsonc
{
  "plan": { /* TransitionPlan */ },
  "m3u": "string content",
  "txt": "string content"
}
```

## 环境
- `PORT`（默认 8787）
- `TARGET_MINUTES`、`MAX_STRETCH_PCT`、`BEAM_WIDTH`（可覆盖）
