#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TOOLS="$ROOT/tools/mascot-echomimic"
VENV="$ROOT/.venv-mascot"
PYTHON="$VENV/bin/python"
BACKEND="${1:-auto}"
MLX_COMMIT=5e2595f1735f4a5e66ed27ac10326ac2e5b39e9b
CUDA_COMMIT=7e89489ca51c0d008fc1963ec6c03fc5bd0b9397

if [[ "$BACKEND" == auto ]]; then
  case "$(uname -s):$(uname -m)" in
    Darwin:arm64) BACKEND=mlx ;;
    Linux:*) BACKEND=cuda ;;
    *) echo "Use Apple Silicon macOS or Linux with NVIDIA CUDA (including WSL2)." >&2; exit 1 ;;
  esac
fi
if [[ "$BACKEND" != mlx && "$BACKEND" != cuda ]]; then
  echo "Usage: bash tools/mascot-echomimic/setup.sh [auto|mlx|cuda]" >&2
  exit 1
fi
if [[ "$BACKEND" == mlx && "$(uname -s):$(uname -m)" != Darwin:arm64 ]]; then
  echo "The MLX backend requires Apple Silicon macOS." >&2; exit 1
fi
if [[ "$BACKEND" == cuda && "$(uname -s)" != Linux ]]; then
  echo "The CUDA backend is supported on Linux or WSL2." >&2; exit 1
fi
for program in git uv ffmpeg ffprobe; do
  command -v "$program" >/dev/null || { echo "Install $program first." >&2; exit 1; }
done
if [[ "$BACKEND" == cuda ]]; then
  command -v nvidia-smi >/dev/null || { echo "NVIDIA driver/nvidia-smi is unavailable." >&2; exit 1; }
  nvidia-smi >/dev/null || { echo "NVIDIA GPU is unavailable." >&2; exit 1; }
fi

if [[ ! -x "$PYTHON" ]]; then
  uv venv --python 3.11 "$VENV"
fi
"$PYTHON" -c 'import sys; assert sys.version_info[:2] == (3, 11), "Python 3.11 required"'

if [[ "$BACKEND" == mlx ]]; then
  # Reuse the preserved package snapshot when present.
  if [[ -f "$TOOLS/source/src/echomimic_mlx/cli.py" ]]; then
    PACKAGE="$TOOLS/source"
  else
    SOURCE="$TOOLS/source-mlx"
    if [[ ! -d "$SOURCE/.git" ]]; then
      git clone https://github.com/guilhermesilveira/echomimic-v3-mlx.git "$SOURCE"
    fi
    git -C "$SOURCE" fetch --depth 1 origin "$MLX_COMMIT"
    git -C "$SOURCE" checkout --detach "$MLX_COMMIT"
    PACKAGE="$SOURCE/packages/echomimic-mlx"
  fi
  if ! "$PYTHON" -c 'from importlib.metadata import version; print(version("echomimic-mlx"))' >/dev/null 2>&1; then
    uv pip install --python "$PYTHON" -e "$PACKAGE[audio]"
  fi
else
  SOURCE="$TOOLS/source-cuda"
  if [[ ! -d "$SOURCE/.git" ]]; then
    git clone https://github.com/antgroup/echomimic_v3.git "$SOURCE"
  fi
  git -C "$SOURCE" fetch --depth 1 origin "$CUDA_COMMIT"
  git -C "$SOURCE" checkout --detach "$CUDA_COMMIT"
  if ! "$PYTHON" -c 'import torch, diffusers; assert torch.cuda.is_available()' 2>/dev/null; then
    uv pip install --python "$PYTHON" torch==2.6.0 torchvision==0.21.0 torchaudio==2.6.0 \
      --index-url https://download.pytorch.org/whl/cu124
    uv pip install --python "$PYTHON" -r "$SOURCE/requirements.txt" \
      'huggingface-hub>=0.34,<1' 'transformers>=4.46.2,<5' 'pyloudnorm>=0.1.1'
  fi
  "$PYTHON" -c 'import torch; assert torch.cuda.is_available(), "CUDA unavailable in PyTorch"'
fi

if ! "$PYTHON" "$TOOLS/download_models.py" --verify-only --backend "$BACKEND" >/dev/null 2>&1; then
  if ! "$PYTHON" -c 'import modelscope' 2>/dev/null; then
    uv pip install --python "$PYTHON" 'modelscope>=1.26,<2'
  fi
fi
"$PYTHON" "$TOOLS/download_models.py" --verify-or-download --backend "$BACKEND"
printf 'EchoMimic %s ready: %s\n' "$BACKEND" "$PYTHON"
