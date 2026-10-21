---
name: short-video-visual-design
description: >-
  Design and review a coherent visual system for short-form video before and
  during Remotion implementation. Use for video art direction, scene UI,
  typography, layout, color, diagrams, captions, motion, transitions, platform
  safe areas, or visual-quality review. Use Remotion skills separately for API,
  timeline, media, Studio, and rendering behavior; do not use this skill for
  narration-only or research-only work.
compatibility: Repository-level visual direction for vertical short-video projects using the shared Remotion renderer.
---

# Short Video Visual Design

Own the visual language and quality bar. Read the approved `script.md`,
`video.json`, target platform, audience, and available assets before writing or
reviewing scene UI. Preserve explicit brand rules and user references.

This skill decides composition, hierarchy, art direction, and motion intent. The
imported Remotion skills remain authoritative for JSX structure, APIs, timing,
media handling, Studio, and rendering.

For real 3D or hybrid 2D/3D work, this skill continues to own phone-scale
hierarchy, typography, palette, captions, and safe areas; route spatial
cinematography, model/Blender flow, deterministic Three.js behavior, and
3D-specific QC to `../short-video-hybrid-3d/SKILL.md`.

## Define the visual system before JSX

Write a compact `design` block in `video.json`, or record the same decisions in the
project's production notes when the schema is not implemented yet:

- **Visual thesis:** one sentence connecting the look to the video's promise.
- **Mood:** two or three compatible adjectives; avoid a bag of unrelated trends.
- **Palette roles:** background, surface, primary text, muted text, accent, and
  semantic success/warning/error colors when the story needs them.
- **Typography roles:** display, supporting copy, caption, and monospace/data when
  appropriate. Prefer one family with a small weight range; add a second family
  only when it creates a clear editorial contrast.
- **Spatial system:** content bounds, alignment grid, spacing rhythm, corner and
  stroke language, and a platform-specific safe area.
- **Motion grammar:** entrance, emphasis, transition, and exit behavior. Reuse a
  small set of motion ideas instead of inventing a new effect in every scene.
- **Asset language:** photography, illustration, icon, screenshot, code, diagram,
  texture, and color-treatment rules.

Do not start detailed UI from vague words such as “modern” or “beautiful.” Convert
them into visible choices. If the script has no clear visual thesis, choose the
smallest system that fits the audience and subject and record the assumption.

## Compose for a phone screen

- Give each beat one dominant focal point and one intended reading order.
- Make the first frame communicate topic or tension without waiting for narration.
- Use on-screen text as editorial emphasis, labels, or evidence. Do not paste the
  full voiceover onto the canvas outside the caption layer.
- Keep text, proof, and primary action inside a platform-safe rectangle declared
  in project data. Preview overlays for the actual target platform; do not assume
  one universal TikTok, Shorts, and Reels safe area.
- Check the composition at roughly phone size. A layout that works only when the
  full-resolution canvas fills a desktop monitor does not pass.
- Default delivery is 2160×3840 at 60 fps. A 1080×1920 authoring coordinate system
  is acceptable when the entire layout, including captions, scales uniformly.
  Use seconds for motion, configured fps for frame conversion, and inspect native
  output frames as well as phone-size previews.
- Reserve negative space around the focal point. Empty space is part of hierarchy,
  not an area that must be filled with particles, cards, badges, or icons.
- Use depth intentionally: background establishes context, middle ground carries
  the explanation, and foreground holds the current emphasis or caption.
- Keep spatial relationships stable across related scenes so the viewer does not
  have to relearn the layout after every cut.

## Typography and information density

- Establish a clear display, supporting, and caption hierarchy. Adjacent levels
  must differ enough in size, weight, position, or color to be recognized quickly.
- Break lines by meaning. Avoid a stranded short word, awkward noun phrase split,
  or constantly changing line width.
- Keep most frames to one claim, one comparison, or one action. Reveal complex
  diagrams progressively instead of presenting every node at once.
- Use labels next to the object they explain. Avoid legends that force the viewer
  to look back and forth on a small screen.
- Give code, numbers, charts, and UI screenshots enough size to be read. Crop to
  the exact evidence instead of shrinking an entire desktop screen into the frame.
- Captions use at most two lines in normal scenes, group words by phrase, maintain
  high contrast over changing backgrounds, and highlight the current spoken word
  by default. Apply selective editorial emphasis to titles separately. Use measured
  word times, keep punctuation attached, and avoid changing line layout when the
  active word changes. See [production defaults](../../../docs/VIDEO_PRODUCTION_DEFAULTS.md).

## Color, imagery, and consistency

- Choose colors by role, then reuse those roles. Do not introduce a new accent
  because a later scene feels empty.
- Maintain readable contrast for text and essential diagram edges. Add a solid or
  translucent backing when imagery makes contrast unstable.
- Use gradients, glow, glass, noise, and shadows only when they support the chosen
  art direction. Stacking all of them is not a substitute for hierarchy.
- Keep icon stroke, illustration perspective, photography treatment, and diagram
  geometry consistent within one video.
- Prefer evidence-bearing visuals: the real output, a focused screenshot, a
  before/after, a process, or a diagram that explains causality. Decorative stock
  footage should not replace proof.
- Verify image resolution and crop at final portrait dimensions. Do not stretch,
  upscale visibly broken assets, or hide watermarks and license marks.

## Motion and transitions

Motion is a default requirement for these videos. Plan a visible, topic-specific
action for each explanatory beat: an object moves, splits, disappears, fills,
connects, or changes state in time with narration. Pair entrances with an action
inside the scene. A title fade, tiny decorative pulse, camera drift, or progress
bar over an otherwise static diagram does not fulfill this requirement. Use
intentional holds to let a result register; do not add arbitrary constant motion.

- Every motion answers one of four jobs: orient, reveal, emphasize, or connect.
  Remove movement that does none of them.
- Animate with a consistent tempo and easing family. Let important text settle long
  enough to read before moving it again.
- Preserve continuity when two scenes share an object: move, resize, recolor, or
  relabel that object instead of replacing the entire canvas without motivation.
- Use cuts for a new idea, match movement for a relationship, and stronger
  transitions only for a real section change. Avoid applying a transition between
  every sentence.
- Alternate dense/high-energy moments with simpler holds. The payoff and takeaway
  often need less motion so the result can register.
- Coordinate visual emphasis with narration, music, and SFX. Do not make every
  layer peak at the same time.

## Avoid the generated-template look

Reject these patterns unless the art direction specifically justifies them:

- every scene as a centered rounded card;
- unrelated gradients and glowing blobs behind all content;
- pill badges used as decoration rather than status or category;
- constant bounce, zoom, spin, particle, or typewriter effects;
- a different font, icon family, radius, or transition in each scene;
- fake dashboards and charts that do not communicate real information;
- tiny screenshots surrounded by large decorative UI;
- captions, headline, labels, and CTA all competing at the same visual weight.

Originality comes from a topic-specific visual metaphor, evidence, layout, and
motion relationship. It does not require maximal decoration.

## Review before final render

Before approving visual QC, read
[`references/visual-review-checklist.md`](references/visual-review-checklist.md).
Render or capture the first frame, hook end, midpoint of each major beat, payoff,
and CTA as `.cache/review/contact-sheet.png`. Inspect the actual preview at full resolution
and at phone scale; a TypeScript build or isolated component screenshot is
insufficient. Also inspect playback or consecutive frames through each important
movement and at successive word boundaries. Retain this sequence evidence with
the QC report; the contact sheet alone cannot prove animation or karaoke sync.

Do not pass final visual QC while any critical issue remains: unreadable text,
unclear focal point, platform UI collision, broken asset, misleading visual,
caption/proof overlap, unexplained style change, or motion that hides information.

## Output contract

Report:

1. the chosen visual thesis and system;
2. the scene-level visual decisions that materially support the story;
3. the contact-sheet and phone-scale checks performed;
4. visual issues fixed and any residual limitation.

Do not claim that a video “looks professional” without inspecting rendered frames
or a preview. State when the result was assessed only from source code.

## Routing examples

Use this skill for:

- “Design the Remotion scenes so this Docker video looks premium.”
- “Review the hierarchy, captions, transitions, and mobile readability.”
- “Create a consistent visual style for a series of Shorts.”

Do not use it as the primary skill for:

- writing narration with no visual plan;
- fixing a Remotion codec, render, or API error;
- designing a web application UI unrelated to video.
