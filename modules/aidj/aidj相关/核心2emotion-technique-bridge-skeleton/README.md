# Emotion ⟷ Technique Bridge (Logic-Only Skeleton)

> 变量与环境名 **全部留空**，由 Cursor 填写。此包只提供 **逻辑与注释**，不改端口、不绑定总线。  
> 目标：将“情绪三元组 (energy/valence/arousal)” 与 “切歌手法 (20 种)” 做成**可插拔**的桥接；通过事件总线广播**建议**，不强制。

- 更新时间：2025-08-24 20:29:41
- 组成：
  - `src/core/EmotionCoreManager.ts` —— 统一情绪核心（脚手架 + 可选桥接）
  - `src/console/techniqueSelector.ts` —— 20 种手法 + 情绪偏置选择器（逻辑-only）
  - `src/bridge/BusAdapter.ts` —— 事件总线占位（**必须由 Cursor 绑定到你的 UnifiedEventBus**）
  - `src/types/shared.ts` —— 类型与契约（Preset/Technique/Emotion/...）
  - `docs/SETUP_CURSOR.md` —— Cursor 需要填写的内容（变量/环境/总线映射）
  - `docs/INTERFACES.md` —— 事件/负载/约束（对齐你现有命名）
  - `docs/CONFIG_TODO.md` —— 必填项清单（留空变量列表）
  - `docs/CHANGELOG.md` —— 变更记录

> 开关：默认 **关闭** 统一主循环与桥接；启用需在 **实例化 EmotionCoreManager** 时传入配置（见文档）。
