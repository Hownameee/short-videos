#!/usr/bin/env python3
"""Download immutable weights with bounded parallelism and resumable curl."""
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import subprocess
from common import TOOLS, RUNTIME, inside, save_json, sha256


def download(model, root):
    target = inside(root, model['path'])
    target.parent.mkdir(parents=True, exist_ok=True)
    receipt = target.with_suffix('.verified.json')
    if target.exists():
        stat = target.stat()
        expected = {'sha256': model['sha256'], 'bytes': stat.st_size, 'mtimeNs': stat.st_mtime_ns}
        if stat.st_size == model['bytes']:
            if receipt.exists() and json.loads(receipt.read_text()) == expected:
                print(f'Cached: {target.name}', flush=True)
                return
            if sha256(target) == model['sha256']:
                save_json(receipt, expected)
                return
        raise RuntimeError(f'Invalid existing model: {target}; move it aside before retrying')
    partial = target.with_suffix(target.suffix + '.part')
    if not partial.exists() or partial.stat().st_size != model['bytes']:
        subprocess.run(['curl', '--fail', '--location', '--retry', '4', '--retry-delay', '3',
                        '--connect-timeout', '30', '--speed-time', '180', '--speed-limit', '1024',
                        '--continue-at', '-', '--output', str(partial), model['url']], check=True)
    if partial.stat().st_size != model['bytes'] or sha256(partial) != model['sha256']:
        raise RuntimeError(f'Checksum/size mismatch: {partial}; move it aside before retrying')
    partial.replace(target)
    stat = target.stat()
    save_json(receipt, {'sha256': model['sha256'], 'bytes': stat.st_size, 'mtimeNs': stat.st_mtime_ns})
    print(f'Verified: {target.name}', flush=True)


def main():
    lock = json.loads((TOOLS / 'runtime-lock.json').read_text())
    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(lambda model: download(model, RUNTIME / 'ComfyUI/models'), lock['models']))


if __name__ == '__main__':
    main()
