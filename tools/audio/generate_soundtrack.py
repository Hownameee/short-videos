#!/usr/bin/env python3

import argparse
import hashlib
import json
import math
import random
import struct
import wave
from pathlib import Path


SAMPLE_RATE = 24_000


def clamp(value: float) -> float:
    return max(-1.0, min(1.0, value))


def write_mono(path: Path, duration: float, sample_fn) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for index in range(round(duration * SAMPLE_RATE)):
            value = clamp(sample_fn(index / SAMPLE_RATE))
            frames.extend(struct.pack("<h", round(value * 32767)))
            if len(frames) >= 65_536:
                output.writeframesraw(frames)
                frames.clear()
        if frames:
            output.writeframesraw(frames)


def music_sample(time_sec: float, duration: float) -> float:
    bpm = 112
    beat = time_sec * bpm / 60
    beat_phase = beat % 1
    bar = int(beat // 4)
    roots = [110.0, 130.81, 146.83, 98.0]
    root = roots[bar % len(roots)]
    bass = math.sin(2 * math.pi * root * time_sec) * 0.16
    fifth = math.sin(2 * math.pi * root * 1.5 * time_sec) * 0.055
    pulse = math.exp(-beat_phase * 8) * math.sin(2 * math.pi * 62 * time_sec) * 0.22
    eighth_phase = (beat * 2) % 1
    pluck_frequency = root * (2 if int(beat * 2) % 2 == 0 else 2.5)
    pluck = math.exp(-eighth_phase * 10) * math.sin(2 * math.pi * pluck_frequency * time_sec) * 0.09
    fade = min(1.0, time_sec / 0.6, max(0.0, (duration - time_sec) / 1.5))
    return (bass + fifth + pulse + pluck) * fade


def impact_sample(time_sec: float) -> float:
    return math.exp(-time_sec * 10) * (
        math.sin(2 * math.pi * (72 - time_sec * 22) * time_sec) * 0.65
        + math.sin(2 * math.pi * 190 * time_sec) * 0.15
    )


def copy_sample(time_sec: float) -> float:
    envelope = math.exp(-time_sec * 12)
    return envelope * (
        math.sin(2 * math.pi * 540 * time_sec) * 0.32
        + math.sin(2 * math.pi * 810 * time_sec) * 0.18
    )


def switch_sample(time_sec: float) -> float:
    frequency = 220 + 900 * min(time_sec / 0.45, 1)
    return math.exp(-time_sec * 5) * math.sin(2 * math.pi * frequency * time_sec) * 0.42


def success_sample(time_sec: float) -> float:
    notes = [523.25, 659.25, 783.99]
    index = min(int(time_sec / 0.16), len(notes) - 1)
    local = time_sec - index * 0.16
    return math.exp(-local * 6) * math.sin(2 * math.pi * notes[index] * local) * 0.34


def sha256(path: Path) -> str:
    return f"sha256:{hashlib.sha256(path.read_bytes()).hexdigest()}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate the project-owned music and SFX.")
    parser.add_argument("--project", required=True, type=Path)
    parser.add_argument("--duration", type=float, default=70.0)
    args = parser.parse_args()
    project = args.project.resolve()
    music = project / "assets/music/technical-pulse.wav"
    sfx = {
        "impact-soft": (project / "assets/sfx/impact-soft.wav", 0.8, impact_sample),
        "copy-pop": (project / "assets/sfx/copy-pop.wav", 0.55, copy_sample),
        "route-switch-clean": (project / "assets/sfx/route-switch-clean.wav", 0.7, switch_sample),
        "success-chime": (project / "assets/sfx/success-chime.wav", 0.7, success_sample),
    }

    write_mono(music, args.duration, lambda time_sec: music_sample(time_sec, args.duration))
    for _, (path, duration, sample_fn) in sfx.items():
        write_mono(path, duration, sample_fn)

    manifest = {
        "schemaVersion": 1,
        "generator": "tools/audio/generate_soundtrack.py",
        "license": "project-generated",
        "music": {"file": str(music.relative_to(project)), "checksum": sha256(music)},
        "sfx": [
            {"id": identifier, "file": str(path.relative_to(project)), "checksum": sha256(path)}
            for identifier, (path, _, _) in sfx.items()
        ],
    }
    manifest_path = project / "assets/audio-manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    random.seed(0)
    main()
