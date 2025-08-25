# 事件流矩阵

| 事件 | 发出方 | 订阅方 | 负载 | 备注 |
|---|---|---|---|---|
| automix:request | 控制台/客户端 | 控制台UI/日志 | { minutes, beamWidth, preset, simpleHeadTail, technique } | 乐观反馈，显示“AI正在编排” |
| automix:plan | 后端/客户端 | 控制台UI/日志 | { plan, m3u, txt } | 完成提示 + 更新统计 |
| automix:error | 客户端 | 控制台UI | { message } | 错误提示 |
| automix:mood | AutoDJ/AutoMix | 控制台UI | { mood } | 实时情绪 |
| automix:bpm | AutoDJ/AutoMix | 控制台UI | { bpm } | BPM 指示 |
| automix:transition | AutoDJ/AutoMix | 控制台UI | { action, fromTrack, toTrack, index } | 日志/动画 |
| visualization:preset | AutoMix | 控制台UI | { name } | 背景预设名 |
