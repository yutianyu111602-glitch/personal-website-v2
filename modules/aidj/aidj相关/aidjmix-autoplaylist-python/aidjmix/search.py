from typing import List, Set, Tuple
from .types import TrackFeature
from .config import LIMITS
from .score import compat_score

def greedy_sequence(tracks: List[TrackFeature], target_minutes: float) -> List[TrackFeature]:
    if not tracks: return []
    used: Set[str] = set()
    start = pick_start(tracks)
    used.add(start.id)
    seq = [start]
    while minutes(seq) < target_minutes:
        cur = seq[-1]
        cands: List[Tuple[TrackFeature, float]] = [(t, compat_score(cur, t)) for t in tracks if t.id not in used]
        if not cands: break
        cands.sort(key=lambda x:x[1], reverse=True)
        t,_ = cands[0]
        seq.append(t); used.add(t.id)
    return seq

def beam_search(tracks: List[TrackFeature], target_minutes: float, beam_width: int) -> List[TrackFeature]:
    if not tracks: return []
    seeds = seed_candidates(tracks, min(beam_width, max(1, len(tracks)//4)))
    paths: List[Tuple[List[TrackFeature], float]] = [([s], 0.0) for s in seeds]
    best = paths[0]
    while paths:
        nxt = []
        for seq, sumScore in paths:
            if minutes(seq) >= target_minutes:
                if avg_score((seq, sumScore)) > avg_score(best): best = (seq, sumScore)
                continue
            used = {t.id for t in seq}
            cur = seq[-1]
            cands = [(t, compat_score(cur, t)) for t in tracks if t.id not in used]
            cands.sort(key=lambda x:x[1], reverse=True)
            for t, s in cands[:beam_width]:
                nxt.append((seq+[t], sumScore + s))
        nxt.sort(key=lambda p: avg_score(p), reverse=True)
        paths = nxt[:beam_width]
        for p in paths:
            if avg_score(p) > avg_score(best): best = p
        if not paths: break
    return best[0]

def minutes(seq: List[TrackFeature]) -> float:
    return sum(t.durationSec for t in seq)/60.0

def avg_score(p) -> float:
    seq, s = p
    return 0.0 if len(seq)<=1 else s/(len(seq)-1)

def pick_start(tracks: List[TrackFeature]) -> TrackFeature:
    ideal = LIMITS["bpm_ideal"]
    return sorted(tracks, key=lambda t: abs((t.bpm or 0)-ideal))[0]

def seed_candidates(tracks: List[TrackFeature], k: int) -> List[TrackFeature]:
    lo, hi = LIMITS["bpm_soft_range"]
    cands = [t for t in tracks if (t.bpm or 0) >= lo and (t.bpm or 0) <= hi] or tracks[:]
    cands.sort(key=lambda t: abs((t.bpm or 0)-LIMITS["bpm_ideal"]))
    return cands[:k]
