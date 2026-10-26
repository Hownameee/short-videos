# Shared Remotion renderer

This workspace contains an empty Studio composition (`EmptyWorkspace`) and shared
caption/audio components. No video project or production renderer is bundled.
The default canvas remains 2160×3840 at 60 fps.

## Start and validate

Use the repository-selected Node environment (currently Node 24.21.0).
From workspace root:

```bash
npm --prefix renderer run dev
npm --prefix renderer run lint
npm --prefix renderer run build
npm run test:video
```

## Add a topic renderer

Follow the [project renderer contract](../docs/PROJECT_RENDERER.md). Each video
owns its `renderer/` entry and scenes plus `render.json`. Reuse shared captions,
audio and types here. No shared topic imports or route registry are required.

```bash
npm run video -- preflight --project projects/NNN-topic
npm run video -- render --project projects/NNN-topic --preview
npm run video -- render --project projects/NNN-topic --final
```

Replace `NNN-topic` with the project actually created. The CLI stages assets and
voice under project `.cache/public/workflow/`, validates input checksums and captions, and
normalizes output audio. Final requires a current preview fingerprint and media
validation. See [production defaults](../docs/VIDEO_PRODUCTION_DEFAULTS.md).

Pinned Three.js/R3F dependencies and the [3D guide](../docs/HYBRID_3D_VIDEO_GUIDE.md)
remain available for future spatial scenes; no example 3D composition remains.
