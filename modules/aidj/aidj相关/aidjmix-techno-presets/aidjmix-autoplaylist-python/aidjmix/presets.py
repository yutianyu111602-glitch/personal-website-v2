# presets.py — Techno 速度/风格预设（Python CLI）
from .config import WEIGHTS, LIMITS, TRANSITION

PRESETS = {
    # 深/Minimal：122–126，长铺垫，低人声，长过渡
    "deep_minimal": {
        "limits": { "bpm_soft_range": (122, 126), "bpm_ideal": 124, "bpm_tol": 3, "max_stretch_pct": 4 },
        "transition": { "techno_crossfade_beats": 32 },
        "weights": { "vocal": 0.07, "energy": 0.18 },  # 更讨厌人声，能量稍弱
        "notes": "长铺垫、滤波渐入、保持流动，避免剧烈能量跳变"
    },
    # 经典/俱乐部：126–130（默认）
    "classic": {
        "limits": { "bpm_soft_range": (126, 130), "bpm_ideal": 128, "bpm_tol": 4, "max_stretch_pct": 6 },
        "transition": { "techno_crossfade_beats": 24 },
        "weights": {},
        "notes": "默认策略：谐波/能量平滑 + 24拍 crossfade + 低频交接"
    },
    # 仓库/峰值：128–134，能量更高，过渡时机更快
    "peak_warehouse": {
        "limits": { "bpm_soft_range": (128, 134), "bpm_ideal": 130, "bpm_tol": 3, "max_stretch_pct": 5 },
        "transition": { "techno_crossfade_beats": 24 },
        "weights": { "energy": 0.25, "vocal": 0.04 },
        "notes": "更紧凑，允许略大的能量上升；尽量在短语边界切换"
    },
    # 硬核/Hard Techno：140–150，短促果断
    "hard_techno": {
        "limits": { "bpm_soft_range": (140, 150), "bpm_ideal": 145, "bpm_tol": 4, "max_stretch_pct": 3 },
        "transition": { "techno_crossfade_beats": 12 },  # 更短
        "weights": { "tempo": 0.35, "energy": 0.25, "vocal": 0.03 },
        "notes": "果断切换：短 crossfade 或直接 bass kill → swap（建议）"
    },
    # 催眠/Hypnotic：130–134，超长层叠
    "hypnotic": {
        "limits": { "bpm_soft_range": (130, 134), "bpm_ideal": 132, "bpm_tol": 2, "max_stretch_pct": 5 },
        "transition": { "techno_crossfade_beats": 32 },
        "weights": { "energy": 0.18, "phrase": 0.12 },
        "notes": "极长层叠、慢变，为层次与纹理让路"
    }
}

def apply_preset(name: str):
    cfg = PRESETS.get(name)
    if not cfg: return
    LIMITS.update(cfg.get("limits", {}))
    TRANSITION.update(cfg.get("transition", {}))
    WEIGHTS.update(cfg.get("weights", {}))
