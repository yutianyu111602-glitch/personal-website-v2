# Cursor 集成指引（只移动，不改动）

原则：**不改任何视觉与逻辑**。只把你现有 JSX 放入这些布局外壳的插槽里。

## 使用步骤
1. 复制 `src/layout/*.tsx` 到你的项目。
2. 在各页面引入对应外壳：
   - Export 页：`ExportSectionLayout` + `StatusHeader`（可选）
   - Organize 页：`OrganizeSectionLayout`
   - Player 页：`PlayerSectionLayout`
   - 模态：`ModalShell`
   - 顶部工具条：`ToolbarDock`
   - 底部抽屉：`BottomSheetDock`
3. 把原本纵向堆叠的卡片按 `docs/MAPPING_*.md` 填到插槽。**卡片内部 className/样式/回调禁止更改**。
4. 尺寸已内置：`max-w-[1400px]`，`grid-cols-12`，`gap-4 lg:gap-6`。小屏自动单列。

## 验收清单
- [ ] 小屏下自动单列，无遮挡
- [ ] 日志/列表容器具备滚动（或使用布局的 G 槽兜底）
- [ ] 顶部工具条在 1024px 宽度下不换行遮住按钮（可适当把次要按钮收至 right）
- [ ] 不出现视觉变化：银色主题、毛玻璃、阴影、透明度全部沿用旧样式

> 如需再加第三列（例如筛选/推荐/广告位），请用 `ThreeColumn`，仍然只传插槽内容。
