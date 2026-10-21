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
