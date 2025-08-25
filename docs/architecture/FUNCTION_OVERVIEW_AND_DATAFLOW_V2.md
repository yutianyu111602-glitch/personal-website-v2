### 功能总览与数据流（个人网站项目V2）

本页用最简单的语言说明当前进度、所有核心模块的职责边界，以及最复杂的三条链路：情绪模块如何工作、MP3 文件如何流转、可视化算法如何做“预设匹配”。

—— 位置：`@个人网站项目V2/`

---

### 一、当前进度（高层总结）

- 已建立统一的“管理器”框架：在 `webui/src/core/` 下由 `ManagerRegistry` 统一装配，入口见 `core/index.ts`。
- 引入“情绪核心统一”灰度开关：`data-config.json → featureFlags.emotionCoreUnifiedLoop`，打开后以 `EmotionCoreManager` 为核心循环，减少多线程轮询与事件风暴。
- 元数据与歌单服务已就绪：`server/metadata_server.js` 提供 `/api/*`（歌单解析、AutoDJ 状态、健康检查、事件落盘等）。
- 统一的可视化驱动与预设矩阵已到位：`UnifiedDrive`（E/A/R 三元）与 `UnifiedPresetManager`（矩阵预设）在 `UnifiedDrive_Presets.ini` 中完整描述，可一键落地为 TypeScript 包或直接复用其算法思想。
- 一键脚本负责无人化启动/构建/部署与健康检查：`oneclick_start.sh`。

---

### 二、模块清单（看路径就知道做什么）

- 前端核心（webui）
  - `webui/src/core/index.ts`：注册并启动所有管理器；按开关决定是否启用“情绪核心统一”。
  - `webui/src/core/EmotionCoreManager.ts`：情绪统一核心（统一循环的承载层，负责整合情绪→主题→可视化的主链路）。
  - `webui/src/core/DynamicThemeManager.ts`：将情绪/能量/BPM 转为主题 Token（accent/background/intensity/motion/contrast）。
  - `webui/src/core/VisualizationEffectManager.ts`：从主题/或 pipeline 推导视觉效果（背景/叠加/Uniforms）。
  - `webui/src/core/AutoMixManager.ts`：旧路径下的自动混合/过渡广播；与可视化联动。
  - `webui/src/core/TelemetryManager.ts`：以 500ms 节流将前端事件上报到 `/api/event` 并落盘。
  - `webui/src/core/AutoDJManager.ts`：轮询 `/api/autodj/status`，广播 BPM、播放/过渡事件与基础情绪基线。
  - `webui/src/components/events/UnifiedEventBus.ts`：全局事件总线（默认对高频事件做节流/去抖：BPM/energy 约 250ms）。
  - `webui/src/data-config.json`：运行时配置与 FeatureFlags（含 emotionCore.tickIntervalMs）。

- 后端/服务（本地轻量级）
  - `server/metadata_server.js`：提供 `/api/nowplaying | /api/playlists | /api/playlist(_resolved) | /api/autodj/* | /api/resolve | /api/event | /api/health` 等；负责本地音乐目录索引、歌单解析、AutoDJ 状态、事件落盘。

- 统一驱动与预设（算法与配置）
  - `UnifiedDrive_Presets.ini`：完整的 E/A/R → 节点权重与 Uniforms 的“矩阵预设”与管理器逻辑（可按说明一键展开为 `src/` TypeScript 包）。

- 启动/部署
  - `oneclick_start.sh`：无人化启动，自动更新依赖、拉起 WebUI 与元数据服务，进行健康检查与日志落盘。

---

### 三、情绪模块如何工作（一句话抓住主线）

- 数据从哪里来？
  - `AutoDJManager` 每 2s 轮询 `/api/autodj/status`，拿到当前曲目信息（title/artist/BPM/Camelot 键等），并：
    - 当检测到“曲目切换”时，广播 `transition` 与 `play`。
    - 将 `bpm` 广播为统一事件（`emitBpm`）。
    - 用“BPM + Camelot 键位”估算一个“基础情绪基线”并广播（`emitMood`）。

- 情绪是怎么估算的？（AutoDJ 的基线规则）
  - BPM 90→150 映射为能量/唤醒度的上升（能量约 0.2→0.95，唤醒约 0.25→0.9）。
  - Camelot B（大调，`xxB`）略微提高愉悦度（valence +0.06），A（小调，`xxA`）略微降低（-0.05）。
  - 输出三元：`{ energy, valence, arousal }`（均做 0..1 与 [-1..1] 合理夹取）。

- 谁来“统筹”？
  - 当 `featureFlags.emotionCoreUnifiedLoop = true`：
    - 由 `EmotionCoreManager` 开一个“统一循环”（默认 500ms tick），直接订阅 BPM/基础情绪等事件，并融合为“主题与可视化指令”。
    - 只注册 `EmotionCoreManager + TelemetryManager + AutoDJManager`，避免重复职责与事件风暴。
  - 当开关为 false：
    - 走“兼容模式”，保留 `DynamicThemeManager + VisualizationEffectManager + AutoMixManager` 等各自循环。

- 输出到哪里？
  - 主题：通过 `global:config { theme }` 广播。
  - 视觉：优先发布 `visualization:effect { pipeline }`（若有完整管线），否则发布 `visualization:preset { preset }`（按主题推导）。
  - 遥测：`TelemetryManager` 节流上报到 `/api/event`，落盘到 `logs/personal_website/events.ndjson`。

---

### 四、MP3 文件的流转（从“歌单行”到“正在播放”）

1) 入口：歌单文件在 `@个人网站项目V2/playlist/` 下，以 `.txt` 存放：
   - 每一行是一条曲目描述，支持可选前缀时间戳与序号，例如：
     - `00:12:34  03) Artist - Title - 7B`
     - `Artist - Title - 7B`
   - 行尾 `- 7B/7A` 会被解析为 Camelot 键（B=大调，A=小调）。

2) 索引：`metadata_server.js` 启动时按以下规则扫描本地音乐并建索引：
   - 目录来源优先读环境变量 `MUSIC_DIRS`（逗号分隔）；否则使用内置默认目录（用户本机网易云音乐目录等）。
   - 支持格式：`.mp3/.flac/.m4a/.aac/.wav/.ogg/.opus`。
   - 得到内存索引 `MUSIC_INDEX = [{ filePath, nameLower }]`。

3) 解析：
   - `GET /api/playlists`：列出可用歌单。
   - `GET /api/playlist?name=...`：读取某个歌单的原始行。
   - `GET /api/playlist_resolved?name=...`：将每一行解析为结构化条目：
     - 是否可播放（`playable`）
     - 候选本地文件（`candidates[]`，按包含匹配标题进行模糊命中）
     - 解析出的 Camelot 键位与兼容键集合（便于后续过渡评分）

4) AutoDJ：
   - `POST /api/autodj/load?name=...`：加载歌单条目为 `AUTODJ.entries[]`。
   - `POST /api/autodj/next`：推进到下一条并写入 `NOW_PLAYING`（拆出 `artist/title`，带 `keyCamelot`）。
   - `GET /api/autodj/status`：返回当前 `index/total/playing/nowplaying{title/artist/bpm/key...}`。

5) 前端联动：
   - `AutoDJManager` 轮询 `status` → 触发“播放/过渡”事件、广播 BPM 与基础情绪。
   - 若前端集成了音频引擎，可据 `resolve` 接口返回的 `candidates[]` 进行本地/远程播放；当前服务主要负责“元数据/索引/状态”，不直接提供音频流媒体。

6) 事件与日志：
   - `POST /api/event`：前端将统一事件写入本地 NDJSON 日志，便于回放与可观测性。
   - `GET /api/health`：展示服务健康与扫描目录。

温馨提示：
  - 歌单行用“包含匹配”做模糊解析；若命中率低，可在行尾补 `- 7B/7A`（用于键位兼容评分与过渡）。

---

### 五、可视化“预设匹配”的方式（为什么看起来总是对劲）

- 统一驱动三元（E/A/R）：
  - E=Energy（能量，音乐强度/响度/节拍密度）
  - A=Arousal（激活，频谱变化/瞬态活跃）
  - R=Regularity（规律，稳定/有序程度，越低越混沌）
  - 来自两路融合：
    - 情绪/音乐侧：`AutoDJManager` 给出基础情绪（BPM+键位）。
    - 音频分析/运行态：RMS/Flux/Crest/Segment 等（逐步接入时由引擎/分析器提供）。

- 矩阵预设（Matrix Presets）：
  - 位于 `UnifiedDrive_Presets.ini` 的 `MatrixPresets` 中，例如：`BalancedSilver` / `ContrastShock` / `AmbientMist` / `ChaosStorm` / `BeatPulse` / `LiquidFlow` / `FractureIce` / `CausticGlow` / `PolarVortex` / `RDOrganism` / `AnisoMetal` / `PsyChaos`。
  - 每个预设定义两件事：
    1) 节点权重映射（把 E/A/R 映射到各个渲染节点的权重，且总权重 ΣW ≤ 0.35、单节点 ≤ 0.22）。
    2) Uniform 参数映射（全局与节点级参数，如亮度上限、抖动量、相位等）。

- 运行时选择：
  - `UnifiedPresetManager.setMatrixPreset(name)` 选择风格；
  - `drive(E,A,R)` 产出 `{weights, uniforms}`，渲染器直接写入即可；
  - 支持将 Stage（idle/build/drop/fill）与音频特征混入，得到更稳健的 E/A/R。

- 回退策略（非常关键）：
  - 若有完整的 `visualization:effect { pipeline }` 事件（例如由 AutoMix/调度器广播），渲染层优先“直读 pipeline”。
  - 否则回退到 `visualization:preset { preset }` 或 `global:config { theme }` → 再由管理器/引擎推导出渲染参数。

你只需记住两点：
  - 把“当前状态”压缩成 E/A/R，并选一个“预设风格”。
  - 引擎会自动把它们翻译成“用什么效果 + 各参数多少”，并做好总量与亮度的安全限制。

---

### 六、接口一览（最常用的那几个）

- `/api/playlists`：列出歌单文件
- `/api/playlist?name=...`：查看歌单原始行
- `/api/playlist_resolved?name=...`：查看解析/可播放命中
- `/api/autodj/load?name=...`：加载歌单到 AutoDJ
- `/api/autodj/next`：推进到下一条并写入 NOW_PLAYING
- `/api/autodj/status`：查询 AutoDJ 当前状态
- `/api/resolve?name=...&limit=20`：模糊解析曲名→本地文件候选
- `/api/keyrules?key=7B`：查看 Camelot 键兼容集合
- `/api/event`：前端事件落盘（NDJSON）
- `/api/health`：健康检查

---

### 七、排障速查（三件最容易卡的事）

- 看不到歌单或命中很少：
  - 检查 `playlist/*.txt` 是否真在 V2 目录下；
  - 检查 `MUSIC_DIRS` 环境变量是否指向真实的本地音乐目录；
  - 在歌单行尾加上 `- 7B/7A` 能明显提高过渡评分和匹配质量。

- 情绪/主题没有反应：
  - 确认 `data-config.json` 的 `featureFlags.emotionCoreUnifiedLoop` 是否按预期开/关；
  - 开启统一循环时不要再手动注册旧管理器，避免双重广播。

- 可视化太闪或太暗：
  - 切换 `MatrixPreset` 到 `BalancedSilver/ AmbientMist`；
  - 调整 `Global.uBrightCap / Global.uVividGate / Global.uJitter` 等全局 Uniform（由预设自动计算，也可在引擎侧限幅）。

---

### 八、我应该改哪？（落地建议）

- 想要“情绪更稳”：
  - 在 `EmotionCoreManager` 中把多源输入（BPM/键位/音频特征/场景）融合为更平滑的 E/A/R（加入时间窗与限速器）。

- 想要“更像 Techno/House/Chill” 的风格：
  - 改 `MatrixPresets` 的某个风格，或在 UI 提供预设下拉，运行时切换。

- 想把“歌单→自动放歌→可视化”打通：
  - 前端播放器拿 `/api/playlist_resolved` 的 `candidates[]` 做真实播放，同时保留 AutoDJ 的状态广播，用于驱动情绪与可视化。

---

附：相关文件一键定位

- 入口：`webui/src/core/index.ts`
- 情绪统一核心：`webui/src/core/EmotionCoreManager.ts`
- AutoDJ 桥接：`webui/src/core/AutoDJManager.ts`
- 事件总线：`webui/src/components/events/UnifiedEventBus.ts`
- 运行时配置：`webui/src/data-config.json`
- 元数据与歌单后端：`server/metadata_server.js`
- 统一驱动/预设说明：`UnifiedDrive_Presets.ini`
- 启动脚本：`oneclick_start.sh`


