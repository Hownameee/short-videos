# EchoMimic V3 Flash presenter setup

This optional pipeline turns a portrait plus speech WAV into a talking MP4,
extracts the presenter with MatAnyone2, and overlays it on a project's
`output/video/final.mp4`. Run all commands from the **repository root**. The
shared environment is `.venv-mascot`; no `research/` directory is required.

## Choose a backend

| Host | Backend | Source | Validation |
| --- | --- | --- | --- |
| Apple Silicon macOS | MLX/Metal | [community MLX port](https://github.com/guilhermesilveira/echomimic-v3-mlx), commit `5e2595f` | 384×672 and 512×512 generation completed on an M5 Pro with 48 GB unified memory |
| Linux with NVIDIA CUDA, including WSL2 | PyTorch/CUDA | [official EchoMimic V3](https://github.com/antgroup/echomimic_v3), commit `7e89489` | Installer and CLI argument mapping inspected against pinned upstream source; **no Linux GPU end-to-end run yet** |
| Native Windows, Intel Mac, Linux without CUDA | — | — | No supported inference backend in this workspace |

The official Flash release reports a **12 GB VRAM** path, but this workspace's
Linux configuration has not been measured at that limit. Start at 384×672 and
check an actual short render before planning longer work. The MLX port reported
21.83 GiB peak Metal allocation for a short 512×512 test; a 48 GB M5 Pro ran
the local workload. Common model weights occupy about 19–20 GB. CUDA also
downloads the Wan base transformer. Budget at least **40 GB free disk** for
weights, environments, downloads and intermediate files; long clips require
more temporary disk space. GPU driver and CUDA access must work
before Linux setup; `nvidia-smi` and `torch.cuda.is_available()` are separate
checks. CPU-only generation is not supported.

### Prerequisites

- `git`, `uv`, `ffmpeg`, and `ffprobe` on `PATH`; `uv` must be able to obtain
  Python 3.11. Install these using your OS package manager and the
  [official uv instructions](https://docs.astral.sh/uv/getting-started/installation/).
- Network access to GitHub, Hugging Face, ModelScope, PyPI and, on Linux,
  the PyTorch CUDA wheel index. The first install downloads large weights.
- On Linux or WSL2, an NVIDIA driver visible through `nvidia-smi`. WSL2 also
  needs the Windows host NVIDIA driver with CUDA support.
- A presenter image and speech WAV. Project 001 has an example at
  `tools/mascot-echomimic/assets/presenter.png` and
  `projects/001-kubernetes-self-healing/output/voice/full.wav` when generated.
  The project integration requires a **384×672 RGBA presenter PNG**.

## Install EchoMimic

From the repository root:

```bash
bash tools/mascot-echomimic/setup.sh
.venv-mascot/bin/python tools/mascot-echomimic/download_models.py --verify-only
```

`setup.sh` chooses MLX on Apple Silicon and CUDA on Linux. Pass `mlx` or `cuda`
to select explicitly. It creates `.venv-mascot` with Python 3.11, installs the
appropriate source at the pinned revision, and downloads the shared Flash,
Wan base and Wav2Vec weights. Existing complete model files are reused. The
MLX source lives in ignored `tools/mascot-echomimic/source-mlx/`, or the
preserved local `source/` snapshot when present. CUDA source lives in ignored
`source-cuda/`. Weights live in ignored `models/`. No generated media or large
weights are committed.

The weight downloader pins the Hugging Face revisions of
`alibaba-pai/Wan2.1-Fun-V1.1-1.3B-InP` and `BadToBest/EchoMimicV3`, plus the
ModelScope revision of `TencentGameMate/chinese-wav2vec2-base`. It checks
presence and nonzero file size; it does **not** authenticate every weight byte.
If a download was interrupted, rerun setup. A stale nonzero partial file
should be removed manually after checking it against the upstream source.

Check the selected runtime:

```bash
# Apple Silicon
.venv-mascot/bin/python -c 'import mlx.core, echomimic_mlx; print("MLX ready")'

# Linux / WSL2
.venv-mascot/bin/python -c 'import torch; print(torch.cuda.is_available(), torch.cuda.get_device_name(0))'
```

The Linux command must print `True` and the GPU name. Run only the command for
your host. The installer reuses an existing `.venv-mascot` when its imports
pass; recreate the environment intentionally if changing backends or Python
versions.

## Generate a short talking clip

The standalone generator defaults to **384×672, 25 fps, 17 frames (0.68 s),
eight denoising steps**. It accepts `--backend auto|mlx|cuda`, `--prompt`,
`--width`, `--height`, `--frames`, `--steps`, and `--seed`. Width and height
must be multiples of 16; frames must equal `1 + 4N`. It refuses to overwrite
an existing output. CUDA first center-crops/resizes the input to the requested
dimensions; the MLX port does its own center crop. Neither writes alpha.

```bash
.venv-mascot/bin/python tools/mascot-echomimic/generate.py \
  --image tools/mascot-echomimic/assets/presenter.png \
  --audio projects/001-kubernetes-self-healing/output/voice/full.wav \
  --output projects/001-kubernetes-self-healing/.cache/mascot/smoke.mp4 \
  --frames 17

ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,nb_frames \
  -of default=noprint_wrappers=1 \
  projects/001-kubernetes-self-healing/.cache/mascot/smoke.mp4
```

The CUDA adapter invokes the pinned official `infer_flash.py` with its Wan
base, Flash transformer and Chinese Wav2Vec paths, then moves the verified
result to the requested output. The released Flash implementation has limited
text conditioning; prompt wording cannot reliably change the presenter or
direct novel motion. The portrait is the main visual reference. For the local
MLX 384×672 smoke, 17 frames took 102.6 seconds; runtime depends on hardware.

## Make the transparent presenter and project composite

MatAnyone2 is a **separate** matting model. Its source is pinned to commit
`0079197`; the checkpoint is verified by SHA-256. Run this once after the
EchoMimic setup:

```bash
bash tools/mascot-echomimic/setup-matanyone2.sh
```

MatAnyone2's S-Lab License 1.0 permits ordinary **non-commercial** use only;
commercial use needs separate permission. Do not treat the resulting alpha
video as commercially cleared just because EchoMimic weights are Apache-2.0.

For the included project, generate a short check first:

```bash
.venv-mascot/bin/python tools/mascot-echomimic/full_audio.py \
  --project projects/001-kubernetes-self-healing --seconds 3
```

The script reads the project's `output/voice/full.wav`, its
`output/video/final.mp4`, and the presenter PNG. It prepares an opaque input
and first-frame mask, generates 25 fps EchoMimic chunks, mattes them, and
overlays the result at `video.design.presenterOverlay` while keeping the base
video's audio. The demo and full run write the same three paths:

- `output/mascot/mascot.mp4` — talking presenter with an audio excerpt;
- `output/mascot/mascot-transparent-bg.webm` — VP9 with alpha;
- `output/video/final-mascot.mp4` — overlay on the existing final video.

The manifest is `output/docs/mascot-integration.json`. The base video remains
`output/video/final.mp4`. Check full decode, audio, lip sync, alpha edges and
caption visibility in the combined video. The current `full_audio.py` starts
each chunk from the **original presenter image**. The separate six-second
experiment documented in [project 001's production notes](../../projects/001-kubernetes-self-healing/PRODUCTION.md)
instead used the previous chunk's last frame; that continuation method is
**not automated by the full runner**.

When the three-second gate passes, omit `--seconds` for the full WAV:

```bash
.venv-mascot/bin/python tools/mascot-echomimic/full_audio.py \
  --project projects/001-kubernetes-self-healing
```

Intermediate files are cached under the project's `.cache/mascot/full-wav/`.
The cache is keyed to presenter/audio hashes and settings; changing inputs
inside an existing chunk produces an error rather than silently reusing it.
Use a fresh cache or remove only the affected cached chunk after checking it.
Chunk joins can show slight motion jumps. Review them before publishing.

The older scene-WAV runner remains available:

```bash
.venv-mascot/bin/python tools/mascot-echomimic/integrate.py \
  --project projects/001-kubernetes-self-healing
```

## Troubleshooting

| Symptom | Check and action |
| --- | --- |
| `source` or weights missing | Rerun `setup.sh`; run `download_models.py --verify-only` to list missing files. The deleted `research/` tree is not a prerequisite. |
| CUDA unavailable | Run `nvidia-smi` and the PyTorch check above; repair host driver, WSL2 GPU access or the CUDA wheel before inference. |
| Metal unavailable in an agent sandbox | Run from a normal macOS terminal or authorize GPU access for the command. |
| OOM during inference | Try the 17-frame 384×672 smoke first, reduce frame count or image dimensions, and inspect the failing backend's log. Do not assume the official 12 GB claim applies to this exact integration. |
| Wrong frame count or duration | Confirm enough source audio and use `1 + 4N` frames. The official CUDA script caps frames to available audio. |
| Matting source or checkpoint missing | Rerun `setup-matanyone2.sh`; its checkpoint hash check must pass. |
| Output already exists | Choose a new output name for a standalone test; the project runner manages its own cached outputs. |

The Linux CUDA install, full video generation and MatAnyone2 integration need
an end-to-end run on actual Linux GPU hardware before being described as
validated there. The existing Mac demo verifies this project's MLX path.
