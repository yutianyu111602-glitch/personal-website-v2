# AidjMix Zero‑Intrusion Patch
更新：2025-08-24 22:53:06

**目标**：在**不改动**你的 `AutoMixManager` 与 `EmotionCoreManager` 源码的前提下：  
- 让情绪/能量/BPM → 自动“建议切歌手法”（仅建议，不强制）；  
- 让 `automix:transition` 事件**路由**到电台 REST（`/api/music/next` 等）；  
- （可选）从 `/api/nowplaying` 同步 BPM/键位到事件总线，减少重复拉取；  
- 预设命名与 UI 背景保持一致。

> 端口、URL、环境变量全部留空，Cursor 去填。

组成：
- `src/adapter/EmotionTechniqueBridge.ts`  
- `src/adapter/AutoMixRouterAdapter.ts`  
- `src/adapter/NowPlayingMirror.ts`（可选）  
- `src/adapter/SafePresetMapper.ts`  
- `src/types/contracts.ts`  
- `docs/INSTALL_PATCH.md` / `docs/CURSOR_CHECKLIST.md`
