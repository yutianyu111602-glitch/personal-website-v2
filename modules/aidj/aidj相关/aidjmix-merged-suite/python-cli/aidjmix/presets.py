from .config import WEIGHTS, LIMITS, TRANSITION

PRESETS = {
    "deep_minimal": {
        "limits": { "bpm_soft_range": (122, 126), "bpm_ideal": 124, "bpm_tol": 3, "max_stretch_pct": 4 },
        "transition": { "techno_crossfade_beats": 32 },
        "weights": { "vocal": 0.07, "energy": 0.18 },
    },
    "classic": {
        "limits": { "bpm_soft_range": (126, 130), "bpm_ideal": 128, "bpm_tol": 4, "max_stretch_pct": 6 },
        "transition": { "techno_crossfade_beats": 24 },
        "weights": {},
    },
    "peak_warehouse": {
        "limits": { "bpm_soft_range": (128, 134), "bpm_ideal": 130, "bpm_tol": 3, "max_stretch_pct": 5 },
        "transition": { "techno_crossfade_beats": 24 },
        "weights": { "energy": 0.25, "vocal": 0.04 },
    },
    "hard_techno": {
        "limits": { "bpm_soft_range": (140, 150), "bpm_ideal": 145, "bpm_tol": 4, "max_stretch_pct": 3 },
        "transition": { "techno_crossfade_beats": 12 },
        "weights": { "tempo": 0.35, "energy": 0.25, "vocal": 0.03 },
    },
    "hypnotic": {
        "limits": { "bpm_soft_range": (130, 134), "bpm_ideal": 132, "bpm_tol": 2, "max_stretch_pct": 5 },
        "transition": { "techno_crossfade_beats": 32 },
        "weights": { "energy": 0.18, "phrase": 0.12 },
    }
}

def apply_preset(name: str):
    cfg = PRESETS.get(name)
    if not cfg: return
    LIMITS.update(cfg.get("limits", {}))
    TRANSITION.update(cfg.get("transition", {}))
    WEIGHTS.update(cfg.get("weights", {}))
