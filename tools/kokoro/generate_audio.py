#!/usr/bin/env python3

import argparse
import hashlib
import json
import os
import tempfile
import re
import shutil
from importlib.metadata import version as package_version
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
import soundfile as sf
from captions import build_captions


def sha256_bytes(value: bytes) -> str:
    return f"sha256:{hashlib.sha256(value).hexdigest()}"


def normalize_narration(scene: dict) -> str:
    text = scene["narration"]
    for entry in scene.get("pronunciation", []):
        written = entry.get("written")
        spoken = entry.get("spoken")
        if written and spoken:
            text = text.replace(written, spoken)
    return text


def reusable_scene(cached, previous, config, text, output, cache_key, generator_version):
    """Adopt a verified legacy clip once; subsequent runs require the full cache key."""
    if not cached or cached.get("file") != output.name or not output.is_file():
        return False
    if any(previous.get(key) != value for key, value in config.items()):
        return False
    if previous.get("generatorVersion") is not None and previous["generatorVersion"] != generator_version:
        return False
    if cached.get("cacheKey") is not None and cached["cacheKey"] != cache_key:
        return False
    if cached.get("text") != text or cached.get("fileChecksum") != sha256_bytes(output.read_bytes()):
        return False
    try:
        info = sf.info(output)
        if info.samplerate != config["sampleRate"] or abs(info.duration - cached["durationSec"]) > 0.001:
            return False
        words, _ = build_captions(cached["words"], info.duration)
        normalize = lambda value: "".join(c.lower() for c in value if c.isalnum())
        if normalize(" ".join(w["text"] for w in words)) != normalize(text):
            return False
        captions = cached["captions"]
        if normalize(" ".join(c["text"] for c in captions)) != normalize(text):
            return False
        previous_end = 0
        for caption in captions:
            if not previous_end <= caption["startMs"] < caption["endMs"] <= round(info.duration * 1000):
                return False
            previous_end = caption["endMs"]
            covered = [word for word in words if caption["startMs"] <= word["startMs"] < caption["endMs"]]
            if normalize(" ".join(word["text"] for word in covered)) != normalize(caption["text"]):
                return False
            if any(word["endMs"] > caption["endMs"] for word in covered):
                return False
        return True
    except (KeyError, TypeError, ValueError, RuntimeError):
        return False


def synthesize_scene(
    pipeline,
    text: str,
    output: Path,
    *,
    voice: str,
    speed: float,
    sample_rate: int,
) -> tuple[float, list[dict], list[dict]]:
    chunks, raw_words = [], []
    offset_sec = 0.0
    for result in pipeline(text, voice=voice, speed=speed):
        chunk = np.asarray(result.audio, dtype=np.float32)
        for token in result.tokens or []:
            if token.start_ts is None or token.end_ts is None:
                if any(character.isalnum() for character in token.text):
                    raise ValueError(f"Missing word timestamps for {token.text!r}")
                if raw_words:
                    raw_words[-1]["text"] += token.text
                continue
            raw_words.append({
                "text": token.text,
                "startMs": round((offset_sec + token.start_ts) * 1000),
                "endMs": round((offset_sec + token.end_ts) * 1000),
                "timestampMs": None, "confidence": None,
            })
        chunks.append(chunk)
        offset_sec += len(chunk) / sample_rate
    if not chunks:
        raise RuntimeError(f"Kokoro produced no audio for {output.stem}")

    audio = np.concatenate(chunks)
    duration_sec = len(audio) / sample_rate
    words, captions = build_captions(raw_words, duration_sec)
    normalized = lambda value: "".join(c.lower() for c in value if c.isalnum())
    if normalized(" ".join(word["text"] for word in words)) != normalized(text):
        raise ValueError("Timed words do not cover the complete spoken text.")
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        prefix=f".{output.stem}.", suffix=".wav", dir=output.parent, delete=False
    ) as temporary:
        temporary_path = Path(temporary.name)
    try:
        sf.write(temporary_path, audio, sample_rate, format="WAV", subtype="PCM_16")
        os.replace(temporary_path, output)
    finally:
        temporary_path.unlink(missing_ok=True)
    return duration_sec, words, captions


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate scene-level Kokoro narration.")
    parser.add_argument("--project", required=True, type=Path)
    parser.add_argument("--force", action="store_true", help="Regenerate all scenes, ignoring verified cache entries.")
    args = parser.parse_args()

    project = args.project.resolve()
    video_path = project / "video.json"
    video = json.loads(video_path.read_text(encoding="utf-8"))
    if video.get("approval", {}).get("status") != "approved" or video.get("approval", {}).get("approvedScriptVersion") != video.get("scriptVersion"):
        raise ValueError("Generate narration only from an approved script.")
    voice_config = (video.get("audio") or {}).get("voice", {})
    lang_code = voice_config.get("langCode", "a")
    voice = voice_config.get("voice", "af_heart")
    model = voice_config.get("model", "hexgrad/Kokoro-82M")
    speed = float(voice_config.get("speed", 1.0))
    sample_rate = int(voice_config.get("sampleRate", 24_000))
    if lang_code not in {"a", "b"} or not voice.startswith(lang_code):
        raise ValueError("This workflow supports English narration with matching American/British Kokoro voices.")
    if sample_rate != 24_000:
        raise ValueError("Kokoro produces 24000 Hz audio; resample a derivative instead of relabeling samples.")

    if not 0.5 <= speed <= 2:
        raise ValueError("Voice speed must be between 0.5 and 2.")
    config = {"model": model, "langCode": lang_code, "voice": voice, "speed": speed,
              "sampleRate": sample_rate, "packageVersion": package_version("kokoro")}
    generator_version = sha256_bytes(Path(__file__).read_bytes() + Path(__file__).with_name("captions.py").read_bytes())
    voice_dir = project / "voice"
    voice_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = voice_dir / "manifest.json"
    previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    previous_scenes = {scene["id"]: scene for scene in previous.get("scenes", [])}
    if len({scene["id"] for scene in video["scenes"]}) != len(video["scenes"]):
        raise ValueError("Scene IDs must be unique.")
    manifest_scenes = []
    reused = []
    generated = []
    # Build the complete next voice directory before replacing any usable files.
    with tempfile.TemporaryDirectory(prefix=".voice-next-", dir=project) as staging:
        staged_voice = Path(staging) / "voice"
        shutil.copytree(voice_dir, staged_voice)
        build_voice(video, previous, previous_scenes, config, generator_version,
                    voice_dir, staged_voice, args.force, manifest_scenes, reused, generated)
        manifest = {
            "schemaVersion": 1, "generatedAt": datetime.now(UTC).isoformat(),
            "provider": "kokoro", **config, "generatorVersion": generator_version,
            "scriptVersion": video.get("scriptVersion"),
            "captionTiming": "kokoro-predicted-word-timestamps", "scenes": manifest_scenes,
        }
        unchanged = not generated and all(previous.get(k) == v for k, v in manifest.items() if k != "generatedAt")
        if not unchanged:
            (staged_voice / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
            backup = Path(staging) / "previous"
            os.replace(voice_dir, backup)
            try:
                os.replace(staged_voice, voice_dir)
            except BaseException:
                os.replace(backup, voice_dir)
                raise
    total_duration = sum(scene["durationSec"] for scene in manifest_scenes)
    print(json.dumps({"manifest": str(manifest_path), "totalVoiceSec": round(total_duration, 3),
                      "reused": reused, "generated": generated}, indent=2))


def build_voice(video, previous, previous_scenes, config, generator_version,
                voice_dir, staged_voice, force, manifest_scenes, reused, generated):
    pipeline = None
    for scene in video["scenes"]:
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", scene["id"]):
            raise ValueError(f"Unsafe scene ID: {scene['id']}")
        text = normalize_narration(scene)
        output = voice_dir / f"{scene['id']}.wav"
        cache_key = sha256_bytes(json.dumps({**config, "text": text, "generatorVersion": generator_version}, sort_keys=True).encode())
        cached = previous_scenes.get(scene["id"])
        if not force and reusable_scene(cached, previous, config, text, output, cache_key, generator_version):
            shutil.copy2(output, staged_voice / output.name)
            manifest_scenes.append({**cached, "sourceText": scene["narration"], "cacheKey": cache_key})
            reused.append(scene["id"])
            continue
        if pipeline is None:
            from kokoro import KPipeline
            pipeline = KPipeline(lang_code=config["langCode"], repo_id=config["model"])
        output = staged_voice / output.name
        duration_sec, words, captions = synthesize_scene(
            pipeline,
            text,
            output,
            voice=config["voice"],
            speed=config["speed"],
            sample_rate=config["sampleRate"],
        )
        manifest_scenes.append(
            {
                "id": scene["id"],
                "text": text,
                "sourceText": scene["narration"],
                "file": output.name,
                "durationSec": round(duration_sec, 6),
                "sampleRate": config["sampleRate"],
                "textChecksum": sha256_bytes(text.encode("utf-8")),
                "fileChecksum": sha256_bytes(output.read_bytes()),
                "words": words,
                "captions": captions,
                "cacheKey": cache_key,
            }
        )
        generated.append(scene["id"])



if __name__ == "__main__":
    main()
