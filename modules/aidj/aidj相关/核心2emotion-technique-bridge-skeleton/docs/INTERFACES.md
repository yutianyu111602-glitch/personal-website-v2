# 事件与负载（对齐现有生态）

## 输入（订阅）
- `automix:mood` → `{ mood: { energy, valence, arousal } }`
- `automix:energy` → `{ energy }`（可选）
- `automix:bpm` → `{ bpm }`
- `automix:transition` → `{ action, fromTrack, toTrack, index, segment? }`
- `visualization:effect` → `{ pipeline: { tags?, nodes?[] } }`
- `radio:telemetry` → `{ dropoutRate?, recentErrors?, simpleHeadTail? }`

## 输出（广播）
- `global:config` → `{ theme: { accent, background, intensity, motion, contrast } }`
- `visualization:preset` → `{ name }`（通过 `emitPreset(name)`）
- `automix:technique_recommend` → `{ technique, hint, reason[], from, contextSnapshot }`

> 以上事件名**不与现有冲突**；如需重命名，请仅在 BusAdapter 层做别名。
