# Benchmarking workflow changes

Read only for measured workflow/skill optimization, not routine production.
Use skill-creator for independent old/revised executions and its review viewer.

1. Freeze the old code, skills, local referenced docs and identical project
   fixtures before editing. Record original project and imported-package hashes.
   Run every mutation/render on isolated copies. Keep live deliverables intact.
2. State what must remain equivalent: narration and alignment, scene timing,
   visual/caption behavior, resolution/FPS/codec, audio intent and approval gates.
   Identify deliberate corrections, such as honoring a formerly ignored gain.
3. Run existing regression suites and real preview/final exports. Compare decoded
   frames/audio, not MP4 container hashes alone. Repeat the unchanged baseline
   to distinguish render variance from a regression. Preserve raw logs and hashes.
4. Compare identical workloads with the same runtime, dependencies, inputs and
   settings. Alternate old/new order; use at least three repeated timing samples
   when practical and report mean plus sample standard deviation. Include new QC
   overhead; don't hide it inside a cache speedup. Single samples remain labeled.
5. For selective voice generation, test unchanged, one-scene, voice/speed/code
   changes, corrupt cache and mid-generation failure. Verify unaffected WAVs and
   timing stay identical and a no-op manifest does not invalidate the preview.
6. Run paired independent agents on identical prompts against isolated old and
   revised guidance, with no parent implementation context. Cover existing audio
   correction, approved narration revision and explicit sound/caption overrides.
   Grade executable behavior and preserved gates; keyword presence isn't enough.
7. Record actual model token/timing telemetry only when provided. Otherwise use
   null and explain why. File bytes, characters and whitespace words measure
   document footprint, never model-token consumption or answer quality. Do not
   substitute same-author plans for independent evaluations when capacity fails.
   The installed skill-creator aggregator falls back to output characters when
   tokens are absent. With missing telemetry, aggregate grades only and retain
   null timing/token fields; do not accept that fallback or edit the imported tool.
8. Keep automated measurements, visual review and listening outcomes distinct.
   Save a report with concrete evidence and remaining limits. Generate the static
   review HTML from skill-creator rather than building a second viewer.

See the [latest benchmark](../../../../docs/WORKFLOW_BENCHMARK.md) and its raw
iteration folder. Older benchmark character-count proxies must not be interpreted
as model token usage, and missing timing is not zero elapsed time.
