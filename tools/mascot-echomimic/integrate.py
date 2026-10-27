"""Animate each scene voice, matte the presenter, and overlay it on a project video."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[2]
TOOLS = Path(__file__).resolve().parent
MATTING_SOURCE = TOOLS / "matanyone2-source"
CHECKPOINT = TOOLS / "models/matanyone2.pth"
FPS = 25
PROMPT = (
    "Animate the presenter from the supplied reference speaking naturally to camera. "
    "Preserve the reference identity, clothing, proportions, framing and background. "
    "Use restrained gestures and natural facial motion matching the narration."
)


def run(command: list[str], *, cwd: Path | None = None) -> None:
    print("Running:", " ".join(command[:4]), "...", flush=True)
    subprocess.run(command, cwd=cwd, check=True)


def probe(path: Path) -> dict:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_streams",
            "-show_format",
            "-of",
            "json",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def video_stream(path: Path) -> dict:
    return next(
        stream for stream in probe(path)["streams"] if stream["codec_type"] == "video"
    )


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def scene_frames(duration: float) -> int:
    return 1 + 4 * max(0, math.ceil((duration * FPS - 1) / 4))


def prepare_presenter(source: Path, opaque: Path, seed: Path) -> None:
    with Image.open(source) as image:
        rgba = image.convert("RGBA")
        if rgba.size != (384, 672):
            raise ValueError("Presenter image must be 384×672 for this run")
        background = Image.new("RGBA", rgba.size, "#E7EBF0")
        Image.alpha_composite(background, rgba).convert("RGB").save(opaque)
        rgba.getchannel("A").point(lambda value: 255 if value >= 128 else 0).save(seed)


def prepare_audio(
    source: Path, target: Path, speech_seconds: float, frames: int
) -> None:
    if target.exists():
        return
    run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(source),
            "-af",
            f"atrim=duration={speech_seconds:.6f},apad",
            "-t",
            f"{frames / FPS:.6f}",
            "-c:a",
            "pcm_s16le",
            str(target),
        ]
    )


def generate(raw: Path, image: Path, audio: Path, frames: int, steps: int) -> None:
    if raw.exists():
        actual = int(video_stream(raw).get("nb_frames", 0))
        if actual != frames:
            raise ValueError(
                f"Existing EchoMimic clip has {actual} frames; expected {frames}: {raw}"
            )
        return
    run(
        [
            sys.executable,
            str(TOOLS / "generate.py"),
            "--image",
            str(image),
            "--audio",
            str(audio),
            "--output",
            str(raw),
            "--prompt",
            PROMPT,
            "--frames",
            str(frames),
            "--steps",
            str(steps),
        ]
    )
    actual = int(video_stream(raw).get("nb_frames", 0))
    if actual != frames:
        raise ValueError(f"EchoMimic wrote {actual} frames; expected {frames}: {raw}")


def matte(
    raw: Path, seed: Path, scene_dir: Path, frames: int, bottom_feather: int
) -> Path:
    alpha = scene_dir / "alpha.webm"
    if alpha.exists():
        alpha_info = probe(alpha)
        duration = float(alpha_info["format"]["duration"])
        if abs(duration - frames / FPS) > 0.08:
            raise ValueError(f"Existing alpha clip has wrong frame count: {alpha}")
        return alpha
    if (
        not CHECKPOINT.is_file()
        or not (MATTING_SOURCE / "inference_matanyone2.py").is_file()
    ):
        raise FileNotFoundError("Run tools/mascot-echomimic/setup-matanyone2.sh first")
    frames_dir = scene_dir / "frames"
    frames_dir.mkdir(exist_ok=True)
    if len(list(frames_dir.glob("*.png"))) != frames:
        run(
            [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-i",
                str(raw),
                "-fps_mode",
                "passthrough",
                "-start_number",
                "0",
                str(frames_dir / "%04d.png"),
            ]
        )
    if len(list(frames_dir.glob("*.png"))) != frames:
        raise ValueError(f"Extracted frame count differs from {frames}: {frames_dir}")
    result_dir = scene_dir / "matanyone"
    run(
        [
            sys.executable,
            "inference_matanyone2.py",
            "-i",
            str(frames_dir),
            "-m",
            str(seed),
            "-o",
            str(result_dir),
            "--save_image",
        ],
        cwd=MATTING_SOURCE,
    )
    masks = result_dir / "frames/pha"
    if len(list(masks.glob("*.png"))) != frames:
        raise ValueError(f"MatAnyone2 mask count differs from {frames}: {masks}")
    if bottom_feather:
        feathered = scene_dir / "feathered-masks"
        feathered.mkdir(exist_ok=True)
        if len(list(feathered.glob("*.png"))) != frames:
            with Image.open(masks / "0000.png") as first:
                mask_width, mask_height = first.size
            fade = Image.new("L", (1, mask_height))
            fade.putdata(
                [
                    255
                    if y < mask_height - bottom_feather
                    else round(255 * (mask_height - 1 - y) / max(1, bottom_feather - 1))
                    for y in range(mask_height)
                ]
            )
            fade = fade.resize((mask_width, mask_height))
            for frame in range(frames):
                with Image.open(masks / f"{frame:04d}.png") as mask:
                    ImageChops.multiply(mask.convert("L"), fade).save(
                        feathered / f"{frame:04d}.png"
                    )
        masks = feathered
    partial = scene_dir / "alpha.partial.webm"
    run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(raw),
            "-framerate",
            str(FPS),
            "-start_number",
            "0",
            "-i",
            str(masks / "%04d.png"),
            "-filter_complex",
            "[0:v]format=rgb24[rgb];[1:v]format=gray[a];[rgb][a]alphamerge,format=rgba[v]",
            "-map",
            "[v]",
            "-an",
            "-frames:v",
            str(frames),
            "-c:v",
            "libvpx-vp9",
            "-pix_fmt",
            "yuva420p",
            "-auto-alt-ref",
            "0",
            "-lossless",
            "1",
            str(partial),
        ]
    )
    alpha_check = scene_dir / "alpha-check.png"
    run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-c:v",
            "libvpx-vp9",
            "-i",
            str(partial),
            "-frames:v",
            "1",
            "-pix_fmt",
            "rgba",
            str(alpha_check),
        ]
    )
    with Image.open(alpha_check) as image:
        low, high = image.convert("RGBA").getchannel("A").getextrema()
    if low >= high:
        raise ValueError(f"MatAnyone2 output has no varying alpha: {low}..{high}")
    partial.replace(alpha)
    return alpha


def compose(
    base: Path,
    output: Path,
    clips: list[tuple[Path, float, float]],
    width_fraction: float,
    x_fraction: float,
    y_fraction: float,
) -> None:
    if output.exists():
        print(f"Keeping existing composite: {output}", flush=True)
        return
    info = probe(base)
    base_video = next(
        stream for stream in info["streams"] if stream["codec_type"] == "video"
    )
    width, height = int(base_video["width"]), int(base_video["height"])
    rate_num, rate_den = (int(part) for part in base_video["r_frame_rate"].split("/"))
    base_fps = rate_num / rate_den
    mascot_width = 2 * round(width * width_fraction / 2)
    mascot_height = 2 * round(mascot_width * 672 / 384 / 2)
    x, y = round(width * x_fraction), round(height * y_fraction)
    if x < 0 or y < 0 or x + mascot_width > width or y + mascot_height > height:
        raise ValueError("Mascot placement extends outside the base video")

    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(base)]
    for clip, _, _ in clips:
        command.extend(("-c:v", "libvpx-vp9", "-i", str(clip)))
    filters = []
    previous = "0:v"
    for index, (_, start, duration) in enumerate(clips, 1):
        mascot = f"mascot{index}"
        output_label = f"layer{index}"
        filters.append(
            f"[{index}:v]trim=duration={duration:.6f},format=rgba,"
            f"scale={mascot_width}:{mascot_height}:flags=lanczos,"
            f"setpts=PTS-STARTPTS+{start:.6f}/TB[{mascot}]"
        )
        filters.append(
            f"[{previous}][{mascot}]overlay={x}:{y}:format=auto:"
            f"eof_action=pass:repeatlast=0[{output_label}]"
        )
        previous = output_label
    output.parent.mkdir(parents=True, exist_ok=True)
    partial = output.with_name(f"{output.stem}.partial.mp4")
    command.extend(
        [
            "-filter_complex",
            ";".join(filters),
            "-map",
            f"[{previous}]",
            "-map",
            "0:a?",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "18",
            "-pix_fmt",
            "yuv420p",
            "-r",
            f"{base_fps:g}",
            "-c:a",
            "copy",
            "-t",
            info["format"]["duration"],
            "-movflags",
            "+faststart",
            str(partial),
        ]
    )
    run(command)
    partial.replace(output)
    output_info = probe(output)
    output_video = next(
        stream for stream in output_info["streams"] if stream["codec_type"] == "video"
    )
    if (int(output_video["width"]), int(output_video["height"])) != (width, height):
        raise ValueError(f"Composite dimensions differ from the base video: {output}")
    if (
        abs(
            float(output_info["format"]["duration"]) - float(info["format"]["duration"])
        )
        > 0.1
    ):
        raise ValueError(f"Composite duration differs from the base video: {output}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", type=Path, required=True)
    parser.add_argument(
        "--presenter", type=Path, required=True
    )
    parser.add_argument(
        "--base", type=Path, help="Existing video; defaults to project/output/video/final.mp4"
    )
    parser.add_argument(
        "--stage", choices=("generate", "matte", "compose", "all"), default="all"
    )
    parser.add_argument(
        "--scene", action="append", help="Limit to scene ID; repeat for multiple scenes"
    )
    parser.add_argument("--run-name", default="full")
    parser.add_argument(
        "--max-seconds", type=float, help="Pilot: use only this many seconds per scene"
    )
    parser.add_argument("--steps", type=int, default=8)
    parser.add_argument(
        "--bottom-feather",
        type=int,
        default=40,
        help="Fade lower edge in source pixels",
    )
    parser.add_argument("--width-fraction", type=float, default=0.25)
    parser.add_argument("--x-fraction", type=float, default=0.72)
    parser.add_argument("--y-fraction", type=float, default=0.21)
    args = parser.parse_args()

    if Path(sys.prefix).resolve() != (ROOT / ".venv-mascot").resolve():
        parser.error("run with .venv-mascot/bin/python")
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", args.run_name):
        parser.error("run name must contain lowercase letters, numbers, or hyphens")
    if args.max_seconds is not None and args.max_seconds <= 0:
        parser.error("max-seconds must be positive")
    if args.steps < 1 or not 0 < args.width_fraction <= 1:
        parser.error("steps and width-fraction are invalid")
    if not 0 <= args.bottom_feather <= 200:
        parser.error("bottom-feather must be between 0 and 200")
    project = args.project.expanduser().resolve()
    presenter = args.presenter.expanduser().resolve()
    base = (args.base or project / "output/video/final.mp4").expanduser().resolve()
    if not presenter.is_file() or not base.is_file():
        parser.error("presenter and base video must exist")
    manifest = json.loads((project / "output/docs/voice-manifest.json").read_text())
    video = json.loads((project / "video.json").read_text())
    base_video = video_stream(base)
    base_rate_num, base_rate_den = (
        int(part) for part in base_video["r_frame_rate"].split("/")
    )
    if abs(base_rate_num / base_rate_den - int(video["meta"]["fps"])) > 0.01:
        parser.error("base video's frame rate differs from video.json")
    scene_ids = [scene["id"] for scene in manifest["scenes"]]
    selected = set(args.scene or scene_ids)
    if not selected or selected - set(scene_ids):
        parser.error(f"unknown scene IDs: {sorted(selected - set(scene_ids))}")
    base_fps = int(video["meta"]["fps"])
    scene_starts = {}
    elapsed_frames = 0
    for scene in manifest["scenes"]:
        scene_starts[scene["id"]] = elapsed_frames / base_fps
        elapsed_frames += math.ceil((scene["durationSec"] + 0.45) * base_fps)

    work = project / ".cache/mascot" / args.run_name
    work.mkdir(parents=True, exist_ok=True)
    settings = {
        "presenter_sha256": sha256(presenter),
        "prompt": PROMPT,
        "scenes": [
            {
                "id": scene["id"],
                "audio_sha256": sha256(project / "output/voice" / scene["file"]),
            }
            for scene in manifest["scenes"]
            if scene["id"] in selected
        ],
        "max_seconds": args.max_seconds,
        "steps": args.steps,
        "bottom_feather": args.bottom_feather,
    }
    settings_path = work / "settings.json"
    if settings_path.exists() and json.loads(settings_path.read_text()) != settings:
        raise ValueError(
            f"Inputs changed; choose a new --run-name instead of reusing {work}"
        )
    settings_path.write_text(json.dumps(settings, indent=2) + "\n")
    opaque, seed = work / "presenter-opaque.png", work / "first-frame-mask.png"
    prepare_presenter(presenter, opaque, seed)

    clips = []
    for scene in manifest["scenes"]:
        if scene["id"] not in selected:
            continue
        duration = min(scene["durationSec"], args.max_seconds or scene["durationSec"])
        frames = scene_frames(duration)
        scene_dir = work / scene["id"]
        scene_dir.mkdir(exist_ok=True)
        audio = scene_dir / "voice-padded.wav"
        raw = scene_dir / "echomimic.mp4"
        alpha = scene_dir / "alpha.webm"
        if args.stage in ("generate", "all"):
            prepare_audio(project / "output/voice" / scene["file"], audio, duration, frames)
            generate(raw, opaque, audio, frames, args.steps)
        if args.stage in ("matte", "all"):
            if not raw.is_file():
                raise FileNotFoundError(raw)
            alpha = matte(raw, seed, scene_dir, frames, args.bottom_feather)
        if args.stage in ("compose", "all"):
            if not alpha.is_file():
                raise FileNotFoundError(alpha)
            clips.append((alpha, scene_starts[scene["id"]], duration))

    if args.stage in ("compose", "all"):
        suffix = "" if args.run_name == "full" else f"-{args.run_name}"
        output = project / "output/video" / f"{base.stem}-with-mascot{suffix}.mp4"
        compose(
            base, output, clips, args.width_fraction, args.x_fraction, args.y_fraction
        )
        output_info = probe(output)
        docs = project / "output/docs"
        docs.mkdir(parents=True, exist_ok=True)
        (docs / f"mascot-{args.run_name}-integration.json").write_text(
            json.dumps(
                {
                    "base": str(base),
                    "output": str(output),
                    "formatDurationSec": float(output_info["format"]["duration"]),
                    "streams": [
                        {
                            "codec": stream["codec_name"],
                            "type": stream["codec_type"],
                            "width": stream.get("width"),
                            "height": stream.get("height"),
                            "fps": stream.get("r_frame_rate"),
                        }
                        for stream in output_info["streams"]
                    ],
                    "scenes": [
                        {
                            "id": scene["id"],
                            "startSec": scene_starts[scene["id"]],
                            "speechSec": min(
                                scene["durationSec"],
                                args.max_seconds or scene["durationSec"],
                            ),
                        }
                        for scene in manifest["scenes"]
                        if scene["id"] in selected
                    ],
                    "audioSource": "base video only",
                    "placement": {
                        "widthFraction": args.width_fraction,
                        "xFraction": args.x_fraction,
                        "yFraction": args.y_fraction,
                    },
                },
                indent=2,
            )
            + "\n"
        )
        print(f"Composite ready: {output}")


if __name__ == "__main__":
    main()
