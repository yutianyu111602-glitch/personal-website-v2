from typing import List
from .types import TrackFeature, TransitionPlan, PlaylistItem
from .config import TRANSITION

def plan_transitions(seq: List[TrackFeature], techno: bool=True) -> TransitionPlan:
    items: List[PlaylistItem] = []
    for i, cur in enumerate(seq):
        nxt = seq[i+1] if i+1 < len(seq) else None
        cross = TRANSITION["techno_crossfade_beats"] if (techno and nxt) else (TRANSITION["default_crossfade_beats"] if nxt else 0)
        start = cur.cueInSec if cur.cueInSec is not None else 0.0
        end = cur.cueOutSec if cur.cueOutSec is not None else cur.durationSec

        item = PlaylistItem(
            track=cur,
            startAt=start,
            endAt=end,
            crossfadeBeats=cross,
            automation=[]
        )
        if nxt:
            item.automation.append({"type":"filter","mode":"hipass_ramp","from_hz":80,"to_hz":260,"duration_beats":cross})
        items.append(item)
    total = sum((it.endAt or it.track.durationSec)-(it.startAt or 0) for it in items)
    return TransitionPlan(items=items, totalSec=total, avgScore=0.0)
