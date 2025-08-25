# 集成核对清单（一步步走）
- [ ] 替换 EventBusAdapter 为你的 UnifiedEventBus（或直接使用 unified 模板）
- [ ] 把 <AIDJConsoleSkeleton /> 挂在电台播放器下方
- [ ] 提供真实 tracks 到 AidjPlaylistClient.requestAutoPlaylist
- [ ] Tailwind/shadcn/ui/framer-motion 安装并可用
- [ ] 使用 SpaceSilverTokens.css 的变量构建主题（或映射到 Tailwind config）
- [ ] 验证事件流：mood/bpm/transition/preset/plan 均有回显
- [ ] 预设/手法/开关变更后，能在 UI 实时体现
- [ ] Generate 后，日志有“请求→完成”的两条记录
