# API 合同（后端 REST）

`POST /api/aidjmix/autoplaylist`
- 入参：
```jsonc
{
  "tracks": [ /* TrackFeature[] */ ],
  "minutes": 60,
  "beamWidth": 24,
  "techno": true
}
```
- 回参：
```jsonc
{ "ok": true, "plan": { /* TransitionPlan */ }, "m3u": "...", "txt": "..." }
```

错误：HTTP 400（参数错误）或 500（内部错误）。
