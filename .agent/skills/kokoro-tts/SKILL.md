---
name: kokoro-tts
description: Generate, revise or troubleshoot local Kokoro narration, pronunciation and scene word timing. Reuse verified unchanged clips; inspect the Python environment before setup changes. Exclude research, visuals, music composition and publishing.
compatibility: Repository Python environment with Kokoro, NumPy and soundfile; cached model or authorized first download.
---

# Kokoro narration

Use approved text and the shared generator; do not copy a project-specific TTS
script or replace predicted timestamps with estimated sentence timing.

```bash
.venv-kokoro/bin/python tools/audio-kokoro/generate_audio.py --project projects/NNN-topic
```

The helper supports matching American/British English voices at 24 kHz. Read
[setup and language reference](references/setup.md) only for installation,
dependency failures or changing language; inspect interpreter/pyvenv.cfg first.
Ask before adding dependencies. Other languages need a supported provider or an
audition; never promise native Vietnamese from English phonetics.

## Revisions and reuse

Keep stable unique scene IDs. The generator checks text/pronunciation, model,
voice, language, speed, sample rate, package and generator/caption code version,
WAV hash/duration and word/caption coverage. Only invalid scenes are synthesized;
unchanged WAVs and timestamps survive bit-for-bit. Old verified manifests can be
adopted once. A fully unchanged run leaves the manifest unchanged too.
Generation stages all results before swapping the voice directory; failure
preserves the previous set. Do not run simultaneous writers for one project.
Generated WAVs live in `output/voice/`; their manifest lives in
`output/docs/voice-manifest.json`.

Use `--force` to deliberately regenerate all clips, including after changing
locally cached model weights under the same model identifier (weight bytes are
not part of the cache key). New model/voice/speed invalidates every affected clip.
A music-only revision does not call TTS.

Normalize acronyms/numbers/URLs with the script's pronunciation map. Preserve
sourceText versus spoken text; captions follow spoken text unless separately
aligned. Say each intended phrase once. Punctuation is not a timing guarantee.

Measure actual WAV durations before scene frames. Shorten, expand or split dense
scenes before increasing speed; never trim speech to fit a guessed duration.
Keep raw audio and create separate padded/resampled derivatives if needed.

## Validate

Run workflow preflight after generation. Require complete ordered in-range words,
phrase boundaries, correct sample rate, nonempty decodable audio and measured
duration. Timings include actual preceding chunk lengths and attach punctuation.
Review missing/repeated/clipped words, pronunciation, pauses, peaks and tail room.
Listen when possible; predicted alignment is not independent transcription.
Inspect three successive rendered highlights and a later scene/chunk, following
[defaults](../../../docs/VIDEO_PRODUCTION_DEFAULTS.md). Record unperformed listening.
