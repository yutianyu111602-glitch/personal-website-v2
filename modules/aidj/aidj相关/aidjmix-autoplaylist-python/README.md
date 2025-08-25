# aidjmix · AutoPlaylist (Python CLI, Techno优化)

目标：提供一个可运行的**自动歌单生成**命令行工具（CLI），默认偏向 **Techno** 的混音风格。
> 本项目只生成“编排逻辑”和“M3U/TXT/JSON 输出”，**不做音频渲染**。需要的音频接口留空位注释。

## 快速开始
```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 使用示例特征，输出到 out/
python -m aidjmix.cli data/tracks.example.json out/ --minutes 60 --beam 24 --techno 1
```

### 数据格式
见 `data/tracks.example.json`，字段在 `aidjmix/types.py` 注释清楚。最小必需：
- id, durationSec, bpm, keyCamelot, cueInSec, cueOutSec, path

### 可调参数
- `--minutes` 目标时长
- `--beam` Beam Search 宽度
- `--techno 1` 使用 Techno 权重（BPM 128±4 优先，小调优先，长过渡）

### 输出
- `out/auto_mix_*.m3u8`   播放列表（供网页电台）
- `out/auto_mix_*.txt`    可读清单
- `out/auto_mix_*.json`   过渡计划（可供播放器复现）

### 注意
- 所有**音频处理接口留空**（例如 VAD/分离、人声检测），只在代码中给出调用位与注释，便于你对接自己的后端。
