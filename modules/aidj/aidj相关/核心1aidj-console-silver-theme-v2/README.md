# AIDJ 控制台骨架 v2（空间银主题 · 参考 DJ Pro · 接入 automix 事件）

> 只含结构与逻辑，**不渲染 UI**。视觉与动效全部留给 Cursor 完成。
> 已对齐你的 automix 事件命名（`mood/bpm/transition/preset/plan`），与 `AutoDJManager/AutoMixManager` 零侵入接入。

**更新时间：** 2025-08-24 19:42:45

## 组成
- `src/console/AIDJConsoleSkeleton.tsx` —— 命令台骨架（Bottom Sheet，SYNC 弹出）
- `src/console/EventBusAdapter.ts` —— 事件总线占位（默认内存总线）
- `src/console/EventBusAdapter.unified.ts` —— **替换模板**：按你的 `UnifiedEventBus` 改这份
- `src/console/ConsoleStore.ts` —— 状态管理（Zustand）
- `src/clients/AidjPlaylistClient.ts` —— 请求自动歌单（带 preset/simpleHeadTail/technique）
- `src/console/SpaceSilverTokens.css` —— 主题变量（空间银）
- `src/types/shared.ts` —— 协议类型
- `src/style/USER_STYLE_TOKENS.json`/`USER_STYLE_GUIDE.md`/`ART_STYLE_TAGS.md` —— 标注你的美术风格
- `rotation/presetScheduler.ts` —— 轮换逻辑（不含端口）
- `demo/AppStub.tsx` —— 演示挂载点（不渲染，仅占位）

## 文档（给 Cursor）
- `docs/INTERFACES.md` —— 事件/接口/负载结构（**一切字段解释**）
- `docs/WIRING_GUIDE.md` —— 如何对接 `UnifiedEventBus`（含模板）
- `docs/CURSOR_TASKS.md` —— UI 待办清单（优先级/验收标准）
- `docs/CHECKLIST.md` —— 集成核对清单（一步步过）
- `docs/EVENT_MATRIX.md` —— 事件流矩阵（谁发谁收）
- `docs/STYLE_GUIDE.md` —— 空间银主题落地方法（Tailwind/shadcn/ui/framer-motion）
- `docs/API_MOCKS.http` —— HTTP 请求样例（无端口，占位路径）
- `docs/GLOSSARY.md` —— 术语表
- `docs/CHANGELOG.md` —— 变更记录
- `docs/CONVERSATION_SUMMARY.md` —— 我们对话结论回顾（供 Cursor 理解上下文）

> 本包不包含端口/服务脚手架，只写逻辑/类型/事件。

