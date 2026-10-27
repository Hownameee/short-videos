#!/usr/bin/env python3
"""Resume transfer of one mascot result, then validate its checksum locally."""
import argparse
import json
from pathlib import Path
import shlex
import subprocess
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'wan-s2v'))
from common import ROOT, inside, sha256
from ssh import connection


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--host', required=True)
    p.add_argument('--port', type=int, required=True)
    p.add_argument('--user', default='root')
    p.add_argument('--identity', default=str(Path.home() / '.ssh/ckey_n3_ed25519'))
    p.add_argument('--remote-root', required=True)
    p.add_argument('--project', required=True, help='Repository-relative projects/NNN-topic')
    args = p.parse_args()
    project = inside(ROOT, args.project)
    if not project.is_relative_to(ROOT / 'projects') or project == ROOT / 'projects':
        p.error('Expected a project under projects/')
    if not args.remote_root.startswith('/') or any(c not in '/abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_.-' for c in args.remote_root):
        p.error('Use an absolute remote root with letters, numbers, slash, dot, underscore or hyphen')
    opts, target = connection(args.host, args.port, args.user, args.identity, ROOT / 'tools/mascot/.runtime/ssh')
    destination = project / 'output/mascot/wan-s2v'
    if destination.exists():
        p.error('Local result already exists; archive it explicitly before fetching again')
    partial = project / '.cache/wan-s2v-fetch'
    partial.mkdir(parents=True, exist_ok=True)
    relative = project.relative_to(ROOT).as_posix() + '/output/mascot/wan-s2v/'
    remote = args.remote_root.rstrip('/') + '/' + relative
    # Fixed file allowlist: do not copy caches, weights, runtime environments or remote credentials.
    subprocess.run(['rsync', '-rt', '--partial', '--include=mascot.mp4', '--include=run.json',
                    '--include=*.log', '--include=gpu.csv', '--include=workflow-api.json', '--include=setup.json',
                    '--exclude=*', '-e', shlex.join(['ssh', *opts]), f'{target}:{shlex.quote(remote)}', str(partial) + '/'], check=True)
    report = json.loads((partial / 'run.json').read_text())
    if sha256(partial / 'mascot.mp4') != report['outputSha256']:
        raise RuntimeError('Transferred MP4 checksum mismatch; partial files retained for retry')
    from run import verify_video
    verify_video(partial / 'mascot.mp4')
    destination.parent.mkdir(parents=True, exist_ok=True)
    partial.rename(destination)
    print(destination)


if __name__ == '__main__':
    main()
