# Shared renderer and Kokoro setup

Each `projects/NNN-topic/` contains content and media. The workspace shares
`renderer/`, its dependency tree and `.venv-kokoro/`. Projects do not copy
renderer source; their final render snapshots record its checksum.

Prerequisites: Node >=20, npm, FFmpeg/ffprobe; Python/Kokoro only for narration.
This checkout uses Node 24.21.0 and Remotion 4.0.532. Reuse installed runtimes;
do not install or change global defaults merely to run a script.

```bash
# If this checkout uses the existing NVM installation:
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
. "$NVM_DIR/nvm.sh"
nvm use 24.21.0
npm --prefix renderer ci
```

Run installation only when dependencies are missing and installation is authorized.
If npm rejects legacy global `_auth` configuration, use
`npm --userconfig=/dev/null ...` for these local commands; do not print credentials
or rewrite the user's global npm configuration.

## Commands from workspace root

```bash
npm run video -- discover --prompt "Explain a topic"
# Fill research.md, research.json and directions.json in the allocated project.
npm run video -- discover --project projects/NNN-topic --complete
npm run video -- script --project projects/NNN-topic --direction 1
# Write script.md/video.json, then record the draft and obtain approval.
npm run video -- script --project projects/NNN-topic --draft
npm run video -- script --project projects/NNN-topic --approve
# On a production request:
.venv-kokoro/bin/python tools/audio-kokoro/generate_audio.py --project projects/NNN-topic
npm run video -- preflight --project projects/NNN-topic
npm run video -- render --project projects/NNN-topic --preview
npm run video -- render --project projects/NNN-topic --final
```

Research, scriptwriting, asset preparation and new scene implementation remain
agent/user tasks. Kokoro produces narration, not music or visuals. The renderer
has an empty shared Studio shell. Implement a project-owned composition and
`render.json` using the [renderer contract](PROJECT_RENDERER.md). Preflight
rejects missing manifests and unsupported scene IDs.

New projects default to **2160×3840 at 60 fps**, from
[`renderer/src/video-format.json`](../renderer/src/video-format.json).
`discover` records those settings in `request.json.productionDefaults`;
`script --draft` fills missing `video.meta.width`, `height` and `fps` before
hashing the script. Explicit project values override defaults. Existing approved
projects keep their own settings until explicitly revised and reapproved.

For an existing music/caption correction, run `video revise --project …`, edit
`production.json`, then preflight and preview/final. Narration edits go through
draft and approval; never manually patch hashes.
[Artifact contracts](../.agent/skills/short-video-workflow/references/artifact-contracts.md)
describe the supported overlay and invalidation.

## Outputs and checks

Preview uses scale 0.5/CRF 28 and samples opening, every scene and ending:
1080×1920 at 60 fps for the default 4K60 project, retaining the final's timeline.
Final uses CRF 18, requires a current preview fingerprint, and checks expected
duration, dimensions/FPS, H.264/AAC, full decode and encoded audio measurements.
Normalization targets -16 LUFS / -1.5 dBTP. Reports include audio/asset/input hashes.
Editorial listening, visual review and rights still require evidence.

The CLI atomically installs final, report, automated QC, snapshot
and state after validation. A failed replacement preserves the prior deliverable.
Nonempty storyboard overrides are unsupported; edit the topic renderer for visuals.

See [renderer commands](../renderer/README.md), [defaults](VIDEO_PRODUCTION_DEFAULTS.md)
and [implementation map](VIDEO_WORKFLOW_IMPLEMENTATION_PLAN.md).
