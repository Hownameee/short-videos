#!/usr/bin/env bash
# Install the pinned 24 GB CUDA runtime while downloading weights concurrently.
set -euo pipefail
TOOLS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME="$TOOLS/.runtime"
TALKER="$RUNTIME/talker"
VENDOR="$TALKER/vendor/LongCat-Video"
LOGS="$RUNTIME/logs"
LOCK="$TOOLS/runtime-lock.json"
INSTALL_SYSTEM=0
if [[ "${1:-}" == --install-system ]]; then INSTALL_SYSTEM=1; shift; fi
[[ $# == 0 ]] || { echo "Usage: bash tools/mascot-longcat/setup.sh [--install-system]" >&2; exit 2; }
[[ "$(uname -s):$(uname -m)" == Linux:x86_64 ]] || {
  echo "This pinned runtime requires Linux x86_64 with an NVIDIA Ampere GPU." >&2; exit 1;
}

command -v flock >/dev/null || { echo "Install util-linux (flock) before setup." >&2; exit 1; }
mkdir -p "$LOGS"
exec 9>"$RUNTIME/setup.lock"
flock -n 9 || { echo "Another LongCat setup is running." >&2; exit 1; }
exec 8>"$RUNTIME/generation.lock"
flock -n 8 || { echo "A mascot generation is running; setup cannot modify its runtime." >&2; exit 1; }
exec > >(tee -a "$LOGS/setup.log" 8>&- 9>&-) 2>&1
download_pid=""
finish() {
  result=$?
  trap - EXIT
  if [[ -n "$download_pid" ]]; then
    kill "$download_pid" 2>/dev/null || true
    wait "$download_pid" 2>/dev/null || true
  fi
  printf '%s\n' "$result" > "$LOGS/setup.exit"
  exit "$result"
}
trap finish EXIT
printf 'running\n' > "$LOGS/setup.exit"
rm -f "$RUNTIME/ready.json"


if (( INSTALL_SYSTEM )); then
  [[ "$EUID" == 0 ]] || { echo "--install-system requires root." >&2; exit 1; }
  # Python 3.10 is supplied by the selected Ubuntu 22.04 image.
  . /etc/os-release
  [[ "$ID" == ubuntu && "$VERSION_ID" == 22.04 ]] || {
    echo "Automatic OS packages target Ubuntu 22.04. Install Python 3.10 and prerequisites manually on other images." >&2; exit 1;
  }
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    python3.10 python3.10-venv git curl ca-certificates ffmpeg libsndfile1 libsamplerate0 libgl1 libglib2.0-0 util-linux procps
fi
for program in python3.10 git curl ffmpeg ffprobe nvidia-smi flock free; do
  command -v "$program" >/dev/null || {
    echo "Missing $program; use --install-system on Ubuntu 22.04 or install it first." >&2; exit 1;
  }
done

nvidia-smi --query-gpu=name,memory.total,compute_cap,driver_version --format=csv > "$LOGS/hardware.txt"
free -h >> "$LOGS/hardware.txt"
df -h "$RUNTIME" >> "$LOGS/hardware.txt"
cat "$LOGS/hardware.txt"
python3.10 - "$RUNTIME" <<'PY'
import pathlib, shutil, subprocess, sys
row = subprocess.check_output([
    "nvidia-smi", "--query-gpu=memory.total,compute_cap", "--format=csv,noheader,nounits"
], text=True).strip().splitlines()
assert len(row) == 1, "This profile expects exactly one NVIDIA GPU"
memory, capability = [part.strip() for part in row[0].split(",")]
assert capability == "8.6", f"Expected Ampere compute 8.6; got {capability}"
assert float(memory) >= 23000, f"Expected 24 GB VRAM; got {memory} MiB"
mem_kib = int(next(line.split()[1] for line in pathlib.Path('/proc/meminfo').read_text().splitlines() if line.startswith('MemTotal:')))
assert mem_kib >= 55 * 1024**2, "At least 55 GiB system RAM required for the 64 GB profile"
weights = pathlib.Path(sys.argv[1]) / 'talker/weights'
if not (weights / 'download-report.json').exists():
    assert shutil.disk_usage(sys.argv[1]).free >= 70 * 1024**3, "Need at least 70 GiB free for fresh weights, dependencies and caches"
PY

value() { python3.10 -c 'import json,sys; x=json.load(open(sys.argv[1])); print(x[sys.argv[2]][sys.argv[3]])' "$LOCK" "$1" "$2"; }
python3.10 - "$TOOLS" <<'PYREQ'
import hashlib, json, pathlib, sys
tools = pathlib.Path(sys.argv[1]); dependency = json.loads((tools / 'runtime-lock.json').read_text())['dependencies']
actual = hashlib.sha256((tools / dependency['file']).read_bytes()).hexdigest()
assert actual == dependency['sha256'], 'requirements.txt differs from runtime-lock.json; regenerate the dependency lock'
PYREQ

checkout() {
  local destination="$1" repository="$2" revision="$3"
  if [[ ! -d "$destination/.git" ]]; then
    mkdir -p "$destination"
    git -C "$destination" init -q
    git -C "$destination" remote add origin "$repository"
  fi
  if [[ "$(git -C "$destination" rev-parse HEAD 2>/dev/null || true)" != "$revision" ]]; then
    [[ -z "$(git -C "$destination" status --porcelain)" ]] || {
      echo "Preserve and review local source edits before changing revision: $destination" >&2; return 1;
    }
    git -C "$destination" fetch --depth 1 origin "$revision"
    git -C "$destination" checkout --detach "$revision"
  fi
}
checkout "$TALKER" "$(value talker repo)" "$(value talker revision)"
python3.10 - "$TALKER/talker.py" <<'PY'
from pathlib import Path
import sys
path = Path(sys.argv[1]); source = path.read_text()
old = '"-c:v", "libx264", "-crf", "16", "-preset", "slow",'
new = '"-c:v", "libx264", "-crf", "16", "-preset", "medium",'
if source.count(old) == 1 and new not in source:
    path.write_text(source.replace(old, new))
elif source.count(new) != 1 or old in source:
    raise SystemExit('Unexpected Talker final encoder settings; inspect source before patching')
PY
git -C "$TALKER" diff -- talker.py > "$LOGS/source-patch.diff"

# The downloader has a separate venv, so pip never mutates the render environment concurrently.
download_track() {
  [[ -x "$RUNTIME/download-venv/bin/python" ]] || python3.10 -m venv "$RUNTIME/download-venv"
  "$RUNTIME/download-venv/bin/python" -m pip install --disable-pip-version-check \
    "huggingface-hub==$(value runtime huggingfaceHub)"
  exec "$RUNTIME/download-venv/bin/python" "$TOOLS/download_models.py" \
    --weights "$TALKER/weights" --workers "${LONGCAT_DOWNLOAD_WORKERS:-4}"
}
download_track > "$LOGS/download.log" 2>&1 &
download_pid=$!
echo "Weights downloading concurrently (PID $download_pid); progress: $LOGS/download.log"

checkout "$VENDOR" "$(value upstream repo)" "$(value upstream revision)"
[[ -x "$TALKER/.venv/bin/python" ]] || python3.10 -m venv "$TALKER/.venv"
PYTHON="$TALKER/.venv/bin/python"
"$PYTHON" -c 'import sys; assert sys.version_info[:2] == (3, 10), "Expected Python 3.10"'
"$PYTHON" -m pip install --disable-pip-version-check 'pip==25.3' wheel setuptools
"$PYTHON" -m pip install \
  "torch==$(value runtime torch)" "torchvision==$(value runtime torchvision)" "torchaudio==$(value runtime torchaudio)" \
  --index-url "$(value runtime torchIndex)"
"$PYTHON" - <<'PY'
import torch
assert torch.cuda.is_available(), "PyTorch cannot see CUDA"
assert torch.__version__ == '2.6.0+cu124', torch.__version__
assert not torch._C._GLIBCXX_USE_CXX11_ABI, "The selected FlashAttention wheel requires ABI FALSE"
print('CUDA visible:', torch.cuda.get_device_name(0))
PY
"$PYTHON" -m pip install --no-deps "$(value runtime flashWheel)"

"$PYTHON" -m pip install -r "$TOOLS/requirements.txt"
"$PYTHON" -m pip check
# Import checks only: no short video, no model load and no denoising benchmark.
"$PYTHON" - <<'PY'
import torch, flash_attn, accelerate, diffusers, transformers, cv2, soundfile
from audio_separator.separator import Separator
assert torch.cuda.is_available()
print('Runtime imports ready; full-WAV generation can follow once weights finish.')
PY
"$PYTHON" -m pip freeze > "$LOGS/pip-freeze.txt"
echo 'Waiting only for unfinished model downloads.'
wait "$download_pid"
download_pid=""
"$RUNTIME/download-venv/bin/python" "$TOOLS/download_models.py" --weights "$TALKER/weights" --verify-only

"$PYTHON" - "$TOOLS" <<'PY'
import datetime, hashlib, json, pathlib, subprocess, sys
tools = pathlib.Path(sys.argv[1]); runtime = tools / '.runtime'; lock_path = tools / 'runtime-lock.json'
lock = json.loads(lock_path.read_text())
report = {
    'schemaVersion': 1, 'completedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'lockSha256': hashlib.sha256(lock_path.read_bytes()).hexdigest(),
    'talkerRevision': subprocess.check_output(['git', '-C', str(runtime / 'talker'), 'rev-parse', 'HEAD'], text=True).strip(),
    'upstreamRevision': subprocess.check_output(['git', '-C', str(runtime / 'talker/vendor/LongCat-Video'), 'rev-parse', 'HEAD'], text=True).strip(),
    'runtime': lock['runtime'], 'profile': lock['profile'], 'renderTest': 'not-run-by-user-request',
    'talkerPatchSha256': hashlib.sha256((runtime / 'logs/source-patch.diff').read_bytes()).hexdigest(),
}
payload = json.dumps(report, indent=2) + '\n'
(runtime / 'logs/setup-report.json').write_text(payload)
temporary = runtime / 'ready.partial.json'; temporary.write_text(payload); temporary.replace(runtime / 'ready.json')
PY
echo "Ready: $TALKER/.venv/bin/python (full-WAV generation only; no smoke render was run)"
