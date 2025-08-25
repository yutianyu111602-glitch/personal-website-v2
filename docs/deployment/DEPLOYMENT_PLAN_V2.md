# 个人网站项目V2 部署与实施计划（权威）

> 本计划覆盖新架构与“无限情绪能量音乐可视化系统”的落地步骤，采用可执行任务清单格式，供脚本自动解析并作为TODO来源。已验证的稳定模块（如 Spotify 歌单下载、网易云歌单整理）直接复用，不重复实现。

## 目标与范围
- 聚焦新架构：事件总线治理、动态主题中心、可观测性、E2E 场景。
- 聚焦可视化系统：情绪/能量→主题→视觉预设映射，背压与节流，录制/回放。
- 统一端口规范：通过 `.env.local` 的 `PORT` 控制，默认3000；子套件遵循同一规范。

## 环境与端口
- Node.js 18+（已检测）
- PORT（默认 3000）：webui 开发与预览端口
- VITE_MUSIC_BASE_URL（默认 http://localhost:9000）：可留空/选配

## 任务清单（权威）

### 一、项目骨架与规范
- [ ] 统一端口规范到 `env.example` 与脚本，`vite.config.ts` 读取 `process.env.PORT`
- [ ] 更新 `PROJECT_RULES_V2.md` 加入端口规范与禁止硬编码
- [ ] 调整 `oneclick_start.sh`/`oneclick_deploy.sh` 加载 `.env.local`并传递 `PORT`

### 二、前端接入与目录
- [ ] 接入 `webui` 纯前端为统一入口，移除 `webuiv4_v2.3` 旧版本
- [ ] 校准 `@styles` 别名与 `variables.scss`，确保安装无404
- [ ] 完成 `npm install`、`npm run dev` 验证，端口就绪检查

### 三、新架构落地（事件与主题）
- [ ] 实现 `DynamicThemeManager`（情绪/能量/播放→主题 tokens）
- [x] 为 `VisualizationEventBus`/`AutoMixEventBus` 增加节流/去抖（250–500ms）
- [ ] 接入 `EmotionBridgeWiring`，统一事件类型，输出到主题与预设管理器
- [ ] 整合 `VisualizationEffectManager`：主题→预设映射（LiquidMetal/UniverseEntropy）
### 八、情绪核心统一（灰度 → 全量）
- [x] 阶段一：`EmotionCoreManager` 脚手架 + 灰度开关（默认关闭）
- [x] AutoMixManager 广播 pipeline；VisualizationEffectManager 直读 pipeline（存在时）
- [ ] 阶段二：逐步合并 DynamicTheme/VisualizationEffect/AutoMix 逻辑至 EmotionCore（打开统一循环）
- [ ] 阶段三：移除冗余事件/interval，统一配置来源

> 说明：
> - `DynamicThemeManager` 位于 `webui/src/core/DynamicThemeManager.ts`，通过 `UnifiedEventBus` 订阅 `mood/energy/bpm` 并广播 `global:config { theme }`。
> - 默认事件限流规则位于 `UnifiedEventBus`，必要时可通过 `configureRateLimit()` 调整节流参数。

### 四、可观测性与安全
- [ ] Dev 调试面板：事件速率/心跳/往返延迟/主题日志
- [ ] 事件录制/回放（JSON Lines，写入 `logs/personal_website/`）
- [ ] 跨窗口 `postMessage` 适配器 + origin 白名单 + 握手签名

> 说明：
> - 遥测通过 `TelemetryManager`（`webui/src/core/TelemetryManager.ts`）以 500ms 节流上报 `/api/event`，后台 `server/metadata_server.js` 写入 `logs/personal_website/events.ndjson`。

### 五、E2E 场景与健康检查
- [ ] 端到端：播放→总线→可视化→回传→主题 的自动化测试
- [x] 端口/接口健康检查集成至启动与部署脚本

> 端口：
> - `PORT`（默认 3000）：前端服务端口
> - `METADATA_PORT`（默认 3500）：元数据与事件接收端口（`/api/health`、`/api/nowplaying`、`/api/event`）
> - `TGR_PORT`（默认 3001）：TGR 演示端口（可选）

### 六、部署与产物
- [ ] 一键构建将产物归档 `outputs/personal_website/builds/<timestamp>/`
- [ ] 一键部署启用 `serve -l PORT` 并轮询就绪
- [ ] 每次自动 update 写入 `GPT_EXPERTS_ANALYSIS_AND_BUGBOT_REPORT.md`

### 七、复用稳定模块（不重造）
- [ ] Spotify 歌单下载脚本：按现有项目使用说明直接调用（无需改造）
- [ ] 网易云歌单整理器：按现有CLI与配置复用（无需改造）

## 里程碑与验收
- M1 骨架与端口统一：dev 可启动，端口可配置
- M2 主题中心与事件治理：UI稳定无抖动（≥60fps）
- M3 可观测性与E2E：指标齐全，全链路测试通过
- M4 部署就绪：产物归档、健康检查与无人化更新流程稳定

---
更新时间：自动更新  
维护：麻蛇 / GPT-5 专家团队


