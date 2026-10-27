"""Small shared contracts for the Wan S2V job, model cache and output."""
import hashlib
import json
from pathlib import Path
import subprocess
import wave

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parents[2]
RUNTIME = TOOLS / '.runtime'


def sha256(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for block in iter(lambda: f.read(8 * 1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def save_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(value, indent=2) + '\n')
    temp.replace(path)


def inside(root, relative):
    path = (root / relative).resolve()
    if Path(relative).is_absolute() or not path.is_relative_to(root.resolve()):
        raise ValueError(f'Path must stay within {root.name}: {relative}')
    return path


def load_job(path):
    path = Path(path).resolve()
    if not path.is_relative_to(ROOT / 'projects'):
        raise ValueError('Job must live under projects/')
    job = json.loads(path.read_text())
    if job.get('schemaVersion') != 1 or job.get('model') != 'wan2.2-s2v-14b':
        raise ValueError('Unsupported job schema/model')
    if (job['width'], job['height'], job['fps'], job['durationSec'], job['chunkFrames']) != (480, 832, 16, 10, 81):
        raise ValueError('This job profile requires 480x832, 16fps, 10s, 81-frame chunks')
    if not isinstance(job['steps'], int) or not 1 <= job['steps'] <= 40:
        raise ValueError('steps must be 1..40')
    if not isinstance(job['seed'], int) or not 0 <= job['seed'] < 2**63:
        raise ValueError('Invalid seed')
    for name in ['audio', 'presenter']:
        asset = inside(ROOT, job[name]['path'])
        if not asset.is_file() or sha256(asset) != job[name]['sha256']:
            raise ValueError(f'{name} missing or checksum changed; run prepare.py again')
    with wave.open(str(inside(ROOT, job['audio']['path']))) as audio:
        if (audio.getnchannels(), audio.getsampwidth(), audio.getframerate(), audio.getnframes()) != (1, 2, 16000, 160000):
            raise ValueError('Expected exactly 10 seconds, mono PCM16 at 16 kHz')
    return job


def probe(path):
    return json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams',
                                              '-show_format', '-of', 'json', str(path)]))
