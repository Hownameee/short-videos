# Short-video workspace guidance

Apply this guidance throughout this workspace. Direct user instructions override
project defaults; preserve unrelated changes.

## Video workflow routing

For a new video or an unclear phase, read
[short-video-workflow](.agent/skills/short-video-workflow/SKILL.md), then the phase
skill it selects. For a clear existing-video production correction, go directly
to production below. These repository-local skills must be read by path even when
they are absent from the host's installed-skill list.

For a selected or approved direction involving real 3D, hybrid 2D/3D,
Three.js/R3F, GLB/glTF, or Blender passes, also read
[short-video-hybrid-3d](.agent/skills/short-video-hybrid-3d/SKILL.md). It is a
production specialization and does not replace the normal phase gates.

For an existing video's background sound, music, mood, mix or export correction,
read [short-video-production](.agent/skills/short-video-production/SKILL.md) and
the [production defaults](docs/VIDEO_PRODUCTION_DEFAULTS.md) before editing.
Carry forward English, karaoke, meaningful motion and audible, purposeful
background sound unless the user overrides them. A file or audio stream alone
does not prove the background is audible or fits the intended emotion.
Read each canonical document once per task; load references only when its phase
skill calls for them. Runtime setup and historical validation are not routine
production prerequisites.
Treat `.agent/skills/*-workspace/` as evaluation archives; exclude them from
routine skill discovery and document scans unless investigating a benchmark.

## Source and verification

- Keep topic scenes, render.json, assets and outputs under `projects/NNN-topic/`.
  `renderer/src/` contains reusable components only; `tools/` and skills must not
  hardcode a project. See [renderer contract](docs/PROJECT_RENDERER.md).
  Final snapshots fingerprint both shared and project renderer sources.
- Use the [existing commands](renderer/README.md). Run `npm run test:video` for
  workflow changes and `npm --prefix renderer run lint` for renderer changes.
- Record mix evidence and listening limitations as required by production
  defaults. Do not report an unperformed listening check as passed.
- Keep imported `.agent/skills/remotion-*` packages unchanged. Local editorial
  requirements belong in the first-party workflow skills and shared docs.
