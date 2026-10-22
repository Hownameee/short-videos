"""Download the pinned EchoMimic V3 Flash files used by both backends."""

from __future__ import annotations

import argparse
import platform
import shutil
import sys
from pathlib import Path

MODELS = Path(__file__).resolve().parent / "models"
WAN_REPO = "alibaba-pai/Wan2.1-Fun-V1.1-1.3B-InP"
WAN_REV = "fc913c34361f4ec879e2f9c78b4f11ae50a937d1"
FLASH_REPO = "BadToBest/EchoMimicV3"
FLASH_REV = "311e176905a8c4c24b240b530488fe636ce4d249"
WAV_REPO = "TencentGameMate/chinese-wav2vec2-base"
WAV_REV = "cb511a6498884e41e35686f4b4d6c5188e181773"

WAN_FILES = (
    "Wan2.1_VAE.pth",
    "models_t5_umt5-xxl-enc-bf16.pth",
    "models_clip_open-clip-xlm-roberta-large-vit-huge-14.pth",
    "google/umt5-xxl/tokenizer.json",
)
CUDA_TOKENIZER_FILES = (
    "config.json",
    "diffusion_pytorch_model.safetensors",
    "google/umt5-xxl/tokenizer_config.json",
    "google/umt5-xxl/special_tokens_map.json",
    "google/umt5-xxl/spiece.model",
)
FLASH_FILES = (
    "echomimicv3-flash-pro/config.json",
    "echomimicv3-flash-pro/diffusion_pytorch_model.safetensors",
)
WAV_FILES = ("config.json", "preprocessor_config.json", "pytorch_model.bin")


def missing(directory: Path, names: tuple[str, ...]) -> list[str]:
    return [
        name
        for name in names
        if not (directory / name).is_file() or not (directory / name).stat().st_size
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--verify-only", action="store_true")
    group.add_argument("--verify-or-download", action="store_true")
    parser.add_argument("--backend", choices=("auto", "mlx", "cuda"), default="auto")
    args = parser.parse_args()
    backend = args.backend
    if backend == "auto":
        backend = "mlx" if sys.platform == "darwin" and platform.machine() == "arm64" else "cuda"
    wan_files = WAN_FILES + (CUDA_TOKENIZER_FILES if backend == "cuda" else ())
    wan, flash, wav = (MODELS / "wan-fun", MODELS / "flash", MODELS / "wav2vec")
    needed = {
        "Wan base": missing(wan, wan_files),
        "Flash": missing(flash, FLASH_FILES),
        "Wav2Vec": missing(wav, WAV_FILES),
    }
    if args.verify_only and any(needed.values()):
        parser.error("missing model files: " + repr(needed))
    if needed["Wan base"] or needed["Flash"]:
        from huggingface_hub import hf_hub_download

        for repo, revision, target, files in (
            (WAN_REPO, WAN_REV, wan, needed["Wan base"]),
            (FLASH_REPO, FLASH_REV, flash, needed["Flash"]),
        ):
            for name in files:
                print(f"Downloading {repo}/{name}", flush=True)
                hf_hub_download(
                    repo_id=repo, filename=name, revision=revision, local_dir=target
                )
    if needed["Wav2Vec"]:
        from modelscope.hub.snapshot_download import snapshot_download

        source = Path(
            snapshot_download(
                WAV_REPO, revision=WAV_REV, allow_file_pattern=list(WAV_FILES)
            )
        )
        wav.mkdir(parents=True, exist_ok=True)
        for name in needed["Wav2Vec"]:
            shutil.copy2(source / name, wav / name)
    remaining = {
        "Wan base": missing(wan, wan_files),
        "Flash": missing(flash, FLASH_FILES),
        "Wav2Vec": missing(wav, WAV_FILES),
    }
    if any(remaining.values()):
        parser.error("incomplete model download: " + repr(remaining))
    print(f"Model files ready: {MODELS}")


if __name__ == "__main__":
    main()
