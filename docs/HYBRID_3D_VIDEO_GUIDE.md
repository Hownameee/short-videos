# Hybrid 2D/3D short-video guide

This guide records the recommended quality-first path for adding real 3D to the
workspace without turning captions, evidence, or the editorial workflow into a
3D-only system. It is grounded in the current checkout and official Remotion,
React Three Fiber, and glTF tooling documentation accessed on 2026-10-11.

## Decision

Use a **hybrid spatial-documentary format**:

- a continuous 3D world carries the story, camera, hero object, scale, and
  transformation;
- a crisp 2D editorial layer carries karaoke captions, labels, equations,
  sources, limitations, and the CTA;
- Blender supplies authored models, baked simulations, or pre-rendered passes
  when browser-native Three.js is not the best tool;
- Remotion remains the timeline, audio, caption, composition, and final-export
  authority.

The default technical path is stable WebGL through `@remotion/three` and React
Three Fiber. Treat `<ThreeWebGPUCanvas>` as an experimental branch for a shot
that specifically needs TSL or a WebGPU feature, not as the project baseline.

Render time is not a reason to reduce the visual ambition of a selected 3D
direction. Determinism, GPU limits, memory, asset loading, legibility, and
repeatable final export remain correctness requirements.

## Current repository status

The shared renderer currently contains only the Kubernetes 2D route. It has no
Three.js dependencies, 3D route, or `visual-map.json` consumer. The stack below
is guidance for a future approved 3D project; install and pin dependencies only
when that project needs them.

## Recommended production stack

| Layer | Recommended owner | Use it for |
| --- | --- | --- |
| Editorial timeline | Remotion | scenes, audio, captions, preview/final gates |
| Native 3D | `@remotion/three` + React Three Fiber + Three.js | cameras, lights, geometry, materials, GLB scenes |
| 3D helpers | `@react-three/drei` when justified | `useGLTF`, environment maps, reusable R3F helpers |
| Asset authoring | Blender | modeling, UVs, rigging, baked animation, simulations |
| Exchange format | GLB/glTF 2.0 | local, versioned delivery from Blender to Three.js |
| Optional model conversion | `gltfjsx` | typed reusable JSX, pruning, instancing, compression |
| Optional finishing | Three.js/R3F postprocessing | controlled bloom, depth of field, grading, vignette |
| Editorial overlay | DOM/SVG React components | captions, proof stamps, labels, numbers, CTA |

Pin every Remotion package, including `@remotion/three`, to the exact installed
Remotion version. Resolve React Three Fiber and Three.js versions against that
version and React 19, then lock them. Do not copy floating `^4.0.0` ranges from a
starter template into this reproducible renderer.

For this checkout, npm registry metadata for `@remotion/three@4.0.532` pins its
`remotion` dependency and peer to `4.0.532`, with peers `three >=0.137.0`,
`@react-three/fiber >=8.0.0`, and React/React DOM `>=16.8.0`. The current official
Three template uses React 19, R3F `9.2.0`, and Three `0.178.0`; those versions
were previously checked against registry metadata. They are examples, not
installed dependencies. Add helpers such as Drei or postprocessing only when a
concrete shot needs them.

## Why Remotion can support the format

`<ThreeCanvas>` is Remotion's wrapper around React Three Fiber's canvas. It
forwards Remotion context into the custom renderer and synchronizes the scene
with the Remotion frame. It requires explicit `width` and `height`.

During rendering, `<ThreeCanvas>` changes the R3F frame loop to `never` and
advances it on demand. Therefore:

- drive object, camera, light, shader, particle, and animation time from
  `useCurrentFrame()` and the composition FPS;
- do not use R3F `useFrame()`, wall-clock time, self-running shader time,
  uncontrolled physics, or unseeded randomness;
- use `layout="none"` for a Remotion `<Sequence>` nested inside the canvas;
- when a video texture updates asynchronously, use the current recommended
  headless `@remotion/media` `<Video>` approach and call R3F `advance()` in
  `onVideoFrame` before frame capture;
- keep render assets local and allow loaders to resolve before capture.

For Remotion 4, official guidance recommends `angle` on a desktop with a GPU
and `swangle` without one. Validate the actual renderer with
`npx remotion gpu`. Remotion documents a known ANGLE memory-leak risk for long
renders; split or render in sections if the selected design triggers it. Lower
concurrency can stabilize a large WebGL scene even when total render time is not
a concern.

## The visual system

### One spatial thesis

Give the 3D world one explanatory job. Examples:

- a deleted Pod falls out of a cluster, while the camera reveals the controller
  chain that reconstructs it.

If removing depth, camera, or transformation would not weaken the explanation,
the shot probably does not need 3D.

### Three depth planes

1. **World plane:** environment, scale, atmosphere, and distant context.
2. **Action plane:** the hero object, causal transformation, and current proof.
3. **Editorial plane:** stable 2D captions, labels, evidence, and platform-safe
   UI.

Do not place essential paragraphs or karaoke captions on receding 3D surfaces.
Short labels may be world-anchored only when their projected phone-size
legibility is verified.

### Cinematic grammar

- Open with an impossible or anomalous 3D state in the first second.
- Use one hero object as the viewer's guide.
- Let the camera reveal causality, not merely orbit decoration.
- Use one major scale or material transformation as the payoff.
- Alternate high-motion travel with intentional holds for comprehension.
- Reserve bloom, particles, lens treatment, depth of field, and camera shake for
  motivated moments. They must not obscure evidence or captions.
- End with a spatial state that can match-cut or loop back to the opening.

## Shot contract

For every 3D scene, record these decisions in `script.md`, `video.json`, or
production notes before JSX:

| Field | Question |
| --- | --- |
| `spatialPurpose` | What becomes clearer because the scene is 3D? |
| `heroObject` | What persistent object carries viewer attention? |
| `world` | What location or system surrounds it? |
| `camera` | Start/end position, target, lens/FOV, path, and hold? |
| `action` | What frame-driven transformation happens? |
| `lighting` | Key, fill, rim, environment, and reveal cue? |
| `layers` | Which information stays 3D and which stays DOM/SVG? |
| `transition` | Which object, motion, light, or silhouette connects shots? |
| `assets` | Source, license, local path, format, and version? |
| `proof` | What rendered frames or sequence demonstrate the intended action? |

If a new renderer consumes a formal contract, persist the same decisions in
`visual-map.json` with `narrationClaim`, `visualClaim`, `mode`, `why3d`,
`heroObject`, `action`, `cueWords`, `processSteps`, `finalState`, `domSupport`,
and `proofFrames`. Implement validation, fingerprinting, and the composition
input before treating the map as an enforced production contract.

## Asset pipeline

1. Block the scene with primitives and a simple camera path before making or
   downloading detailed models. This tests storytelling, not render speed.
2. Author hero assets in Blender when custom silhouette, rigging, UVs, or baked
   simulation materially improves the shot.
3. Export GLB/glTF with stable object and material names. Apply transforms,
   inspect normals and UVs, and include only supported baked animation.
4. Store the original source reference and license in `assets/sources.json`.
   Store render-consumed models, textures, HDRIs, and decoder files locally.
5. Load GLB through R3F `useLoader(GLTFLoader, ...)` or Drei `useGLTF()`.
   `gltfjsx` is optional when typed node access, reuse, pruning, instancing, or
   controlled compression is worth the extra tool.
6. Drive a baked clip deterministically by setting its mixer/action time from
   `frame / fps`; never let an animation mixer advance from elapsed wall time.
7. Inspect the model inside the real portrait camera and lighting rig. A model
   that looks good in Blender is not automatically readable in a 9:16 short.

For an effect better authored or rendered in Blender—complex fluids, destruction,
high-end volumetrics, or a photoreal hero close-up—render a deterministic image
sequence or alpha-capable intermediate and composite it in Remotion. Keep the
2D editorial layer and final audio/caption/QC pipeline in Remotion.

## Component architecture

Use a small reusable scene system rather than a single monolithic composition:

```text
Hybrid3DVideo
├── Audio and scene timeline (Remotion)
├── ThreeCanvas
│   ├── World
│   ├── CameraRig
│   ├── LightingRig
│   ├── HeroObject
│   ├── EvidenceObjects
│   └── restrained postprocessing
└── EditorialOverlay
    ├── scene labels and proof stamp
    ├── equations or source evidence
    └── shared KaraokeCaptions
```

Keep camera curves, lighting cues, palette, and hero-object behavior declarative
and project-driven where reuse is real. Do not build a universal 3D engine before
the first approved pilot exposes the repeated abstractions.

## Quality-first implementation order

1. Approve the editorial direction and script.
2. Map every narration claim to a domain object, causal action, narrated cue,
   and inspectable final state.
3. Produce three style frames: hook, hardest explanation, and payoff.
4. Build a low-material animatic with the final camera path and scene durations.
5. Validate semantic alignment, narrative continuity, and phone-size hierarchy.
6. Replace primitives with final GLB assets and authored materials.
7. Add lighting, environment, shadows, and restrained postprocessing.
8. Add the 2D editorial layer and word-timed captions.
9. Integrate music and SFX around spatial events.
10. Render a current preview and inspect stills plus consecutive frames.
11. Fix semantic and temporal defects, then render the final through the existing workflow.

## 3D-specific QC

In addition to the existing visual, caption, audio, and final-media checks:

- inspect first frame, hook reveal, camera turns, occlusion crossings,
  transformation peak, payoff, and loop boundary;
- inspect consecutive frames for camera jerk, texture pop, stale video texture,
  shadow noise, depth-of-field pumping, z-fighting, and autonomous animation;
- verify the same frame renders identically when sampled again;
- verify 2D text and captions remain stable while the camera moves;
- review at native 4K and phone size;
- check `MAX_RENDERBUFFER_SIZE` before assuming a different oversized WebGL
  canvas will work; the default 2160×3840 frame remains within the commonly
  encountered 4096-pixel per-dimension limit, but the actual GPU is authoritative;
- render with concurrency `1` first, then increase only after a repeatable pass;
- treat a clean contact sheet as still-image evidence, not proof of motion.

The complete operational checklist is in
[`short-video-hybrid-3d/references/review-checklist.md`](../.agent/skills/short-video-hybrid-3d/references/review-checklist.md).

## Adoption plan

Use one controlled content-first pilot before generalizing the renderer. Compare
it with the current infographic treatment using
semantic review first, then first-second hold, viewed-versus-swiped-away,
retention curve, completion, replay, shares, and comments. Technical success
does not establish comprehension or audience impact.

After the pilot reveals actual repetition, extract only the reusable camera,
lighting, model-loading, and overlay primitives. Then decide whether the shared
`video.json` contract needs a formal `hybrid3d` block and validator support.

## Primary sources

- [Remotion `@remotion/three` overview](https://www.remotion.dev/docs/three)
- [Remotion `<ThreeCanvas>`](https://www.remotion.dev/docs/three-canvas)
- [Remotion `<ThreeWebGPUCanvas>`](https://www.remotion.dev/docs/three-webgpu-canvas)
- [Remotion video as a Three.js texture](https://www.remotion.dev/docs/videos/as-threejs-texture)
- [Remotion GL renderer options](https://www.remotion.dev/docs/gl-options)
- [Remotion GPU rendering](https://www.remotion.dev/docs/gpu)
- [Official Remotion Three.js template](https://github.com/remotion-dev/template-three)
- [React Three Fiber model-loading guide](https://r3f.docs.pmnd.rs/tutorials/loading-models)
- [Drei `useGLTF`](https://drei.docs.pmnd.rs/loaders/gltf-use-gltf)
- [`gltfjsx`](https://github.com/pmndrs/gltfjsx)
