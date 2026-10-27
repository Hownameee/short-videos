#!/usr/bin/env python3
"""Generate comparable Kokoro auditions without modifying any video project."""
import argparse
import fcntl
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from generate_audio import sha256_bytes, synthesize_scene

ROOT = Path(__file__).resolve().parents[2]
LIBRARY = ROOT / "audio-library"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--voices", nargs="+", default=["af_heart", "af_bella", "af_nicole", "am_michael", "am_fenrir", "am_puck", "bf_emma", "bm_george"])
    args = parser.parse_args()
    catalog_path = LIBRARY / "catalog.json"
    catalog = json.loads(catalog_path.read_text())
    entries = {entry["voice"]: entry for entry in catalog["entries"] if entry["kind"] == "voice-sample"}
    if any(voice not in entries for voice in args.voices):
        parser.error("Choose voices already registered in catalog.json")
    text = (LIBRARY / "audition-text.txt").read_text().strip()
    pipelines = {}
    for voice in args.voices:
        entry = entries[voice]
        output = LIBRARY / entry["localPath"]
        text_checksum = sha256_bytes(text.encode())
        if output.exists():
            if entry.get("checksum") == sha256_bytes(output.read_bytes()) and entry.get("textChecksum") == text_checksum:
                print(f"Cached: {voice}", flush=True)
                continue
            raise RuntimeError(f"Modified sample/text: {voice}; inspect before replacing")
        code = entry["langCode"]
        if code not in pipelines:
            from kokoro import KPipeline

            pipelines[code] = KPipeline(lang_code=code, repo_id="hexgrad/Kokoro-82M")
        duration, _, _ = synthesize_scene(pipelines[code], text, output, voice=voice, speed=1.0, sample_rate=24000)
        entry.update(durationSec=duration, checksum=sha256_bytes(output.read_bytes()),
                     textChecksum=text_checksum, text=text, speed=1.0, sampleRate=24000,
                     generatedAt=datetime.now(timezone.utc).isoformat())
        temporary = catalog_path.with_suffix(".tmp")
        temporary.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
        os.replace(temporary, catalog_path)
        print(f"Generated: {voice} ({duration:.1f}s)", flush=True)


if __name__ == "__main__":
    with (LIBRARY / ".catalog.lock").open("a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise SystemExit("Another audio-library command is running; retry after it finishes")
        main()
