# Techno AutoMix 设计文档（深度）

> 目标：在不改变你现有接口的前提下，给出 **Techno** 场景的自动歌单生成逻辑。
> 只输出 M3U/TXT/JSON，不直接渲染音频。所有外部接口留空位注释。

## 1. 策略总览
- **结构**：选曲（Search）→ 过渡（Transition）→ 导出（Export）。
- **核心评分** `compat(a->b)`：
  - `key`: Camelot 同号=1.0；邻号同调=0.8；邻号换调=0.6；其余=0.4；小调(A) +0.05；
  - `tempo`: 允许 ±MAX_STRETCH%，差距越小越好；BPM 偏好 128±4；超出 124–136 降权；
  - `energy`: a末尾→b开头 能量差越小越好；
  - `phrase`: 有 downbeats/cue 信息给 0.7，没有 0.5；
  - `vocal`: 人声越多惩罚越大（Techno 倾向弱人声）。

- **编排搜索**：
  - **Beam Search**（默认）：全局更优，宽度可配（24/16/12）。
  - **Greedy**（回退）：O(N^2)，快速但易贪心。

- **过渡生成**：
  - 固定 24 拍 crossfade（Techno）；EQ 自动化建议：出曲高通上移（80→260Hz），入曲放开低频。

## 2. 模块拆分
- `score`：可替换为更先进模型（Key/Tempo/Downbeat/Vocal 等来自你的后端）。
- `search`：Beam/Greedy 接口稳定，方便 A/B。
- `transitions`：只写参数与曲内片段，不直接处理音频。
- `exporters`：m3u/txt/json。

## 3. 留空的外部接口（请自行接入）
- **Key/BPM**：若你已有高精度检测，直接覆盖输入特征即可。
- **Downbeat/Phrase**：可用 madmom/essentia，对齐到小节边界后替换 `phraseAlignScore()`。
- **Vocality/VAD**：可用轻量 VAD 或人声分类器，填到 `vocality` 字段。
- **能量曲线**：4~16 段归一化能量，来源不限（RMS/频段能量/训练模型）。

## 4. 典型 Techno 结构（用于可选的段落走向）
- Steady → Build → Fill → Drop → Steady。可按 64/128 拍为单位推进。

## 5. 复杂度与稳定性
- Beam：O(K*N^2) 近似；K=beamWidth。2k 首曲目时，建议 K=12~16。
- 前端 fetch 超时 30s，后端应在 10s 内返回。

## 6. 可替换/升级的算法（占位）
- **Downbeat**：madmom（RNNDownBeatProcessor）；Essentia（TempoTap/BeatTrackerMultiFeature）。
- **Key**：Essentia KeyExtractor/HPCP。
- **Cue 点**：论文《Cue Point Estimation using Object Detection (2024)》思路可用于估计入/出点。
- **结构边界**：自相似矩阵 + Foote Onset（Len Vande Veire Auto-DJ 博客）。

## 7. 输出契约（简）
```ts
type TrackFeature = { id:string; durationSec:number; bpm:number; keyCamelot:string; cueInSec?:number; cueOutSec?:number; path:string; energyCurve?:number[]; downbeats?:number[]; vocality?:number; title?:string; artist?:string; };
type TransitionPlan = { items: { track:TrackFeature; startAt?:number; endAt?:number; crossfadeBeats?:number; automation?:any[]; }[]; totalSec:number; avgScore:number; };
```

## 8. 风格参数建议（可调）
- WEIGHTS: key 0.35 / tempo 0.30 / energy 0.20 / phrase 0.10 / vocal 0.05
- LIMITS: max_stretch ±6%, bpmIdeal 128, softRange 124–136
- TRANSITION: crossfade 24 beats
