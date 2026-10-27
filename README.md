# Short Video Research

A local workspace for researching, scripting, and producing short educational
videos with AI-assisted workflows, Remotion animations, and Kokoro narration.
The default style is English narration, word-timed karaoke captions, meaningful
motion, and audible background music chosen to support the story's emotion.
New videos default to vertical 4K (2160×3840) at 60 fps. Review previews use
1080×1920 at the same frame rate; explicit project settings override the defaults.

This is a working research pipeline, not a one-command prompt-to-video service.
Research, direction selection, script approval, visual implementation, and
listening review still require an agent or a person. The CLI manages project
state, validation, rendering, and artifact freshness; it does not call an LLM or
publish videos.

## What is included

- A three-phase workflow: discover → script → produce.
- An empty project workspace ready for new topics.
- A shared React/Remotion shell and reusable caption/audio components.
- Local narration generation that reuses verified, unchanged scene audio.
- Production-only revisions for music, SFX, and captions without reapproving an
  unchanged script.
- Preview/final checks for stale inputs, captions, decoding, media format,
  duration, loudness, and true peak. Emotional fit and visual quality still need
  human review.

Generated output folders, render logs, local environments, and raw benchmark
workspaces are excluded from Git.
No example project or generated media is bundled. New projects own their scripts,
asset provenance, manifests, and renderer checksums.

## Quick start

Run commands from the repository root. Prerequisites:

| Component | Needed for |
| --- | --- |
| Node.js 20+ and npm | Workflow CLI and renderer; the local setup was exercised with Node 24.21.0 |
| FFmpeg and ffprobe on `PATH` | Media checks and audio normalization |
| Python 3.12 and a local virtual environment | Kokoro narration; see the setup reference for dependencies |
| Network access on initial setup | npm packages, Kokoro model/voice downloads, and Remotion's browser download when needed |

The current local narration and procedural-visual path requires no paid API
key. An AI assistant used for research or coding has its own provider setup.

```bash
node --version
ffmpeg -version
ffprobe -version
npm --prefix renderer ci
npm run video -- help
npm run video -- discover --prompt "Explain a technical topic"
```

For narration, follow the [Kokoro environment setup](.agent/skills/kokoro-tts/references/setup.md).
The shared generator expects `.venv-kokoro/bin/python` in the commands below.
Initial model downloads require network access; subsequent generation can reuse
the local model cache.

Mascot tooling belongs in [tools/mascot/](tools/mascot/README.md). The
[Wan2.2-S2V rental workflow](tools/mascot/wan-s2v/README.md) prepares a portable
10-second job with SSH key reuse, parallel setup and result-only retrieval.
Actual RTX 3090 inference remains to be verified. Reference portraits stay in
`assets/presenters/`; narration and rendering work independently of mascot tools.

Start a new project:

```bash
npm run video -- discover --prompt "Explain a technical topic"
```

The CLI allocates a `projects/NNN-topic/` directory. Fill its research and
direction artifacts, select a direction, then draft and approve its script.
Follow the [workflow skill](.agent/skills/short-video-workflow/SKILL.md) and
[phase commands](docs/REMOTION_PROJECT_SETUP.md) for those steps. New topics also
own their composition in `projects/NNN-topic/renderer/` and declare its entry,
composition ID and supported scene IDs in project `render.json`. See the
[renderer contract](docs/PROJECT_RENDERER.md); no shared registry needs editing.

New requests record the shared format from `renderer/src/video-format.json`.
`script --draft` fills missing `video.meta.width`, `height` and `fps` from those
defaults before approval. Set those fields explicitly for a different format;
existing approved videos are not automatically converted.

Once a project's script is approved, its composition is implemented, and its
music/SFX assets are prepared, replace `projects/NNN-topic` below with its path:

```bash
.venv-kokoro/bin/python tools/audio-kokoro/generate_audio.py --project projects/NNN-topic
npm run video -- preflight --project projects/NNN-topic
npm run video -- render --project projects/NNN-topic --preview
# Review the preview, including listening and visual checks, before final export.
npm run video -- render --project projects/NNN-topic --final
```

Final export requires a preview matching the current inputs. The review video
and contact sheet live temporarily in `.cache/review/` and are removed after a
successful final export. Each project keeps one delivered video at
`output/video/final.mp4`; reports,
QC records, and `render.snapshot.json` are in `output/docs/`. Record
editorial/listening evidence separately in `output/docs/qc.json`. Successful
final rendering updates the project's render snapshot with the shared renderer
checksum.

For the included example, first regenerate missing narration and music from
their source records and generators; do not expect a fresh clone to render from
the retained manifests alone. Regeneration can change hashes or timings, so
always make and review a fresh preview.

## Revisions and configuration

| File | Purpose |
| --- | --- |
| `request.json`, `research.json`, `directions.json` | Topic, factual sources, and proposed directions |
| `script.md`, `video.json` | Readable script and approved scene/audio/visual configuration |
| `production.json` | Optional music, SFX, and caption overrides layered over `video.json` |
| `output/voice/` | Generated scene and assembled narration WAVs |
| `output/docs/voice-manifest.json` | Generated scene timing, caption data, and audio checksums |
| `state.json` | Workflow progress and recorded versions |
| `assets/sources.json` | Asset sources and licensing records |
| `output/docs/render.snapshot.json` | Input, renderer, dependency, and final-video checksums from the latest successful final render |

For a sound or caption correction, run `npm run video -- revise --project
projects/NNN-topic`, edit `production.json`, then preflight and render a fresh
preview/final. Narration changes go through script draft and approval before
regeneration. The narration generator reuses valid unchanged scenes; `--force`
requests full regeneration. Do not manually patch approval hashes.

See [artifact contracts](.agent/skills/short-video-workflow/references/artifact-contracts.md)
for supported overrides and invalidation. Nonempty storyboard overrides are not
implemented; change the relevant composition for visual revisions.

## Repository map

| Path | Contents |
| --- | --- |
| `.agent/skills/` | First-party workflow, visual-design, and narration skills |
| `projects/` | Per-video research, scripts, configuration, provenance, and outputs |
| `renderer/` | Shared Remotion application and npm lockfile |
| `tools/audio-kokoro/` | Narration, caption timing, voice assembly, music, audio library, and Python tests |
| `tools/render/` | Workflow CLI, renderer integration, QC, validation, and JavaScript tests |
| `tools/mascot/` | Wan S2V remote generation and shared SSH/result transport |
| `audio-library/` | Curated catalog, attribution records, and audition guides; audio files are local |
| `docs/` | Setup, production defaults, workflow design, and benchmark summary |

The exact imported Remotion skills are included under `.agent/skills/remotion-*`
so a clone preserves the instructions used by this workflow. Keep these upstream
files unchanged. `.agent/skills-lock.json` records their source paths and content
hashes, but does not pin an upstream commit or grant a redistribution license.

The [upstream installer](https://github.com/remotion-dev/skills)
(`npx skills add remotion-dev/skills`) remains an option for deliberate updates;
running it against the current upstream is not an exact restoration of this
snapshot. Review version changes before replacing the bundled packages.

## Validation and development

```bash
npm run test:video
npm --prefix renderer run lint
.venv-kokoro/bin/python -m unittest discover -s tools/audio-kokoro -p 'test_*.py' -v
```

Edit shared implementation in `tools/` and `renderer/src/`. Project-specific scenes and entry points belong in each project’s `renderer/`. Follow [AGENTS.md](AGENTS.md), keep changes
scoped, and run the relevant checks above. A technical QC pass does not certify
the video's factual accuracy, rights clearance, or emotional impact.

Further reading:

- [Production defaults](docs/VIDEO_PRODUCTION_DEFAULTS.md)
- [Sound QC](docs/VIDEO_SOUND_QC.md)
- [Workflow design](docs/VIDEO_WORKFLOW_BLUEPRINT.md)
- [Hybrid 2D/3D production guide](docs/HYBRID_3D_VIDEO_GUIDE.md)
- [Implementation map](docs/VIDEO_WORKFLOW_IMPLEMENTATION_PLAN.md)
- [Benchmark results and limitations](docs/WORKFLOW_BENCHMARK.md) — raw evaluation workspaces remain local.
- [Audio library and attribution](audio-library/README.md)

## Licensing and public distribution

No repository-wide license has been selected. `renderer/package.json` currently
declares `UNLICENSED`; public visibility alone does not grant an open-source
reuse license. Third-party dependencies and assets retain their own terms.

- Remotion 4.0.532 uses the [Remotion License](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md),
  with eligibility rules for free use. A future license for this repository's
  own code will not replace those terms.
- The bundled Remotion skills retain their upstream provenance. Their public
  redistribution terms remain unresolved; including them in local Git does not
  establish permission to republish or relicense them. Clarify those terms before
  a public push that includes these files.
- The curated Incompetech tracks have [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
  records under `audio-library/licenses/`. Preserve attribution and document
  applicable changes when distributing downloaded tracks or videos using them.
- [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) identifies its model
  license as Apache-2.0. Model licensing is distinct from the provenance and
  rights of generated narration; retain the voice and text records.
- Procedural music has generator/provenance records in each project's `assets/`.
  Those records describe origin, not a blanket license for the repository.

The root `.gitignore` keeps local media, environments, and
execution artifacts out of ordinary Git additions. Review the exact staged
files and resolve licensing before publishing; ignore rules are not a secret
scanner or a license grant.
