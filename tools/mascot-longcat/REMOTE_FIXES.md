# LongCat remote fix journal

Keep this file in the local repository. Its purpose is to make the next rental
start with fixes already encoded in scripts and context. Never store passwords,
tokens, private SSH keys, credential-bearing URLs or private connection details
here. Use a neutral run identifier rather than an SSH endpoint.

## Procedure for every remote change

1. Capture the failing stage, command, relevant error and current source/runtime
   versions. Redact credentials before copying any log locally.
2. Make the smallest supported fix and record its exact diff or command. Keep
   the failure log. Do not hide an error by weakening an unrelated check.
3. Apply the same change to its canonical local script or configuration promptly.
   If the fix patches downloaded upstream code, encode a revision-checked patch
   in local setup so a new clone reproduces it. Record the expected upstream
   revision and the reason for the patch.
4. Record the narrow validation actually performed. Use static/import/input checks first, then a project-appropriate pilot
   and the authorized production run. Approval from a previous project does
   not authorize a new remote run.
5. Retrieve the relevant redacted logs and exit records while the rental exists.
   Update [CONTEXT.md](CONTEXT.md) or [README.md](README.md) if the change affects
   the next operator's commands or decisions.
6. Review local Git changes. Commit/push only when authorized; ensure any remote
   checkout used for a future run contains the fixes and required inputs.

## Prior validated lessons included in the baseline

These observations came from the earlier rental. They do not certify the next
machine or a newly pinned dependency set.

| Symptom or waste | Applied resolution | Evidence and scope |
| --- | --- | --- |
| FlashAttention source installation expected missing `nvcc` | Use official FlashAttention 2.7.4.post1 wheel matching cp310, Torch 2.6, CUDA 12, C++ ABI FALSE | Setup and complete 480p run succeeded on Python 3.10 / Torch 2.6.0+cu124 |
| Avatar setup downloaded unused full-precision DiT weights | Exclude Avatar `base_model/*` while retaining `base_model_int8/` and required auxiliary/base files | Reduced download supported the successful 31-second INT8 run; approximately 31.7 GB avoided |
| 720p generation failed at denoising step 1 | Use the observed 480p configuration with `TALKER_LOWVRAM=1` and `TALKER_VRAM_RESERVE_GB=9.5` | Full 31.07-second input completed; 720p had also failed with low-VRAM mode |
| Weight download and environment setup were unnecessarily serial | Run a separate lightweight downloader while PyTorch and dependencies install | Previous rental completed both model downloads before upstream setup reached its download phase |
| Package download route was slow | Verify an alternate mirror's wheel against canonical PyPI digest before using the mirror | A 62.2 MB OpenCV wheel downloaded in 11 seconds on the observed route; network advantage is host-specific |
| Input transfer stalled | Start transfer early and compare content hashes, retry only incomplete transfer | Filename or partial size alone did not establish completion |
| SSH handshake stalls and interrupted sessions | Reuse a control connection and keep paid jobs persistent with logs and exit records | Reconnection could inspect an ongoing job without starting another render |
| Confusing memory utilization with VRAM occupancy | Read compute, allocated VRAM, power and phase together | Successful snapshot: compute 100%, 21,017 / 24,564 MiB VRAM, 375 W; memory-controller counter was 25% |

## New rental entries

No new remote changes have been applied during local preparation. Replace this
sentence with dated entries when a rental is actually accessed. Use the
following structure for each independent fix; record uncertain outcomes as
unverified rather than filling in a success claim.

```markdown
### YYYY-MM-DD — RUN_ID — Short description

- Stage: host / setup / download / input / inference / retrieval.
- Environment: GPU/VRAM, system RAM, OS, Python, Torch/CUDA, relevant dependency
  versions, workspace commit and upstream revision.
- Symptom: exact relevant error or measured slowdown, with a redacted log path.
- Cause: evidence establishing the cause; mark an inference when unconfirmed.
- Remote change: exact command or revision-checked diff; include changed pins
  and relevant environment variables.
- Local reproduction: canonical script/configuration path updated and how the
  next clone obtains the fix. State explicitly if local sync is still pending.
- Validation: commands performed, exit codes and actual output. Distinguish
  import/static checks from a complete model run.
- Time impact: measured elapsed time or saved bytes; label any estimate.
- Artifacts: local copies of redacted log, manifest, output hash and probe data.
- Outcome: resolved / workaround / unverified / blocked; residual limitation.
```

The run is not ready to hand off while a remote-only code fix is missing from
the local repository. Download the patch and evidence before the host disappears.
