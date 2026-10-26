---
name: short-video-production
description: Produce an approved short video or correct an existing video's background sound, emotion, captions, mix or export. Generate only changed narration, render and review a current preview, run technical and editorial QC, then export. Exclude script-only and general audio-advice requests.
compatibility: Approved repository project, shared renderer and installed media tools.
---

# Short video production

Inspect the target `state.json`, approved `video.json`, `script.md` and existing
production notes. Read [defaults](../../../docs/VIDEO_PRODUCTION_DEFAULTS.md) once.
Use the installed runtime and [existing commands](../../../renderer/README.md).

Require matching script approval and an explicit production request. A request
to correct an existing video authorizes the scoped revision and replacement
deliverable. Do not restart discovery or ask for approval already given.
Dry-runs inspect and plan without creating media or claiming measurements.

## Revisions

For music, gain, fades, SFX or caption mode, run
`npm run video -- revise --project projects/NNN-topic`, then edit
`production.json`. Keep approved narration and visuals. This overlay preserves
legacy approval hashes. Record sound intent in `PRODUCTION.md` or the overlay.

For changed narration, scene content, voice settings or design data, edit the
script/config, run `script --draft`, obtain approval (unless already explicitly
given), then `script --approve`. Drafts now work after production and preserve
the previous deliverable. Run `revise` after reapproval if an overlay exists.
Never manually rewrite approval hashes. Consult
[contracts](../short-video-workflow/references/artifact-contracts.md) when writing
an overlay or changing structured fields. Storyboard overrides are not implemented
by the current Kubernetes renderer and are rejected rather than silently ignored.

## Focused reading

| Work needed | Read |
| --- | --- |
| Sound selection, mood or mix | [Sound QC](../../../docs/VIDEO_SOUND_QC.md); relevant background-guide section |
| Generate/change narration | [Kokoro](../kokoro-tts/SKILL.md) |
| Change art direction, layout, scene motion or caption UI | [Visual design](../short-video-visual-design/SKILL.md) |
| Build or revise real 3D, hybrid 2D/3D, GLB/glTF or Blender-pass scenes; correct static-looking 3D pacing | [Hybrid 3D](../short-video-hybrid-3d/SKILL.md), including its shot timeline and animatic review |
| Change Remotion code | [Remotion practices](../remotion-best-practices/SKILL.md), then only relevant API/rule reference |

Do not load voice setup, visual design, the blueprint or all Remotion packages for
a gain-only correction. Use imported focused packages when their API guidance is
needed, and verify uncertain version details against official documentation.
List guidance actually used in the work report.

## Production and checks

1. Preserve the approved promise, claim evidence, payoff and contextual CTA.
   Record a visual thesis and action/cue/settle for new scenes. New topics need
   their own renderer; never disguise Kubernetes diagrams as generic output.
   A new hybrid renderer needs a validated scene map and narration cues before
   JSX; the current Kubernetes renderer does not consume `visual-map.json`.
   When a transparent presenter will be composited later, record its placement
   in `design.presenterOverlay` and reserve that rectangle in the Remotion
   layout before rendering. Check captions and scene content against the
   composited preview.
2. Use the shared voice generator when narration needs updating. It verifies and
   reuses unchanged WAVs and timing; changes regenerate affected scenes. Measure
   duration, retain provider-predicted word timestamps, and review pronunciation.
3. Resolve assets and record sources/licenses. Implement a purposeful sound arc:
   hook → explanation → reveal → ending; mix voice first, audible music second,
   selective SFX last. Apply sound QC, including rendered listening when available.
4. Run `video preflight --project …` before rendering. It validates supported
   config, asset paths/checksums, voice order/timing, music signal and duration.
   Resolve failures; do not bypass them or fabricate measurements.
5. Render `--preview`. Inspect the contact sheet (opening, every scene, ending)
   for focal point, readable mobile text, safe areas, asset quality and coherent
   visual style. Inspect playback/consecutive frames through every main motion
   beat. For 3D motion revisions, apply the hybrid skill's animatic and
   normal-speed pacing review before full-render polish. A static frame cannot
   establish meaningful animation; adjacent frames cannot establish pacing.
6. Check at least three successive word highlights and a later scene/chunk;
   record frame times and timing source. Check missing/repeated/mispronounced
   words, speech intelligibility, music arc, fades, loops and phone/mono playback.
   Save editorial evidence in `output/docs/qc.json`, tied to asset/output checksums.
   Fix demonstrated defects and regenerate the affected work and preview.
7. Render `--final` from the current preview. The CLI checks fingerprint,
   timeline duration, dimensions/FPS, H.264/AAC, full decode, loudness and true
   peak. It writes `output/docs/automated-qc.json` separately from editorial QC.
8. Deliver the actual final, report and snapshot. The CLI atomically replaces
   final/report/snapshot/state after checks; failures preserve the previous
   final. The snapshot records the shared renderer checksum. Keep only
   `output/video/final.mp4` as the project's delivered video.

No black/missing frames, obscured payoff, secrets or internal prompts in output.
Retain asset rights records; purchasing or publishing is separate authorization.
Background asset presence or final loudness alone cannot prove audible emotional
fit. If listening is unavailable, complete authorized measured export, mark it
`not-performed`, and disclose the limit. Do not invent a pass.

Dry-run response: one preflight table, ordered plan, QC list and artifact list.
Use `<measured>` placeholders for measurements not yet taken.
