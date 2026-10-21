---
name: short-video-hybrid-3d
description: >-
  Design, implement, and review hybrid 2D/3D short videos in the shared Remotion
  renderer using Three.js, React Three Fiber, GLB/glTF, Blender passes, or a
  combination. Use whenever a selected direction, script, or production request
  mentions 3D, hybrid 2D+3D, spatial camera travel, @remotion/three, R3F, GLB,
  glTF, or Blender. Preserve workflow gates; exclude topic research,
  narration-only, soundtrack-only, generic 2D layout, and geographic flyovers.
compatibility: Repository-local Remotion 4 workflow; 3D dependencies are optional and require approval before installation.
---

# Hybrid 2D/3D short-video production

Own the repository-specific bridge between an approved spatial art direction and
a deterministic, reviewable Remotion implementation. The phase skills still own
research, direction choice, script approval, voice, final export, and global QC.

Read [the hybrid 3D guide](../../../docs/HYBRID_3D_VIDEO_GUIDE.md) for the
technical rationale and source-backed stack. Read the
[content-alignment contract](references/content-alignment.md) before scene
planning and the
[3D review checklist](references/review-checklist.md) before preview approval.

## Boundaries and gates

- During discovery, contribute only feasibility, asset, and visual-risk notes;
  `short-video-discovery` owns the direction choice.
- During scripting, define the spatial purpose, hero object, camera, action,
  layers, assets, and proof for each 3D scene; `short-video-script` owns approval.
- During production, require an approved script plus an explicit production
  request. Use `short-video-production` for narration, sound, preview/final,
  and delivery gates.
- Use `short-video-visual-design` for hierarchy, typography, captions, palette,
  and platform-safe composition. This skill owns 3D cinematography, asset flow,
  deterministic scene behavior, and 3D-specific QC.
- Use imported Remotion guidance for current APIs. Read
  `../remotion-markup/3d.md` before JSX and use `../remotion-docs/SKILL.md` to
  verify version-sensitive behavior. Do not modify imported `remotion-*` skills.
- Route geographic terrain or city flyovers to `remotion-maps`.

Do not bypass the direction or script gate because a user asks for an impressive
3D result. Do not install new production dependencies until the user explicitly
approves that dependency change.

## Choose the rendering path

Select the path shot by shot:

| Path | Choose when | Keep in Remotion |
| --- | --- | --- |
| Native R3F | camera, geometry, materials, lights, particles, data-driven systems | full 3D scene plus editorial overlay |
| Blender asset + R3F | custom model, rig, UVs, or baked animation is needed but interactive camera/light control matters | camera, lighting, timing, overlays |
| Blender-rendered pass | fluids, destruction, volumetrics, or photoreal shots exceed a sensible browser implementation | timeline, composite, captions, audio |
| Hybrid | the strongest shots need authored passes while explanatory objects remain procedural | final assembly and all editorial evidence |

Default to stable `<ThreeCanvas>`. Use `<ThreeWebGPUCanvas>` only for a proven
TSL/WebGPU need and record its experimental status and fallback behavior.

## Establish the spatial story

Before JSX, state:

1. the explanatory job that requires depth;
2. the persistent hero object;
3. the world and scale relationship;
4. the camera's start, reveal, and settled payoff;
5. the single major transformation;
6. which information remains in the stable 2D editorial layer.

Reject decorative 3D that would explain the same thing equally well as a static
card. Use the camera to reveal causality, scale, layers, or simultaneity.

For each 3D scene, record `spatialPurpose`, `heroObject`, `world`, `camera`,
`action`, `lighting`, `layers`, `transition`, `assets`, and `proof`. Keep these in
the approved script/configuration or production notes; do not create an
unvalidated schema and imply the current CLI enforces it.

## Pass the content-alignment gate

Treat content alignment as a production input, not a subjective note added after
rendering. For a hybrid renderer that supports it, create `visual-map.json`
against the approved `scriptVersion` before JSX. Give every scene exactly one
entry containing:

- the narration claim and the visual claim that must be visible;
- `2d`, `3d`, or `hybrid` mode and a concrete reason depth helps;
- the persistent hero object, causal action, and final state;
- narrated action/reveal/settle cue words that exist in the voice timings;
- two to four readable process steps and stable DOM support;
- the representative proof frames needed to review the intended transformation.

No current renderer consumes this map. When implementing a hybrid renderer, add
preflight checks for approval, scene coverage and narrated cue words, include the
map in the preview fingerprint, and pass it to the composition before relying
on it as a production contract.

Reject a scene when its visual claim could fit unrelated narration, when its
objects cannot be named in domain language, or when its motion is only camera
travel, glow, orbit, or particles. Decorative 3D may support atmosphere, but it
cannot be the primary evidence for a narrated claim.

Before implementing the full timeline, make representative hook, hardest
explanation, and payoff frames or a low-material animatic. Review them against
the map. A technical frame is not approved merely because it is attractive.

## Build deterministically

- Wrap 3D content in `<ThreeCanvas width={width} height={height}>`.
- Drive camera, object, light, shader, particle, and animation time from
  `useCurrentFrame()` and `fps`.
- Do not use R3F `useFrame()`, wall-clock time, self-running shaders,
  uncontrolled physics, or unseeded randomness.
- Use `layout="none"` for `<Sequence>` inside the canvas.
- For baked animation, set mixer/action time from the Remotion frame instead of
  calling `play()` and allowing elapsed time to advance it.
- Keep render assets local. Record source, license, transformation, and checksum
  information with project assets.
- Use the recommended headless `@remotion/media` video-texture path. During
  rendering, call R3F `advance()` from `onVideoFrame` after updating the texture;
  `invalidate()` alone can capture stale frames.
- Seed procedural placement and particle state from stable project data.
- Re-render the same sampled frame to expose nondeterministic output.

Preserve the shared DOM/SVG karaoke and evidence layer outside the 3D canvas.
World-anchored text is supplemental and must pass projected phone-size review.

## Prepare assets

1. Block the final camera and durations with primitives.
2. Use Blender for hero models, UVs, rigs, or baked simulation that improves the
   selected shot.
3. Prefer GLB/glTF for Blender-to-R3F exchange. Preserve stable object and
   material names and inspect transforms, normals, UVs, and baked clips.
4. Use `useLoader(GLTFLoader, ...)` or Drei `useGLTF()` for local models.
   Consider `gltfjsx` only when typed node access, reuse, pruning, instancing, or
   controlled compression provides concrete value.
5. Keep decoder files, textures, HDRIs, models, and render-consumed media local;
   do not rely on a remote asset or CDN during final rendering.
6. Recheck every asset inside the portrait camera and final lighting rig.

Adding `three`, `@react-three/fiber`, `@remotion/three`, `@types/three`, Drei, or
postprocessing changes the production dependency graph. Ask for approval, pin
all Remotion packages to the exact repository version, resolve compatible React
19 versions, and update the lockfile atomically. Do not copy floating starter
template ranges.

## Compose for impact and comprehension

- Open on an anomalous spatial state within the first second.
- Follow one hero object through a continuous cause-and-effect journey.
- Use key/fill/rim or an equivalent intentional lighting hierarchy.
- Use material, scale, light, or topology transformation for the main payoff.
- Alternate movement with settled reading holds.
- Keep bloom, depth of field, camera shake, particles, and lens treatment
  subordinate to the explanatory action.
- Preserve one dominant focal point and keep captions, proof, and CTA inside the
  declared platform-safe area.
- End on a spatial state that resolves the promise and can loop or match-cut to
  the opening when appropriate.

## Configure and validate rendering

The current renderer is Remotion 4.0.532. For native WebGL 3D:

1. inspect the available backend with `npx remotion gpu`;
2. configure `angle` for a desktop GPU or `swangle` without one;
3. start with render concurrency `1` and raise it only after repeatable output;
4. check the actual WebGL maximum render-buffer size before exceeding the final
   canvas dimensions;
5. keep preview FPS and timing identical to final; preview scale changes only
   resolution;
6. split a long render if ANGLE memory growth makes it unstable.

Do not call a blank WebGL frame a renderer defect until the GL backend,
asset-loading state, and capture behavior have been checked.

## Preview and QC

Run the existing preflight and preview path. In addition to normal production
QC, inspect:

- hook anomaly and first camera reveal;
- every camera turn and object/camera near-crossing;
- model, texture, environment, and shadow readiness;
- transformation peak and payoff hold;
- consecutive frames for jerk, popping, z-fighting, focus pumping, stale video
  texture, or autonomous motion;
- caption/evidence stability over moving depth;
- repeated rendering of selected frames for determinism;
- native 4K and phone-size legibility;
- loop boundary when used.
- each narration claim versus the mapped object, action, and final state;
- hook, hardest explanation, and payoff without relying on captions alone;
- any object or effect that looks important but carries no domain meaning.

The contact sheet proves sampled appearance only. Retain consecutive-frame or
playback evidence for motion. A technical render pass does not establish that
the 3D concept is impressive or improves retention; record subjective review
and later platform metrics separately.

## Report

Report:

1. chosen native/Blender/hybrid path and why;
2. spatial thesis, hero object, camera reveal, and payoff transformation;
3. dependencies and assets added or still awaiting approval;
4. GL backend, concurrency, preview, frame-sequence, mobile, and deterministic
   checks performed;
5. final artifacts and any unperformed subjective or device review.
6. content-alignment evidence and any scene that remains illustrative rather
   than explanatory.
