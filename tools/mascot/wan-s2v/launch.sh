#!/usr/bin/env bash
# Foreground worker; start with nohup as documented to survive disconnects.
set -euo pipefail
TOOLS=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
if [[ $# != 1 ]]; then
  echo 'Usage: bash tools/mascot/wan-s2v/launch.sh PROJECT/remote/wan-s2v/job.json' >&2
  exit 2
fi
command -v flock >/dev/null || { echo "Install util-linux first" >&2; exit 1; }
mkdir -p "$TOOLS/.runtime"
exec 9>"$TOOLS/.runtime/job.lock"
flock -n 9 || { echo "Another mascot job is running" >&2; exit 1; }
trap 'code=$?; echo "$code" > "$TOOLS/.runtime/exit-code"' EXIT
printf 'starting\n' > "$TOOLS/.runtime/exit-code"
[[ $(uname -s) == Linux && $(uname -m) == x86_64 ]] || { echo 'Requires Linux x86_64' >&2; exit 1; }
command -v python3 >/dev/null || { echo 'Install python3 first' >&2; exit 1; }
command -v nvidia-smi >/dev/null || { echo 'NVIDIA driver is required; this script does not install drivers' >&2; exit 1; }
missing=()
for pair in git:git curl:curl ffmpeg:ffmpeg ffprobe:ffmpeg rsync:rsync flock:util-linux; do
  command -v "${pair%%:*}" >/dev/null || missing+=("${pair##*:}")
done
if (( ${#missing[@]} )); then
  [[ $(id -u) == 0 ]] || { echo "Install missing packages as root: ${missing[*]}" >&2; exit 1; }
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends "${missing[@]}" ca-certificates
fi
printf '%s\n' "$$" > "$TOOLS/.runtime/worker.pid"
printf 'running\n' > "$TOOLS/.runtime/exit-code"
python3 "$TOOLS/bootstrap.py"
"$TOOLS/.runtime/venv/bin/python" "$TOOLS/setup.py" --job "$1"
"$TOOLS/.runtime/venv/bin/python" "$TOOLS/run.py" --job "$1"
