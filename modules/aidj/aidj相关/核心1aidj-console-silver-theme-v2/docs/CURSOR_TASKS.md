# Cursor UI 待办清单（优先级 + 验收标准）

## P0（必须）
- [ ] **SYNC 浮动按钮**（贴电台右下）：点击 → bottom sheet 弹出/收起（framer-motion 动画）
  - 验收：S 键也能开关；按钮 hover 有微光；点击后 `automix:request` 触发时出现加载提示
- [ ] **Bottom Sheet 框架**：毛玻璃 + 拉丝金属 + 霓虹边
  - 验收：三态 `hidden/peeking/open`；可拖拽/点击把手开合（可选）
- [ ] **状态区块**（台站：listeners/uptime/dropout/avgBpm）
- [ ] **情绪核心区块**（energy/valence/arousal 实时数字/条形）
- [ ] **控制区**：Preset 下拉 + Technique 单选 + SimpleHeadTail 开关 + Generate 按钮
  - 验收：切换即刻本地生效；Generate 触发请求并广播 `automix:request`
- [ ] **日志区**：过渡 from→to（bpm/key/technique/时间）滚动列表

## P1（推荐）
- [ ] 预设标签霓虹高亮，切换时闪动 150ms
- [ ] 请求中显示“AI 脉冲条”；收到 `automix:plan` 用绿色 OK 灯切换提示
- [ ] 每条日志可点击预览“下一个过渡”的可视化（只占位）

## P2（可选）
- [ ] 键盘动效（S/G 键提示）
- [ ] 粒子背景/星尘
- [ ] 响应式布局（移动端 bottom sheet 占全宽）
