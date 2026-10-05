# Lunar vs Solar Eclipses — Follow the Shadow

English vertical explainer with original planetary illustrations, moving shadow
diagrams, solar transit, a red-Moon sequence, tilted-orbit motion, narration,
word-by-word captions and an original curiosity-building score. The user requested fully
automated production; “sonar esclipse” was interpreted as “solar eclipse.”

## Deliverables

- `output/lunar-vs-solar-eclipses.mp4`: named final deliverable.
- `output/final.mp4`: canonical workflow output, with identical bytes.
- `output/captions.en.srt`: plain external captions; karaoke is burned into MP4.
- `output/contact-sheet.png`, `output/transit-karaoke-review.png`,
  `output/shadow-review.png`: visual-review evidence.
- `output/report.json`, `output/qc.json`, `render.snapshot.json`: checks and provenance.
- `src/`: exact renderer source archived with the final video.

## Reproduction

Use the existing Node 24.21.0 environment, Python 3.12 `.venv-kokoro`, FFmpeg and
cached Kokoro model. From the workspace root:

```bash
HF_HUB_OFFLINE=1 OMP_NUM_THREADS=4 .venv-kokoro/bin/python tools/kokoro/generate_audio.py --project projects/002-lunar-solar-eclipses
.venv-kokoro/bin/python projects/002-lunar-solar-eclipses/make_soundtrack.py
npm --prefix renderer run lint
npm run video -- render --project projects/002-lunar-solar-eclipses --preview
npm run video -- render --project projects/002-lunar-solar-eclipses --final
```

`meta.renderer: "eclipses"` selects the eclipse scenes. The shared renderer also
retains the Kubernetes scene implementation. `prepare_project.py` is the initial
content-authoring record: rerunning it would overwrite approved script data, so
do not rerun it merely to reproduce a render.

## Background sound revision

The revised `make_soundtrack.py` creates a 48 kHz stereo score at 86 BPM: a
plucked curiosity motif over evolving pads and a soft pulse, tonal swells into
the corona (15.70 s) and copper Moon (32.87 s), a brief dip at the next question,
and a warmer recap (43.60 s). These are editorial music cues, not sounds of space.
The earlier low, static ambient track and MP4 are preserved under
`output/before-background-revision/`.

The generator uses existing voice word timestamps to duck music to 60% during
speech, with a 60 ms lead and 200 ms release. It calibrates speech-active music
RMS to 14 dB below narration before final loudness normalization. Fades are baked
into the WAV (0.18 s in, 1.1 s out). The eclipse renderer reads the music file and
gain from `video.json`, avoiding a second fade on top of the generated one.
The approved narration, captions and visual timeline are unchanged.

After the final render, refresh the named copy:

```bash
cp projects/002-lunar-solar-eclipses/output/final.mp4 projects/002-lunar-solar-eclipses/output/lunar-vs-solar-eclipses.mp4
```

Track settings, cue times, generator/audio checksums and stem measurements are in
`assets/audio-manifest.json`; final mix measurements are in `output/qc.json`.
Automated level/decoding checks do not replace a phone-speaker listening review.

Revision guidance read: local `short-video-production`, `remotion-best-practices`,
`remotion-markup` (including `audio.md`) and `remotion-render`; installed
`core_reasoning_and_context`, `core_file_operations`, `core_code_quality`,
`devops_env_setup` and `docs_technical_documentation`. Kept the installed Remotion
Audio component and dependencies. Validation uses the generator, renderer
ESLint/TypeScript, workflow preview/final exports and FFmpeg media checks.

## Sources, assumptions and review

Sources are NASA's [Moon and eclipses](https://science.nasa.gov/moon/eclipses/),
[eclipse geometry](https://science.nasa.gov/eclipses/geometry/), and
[viewing safety](https://science.nasa.gov/eclipses/safety/) guides. Exact claim
mappings are in `research.json`. No external imagery or stock audio is used;
source/license records are in `assets/sources.json` and `assets/audio-manifest.json`.

The planetary sizes, distances and times are schematic; the orbital tilt is
exaggerated. The copper Moon depicts total lunar eclipse. The corona scene is an
illustration of total solar eclipse, not a live camera view. There is no claim
about when or where the next eclipse will be visible.

The shared Kokoro generator supplies predicted word timestamps. Render preflight
checks spoken-text coverage and timing bounds. Motion and caption frame sequences
were inspected at phone scale, including the solar transit, changing lunar color,
shadow alignments and a later narration scene. These checks are not an independent
human listening or forced-alignment audit.

Applied the local short-video workflow, discovery, script, production, visual
design and Kokoro skills, the shared production defaults and Remotion markup,
caption and rendering guidance already read in this conversation. No new
dependencies, external accounts or publishing actions were required.
