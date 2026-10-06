# Workflow implementation map

The repository implements a resumable local CLI and topic-specific compositions.
Discovery research, scriptwriting, new scenes/assets, editorial QC and publishing
are not automated. Read this file for code changes, not every production task.

| Responsibility | Source |
| --- | --- |
| Commands and render orchestration | tools/video-cli.mjs |
| State, approval, media staging, fingerprints and atomic finalization | tools/video-workflow.mjs |
| Production overlay, supported config and timeline | tools/production-config.mjs |
| Caption order, coverage and timing validation | tools/caption-validation.mjs |
| Full decode and audio measurements | tools/media-qc.mjs |
| Selective narration and transactional voice replacement | tools/kokoro/generate_audio.py |
| Caption grouping | tools/kokoro/captions.py |
| Topic dispatch, music and caption modes | renderer/src/ |
| Shared new-video format (2160×3840, 60 fps) | renderer/src/video-format.json |

## Revision contract

Keep the existing approval checksum algorithm for compatibility. The approved
script.md/video.json pair remains immutable during production-only corrections.
Optional production.json binds to scriptVersion and permits only music/SFX,
caption mode and sound notes. It cannot override narration, voice or scenes.

Script drafts are allowed from produced/production_requested states and preserve
old outputs while invalidating approval/render. Approval is a user gate.
Refreshing production.json after approval explicitly rebinds existing overrides.

## Invalidation and QC

Preflight resolves the overlay, rejects unsupported renderer/config/storyboard,
checks safe local assets, voice checksum/duration/caption data and music signal/
length. Fingerprints cover approved data, overlay, storyboard, voice, assets,
renderer source/configuration, dependency lockfile and render-workflow code.
Tests, documentation and unrelated helper edits do not invalidate previews.

Final requires a matching preview and unchanged preview/contact-sheet bytes.
Changes during rendering also abort installation. Final duration must match the
voice-driven frame timeline; H.264/AAC, dimensions/FPS, full decode, final LUFS
and true peak are checked. Contact sheets cover opening/every scene/ending.
Reports and snapshots retain input checksums; automated QC never overwrites
editorial listening evidence. A transaction replaces output/source/state together.

The voice cache validates per-scene content and configuration plus generator code,
WAV integrity and timing coverage. Changed scenes regenerate; no-op runs preserve
manifest bytes. Failures before the directory swap retain all previous narration.
Locally replaced weights under an unchanged model name require --force.
Concurrent generation/rendering for one project is unsupported.

## Remaining boundaries

Native diagrams are topic-specific; neither storyboard files nor generic scene
JSON implement arbitrary new videos. Missing music fails unless explicitly null;
record the reason as editorial evidence. Gross silence checks do not establish
audibility under speech. No automatic rights verification, factual review, visual
quality or emotional-fit judgment is claimed.

[Setup/CLI](REMOTION_PROJECT_SETUP.md) owns commands;
[contracts](../.agent/skills/short-video-workflow/references/artifact-contracts.md)
own artifact shapes; [defaults](VIDEO_PRODUCTION_DEFAULTS.md) own editorial policy.
[Benchmark](WORKFLOW_BENCHMARK.md) records measured results and limitations.

```bash
npm run test:video
.venv-kokoro/bin/python -m unittest discover -s tools/kokoro -p 'test_*.py' -v
npm --prefix renderer run lint
```
