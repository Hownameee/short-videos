# Shared Remotion renderer

This is the workspace's single Remotion application. Video-specific research,
scripts, assets, narration, outputs, and render snapshots belong under
`../projects/<nnn>-<slug>/`.

The composition is `ShortVideo`. The workflow CLI passes parsed `video.json`, a
scene-level Kokoro manifest, staged media paths, and preview/final mode. Metadata
derives the canvas, FPS, and duration from those inputs. The current composition
renders the English Kubernetes explainer in
`../projects/001-kubernetes-self-healing/` with native animated diagrams,
word-timed karaoke captions, narration, and a procedural soundtrack. Pods enter
with spring motion, deletion emits fragments, controller paths scan continuously,
and Service paths carry animated packets. Render this project
through the workflow CLI so its video data and voice manifest are supplied.

New projects and Studio's empty composition default to **2160×3840 at 60 fps**,
defined once in [`src/video-format.json`](src/video-format.json). Explicit project
metadata takes precedence. The workflow fills missing format fields when a
script draft is recorded, before approval. A default review preview is 1080×1920
at 60 fps; final rendering uses the full canvas.

`Composition.tsx` scales the Kubernetes 1080×1920 design canvas uniformly to
the output size. New topics need their own renderer route and target-resolution
layout. Use configured fps for timelines and seconds for animation speeds;
project audio generators must follow the same frame-rounded scene boundaries.
`video.meta.renderer: "kubernetes"` is the only current route; omission retains
that default for the existing project.

For future videos, reuse `src/KaraokeCaptions.tsx` and the shared
`../tools/kokoro/generate_audio.py` generator. Apply
[production defaults](../docs/VIDEO_PRODUCTION_DEFAULTS.md) for word timing,
scene motion and review. Each final render records a checksum of the shared
renderer source; the current source may differ from the version used for an
earlier MP4.
`production.json` overrides music/SFX and caption mode without changing script
approval. Nonempty `storyboard.json` overrides are rejected: the Kubernetes
composition does not implement them. New topics need a new composition.

## Run locally

```bash
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
. "$NVM_DIR/nvm.sh"
nvm use 24.21.0

npm install --loglevel=error
npm run dev
```

## Validate

```bash
npm run lint
npm run build
```

## Render

Use the workspace CLI from the parent directory; a direct render without project
props only loads empty defaults:

```bash
cd ..
npm run video -- preflight --project projects/001-kubernetes-self-healing
npm run video -- render --project projects/001-kubernetes-self-healing --preview
npm run video -- render --project projects/001-kubernetes-self-healing --final
```

The CLI stages `assets/` and `output/voice/` under `public/workflow/`, rejects a stale
voice manifest, and normalizes the rendered audio to -16 LUFS / -1.5 dBTP.
Project 001 also uses `output/voice/full.wav` as a single narration track and
`output/docs/audio-timeline.json` for frame-aligned scene and pause lengths.
After changing its scene WAVs, regenerate both from the workspace root:

```bash
python3 tools/audio/assemble_voice.py --project projects/001-kubernetes-self-healing --pause 0.5
```

Final requires a preview fingerprint matching current script, production config,
voice, assets, renderer, lockfile and workflow code. It validates expected duration,
full decode, H.264/AAC and encoded loudness/true peak. Contact sheets cover every
scene plus opening/ending. The preview and contact sheet are temporary files in
`.cache/review/` and are removed after a successful final export. Final media is
in `output/video/`; automated evidence is in `output/docs/automated-qc.json`,
and editorial/listening evidence remains in `output/docs/qc.json`.

For a music/caption correction, run `npm run video -- revise --project …`, edit
`production.json`, then preflight and render preview/final. The voice generator
reuses valid unchanged scenes; `--force` requests full regeneration.

Workflow checks from workspace root:

```bash
npm run test:video
.venv-kokoro/bin/python -m unittest discover -s tools/kokoro -p 'test_*.py' -v
npm --prefix renderer run lint
```

After final media validation, the CLI records the shared `renderer/src/`
checksum, plus input, lockfile, and MP4 checksums, in
`output/docs/render.snapshot.json`.
