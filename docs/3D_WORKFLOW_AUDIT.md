# 3D workflow audit and Kubernetes visual experiment

Inspected 2026-10-26: repository instructions, first-party video phase and visual
skills, hybrid references/evals, workflow/production validation, shared renderer,
project 001 approval/script/voice timeline, and presenter-generation context.
Evaluation archives and downloaded model runtimes were excluded. This is an
audit of the current checkout, not a comparison against unavailable older 3D MP4s.

## Findings

1. **Documentation outran executable capability.** `Composition.tsx` originally
   registered only `ShortVideo`, and `production-config.mjs` accepts only the
   Kubernetes route. There was no 3D scene implementation or consumed visual map.
   The hybrid guide accurately disclosed this, but a detailed proposed stack
   could still be mistaken for a working capability.
2. **Local dependency state was not reproducible.** Three 0.178.0, R3F 9.2.0,
   @remotion/three 4.0.532 and @types/three 0.178.1 were installed as extraneous
   packages. With explicit user permission, they are now exact manifest/lockfile
   dependencies. No previously locked package version changed. Install scripts
   were disabled. Three/R3F/types use MIT licenses; existing Remotion licensing
   remains applicable. npm audit reports 11 advisories (10 high, 1 moderate), all
   in packages already present before this change, principally the Remotion
   toolchain's zod and fast-uri paths. This task did not upgrade that toolchain.
3. **Quality rules are mostly prose.** The content map is a proposed contract,
   not an enforced renderer input. The skill evals primarily score plans.
   Passing TypeScript, technical media QC, or routing evals does not show that a
   viewer understands a camera move or finds a shot attractive.
4. **No executable visual baseline comparison existed.** A proper experiment
   needs the same narration, timestamps and frame positions for both versions,
   plus motion evidence. New study tooling renders a 2D baseline and repeats a
   3D frame to check determinism before exporting the video.
5. **Presenter generation solves a different problem.** LongCat/EchoMimic animate
   a presenter and matte/composite it; they do not supply domain-specific 3D
   scenes. Remote rental context must not become a prerequisite for local 3D.
6. **Historical staged projects are not current source projects.** `renderer/public`
   contains several old topic folders, but `projects/` currently contains only
   project 001. Staged assets alone cannot establish approval or a valid route.

## What deserves 3D in this story

Use depth for container-inside-Pod, a new object moving onto a node, and spatial
fan-out from a stable Service to ready endpoints. Use simple counts and stable
2D labels for desired versus actual state. Keep limitations and the test-cluster
CTA in 2D. Avoid a universal neon-node world: it obscures domain distinctions.

The implemented study uses a persistent miniature with beveled ivory shells,
mint application cores, blue infrastructure, amber missing/pending states,
contact shadows and restrained camera changes. Titles and karaoke remain DOM.
The application core is visible inside the shell and revealed by lifting its lid.
Pod D is a new identity after Pod C disappears. Placement is a schematic of
scheduling, not a claim that Kubernetes repairs hardware or resurrects a Pod.

The reference board is a starting point, not proof that every scene should be
3D. For a final editorial revision, spend the strongest 3D shots on the hook,
containment and replacement, and allow simpler diagrams wherever they explain
the controller relationships more clearly. The current 57-second study keeps
the complete approved narration to make that judgment possible.

## Research actually performed

- Google query `3d technology explainer animation isometric servers` returned a
  JavaScript/access challenge; no Google result ranking or image review is claimed.
- [Ordinary Folk work](https://www.ordinaryfolk.co/work): read the portfolio index,
  including Spline, Twilio and Webflow references; individual films were not played.
- [BUCK work](https://buck.co/work): read the portfolio descriptions, including
  IBM Think and technology campaigns. Visually inspected the IBM Think cover:
  sculpted forms, coherent blue material treatment and contact shadows. This is
  still-image evidence only, not a motion analysis of the film.
- [Kubernetes ReplicaSet](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/):
  checked the desired-count/replacement relationship against the primary source.
- [Remotion ThreeCanvas](https://www.remotion.dev/docs/three-canvas): checked
  frame-driven synchronization and explicit canvas dimensions.

No external artwork was incorporated. Procedural geometry is original; existing
project voice/music retain their existing provenance.

## Reproduce the experiment

From workspace root, load the documented installed Node 24.21.0 environment.
Dependencies are pinned in `renderer/package-lock.json`.

```bash
node tools/render-3d-study.mjs
node tools/render-3d-study.mjs --video
npm --prefix renderer run lint
npm run test:video
```

The command runs the existing production preflight, validates its narration cue
words, stages local media, and renders the `Kubernetes3DStudy` composition with
ANGLE and concurrency 1. It saves the input fingerprint. The still command
renders representative scenes, a 2D baseline and a repeated hook PNG; unequal
repeat bytes fail the command. The video command produces
`kubernetes-3d-study.mp4`, normalizes its audio through the shared helper, fully
decodes it and checks encoded loudness/true peak. Outputs live under project 001 `output/3d-study/`.
Chromium requires execution outside this machine's filesystem sandbox.

`remotion gpu` failed because headless Chrome could not load `chrome://gpu`.
Actual ANGLE still and video rendering worked; do not infer a GPU model or a
tested maximum render-buffer size from that. The study is 1080×1920 at the
approved project's native 30 fps, not an upscaled 4K60 claim.

This experiment intentionally does not mark project state produced, replace the
canonical final, or imply that `visual-map.json` is implemented. The standard
CLI retains its existing 2D route. The study's shot notes are in
[3D-STUDY.md](../projects/001-kubernetes-self-healing/3D-STUDY.md).

## Concrete workflow improvement

For the next production route, use this order: reference images with attributed
sources → three content-specific style frames → narration-cued animatic →
phone-size and consecutive-frame review → full render → encoded media QC.
Promote a study to a production route only after its scene contract is validated,
included in fingerprints, and consumed by the renderer. Keep aesthetic review,
semantic accuracy, technical checks and listening outcomes separate. Do not
expand the skill collection merely to compensate for a missing implementation.
