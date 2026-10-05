# Shared Remotion renderer

This is the workspace's single Remotion application. Video-specific research,
scripts, assets, narration, outputs, and final source snapshots belong under
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

`video.meta.renderer: "eclipses"` selects `EclipseVideo.tsx` for
`../projects/002-lunar-solar-eclipses/`. The Kubernetes composition remains
available through the existing default route. Both use the shared karaoke component.

For future videos, reuse `src/KaraokeCaptions.tsx` and the shared
`../tools/kokoro/generate_audio.py` generator. Apply
[production defaults](../docs/VIDEO_PRODUCTION_DEFAULTS.md) for word timing,
scene motion and review. Final project `src/` snapshots remain immutable evidence
of their rendered MP4; shared renderer changes for future work do not update
those snapshots until that project is rendered again.
`production.json` overrides music/SFX and caption mode without changing script
approval. Nonempty `storyboard.json` overrides are rejected: these topic
compositions do not implement them. New topics need a new composition.

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

The CLI stages `assets/` and `voice/` under `public/workflow/`, rejects a stale
voice manifest, and normalizes the rendered audio to -16 LUFS / -1.5 dBTP.
Final requires a preview fingerprint matching current script, production config,
voice, assets, renderer, lockfile and workflow code. It validates expected duration,
full decode, H.264/AAC and encoded loudness/true peak. Contact sheets cover every
scene plus opening/ending. Automated evidence is in `output/automated-qc.json`;
editorial/listening evidence remains separate in `output/qc.json`.

For a music/caption correction, run `npm run video -- revise --project …`, edit
`production.json`, then preflight and render preview/final. The voice generator
reuses valid unchanged scenes; `--force` requests full regeneration.

Workflow checks from workspace root:

```bash
npm run test:video
.venv-kokoro/bin/python -m unittest discover -s tools/kokoro -p 'test_*.py' -v
npm --prefix renderer run lint
```

After final media validation, the CLI copies this renderer's exact `src/` into
the project and records source/input/lockfile/MP4 checksums in
`render.snapshot.json`.
