#!/usr/bin/env python3
"""Prepare a portable ten-second job; does not run a model or alter approved video."""
import argparse
from pathlib import Path
import subprocess
from common import ROOT, inside, load_job, save_json, sha256


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--project', required=True, type=Path)
    p.add_argument('--audio', required=True, type=Path, help='Already selected, complete sentences, at most 10s')
    p.add_argument('--presenter', required=True, type=Path)
    args = p.parse_args()
    project = args.project.resolve()
    if not project.is_relative_to(ROOT / 'projects'):
        p.error('Project must be inside projects/')
    presenter = args.presenter.resolve()
    inside(ROOT, presenter.relative_to(ROOT))
    from PIL import Image
    with Image.open(presenter) as im:
        im.verify()
    folder = project / 'remote/wan-s2v'
    folder.mkdir(parents=True, exist_ok=True)
    # Reject truncation: the caller must choose a sentence boundary first.
    seconds = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries',
                    'format=duration', '-of', 'default=nw=1:nk=1', str(args.audio)]))
    if not 0 < seconds <= 10.001:
        p.error('Source audio must be at most 10 seconds; do not cut speech implicitly')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(args.audio), '-vn', '-ac', '1',
                    '-ar', '16000', '-af', 'apad', '-t', '10', '-c:a', 'pcm_s16le',
                    str(folder / 'audio.wav')], check=True)
    job = {'schemaVersion': 1, 'model': 'wan2.2-s2v-14b', 'width': 480, 'height': 832,
           'fps': 16, 'durationSec': 10, 'chunkFrames': 81, 'steps': 20, 'cfg': 6.0,
           'shift': 8.0, 'seed': 270022,
           'prompt': 'The reference presenter speaks directly to the camera with natural lip movements, subtle facial expressions and gentle head movements. Preserve the face, hairstyle, clothing and background. Static camera, stable framing, calm educational narration.',
           'negativePrompt': 'subtitles, text, watermark, camera movement, flicker, distorted face, distorted mouth, extra limbs, rapid hand movement, blurry, low quality',
           'audio': {'path': (folder / 'audio.wav').relative_to(ROOT).as_posix(), 'sha256': sha256(folder / 'audio.wav')},
           'presenter': {'path': presenter.relative_to(ROOT).as_posix(), 'sha256': sha256(presenter)}}
    save_json(folder / 'job.json', job)
    save_json(folder / 'input-manifest.json', {'audioSource': str(args.audio.name),
        'audioSourceSha256': sha256(args.audio), 'sourceDurationSec': seconds,
        'operation': 'resample mono PCM16 16kHz; pad silence to exactly 10 seconds',
        'presenter': job['presenter'], 'audio': job['audio']})
    load_job(folder / 'job.json')
    print(folder / 'job.json')


if __name__ == '__main__':
    main()
