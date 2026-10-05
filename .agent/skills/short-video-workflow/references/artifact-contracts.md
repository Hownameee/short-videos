# Artifact contracts

Use these shapes as stable boundaries. Repositories may add fields, but should
not silently change the meaning of existing fields.

## Project layout

```text
projects/<nnn>-<slug>/
├── request.json
├── state.json
├── research.md
├── research.json
├── directions.json
├── direction.json
├── script.md
├── video.json
├── assets/
│   ├── sources.json
│   ├── images/
│   ├── footage/
│   ├── music/
│   └── sfx/
├── voice/
│   ├── manifest.json
│   └── <scene-id>.wav
├── output/
│   ├── preview.mp4
│   ├── final.mp4
│   ├── contact-sheet.png
│   ├── report.json
│   └── qc.json              # Agent-owned visual/audio review evidence
├── src/
│   └── ...                   # Atomic snapshot of shared renderer/src for final
└── render.snapshot.json
```

Allocate `<nnn>` when a new workflow receives its prompt, starting at `001` and
using the next existing number. Create `request.json` and `state.json` before
research or brainstorming. `src/` is created or replaced only after a final render
passes QC; previews do not modify it.

## `state.json`

```json
{
  "schemaVersion": 1,
  "state": "script_approved",
  "updatedAt": "2026-10-03T00:00:00Z",
  "versions": {
    "research": "sha256:...",
    "direction": "sha256:...",
    "script": "sha256:..."
  },
  "productionRequest": null
}
```

Allowed states are `request_created`, `directions_proposed`,
`direction_selected`, `script_draft`, `script_approved`,
`production_requested`, and `produced`.

## Common provenance record

```json
{
  "id": "source-1",
  "url": "https://example.com/page",
  "title": "Source title",
  "publisher": "Publisher",
  "publishedAt": null,
  "accessedAt": "2026-10-03T00:00:00Z",
  "supports": ["claim-1"],
  "license": null,
  "notes": "Primary source"
}
```

## `request.json`

```json
{
  "schemaVersion": 1,
  "slug": "docker-works-on-my-machine",
  "prompt": "Explain why an app works locally but fails after deploy",
  "audience": "junior developers",
  "platform": "youtube_shorts",
  "language": "en",
  "productionDefaults": { "captions": "word-highlight", "motion": "explanatory", "backgroundSound": "intentional-music" },
  "durationRangeSec": { "min": 45, "max": 75 },
  "tone": "fast, playful, moderately tense",
  "goal": "Explain the role of a reproducible runtime environment",
  "ctaGoal": "Lead to the next video about images and containers",
  "constraints": [],
  "assumptions": []
}
```

## `directions.json`

```json
{
  "schemaVersion": 1,
  "researchVersion": "sha256:...",
  "directions": [
    {
      "id": "pain-use-case",
      "title": "Works on my machine",
      "audienceProblem": "The runtime differs after deployment",
      "tensionHook": "App chạy trên laptop chưa có nghĩa là nó chạy ở production.",
      "promise": "Show how packaging the environment reduces that mismatch",
      "payoff": "The same image runs in both places",
      "coreBeats": ["Mismatch", "Image", "Repeatable run"],
      "evidenceIds": ["claim-1", "claim-2"],
      "visualApproach": "split comparison and process diagram",
      "musicMood": "playful tech",
      "durationRangeSec": { "min": 50, "max": 65 },
      "risks": []
    }
  ],
  "recommendedDirectionId": "pain-use-case"
}
```

## `direction.json`

```json
{
  "schemaVersion": 1,
  "directionId": "pain-use-case",
  "selectedAt": "2026-10-03T00:00:00Z",
  "userNotes": "Keep the tension moderate",
  "overrides": {},
  "assumptions": []
}
```

## `video.json`

```json
{
  "schemaVersion": 1,
  "scriptVersion": "sha256:...",
  "approval": {
    "status": "approved",
    "approvedAt": "2026-10-03T00:00:00Z",
    "approvedScriptVersion": "sha256:..."
  },
  "meta": {
    "slug": "docker-works-on-my-machine",
    "title": "Why it breaks after deploy",
    "platform": "youtube_shorts",
    "language": "en",
    "width": 1080,
    "height": 1920,
    "fps": 30
  },
  "hook": {
    "type": "tension",
    "text": "Your app works locally. Will it run in production?",
    "promise": "Explain the environment mismatch",
    "durationRangeSec": { "min": 3, "max": 7 }
  },
  "captions": { "mode": "word-highlight" },
  "audio": {
    "voice": { "provider": "kokoro", "voice": "af_heart", "langCode": "a", "sampleRate": 24000, "speed": 1.0 },
    "music": { "file": "assets/music/selected-track.wav", "volume": 0.15 }
  },
  "design": {
    "visualThesis": "A stable system replaces an unpredictable environment.",
    "mood": ["clear", "technical", "energetic"],
    "palette": {
      "background": "#07111F",
      "surface": "#10243A",
      "text": "#F5FAFF",
      "muted": "#9FB4C8",
      "accent": "#2496ED"
    },
    "typography": {
      "display": "Inter",
      "body": "Inter",
      "code": "JetBrains Mono"
    },
    "safeArea": { "top": 140, "right": 180, "bottom": 300, "left": 90 },
    "motionGrammar": "direct cuts, shared-object moves, restrained spring emphasis",
    "assetLanguage": "native diagrams and tightly cropped real UI evidence"
  },
  "scenes": [
    {
      "id": "mismatch",
      "purpose": "Show the local/production mismatch",
      "durationRangeSec": { "min": 6, "max": 10 },
      "narration": "Your narration here.",
      "onScreenText": ["SAME CODE ≠ SAME ENVIRONMENT"],
      "visualType": "split-comparison",
      "motion": { "action": "Move the same image between environments", "cue": "Measured narration phrase", "settle": "Show matching results" },
      "assets": [],
      "sourceIds": ["claim-1"],
      "sfx": ["warning-pop"],
      "transition": "match-cut",
      "pronunciation": []
    }
  ],
  "outro": {
    "takeaway": "One sentence to remember.",
    "cta": "One contextual next action."
  }
}
```

The `safeArea` values above are an example starting point for a 1080×1920 project,
not a universal platform standard. Set them from the actual target platform and
verify them with a UI overlay in the preview.

The music path/gain are placeholders, not a ready asset or universal mix level.
Select or generate the real asset, save its provenance, and measure the actual
mix. `music: null` requires a recorded user override or an explicit alternate
background-sound plan. Omission is not evidence of voice-only intent.

Record the editorial sound plan in `script.md` or existing-project production
notes. Before delivery, record `output/qc.json.backgroundSound` as specified in
[sound QC](../../../../docs/VIDEO_SOUND_QC.md).
These are agent-owned review records; the current CLI does not validate their
schema or infer audibility from them. Preserve an existing QC file's other fields.

The example is an editorial plan, not an implemented Docker renderer. Current
render routes are `meta.renderer: "kubernetes" | "eclipses"`; omitted renderer
retains legacy Kubernetes compatibility. Unsupported routes or scene IDs fail.

## Production-only revisions

Run `npm run video -- revise --project projects/NNN-topic` and edit the created
`production.json`, leaving the approved script and video data unchanged:

```json
{
  "schemaVersion": 1,
  "scriptVersion": "sha256:approved-version",
  "audio": {
    "music": { "file": "assets/music/curiosity.wav", "volume": 0.15, "fadeInSec": 0.5, "fadeOutSec": 1.5 },
    "sfx": false
  },
  "captions": { "mode": "word-highlight" },
  "soundIntent": "Curiosity at the hook, space for explanation, lift at reveal."
}
```

Only these fields plus `soundOverride` are accepted. Omitted settings inherit
approved configuration. Music objects replace the complete music setting; use
`music: null` and `sfx: false` for explicit voice-only. Caption modes are
`word-highlight`, `phrase`, `none`. Narration, voice and scene edits require
`script --draft` and approval; run `revise` afterward to refresh an old overlay.
Nonempty storyboard overrides are rejected because the topic renderers do not
consume them. Implement visual changes in the shared renderer.

## Approval and validation

For default karaoke, `voice/manifest.json.scenes[]` includes `words[]` and phrase
`captions[]`, each with `text`, `startMs`, `endMs`, `timestampMs` and `confidence`.
Times are milliseconds local to that scene's WAV. The shared helper merges
punctuation and retains actual Kokoro token timings with audio-chunk offsets;
`captionTiming` identifies the provider-predicted alignment. Render preflight
requires ordered, in-range words covering the approved spoken text and phrase
boundaries that do not cut words. Explicit `captions.mode: "phrase" | "none"`
opts out of word highlighting; phrase timing/coverage and scene identity/duration
are still validated, and both topic renderers implement these modes.
See [production defaults](../../../../docs/VIDEO_PRODUCTION_DEFAULTS.md).

- `direction.json` records the Phase 1 choice.
- `video.json.approval.status` must be `approved` and
  `approvedScriptVersion` must equal `scriptVersion` before Phase 3 can start.
- Approval records the content gate. Phase 3 also requires a current explicit
  preview/final request, stored in `state.json.productionRequest` when persisted.
- Hash or version research, direction, and script inputs so downstream output can
  detect stale state.
- Validate unique scene IDs, positive duration ranges, existing local assets,
  safe output paths, supported voice/language pairs, and source/license records.

## Preview and automated QC

Preview records an input fingerprint covering script/video, production overlay,
storyboard, all voice/assets, renderer source/configuration, lockfile and render
workflow code (excluding tests/unrelated helpers). Final
requires that fingerprint plus unchanged preview/contact-sheet hashes. Changed
inputs require a fresh preview. Contact-sheet times include opening, all scene
midpoints and ending. Final checks timeline duration, H.264/AAC, dimensions/FPS,
full decode and encoded loudness/true peak. `output/automated-qc.json` records these
measurements and missing listening; it never overwrites agent-owned `qc.json`.
Reports/snapshots include `inputs` hashes and `checksums.renderInputs`.

## `render.snapshot.json`

```json
{
  "schemaVersion": 1,
  "createdAt": "2026-10-03T00:00:00Z",
  "runtime": {
    "node": "24.21.0",
    "remotion": "4.0.532"
  },
  "checksums": {
    "videoJson": "sha256:...",
    "rendererSrc": "sha256:...",
    "dependencyLockfile": "sha256:...",
    "finalMp4": "sha256:..."
  }
}
```

Write this manifest after final QC and an atomic source copy. State `produced`
requires a final MP4, `report.json`, archived `src/`, and matching checksums. If a
new final render or copy fails, preserve the previous valid snapshot.
