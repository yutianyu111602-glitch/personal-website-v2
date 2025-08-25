# 对话总结（给 Cursor 速览）
- 目标：做一个“DJ Pro 风 + 空间银主题”的命令台，贴在电台下，点击 SYNC 自底部弹出；让用户感觉“在操作 AI 且很快有反馈”。
- 技术：不改后端端口/Manager，前端通过事件总线与已有 automix 管线对接；提供 preset/technique/simpleHeadTail 切换；请求时乐观反馈。
- 预设：deep_minimal/classic/peak_warehouse/hard_techno/hypnotic；足以支撑 24h 稳定运行，可按时间轮换。
- 我们已生成：Python/TS 的编排与导出、两次模拟（m3u/txt/json）与日志；并沉淀 API/事件/轮换逻辑。
- 本包聚焦：前端骨架 + 对接文档 + 大量 TODO，供 Cursor 快速“填 UI”。
