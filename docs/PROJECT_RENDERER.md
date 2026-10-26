# Project-owned renderers

Shared tools and skills apply to every video. Each project's content, character,
scene code, custom scripts, assets, remote jobs and outputs stay inside
`projects/NNN-topic/`. Shared `renderer/src/` contains reusable captions, audio,
types and components. Extract a component only when reuse is real.

Before production, create `render.json` in the selected project:

```json
{
  "schemaVersion": 1,
  "entryPoint": "renderer/index.tsx",
  "compositionId": "ShortVideo",
  "sceneIds": ["hook", "explanation", "payoff"]
}
```

The entry must be a real file inside that project's `renderer/` directory.
Register a Remotion root there using `registerRoot`, with a `Composition` whose
ID matches the manifest. Implement topic scenes beside this entry. Import shared
components via `../../../renderer/src/` from the entry directory; import React,
Remotion and Three normally. The shared bundler resolves installed dependencies
from root `renderer/node_modules`; do not copy node_modules into projects.

The workflow passes `video`, `voiceManifest`, optional `audioTimeline`,
`assetRoot` and `renderMode` as props. Derive dimensions, fps and duration from
these approved inputs using Remotion `calculateMetadata`. Implement the approved
caption/audio settings. Use `staticFile` with `assetRoot` for staged project media.
`meta.renderer` is legacy descriptive metadata, not a global dispatch registry.
Storyboard overrides remain unsupported by the shared pipeline and fail visibly.

```bash
npm run video -- preflight --project projects/NNN-topic
npm run video -- render --project projects/NNN-topic --preview
npm run video -- render --project projects/NNN-topic --final
```

Preflight requires the manifest and validates scene IDs. `--composition`, if
provided, must match the manifest. Preview uses half resolution. Final requires
a current preview and retains existing audio, caption, approval and media checks.
The shared Studio command displays infrastructure only; production previews use
the project entry automatically via the commands above.

Staged public media lives in project `.cache/public/`; bundle output is temporary.
Render fingerprints include project `render.json`, all project `renderer/` files,
assets and narration, shared source, tooling and dependency lockfile. Changing
another project's sources does not invalidate this project's preview. Finalization
rejects changed inputs. Removing a project requires no shared registration edits.

Presenter tools require `--presenter <path>`: choose a project asset or an explicit
shared library asset. Shared tools never select a character or inherit a previous
project's remote-run approval. Visual imagination and motion guidance belongs in
the reusable hybrid-3D skill; the chosen metaphors and shot plans belong in the project.
