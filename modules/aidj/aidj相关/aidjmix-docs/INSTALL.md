# AidjMix 安装与集成指南

本指南面向开发助手（如 Cursor），目标是：**把 AidjMix 完整接入电台网站**。  
要求：  
- 不改动任何逻辑  
- 不改动任何外观（银色太空主题必须保留）  
- 变量/环境名留空，等我手动填  

---

## 1. 项目结构（最终保留的核心目录）

```
aidjmix-autoplaylist-api-ts
aidjmix-autoplaylist-python
aidjmix-frontend-bridge
aidjmix-techniques-v1
aidjmix-techno-presets
aidjmix-merged-suite
aidjmix-logic-rotation-and-logs
aidjmix-docs
aidj-console-silver-theme-v2
```

说明：
- **api-ts / python**：播放列表 API 层
- **frontend-bridge**：前端桥接事件总线
- **techniques-v1**：20 种切歌手法
- **techno-presets**：techno 专用预设
- **merged-suite**：情绪核心 + 技术核心的整合
- **logic-rotation-and-logs**：日志与轮转逻辑
- **docs**：文档与本文件
- **console-silver-theme-v2**：最终 UI 主题

---

## 2. UI 集成

1. 使用 `aidj-console-silver-theme-v2` 作为统一主题  
   - 替换所有旧主题引用  

2. 使用 `ui-layout-patches-v2` 的布局外壳（你已有文件）  
   - 导出页 → `ExportSectionLayout` (A~H 槽位)  
   - 整理页 → `OrganizeSectionLayout`  
   - 播放器页 → `PlayerSectionLayout`  
   - 顶部条 → `StatusHeader`  
   - 模态框 → `ModalShell`  
   - 底部抽屉 → `BottomSheetDock`  
   - 示例见 `examples/*.tsx`  

> ⚠️ 注意：卡片内容不要修改，只是放到槽位里。  

---

## 3. 技术核心

- **手法**：导入 `aidjmix-techniques-v1`  
  - 确保 `TechniqueName` 枚举存在  
  - 确保 `chooseTechnique(ctx)` 返回 `{ technique, hint, reason }`  

- **预设**：导入 `aidjmix-techno-presets`  
  - techno 风格的默认策略  

- **日志**：导入 `aidjmix-logic-rotation-and-logs`  
  - 保证固定窗口 50 条，避免撑爆  

---

## 4. EmotionCoreManager

位置：`aidjmix-merged-suite`  

默认配置：  
```ts
new EmotionCoreManager({
  enableUnifiedLoop: false,
  enableTechniqueBridge: false,
  enableNowPlayingPull: false,
  AUTODJ_STATUS_URL: '',  // 留空
  NOWPLAYING_URL: ''      // 留空
});
```

事件总线：

* `automix:mood/energy/bpm/transition`
* `automix:technique_recommend`
* `visualization:preset`
* `global:config`

---

## 5. API 层

* **TS API** (`aidjmix-autoplaylist-api-ts`)

  * 提供 `requestAutoPlaylist()`
  * 接收 `{ technique: string }`

* **Python API** (`aidjmix-autoplaylist-python`)

  * CLI/测试用，保持接口对齐

---

## 6. 前端桥接

* 安装 `aidjmix-frontend-bridge`
* UI 逻辑：

  * 用户未手动选择手法 → 默认用 `technique_recommend`
  * 用户手动选择 → 优先用户选择
* 调用示例：

```ts
await client.requestAutoPlaylist(tracks, {
  minutes: 60,
  beamWidth: 24,
  preset,
  simpleHeadTail,
  technique: tech   // 字符串
  // techniqueHint: reason (可选，后端可忽略)
});
```

---

## 7. 灰度上线策略

* **阶段 1**：`enableTechniqueBridge=true`，UI 仅展示推荐，不强制采用
* **阶段 2**：UI 默认采用推荐（用户未选时）
* **阶段 3**：可考虑 `enableUnifiedLoop=true`（统一心跳），非必需

---

## 8. 自测 Checklist

* [ ] BPM→能量：90/120/150 时，`global:config.theme.intensity` 随 BPM 上升
* [ ] arousal=0.8 → 推荐偏向 `phrase_cut_16`
* [ ] dropoutRate=0.08 → 推荐退回安全手法
* [ ] vocality=0.6 → 禁用 FX-heavy 手法
* [ ] 日志滚动不撑爆页面
* [ ] 小屏下自动单列

---

## 9. 验收标准

* **视觉**：必须保持银色太空主题，毛玻璃/阴影/透明度不变
* **稳定性**：plan_error ≤3%，推荐命中率 ≥30%
* **回滚**：只需关掉 `enableTechniqueBridge`，系统即回到手动逻辑

---

## 10. 当前集成状态

### ✅ 已完成
- [x] EmotionCoreManager配置扩展
- [x] 切歌手法桥接系统基础架构
- [x] 事件类型定义扩展
- [x] 技术提示系统

### 🔄 进行中
- [ ] AidjMix技术栈完整集成
- [ ] 前端UI组件实现
- [ ] 测试和验证

### ⏳ 待完成
- [ ] 20种手法的完整参数模板
- [ ] 情绪偏置逻辑集成
- [ ] 性能优化和监控

---

✅ **总结**
安装顺序就是：
UI → 技术核心 → EmotionCore → API 层 → 前端桥接 → 灰度上线 → 自测 → 验收。
Cursor 只需要照槽位填 JSX，逻辑和样式完全不用动。

---

**文档创建时间**: 2025年8月25日 09:25  
**集成状态**: 🟡 进行中  
**下一步**: 完成AidjMix技术栈集成
