"""Generate narration and captions using Kokoro's predicted word timestamps."""
import hashlib
import json
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
import soundfile as sf
import torch
from kokoro import KPipeline

p = Path(__file__).parent
video = json.loads((p / 'video.json').read_text())
torch.set_num_threads(4)
pipeline = KPipeline(lang_code='a', repo_id='hexgrad/Kokoro-82M', device='cpu')
rate = 24000
scenes = []
checksum = lambda b: 'sha256:' + hashlib.sha256(b).hexdigest()
for scene in video['scenes']:
    samples, words = [], []
    offset = 0.0
    for result in pipeline(scene['narration'], voice='af_heart', speed=1.02):
        audio = np.asarray(result.audio, dtype=np.float32)
        for token in result.tokens or []:
            if token.start_ts is not None and token.end_ts is not None:
                words.append({'text': token.text, 'startMs': round((offset + token.start_ts) * 1000), 'endMs': round((offset + token.end_ts) * 1000), 'timestampMs': None, 'confidence': None})
        samples.append(audio)
        offset += len(audio) / rate
    audio = np.concatenate(samples)
    target = p / 'output/voice' / (scene['id'] + '.wav')
    target.parent.mkdir(parents=True, exist_ok=True)
    sf.write(target, audio, rate, subtype='PCM_16')
    captions, group = [], []
    for word in words:
        group.append(word)
        if len(' '.join(w['text'] for w in group)) > 32 or word['text'].endswith(('.', '?', '!')):
            captions.append({'text': ' '.join(w['text'] for w in group), 'startMs': group[0]['startMs'], 'endMs': group[-1]['endMs'], 'timestampMs': None, 'confidence': None, 'pageBreakAfter': True})
            group = []
    if group:
        captions.append({'text': ' '.join(w['text'] for w in group), 'startMs': group[0]['startMs'], 'endMs': group[-1]['endMs'], 'timestampMs': None, 'confidence': None, 'pageBreakAfter': True})
    for i, caption in enumerate(captions):
        caption['endMs'] = captions[i+1]['startMs'] if i+1 < len(captions) else round(offset * 1000)
    scenes.append({'id': scene['id'], 'file': target.name, 'text': scene['narration'], 'sourceText': scene['narration'], 'durationSec': len(audio)/rate, 'sampleRate': rate, 'captions': captions, 'words': words, 'textChecksum': checksum(scene['narration'].encode()), 'fileChecksum': checksum(target.read_bytes())})
    print(scene['id'], round(offset, 2), 'sec,', len(words), 'words', flush=True)
manifest = {'schemaVersion': 1, 'provider': 'kokoro', 'packageVersion': '0.9.4', 'model': 'hexgrad/Kokoro-82M', 'voice': 'af_heart', 'speed': 1.02, 'langCode': 'a', 'sampleRate': rate, 'captionTiming': 'Kokoro predicted word timestamps; phrase grouping', 'generatedAt': datetime.now(UTC).isoformat(), 'scriptVersion': video['scriptVersion'], 'scenes': scenes}
manifest_path = p / 'output/docs/voice-manifest.json'
manifest_path.parent.mkdir(parents=True, exist_ok=True)
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
print('Total voice:', sum(s['durationSec'] for s in scenes), flush=True)
