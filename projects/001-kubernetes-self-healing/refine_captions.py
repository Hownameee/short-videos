"""Reflow measured word timings without regenerating narration."""
import json
import math
import re
from pathlib import Path

p = Path(__file__).parent
manifest_path = p / 'voice/manifest.json'
manifest = json.loads(manifest_path.read_text())
srt = []
offset = 0.0
def timestamp(seconds):
    ms = round(seconds * 1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
for scene in manifest['scenes']:
    words = []
    for word in scene['words']:
        if words and re.fullmatch(r'[,.:;?!]+', word['text']):
            words[-1]['text'] += word['text']
            words[-1]['endMs'] = word['endMs']
        else:
            words.append(dict(word))
    sentences, sentence = [], []
    for word in words:
        sentence.append(word)
        if word['text'].endswith(('.', '?', '!')):
            sentences.append(sentence)
            sentence = []
    if sentence:
        sentences.append(sentence)
    captions = []
    for sentence in sentences:
        groups = math.ceil(len(sentence)/7)
        for i in range(groups):
            chunk = sentence[round(i*len(sentence)/groups):round((i+1)*len(sentence)/groups)]
            captions.append({'text': ' '.join(w['text'] for w in chunk), 'startMs': chunk[0]['startMs'], 'endMs': chunk[-1]['endMs'], 'timestampMs': None, 'confidence': None, 'pageBreakAfter': True})
    for i, caption in enumerate(captions):
        caption['endMs'] = captions[i+1]['startMs'] if i+1 < len(captions) else round(scene['durationSec'] * 1000)
        srt.append(f"{len(srt)+1}\n{timestamp(offset+caption['startMs']/1000)} --> {timestamp(offset+caption['endMs']/1000)}\n{caption['text']}\n")
    scene['captions'] = captions
    offset += math.ceil((scene['durationSec']+0.45)*30)/30
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
(p / 'output/captions.en.srt').write_text('\n'.join(srt))
print(f'{len(srt)} caption phrases; total timeline {offset:.3f}s')
