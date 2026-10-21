# Workflow revision and benchmark

Verified 2026-10-05. The update preserves the video format and default editorial
behavior while fixing revision handling and adding stronger validation. Narration
reuse is substantially faster; stronger preview QC has a small measured cost.
Independent dry-run comparisons completed; grading was performed by the parent
agent after the separate grader hit a usage limit. AI token usage is unmeasured.
This is historical evidence: the eclipse example project and its media have
since been removed, so its measurements cannot be rerun from the current checkout.

## What changed

| Area | Implemented behavior |
| --- | --- |
| Revision/configuration | `video revise` creates a version-bound `production.json` overlay for music, fades, SFX and caption mode. Approved script hashes stay valid. Narration revisions can start from a produced project, preserving its last deliverable. |
| Renderer behavior | Both compositions honor configured music and `word-highlight`, `phrase`, `none`. Unknown renderers, unsupported scene IDs and unimplemented storyboard overrides fail visibly. |
| Automated QC | Preflight checks voice bytes, sample rate, duration, caption coverage and safe media paths; measures music signal/length. Final requires a current preview and validates timeline duration, dimensions/FPS, H.264/AAC, full decode, encoded loudness and true peak. |
| Input tracking | Fingerprints include assets, voice, approved content, overlay, storyboard, renderer source/config, lockfile and render-workflow code. Tests/docs/unrelated helper edits do not invalidate previews. Contact sheets cover opening, every scene and ending. |
| Selective regeneration | Unchanged verified WAVs/timing are reused. Text, pronunciation, voice, speed, package/code changes or corruption invalidate affected entries. No-op manifests remain byte-identical. Staged generation and rollback preserve the old voice set on failure. |
| Document routing | Existing corrections go directly to production. Setup, visual/API guidance, editorial examples and historical evidence load only when relevant. Evaluation archives are excluded from routine discovery. |

The main implementations are [workflow](../tools/video-workflow.mjs),
[configuration](../tools/production-config.mjs), [media QC](../tools/media-qc.mjs),
[voice generation](../tools/kokoro/generate_audio.py) and shared
[music](../renderer/src/BackgroundMusic.tsx)/[captions](../renderer/src/KaraokeCaptions.tsx).
[Production skill](../.agent/skills/short-video-production/SKILL.md),
[defaults](VIDEO_PRODUCTION_DEFAULTS.md), [sound QC](VIDEO_SOUND_QC.md) and
[setup](REMOTION_PROJECT_SETUP.md) describe the supported workflow.

## Measured runtime

Same local Node 24.21.0, Remotion 4.0.532, Python 3.12/Kokoro 0.9.4 and project
inputs; no new dependencies. Tests used isolated copies of both existing projects.
Voice inference used cached models with network access disabled. Values below
are wall time, mean ± sample standard deviation for three runs unless noted.

| Workload | Baseline | Revised |
| --- | ---: | ---: |
| Unchanged seven-scene narration | 13.13 ± 2.17 s | 0.33 ± 0.04 s |
| One changed narration scene, single sample | 11.72 s | 8.01 s |
| Eclipse preview | 16.09 ± 0.22 s | 17.52 ± 0.07 s |
| Kubernetes preview | 16.47 ± 0.15 s | 17.69 ± 0.08 s |

Unchanged narration took about 97.5% less time. A one-scene correction retained
the other six WAVs exactly; a fully unchanged run retained WAVs and manifest bytes.
Model startup still dominates a single changed clip. Preview checks added about
1.2–1.4 seconds (7–9%); this update does **not** claim identical render latency.
Final resolution, frame rate and encoding quality settings remain unchanged.

Initial render comparisons alternated old/new order over repeated trials. After
the final fingerprint-scope refinement, revised preview timings were collected
again three times and final exports revalidated. These are local descriptive
measurements, not an isolated-host performance guarantee. The first baseline TTS
run was slower than later runs; the reported variance includes it.

## Output and regression evidence

- 18 Node tests and 10 Python tests pass; renderer ESLint/TypeScript passes.
  Coverage includes stale approval/preview, production overrides, missing/wrong
  media, quiet/silent audio, path escapes, caption timing, selective cache reuse,
  corrupt clips and synthesis/install failure recovery.
- Both full-length default compositions and an explicit voice-only/phrase-caption
  revision were rendered through preview and final QC. A no-caption frame was
  also rendered and visually inspected. The override retained approved video bytes
  and rejected an attempted final before its fresh preview.
- Kubernetes decoded preview frames matched the baseline exactly. Eclipse audio
  matched exactly. Eclipse old/new video SSIM was 0.999617; repeated unchanged
  baseline renders scored 0.999272 against each other. The observed difference is
  within measured baseline render variation; no visual regression was observed
  in inspected frames/contact sheets. This is not a claim of bit-identical eclipse
  video or a complete perceptual review of every frame.
- Kubernetes now honors its configured music gain `0.1` instead of the old
  hardcoded `0.095` (about +0.45 dB in the music layer). This is an intentional
  configuration fix, so its audio is not claimed byte-identical.
- Measured default finals: eclipse −16.24 LUFS / −1.49 dBTP; Kubernetes −16.14
  LUFS / −1.34 dBTP. Full decode, 1080×1920, 30 FPS and expected timeline checks
  passed. Seven narration-tail intervals in the voice-only test measured −91 dBFS,
  versus −23.8 to −36.4 dBFS with music, confirming the override removed the bed
  in those intervals.
- All 111 original project files and 279 imported Remotion skill files matched
  their pre-edit hashes. Existing delivered MP4s and source archives were untouched.

Measurements and visual checks do not certify listening quality, pronunciation,
emotional fit or engagement. Listening was **not performed**. Automated output
records that limitation rather than overwriting editorial `qc.json`.

## Document footprint and AI evaluation limits

The recorded core guidance set for an existing soundtrack correction shrank from
8,593 to 4,841 whitespace words, about 44%. The set includes the
full background guide and artifact contract, excluding conditional command/setup
and API references. Exact paths/counts are in `document-footprint.json`. This is
a static reading footprint, **not measured model tokens or observed agent reads**.

Three identical-prompt cases used separate old/revised executors, each processing
the same three-case battery. Initial attempts hit the usage limit; retries saved
all six answers before another interruption. A separate grader was then blocked,
so the parent agent reviewed every answer against the rubric and variant source.

| Dry-run case | Baseline checks passed | Revised checks passed |
| --- | ---: | ---: |
| Existing soundtrack correction | 4/4 | 4/4 |
| Already-approved sentence revision | 2/4 | 4/4 |
| Voice-only and phrase captions | 1/3 | 3/3 |
| Total | 7/11 | 11/11 |

The baseline candidly identified its missing reopen/selective-generation and
caption-configuration behavior. Those were capability failures, not fabricated
commands or unsafe approval bypasses. No regression appeared in these three
plan cases. This small benchmark tests code capabilities and instructions
together; it does not isolate the value of shorter documentation or establish
general AI quality parity. There was one execution battery per variant, not
repeated independent trials. Token and agent-time telemetry remain null, and
fresh-host skill activation was not measured.

The [review viewer](../.agent/skills/short-video-workflow-workspace/iteration-3/review.html)
contains the actual paired answers, assertions and source-backed grading.
`evaluation-attempts.json` retains interruption details; `analysis.md` records
the interpretation and limits. The benchmark summary averages case pass rates;
its standard deviation describes different cases, not run-to-run variance.

Earlier iteration benchmark fields named `tokens` contained response-character
proxies, and unavailable time was represented as zero. Those historical files
are not evidence of token savings or speed. Follow the new
[benchmark protocol](../.agent/skills/short-video-workflow/references/benchmarking.md)
for further independent repetitions and token telemetry when available.

## Evidence and rerunning checks

Raw logs, snapshots, hashes, timing samples, comparisons and isolated exports:
[iteration-3](../.agent/skills/short-video-workflow-workspace/iteration-3/).
`final-verification-results.json` records final-code exports;
`voice-results.json` and `voice-preservation.json` record real cache tests;
`media-comparison.json` and `eclipse-repeat-comparison.json` record decoded-output
comparisons; `preservation-result.json` records untouched user/imported files.
`changed-files.json` lists source and documentation changes.

From the workspace root with the installed Node environment:

```bash
npm run test:video
.venv-kokoro/bin/python -m unittest discover -s tools/kokoro -p 'test_*.py' -v
npm --prefix renderer run lint
```

This host's legacy npm `_auth` configuration required `--userconfig=/dev/null`
for local script execution; global configuration was not changed. Chromium
required sandbox approval. Benchmark scripts use isolated workspace copies;
create a fresh iteration when repeating fixture creation rather than overwriting
live projects or the frozen baseline.
