from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

CamelotKey = str  # 例如 "8A","9B"（A=小调, B=大调）

@dataclass
class TrackFeature:
    id: str
    title: Optional[str] = None
    artist: Optional[str] = None
    durationSec: float = 0.0
    bpm: float = 0.0
    keyCamelot: CamelotKey = "8A"
    energyCurve: Optional[List[float]] = None  # 0..1, 可选
    downbeats: Optional[List[float]] = None    # 可选：小节/乐句起点（单位自定）
    cueInSec: Optional[float] = None           # 进入切点
    cueOutSec: Optional[float] = None          # 退出切点
    vocality: Optional[float] = None           # 可选：人声置信度 0..1
    tags: Optional[List[str]] = None           # 可选：流派/标签
    path: str = ""                             # 文件路径或 URL（M3U 使用）

@dataclass
class PlaylistItem:
    track: TrackFeature
    startAt: Optional[float] = None
    endAt: Optional[float] = None
    stretchPct: float = 0.0                    # 时间伸缩（仅参数）
    transposeSemitone: float = 0.0             # 移调（仅参数）
    crossfadeBeats: int = 0
    automation: List[Dict[str, Any]] = field(default_factory=list)  # 过渡自动化（滤波/EQ）

@dataclass
class TransitionPlan:
    items: List[PlaylistItem]
    totalSec: float
    avgScore: float
