import re
from .types import TrackFeature
from .config import WEIGHTS, LIMITS

def key_score_camelot(a: str, b: str) -> float:
    def parse(k: str):
        m = re.match(r"^(\d+)([ABab])$", k or "")
        if not m: return None
        return int(m.group(1)), m.group(2).upper()
    A = parse(a); B = parse(b)
    if not A or not B: return 0.5
    (an, am), (bn, bm) = A, B
    if an == bn and am == bm: return 1.0
    neighbor = [((an+10)%12)+1, (an%12)+1]
    mode_swap = am != bm
    if an == bn and mode_swap: return 0.85
    if bn in neighbor and am == bm: return 0.8
    if bn in neighbor and mode_swap: return 0.6
    base = 0.4
    if bm == "A": base += 0.05
    return base

def tempo_score(a_bpm: float, b_bpm: float) -> float:
    maxp = LIMITS["max_stretch_pct"]/100.0
    ratio = (b_bpm or 1.0) / max(a_bpm or 1.0, 1e-6)
    if ratio < 0.5: ratio *= 2
    elif ratio > 2: ratio /= 2
    diff = abs(1 - ratio)
    base = 1 - min(1.0, diff/maxp) if diff <= maxp else max(0.05, 1 - diff/(maxp*4))
    ideal = LIMITS["bpm_ideal"]; tol = LIMITS["bpm_tol"]
    lo, hi = LIMITS["bpm_soft_range"]
    if b_bpm < lo or b_bpm > hi: base *= 0.6
    elif abs((b_bpm or 0) - ideal) <= tol: base = min(1.0, base + 0.1)
    return base

def energy_score(a: TrackFeature, b: TrackFeature) -> float:
    def avg_head(arr, frac):
        if not arr: return -1
        n = max(1, int(len(arr)*frac))
        return sum(arr[:n])/n
    def avg_tail(arr, frac):
        if not arr: return -1
        n = max(1, int(len(arr)*frac))
        return sum(arr[-n:])/n
    tail = avg_tail(a.energyCurve or [], 0.25)
    head = avg_head(b.energyCurve or [], 0.25)
    if tail < 0 or head < 0: return 0.6
    diff = abs(tail - head)
    return max(0.0, 1 - min(1.0, diff*1.2))

def phrase_align_score(a: TrackFeature, b: TrackFeature) -> float:
    if (a.downbeats and len(a.downbeats)>1) and (b.downbeats and len(b.downbeats)>1):
        return 0.7
    return 0.5

def vocal_penalty(b: TrackFeature) -> float:
    v = b.vocality
    if v is None: return 0.0
    return - min(0.2, v * 0.2)

def compat_score(a: TrackFeature, b: TrackFeature) -> float:
    s_key = key_score_camelot(a.keyCamelot, b.keyCamelot)
    s_tmp = tempo_score(a.bpm, b.bpm)
    s_eng = energy_score(a, b)
    s_phr = phrase_align_score(a, b)
    pen_v = vocal_penalty(b)
    score = (WEIGHTS["key"]*s_key +
             WEIGHTS["tempo"]*s_tmp +
             WEIGHTS["energy"]*s_eng +
             WEIGHTS["phrase"]*s_phr +
             WEIGHTS["vocal"]* (1.0 + pen_v))
    return max(0.0, min(1.0, score))
