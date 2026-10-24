#!/usr/bin/env bash
# Survive SSH disconnects, overlap setup tasks, then execute exactly one full job.
set -euo pipefail
TOOLS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$TOOLS/../.." && pwd)"
RUNTIME="$TOOLS/.runtime"
cd "$ROOT"

if [[ "${1:-}" == --worker ]]; then
  JOB="$2"
  SESSION="$3"
  INSTALL_SYSTEM="$4"
  exec 9>"$RUNTIME/pipeline.lock"
  if ! flock -n 9; then
    echo "Another setup/render pipeline is running" >&2
    echo 1 > "$SESSION/exit-code"
    exit 1
  fi
  trap 'code=$?; echo "$code" > "$SESSION/exit-code"' EXIT
  if [[ "$INSTALL_SYSTEM" == 1 ]]; then
    bash "$TOOLS/setup.sh" --install-system
  else
    bash "$TOOLS/setup.sh"
  fi
  "$RUNTIME/talker/.venv/bin/python" -u "$TOOLS/run.py" --job "$JOB"
  exit 0
fi

INSTALL_SYSTEM=0
if [[ "${1:-}" == --install-system ]]; then
  INSTALL_SYSTEM=1
  shift
fi
[[ $# == 1 && -f "$1" ]] || { echo "Usage: bash tools/mascot-longcat/launch.sh [--install-system] projects/NNN-topic/remote/longcat[-name]/job.json" >&2; exit 2; }
command -v flock >/dev/null || { echo "Linux flock (util-linux) is required" >&2; exit 1; }
mkdir -p "$RUNTIME/logs"
SESSION="$RUNTIME/logs/session-$(date -u +%Y%m%dT%H%M%SZ)-$$"
mkdir "$SESSION"
nohup bash "$TOOLS/launch.sh" --worker "$1" "$SESSION" "$INSTALL_SYSTEM" > "$SESSION/pipeline.log" 2>&1 < /dev/null &
echo "$!" > "$SESSION/pid"
echo "$SESSION" > "$RUNTIME/latest-session.txt"
echo "Started PID $(cat "$SESSION/pid"); log: $SESSION/pipeline.log"
echo "Completion: $SESSION/exit-code (0 = success)."
