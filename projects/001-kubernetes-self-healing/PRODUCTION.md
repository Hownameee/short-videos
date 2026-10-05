# Kubernetes: One Pod disappears. Who brings it back?

English short for junior developers. Native schematic animation, English Kokoro
voice, timed English captions, procedural music and a recovery chime. This is an
illustration of a deleted managed Pod, not a recording of a running cluster.

The user delegated editorial decisions and final production, then clarified that
only English is supported. The first bilingual draft was invalidated; the reason
and superseded script checksum are retained in `state.json`. No bilingual media
was generated. `revise_english.py` is the historical one-time migration and should
not be rerun on the current approved project.

## Outputs

- `output/final.mp4`: latest 1080×1920, 30 fps, H.264/AAC.
- `output/kubernetes-motion-karaoke.mp4`: named copy of the latest animated revision.
- `output/final-v1.mp4`: preserved original before the motion/karaoke revision.
- `output/preview.mp4` and `output/contact-sheet.png`: review copies.
- `output/captions.en.srt`: optional external captions (captions are also burned in).
- `output/report.json`, `output/qc.json`, `render.snapshot.json`: technical evidence.
- `src/`: exact renderer source archived by the final-render workflow.

## Reproduce

Run from the workspace root using the existing Node 24.21.0 environment and
Python 3.12 `.venv-kokoro`. FFmpeg and ffprobe must be on PATH. The model is cached.

```bash
HF_HUB_OFFLINE=1 TOKENIZERS_PARALLELISM=false .venv-kokoro/bin/python projects/001-kubernetes-self-healing/generate_voice.py
.venv-kokoro/bin/python projects/001-kubernetes-self-healing/refine_captions.py
.venv-kokoro/bin/python tools/audio/generate_soundtrack.py --project projects/001-kubernetes-self-healing --duration 90
npm --prefix renderer run lint
node projects/001-kubernetes-self-healing/check-karaoke.mjs
npm run video -- render --project projects/001-kubernetes-self-healing --preview
npm run video -- render --project projects/001-kubernetes-self-healing --final
```

The shared renderer must still contain this project's scene implementation.
Chromium needs permission to launch; the macOS sandbox rejected Mach-port access
in the first attempt. Rendering succeeded after permission to run outside it.
The workflow normalizes final audio to a -16 LUFS target and -1.5 dBTP ceiling.

## Evidence and review

Claims were checked against official Kubernetes Deployment, Service and
self-healing documentation; URLs and claim mappings are in `research.json`.
Visuals are original React/SVG, soundtrack and SFX come from the repository's
procedural generator, and narration uses the cached Kokoro model. Provenance is
in `assets/sources.json` and `assets/audio-manifest.json`.

Reviewed the rendered contact sheet and extra frames at 20s (missing replica)
and 39.5s (ready replacement receives traffic). Fixed orphan punctuation in
captions and an orphan title word, then rendered and reviewed another preview.
Caption text coverage matches the complete narration; timing comes from Kokoro's
predicted word timestamps. Those timestamps are synthesized alignment, not an
independent speech-recognition transcript. No human listening test was performed.

Skills read: core_reasoning_and_context, core_file_operations, devops_env_setup,
docs_technical_documentation; local short-video-workflow, short-video-discovery,
short-video-script, short-video-production, short-video-visual-design, kokoro-tts,
remotion-best-practices, remotion-create reference, remotion-markup,
remotion-render and remotion-captions, with focused layout/composition/caption
and visual-review references. The existing runtime and dependencies were reused.

## Motion and karaoke revision

The user requested visible animation and a highlight that follows each spoken
word. Narration and script are unchanged; the existing measured word timestamps
drive the revised renderer. `renderer/src/karaoke.ts` attaches punctuation to
words and resolves the active word over a half-open time interval. The current
word receives a bright lime background; completed and upcoming words remain
readable. The SRT file is plain subtitles and does not encode karaoke styling;
the MP4 includes the highlights.

Motion includes spring entrances for titles, diagrams and staggered Pods;
deletion fragments and a shock ring; controller scan and animated paths;
replacement spin/progress; packets that follow Service paths; staged limit
rows; and an animated reconciliation recap. All movement derives from the
Remotion frame clock, with no CSS animations or transitions.

Verification: `check-karaoke.mjs` checks all 133 spoken words, phrase coverage,
and start/mid/end highlighting boundaries. Rendered frames at 0.50, 0.70 and
1.00 seconds visibly highlight Delete, one and Pod respectively. Additional
frame sequences cover deletion, replacement, scheduler/kubelet progress and
Service traffic. Review sheets are `output/karaoke-motion-review.png` and
`output/recovery-motion-review.png`. Integrated scene review uses the new
contact sheet. Final revision evidence is in `output/qc-v2.json`.
