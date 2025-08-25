from pathlib import Path
from .types import TransitionPlan

def export_txt(plan: TransitionPlan, out_dir: str, basename: str) -> str:
    p = Path(out_dir); p.mkdir(parents=True, exist_ok=True)
    fp = p / f"{basename}.txt"
    lines = []
    lines.append(f"# AutoMix Playlist")
    lines.append(f"# totalSec={round(plan.totalSec)}  avgScore={plan.avgScore:.3f}")
    lines.append("")
    for i, it in enumerate(plan.items, start=1):
        lines.append(f"{i}. {(it.track.title or it.track.id)} | {(it.track.artist or '')} | bpm={it.track.bpm} | key={it.track.keyCamelot}")
    fp.write_text("\n".join(lines), encoding="utf-8")
    return str(fp)
