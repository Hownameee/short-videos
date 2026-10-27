#!/usr/bin/env python3
"""Run one native S2V graph on a private ComfyUI process and verify its MP4."""
import argparse
from fractions import Fraction
import json
from pathlib import Path
import shutil
import socket
import subprocess
import time
import urllib.error
import urllib.request
from common import ROOT, TOOLS, RUNTIME, inside, load_job, probe, save_json, sha256
from workflow import build


def api(base, route, data=None):
    request = urllib.request.Request(base + route, data=None if data is None else json.dumps(data).encode(),
                                     headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        raise RuntimeError(f'Comfy API {route}: {error.read().decode()}') from error


def completed(history, prompt_id):
    item = history.get(prompt_id)
    if not item:
        return False
    status = item.get('status', {})
    if status.get('status_str') == 'error':
        raise RuntimeError(f'Inference failed: {status.get("messages")}')
    return status.get('completed', False)


def verify_video(path):
    metadata = probe(path)
    video = next(s for s in metadata['streams'] if s['codec_type'] == 'video')
    audio = next(s for s in metadata['streams'] if s['codec_type'] == 'audio')
    if (video['width'], video['height'], Fraction(video['avg_frame_rate']), int(video.get('nb_frames', 0))) != (480, 832, 16, 160):
        raise RuntimeError(f'Unexpected video dimensions/FPS/frames: {video}')
    if abs(float(video['duration']) - 10) > 0.01 or abs(float(audio['duration']) - 10) > 0.15:
        raise RuntimeError('Expected 10-second video and audio')
    subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-i', str(path), '-f', 'null', '-'], check=True)
    return metadata


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--job', required=True, type=Path)
    parser.add_argument('--timeout', type=int, default=14400, help='Maximum inference seconds; no automatic retries')
    args = parser.parse_args()
    job = load_job(args.job)
    project = args.job.resolve().parents[2]
    destination = project / 'output/mascot/wan-s2v'
    if destination.exists():
        raise RuntimeError(f'Output already exists: {destination}; archive it explicitly before rerunning')
    started = time.monotonic()
    session = RUNTIME / 'runs' / time.strftime('%Y%m%dT%H%M%S')
    session.mkdir(parents=True, exist_ok=False)
    inputs, outputs = session / 'input', session / 'output'
    inputs.mkdir()
    outputs.mkdir()
    from PIL import Image, ImageOps
    with Image.open(inside(ROOT, job['presenter']['path'])) as source:
        rgba = source.convert('RGBA')
        background = Image.new('RGBA', rgba.size, (235, 235, 235, 255))
        background.alpha_composite(rgba)
        ImageOps.pad(background.convert('RGB'), (480, 832), color=(235, 235, 235)).save(inputs / 'presenter.png')
    shutil.copy2(inside(ROOT, job['audio']['path']), inputs / 'audio.wav')
    graph = build(job, 'presenter.png', 'audio.wav', 'mascot')
    save_json(session / 'workflow-api.json', graph)
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    base = f'http://127.0.0.1:{port}'
    python = RUNTIME / 'venv/bin/python'
    command = [str(python), str(RUNTIME / 'ComfyUI/main.py'), '--listen', '127.0.0.1', '--port', str(port),
               '--input-directory', str(inputs), '--output-directory', str(outputs),
               '--lowvram', '--reserve-vram', '1.5', '--use-pytorch-cross-attention',
               '--disable-all-custom-nodes', '--preview-method', 'none', '--disable-auto-launch', '--disable-metadata']
    server = telemetry = None
    try:
        with (session / 'comfy.log').open('w') as log, (session / 'gpu.csv').open('w') as gpu:
            server = subprocess.Popen(command, cwd=RUNTIME / 'ComfyUI', stdout=log, stderr=subprocess.STDOUT)
            telemetry = subprocess.Popen(['nvidia-smi', '--query-gpu=timestamp,memory.used,utilization.gpu,temperature.gpu,power.draw',
                                          '--format=csv', '-l', '5'], stdout=gpu, stderr=subprocess.STDOUT)
            deadline = time.monotonic() + 180
            while True:
                if server.poll() is not None:
                    raise RuntimeError(f'ComfyUI exited; see {session}/comfy.log')
                try:
                    info = api(base, '/object_info')
                    break
                except (urllib.error.URLError, TimeoutError):
                    if time.monotonic() > deadline:
                        raise RuntimeError('ComfyUI startup timed out')
                    time.sleep(2)
            missing = {n['class_type'] for n in graph.values()} - set(info)
            if missing:
                raise RuntimeError(f'Backend missing nodes: {missing}')
            # /prompt validates all node inputs before placing this single job in the queue.
            response = api(base, '/prompt', {'prompt': graph, 'client_id': session.name})
            if response.get('node_errors'):
                raise RuntimeError(response['node_errors'])
            prompt_id = response['prompt_id']
            save_json(session / 'submission.json', response)
            deadline = time.monotonic() + args.timeout
            while True:
                history = api(base, '/history/' + prompt_id)
                if completed(history, prompt_id):
                    save_json(session / 'history.json', history)
                    break
                if server.poll() is not None or time.monotonic() > deadline:
                    raise RuntimeError('Inference process exited or timed out; no automatic rerender')
                print(f'Generating: {round(time.monotonic() - started)}s; log: {session}/comfy.log', flush=True)
                time.sleep(15)
            candidates = list(outputs.glob('mascot_*.mp4'))
            if len(candidates) != 1:
                raise RuntimeError(f'Expected one MP4, found {len(candidates)}')
            metadata = verify_video(candidates[0])
    finally:
        for process in [server, telemetry]:
            if process and process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=15)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()
    # Publish only after validation. All intermediate diagnostics remain in .runtime/runs.
    staging = project / '.cache/wan-s2v-result'
    staging.mkdir(parents=True, exist_ok=True)
    shutil.copy2(candidates[0], staging / 'mascot.mp4')
    for name in ['comfy.log', 'gpu.csv', 'workflow-api.json']:
        shutil.copy2(session / name, staging / name)
    for name in ['dependencies.log', 'download.log', 'setup.json']:
        if (RUNTIME / name).exists():
            shutil.copy2(RUNTIME / name, staging / name)
    save_json(staging / 'run.json', {'job': job, 'runtime': json.loads((TOOLS / 'runtime-lock.json').read_text()),
              'elapsedSeconds': round(time.monotonic() - started, 2), 'outputSha256': sha256(staging / 'mascot.mp4'),
              'probe': metadata, 'visualReview': 'pending', 'lipSyncReview': 'pending'})
    destination.parent.mkdir(parents=True, exist_ok=True)
    staging.rename(destination)
    print(f'Completed: {destination}', flush=True)


if __name__ == '__main__':
    main()
