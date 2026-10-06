---
name: short-video-script
description: >-
  Run Phase 2 of the shared short-video workflow: convert an explicitly selected
  direction and its research into a reviewable beat sheet, narration, flexible
  scene timing, on-screen text, visual plan, captions, music and SFX cues,
  pronunciation notes, payoff, takeaway, and contextual CTA. Use whenever a
  user asks to write, revise, preview, or approve a short-video script. Stop for
  script approval and do not generate TTS or render video yet.
compatibility: Expects a selected direction or an equivalent user decision; can write script.md and video.json using the shared artifact contract.
---

# Short Video Script

Own Phase 2. Read the selected direction and its research before writing. Use the
[artifact contracts](../short-video-workflow/references/artifact-contracts.md)
when persisting output.

## Preconditions

Confirm the direction is explicitly selected. If it is missing, route back to
`short-video-discovery`. Do not quietly choose a direction unless the user asked
for automatic selection; when auto-selecting, use the recommended direction and
record that assumption.

Require the selected direction to reference the current research version. If
research is missing or stale, stop and repair Phase 1 instead of filling gaps
from memory.

Reject or soften any hook that is stronger than the research. Keep source IDs
attached to factual claims through the scene plan.

## Write in two passes

### Beat sheet

Define the job of each beat before writing polished narration:

1. tension hook;
2. promise, which may overlap the hook;
3. use-case setup when needed;
4. one to three explanatory or demonstrative beats;
5. payoff with proof or result;
6. one-sentence takeaway;
7. one contextual CTA, which may overlap the payoff.

Treat time as a budget:

| Section          | Typical duration |
| ---------------- | ---------------- |
| Tension hook     | 3–7s             |
| Promise          | 2–5s             |
| Use-case setup   | 4–10s            |
| Explanation/demo | 20–40s           |
| Payoff/evidence  | 5–15s            |
| Takeaway         | 2–6s             |
| Contextual CTA   | 2–6s             |

Budgets may overlap and do not need to fill the target duration. End early when
the payoff is complete.

### Script and scene plan

Write for listening: short clauses, one idea per sentence, concrete verbs, and
natural pauses. Avoid a greeting, standalone logo intro, dense lists, fake
personal experience, and unsupported statistics.

For every scene provide:

- purpose and flexible duration;
- exact narration;
- on-screen text;
- visual type, action, and asset needs;
- caption grouping intent;
- music and SFX cue;
- transition;
- source IDs;
- Kokoro pronunciation notes for acronyms, product names, numbers, and URLs.

Apply the repository's [production defaults](../../../docs/VIDEO_PRODUCTION_DEFAULTS.md):
new videos use `meta.width: 2160`, `meta.height: 3840`, `meta.fps: 60` unless
explicitly overridden. Follow the request's recorded format; do not copy old
1080p/30 fps project metadata into a new default script. The draft command fills
missing format fields before approval. Plan motion in seconds so its speed is
independent of fps. Keep the defaults of
English output, `captions.mode: "word-highlight"`, and a concrete motion plan
per scene. Record what changes visually, its narration cue, and the final state;
"fade in the slide" alone is not a scene motion plan. Design caption groups for
one or two lines; actual word times come from voice generation, not the script.

Include the defaults' compact sound plan in the production notes: intended
emotion, music through hook/explanation/reveal/ending, ducking, and selective
accent cues tied to narration or visuals. "Ambient music" or an empty SFX list
alone is not a sound plan. Carry it to production without requiring another
reminder; respect and record an explicit user sound override.

When the user asks for a detailed art direction or the scene plan defines concrete
layout, typography, color, diagram, caption, motion, or transition behavior, read
`../short-video-visual-design/SKILL.md`. Keep visual planning at an editorial level
in Phase 2; detailed JSX remains Phase 3 work.

Treat pronunciation spellings as candidates to audition, not authoritative
render instructions. This matters when the script language lacks an official
voice in the selected TTS provider.

Estimate speech duration and flag scenes that are too dense. Do not solve an
overlong scene by blindly increasing TTS speed; shorten the text or expand the
scene first.

## Review format

Present a concise human-readable `script.md` in this order:

1. title, audience, duration range, tone;
2. hook, promise, payoff, takeaway, CTA;
3. one scene table containing the beat function, narration, and production notes;
4. only the sources, pronunciation candidates, assumptions, and warnings not
   already clear from the table;
5. estimated total duration.

Ask for one decision: approve the script or list revisions. Do not call Kokoro,
fetch production assets, start Remotion Studio, or render while approval is open.

Record edits with `video script --draft` (also supported after production).
After explicit approval, use `video script --approve`; do not manually set hashes
or approval timestamps. Record `script_approved`. Route to `short-video-production` only when the user also
requests a preview or final render; approval by itself waits at the gate.
