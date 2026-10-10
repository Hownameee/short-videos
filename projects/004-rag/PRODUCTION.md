# RAG remake

The user explicitly requested regeneration after the gRPC remake. Editorial
decisions and export are delegated. English narration and captions, vertical
2160x3840 at 60 fps. The complete previous deliverable, source, voice, assets,
configuration and QC were preserved under
`output/archive-before-remake-20261006-224551/` before editing.

## Story and visual system

Follow one fictional operations policy through the RAG pipeline. The model's
unsupported 90-day answer conflicts with the policy's 30-day retention rule.
Document preparation, passage retrieval, prompt augmentation and generation are
shown as distinct stages. The same amber policy fragment travels through them.
The payoff includes source-backed 30 days and an explicit insufficient-evidence
branch for an unsupported follow-up. See [revision research](revision-research.md).
The historical discovery claims are superseded by this revision's script and
primary-source notes.

Ink-blue background, warm paper evidence, amber for relevant passages, lavender
for query/model operations, muted blue-gray secondary copy. Arial bold headlines,
Arial body/captions, Menlo source identifiers. One idea per shot; original SVG
diagrams with no emoji, fake accuracy meters, decorative dashboard, or false
verified badge. Headings around 82-90 design pixels, captions 46; body labels
36-44. The shared composition scales a 1080x1920 design canvas uniformly by two.
Main content uses x=90..900 and y=150..1510, with a secondary source footer at1580.

Motion: strike through the unsupported answer; split a document into passages;
select and move the matching passage; merge query and passage into a prompt;
connect an answer citation back to evidence; branch unsupported questions to
insufficient evidence. Reveal cues use actual provider word timestamps in scene
seconds. Intentional holds follow each main transformation.

## Sound and verification

Regenerate narration with cached Kokoro af_heart, English, speed1, 24kHz, and
provider-predicted word times. Scene tails add0.45 seconds, rounded at60fps.
An original 96 BPM pluck/pad/bass score builds curiosity, thins for indexing and
retrieval, lifts at the supported answer, leaves space for the limitation, and
resolves at the ending. Word-interval ducking and fades are baked in; renderer
gain1, fade times0. Active-speech RMS targets15dB below narration. No third-party
recordings or samples. Source checksums are in `assets/sources.json`.

`output/mix-measurements.json` records measured voice/music balance;
`output/qc.json` records frame, motion, caption and editorial evidence;
`output/automated-qc.json` records final decode and encoded loudness checks.
Direct listening, pronunciation by ear and physical phone/mono playback are
unavailable in this session and remain `not-performed`.

## Completed export

The current delivery is `output/rag-remade-4k60.mp4`, byte-identical to the
canonical `output/final.mp4` (SHA-256
`ce84ae776ead5b129f4b80db64439618bdfedabcfb21ea665457cfb6bdf13fe0`).
Automated final checks passed at 2160x3840, 60 fps, H.264/AAC, 55.1 seconds,
-16.18 LUFS and -1.26 dBTP. `output/final-4k-proof.png` is the native-resolution
frame review. These checks do not replace the unperformed listening checks.

## Reproduce

Use the documented Node24.21.0 environment, then from the workspace root:

```bash
HF_HUB_OFFLINE=1 .venv-kokoro/bin/python tools/kokoro/generate_audio.py --project projects/004-rag
.venv-kokoro/bin/python projects/004-rag/compose_music.py
npm run video -- preflight --project projects/004-rag
npm run video -- render --project projects/004-rag --preview
.venv-kokoro/bin/python projects/004-rag/inspect_preview.py
# Review the preview evidence before final export.
npm run video -- render --project projects/004-rag --final
```

For narration changes, run draft/approval first, then `video revise` to refresh
the existing production overlay. Chromium requires approved execution outside
this host's sandbox. Finalization refreshes the exact source archive only after
the export passes its checks. Guidance applied: short-video workflow, script,
production, visual design, Kokoro, Remotion creation/markup/layout, production
defaults, sound QC, file operations and runtime setup.
