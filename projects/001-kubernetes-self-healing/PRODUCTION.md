# Kubernetes: One Pod disappears. Who brings it back?

English short for junior developers. Native schematic animation, English Kokoro
voice, timed English captions, procedural music and a recovery chime. This is an
illustration of a deleted managed Pod, not a recording of a running cluster.

The user delegated editorial decisions and final production, then clarified that
only English is supported. The first bilingual draft was invalidated; the reason
and superseded script checksum are retained in `state.json`. No bilingual media
was generated.

## Outputs

- `output/video/final.mp4`: latest 1080×1920, 30 fps, H.264/AAC.
- Review preview and contact sheet: removed after final export.
- `output/docs/captions.en.srt`: optional external captions (captions are also burned in).
- `output/voice/full.wav`: one PCM narration track assembled from the seven scene WAVs.
- `output/docs/voice-manifest.json`: scene timing, caption data and WAV checksums.
- `output/docs/audio-timeline.json`: frame-aligned scene starts, voice lengths, and pauses.
- `output/docs/report.json`, `output/docs/qc.json`, `output/docs/render.snapshot.json`:
  production evidence; the snapshot records the shared renderer source checksum.
- `output/mascot/mascot.mp4`, `mascot-transparent-bg.webm`, and
  `output/video/final-mascot.mp4`: current six-second mascot continuation demo outputs.

## Reproduce

Run from the workspace root using the existing Node 24.21.0 environment and
Python 3.12 `.venv-kokoro`. FFmpeg and ffprobe must be on PATH. The model is cached.

```bash
.venv-kokoro/bin/python tools/kokoro/generate_audio.py --project projects/001-kubernetes-self-healing
python3 tools/audio/assemble_voice.py --project projects/001-kubernetes-self-healing --pause 0.5
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

The combined narration is a 24 kHz mono PCM WAV. Each scene starts on a video
frame boundary; source audio is padded to the next frame, then followed by 15
silent frames (0.5 s at 30 fps), including the final scene. The timeline lists
the exact frame and second offsets. Remotion plays `output/voice/full.wav` once at frame
zero, uses the timeline for visual scene lengths, and keeps scene-local word
timestamps from `output/docs/voice-manifest.json` for karaoke. Music and the recovery chime
remain separate tracks. Reassemble after changing any scene WAV or its manifest.

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
Service traffic. Review sheets and the contact sheet were inspected during
production and later removed. Current final evidence is in `output/docs/qc.json`.

## Single-track narration pilot

The current final uses the combined narration and 0.5-second scene pauses above.
It has 1,711 frames at 30 fps (57.03 seconds of video). The seven source WAVs
match the combined track sample for sample, and the inserted frame alignment and
pause samples are silent. `output/docs/qc.json` records the current final's
checksum, automated media checks, contact-sheet review and karaoke frame checks.
Human listening and physical phone playback have not been performed.

## Mascot demo

The [shared EchoMimic flow](../../tools/mascot-echomimic/README.md) generated
the first three seconds from the presenter PNG and `output/voice/full.wav`.
For this continuation experiment, the final RGB frame at 2.96 seconds became
the image input for another 3.08-second EchoMimic generation, with audio starting
at 2.96 seconds. MatAnyone2 used the final transparent frame as its seed.
FFmpeg joined the first 75 frames to frames 1–75 of the new clip, skipping its
duplicate conditioning frame 0. The same trim was applied to the transparent
VP9 WebM. FFmpeg overlays the joined mascot at the lower right of the first six
seconds of `final.mp4`; the composite keeps that video's audio.
`video.json` declares a 260×456 presenter region at (790, 1210) on the
1080×1920 canvas. Remotion narrows captions, progress and source text to the
left of that region; FFmpeg reads the same placement when compositing.
The demo has 150 mascot frames at 25 fps and 180 composite frames at 30 fps.
`output/docs/mascot-integration.json` records the prompt, source paths, and
placement. The rendered demo was decoded and its alpha channel was checked.
Junction frames were inspected; a slight facial change is visible between the
last frame of the first segment and the first retained frame of the second.
The current `full_audio.py` uses the original presenter for each chunk, so its
full run does not automatically repeat this last-frame continuation method.
Human lip-sync, continuous-motion, and listening review remain to be done.
