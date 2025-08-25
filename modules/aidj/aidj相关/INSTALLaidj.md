明白 ✅ 我帮你写一份 `INSTALL.md`，直接放进 `aidjmix-docs`，全程**不写删除命令**，只教 Cursor 如何逐步安装和集成。这样以后你只要丢给任何人（甚至完全不了解的人），他们就能按顺序跑完。

---

# 📄 INSTALL.md（放进 `aidjmix-docs`）

```markdown
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

````

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
````

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
* **稳定性**：plan\_error ≤3%，推荐命中率 ≥30%
* **回滚**：只需关掉 `enableTechniqueBridge`，系统即回到手动逻辑

---

✅ **总结**
安装顺序就是：
UI → 技术核心 → EmotionCore → API 层 → 前端桥接 → 灰度上线 → 自测 → 验收。
Cursor 只需要照槽位填 JSX，逻辑和样式完全不用动。

```

---

收到。基于你贴的两段核心代码（AutoMixManager + EmotionCoreManager），我做了“更适合你现场”的零侵入补丁：只加适配层，不改你任何源码；端口、URL、环境名全留给 Cursor 去填。

下载补丁：aidjmix-zero-intrusion-patch.zip

里面包含（都带详细注释）：

src/adapter/EmotionTechniqueBridge.ts
把情绪/能量/BPM/段落 → 实时“建议切歌手法”（只建议、不强制）：

高 BPM + 高能量 + drop → double_drop_32

中高能量 + build/fill → phrase_cut_16

低能量/steady/break → long_layer_24

无 BPM 或异常 → simple_head_tail（安全兜底）

广播事件：automix:technique_recommend，含 reason[] & hint，方便前端展示/排错。

完全逻辑-only，随时可关闭：enable:false。

src/adapter/AutoMixRouterAdapter.ts
把 automix:transition 路由到你的电台 REST：

next → ENDPOINT_NEXT（留空给 Cursor）

prev → ENDPOINT_PREV

crossfade → ENDPOINT_CROSSF?duration={ms}（可选）

限流防抖：SAFETY_RATE_LIMIT_MS 默认 1200ms，避免事件风暴

同时支持音量事件 playback:volume → ENDPOINT_VOLUME?level={v}（可选）

src/adapter/NowPlayingMirror.ts（可选）
如果你想减少多模块的重复拉取：它每 5s 拉 /api/nowplaying，并镜像到事件总线：

新歌识别后 → 广播 automix:transition { action:'next' }

有 bpm → 广播 emitBpm(bpm)

这样 AutoMixManager/EmotionCoreManager 能共享同一数据源，降低抖动。

想用就 .attach()，不用就别初始化。

src/adapter/SafePresetMapper.ts
把“核心内部 presetId”收敛到你 UI 背景名：

break → silver_pure，build → silver_mist，fill → liquid_chrome，drop/flow → metallic_flow，其它 → cosmic_silver

避免命名不一致导致背景对不上。

src/types/contracts.ts
统一事件&端点类型（TS intellisense 直接可用）。

文档

docs/INSTALL_PATCH.md：两分钟接入的初始化示例（入口里挂三件套）

docs/CURSOR_CHECKLIST.md：给 Cursor 的核对清单（按勾选一步步做）

为什么这套更适合你现场

完全零侵入：不动 AutoMixManager/EmotionCoreManager；只是“旁路订阅 + 建议 + 路由”。

与电台贴合：RouterAdapter 直接把过渡事件打到 /api/music/next 等，省去多余 glue。

稳定优先：TechniqueBridge 先给稳的，条件满足再上 aggressive（含显式回退）。

可灰度：只要不开 attach() 或 enable:false，就回到你的旧逻辑。

好排错：每次推荐都带 reason[]，UI 一眼看懂为什么选这个手法。

入口接入（复制到项目入口即可）
import { AutoMixRouterAdapter } from './adapter/AutoMixRouterAdapter';
import { EmotionTechniqueBridge } from './adapter/EmotionTechniqueBridge';
import { NowPlayingMirror } from './adapter/NowPlayingMirror';

const Bus = (window as any).UnifiedEventBus;

// A) 建议手法（只建议，不强制）
new EmotionTechniqueBridge({ EventBus: Bus, enable: true }).attach();

// B) 路由到电台 REST（Cursor 填 URL）
new AutoMixRouterAdapter({
  ENDPOINT_NEXT: '',         // '/api/music/next'
  ENDPOINT_PREV: '',         // '/api/music/previous'
  ENDPOINT_CROSSF: '',       // '/api/music/crossfade?duration={ms}'
  ENDPOINT_VOLUME: '',       // '/api/music/volume?level={v}'
  DEFAULT_CROSSFADE_MS: 4000,
  SAFETY_RATE_LIMIT_MS: 1200
}).attach();

// C) （可选）统一镜像 nowplaying（若已有其它拉取，就别开）
/*
new NowPlayingMirror({
  NOWPLAYING_URL: '',        // '/api/nowplaying'
  EventBus: Bus,
  INTERVAL_MS: 5000
}).attach();
*/


前端使用推荐值（不强制）：

let rec:any = null;
Bus.on('automix','technique_recommend',(e:any)=>{ rec = e.data; });

const technique = userSelectedTechnique ?? rec?.technique ?? 'simple_head_tail';
await client.requestAutoPlaylist(tracks, { minutes: 60, technique });
```
