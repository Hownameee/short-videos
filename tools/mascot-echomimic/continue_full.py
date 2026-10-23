"""Extend an existing mascot clip to the full narration using its last frame."""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

from PIL import Image

from full_audio import PROMPT, checked_frames, create_outputs, digest, duration
from integrate import FPS, matte, run

ROOT = Path(__file__).resolve().parents[2]
TOOLS = Path(__file__).resolve().parent


def frame(video: Path, index: int, output: Path, *, alpha: bool = False) -> None:
    if output.is_file():
        return
    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
    if alpha:
        command += ["-c:v", "libvpx-vp9"]
    command += [
        "-i", str(video), "-vf", f"select=eq(n\\,{index})", "-fps_mode", "passthrough",
        "-frames:v", "1", "-pix_fmt", "rgba" if alpha else "rgb24", str(output),
    ]
    run(command)
    if not output.is_file():
        raise RuntimeError(f"Could not extract frame {index} from {video}")


def seed_from_alpha(image: Path, output: Path) -> None:
    if output.is_file():
        return
    with Image.open(image) as source:
        source.convert("RGBA").getchannel("A").point(
            lambda value: 255 if value >= 128 else 0
        ).save(output)


def trimmed_video(source: Path, target: Path, wanted: int, *, alpha: bool) -> None:
    if target.is_file():
        checked_frames(target, wanted)
        return
    partial = target.with_name(f"{target.stem}.partial{target.suffix}")
    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
    if alpha:
        command += ["-c:v", "libvpx-vp9"]
    command += [
        "-i", str(source), "-vf", f"trim=start_frame=1:end_frame={wanted + 1},setpts=PTS-STARTPTS",
        "-an", "-frames:v", str(wanted), "-r", str(FPS),
    ]
    if alpha:
        command += ["-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-auto-alt-ref", "0", "-lossless", "1"]
    else:
        command += ["-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p"]
    run(command + [str(partial)])
    checked_frames(partial, wanted)
    partial.replace(target)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", type=Path, required=True)
    parser.add_argument("--chunk-seconds", type=float, default=3.0)
    parser.add_argument("--steps", type=int, default=8)
    args = parser.parse_args()
    if Path(sys.prefix).resolve() != (ROOT / ".venv-mascot").resolve():
        parser.error("run with .venv-mascot/bin/python")
    if args.chunk_seconds <= 0 or args.steps < 1:
        parser.error("chunk seconds and steps must be positive")
    project = args.project.resolve()
    audio = project / "output/voice/full.wav"
    base = project / "output/video/final.mp4"
    mascot = project / "output/mascot/mascot.mp4"
    transparent = project / "output/mascot/mascot-transparent-bg.webm"
    manifest = project / "output/docs/mascot-integration.json"
    for path in (audio, base, mascot, transparent, manifest):
        if not path.is_file():
            parser.error(f"missing input: {path}")
    previous = json.loads(manifest.read_text())
    if previous.get("mode") not in ("continuation-demo", "full-continuation"):
        parser.error("existing mascot is not a last-frame continuation")
    if previous.get("mode") == "full-continuation":
        print("Full continuation already exists; verify the outputs before rerunning.")
        return
    if previous.get("prompt") != PROMPT:
        parser.error("existing mascot prompt differs from the current continuation prompt")
    prefix_frames = int(previous["mascotFrames"])
    checked_frames(mascot, prefix_frames)
    checked_frames(transparent, prefix_frames)
    target_frames = math.ceil(min(duration(audio), duration(base)) * FPS)
    if target_frames <= prefix_frames:
        parser.error("full narration does not extend beyond existing mascot")
    chunk_frames = round(args.chunk_seconds * FPS)
    if chunk_frames < 4:
        parser.error("chunk size is too short")
    work = project / ".cache/mascot/continuation-full"
    work.mkdir(parents=True, exist_ok=True)
    fingerprint = {
        "audioSha256": digest(audio),
        "baseSha256": digest(base),
        "prefixSha256": digest(mascot),
        "prefixAlphaSha256": digest(transparent),
        "prefixFrames": prefix_frames,
        "targetFrames": target_frames,
        "chunkFrames": chunk_frames,
        "steps": args.steps,
        "prompt": PROMPT,
    }
    settings = work / "settings.json"
    if settings.is_file() and json.loads(settings.read_text()) != fingerprint:
        parser.error("continuation inputs differ from cached settings")
    settings.write_text(json.dumps(fingerprint, indent=2) + "\n")
    remaining = target_frames - prefix_frames
    sizes = []
    while remaining:
        size = min(chunk_frames, remaining)
        if remaining > chunk_frames and remaining - size < max(2, chunk_frames // 2):
            size = remaining
        sizes.append(size)
        remaining -= size
    pieces = [(mascot, transparent)]
    offset = prefix_frames
    previous_video, previous_alpha = mascot, transparent
    for number, wanted in enumerate(sizes, start=1):
        directory = work / f"chunk-{number:03d}"
        directory.mkdir(exist_ok=True)
        first = directory / "reference.png"
        last_alpha = directory / "reference-alpha.png"
        seed = directory / "seed.png"
        last_index = prefix_frames - 1 if number == 1 else sizes[number - 2] - 1
        frame(previous_video, last_index, first)
        frame(previous_alpha, last_index, last_alpha, alpha=True)
        seed_from_alpha(last_alpha, seed)
        generated_frames = 1 + 4 * math.ceil(wanted / 4)
        clip_audio = directory / "audio.wav"
        if not clip_audio.is_file():
            run([
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-ss", f"{(offset - 1) / FPS:.6f}", "-i", str(audio),
                "-af", f"atrim=duration={generated_frames / FPS:.6f},apad",
                "-t", f"{generated_frames / FPS:.6f}",
                "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", str(clip_audio),
            ])
        raw = directory / "echomimic.mp4"
        if not raw.is_file():
            run([
                sys.executable, str(TOOLS / "generate.py"),
                "--image", str(first), "--audio", str(clip_audio),
                "--output", str(raw), "--prompt", PROMPT,
                "--frames", str(generated_frames), "--steps", str(args.steps),
            ])
        checked_frames(raw, generated_frames)
        alpha = matte(raw, seed, directory, generated_frames, bottom_feather=40)
        checked_frames(alpha, generated_frames)
        video_piece = directory / "video-piece.mp4"
        alpha_piece = directory / "alpha-piece.webm"
        trimmed_video(raw, video_piece, wanted, alpha=False)
        trimmed_video(alpha, alpha_piece, wanted, alpha=True)
        pieces.append((video_piece, alpha_piece))
        previous_video, previous_alpha = video_piece, alpha_piece
        offset += wanted
        print(f"Completed mascot frames {offset}/{target_frames}", flush=True)
    create_outputs(
        project=project, work=work, pieces=pieces, source_audio=audio, base=base,
        total_frames=target_frames, demo_seconds=None, prompt=PROMPT,
    )
    report = json.loads(manifest.read_text())
    report["mode"] = "full-continuation"
    report["continuation"] = {
        "prefixFrames": prefix_frames,
        "chunkFrames": sizes,
        "method": "Each next image and matting seed comes from the previous final frame; generation frame 0 is skipped.",
    }
    manifest.write_text(json.dumps(report, indent=2) + "\n")


if __name__ == "__main__":
    main()
