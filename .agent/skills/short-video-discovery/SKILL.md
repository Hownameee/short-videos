---
name: short-video-discovery
description: >-
  Run Phase 1 of the shared short-video workflow: turn a raw topic or prompt
  into a sourced research pack and 2–4 distinct video directions, each with a
  defensible tension hook, promise, payoff, beats, visual approach, duration
  range, and risks. Use whenever the user asks for video ideas, angles,
  research, facts, hooks, topic analysis, or choices before scriptwriting. Stop
  for the user's direction choice and do not silently continue into script or
  production.
compatibility: Requires internet access or user-provided current sources for research; writes repository project artifacts when requested.
---

# Short Video Discovery

Own Phase 1. Use the [artifact contracts](../short-video-workflow/references/artifact-contracts.md)
when persisting output.

## Intake

When the user starts a new video workflow or asks to brainstorm a video they intend
to produce, first scan existing `projects/<nnn>-*` folders, allocate the next
zero-padded number starting at `001`, derive a stable slug, create the project
folder, and persist `request.json` plus `state.json` with `request_created`. Reuse
the supplied project when resuming. Do not create a project for a purely general,
read-only discussion with no intent to produce a video.

Extract what the user already gave you before asking anything:

- topic and desired outcome;
- audience and assumed knowledge;
- platform and duration range;
- language, tone, tension level, and CTA goal;
- allowed or forbidden claims, sources, media, and providers.

Proceed with reasonable defaults for secondary details. Ask early only when a
missing answer would materially change research scope or safety. Record defaults
in `assumptions`.

## Research

Use current primary or authoritative sources for claims that may change or carry
material consequences. Distinguish:

- verified fact with a direct source;
- inference derived from cited facts;
- creative framing;
- unresolved or rejected claim.

Do not treat LLM memory as web research. A local LLM such as Ollama can organize
evidence and generate directions, but it needs a search adapter, fetched URLs,
or a user-provided source pack for current evidence.

Build a compact fact pack with 3–7 useful claims. For each claim record the
statement, source URL, publisher, date when available, confidence, and what it
can safely support in the video. Avoid collecting facts that will not influence
a direction.

## Generate directions

Create 2–4 options that differ in narrative logic, not just wording. Useful
families include:

- pain or failure use case;
- contrarian correction of a real misconception;
- result-first demonstration;
- visual analogy;
- comparison or before/after;
- mini story with a decision and consequence.

For every direction include:

1. working title;
2. audience problem;
3. tension hook;
4. promise and payoff;
5. two or three core beats;
6. evidence available and any weak claim;
7. visual approach and likely asset sources;
8. music mood and pacing;
9. duration range;
10. production complexity and risks.

Score the hook 0–2 for clarity, truth, audience relevance, and payoff. Reject a
hook that fails truth even if it sounds engaging. Do not inflate every option to
the same perfect score; when scores tie, explain the real tradeoff and choose by
audience fit, evidence strength, and visual payoff. Recommend one direction and
explain that tradeoff in one or two sentences.

## Present the gate

Use one non-repeating comparison table followed by a recommendation and one
compact question. Ask the user to select
an option, combine named options, or request a new direction. Ask about duration,
tension, and CTA only if those remain consequential and unresolved.

This first pass ends at `directions_proposed`. Stop after the choice request. Do
not produce a full narration, call Kokoro,
download assets, create Remotion code, or render.

When persisting artifacts, write:

- `request.json` and `state.json` before research begins;
- `research.md` for humans;
- `research.json` for claims and provenance;
- `directions.json` for choices;
- `direction.json` only after the user selects, moving state to
  `direction_selected`.

Report which facts remain uncertain and which choice is required for Phase 2.
