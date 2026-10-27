# Production plan: Saturn’s rings aren’t solid

1. Research NASA’s description of ring particles; avoid uncertain origin and age claims.
2. Choose the inside-the-ring journey over a race-only comparison: stronger scale reveal and recognizable hook.
3. Approve the four-beat script under the user’s explicit delegation. Generate English narration and retain predicted word timestamps.
4. Build original native R3F geometry. No new dependencies or external model assets. A warm banded Saturn contrasts with cool faceted ice. Black space preserves negative space.
5. Prototype hook, ice close-up, and return-to-planet frames, then render an animatic before final export. Keep all animation frame-driven.
6. Compose a short original musical progression with a brighter payoff. Mix against actual narration.
7. Render 1080×1920 / 60 fps preview, inspect representative frames, consecutive motion frames and karaoke words. Export 2160×3840 / 60 fps H.264/AAC through the shared workflow and retain QC.

## Spatial scene notes

| Scene | Spatial purpose / hero / world | Camera and action | Lighting / layers / proof |
|---|---|---|---|
| illusion | Ring plane around a persistent Saturn; establish distance illusion | Angled wide view becomes closer on “closer”; rings occupy more of frame | Warm key, cool rim; stable headline/captions; first frame and close approach |
| ice | Separate faceted ice fragments occupy a shallow plane | Track along the plane as fragments translate along orbital direction; reveal clear gaps on “pieces” | Cool ice, warm highlights; composition preserves readable empty lower region; separated objects |
| scale | Fragment sizes span grains to a house-sized piece; illustrative comparison | Large ice enters foreground on “house”; small grains remain behind | Same materials; scale label; small/large comparison proof |
| payoff | Separate orbital lanes form the familiar ring silhouette | Highlight two tracers at different angular rates on “speeds”; pull back and settle | Warm planet, pale rings, cyan paths; final recognizable silhouette |

Each scene has one explanatory action and two stable text lines. Rendered geometry is illustrative: particle count, separation, sizes and speeds are exaggerated for visibility. No claim of a physically simulated fly-through. Ring system does not split apart as a physical event: close-up is an editorial change of scale.

## Sound
Original score: E minor/add9 curiosity, C major warmth, G major lift, D resolving to E. Soft bell arpeggio and low rounded bass; no horror drone or oversized impacts. Fade in 0.3s, fade out 2s; no additional SFX. Static gain under narration is measured; no claimed automated ducking.

## Review limits
Normal-speed playback, listening and actual phone-speaker checks are separate from sampled image and measured audio checks. Mark unavailable checks not performed.

## Measured timeline and review

- 0.00–6.83s: planet-wide hook; push toward rings on “closer”; hold the familiar silhouette before changing scale.
- 6.83–15.42s: particle-scale pass; visible gaps distinguish separate pieces; moving ice shows a common local travel direction.
- 15.42–22.90s: small fragments, foreground large fragment reveal on “house”, then an editorial return to planet scale on “far”. The hero translates into frame rather than growing.
- 22.90–31.05s: two orbital tracers travel at different angular rates; camera pulls back and settles for the takeaway.

The first 2.7 seconds hold the familiar ring silhouette to establish the misconception. Later holds preserve caption reading while particles or tracers move. No perpetual camera orbit. Camera views and spacing are illustrative, not an orbital mechanics simulation.

Style frames revealed fine ring-line moiré; replaced disjoint narrow annuli with a continuous band shader. Shifted the 3D viewport upward to keep ice clear of the scale disclaimer. Fixed the size demonstration to translate a large object into view instead of physically growing it. Hook/ice transition animatic retained at output/docs/evidence/animatic.mp4. Normal-speed playback not performed; sampled temporal evidence inspected separately.

Native backend: ANGLE Metal, Apple M5 Pro. Maximum renderbuffer and texture size 16384, above final canvas dimensions. Concurrency 1. The shared renderer now accepts optional validated gl/concurrency settings from render.json; existing projects retain defaults.

Applied guidance: short-video-workflow, discovery, script, production, hybrid-3d, visual-design, Kokoro, Remotion markup/rendering, core reasoning/code quality, Node environment, Git inspection and technical documentation. Topic/script/production decisions were delegated by the original user request.
