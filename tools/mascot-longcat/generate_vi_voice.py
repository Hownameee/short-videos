"""Generate a complete Vietnamese narration WAV locally with VieNeu TTS."""

from __future__ import annotations

import argparse
import os
from pathlib import Path


def materialize_onnx_files(repo: str, files: tuple[str, ...], subfolder: str | None = None) -> None:
    from huggingface_hub import hf_hub_download

    # ONNX external weights must be beside their model; the HF cache may use
    # symlinks to blobs in separate directories.
    for name in files:
        path = Path(hf_hub_download(repo, name, subfolder=subfolder))
        if path.is_symlink():
            temporary = path.with_name(path.name + ".materialized")
            os.link(path.resolve(), temporary)
            temporary.replace(path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--text", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--voice", default="Mai Anh")
    args = parser.parse_args()
    script = args.text.read_text(encoding="utf-8").strip()
    if not script:
        parser.error("Narration text is empty")

    materialize_onnx_files(
        "pnnbao-ump/VieNeu-TTS-v3-Turbo",
        (
            "vieneu_prefill.onnx", "vieneu_decode_step.onnx",
            "vieneu_acoustic_cached.onnx", "vieneu_backbone_shared.data",
            "vieneu_v3_heads.npz", "config.json", "tokenizer.json",
        ),
        "onnx_update",
    )
    materialize_onnx_files(
        "OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX",
        (
            "moss_audio_tokenizer_decode_full.onnx",
            "moss_audio_tokenizer_decode_shared.data",
            "moss_audio_tokenizer_decode_step.onnx",
            "codec_browser_onnx_meta.json",
            "moss_audio_tokenizer_encode.onnx",
            "moss_audio_tokenizer_encode.data",
        ),
    )

    from vieneu import Vieneu

    output = args.output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_name(output.stem + ".partial.wav")
    tts = Vieneu()
    audio = tts.infer(script, voice=args.voice)
    tts.save(audio, str(temporary))
    temporary.replace(output)
    print(output)


if __name__ == "__main__":
    main()
