#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TOOLS="$ROOT/tools/mascot-echomimic"
PYTHON="$ROOT/.venv-mascot/bin/python"
SOURCE="$TOOLS/matanyone2-source"
ARCHIVE="$ROOT/research/mascot-new/matting/source-archives/MatAnyone2-main.tar.gz"
CHECKPOINT="$TOOLS/models/matanyone2.pth"
EXPECTED_ARCHIVE=d692a53405e6aa6af9d5234cfe8bd088b38e5254917219b50d17110e5dcb2b03
EXPECTED_CHECKPOINT=5e9821e4087231427376b437c85bb6e072b41e582314f06fd524f75bc4af5914
URL=https://github.com/pq-yang/MatAnyone2/releases/download/v1.0.0/matanyone2.pth

if [[ ! -x "$PYTHON" || ! -s "$ARCHIVE" ]]; then
  echo "Set up .venv-mascot and retain the MatAnyone2 source archive first." >&2
  exit 1
fi
if [[ "$(shasum -a 256 "$ARCHIVE" | cut -d ' ' -f 1)" != "$EXPECTED_ARCHIVE" ]]; then
  echo "MatAnyone2 source archive checksum mismatch." >&2
  exit 1
fi
if [[ ! -f "$SOURCE/inference_matanyone2.py" ]]; then
  mkdir -p "$SOURCE"
  tar -xzf "$ARCHIVE" -C "$SOURCE" --strip-components=1
fi

uv pip install --python "$PYTHON" --no-deps \
  'torchvision==0.28.0' \
  'opencv-python-headless==5.0.0.93' \
  'hydra-core==1.3.7' \
  'omegaconf==2.3.1' \
  'antlr4-python3-runtime==4.9.3' \
  'imageio==2.38.1' \
  'imageio-ffmpeg==0.6.0'

if [[ ! -s "$CHECKPOINT" ]]; then
  mkdir -p "$(dirname "$CHECKPOINT")"
  curl -L --fail --retry 2 --connect-timeout 10 -o "$CHECKPOINT.part" "$URL"
  if [[ "$(shasum -a 256 "$CHECKPOINT.part" | cut -d ' ' -f 1)" != "$EXPECTED_CHECKPOINT" ]]; then
    echo "Downloaded MatAnyone2 checkpoint checksum mismatch." >&2
    exit 1
  fi
  mv "$CHECKPOINT.part" "$CHECKPOINT"
fi
if [[ "$(shasum -a 256 "$CHECKPOINT" | cut -d ' ' -f 1)" != "$EXPECTED_CHECKPOINT" ]]; then
  echo "MatAnyone2 checkpoint checksum mismatch." >&2
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
echo "MatAnyone2 source and checkpoint ready: $SOURCE"
