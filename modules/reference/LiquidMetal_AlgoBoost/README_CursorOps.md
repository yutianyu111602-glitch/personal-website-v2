
# 给 Cursor 的技术方向（保留“音乐可视化操作台”位）

**目标**：在编辑器侧留出一个“操作台”区域（UI 不是本包职责），但要确定**技术接口**与**模块边界**，便于后续我们或你团队随时扩展。

## 1) 操作台应做的事
- 可视化参数浏览/编辑：显示当前 `Pipeline.nodes`（id/weight/uniforms）
- 情绪实时调试：Energy/Valence/Arousal 三滑杆 + 预设选择
- 音频特征监控：12 监测点实时条形图（读 `AudioWorklet` 的共享缓冲）
- 策略切换：在“策略包”之间热切换（JSON/DSL），观察效果
- 性能与守门：FPS/降级状态（是否关 Bloom/是否降分辨率）

## 2) 技术接口（约定）
- **只读/可写分离**：
  - 只读：`GET currentPipeline`、`GET audioFeatures`、`GET mood`、`GET fps`
  - 可写：`POST setMood(partial)`、`POST setPreset(id)`、`POST setUniform(nodeId,key,val)`、`POST setWeight(id,w)`
- **通道**：用 `postMessage`/`BroadcastChannel` 或者 React Context + Zustand，一层封装成 `ConsoleBus`。
- **热更新**：策略 JSON 通过 `/api/strategy?v=xxx` 拉取；操作台下拉切换时，发 `applyStrategy(payload)`。

## 3) 模块边界
- `Console` 模块 **不持久**任何视觉算法代码；它只是发指令与展示状态。
- 所有**写操作**最终落到 `EngineBridge` 的“赋值列表”→ 渲染器。
- **权限**：线上只读，开发环境可写；通过构建变量切换。

## 4) 度量与导出
- 导出当前组合：`exportSnapshot()` → JSON（mood+preset+pipeline+assignments）
- 导出 10 秒“动作脚本”：记录每次写操作的时间戳与指令，便于复演/回归测试。

> 以上即为 Cursor 需要预留的“技术方向与接口约束”。UI 由你们实现即可。
