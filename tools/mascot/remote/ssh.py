#!/usr/bin/env python3
"""Local SSH transport. Never copies a private key or stores a password."""
import argparse
import hashlib
import os
from pathlib import Path
import re
import shlex
import subprocess


def connection(host, port, user, identity, state, bootstrap=False):
    if not re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9.-]*", host):
        raise ValueError("Use a hostname or IPv4 address, without shell syntax")
    if not re.fullmatch(r"[a-z_][a-z0-9_-]*", user) or not 1 <= port <= 65535:
        raise ValueError("Invalid SSH user or port")
    identity = Path(identity).expanduser().resolve()
    if not identity.is_file() or not Path(str(identity) + '.pub').is_file():
        raise ValueError("Both the existing identity file and its .pub file are required")
    state.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chmod(state, 0o700)
    # A short path avoids OpenSSH's Unix socket length limit on macOS.
    control = Path('/tmp') / f'mascot-ssh-{os.getuid()}'
    if control.is_symlink():
        raise ValueError("SSH control directory must not be a symlink")
    control.mkdir(mode=0o700, exist_ok=True)
    if control.stat().st_uid != os.getuid():
        raise ValueError("SSH control directory has a different owner")
    os.chmod(control, 0o700)
    name = hashlib.sha256(f'{user}@{host}:{port}:{identity}'.encode()).hexdigest()[:24]
    opts = ['-p', str(port), '-o', f'IdentityFile={identity}', '-o', 'IdentitiesOnly=yes',
            '-o', 'ForwardAgent=no', '-o', f'UserKnownHostsFile={state / "known_hosts"}',
            '-o', f'StrictHostKeyChecking={"ask" if bootstrap else "yes"}',
            '-o', 'ConnectTimeout=15', '-o', 'ServerAliveInterval=15',
            '-o', 'ServerAliveCountMax=3']
    if not bootstrap:
        opts += ['-o', 'BatchMode=yes', '-o', 'ControlMaster=auto',
                 '-o', 'ControlPersist=300', '-o', f'ControlPath={control / name}']
    return opts, f'{user}@{host}'


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('action', choices=['bootstrap', 'exec'])
    p.add_argument('--host', required=True)
    p.add_argument('--port', required=True, type=int)
    p.add_argument('--user', default='root')
    p.add_argument('--identity', default=str(Path.home() / '.ssh/ckey_n3_ed25519'))
    p.add_argument('--state', type=Path, default=Path(__file__).resolve().parents[1] / '.runtime/ssh')
    args, command = p.parse_known_args()
    if command[:1] == ['--']:
        command = command[1:]
    opts, target = connection(args.host, args.port, args.user, args.identity, args.state,
                              bootstrap=args.action == 'bootstrap')
    if args.action == 'bootstrap':
        if command:
            p.error('bootstrap accepts no remote command')
        pub = Path(args.identity).expanduser().with_name(Path(args.identity).name + '.pub')
        subprocess.run(['ssh-keygen', '-lf', str(pub)], check=True)
        # ssh-copy-id appends missing public keys and prompts through the terminal.
        subprocess.run(['ssh-copy-id', '-i', str(pub), *opts, target], check=True)
        opts, target = connection(args.host, args.port, args.user, args.identity, args.state, bootstrap=True)
        opts = ['StrictHostKeyChecking=yes' if x == 'StrictHostKeyChecking=ask' else x for x in opts]
        subprocess.run(['ssh', *opts, '-o', 'BatchMode=yes', '-o', 'ControlMaster=no', '-o', 'ControlPath=none',
                        target, 'true'], check=True)
        print('Fresh key-only SSH connection verified. No password was saved.')
    else:
        if not command:
            p.error('exec requires -- COMMAND [ARG ...]')
        subprocess.run(['ssh', *opts, target, shlex.join(command)], check=True)


if __name__ == '__main__':
    main()
