# LongCat Avatar 1.5 on a rented GPU

Prepare inputs locally, clone this workspace on a Linux rental, generate the
whole mascot in one job, and retrieve it for local matting and compositing.
The rental only needs this Python pipeline and its model runtime. Read
[CONTEXT.md](CONTEXT.md) when resuming as an agent and record every rental fix in
[REMOTE_FIXES.md](REMOTE_FIXES.md).

## Target and execution contract

- Ubuntu 22.04 x86_64, RTX 3090 Ti with 24 GB VRAM, 64 GB system RAM, working
  NVIDIA driver, and at least 100 GB available disk for weights, packages and
  intermediate output. Choose the CUDA 12.4 / Ubuntu 22.04 template if available.
- Python 3.10, Torch 2.6 CUDA 12.4, and a matching official FlashAttention wheel.
  The driver must support CUDA 12.4; an installed CUDA compiler is unnecessary.
- LongCat-Video-Avatar 1.5 INT8, distilled eight steps, 480p, native 25 fps,
  `TALKER_LOWVRAM=1`, `TALKER_VRAM_RESERVE_GB=9.5`.
- Production uses one image, one complete speech WAV, one prompt and one
  invocation to preserve continuity. Choose pilot validation per project; a
  previous project’s decision to skip a pilot is not a shared default.
- LongCat internally uses temporal windows with 13 frames of conditioning,
  carried latent/KV state, and the original image reference. Long audio is not
  processed as one simultaneous diffusion window.

The 480p offload settings completed a historical 31-second rental run. The
720p alternative failed with OOM on the same memory class. The new scripts have
been checked locally; their first GPU end-to-end execution is still pending.
The current release pins are in [runtime-lock.json](runtime-lock.json), including
model revisions and the selected model files. The official code revision has
been inspected for compatibility; it is not claimed to be the exact revision
used by the old rental.

## Prepare before renting

Run from the repository root with Python 3.10+ and FFmpeg/ffprobe available:

```bash
python3 tools/mascot-longcat/prepare.py \
  --presenter assets/presenters/presenter.png \
  --project projects/NNN-topic
python3 tools/mascot-longcat/run.py \
  --job projects/NNN-topic/remote/longcat/job.json --dry-run
```

`prepare.py` copies the complete `output/voice/full.wav` byte for byte, flattens
the presenter's alpha over a neutral background, writes a restrained speaking
prompt, and hashes the prepared inputs. It writes the following small bundle:

```text
projects/NNN-topic/remote/longcat/
  job.json
  presenter.png
  full.wav
  prompt.txt
```

Use `--presenter`, `--audio` or `--prompt-file` to select different inputs.
Use `--name longcat-vi` to keep a second job and its results separate:

```bash
python3 tools/mascot-longcat/generate_vi_voice.py \
  --text projects/NNN-topic/remote/longcat-vi/narration.vi.txt \
  --output projects/NNN-topic/remote/longcat-vi/full.wav
python3 tools/mascot-longcat/prepare.py \
  --presenter assets/presenters/presenter.png \
  --project projects/NNN-topic \
  --name longcat-vi \
  --audio projects/NNN-topic/remote/longcat-vi/full.wav
python3 tools/mascot-longcat/run.py \
  --job projects/NNN-topic/remote/longcat-vi/job.json --dry-run
```

Supply your own translated narration text. `generate_vi_voice.py` requires a
local Python environment with VieNeu TTS 3.8.3 and `huggingface_hub`; it is not
run on the rental. Set `HF_HOME` to an existing model cache to reuse weights.
No prepared narration or job bundle is included.
The visual prompt can remain in English; the WAV supplies the spoken language.
For a rental, pass `remote/longcat-vi/job.json` to `launch.sh`, then pass the
same path with `--job` to `fetch.py`. Its result is saved as
`output/mascot/mascot-longcat-vi.mp4`, with matching `longcat-vi-*` diagnostics.
This profile accepts near-9:16 portraits (height/width between 1.70 and 1.865),
which the pinned model maps to 480×832. Other aspect buckets need an explicit
profile update before paying for generation.
Reprepare after changing narration or portrait. The default prompt describes the
supplied reference presenter; supply a matching prompt for specific
portraits. The original transparent portrait stays available locally as a mask
reference. The prepared RGB image is intentionally opaque because LongCat emits
RGB video.

The bundle is outside ignored generated output folders, so it can be committed
with these scripts. Commit and push the bundle and tool files before renting;
the remote must clone the commit containing both. Model weights, environments,
logs and generated output stay ignored. The final Remotion video is unnecessary
on the GPU host; local compositing reads it after retrieval.

## Clone and launch on the rental

Connect using the **current rental's** SSH details. If this repository is
private, use normal SSH agent forwarding or a read-only deploy key for clone;
never embed a token in the clone URL. Replace `PUBLISHED_BRANCH` with the branch
actually pushed (use your actual branch):

```bash
git clone --single-branch --branch PUBLISHED_BRANCH \
  https://github.com/Hownameee/short-videos.git
cd short-videos
git rev-parse HEAD
bash tools/mascot-longcat/launch.sh --install-system \
  projects/NNN-topic/remote/longcat/job.json
```

On a bare Ubuntu template, `--install-system` installs the missing OS packages
as root. Omit it if Python 3.10, venv, Git, FFmpeg and other prerequisites
are already installed. The launcher detaches with `nohup`, stores its PID, and
runs setup followed immediately by the full inference. Reconnecting does not
require relaunching. A file lock prevents overlapping pipelines in this runtime.

Setup creates `tools/mascot-longcat/.runtime/talker/.venv/` and the pinned vendor
source. It installs dependencies while a separate lightweight download
environment fetches the selected Avatar and base weights. It avoids the unused
31.7 GB full-precision Avatar transformer and duplicate Whisper weights.
The vocal separator model is still required by upstream initialization even
though clean narration uses `--no-vocal-sep`.

The selected 39 model files total approximately 41.74 GiB. Download validation
uses pinned revisions and exact file sizes by default; `download_models.py
--verify-only --sha256` additionally reads and checks the large LFS weights when
corruption is suspected. The default avoids a second full read of every weight
on the paid machine. Linux/Python 3.10 dependencies are resolved in
`requirements.txt`, whose checksum is recorded in the runtime lock. Setup also
records the installed package freeze. A guarded patch changes final H.264 encoding from
`slow` to `medium` at the same CRF 16 and records its diff; it does not alter
denoising or temporal conditioning.

For setup without generation, use:

```bash
bash tools/mascot-longcat/setup.sh --install-system
```

For foreground generation after setup:

```bash
tools/mascot-longcat/.runtime/talker/.venv/bin/python -u \
  tools/mascot-longcat/run.py \
  --job projects/NNN-topic/remote/longcat/job.json
```

## Monitor and return the result

The launcher prints the session log and exit-code path. It also writes the
current session directory to `.runtime/latest-session.txt`. Inspect the setup
logs while packages and weights download; generation progress is in
`projects/NNN-topic/.cache/longcat/render.log`. GPU metrics are
sampled every 30 seconds into `gpu.csv`. Use about a three-second SSH connection
timeout and 10–30 second status intervals during paid work, adapting to expected
stage duration. Do useful independent work between checks.

Success requires session `exit-code` equal to `0`, report status `complete`,
and the MP4 checksum matching the report. Run the following **locally**, replacing
all uppercase values with the new rental details:

```bash
python3 tools/mascot-longcat/fetch.py \
  --host root@GPU_HOST --port GPU_PORT \
  --identity ~/.ssh/YOUR_GPU_KEY \
  --remote-root /root/short-videos \
  --project projects/NNN-topic
```

SSH host verification remains enabled; establish the trusted connection once
before a batch transfer. Only the public key belongs in the remote
`authorized_keys`. The private key stays local. Transfers reuse an SSH control
connection. `fetch.py` compares the job and video SHA-256, checks duration/FPS,
and fully decodes the downloaded MP4 on the local machine before accepting it.

The returned artifacts are:

| Path in the project | Purpose |
| --- | --- |
| `output/mascot/mascot-longcat.mp4` | Full talking presenter, opaque background |
| `output/docs/longcat-run.json` | Input hashes, runtime pin, timings, output hash and media metadata |
| `output/docs/longcat-context.tar.gz` | Setup/render logs, GPU metrics, source revisions and tracked source diffs |

Then run background removal and FFmpeg compositing locally. The existing
EchoMimic matting helper assumes a 384×672 input and must be adapted to the
actual LongCat output dimensions before reuse; fetching does not launch matting.
This prepared portrait profile expects 480×832. Keep local `final.mp4` audio
when compositing to retain narration and soundtrack.

## Failures and reusable fixes

- Do not restart an active job after an SSH disconnect. Inspect the PID, logs
  and exit marker first. Model download caching resumes downloads; a failed
  inference is not automatically resumed from its intermediate MP4.
- Setup rejects mismatched hardware/runtime assumptions before inference.
  Keep the original error. Do not repeat an OOM with identical settings or
  silently reduce quality. Record the phase and required change first.
- Fetch with `--context-only` to retrieve setup logs and source diffs after a
  failure. It also retrieves any available run report, render log, GPU metrics
  and `longcat-context.tar.gz`, without requiring a completed video.
- Apply every remote code fix to the corresponding local source or guarded
  patch, then add the cause, exact change, evidence and validation scope to
  `REMOTE_FIXES.md`. Copy newly created remote source files explicitly: Git
  diffs do not contain untracked files. Never include credentials in that context.
- Do not stop the paid machine until the MP4 and needed diagnostics have been
  retrieved and their integrity verified.

The wrapper uses eight distilled steps, no interpolation and no extra lip-scale
Whisper pass. Import/configuration/file checks run without a sample render.
Do not claim this is the absolute fastest configuration: the baseline is the
fastest practical starting point supported by this workspace's prior successful
24 GB run. Further offload tuning needs measurements on the new rental.
