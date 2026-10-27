# Shared tools

Run commands from the repository root.

| Directory | Responsibility |
| --- | --- |
| `audio-kokoro/` | Kokoro narration and captions, voice samples, voice assembly, soundtrack generation, audio-library management, and their Python tests |
| `render/` | Workflow CLI, approval/state management, renderer integration, media/caption QC, and their JavaScript tests |
| `mascot/` | Reserved for mascot generation/compositing tools; no active backend |

Project-specific generators, scenes, and review scripts stay under
`projects/NNN-topic/`. Shared tools accept project paths as inputs.

```sh
npm run video -- help
npm run test:video
.venv-kokoro/bin/python -m unittest discover -s tools/audio-kokoro -p 'test_*.py' -v
```

The npm commands are unchanged; their implementation now lives in `render/`.
For direct commands, replace `tools/kokoro/` and `tools/audio/` with
`tools/audio-kokoro/`, and replace root-level `tools/*.mjs` paths with
`tools/render/*.mjs`.

Examples:

```sh
.venv-kokoro/bin/python tools/audio-kokoro/generate_audio.py --project projects/NNN-topic
.venv-kokoro/bin/python tools/audio-kokoro/assemble_voice.py --project projects/NNN-topic --pause 0.8
python3 tools/audio-kokoro/library.py list
```

Render fingerprints include the new tool paths. Existing videos and historical
render snapshots are preserved; create a fresh preview before another final
export. See [production instructions](../renderer/README.md).
