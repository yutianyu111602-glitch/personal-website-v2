
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

> 以上即为 Cursor 需要预留的“技术方向与接口约束”。UI 由你们实现即可
> 
> 
> 。好了，硬菜来咯：我给你补了一套**更酷炫的可视化算法 + 强化随机算法（完整代码）**，并单独写了给 Cursor 的“操作台技术方向说明”。一键拿走：

[下载 LiquidMetal\_AlgoBoost.zip](sandbox:/mnt/data/LiquidMetal_AlgoBoost.zip)

## 新增内容（代码已包含在压缩包内）

* `src/vis/random/RandomToolkit.ts`

  * **Xorshift32 / PCG32**：可复现 PRNG
  * **1D Poisson-disc**：事件间隔采样（避免粘连触发）
  * **MarkovChooser**：防“硬复读”的选择器
  * **BlueNoiseJitter**：抗条带抖动的权重抖动
  * **Logistic / Ikeda 混沌映射**：参数“游走器”，酷但可控
* `src/vis/random/BeatSync.ts`

  * `phase/nearStep/barPhase`：把视觉事件精确卡在 1/16、1/32 等拍点
* `src/vis/AlgorithmCombiner.ts`

  * **组合器**：把多个“子效果”合成统一的权重/参数表（自动归一化 ΣW≤0.35）
  * 示例子效果：`SpecPulse`（镜面脉冲）、`StructRipple`（结构涟漪）
* `shaders/NewVisuals.glsl`（全新 GLSL 算法，可当节点或蒙版/位移源）

  1. `CurlDisplaceUV`：流场 UV 位移（银面液态感更强）
  2. `CausticMix`：焦散调制（像金属上有微水波光）
  3. `WorleyCrack`：冰裂掩码（极低饱和度下很有刀锋金属感）
  4. `AnisoStreak`：各向异性拉丝高光（银色拉丝质感）
  5. `PolarRipples`：极坐标涟漪（强 Techno 场感）
  6. `SpectralBloom`：亮度驱动的微色散 Bloom（控制好上限，仍以银为主）

> 接线思路：这些函数既可做“Blend 前的 fx 输入”，也可作为 `StructureMix` / `DualCurve` 的掩码或位移源，严格走线性空间合成；`uBrightCap` 把高光锁住。

## 随机算法如何用在编排上（要点）

* 用 `makePCG(seed)` 做全站“主随机” → 所有选择可复现
* `poisson1D(minGap)` 生成**换法的时间点**（比如 12–20s 一次，但带指数分布的自然性）
* `MarkovChooser` 选择下一个节点/预设，自动对上一个做降权（避免复读）
* `blueJitter(base,strength)` 给每帧的权重一点点蓝噪抖动，消条带
* `logisticStep/ikedaStep` 驱动“相位/角度/半径”的慢速游走，让银面一直“活着”

## 给 Cursor 的“音乐可视化操作台”——只给方向，不写 UI（已写进包）

看 `README_CursorOps.md`，摘要如下（Cursor 只需按此预留接口与模块边界）：

* **操作台要做的事**：
  参数面板（当前 pipeline.nodes）、情绪拨盘、12 监测点条形图、策略热切、FPS/降级状态
* **接口约定（只读/可写分离）**：
  `GET currentPipeline / audioFeatures / mood / fps`；
  `POST setMood / setPreset / setUniform / setWeight / applyStrategy`
* **通道**：`postMessage`/`BroadcastChannel` 或 Zustand/Context 封一层 `ConsoleBus`
* **热更新**：策略 JSON 从 `/api/strategy?v=xxx` 拉取，操作台切换后发 `applyStrategy(payload)`
* **边界**：操作台**不包含算法代码**；所有写操作落到 `EngineBridge` 的赋值 → 渲染器
* **导出**：`exportSnapshot()`（mood+preset+pipeline）与“动作脚本”回放（复现场景）

---

需要我把这些**新算法**直接**挂接到你现有的 `LiquidMetalConductor` 中的 `extras` 选择器**，或者提供一份**组合示例表（哪几组更像液态金属银、哪几组适合 build/drop）**，我现在就补上。


好嘞，那我现在就补上一份**组合列表**，直接把新老算法串联起来。分三类：**液态银感（稳定主视觉）**、**Techno Build/Drop（高能场景）**、**氛围衬底/实验性（弱但酷）**。你可以当成“菜谱”，随时挑来给 `AlgorithmCombiner` 或 `extras` 用。

---

# 1. 液态银感（稳定主视觉）

这些组合保持“银色为主”，不会染色，流动感强：

* `LumaSoftOverlay + StructureMix + CurlDisplaceUV`
* `SMix + OkLabLightness + CausticMix`
* `StructureMix + WorleyCrack (mask) + AnisoStreak`
* `DualCurve + SpecularGrad + CurlDisplaceUV`
* `GrainMerge + PolarRipples (mask) + OkLabLightness`

👉 用途：默认背景，24/7 不会腻。银色金属感 + 微流动，观感“呼吸”而不是“乱跳”。

---

# 2. Techno Build / Drop 场景

适合在节拍堆叠、进入高能时触发。
特点：亮度/锐度拉满、瞬态冲击强。

* `BoundedDodge + BloomHL + SpectralBloom`
* `DualCurve + EdgeTint (冷色) + AnisoStreak`
* `SoftBurn + SpecularGrad + CausticMix`
* `StructureMix + CurlDisplaceUV + PolarRipples`
* `BloomHL + WorleyCrack (mask) + DualCurve`

👉 用途：Build 时权重慢慢升高，Drop 时给 2–4 秒“满银爆闪”，然后回落。

---

# 3. 氛围衬底 / 实验性

这些不是主视觉，而是偶尔“闪现”来增加层次。

* `TemporalTrail + CurlDisplaceUV + AnisoStreak`
* `GrainMerge + PolarRipples + LogisticMap 驱动相位`
* `OkLabLightness + ReactionDiffusion (mask)`
* `SMix + Lenia (mask) + BlueNoiseJitter`
* `StructureMix + IkedaMap 驱动 flowAmp`

👉 用途：时段切换、低频沉浸段、实验性段落。存在感低但会“异动”，让观众感觉系统有机。

---

# 4. 随机调度策略建议

你可以把这些组合打上“标签”，让调度器/操作台按情绪或节拍来选：

* `stable` → 上面第 1 类
* `drop` → 上面第 2 类
* `ambient` → 上面第 3 类

随机调度时：

* **ΣW ≤ 0.35**，单节点 ≤ 0.22
* Build/Drop 段：倾向 `drop` 组合
* 普通时段：70% `stable`，20% `ambient`，10% `drop`（小惊喜）

---

要不要我把这些组合直接写成 **JSON 策略包**（比如 `combos.json`），让你的调度器可以直接 `import`，而不是你手抄？


