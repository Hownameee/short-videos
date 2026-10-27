"""Portable job and media validation shared by LongCat launch tools."""

from __future__ import annotations

import hashlib
import json
import math
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TOOLS = Path(__file__).resolve().parent
RUNTIME = TOOLS / ".runtime"


def sha256(path: Path) -> str:
    checksum = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            checksum.update(block)
    return checksum.hexdigest()


def write_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".partial")
    temporary.write_text(json.dumps(value, indent=2) + "\n")
    temporary.replace(path)


def probe(path: Path) -> dict:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)],
        check=True, capture_output=True, text=True,
    )
    return json.loads(result.stdout)


def inside(base: Path, relative: str) -> Path:
    if not isinstance(relative, str) or Path(relative).is_absolute():
        raise ValueError(f"Expected relative path: {relative!r}")
    result = (base / relative).resolve()
    if not result.is_relative_to(base.resolve()):
        raise ValueError(f"Path escapes its directory: {relative}")
    return result


def validate_portrait(path: Path) -> None:
    image = next(s for s in probe(path)["streams"] if s["codec_type"] == "video")
    # The pinned bucket selector compares height/width; these midpoints select 832x480.
    if not 1.70 < image["height"] / image["width"] < 1.865:
        raise ValueError("Use a near-9:16 portrait (height/width between 1.70 and 1.865) for the reviewed 480x832 profile")


def load_job(path: Path) -> tuple[dict, dict[str, Path], Path]:
    path = path.resolve()
    job = json.loads(path.read_text())
    if job.get("schemaVersion") != 1 or job.get("model") != "LongCat-Video-Avatar-1.5":
        raise ValueError("Unsupported LongCat job schema/model")
    if job.get("settings") != {"resolution": "480p", "steps": 8, "int8": True,
                               "lowVram": True, "vramReserveGb": 9.5}:
        raise ValueError("Job does not use the reviewed 24 GB profile; prepare it again")
    project = inside(ROOT, job["project"])
    if not project.is_relative_to(ROOT / "projects"):
        raise ValueError("Project must be under projects/")
    bundle_name(path, project)
    assets = {}
    for name in ("image", "audio", "prompt"):
        entry = job["inputs"][name]
        asset = inside(path.parent, entry["path"])
        if not asset.is_file() or sha256(asset) != entry["sha256"]:
            raise ValueError(f"Missing or changed {name}: {asset}")
        assets[name] = asset
    validate_portrait(assets["image"])
    duration = float(probe(assets["audio"])["format"]["duration"])
    if not math.isfinite(duration) or duration <= 0 or abs(duration - job["audioSeconds"]) > 0.05:
        raise ValueError("Job audio duration mismatch")
    return job, assets, project


def bundle_name(path: Path, project: Path) -> str:
    path = path.resolve()
    if (path.name != "job.json" or path.parent.parent != project / "remote"
            or not re.fullmatch(r"longcat(?:-[a-z0-9]+)*", path.parent.name)):
        raise ValueError("Job must be projects/NNN-topic/remote/longcat[-name]/job.json")
    return path.parent.name


def verify_video(path: Path, seconds: float) -> dict:
    info = probe(path)
    video = next(s for s in info["streams"] if s["codec_type"] == "video")
    audio = next(s for s in info["streams"] if s["codec_type"] == "audio")
    num, den = map(int, video["r_frame_rate"].split("/"))
    frames = int(video.get("nb_frames", 0))
    if video["codec_name"] != "h264" or audio["codec_name"] != "aac" or num / den != 25:
        raise ValueError("Expected H.264/AAC at native 25 fps")
    if (video["width"], video["height"]) != (480, 832):
        raise ValueError("Output is not the selected 480x832 portrait profile")
    if abs(frames / 25 - seconds) > 0.08 or abs(float(info["format"]["duration"]) - seconds) > 0.15:
        raise ValueError("Output does not cover the full audio")
    return {"width": video["width"], "height": video["height"], "fps": 25,
            "frames": frames, "seconds": float(info["format"]["duration"]),
            "bytes": path.stat().st_size, "sha256": sha256(path)}
