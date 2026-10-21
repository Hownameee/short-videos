#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RESEARCH="$ROOT/research/mascot/echomimic"
SOURCE="$RESEARCH/source"
OLD_PYTHON="$SOURCE/.venv/bin/python"
VENV="$ROOT/.venv-mascot"
MODELS="$ROOT/tools/mascot-echomimic/models"
SHARED_SOURCE="$ROOT/tools/mascot-echomimic/source"
EXPECTED_COMMIT=5e2595f1735f4a5e66ed27ac10326ac2e5b39e9b

if [[ ! -x "$OLD_PYTHON" || ! -d "$RESEARCH/models" ]]; then
  echo "The pinned research environment and models are required: $RESEARCH" >&2
  exit 1
fi
if [[ "$(git -C "$SOURCE" rev-parse HEAD)" != "$EXPECTED_COMMIT" ]]; then
  echo "Research source commit differs from the tested EchoMimic MLX commit." >&2
  exit 1
fi
if [[ "$(uname -s)" != Darwin || "$(uname -m)" != arm64 ]]; then
  echo "This setup supports Apple Silicon macOS only." >&2
  exit 1
fi

if [[ ! -f "$VENV/.mascot-packages-copied" ]]; then
  if [[ ! -x "$VENV/bin/python" ]]; then
    "$OLD_PYTHON" -m venv "$VENV"
  fi
  old_site="$SOURCE/.venv/lib/python3.11/site-packages"
  new_site="$VENV/lib/python3.11/site-packages"
  if [[ ! -d "$old_site" || ! -d "$new_site" ]]; then
    echo "Expected Python 3.11 site-packages are missing." >&2
    exit 1
  fi
  cp -c -R "$old_site/." "$new_site/"
  touch "$VENV/.mascot-packages-copied"
fi

if [[ ! -f "$SHARED_SOURCE/src/echomimic_mlx/cli.py" ]]; then
  cp -c -R "$SOURCE/packages/echomimic-mlx" "$SHARED_SOURCE"
fi
printf '%s\n' "$SHARED_SOURCE/src" > "$VENV/lib/python3.11/site-packages/_editable_impl_echomimic_mlx.pth"

model_files=(
  flash/echomimicv3-flash-pro/config.json
  flash/echomimicv3-flash-pro/diffusion_pytorch_model.safetensors
  wan-fun/Wan2.1_VAE.pth
  wan-fun/models_t5_umt5-xxl-enc-bf16.pth
  wan-fun/models_clip_open-clip-xlm-roberta-large-vit-huge-14.pth
  wan-fun/google/umt5-xxl/tokenizer.json
  wav2vec/config.json
  wav2vec/preprocessor_config.json
  wav2vec/pytorch_model.bin
)
for relative in "${model_files[@]}"; do
  source_file="$RESEARCH/models/$relative"
  target_file="$MODELS/$relative"
  if [[ ! -s "$source_file" ]]; then
    echo "Missing source model: $source_file" >&2
    exit 1
  fi
  if [[ ! -e "$target_file" ]]; then
    mkdir -p "$(dirname "$target_file")"
    cp -c "$source_file" "$target_file"
  fi
  if [[ ! -s "$target_file" ]] || [[ "$(stat -f %z "$source_file")" != "$(stat -f %z "$target_file")" ]]; then
    echo "Model copy is missing or has an unexpected size: $target_file" >&2
    exit 1
  fi
done

"$VENV/bin/python" -c 'from importlib.metadata import version; print("EchoMimic", version("echomimic-mlx"), "MLX", version("mlx"), "Torch", version("torch"))'
touch "$VENV/.mascot-ready"
echo "Models ready: $MODELS"
