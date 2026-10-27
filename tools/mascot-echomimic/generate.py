"""Generate a talking presenter with EchoMimic V3 Flash on MLX or CUDA."""

from __future__ import annotations

import argparse
import platform
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
MODELS = Path(__file__).resolve().parent / "models"
CUDA_SOURCE = Path(__file__).resolve().parent / "source-cuda"
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
        help="Presenter portrait, from project assets or the shared assets/presenters/ library",
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
    parser.add_argument("--backend", choices=("auto", "mlx", "cuda"), default="auto")
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
    backend = args.backend
    if backend == "auto":
        if sys.platform == "darwin" and platform.machine() == "arm64":
            backend = "mlx"
        elif sys.platform.startswith("linux"):
            backend = "cuda"
        else:
            parser.error("use Apple Silicon macOS or Linux/WSL2 with NVIDIA CUDA")
    if backend == "mlx" and (
        sys.platform != "darwin" or platform.machine() != "arm64"
    ):
        parser.error("MLX requires Apple Silicon macOS")
    if backend == "cuda" and not sys.platform.startswith("linux"):
        parser.error("CUDA requires Linux or WSL2")
    if backend == "cuda" and not (CUDA_SOURCE / "infer_flash.py").is_file():
        parser.error("CUDA source missing; run tools/mascot-echomimic/setup.sh cuda")
    if backend == "mlx":
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
        output.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(command, check=True)
        return

    import torch

    if not torch.cuda.is_available():
        parser.error("PyTorch cannot see an NVIDIA GPU")
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="echomimic-", dir=output.parent) as temporary:
        scratch = Path(temporary)
        normalized = scratch / "presenter.png"
        with Image.open(args.image) as image:
            ImageOps.fit(image.convert("RGB"), (args.width, args.height)).save(normalized)
        command = [
            sys.executable, str(CUDA_SOURCE / "infer_flash.py"),
            "--image_path", str(normalized), "--audio_path", str(args.audio),
            "--prompt", args.prompt, "--num_inference_steps", str(args.steps),
            "--config_path", str(CUDA_SOURCE / "config/config.yaml"),
            "--model_name", str(MODELS / "wan-fun"),
            "--transformer_path", str(required["transformer"]),
            "--wav2vec_model_dir", str(required["wav2vec"]),
            "--save_path", str(scratch), "--video_length", str(args.frames),
            "--sample_size", str(args.height), str(args.width),
            "--fps", "25", "--seed", str(args.seed),
            "--sampler_name", "Flow_Unipc", "--weight_dtype", "bfloat16",
        ]
        if args.dry_run:
            import shlex

            print(shlex.join(command))
            return
        subprocess.run(command, cwd=CUDA_SOURCE, check=True)
        generated = scratch / "presenter_output.mp4"
        if not generated.is_file() or generated.stat().st_size == 0:
            raise RuntimeError(f"CUDA inference did not create {generated}")
        checked = subprocess.run(
            [
                "ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0",
                "-show_entries", "stream=nb_read_frames,width,height",
                "-of", "csv=p=0", str(generated),
            ],
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip().split(",")
        if tuple(map(int, checked)) != (args.width, args.height, args.frames):
            raise RuntimeError(f"CUDA output has unexpected width, height or frame count: {checked}")
        shutil.move(generated, output)


if __name__ == "__main__":
    main()
