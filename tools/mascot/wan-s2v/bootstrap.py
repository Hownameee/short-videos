#!/usr/bin/env python3
"""Provision pinned uv and Python without modifying the host Python or driver."""
import hashlib
import os
from pathlib import Path
import subprocess
import urllib.request
import zipfile


def main():
    runtime = Path(__file__).resolve().parent / '.runtime'
    runtime.mkdir(parents=True, exist_ok=True)
    uv = runtime / 'uv'
    if not uv.exists():
        wheel = runtime / 'uv.whl.part'
        url = 'https://files.pythonhosted.org/packages/9b/83/a0bdf4abf86ede79b427778fe27e2b4a022c98a7a8ea1745dcd6c6561f17/uv-0.9.5-py3-none-manylinux_2_17_x86_64.manylinux2014_x86_64.whl'
        urllib.request.urlretrieve(url, wheel)
        if hashlib.sha256(wheel.read_bytes()).hexdigest() != '6507bbbcd788553ec4ad5a96fa19364dc0f58b023e31d79868773559a83ec181':
            raise RuntimeError('uv installer checksum mismatch')
        with zipfile.ZipFile(wheel) as archive:
            members = [n for n in archive.namelist() if n.endswith('/scripts/uv')]
            if len(members) != 1:
                raise RuntimeError('Unexpected uv wheel layout')
            temporary = runtime / 'uv.part'
            temporary.write_bytes(archive.read(members[0]))
            temporary.chmod(0o700)
            temporary.replace(uv)
        wheel.unlink()
    version = subprocess.check_output([str(uv), '--version'], text=True).strip()
    if not version.startswith('uv 0.9.5'):
        raise RuntimeError('Unexpected uv version')
    environment = dict(os.environ, UV_PYTHON_INSTALL_DIR=str(runtime / 'python'), UV_CACHE_DIR=str(runtime / 'uv-cache'))
    if not (runtime / 'venv/bin/python').exists():
        subprocess.run([str(uv), 'python', 'install', '3.11.14'], env=environment, check=True)
        subprocess.run([str(uv), 'venv', '--seed', '--python', '3.11.14', str(runtime / 'venv')], env=environment, check=True)


if __name__ == '__main__':
    main()
