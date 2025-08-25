# rotation/py/preset_scheduler.py
# Logic-only preset rotation for Python workflows (no ports, no servers).

from dataclasses import dataclass
from typing import List, Optional, Dict, Tuple
import datetime as _dt

PresetName = str  # 'deep_minimal' | 'classic' | 'peak_warehouse' | 'hard_techno' | 'hypnotic'

@dataclass
class RotationSlot:
    start_hour: int  # 0..23
    end_hour: int    # 1..24
    preset: PresetName
    simple_head_tail: bool = False
    notes: str = ""

DEFAULT_ROTATION: List[RotationSlot] = [
    RotationSlot(0, 6,  'deep_minimal',  True,  'late night low-key flow'),
    RotationSlot(6, 12, 'classic',       False, 'daytime baseline'),
    RotationSlot(12,18, 'peak_warehouse',False, 'afternoon energy'),
    RotationSlot(18,22, 'peak_warehouse',False, 'prime time push'),
    RotationSlot(22,24, 'hypnotic',      True,  'late evening long layers'),
]

def _in_range(h: int, slot: RotationSlot) -> bool:
    if slot.start_hour < slot.end_hour:
        return slot.start_hour <= h < slot.end_hour
    return h >= slot.start_hour or h < slot.end_hour

def select_preset(local_dt: _dt.datetime, rotation: List[RotationSlot]=DEFAULT_ROTATION,
                  telemetry: Optional[Dict]=None) -> Dict:
    h = local_dt.hour
    slot = next((s for s in rotation if _in_range(h, s)), rotation[0])
    reasons = [f"time:{h}:00 in [{slot.start_hour},{slot.end_hour}) → {slot.preset}"]
    simple = bool(slot.simple_head_tail)

    if telemetry:
        recent_errors = telemetry.get('recentErrors', 0)
        dropout = telemetry.get('dropoutRate', 0.0)
        avg_bpm = telemetry.get('avgBpm', None)
        if recent_errors > 0:
            simple = True; reasons.append('recentErrors>0 → force simple_head_tail')
        if isinstance(dropout, (int,float)) and dropout > 0.05:
            simple = True; reasons.append('dropoutRate>5% → simplify transitions')
        if isinstance(avg_bpm, (int,float)):
            if avg_bpm >= 132 and slot.preset in ('deep_minimal','classic','hypnotic'):
                reasons.append(f'avgBpm={avg_bpm} → bias up')
                return {'preset':'peak_warehouse','simple_head_tail':simple,'reason':reasons}
            if avg_bpm <= 126 and slot.preset in ('peak_warehouse','hard_techno'):
                reasons.append(f'avgBpm={avg_bpm} → bias down')
                return {'preset':'classic','simple_head_tail':simple,'reason':reasons}

    return {'preset':slot.preset, 'simple_head_tail':simple, 'reason':reasons}

def minutes_until_next_change(local_dt: _dt.datetime, rotation: List[RotationSlot]=DEFAULT_ROTATION) -> int:
    h = local_dt.hour; m = local_dt.minute
    slot = next((s for s in rotation if _in_range(h, s)), rotation[0])
    end_h = slot.end_hour % 24
    minutes = ((end_h - h) % 24)*60 - m
    return minutes if minutes>0 else 60

# Usage (no ports):
# sel = select_preset(_dt.datetime.now(), DEFAULT_ROTATION, {'avgBpm':130, 'dropoutRate':0.02})
# args = ['--preset', sel['preset']] + (['--simple_head_tail'] if sel['simple_head_tail'] else [])
