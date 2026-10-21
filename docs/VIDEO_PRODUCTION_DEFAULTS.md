# Video production defaults

Apply these defaults to new and resumed projects unless the user overrides them.

| Area | Default |
| --- | --- |
| Language | English narration, on-screen text and captions |
| Final format | Vertical 4K: 2160×3840 at 60 fps |
| Review preview | Half resolution (1080×1920), retaining 60 fps |
| Captions | `word-highlight`; shared KaraokeCaptions, scene-local time |
| Motion | An explanatory action, narration cue and readable settled result per scene |
| Sound | Audible purposeful music with a hook/explanation/reveal/ending arc |
| Export | Shared workflow CLI, current preview, technical and editorial QC |

## Resolution and frame rate

The shared default is [video-format.json](../renderer/src/video-format.json).
New requests record its width, height and fps in `productionDefaults`. When
recording `script --draft`, missing `video.meta` format fields inherit the
request defaults, or the shared defaults for older requests, before hashing and
approval. Explicit `video.meta.width`, `height` and `fps` override these values.
Existing approved projects and historical render snapshots retain their settings;
changing them requires a new draft/approval and fresh preview.

Render SVG, text and diagrams at the target resolution. If authoring on a
1080×1920 design canvas, scale the entire layout uniformly by 2 for 4K, including
HTML captions, overlays, backgrounds and safe margins. Do not enlarge an existing
MP4 or duplicate 30 fps frames to claim a 4K60 render.

Use seconds for motion and cue times; convert to frames using the configured
fps. Music, sound effects, scene-tail rounding and review-frame scripts must use
the same timeline rate. Keep provider word timings in milliseconds. Review
consecutive 60 fps frames, safe areas and captions before the full-resolution
final. Preview scale affects resolution only, not frame rate or timing.

## Narration and captions

Use the shared Kokoro generator at 24 kHz with a matching American/British voice.
It retains measured durations, spoken versus source text, predicted per-word times
and phrase groups; it reuses verified unchanged scenes. Caption times must cover
the complete spoken text, including pronunciation replacements. Do not estimate
word times by dividing sentence duration or silently downgrade karaoke.
Explicit `phrase` and `none` overrides are supported.

Use the shared caption component, keep groups within two lines and platform safe
areas, and attach punctuation. Inspect three successive highlighted words plus a
later scene/chunk in rendered frames. Predicted alignment is not a listening test.

## Motion

Record `motion` with `action`, `cue` and `settle`. Show an entrance plus a
meaningful transformation, process, comparison or movement within each scene.
A progress bar, title fade or decorative pulse alone is insufficient. Use
Remotion frame time, not CSS animation clocks. Inspect playback or consecutive
frames through each main action. New topics need their own visuals; existing
Kubernetes diagrams are topic-specific.

## Background sound

Record intended emotion, track/source, narration ducking and cue timing in script
production notes before approval or `PRODUCTION.md` for revisions. Curiosity or
wonder should have musical phrasing and development; a constant low drone or a
“cinematic” filename is not proof of fit. SFX are optional and purposeful.

For selection or mixing, read [Sound QC](VIDEO_SOUND_QC.md). Explicit voice-only,
silence or ambience preferences override defaults; missing configuration does not.
A music file or audio stream cannot prove audibility, clarity or emotional fit.

## Verification boundaries

The CLI validates data, current preview/input checksums, expected duration,
codecs, dimensions/FPS, full decode and final audio measurements. It saves
`output/docs/automated-qc.json`; this does not overwrite `output/docs/qc.json` editorial
evidence. `produced` means technical export passed.

Agents still review factual claims, mobile readability, motion, caption pixels,
asset rights and rendered sound. Record timestamps, evidence paths, checksums
and separate passed/failed/not-performed outcomes. Disclose unavailable listening;
continue authorized export with measured checks without inventing a listening pass.

Commands are in [renderer README](../renderer/README.md).
[Historical validation](history/PRODUCTION_VALIDATION.md) is archival, not required
task context. Current workflow evidence is in [the benchmark](WORKFLOW_BENCHMARK.md).
