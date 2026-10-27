# Wan2.2-S2V on a rented RTX 3090

Prepare inputs locally, generate only a talking presenter remotely, and fetch
one MP4 plus diagnostics. No video compositor, background removal, upscale,
frame interpolation, or narration generation runs on the GPU host.

**Status:** locally checked scripts and fixtures; actual CUDA inference, memory
fit, visual quality, and lip sync on a 3090 have not yet been verified.
[Official Wan S2V](https://github.com/Wan-Video/Wan2.2#run-speech-to-video-generation)
documents at least 80 GB VRAM for its original inference path. This implementation
uses native ComfyUI S2V, FP8 scaled weight storage, CPU offload and tiled VAE decode
to target 24 GB. It does not guarantee fit or a particular render time.

## Prepared profile

- Linux x86_64, RTX 3090 24 GB, 64 GB host RAM; NVIDIA driver compatible with CUDA
  12.4. The launcher never installs or changes the GPU driver/toolkit.
- Portrait **480 × 832, 16 FPS, 160 frames, 10 seconds**. Native S2V audio
  conditioning uses 16 FPS. This is not a 24/30 FPS export.
- Two sequential 81-frame sampling chunks, with latent motion context passed
  to the second chunk. The template's first-latent repair precedes tiled decode;
  discard three leading decoded frames and select 160 frames. Lip-sync alignment
  and the chunk boundary still require visual review on real inference.
- 20 sampling steps, CFG 6, shift 8, `uni_pc` / `simple`, fixed seed 270022.
- FP8 is weight storage; no fast FP8 matrix-multiply flag is enabled on Ampere.
- ComfyUI v0.3.60 at the immutable commit in [runtime-lock.json](runtime-lock.json),
  Python 3.11.14 and PyTorch 2.6.0+cu124. No custom nodes or LoRA downloads.
- Four model files: **24,015,552,011 bytes / 22.37 GiB**. Allow at least 60 GiB
  free disk for weights, wheels, environment and intermediates. Preflight counts
  cached complete weights toward this budget on a resumed setup.

The committed [Saturn job](../../../projects/002-saturn-rings/remote/wan-s2v/job.json)
uses the complete existing `ice` narration scene (7.975 seconds), padded with
2.025 seconds of silence, in mono PCM16 / 16 kHz. It does not cut any words.
The shared presenter remains at `assets/presenters/presenter.png`; runtime pads
it to 480 × 832 and composites transparency over light gray. Sources/checksums
are in the project's `input-manifest.json`. Original narration and final videos
are untouched. Audio listening and generated-video review are pending.

## 1. Establish SSH once from the local repository

Prerequisites on the local Mac: Python 3.9+, OpenSSH including `ssh-copy-id`,
rsync, FFmpeg/ffprobe. Use the existing ckey key pair; do not generate another key
or copy the private key to the rental host or GitHub.

Replace `GPU_HOST` and `GPU_PORT` with the new rental details. These commands
use `root`; add `--user NAME` to all transport commands if the account differs.

```bash
python3 tools/mascot/remote/ssh.py bootstrap --host GPU_HOST --port GPU_PORT
```

The default identity is `~/.ssh/ckey_n3_ed25519`. The script displays the public
key fingerprint and uses `ssh-copy-id` to append only a missing public key.
Verify the server host-key fingerprint against the provider, then enter the
rental password if requested. A fresh key-only connection must succeed before
bootstrap reports success. Existing installed keys can avoid the password prompt.
An encrypted private key may still need its passphrase or your local SSH agent.

Later commands use batch authentication and multiplex connections for five
minutes. Agent forwarding is disabled. Passwords/private keys are never stored
in this repository; host records live in ignored `tools/mascot/.runtime/ssh/`.

## 2. Clone the prepared revision

On the rental host, clone this repository into `/root/short-videos` and check out
the exact commit prepared for this task. Replace `PREPARED_COMMIT` with that hash.
Use an existing repository access method if GitHub requires authentication;
the ckey public key authenticates your Mac to the GPU, not the GPU to GitHub.
Do not upload your local private key to solve repository authentication.

```bash
python3 tools/mascot/remote/ssh.py exec --host GPU_HOST --port GPU_PORT -- \
  git clone --branch remote-gpu --single-branch https://github.com/Hownameee/short-videos.git /root/short-videos
python3 tools/mascot/remote/ssh.py exec --host GPU_HOST --port GPU_PORT -- \
  git -C /root/short-videos checkout --detach PREPARED_COMMIT
```

For an existing checkout, inspect its state first and fetch the desired commit;
do not overwrite local changes. For a private repository without remote GitHub
credentials, send a local `git archive PREPARED_COMMIT` over the authenticated
SSH connection instead. Models are public and require no Hugging Face token.

## 3. Start one detached job

Run this from the local repository after SSH bootstrap:

```bash
python3 tools/mascot/remote/ssh.py exec --host GPU_HOST --port GPU_PORT -- bash -lc \
  'cd /root/short-videos && mkdir -p tools/mascot/wan-s2v/.runtime && nohup bash tools/mascot/wan-s2v/launch.sh projects/002-saturn-rings/remote/wan-s2v/job.json > tools/mascot/wan-s2v/.runtime/launch.log 2>&1 < /dev/null &'
```

The launcher requires host `python3` and an operational NVIDIA driver. As root
on Ubuntu it installs missing git/curl/FFmpeg/rsync/util-linux packages through
apt. A non-root account must have those packages provisioned beforehand.
It then bootstraps checksum-pinned uv 0.9.5 and managed Python 3.11.14 inside the
ignored runtime directory, without changing the host Python.

After preflight, two processes run concurrently:

1. Fetch pinned ComfyUI and install the hashed Linux wheel lock, then check pip
   dependencies and perform a small CUDA tensor operation.
2. Download two model files at a time, resume `.part` files, verify exact sizes
   and SHA-256, then atomically promote them to the cache.

Inference starts only when both succeed. The launcher holds a single-job lock.
ComfyUI listens on loopback only, disables custom nodes, and is terminated after
the job. Do not launch parallel inference on this GPU. There are no automatic
OOM rerenders or additional trial clips. Inference has a four-hour timeout;
this is a limit, not an estimated duration. Rental billing remains under your
control; the scripts do not terminate the rental instance.

Read progress and completion from the local machine:

```bash
python3 tools/mascot/remote/ssh.py exec --host GPU_HOST --port GPU_PORT -- \
  tail -n 40 /root/short-videos/tools/mascot/wan-s2v/.runtime/launch.log
python3 tools/mascot/remote/ssh.py exec --host GPU_HOST --port GPU_PORT -- \
  cat /root/short-videos/tools/mascot/wan-s2v/.runtime/exit-code
```

`running` means active; `0` means success; any other numeric exit code means
failure. Setup logs are `.runtime/dependencies.log` and `download.log`.
Inference diagnostics are `.runtime/runs/TIMESTAMP/{comfy.log,gpu.csv,...}`.
Successful output is `projects/002-saturn-rings/output/mascot/wan-s2v/` with
`mascot.mp4`, `run.json`, workflow and logs. It is published only after checking
frame count, dimensions, FPS, audio/video duration and a full FFmpeg decode.
Existing successful output is never silently overwritten.

## 4. Fetch only the result

```bash
python3 tools/mascot/remote/fetch.py --host GPU_HOST --port GPU_PORT \
  --remote-root /root/short-videos --project projects/002-saturn-rings
```

rsync resumes partial transfers and includes only the result and diagnostics.
The receiver compares MP4 SHA-256 against `run.json`, checks media structure and
fully decodes it before moving it into local `output/mascot/wan-s2v/`.
A failed transfer remains in the project cache for retry. Weights and environments
stay on the rental machine. Inspect the returned video for identity, lip sync,
chunk continuity and expression before using it in the final local composition.

## Recovery

- **SSH host key changed:** verify the new provider fingerprint before updating
  the specific entry in the isolated known_hosts file. Never disable checking.
- **Download interrupted:** rerun launch after the previous worker exits; curl
  resumes partial files. A hash mismatch requires moving the reported corrupt
  file aside before retrying. Successful cache receipts match size, mtime and
  expected SHA; deleting a receipt forces a full rehash on the next setup.
- **Missing wheel/dependency or CUDA failure:** inspect `dependencies.log`.
  The installer uses only wheels with hashes and fails instead of compiling on
  billed GPU time. Ubuntu installation itself still needs remote validation.
- **OOM:** inspect `comfy.log` and `gpu.csv`. The job stops and preserves
  diagnostics. Do not repeatedly rerun unchanged settings; memory strategy or
  hardware must be reassessed. No 24 GB success has been claimed yet.
- **Existing output:** archive it explicitly before another render/fetch.
- **Instance stopped during work:** partial downloads remain reusable only if
  the provider preserves the disk. Successful remote output is not a local
  backup until fetch completes.

## Local verification and preparation

```bash
python3 -m unittest discover -s tools/mascot/wan-s2v/tests -v
bash -n tools/mascot/wan-s2v/launch.sh
python3 -m compileall -q tools/mascot/wan-s2v tools/mascot/remote
```

Tests cover project checksums/audio contract, connected chunk graph, frame math,
cache integrity/resume command behavior, path containment, SSH options, API error
handling and real synthetic MP4 validation. They do not load GPU weights.

For another project, select a complete narration excerpt no longer than ten
seconds and use a local Python with Pillow plus FFmpeg:

```bash
.venv-kokoro/bin/python tools/mascot/wan-s2v/prepare.py \
  --project projects/NNN-topic --audio /path/to/selected.wav \
  --presenter assets/presenters/presenter.png
```

The default profile remains portrait 480p / ten seconds. The project example
workflow is a review artifact; `run.py` builds its graph from `job.json`.

## Provenance

- [ComfyUI native S2V documentation](https://docs.comfy.org/tutorials/video/wan/wan2-2-s2v)
- [Official workflow template](https://github.com/Comfy-Org/workflow_templates/blob/main/templates/video_wan2_2_14B_s2v.json)
- [ComfyUI v0.3.60](https://github.com/Comfy-Org/ComfyUI/tree/v0.3.60), GPL-3.0.
- [Repackaged model repository](https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged),
  Apache-2.0 model metadata; immutable revision/individual checksums in runtime-lock.
- [uv 0.9.5](https://pypi.org/project/uv/0.9.5/), MIT/Apache-2.0; installer wheel
  URL and SHA-256 pinned in bootstrap.py.
- `requirements.in` follows the pinned ComfyUI dependencies; the generated
  `requirements-linux.lock` pins transitive versions and hashes for Linux/Python
  3.11. Re-resolve intentionally with uv and the CUDA 12.4 wheel index, then
  validate on the rental GPU before promoting a changed runtime.
