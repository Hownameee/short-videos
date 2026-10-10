"""Extract reproducible motion, word-highlight and platform-safe-area evidence."""
from pathlib import Path
import hashlib
import json
import math
import subprocess

ROOT = Path(__file__).resolve().parent
output = ROOT / "output"
frames = output / "review-frames"
frames.mkdir(exist_ok=True)
manifest = json.loads((ROOT / "voice/manifest.json").read_text())
fps = json.loads((ROOT / "video.json").read_text())["meta"]["fps"]
starts = []
elapsed = 0
for scene in manifest["scenes"]:
    starts.append(elapsed)
    elapsed += math.ceil((scene["durationSec"] + 0.45) * fps) / fps


def extract(name, seconds):
    path = frames / f"{name}.png"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(seconds), "-i", str(output / "preview.mp4"), "-frames:v", "1", str(path)], check=True)
    return path


def sheet(name, entries, columns=3, width=270):
    height = round(width * 1920 / 1080)
    args = ["ffmpeg", "-v", "error", "-y"]
    filters = []
    for i, (_, path) in enumerate(entries):
        args += ["-i", str(path)]
        filters.append(f"[{i}:v]scale={width}:{height}[v{i}]")
    layout = "|".join(f"{i % columns * width}_{i // columns * height}" for i in range(len(entries)))
    inputs = "".join(f"[v{i}]" for i in range(len(entries)))
    filters.append(f"{inputs}xstack=inputs={len(entries)}:layout={layout}[out]")
    args += ["-filter_complex", ";".join(filters), "-map", "[out]", "-frames:v", "1", str(output / name)]
    subprocess.run(args, check=True)


samples = [[0.5, 1.6, 3.5], [4.0, 5.0, 6.0], [3.5, 5.0, 6.0], [2.8, 4.2, 7.0], [1.4, 3.0, 5.0], [0.5, 3.0, 7.0]]
evidence = {"previewChecksum": "sha256:" + hashlib.sha256((output / "preview.mp4").read_bytes()).hexdigest(), "motion": [], "karaoke": []}
entries = []
for scene, start, points in zip(manifest["scenes"], starts, samples):
    record = {"scene": scene["id"], "times": [], "paths": []}
    for i, local in enumerate(points):
        seconds = start + local
        path = extract(f"{scene['id']}-{i}", seconds)
        entries.append((f"{scene['id']} / {seconds:.2f}s", path))
        record["times"].append(seconds)
        record["paths"].append(str(path.relative_to(ROOT)))
    evidence["motion"].append(record)
sheet("motion-first-half.png", entries[:9])
sheet("motion-second-half.png", entries[9:])

entries = []
for index, word_indices in [(0, [0, 1, 2]), (3, [11, 12, 13])]:
    scene = manifest["scenes"][index]
    for word_index in word_indices:
        word = scene["words"][word_index]
        seconds = starts[index] + (word["startMs"] + word["endMs"]) / 2000
        path = extract(f"karaoke-{scene['id']}-{word_index}", seconds)
        entries.append((f"{word['text']} / {seconds:.2f}s", path))
        evidence["karaoke"].append({"word": word["text"], "scene": scene["id"], "timeSec": seconds, "path": str(path.relative_to(ROOT))})
sheet("karaoke-review.png", entries)

entries = []
evidence["consecutiveFrames"] = []
for frame in [round(0.6 * fps) + i for i in range(3)]:
    seconds = frame / fps
    path = extract(f"successive-{fps}fps-{frame}", seconds)
    entries.append((f"frame {frame} / {seconds:.4f}s", path))
    evidence["consecutiveFrames"].append({"frame": frame, "timeSec": seconds, "fps": fps, "path": str(path.relative_to(ROOT))})
sheet("consecutive-frames.png", entries)

path = extract("safe-area-payoff", starts[2] + 7.0)
# Conservative Shorts reserved regions; actual UI varies by device.
overlay = "scale=540:960,drawbox=x=450:y=0:w=90:h=960:color=red@0.2:t=fill,drawbox=x=0:y=800:w=540:h=160:color=red@0.2:t=fill,drawbox=x=0:y=0:w=540:h=75:color=red@0.2:t=fill,drawbox=x=45:y=75:w=405:h=725:color=green@0.7:t=2"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-vf", overlay, "-frames:v", "1", str(output / "safe-area-review.png")], check=True)
(output / "frame-evidence.json").write_text(json.dumps(evidence, indent=2) + "\n")
print(json.dumps(evidence, indent=2))
