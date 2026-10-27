# Workflow benchmark status

No current project-backed performance benchmark is bundled in this checkout.
Removed project media and evaluation snapshots must not be cited as current
validation evidence. Run a new benchmark on an implemented, approved project.

Use the [benchmark protocol](../.agent/skills/short-video-workflow/references/benchmarking.md)
for paired baseline/current runs, matching inputs and explicit limitations.
Separate runtime measurements, visual review, narration timing and listening.
Report unavailable telemetry as unavailable; do not substitute character counts
for model tokens or infer visual quality from render speed.

Current regression checks are `npm run test:video` and
`npm --prefix renderer run lint`. They verify workflow behavior and source
correctness, not a finished video's aesthetics or emotional fit.
