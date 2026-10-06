"""Compose an original sparse mallet groove, with measured narration ducking."""
from pathlib import Path
import hashlib
import json
import math

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent
RATE = 24000
manifest = json.loads((ROOT / "voice/manifest.json").read_text())
fps = json.loads((ROOT / "video.json").read_text())["meta"]["fps"]
durations = [math.ceil((s["durationSec"] + 0.45) * fps) / fps for s in manifest["scenes"]]
starts = np.cumsum([0] + durations[:-1])
duration = sum(durations)
score = np.zeros((math.ceil(duration * RATE), 2), dtype=np.float64)
narration = np.zeros(len(score))
active = np.zeros(len(score))
for start, scene in zip(starts, manifest["scenes"]):
    wav, rate = sf.read(ROOT / "voice" / scene["file"])
    assert rate == RATE
    offset = round(start * RATE)
    narration[offset:offset + len(wav)] = wav
    for word in scene["words"]:
        a = max(0, round((start + word["startMs"] / 1000 - 0.08) * RATE))
        b = min(len(score), round((start + word["endMs"] / 1000 + 0.15) * RATE))
        active[a:b] = 1


def note(at, midi, length, level, pan=0.0, bass=False):
    begin = round(at * RATE)
    if begin >= len(score):
        return
    n = min(round(length * RATE), len(score) - begin)
    t = np.arange(n) / RATE
    frequency = 440 * 2 ** ((midi - 69) / 12)
    attack = np.minimum(t / 0.012, 1)
    release = np.minimum((n / RATE - t) / 0.09, 1)
    envelope = attack * release * np.exp(-t / (0.45 if bass else 0.30))
    wave = np.sin(2 * np.pi * frequency * t)
    wave += (0.20 if bass else 0.30) * np.sin(2 * np.pi * frequency * 2 * t) * np.exp(-t * 6)
    if not bass:
        wave += 0.10 * np.sin(2 * np.pi * frequency * 3 * t) * np.exp(-t * 12)
    wave *= envelope * level
    score[begin:begin + n, 0] += wave * (1 - pan * 0.3)
    score[begin:begin + n, 1] += wave * (1 + pan * 0.3)


beat = 0.6  # 100 BPM, 4/4. Original notes, no external recordings or samples.
chords = [(48, 60, 64, 67, 71), (45, 57, 60, 64, 67), (41, 57, 60, 65, 69), (43, 59, 62, 67, 69)]
for bar in range(math.ceil(duration / (beat * 4))):
    at = bar * beat * 4
    chord = chords[bar % 4]
    reveal = starts[4] <= at < starts[5]
    if at > duration - 2.5:
        continue
    note(at, chord[0], 1.4, 0.42, bass=True)
    note(at + beat * 2, chord[0] + 12, 0.9, 0.22, bass=True)
    pattern = [1, 3, 2, 4] if reveal or at < starts[1] else [1, 2, 3]
    positions = [0, 1.5, 2.5, 3.5] if len(pattern) == 4 else [0.5, 2, 3.5]
    for i, (tone, pos) in enumerate(zip(pattern, positions)):
        note(at + beat * pos, chord[tone] + 12, 1.0, 0.20 if reveal else 0.15, (-1) ** i * 0.6)
    for tone in chord[1:4]:
        note(at, tone, 1.8, 0.10, 0.15)

for tone in [48, 60, 64, 67, 72]:
    note(duration - 2.2, tone, 2.2, 0.20, bass=tone == 48)

# A short stereo echo fills musical rests without repeating the full track.
delay = round(0.3 * RATE)
score[delay:] += score[:-delay, ::-1].copy() * 0.17
smooth = np.convolve(active, np.ones(1201) / 1201, mode="same")
score *= (1 - 0.40 * smooth[:, None])
t = np.arange(len(score)) / RATE
arc = np.interp(t, [0, starts[1], starts[2], starts[3], starts[4], starts[4] + 5, starts[5], duration], [1.1, 0.87, 0.90, 0.88, 1.05, 1.13, 1.0, 0.9])
score *= arc[:, None]
score *= np.minimum(t / 0.25, 1)[:, None]
score *= np.minimum(np.maximum(duration - t, 0) / 1.2, 1)[:, None]
mask = active > 0
voice_rms = np.sqrt(np.mean(narration[mask] ** 2))
music_rms = np.sqrt(np.mean(score[mask] ** 2))
score *= voice_rms * 10 ** (-15 / 20) / music_rms
assert np.max(np.abs(score)) < 1
output = ROOT / "assets/music/purchasing-power.wav"
sf.write(output, score, RATE, subtype="PCM_16")
checksum = "sha256:" + hashlib.sha256(output.read_bytes()).hexdigest()
sources = {"schemaVersion": 1, "assets": [
    {"id": "purchasing-power", "path": "assets/music/purchasing-power.wav", "type": "audio", "creator": "Original procedural composition created for this project", "license": "Original project-generated audio; no third-party recordings or samples", "source": "compose_music.py", "checksum": checksum, "notes": "100 BPM mallet and bass score; voiced ducking, four-bar harmony, reveal lift, final cadence; fades baked in; renderer gain 1."},
    {"id": "income-diagrams", "type": "vector", "source": "renderer/src/IncomeVideo.tsx", "license": "Original project-created SVG diagrams"},
    {"id": "narration", "type": "voice", "source": "hexgrad/Kokoro-82M", "url": "https://huggingface.co/hexgrad/Kokoro-82M", "license": "Kokoro model Apache-2.0; generated narration", "voice": "af_heart", "notes": "Exact settings, spoken text and audio checksums in voice/manifest.json"}
]}
(ROOT / "assets/sources.json").write_text(json.dumps(sources, indent=2) + "\n")
measurements = {"method": "RMS dBFS on shared union of provider-predicted voiced word intervals, including 80 ms lead and 150 ms tail; music after baked ducking and renderer unity gain", "sampleRate": RATE, "durationSec": duration, "speechActiveSeconds": float(mask.sum() / RATE), "voiceRmsDbfs": float(20 * np.log10(voice_rms)), "musicRmsDbfs": float(20 * np.log10(np.sqrt(np.mean(score[mask] ** 2)))), "musicBelowVoiceDb": 15, "musicChecksum": checksum, "scenes": []}
for start, length, scene in zip(starts, durations, manifest["scenes"]):
    a, b = round(start * RATE), round((start + length) * RATE)
    selection = mask[a:b]
    v = float(20 * np.log10(np.sqrt(np.mean(narration[a:b][selection] ** 2))))
    m = float(20 * np.log10(np.sqrt(np.mean(score[a:b][selection] ** 2))))
    measurements["scenes"].append({"id": scene["id"], "fromSec": float(start), "toSec": float(start + length), "voiceRmsDbfs": v, "musicRmsDbfs": m, "musicBelowVoiceDb": v - m})
(ROOT / "output/mix-measurements.json").write_text(json.dumps(measurements, indent=2) + "\n")
print(json.dumps(measurements, indent=2))
