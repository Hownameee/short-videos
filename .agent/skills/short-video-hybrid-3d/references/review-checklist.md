# Hybrid 3D review checklist

Use this checklist with the normal visual, caption, sound, preview, and final
workflow checks. Record evidence paths and timestamps rather than a single pass
or fail with no trace.

## Story and composition

- [ ] Any renderer-consumed scene map matches the approved script version,
      scene order, and current preview fingerprint.
- [ ] Every narration claim has a concrete visual claim, domain object, causal
      action, narrated cue, and inspectable final state.
- [ ] Action, reveal, and settle begin on mapped voice words rather than generic
      scene percentages.
- [ ] The hook, hardest explanation, and payoff style frames communicate their
      claims before full-timeline implementation.
- [ ] The shot has a stated spatial purpose.
- [ ] One hero object or focal region is obvious at phone size.
- [ ] Camera movement reveals causality, scale, layers, or simultaneity.
- [ ] The main transformation resolves the narrated promise.
- [ ] Holds are long enough to read proof and understand the new state.
- [ ] 2D captions, evidence, and CTA remain inside the platform-safe area.
- [ ] Essential text is not distorted, occluded, or made unreadable by depth.
- [ ] Removing captions still leaves the primary process or comparison
      recognizable; DOM labels clarify rather than rescue unrelated imagery.
- [ ] Every visually dominant object has domain meaning; decorative effects do
      not compete with explanatory objects.

## Motion and pacing

- [ ] Visual directions were explored at the level of mechanism/metaphor, not
      just recoloring the same primitives; approved successful style is preserved.
- [ ] The selected metaphor has an explicit factual mapping, assumptions and
      limitations; visual spectacle does not introduce a false claim.
- [ ] Any references have source links and specific observed lessons; thumbnail,
      text-only, clip playback, and original inference are distinguished.
- [ ] Silhouette, materials, light, depth and negative space support one focal
      object at phone size; reference assets have rights before incorporation.

- [ ] Shot notes identify intervals, voice cues, framing, subject action, camera
      movement or lock, hold purpose, and the connection to the next shot.
- [ ] Hook and hardest action plus a neighboring transition were reviewed as a
      timed animatic before material/lighting polish or full-timeline expansion.
- [ ] Normal-speed phone-size playback was checked separately from stills and
      adjacent-frame inspection; unavailable playback is marked not performed.
- [ ] Idle intervals and repeated framing were examined with timestamps; long
      holds have a reading/comprehension purpose rather than a fixed cut quota.
- [ ] Subject actions reveal new information; camera movement, glow and idle
      loops do not stand in for the explanatory transformation.
- [ ] Camera moves preserve object identity, orientation, labels and captions;
      important outcomes settle long enough to understand.
- [ ] Revisions compare the same old/new narration interval where available.
- [ ] Pacing, semantic accuracy, readability and temporal defects have separate
      outcomes; technical checks do not certify engagement or listening quality.

## Assets and lighting

- [ ] Every model, texture, HDRI, footage pass, and decoder is local at render.
- [ ] Source, license, transformation, and checksum records are retained.
- [ ] GLB transforms, normals, UVs, material names, and baked clips are correct.
- [ ] Key/fill/rim or equivalent lighting produces a clear subject hierarchy.
- [ ] Shadows and reflections ground the subject without hiding evidence.
- [ ] Postprocessing supports the chosen moment and does not clip or bloom text.

## Determinism

- [ ] All animation time derives from `useCurrentFrame()` and FPS.
- [ ] No `useFrame()`, wall-clock, autonomous mixer, uncontrolled physics, or
      unseeded randomness influences rendered pixels.
- [ ] `<Sequence>` inside `<ThreeCanvas>` uses `layout="none"`.
- [ ] Baked clips are sampled by explicit time.
- [ ] Video texture capture uses the current headless media path and synchronous
      R3F `advance()` after asynchronous frame updates.
- [ ] Re-rendering selected frames produces the same visible result.

## WebGL and temporal integrity

- [ ] The selected `angle` or `swangle` backend is recorded.
- [ ] Actual GPU capability and maximum render-buffer size are checked.
- [ ] Concurrency `1` produces a clean reference render.
- [ ] Hook, turns, crossings, reveal, payoff, and loop are inspected in
      consecutive frames or playback.
- [ ] No blank canvas, stale texture, camera jerk, object pop, z-fighting,
      shadow noise, focus pumping, or simulation discontinuity remains.
- [ ] Any render segmentation joins without temporal or audio discontinuity.

## Delivery evidence

- [ ] Preview fingerprint matches the current code, assets, voice, and config.
- [ ] Contact sheet covers opening, every scene, payoff, and ending.
- [ ] Motion evidence complements the contact sheet.
- [ ] Native-resolution and phone-size reviews are recorded separately.
- [ ] Caption timing and audio/listening checks remain part of normal QC.
- [ ] Final media, report, automated QC, editorial QC, and
      snapshot are current.
- [ ] Subjective impact and audience metrics are not claimed from technical QC.
- [ ] Content alignment is reviewed scene by scene and recorded separately from
      render correctness and aesthetic preference.
