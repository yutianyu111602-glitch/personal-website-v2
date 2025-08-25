from pathlib import Path
from .types import TransitionPlan

def export_m3u(plan: TransitionPlan, out_dir: str, basename: str) -> str:
    p = Path(out_dir); p.mkdir(parents=True, exist_ok=True)
    fp = p / f"{basename}.m3u8"
    lines = ["#EXTM3U"]
    for it in plan.items:
        dur = int((it.endAt or it.track.durationSec) - (it.startAt or 0))
        title = f"{(it.track.artist or '').strip()} - {(it.track.title or it.track.id)}".strip()
        lines.append(f"#EXTINF:{dur},{title}")
        lines.append(it.track.path)
    fp.write_text("\n".join(lines), encoding="utf-8")
    return str(fp)
