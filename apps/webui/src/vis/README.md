
# LiquidMetal Visual Suite — 完整版

> 液态金属银背景 · 情绪/音频/Techno 三引擎融合的可视化系统。
> - TypeScript 逻辑：**LiquidMetalConductor / AudioReactive / TechnoRandomizer**
> - GLSL 模板：**glsl-blends.template.glsl**（12 个混合） + **glsl-generators.template.glsl**（流场/噪声/反扩散等）
> - 一键示例：**index.example.ts**（可直接运行，控制台观察编排结果）

---

## 快速开始

```
src/vis/
  LiquidMetalConductor.ts
  AudioReactive.ts
  TechnoRandomizer.ts
  index.example.ts
  glsl-blends.template.glsl
  glsl-generators.template.glsl
```

- 将以上文件复制到你的项目（建议 `src/vis/`）。
- 用你的 60+ 预设替换 `index.example.ts` 里的 `presets`。
- 在实际渲染中，把 `scheduler()` 返回的 `pipeline.nodes` 写入 Shader uniforms，调用 `Blend_<ID>` 顺序混合即可。

---

## 附录 A｜技术文档（深入版）

### 设计目标
- 银色液态背景为**主**，可视化为**辅**；不覆盖主体信息。
- 两套驱动并行：**情绪(Mood)** 负责编排边界；**音频(AudioFeatures)** 负责瞬态细节。
- 管线：**Base → Accent → Decor**（1~3 节点链），`W ≤ 0.22`，`ΣW ≤ 0.35`。
- 性能守护：`avgFrameMs ≥ 18`（≈55FPS↓）自动降级（禁 BloomHL / 降 Trail / 分辨率缩放）。
- 线性空间混合 + 统一 tone-map（ACES 近似）。

### 接口模块
- `LiquidMetalConductor.ts`：情绪驱动大编排；可选选择 **flow/texture/pattern** 生成器。
- `AudioReactive.ts`：音频 12 监测点 + ≥16 条微策略；细节/瞬态调制。
- `TechnoRandomizer.ts`：Techno 规则（步进/欧几里得/p-lock/swing/fill）。

### Uniform 建议
| 域 | uniform | 含义 | 范围 |
|---|---|---|---|
| Global | `uBrightCap` | 全局亮度上限 | 0.7–1.0 |
| Global | `uJitter` | 权重噪声 | 0.00–0.03 |
| DualCurve | `uVividGate` | Vivid 分支门 | 0/1 |
| StructureMix | `uFlowRadius` | 位移半径 | 0.3–1.2 |
| StructureMix | `uLicStrength` | LIC 强度 | 0–1 |
| SoftBurn | `uMaskGain` | 暗部掩码增益 | 0–1 |
| SpecularGrad | `uLightPhase` | 扫光相位 | 0–1 |
| EdgeTint | `uEdgeTintColor` | 染色 | 近中性冷青 |

> 纹理：`uBg`（背景）、`uPrev`（上一帧）、`uBloom`（高光模糊）。

### 节点分类
- **Base**：`LumaSoftOverlay` / `SMix` / `OkLabLightness`
- **Accent**：`BoundedDodge` / `SoftBurn` / `StructureMix` / `DualCurve` / `SpecularGrad`
- **Decor**：`GrainMerge` / `EdgeTint` / `TemporalTrail` / `BloomHL`

### 故障切换
- FPS 低：禁 `BloomHL`、`TemporalTrail` 半保留、`fftSize` 1024→512、分辨率 1→0.85/0.7。
- 质心过亮：降 `BoundedDodge/BloomHL/DualCurve` 上限 10–20%。
- 静音：权重衰减到 60%，保留 Base 呼吸层。

---

## 附录 B｜GLSL 模板（12 Blends）
详见 `glsl-blends.template.glsl`。包括：
- LumaSoftOverlay / SMix / BoundedDodge / SoftBurn / GrainMerge / StructureMix
- BloomHL / EdgeTint / DualCurve / TemporalTrail / SpecularGrad / OkLabLightness

> 所有混合在线性空间完成，最后 tone-map → sRGB。提供了蓝噪 `blueNoise()`、`sobel()`、vivid/soft 等基础函数。

---

## 附录 C｜生成器与可视化算法库
详见 `glsl-generators.template.glsl`。提供：

- **场/位移**：Curl Noise、Domain Warp、Stable Fluid（由 TS 控制参数）
- **纹理**：Simplex、fBm、Ridged、Worley、Gabor（简化）
- **图样**：Reaction–Diffusion 单步（Gray-Scott）、LIC 近似（拉丝）

**典型用途**
- 用 curl/domain 产出 `UV` 位移 → 金属液化感。
- 用 worley/domain 作混合 **mask** → 冰裂/碎片银。
- 用 RD 结果作 roughness/混合掩码 → 自组织纹理。

---

## 附录 D｜对接 Checklist
- [ ] 引入 TS 模块；用你的情绪系统喂 `scheduler()`。
- [ ] 用 WebAudio 获取 FFT → `computeAudioFeatures()`；把微策略作用到 pipeline：`pickMicroMods` + `applyMicroMods`。
- [ ] Techno 场景：按 16 分音推进 `TechnoRandomizer.tick()`，将 hooks 映射到微策略或参数锁。
- [ ] 在 Shader 侧贴入 12 Blend 函数；将 `pipeline.nodes[i]` 的 `id/weight/uniforms` 写为对应 uniforms。
- [ ] 压测高能/低能段；检查 FPS 与曝光边界。

---

## 版权与致谢
- OkLab 公式：Björn Ottosson；流体与噪声：参考社区常见实现（简化重写）。
- 本套代码为教学/项目集成示例，欢迎按需调整参数与命名。
