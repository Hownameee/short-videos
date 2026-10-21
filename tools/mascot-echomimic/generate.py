"""Generate a talking presenter with the shared EchoMimic MLX environment."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODELS = Path(__file__).resolve().parent / "models"
DEFAULT_PROMPT = (
    "A presenter speaks naturally to the camera. Preserve the reference face, "
    "clothing, and background. Use subtle head, eye, and mouth movements."
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--image",
        type=Path,
        required=True,
        help="Presenter portrait, usually in tools/mascot-echomimic/assets/",
    )
    parser.add_argument("--audio", type=Path, required=True, help="Speech audio file")
    parser.add_argument("--output", type=Path, required=True, help="Output MP4 path")
    parser.add_argument("--prompt", default=DEFAULT_PROMPT)
    parser.add_argument("--width", type=int, default=384)
    parser.add_argument("--height", type=int, default=672)
    parser.add_argument(
        "--frames", type=int, default=17, help="1 + 4N frames at 25 fps"
    )
    parser.add_argument("--steps", type=int, default=8)
    parser.add_argument("--seed", type=int, default=43)
    parser.add_argument(
        "--dry-run", action="store_true", help="Validate inputs and print the command"
    )
    args = parser.parse_args()

    if args.width < 16 or args.height < 16 or args.width % 16 or args.height % 16:
        parser.error("width and height must be positive multiples of 16")
    if args.frames < 1 or (args.frames - 1) % 4:
        parser.error("frames must equal 1 + 4N")
    if args.steps < 1:
        parser.error("steps must be positive")
    for name in ("image", "audio"):
        path = getattr(args, name).expanduser().resolve()
        if not path.is_file() or path.stat().st_size == 0:
            parser.error(f"{name} file is missing or empty: {path}")
        setattr(args, name, path)

    required = {
        "transformer": MODELS
        / "flash/echomimicv3-flash-pro/diffusion_pytorch_model.safetensors",
        "vae": MODELS / "wan-fun/Wan2.1_VAE.pth",
        "t5": MODELS / "wan-fun/models_t5_umt5-xxl-enc-bf16.pth",
        "clip": MODELS
        / "wan-fun/models_clip_open-clip-xlm-roberta-large-vit-huge-14.pth",
        "tokenizer": MODELS / "wan-fun/google/umt5-xxl/tokenizer.json",
        "wav2vec": MODELS / "wav2vec",
    }
    for name, path in required.items():
        if not path.exists():
            parser.error(
                f"missing {name} model: {path}; run tools/mascot-echomimic/setup.sh"
            )

    output = args.output.expanduser().resolve()
    if output.suffix.lower() != ".mp4":
        parser.error("output must be an .mp4 file")
    if output.exists():
        parser.error(f"output already exists: {output}")
    if Path(sys.prefix).resolve() != (ROOT / ".venv-mascot").resolve():
        parser.error("run this script with .venv-mascot/bin/python")
    command = [
        sys.executable,
        "-m",
        "echomimic_mlx.cli",
        "--image",
        str(args.image),
        "--audio",
        str(args.audio),
        "--prompt",
        args.prompt,
        "--output",
        str(output),
        "--width",
        str(args.width),
        "--height",
        str(args.height),
        "--frames",
        str(args.frames),
        "--steps",
        str(args.steps),
        "--fps",
        "25",
        "--seed",
        str(args.seed),
    ]
    for name, path in required.items():
        command.extend((f"--{name}", str(path)))
    if args.dry_run:
        import shlex

        print(shlex.join(command))
        return
    subprocess.run(command, check=True)


if __name__ == "__main__":
    main()
