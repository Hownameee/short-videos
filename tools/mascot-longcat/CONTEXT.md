# LongCat remote generation context

## Read this when

Use this file when preparing or operating a metered Linux GPU rental for
LongCat-Video-Avatar 1.5 in this repository. Read [README.md](README.md) for the
current commands and [REMOTE_FIXES.md](REMOTE_FIXES.md) for fixes already
captured locally. This is agent context, not an installed skill.

The target rental is one **RTX 3090 Ti, 24 GB VRAM, 64 GB system RAM**. The
remote machine generates the opaque talking-presenter MP4. The local machine
removes its background and composites it onto the Remotion video.

## Current user requirements

- Optimize elapsed rental time from connection to a verified local copy.
- Submit the complete narration WAV and presenter image in one generation
  invocation. Do not split the WAV into independently generated clips, feed
  exported last-frame PNGs back into separate jobs, or concatenate those jobs.
- A model's native temporal windows are an implementation detail of a single
  full-audio run. Explain that distinction when reporting how this pipeline
  works; do not promise one simultaneous denoising pass for an arbitrary-length
  video on 24 GB VRAM. If the pinned implementation cannot meet the requested
  generation contract, report that before spending GPU time on another method.
- **Skip the old three-second render gate.** The current user explicitly
  overrides the short-test requirements in the historical research notes.
  Inspect hardware, imports, dependency compatibility and input files, then run
  the complete audio. Do not generate a pilot, benchmark clip or alternate
  resolution first.
- Keep setup, model downloads, input availability checks and documentation work
  concurrent wherever they do not mutate the same environment or files.
- Persist every remote fix into the local repository before the rental ends.
- Wait for connection details supplied for this rental. Historic hosts,
  passwords and keys in chat or research are not authorization to connect.

## Evidence carried forward

These are observations from the previous rental, not measurements of the next
host or a guarantee for a longer input:

| Item | Previous successful run |
| --- | --- |
| Runtime | Linux x86_64, Ubuntu 22.04, Python 3.10 |
| PyTorch | 2.6.0+cu124 |
| Attention | FlashAttention 2.7.4.post1 prebuilt wheel, Python cp310, Torch 2.6, CUDA 12, C++ ABI FALSE |
| Model path | LongCat-Video-Avatar 1.5 INT8 through `palamedes/talker` |
| Historical Talker revision | `7e6de7d0054575ae4eefbbf63c2469346b822765` |
| Generation settings | `480p`, `TALKER_LOWVRAM=1`, `TALKER_VRAM_RESERVE_GB=9.5`, clean TTS audio with vocal separation disabled |
| Result | 31.070-second WAV produced a 31.080-second H.264/AAC MP4, 480×832 at 25 fps; downloaded SHA-256 matched remote |
| Mid-run GPU snapshot | 100% compute utilization, 21,017 / 24,564 MiB VRAM, 375 / 450 W, 68 °C |
| Mid-run host snapshot | About 35 / 60 GiB RAM used, 24 GiB available; CPU saturation was not evident |
| Offloading | Six of 53 DiT submodules were offloaded in that run |
| Known failed setting | 720p hit CUDA OOM at the first denoising step, including with the low-VRAM settings above |

Use the pinned versions in the current setup scripts as the execution source
of truth. The table explains the baseline choice. Start with the proven 480p
low-VRAM configuration; one moment of unused VRAM is not evidence that disabling
offload will improve total completion time. The historical output had an
unnatural mouth-color artifact in some frames. A successful process is not a
visual-quality pass.

The pinned LongCat inference code uses eight distilled denoising steps, 93-frame
windows and 13 conditioning frames at 25 fps. A continuation adds 80 new frames.
The initial reference latent stays available to each continuation, alongside
the preceding video/latents and KV cache. Model loading, audio features and
prompt preparation are reused inside the full run. The current 57.033-second
WAV needs 18 native windows, then trims the output to the supplied audio. This
does not use the EchoMimic workflow's repeated last-RGB-frame initialization.

## Before the rental starts

1. Finish the local presenter PNG, complete narration WAV and motion prompt.
   Prepare the portable job using the README command. Record their hashes,
   dimensions, duration and output destination. Keep machine-specific absolute
   paths out of the portable job.
2. Ensure the intended Git commit contains both the execution scripts and the
   job's required inputs. An input present locally under an ignored output
   directory will not appear in a fresh clone. Check the commit's file list;
   do not assume pushing code also publishes generated media. The base Remotion
   video is only needed locally for later compositing.
3. Keep weights, virtual environments, caches and credentials out of Git. The
   remote setup obtains the pinned model files directly from their sources.
4. Read the prepared installer and generation command locally. Resolve syntax,
   argument and dependency issues now. No paid GPU is needed for these checks.
5. Prepare output retrieval and local destination paths. Ensure the local
   matting/compositing environment is available while the remote job runs.

## Repository contract

Run commands from the repository root. For the existing project, preparation
uses:

```bash
python3 tools/mascot-longcat/prepare.py \
  --project projects/001-kubernetes-self-healing
```

The portable bundle is
`projects/001-kubernetes-self-healing/remote/longcat/`, containing `job.json`,
`presenter.png`, `full.wav` and `prompt.txt`. These are the files a remote clone
needs alongside the code. Confirm that the WAV covers the complete narration.
The sibling `remote/longcat-vi/` has Vietnamese narration following the same
Kubernetes story. Its source text is `narration.vi.txt`; its full WAV is
generated locally with `generate_vi_voice.py` and the VieNeu `Mai Anh` voice.
For this job, pass `remote/longcat-vi/job.json` to `launch.sh` and `fetch.py
--job`; its video and diagnostics use the `longcat-vi` suffix. Recreate it
after a voice change with `prepare.py --name longcat-vi --audio PATH`.

After cloning the prepared revision on the remote host, the setup and
generation entrypoints are:

```bash
bash tools/mascot-longcat/setup.sh
tools/mascot-longcat/.runtime/talker/.venv/bin/python tools/mascot-longcat/run.py \
  --job projects/001-kubernetes-self-healing/remote/longcat/job.json
```

For the paid run, use the persistent launcher instead of executing the two
commands interactively:

```bash
bash tools/mascot-longcat/launch.sh \
  projects/001-kubernetes-self-healing/remote/longcat/job.json
```

It starts setup followed by the complete generation and keeps the process alive
across SSH disconnects. Runtime files live under `tools/mascot-longcat/.runtime/`.
The launcher prints its session log and `exit-code` path under that runtime's
`logs/`; `latest-session.txt` identifies the most recent launch. Project
generation logs are under the project's `.cache/longcat/`.

The generation result is
`projects/001-kubernetes-self-healing/output/mascot/mascot-longcat.mp4`, with
`output/docs/longcat-run.json` describing the run. The local `fetch.py` entrypoint
accepts `--host`, `--port`, `--identity`, `--remote-root` and `--project` for the
current rental. It requires working key or SSH-agent authentication because it
uses `BatchMode=yes`. It retrieves and verifies the LongCat output and diagnostics.
Use the exact syntax in the README, then perform matting and composition locally.
The existing EchoMimic outputs remain available for comparison during retrieval.
Use `--context-only` to retrieve setup logs and source diffs after a failed run;
this mode does not download a video. A source diff does not include untracked
files, so copy any newly created remote source files separately and record their
local destination in the fix journal.

## Rental critical path

| Track | Start as soon as | Work | Completion evidence |
| --- | --- | --- | --- |
| Access and machine inventory | Current SSH details arrive | Connect, record GPU/driver, OS, RAM and free disk; check checkout revision | Inventory saved with the run |
| Environment | Platform matches the installer | Install required OS packages and the dedicated runtime; use the compatible prebuilt attention wheel | Setup exit code and import/compatibility checks |
| Weights | The small downloader runtime is ready | Download the INT8 Avatar files and only required base-model components | All downloader workers exit successfully; expected files verified |
| Inputs | Checkout or upload is available | Verify the complete WAV, PNG, prompt and hashes; prepare the exact output path | Input manifest matches actual files |
| Local preparation | Remote work is in progress | Review logs/source, update context, prepare local matting and retrieval | Local changes and retrieval command ready |
| Generation | Environment, weights and inputs are ready | Launch the full WAV once in a persistent job | Exit code, complete output and duration/frame metadata |
| Delivery | Generation finishes | Retrieve MP4, metadata and logs; compare hashes | Verified local copy |

Use separate environments for package installation and weight downloading when
the setup provides them. Do not run competing package installers into one
virtual environment. Avoid launching duplicate model downloads for the same
destination. Use the downloader's bounded concurrency and observe throughput;
more simultaneous connections can slow a shared network route.

Do not wait for large model files before checking scripts, staging inputs or
writing context. Do not run local background removal or Remotion rendering on
the rented host. Do not tune settings or modify imported code underneath an
active generation process.

## Runtime and recovery rules

- The provider's CUDA label is driver capability, not proof that a CUDA toolkit
  or `nvcc` is installed. Match the installed Python, PyTorch, CUDA wheel and
  C++ ABI before choosing a FlashAttention binary. The known prebuilt route
  avoids compiling FlashAttention and installing a full toolkit just for it.
- The INT8 path loads `base_model_int8/`. The prior reduced download excluded
  the unused Avatar `base_model/` directory, saving about 31.7 GB. Required base
  tokenizer, text encoder and VAE files must still be downloaded. Follow the
  current manifest; never infer success from a nonempty directory.
- Keep the setup/render process alive across SSH disconnects. Use the README's
  persistent-job command, a dedicated log and an exit record for each run.
  A partial MP4 or stale exit file does not prove success.
- Allow about three seconds for an SSH connection check. Poll long downloads,
  installs and renders at stage transitions, normally every 10–30 seconds or
  less often for quiet long phases. Read a bounded log tail and exit status;
  avoid repeated full logs and repeated handshakes. Reuse an SSH control
  connection when available.
- On reconnect, inspect the existing job before starting a replacement. Keep
  working downloads and completed caches. Do not launch a second full render
  because the local SSH session was interrupted.
- On OOM, preserve the failing phase and memory evidence. Change the relevant
  allocation/offloading setting before a retry. Do not blindly rerun a known
  failing 720p command or add an unrequested short test.
- A slow package route was a real prior bottleneck. If switching to a mirror,
  verify downloaded wheel hashes against authoritative package metadata. Do
  not disable TLS verification or trust a faster mirror without provenance.

## Return to local and close the rental

Check the remote process exit code, MP4 streams, dimensions, frame rate and
duration against the full narration. Download the generated mascot and its
manifest/logs. Compare the remote and local SHA-256 before reporting that the
remote work is complete. Preserve the original local output until the returned
file has passed these checks.

Run background removal, final compositing, full decode and visual/listening
review locally. Do not report lip sync, motion continuity or matting quality as
checked merely because FFmpeg decodes the file. Retrieve the evidence needed
for diagnosis and update [REMOTE_FIXES.md](REMOTE_FIXES.md) before telling the
user the rental is no longer needed. Stopping or deleting the rental is a
separate action; do not terminate it merely because rendering finished.

## Provenance and validation boundary

This context consolidates the previous local research notes
`research/mascot-new/GPU_SESSION_PLAYBOOK.md`,
`research/mascot-new/LONGCAT_AVATAR_1_5_RTX3090.md` and
`research/mascot-new/GPU_UTILIZATION.md`. Those ignored files need not be present
in a remote clone. Historical three-second gates are superseded by the current
user request above. No new rental has been connected or validated by preparing
these files. Record its actual results in the fix journal and run artifacts.
