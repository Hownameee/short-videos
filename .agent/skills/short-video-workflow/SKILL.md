---
name: short-video-workflow
description: Coordinate prompt-to-short-video discovery, scripting and production. Resume existing projects and route soundtrack or mix corrections directly to production. Preserve direction choice and script approval; exclude general audio advice.
compatibility: Repository-local; phase skills live beside this package.
---

# Short video workflow

Inspect the request and existing project state, then read only the needed phase:

| Request / state | Read |
| --- | --- |
| New topic, research or directions | [Discovery](../short-video-discovery/SKILL.md) |
| Chosen direction, script draft or narration revision | [Script](../short-video-script/SKILL.md) |
| Approved preview/final, existing sound, caption or export correction | [Production](../short-video-production/SKILL.md) |

Reuse an existing project; new workflows allocate `projects/NNN-topic/` through
`npm run video -- discover --prompt "…"`. Do not allocate a project for read-only advice.

## Gates and resuming

Current explicit user decisions outrank persisted versions; hashes outrank dates.
Do not infer approval from silence or files. New workflows stop for direction
choice and script approval unless the user explicitly delegates those decisions.
Approval alone records `script_approved`; it does not request rendering.
A request to fix an existing soundtrack authorizes that correction and export;
do not restart discovery or ask for the same production approval again.

State sequence: request_created → directions_proposed → direction_selected →
script_draft → script_approved → production_requested → produced.
Resolve stale or conflicting artifacts before the dependent work.

Read [defaults](../../../docs/VIDEO_PRODUCTION_DEFAULTS.md) once per task:
2160×3840 at 60 fps, English, karaoke, explanatory motion and purposeful audible background music,
unless explicitly overridden. Keep one truthful promise, normally at most three
supporting beats, a resolved payoff and one useful CTA. Put value before branding.
Retain factual sources and asset licenses. Research, LLM, media, voice, rendering
and publishing are separate capabilities.

## Read on demand

- [Contracts](references/artifact-contracts.md): writing/changing structured artifacts.
- [Setup and commands](../../../docs/REMOTION_PROJECT_SETUP.md): environment or CLI use.
- [Implementation](../../../docs/VIDEO_WORKFLOW_IMPLEMENTATION_PLAN.md): changing workflow code.
- [Benchmark protocol](references/benchmarking.md): evaluating workflow changes.
- [Blueprint](../../../docs/VIDEO_WORKFLOW_BLUEPRINT.md): deeper editorial examples;
  not a prerequisite for routine corrections.

Reuse already-read guidance; do not expand every reference or load unrelated
provider/Remotion packages. Imported skills remain unchanged.

Changes invalidate downstream work: research → directions/script; direction →
script; narration/voice config → affected WAVs/captions; production config, voice,
assets or renderer → preview/final. Preserve previous valid outputs and the
project `src/` archive on failure. The CLI checks current preview fingerprints.

Report the phase, concrete artifacts, validation and any remaining decision.
`produced` certifies technical checks, not subjective emotional fit. Never claim
a media file or listening check exists without evidence.
