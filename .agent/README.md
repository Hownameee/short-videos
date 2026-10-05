# Shared video workflow skills

This directory contains repository-level skills shared by every video project
under `short-video-research/`.

## Workflow skills

| Skill                       | Role                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `short-video-workflow`      | Route work through Discover, Script, and Produce without skipping user review gates |
| `short-video-discovery`     | Research a prompt and present 2–4 evidence-backed video directions                  |
| `short-video-script`        | Turn an approved direction into a readable script and machine-ready scene plan      |
| `short-video-production`    | Generate media, render, run QC, and archive the final renderer source               |
| `short-video-visual-design` | Define and review art direction, video UI, typography, layout, and motion            |
| `kokoro-tts`                | Set up and use Kokoro safely for scene-level narration                              |

The workflow skills treat [`../docs/VIDEO_WORKFLOW_BLUEPRINT.md`](../docs/VIDEO_WORKFLOW_BLUEPRINT.md)
and [`../docs/VIDEO_WORKFLOW_IMPLEMENTATION_PLAN.md`](../docs/VIDEO_WORKFLOW_IMPLEMENTATION_PLAN.md)
as the canonical product and implementation guidance.

New projects use [production defaults](../docs/VIDEO_PRODUCTION_DEFAULTS.md):
English output, meaningful scene animation, measured word-by-word karaoke, and
audible background music with an intentional emotional arc and audio QC evidence.
The root [AGENTS.md](../AGENTS.md) routes video work to these local skills even
when they are not listed in a host's installed-skill catalog.
Use the shared Kokoro generator and caption component instead of project-local
copies. Imported Remotion skills remain unchanged; these local defaults add
editorial requirements and rendered motion/highlight checks.

## Imported Remotion skills

The `remotion-*` directories are included unchanged from `remotion-dev/skills`
to preserve the exact local skill snapshot. Their upstream source paths and
content hashes remain recorded in `skills-lock.json`; that file does not pin an
upstream commit. A fresh install from the [upstream repository](https://github.com/remotion-dev/skills)
may therefore differ from the bundled files.

Update or replace them from upstream as a unit; do not mix local workflow rules
into those imported directories. Public redistribution terms still need
clarification before publishing these files. Neither local Git inclusion nor
the provenance lockfile grants a redistribution license.
