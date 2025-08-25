import argparse, json, time
from pathlib import Path
from .types import TrackFeature
from .config import LIMITS
from .search import beam_search, greedy_sequence
from .transitions import plan_transitions
from .export_m3u import export_m3u
from .export_txt import export_txt

def main():
    ap = argparse.ArgumentParser(description="aidjmix · AutoPlaylist CLI (Techno 优化)")
    ap.add_argument("features_json", help="特征 JSON (数组)")
    ap.add_argument("out_dir", help="输出目录")
    ap.add_argument("--minutes", type=float, default=LIMITS["target_minutes"])
    ap.add_argument("--beam", type=int, default=LIMITS["beam_width"])
    ap.add_argument("--greedy", action="store_true", help="使用贪心而非 Beam")
    ap.add_argument("--techno", type=int, default=1, help="Techno 优化（1=开,0=关）")
    ap.add_argument("--preset", type=str, default="classic", help="Techno 预设")
    ap.add_argument("--simple_head_tail", action="store_true", help="仅头尾相接")
    args = ap.parse_args()

    data = json.loads(Path(args.features_json).read_text("utf-8"))
    from .presets import apply_preset
    apply_preset(args.preset)

    tracks = [TrackFeature(**t) for t in data]

    seq = greedy_sequence(tracks, args.minutes) if args.greedy else beam_search(tracks, args.minutes, args.beam)
    plan = plan_transitions(seq, techno=bool(args.techno), simple_head_tail=bool(args.simple_head_tail))

    ts = time.strftime("%Y%m%d_%H%M%S")
    base = f"auto_mix_{ts}"

    out = Path(args.out_dir); out.mkdir(parents=True, exist_ok=True)
    m3u = export_m3u(plan, str(out), base)
    txt = export_txt(plan, str(out), base)
    (out / f"{base}.json").write_text(json.dumps(plan, default=lambda o:o.__dict__, indent=2, ensure_ascii=False), "utf-8")

    print("[OUT]", m3u)
    print("[OUT]", txt)
    print("[OUT]", out / f"{base}.json")

if __name__ == "__main__":
    main()
