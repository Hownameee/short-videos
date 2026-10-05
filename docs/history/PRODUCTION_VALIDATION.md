# Historical production validation

These records describe earlier revisions, not current test results.

## Background-sound workflow update

- `npm run test:video`: all 10 tests passed using the existing Node 24.21.0.
  The project-creation test verifies persistence of the sound default.
- Three edited skill frontmatters, local Markdown links, JSON examples, 12
  evaluation-case records and edited-file whitespace passed static checks.
- Added six sound-focused evaluation rubrics covering correction, inaudible
  background, voice-only override, unavailable listening, read-only advice and
  unapproved purchases. These are specified cases, not executed agent evaluations.
- Root `AGENTS.md` now routes to local video skills. Fresh-session activation and
  independent skill-performance comparisons have not been run.
- This workflow update did not regenerate media or change imported Remotion
  packages. Existing videos keep their current approval records and snapshots.

## Earlier caption and motion validation

- 10 Node workflow/preflight tests and 3 Python caption tests passed.
- Renderer ESLint/TypeScript passed; the existing 133-word karaoke boundary check passed.
- The shared generator synthesized a real two-chunk English sample: 15 words,
  5.975 seconds, with the second chunk correctly offset; it passed render preflight.
  An initial smoke-test assertion incorrectly expected 18 words; inspection of
  the actual 15-word input and generated manifest corrected that test expectation.
- A 3-second render using the extracted shared component decoded successfully;
  frames at 0.50/0.70/1.00 seconds showed Delete/one/Pod highlighted in sequence.
- Edited skill YAML, local links and six evaluation-case records parsed correctly.
  New evaluation cases are regression rubrics, not completed agent benchmarks;
  fresh-session skill activation was not measured.
- `git diff --check` was unavailable because the renderer no longer had Git
  metadata at the final check. A direct source whitespace check passed instead.
  Existing video MP4s and archived project source snapshots were not regenerated.
