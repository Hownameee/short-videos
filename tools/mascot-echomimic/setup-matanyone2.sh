#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TOOLS="$ROOT/tools/mascot-echomimic"
PYTHON="$ROOT/.venv-mascot/bin/python"
SOURCE="$TOOLS/matanyone2-source"
CHECKPOINT="$TOOLS/models/matanyone2.pth"
COMMIT=0079197acd6d16a741f71558809c06c586c579e0
EXPECTED_CHECKPOINT=5e9821e4087231427376b437c85bb6e072b41e582314f06fd524f75bc4af5914
URL=https://github.com/pq-yang/MatAnyone2/releases/download/v1.0.0/matanyone2.pth

[[ -x "$PYTHON" ]] || { echo "Run tools/mascot-echomimic/setup.sh first." >&2; exit 1; }
for program in git uv curl; do
  command -v "$program" >/dev/null || { echo "Install $program first." >&2; exit 1; }
done
if [[ ! -f "$SOURCE/inference_matanyone2.py" ]]; then
  if [[ ! -d "$SOURCE/.git" ]]; then
    git clone https://github.com/pq-yang/MatAnyone2.git "$SOURCE"
  fi
  git -C "$SOURCE" fetch --depth 1 origin "$COMMIT"
  git -C "$SOURCE" checkout --detach "$COMMIT"
fi

if ! "$PYTHON" -c 'import cv2, hydra, imageio, torch, torchvision' 2>/dev/null; then
  TORCHVISION="$($PYTHON -c 'import torch; v=torch.__version__.split("+")[0].split("."); assert v[0] == "2" and 6 <= int(v[1]) <= 13, "unsupported torch version"; print(f"0.{int(v[1])+15}.0")')"
  uv pip install --python "$PYTHON" --no-deps \
    "torchvision==$TORCHVISION" \
    'opencv-python-headless==4.11.0.86' \
    'hydra-core==1.3.7' \
    'omegaconf==2.3.1' \
    'antlr4-python3-runtime==4.9.3' \
    'imageio==2.38.1' \
    'imageio-ffmpeg==0.6.0' \
    'requests>=2.31,<3' \
    'tqdm>=4.66,<5'
fi

mkdir -p "$(dirname "$CHECKPOINT")"
if [[ ! -s "$CHECKPOINT" ]]; then
  curl -L --fail --retry 2 --connect-timeout 10 -o "$CHECKPOINT.part" "$URL"
  PART_SHA="$($PYTHON -c 'import hashlib,sys; print(hashlib.sha256(open(sys.argv[1],"rb").read()).hexdigest())' "$CHECKPOINT.part")"
  if [[ "$PART_SHA" != "$EXPECTED_CHECKPOINT" ]]; then
    echo "Downloaded MatAnyone2 checkpoint checksum mismatch." >&2
    exit 1
  fi
  mv "$CHECKPOINT.part" "$CHECKPOINT"
fi
ACTUAL="$($PYTHON -c 'import hashlib,sys; print(hashlib.sha256(open(sys.argv[1],"rb").read()).hexdigest())' "$CHECKPOINT")"
if [[ "$ACTUAL" != "$EXPECTED_CHECKPOINT" ]]; then
  echo "MatAnyone2 checkpoint checksum mismatch: $CHECKPOINT" >&2
  exit 1
fi

mkdir -p "$SOURCE/pretrained_models"
link="$SOURCE/pretrained_models/matanyone2.pth"
if [[ ! -e "$link" ]]; then
  ln -s "$CHECKPOINT" "$link"
fi
if [[ ! "$link" -ef "$CHECKPOINT" ]]; then
  echo "Unexpected MatAnyone2 checkpoint at $link" >&2
  exit 1
fi

"$PYTHON" -c 'import cv2, hydra, imageio, torch, torchvision; print("MatAnyone2 dependencies ready")'
PYTHONPATH="$SOURCE" "$PYTHON" -c 'from matanyone2.utils.get_default_model import get_matanyone2_model; print("MatAnyone2 source import ready")'
echo "MatAnyone2 source and checkpoint ready: $SOURCE"
