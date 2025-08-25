# 适配说明：保留你现有接口

- **不改** AutoDJManager / AutoMixManager；仅新增 `AidjPlaylistClient`。
- 所有广播事件依然走 `UnifiedEventBus`。
- 若你的后端已有 `/api/autodj/status` / `/api/nowplaying`，保持不变；新接口只加 `/api/aidjmix/autoplaylist`。
- 环境变量保持你已有风格；新增：`PORT`、`MAX_STRETCH_PCT`、`TARGET_MINUTES`、`BEAM_WIDTH`（可选）。
