"""Prepare a small Git-trackable image/full-WAV job before renting the GPU."""

from __future__ import annotations

import argparse
import shutil
import subprocess
import tempfile
from pathlib import Path

from job import ROOT, bundle_name, probe, sha256, validate_portrait, write_json

PROMPT = (
    "A female educational presenter speaks calmly and directly to the camera. "
    "Preserve the reference face, hairstyle, pink shirt, body proportions, "
    "framing and lighting throughout. Natural mouth movement synchronized with "
    "the supplied speech, occasional blinking and very small head movements. "
    "Keep the hands relaxed in their reference position. Fixed camera, one person, "
    "plain static background, continuous shot."
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", type=Path, required=True)
    parser.add_argument("--presenter", type=Path, default=ROOT / "tools/mascot-echomimic/assets/presenter.png")
    parser.add_argument("--audio", type=Path, help="Defaults to the project's output/voice/full.wav")
    parser.add_argument("--prompt-file", type=Path)
    parser.add_argument("--name", default="longcat", help="Bundle name, e.g. longcat-vi")
    args = parser.parse_args()
    project, presenter = args.project.resolve(), args.presenter.resolve()
    if not project.is_relative_to(ROOT / "projects") or not (project / "video.json").is_file():
        parser.error("Choose an existing project under projects/")
    audio = (args.audio or project / "output/voice/full.wav").resolve()
    for path in (presenter, audio):
        if not path.is_file():
            parser.error(f"Missing input: {path}")
    if audio.suffix.lower() != ".wav":
        parser.error("Use the complete narration WAV")
    validate_portrait(presenter)
    speech = probe(audio)
    seconds = float(speech["format"]["duration"])
    if seconds <= 0 or not any(s["codec_type"] == "audio" for s in speech["streams"]):
        parser.error("Audio is empty")
    image_info = next(s for s in probe(presenter)["streams"] if s["codec_type"] == "video")
    width, height = image_info["width"], image_info["height"]
    prompt = args.prompt_file.read_text().strip() if args.prompt_file else PROMPT
    if not prompt:
        parser.error("Prompt is empty")
    bundle = project / "remote" / args.name
    try:
        bundle_name(bundle / "job.json", project)
    except ValueError as error:
        parser.error(str(error))
    bundle.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="longcat-input-", dir=bundle.parent) as temporary:
        stage = Path(temporary)
        # Flatten alpha locally so the remote only performs talking-video generation.
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-f", "lavfi", "-i", f"color=c=0xe7ebf0:s={width}x{height}",
            "-i", str(presenter), "-filter_complex", "[0:v][1:v]overlay=shortest=1:format=auto,format=rgb24",
            "-frames:v", "1", str(stage / "presenter.png"),
        ], check=True)
        shutil.copyfile(audio, stage / "full.wav")
        (stage / "prompt.txt").write_text(prompt + "\n")
        names = {"image": "presenter.png", "audio": "full.wav", "prompt": "prompt.txt"}
        job = {
            "schemaVersion": 1, "model": "LongCat-Video-Avatar-1.5",
            "project": project.relative_to(ROOT).as_posix(), "audioSeconds": seconds,
            "inputs": {name: {"path": file, "sha256": sha256(stage / file)} for name, file in names.items()},
            "sourcePresenterSha256": sha256(presenter),
            "settings": {"resolution": "480p", "steps": 8, "int8": True,
                         "lowVram": True, "vramReserveGb": 9.5},
        }
        bundle.mkdir(exist_ok=True)
        for file in names.values():
            (stage / file).replace(bundle / file)
        write_json(bundle / "job.json", job)
    print(f"Prepared {seconds:.3f}s full narration: {bundle.relative_to(ROOT)}/job.json")
    print(f"Commit this remote/{args.name} directory with the scripts when ready to publish.")


if __name__ == "__main__":
    main()
