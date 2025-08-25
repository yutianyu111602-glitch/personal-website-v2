# 空间银主题落地（给 Cursor）
- 背景：`var(--deep-space)` + 叠加 `--glass-dark/--glass-light` 的渐层与模糊（backdrop-filter）
- 元件：边框 `--chrome/--chrome-2` 细线，圆角 12–16px，阴影极轻
- 状态：霓虹蓝/薄荷做强调（按钮高光、加载脉冲、OK 灯）
- 布局：DJ Pro 信息密度，网格/分隔线（`--chrome-2` 低透明）
- 动效：framer-motion 做 bottom sheet 的 slide/blur；切预设的短闪动

**建议 shadcn 组件**：Button、Card、Badge、Switch、Select、Tabs、ScrollArea、Separator
