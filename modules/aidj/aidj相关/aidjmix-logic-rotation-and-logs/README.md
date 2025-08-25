# aidjmix · Logic-only Rotation + Logs (GPT-5 思考产物)

内容：
- rotation/ts/presetScheduler.ts —— TypeScript 轮换逻辑（无端口）
- rotation/py/preset_scheduler.py —— Python 轮换逻辑（无端口）
- rotation/PRESET_SUMMARY.md —— 预设与稳定性总结
- rotation/INTEGRATION_NOTES.md —— 如何把逻辑“注入”你已有管线（不改 Manager）
- logs/sim_run_peak_warehouse —— 使用《我的歌单21.m3u8》的模拟记录与产物
- logs/sim_run_rou —— 使用《rou.txt》的模拟记录与产物

用法要点：
- 轮换只返回 `{ preset, simpleHeadTail, reason[] }`，你在请求体/CLI 参数处带入即可。
- 不提供端口/服务器代码，避免侵入你的架构。
