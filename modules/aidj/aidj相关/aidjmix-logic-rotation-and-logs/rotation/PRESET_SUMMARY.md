# Techno 预设与 24h 稳定运行总结

已内置预设（5 套）：
- **deep_minimal**（122–126）：32拍长层叠，低人声，平滑能量。
- **classic**（126–130）：24拍 crossfade + 低频交接（默认最稳）。
- **peak_warehouse**（128–134）：短语边界切换，能量推进。
- **hard_techno**（140–150）：8–12拍，bass kill → swap，果断切。
- **hypnotic**（130–134）：32拍超长层叠，纹理流动。

稳定性：
- 规则 + Beam Search（O(N²K)）稳态运行、低外部依赖。
- 提供 `simpleHeadTail/simple_head_tail` 开关：即使智能钩子失效，也能**稳定衔接**。
- 可通过“预设轮换”在 24 小时内交替风格，减少重复感、避免堆积误差。

建议的默认轮换（本仓已写入）：
- 00–06 deep_minimal → 06–12 classic → 12–22 peak_warehouse → 22–24 hypnotic
- 可在高峰（周末 01–03）临时切 `hard_techno`。
