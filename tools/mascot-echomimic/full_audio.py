"""Render a talking mascot from one full WAV, matte it, and overlay the video."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import subprocess
import sys
from pathlib import Path

from integrate import FPS, matte, prepare_presenter, probe, run, video_stream

ROOT = Path(__file__).resolve().parents[2]
TOOLS = Path(__file__).resolve().parent
PROMPT = (
    "A friendly female teacher presents directly to camera while speaking. "
    "Keep the reference face, ponytail, pink shirt, body framing, and fixed camera. "
    "Natural speech mouth movements, occasional blinks, subtle head and hand motion. "
    "One person, no cuts, no camera movement."
)


def digest(path: Path) -> str:
    checksum = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            checksum.update(block)
    return checksum.hexdigest()


def duration(path: Path) -> float:
    return float(probe(path)["format"]["duration"])


def checked_frames(path: Path, expected: int) -> None:
    stream = video_stream(path)
    count = int(stream.get("nb_frames") or 0)
    if not count:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0",
                "-show_entries", "stream=nb_read_frames", "-of", "default=nw=1:nk=1",
                str(path),
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        count = int(result.stdout.strip())
    if count != expected:
        raise ValueError(f"Expected {expected} frames, found {count}: {path}")


def create_chunk(
    *,
    index: int,
    start: float,
    wanted_frames: int,
    source_audio: Path,
    opaque: Path,
    seed: Path,
    work: Path,
    prompt: str,
    steps: int,
    source_fingerprint: dict,
) -> tuple[Path, Path]:
    directory = work / f"chunk-{index:03d}"
    directory.mkdir(parents=True, exist_ok=True)
    generated_frames = 1 + 4 * math.ceil((wanted_frames - 1) / 4)
    clip_seconds = wanted_frames / FPS
    settings = {
        **source_fingerprint,
        "startSeconds": start,
        "wantedFrames": wanted_frames,
        "generatedFrames": generated_frames,
        "prompt": prompt,
        "steps": steps,
    }
    settings_path = directory / "settings.json"
    if settings_path.exists() and json.loads(settings_path.read_text()) != settings:
        raise ValueError(f"Cached chunk inputs changed: {directory}")
    settings_path.write_text(json.dumps(settings, indent=2) + "\n")
    chunk_audio = directory / "audio.wav"
    if not chunk_audio.exists():
        run(
            [
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-ss", f"{start:.6f}", "-i", str(source_audio),
                "-af", f"atrim=duration={clip_seconds:.6f},apad",
                "-t", f"{generated_frames / FPS:.6f}",
                "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le",
                str(chunk_audio),
            ]
        )
    raw = directory / "echomimic.mp4"
    if not raw.exists():
        run(
            [
                sys.executable, str(TOOLS / "generate.py"),
                "--image", str(opaque), "--audio", str(chunk_audio),
                "--output", str(raw), "--prompt", prompt,
                "--frames", str(generated_frames), "--steps", str(steps),
            ]
        )
    checked_frames(raw, generated_frames)
    alpha = matte(raw, seed, directory, generated_frames, bottom_feather=40)
    checked_frames(alpha, generated_frames)
    video_piece = directory / "video-piece.mp4"
    alpha_piece = directory / "alpha-piece.webm"
    for source, target in ((raw, video_piece), (alpha, alpha_piece)):
        if not target.exists():
            run(
                [
                    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-i", str(source), "-map", "0:v:0", "-an",
                    "-frames:v", str(wanted_frames), "-c:v", "copy", str(target),
                ]
            )
        checked_frames(target, wanted_frames)
    return video_piece, alpha_piece


def concat(pieces: list[Path], target: Path, work: Path) -> None:
    listing = work / f"{target.stem}-concat.txt"
    paths = ["file '" + str(piece).replace("'", "'\\''") + "'\n" for piece in pieces]
    listing.write_text("".join(paths))
    run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-f", "concat", "-safe", "0", "-i", str(listing),
            "-map", "0:v:0", "-an", "-c:v", "copy", str(target),
        ]
    )


def create_outputs(
    *,
    project: Path,
    work: Path,
    pieces: list[tuple[Path, Path]],
    source_audio: Path,
    base: Path,
    total_frames: int,
    demo_seconds: float | None,
    prompt: str,
) -> None:
    total_seconds = total_frames / FPS
    mascot_dir = project / "output/mascot"
    video_dir = project / "output/video"
    mascot_dir.mkdir(parents=True, exist_ok=True)
    video_dir.mkdir(parents=True, exist_ok=True)
    joined_video = work / "joined-video.mp4"
    joined_alpha = work / "joined-alpha.webm"
    concat([piece[0] for piece in pieces], joined_video, work)
    concat([piece[1] for piece in pieces], joined_alpha, work)
    checked_frames(joined_video, total_frames)
    checked_frames(joined_alpha, total_frames)

    mascot = mascot_dir / "mascot.mp4"
    alpha = mascot_dir / "mascot-transparent-bg.webm"
    combined = video_dir / "final-mascot.mp4"
    mascot_partial = mascot_dir / "mascot.partial.mp4"
    alpha_partial = mascot_dir / "mascot-transparent-bg.partial.webm"
    combined_partial = video_dir / "final-mascot.partial.mp4"
    run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(joined_video), "-i", str(source_audio),
            "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
            "-c:a", "aac", "-b:a", "192k", "-t", f"{total_seconds:.6f}",
            "-movflags", "+faststart", str(mascot_partial),
        ]
    )
    checked_frames(mascot_partial, total_frames)
    run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(joined_alpha), "-map", "0:v:0", "-an",
            "-c:v", "copy", str(alpha_partial),
        ]
    )
    checked_frames(alpha_partial, total_frames)

    base_video = video_stream(base)
    width, height = int(base_video["width"]), int(base_video["height"])
    mascot_width = 2 * round(width * 0.17 / 2)
    mascot_height = 2 * round(mascot_width * 672 / 384 / 2)
    x, y = round(width * 0.81), round(height * 0.67)
    if x + mascot_width > width or y + mascot_height > height:
        raise ValueError("Mascot placement exceeds the base frame")
    output_seconds = min(duration(base), demo_seconds or duration(base))
    run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(base), "-c:v", "libvpx-vp9", "-i", str(alpha_partial),
            "-filter_complex",
            f"[1:v]format=rgba,scale={mascot_width}:{mascot_height}:flags=lanczos[m];"
            f"[0:v][m]overlay={x}:{y}:format=auto:eof_action=pass:repeatlast=0[v]",
            "-map", "[v]", "-map", "0:a?", "-t", f"{output_seconds:.6f}",
            "-c:v", "libx264", "-preset", "medium", "-crf", "18",
            "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart",
            str(combined_partial),
        ]
    )
    combined_stream = video_stream(combined_partial)
    if (int(combined_stream["width"]), int(combined_stream["height"])) != (width, height):
        raise ValueError("Composed video has unexpected dimensions")
    if abs(duration(combined_partial) - output_seconds) > 0.08:
        raise ValueError("Composed video has unexpected duration")
    mascot_partial.replace(mascot)
    alpha_partial.replace(alpha)
    combined_partial.replace(combined)
    docs = project / "output/docs"
    docs.mkdir(parents=True, exist_ok=True)
    (docs / "mascot-integration.json").write_text(
        json.dumps(
            {
                "mode": "demo" if demo_seconds else "full",
                "sourceAudio": str(source_audio),
                "baseVideo": str(base),
                "prompt": prompt,
                "mascot": str(mascot),
                "transparentMascot": str(alpha),
                "composite": str(combined),
                "mascotFrames": total_frames,
                "mascotFps": FPS,
                "compositeSeconds": duration(combined),
                "placementPixels": {"x": x, "y": y, "width": mascot_width, "height": mascot_height},
                "audioSource": "base video for composite; full WAV for standalone mascot",
            },
            indent=2,
        ) + "\n"
    )
    print(f"Ready: {mascot}\nReady: {alpha}\nReady: {combined}", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", type=Path, required=True)
    parser.add_argument("--presenter", type=Path, default=TOOLS / "assets/presenter.png")
    parser.add_argument("--prompt", default=PROMPT)
    parser.add_argument("--seconds", type=float, help="Demo length; omit for the full WAV")
    parser.add_argument("--chunk-seconds", type=float, default=3.0)
    parser.add_argument("--steps", type=int, default=8)
    args = parser.parse_args()
    if Path(sys.prefix).resolve() != (ROOT / ".venv-mascot").resolve():
        parser.error("run with .venv-mascot/bin/python")
    if args.seconds is not None and args.seconds <= 0:
        parser.error("--seconds must be positive")
    if args.chunk_seconds <= 0 or round(args.chunk_seconds * FPS) < 2:
        parser.error("--chunk-seconds is too short")
    if args.steps < 1:
        parser.error("--steps must be positive")
    project = args.project.expanduser().resolve()
    presenter = args.presenter.expanduser().resolve()
    source_audio = project / "output/voice/full.wav"
    base = project / "output/video/final.mp4"
    for path in (presenter, source_audio, base):
        if not path.is_file():
            parser.error(f"missing input: {path}")
    full_seconds = duration(source_audio)
    chosen_seconds = min(args.seconds or full_seconds, full_seconds, duration(base))
    total_frames = math.ceil(chosen_seconds * FPS)
    chunk_frames = round(args.chunk_seconds * FPS)
    work = project / ".cache/mascot/full-wav"
    work.mkdir(parents=True, exist_ok=True)
    opaque, seed = work / "presenter-opaque.png", work / "first-frame-mask.png"
    prepare_presenter(presenter, opaque, seed)
    fingerprint = {"presenterSha256": digest(presenter), "audioSha256": digest(source_audio)}
    count, remainder = divmod(total_frames, chunk_frames)
    sizes = [chunk_frames] * count
    if remainder:
        if sizes and remainder < max(2, chunk_frames // 2):
            sizes[-1] += remainder
        else:
            sizes.append(remainder)
    pieces = []
    offset = 0
    for index, wanted_frames in enumerate(sizes):
        pieces.append(
            create_chunk(
                index=index,
                start=offset / FPS,
                wanted_frames=wanted_frames,
                source_audio=source_audio,
                opaque=opaque,
                seed=seed,
                work=work,
                prompt=args.prompt,
                steps=args.steps,
                source_fingerprint=fingerprint,
            )
        )
        offset += wanted_frames
    create_outputs(
        project=project,
        work=work,
        pieces=pieces,
        source_audio=source_audio,
        base=base,
        total_frames=total_frames,
        demo_seconds=args.seconds,
        prompt=args.prompt,
    )


if __name__ == "__main__":
    main()
