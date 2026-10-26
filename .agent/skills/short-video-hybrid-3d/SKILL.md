---
name: short-video-hybrid-3d
description: >-
  Design, implement, and review hybrid 2D/3D short videos in the shared Remotion
  renderer using Three.js, React Three Fiber, GLB/glTF, Blender passes, or a
  combination. Use whenever a selected direction, script, or production request
  mentions 3D, hybrid 2D+3D, spatial camera travel, @remotion/three, R3F, GLB,
  glTF, or Blender, or an existing 3D video needs stronger visual concepts,
  references, or purposeful motion instead of static, repetitive staging.
  Preserve workflow gates; exclude topic research,
  narration-only, soundtrack-only, generic 2D layout, and geographic flyovers.
compatibility: Repository-local Remotion 4 workflow; inspect pinned 3D dependencies and reuse existing authorization before requesting additions.
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
An authorized correction to an existing video covers scoped camera, blocking,
and timing changes that preserve the approved claims and narration; do not ask
again for the same authority. Follow production's revision rules when script or
design configuration changes invalidate approval.

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

### Explore visual ideas before selecting geometry

Translate the explanation into relationships and verbs first: uncertainty,
containment, competition, accumulation, branching, loss, recovery, or scale.
Explore a few materially different visual directions before committing to the
first available primitive: a literal mechanism, a familiar physical analogy,
and an unexpected but explainable association. For each, state the mapping,
strongest reveal, what depth adds, and where the analogy breaks. Choose for
comprehension, surprise, silhouette, and portrait-frame feasibility; these are
editorial judgments, not invented numeric quality scores.

Associations are starting points, not a stock-object dictionary. Probability
might suggest a coin, branching paths, a bag of unequal tokens, or a growing
distribution. A fair coin illustrates two equally likely outcomes; a biased
event needs unequal probabilities, and 50/50 does not promise exactly half of
every finite run. Show those assumptions when relevant. A queue might suggest
a checkout line, while congestion needs a bottleneck rather than unrelated
glowing cubes. Check both the mechanism and the limits of each metaphor.

When references would improve the direction, search the web using the concept,
physical analogy, motion technique, material, and composition, not just the topic
name. Prefer original studio work, scientific demonstrations, real objects, and
primary technical sources. Inspect actual images or clips where available.
Record source links and the specific lesson: silhouette, scale, lighting,
staging, transition, or reveal. Distinguish watching a clip from seeing its
thumbnail or reading its description. If browsing fails, label the reference
gap and proceed with explicit original hypotheses rather than claiming research.
Do not copy a reference's complete composition or use its assets without rights.

Turn the selected direction into visible choices: recognizable hero silhouette,
intentional material contrast, light separating subject from background,
controlled palette, depth/occlusion, negative space, and a deliberate scale or
inside/outside reveal. Spend detail on the focal object; simplify support. Test
the silhouette and focal point at phone size. Attractive lighting cannot rescue
an interchangeable metaphor; extra bloom cannot rescue weak staging.

Create contrasting style-frame candidates when the direction is unclear. When
the user already likes the look, preserve it and explore staging or motion
variants instead. Select the concept before polishing assets, then validate it
in the timed animatic below. Use 2D where it explains the relationship better.

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
objects have no clear domain role or explicit metaphor-to-domain mapping, or when its motion is only camera
travel, glow, orbit, or particles. Decorative 3D may support atmosphere, but it
cannot be the primary evidence for a narrated claim.

Before implementing the full timeline, make representative hook, hardest
explanation, and payoff style frames, then a low-material animatic with the
intended narration timing. Review both against the map or shot notes when the
map is not implemented. Attractive stills cannot establish pacing.

## Design motion across time

A persistent world does not require a persistent wide shot. One brief event per
scene can satisfy a motion checklist while leaving most of the video inert.
Before polishing materials, record a compact shot timeline in production notes:

| Decision | Record |
| --- | --- |
| Interval and cue | Start/end seconds or frames, narrated cue, information gained |
| Framing | Wide/medium/detail, subject size, focal point, start/end view |
| Subject action | Visible causal change, anticipation, transformation, settled result |
| Camera | Motivated reveal or tracking path, easing and stop; a locked camera is valid |
| Hold | Reading or comprehension purpose and duration |
| Connection | Cut, match action, or continuous movement; preserve identity and orientation |

Keep this as planning data unless the renderer actually consumes and validates
it; do not invent a supported schema. Derive cue times from the existing voice
manifest. For a plan without voice timing, mark durations as estimates.

Choose framing to expose new information: establish the system, move closer to
the mechanism, then reveal the consequence. Let the subject lead and the camera
support it. Use shot-size variation, progressive disclosure, assembly, transfer,
or state changes where the story benefits. Preserve useful holds, spatial
continuity and stable DOM captions; essential labels must survive camera moves.
Avoid perpetual orbit, idle bobbing, particles, arbitrary zooms, or fixed cut
quotas as a substitute for development. Not every shot needs a moving camera.

For an existing static-looking video, inspect its actual timeline and locate
intervals where neither the subject nor the information develops. Record their
timestamps and decide whether to shorten, reframe, add a causal action, or keep
the hold for an explicit reading purpose. Preserve the visual style that already
works. A hold around three seconds is a useful review flag, not an automatic
failure or a requirement to cut; dense explanations may need longer.

For example, reveal containment by moving from the complete object into its
interior, opening the shell on the cue, then holding the exposed mechanism.
For transfer, show origin, follow the same object to its destination, and settle
on the changed system. These patterns apply across topics; do not reuse a
topic-specific miniature for unrelated content.

## Review the animatic before polish

Render the hook plus the hardest action and its neighboring transition at the
intended timing/FPS with narration, using simple geometry if needed. Review at
normal playback speed and phone size before scaling the approach to the full
timeline. Compare old/new versions over the same interval when revising one.
This is a production check within existing authorization, not a new user-approval
gate. Keep the existing script and final-export gates.

Evaluate separately: semantic accuracy, pacing, readability, and temporal
integrity. Reject unexplained idle intervals, repetitive framing that hides new
information, movements that obscure a claim, and results that never settle.
Fix shot timing or staging before adding lighting polish or effects.
Consecutive frames help find pops and synchronization errors; contact sheets
show sampled composition. Neither proves normal-speed pacing. If playback or
listening is unavailable, mark that check not performed, retain the clip and
timecoded evidence, and do not report pacing or emotional fit as passed.

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
- normal-speed pacing, motivated framing changes, timecoded idle intervals,
  justified holds, and continuity across neighboring shots;
- consecutive frames for jerk, popping, z-fighting, focus pumping, stale video
  texture, or autonomous motion;
- caption/evidence stability over moving depth;
- repeated rendering of selected frames for determinism;
- native 4K and phone-size legibility;
- loop boundary when used.
- each narration claim versus the mapped object, action, and final state;
- hook, hardest explanation, and payoff without relying on captions alone;
- any object or effect that looks important but carries no domain meaning.

The contact sheet proves sampled appearance only. Retain consecutive-frame
evidence for temporal defects and playback evidence for pacing. A technical render pass does not establish that
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
7. shot timeline, animatic path, old/new intervals compared, pacing defects
   fixed, justified holds, and playback/listening checks not performed.

## Shared infrastructure and project ownership

Follow the [project renderer contract](../../../docs/PROJECT_RENDERER.md).
Keep topic scenes, visual maps, reference research, prompts, assets, and custom
scripts inside the selected project. Put only reusable components in shared
`renderer/src/`; tools accept project paths and explicit inputs. Never embed a
project ID, topic registry, character identity, or past approval in shared skills.
Deleting a project must not require changing shared tools or skills.
