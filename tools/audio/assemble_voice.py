#!/usr/bin/env python3
"""Assemble scene narration into one frame-aligned WAV and timeline."""

import argparse
import hashlib
import json
import os
import tempfile
import wave
from pathlib import Path


def checksum(data: bytes) -> str:
    return "sha256:" + hashlib.sha256(data).hexdigest()


def write_temporary(directory: Path, suffix: str) -> Path:
    with tempfile.NamedTemporaryFile(dir=directory, suffix=suffix, delete=False) as file:
        return Path(file.name)


def srt_time(milliseconds: int) -> str:
    hours, remainder = divmod(milliseconds, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    seconds, millis = divmod(remainder, 1_000)
    return f"{hours:02}:{minutes:02}:{seconds:02},{millis:03}"


def assemble(project: Path, pause_seconds: float) -> tuple[Path, Path]:
    video = json.loads((project / "video.json").read_text())
    manifest_path = project / "voice" / "manifest.json"
    manifest_bytes = manifest_path.read_bytes()
    manifest = json.loads(manifest_bytes)
    fps = video["meta"]["fps"]
    sample_rate = manifest["sampleRate"]
    if not isinstance(fps, int) or fps <= 0 or sample_rate % fps:
        raise ValueError("The narration sample rate must divide evenly into video frames")
    if pause_seconds < 0 or pause_seconds * fps != round(pause_seconds * fps):
        raise ValueError("The pause must be a nonnegative whole number of video frames")
    if manifest["scriptVersion"] != video["scriptVersion"]:
        raise ValueError("Voice manifest does not match the approved script")
    if [scene["id"] for scene in video["scenes"]] != [scene["id"] for scene in manifest["scenes"]]:
        raise ValueError("Voice scenes do not match video scene order")

    samples_per_frame = sample_rate // fps
    pause_frames = round(pause_seconds * fps)
    pause_samples = pause_frames * samples_per_frame
    output_wav = project / "voice" / "full.wav"
    output_json = project / "output" / "docs" / "audio-timeline.json"
    output_srt = project / "output" / "docs" / "captions.en.srt"
    output_json.parent.mkdir(parents=True, exist_ok=True)
    temporary_wav = write_temporary(output_wav.parent, ".wav")
    temporary_json = write_temporary(output_json.parent, ".json")
    temporary_srt = write_temporary(output_srt.parent, ".srt")
    scenes = []
    cursor = 0
    try:
        with wave.open(str(temporary_wav), "wb") as combined:
            combined.setnchannels(1)
            combined.setsampwidth(2)
            combined.setframerate(sample_rate)
            for scene in manifest["scenes"]:
                source = project / "voice" / scene["file"]
                source_bytes = source.read_bytes()
                if checksum(source_bytes) != scene["fileChecksum"]:
                    raise ValueError(f"Voice checksum mismatch: {scene['file']}")
                with wave.open(str(source), "rb") as clip:
                    if (clip.getnchannels(), clip.getsampwidth(), clip.getframerate(), clip.getcomptype()) != (1, 2, sample_rate, "NONE"):
                        raise ValueError(f"Expected mono PCM16 {sample_rate} Hz: {scene['file']}")
                    samples = clip.getnframes()
                    if abs(samples / sample_rate - scene["durationSec"]) > 0.001:
                        raise ValueError(f"Voice duration mismatch: {scene['file']}")
                    audio = clip.readframes(samples)
                voice_frames = (samples + samples_per_frame - 1) // samples_per_frame
                alignment_samples = voice_frames * samples_per_frame - samples
                combined.writeframesraw(audio)
                combined.writeframesraw(bytes(2 * (alignment_samples + pause_samples)))
                scenes.append({
                    "id": scene["id"],
                    "voiceFile": f"voice/{scene['file']}",
                    "voiceChecksum": scene["fileChecksum"],
                    "startFrame": cursor,
                    "startSeconds": cursor / fps,
                    "voiceSamples": samples,
                    "voiceFrames": voice_frames,
                    "voiceSeconds": samples / sample_rate,
                    "pauseFrames": pause_frames,
                    "pauseSeconds": pause_frames / fps,
                    "endFrame": cursor + voice_frames + pause_frames,
                    "endSeconds": (cursor + voice_frames + pause_frames) / fps,
                })
                cursor += voice_frames + pause_frames
        audio_bytes = temporary_wav.read_bytes()
        timeline = {
            "schemaVersion": 1,
            "audioFile": "voice/full.wav",
            "audioChecksum": checksum(audio_bytes),
            "voiceManifestChecksum": checksum(manifest_bytes),
            "scriptVersion": manifest["scriptVersion"],
            "fps": fps,
            "sampleRate": sample_rate,
            "pauseSeconds": pause_seconds,
            "totalFrames": cursor,
            "durationSeconds": cursor / fps,
            "scenes": scenes,
        }
        temporary_json.write_text(json.dumps(timeline, indent=2, ensure_ascii=False) + "\n")
        subtitles = []
        for timed_scene, voice_scene in zip(scenes, manifest["scenes"]):
            offset_ms = round(timed_scene["startFrame"] * 1000 / fps)
            for caption in voice_scene["captions"]:
                start = srt_time(offset_ms + caption["startMs"])
                end = srt_time(offset_ms + caption["endMs"])
                subtitles.append(f"{len(subtitles) + 1}\n{start} --> {end}\n{caption['text']}")
        temporary_srt.write_text("\n\n".join(subtitles) + "\n")
        os.replace(temporary_wav, output_wav)
        os.replace(temporary_json, output_json)
        os.replace(temporary_srt, output_srt)
    finally:
        temporary_wav.unlink(missing_ok=True)
        temporary_json.unlink(missing_ok=True)
        temporary_srt.unlink(missing_ok=True)
    return output_wav, output_json


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True, type=Path)
    parser.add_argument("--pause", type=float, default=0.5, help="Silent seconds after each scene, including the last")
    args = parser.parse_args()
    wav, timeline = assemble(args.project, args.pause)
    print(wav)
    print(timeline)
