#!/usr/bin/env python3
"""Linux rental preflight and parallel dependency/model setup."""
import argparse
import json
import os
import platform
import shutil
import subprocess
import sys
import time
from common import TOOLS, RUNTIME, load_job, save_json, sha256


def preflight(job):
    load_job(job)
    from pathlib import Path
    output = Path(job).resolve().parents[2] / 'output/mascot/wan-s2v'
    if output.exists():
        raise RuntimeError(f'Output already exists: {output}; archive it before rerunning')
    if platform.system() != 'Linux' or platform.machine() != 'x86_64':
        raise RuntimeError('GPU setup requires Linux x86_64')
    for command in ['git', 'curl', 'ffmpeg', 'ffprobe', 'nvidia-smi', 'rsync']:
        if not shutil.which(command):
            raise RuntimeError(f'Missing {command}; see README prerequisites')
    lock = json.loads((TOOLS / 'runtime-lock.json').read_text())
    memory = int(next(line.split()[1] for line in open('/proc/meminfo') if line.startswith('MemTotal:'))) * 1024
    if memory < lock['minHostRamGiB'] * 1024**3:
        raise RuntimeError('Host RAM below 58 GiB')
    if shutil.disk_usage(TOOLS).free < lock['minFreeDiskGiB'] * 1024**3:
        # Existing runtime files (including partial downloads and dependencies)
        # already consume part of the initial 60 GiB budget.
        cached = sum(p.stat().st_size for p in RUNTIME.rglob('*') if p.is_file() and not p.is_symlink())
        if shutil.disk_usage(TOOLS).free + cached < lock['minFreeDiskGiB'] * 1024**3:
            raise RuntimeError('Need 60 GiB free including already cached weights')
    gpu = subprocess.check_output(['nvidia-smi', '--query-gpu=name,memory.total,driver_version', '--format=csv,noheader,nounits'], text=True)
    print(gpu, flush=True)
    if len(gpu.strip().splitlines()) != 1:
        raise RuntimeError('Expected exactly one visible rental GPU')
    if int(gpu.split(',')[1].strip()) < lock['minVramMiB']:
        raise RuntimeError('Need a 24 GB GPU')
    return lock


def dependencies(lock):
    backend = RUNTIME / 'ComfyUI'
    if not (backend / '.git').exists():
        backend.mkdir(parents=True, exist_ok=True)
        subprocess.run(['git', 'init', str(backend)], check=True)
        subprocess.run(['git', '-C', str(backend), 'remote', 'add', 'origin', lock['backend']['repository']], check=True)
    actual = subprocess.run(['git', '-C', str(backend), 'rev-parse', 'HEAD'], capture_output=True, text=True)
    if actual.stdout.strip() != lock['backend']['revision']:
        subprocess.run(['git', '-C', str(backend), 'fetch', '--depth', '1', 'origin', lock['backend']['revision']], check=True)
        subprocess.run(['git', '-C', str(backend), 'checkout', '--detach', lock['backend']['revision']], check=True)
    env = RUNTIME / 'venv'
    python = env / 'bin/python'
    if not python.exists():
        raise RuntimeError('Run launch.sh to provision the pinned Python environment first')
    requirement = TOOLS / 'requirements-linux.lock'
    marker = RUNTIME / 'dependencies.json'
    fingerprint = {'lockSha256': sha256(requirement), 'backend': lock['backend']['revision']}
    if not marker.exists() or json.loads(marker.read_text()) != fingerprint:
        subprocess.run([str(python), '-m', 'pip', 'install', '--require-hashes', '--only-binary=:all:',
                        '--extra-index-url', 'https://download.pytorch.org/whl/cu124', '-r', str(requirement)], check=True)
    subprocess.run([str(python), '-m', 'pip', 'check'], check=True)
    subprocess.run([str(python), '-c', 'import torch; assert torch.__version__ == "2.6.0+cu124"; assert torch.cuda.is_available(); print(torch.ones(1, device="cuda") + 1)'], check=True)
    save_json(marker, fingerprint)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--job', required=True)
    parser.add_argument('--dependencies-only', action='store_true', help=argparse.SUPPRESS)
    args = parser.parse_args()
    if args.dependencies_only:
        dependencies(json.loads((TOOLS / 'runtime-lock.json').read_text()))
        return
    lock = preflight(args.job)
    RUNTIME.mkdir(parents=True, exist_ok=True)
    started = time.monotonic()
    children = []
    handles = []
    try:
        for name, command in [('dependencies', [sys.executable, __file__, '--job', args.job, '--dependencies-only']),
                              ('download', [sys.executable, str(TOOLS / 'download.py')])]:
            handle = (RUNTIME / f'{name}.log').open('w')
            handles.append(handle)
            children.append(subprocess.Popen(command, stdout=handle, stderr=subprocess.STDOUT, start_new_session=True))
        while any(child.poll() is None for child in children):
            for child in children:
                if child.poll() not in (None, 0):
                    raise RuntimeError('Setup failed; inspect .runtime/dependencies.log and download.log')
            time.sleep(2)
        if any(child.returncode != 0 for child in children):
            raise RuntimeError('Setup failed; inspect .runtime logs')
        save_json(RUNTIME / 'setup.json', {'seconds': round(time.monotonic() - started, 2), 'backend': lock['backend']})
    finally:
        import signal
        for child in children:
            if child.poll() is None:
                os.killpg(child.pid, signal.SIGTERM)
                try:
                    child.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    os.killpg(child.pid, signal.SIGKILL)
                    child.wait()
        for handle in handles:
            handle.close()


if __name__ == '__main__':
    main()
