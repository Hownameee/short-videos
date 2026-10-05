import json
from pathlib import Path

p = Path(__file__).parent
video = json.loads((p / 'video.json').read_text())
old_version = video.pop('scriptVersion')
video.pop('approval')
video['meta'].update(title='Kubernetes: One Pod disappears. Who brings it back?', captionLanguage='en')
titles = [
    ['One Pod disappears.', 'Who brings it back?'],
    ['You declare it.', 'Kubernetes maintains it.'],
    ['Desired: three.', 'Actual: two.'],
    ['Notice the gap.', 'Create a new Pod.'],
    ['Pods change.', 'The address stays.'],
    ['Self-healing.', 'Not magic.'],
    ['Declare the goal.', 'Keep closing the gap.'],
]
for scene, title in zip(video['scenes'], titles, strict=True):
    scene['purpose'] = ' '.join(title)
    scene['onScreenText'] = title
    scene['phrases'] = [{'en': phrase['en']} for phrase in scene['phrases']]
(p / 'video.json').write_text(json.dumps(video, indent=2) + '\n')
(p / 'script.md').write_text('# Kubernetes: One Pod disappears. Who brings it back?\n\nEnglish narration, titles and captions. Vertical 1080x1920, 30 fps. Target 60-75 seconds. Audience: junior developers. User delegated all production decisions and subsequently specified English only.\n\nPromise: explain reconciliation through one deleted managed Pod. Native schematic animation, not a recording of a live cluster. No guaranteed instant recovery or zero downtime claim.\n\n' + '\n'.join('## ' + s['purpose'] + '\n\n' + s['narration'] + '\n\nVisual: ' + s['visualType'] + '. Sources: ' + ', '.join(s['sourceIds']) + '.\n' for s in video['scenes']))
state = json.loads((p / 'state.json').read_text())
state['state'] = 'direction_selected'
state['versions']['script'] = None
state['revisionHistory'] = [{'supersededScript': old_version, 'reason': 'User correction: English only; invalidate previous script approval before regenerating.'}]
(p / 'state.json').write_text(json.dumps(state, indent=2) + '\n')
