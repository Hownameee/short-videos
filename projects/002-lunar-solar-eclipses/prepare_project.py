"""Authored content and provenance for this eclipse explainer."""
import json
from pathlib import Path

p = Path(__file__).parent
def write(name, value):
    (p / name).write_text(json.dumps(value, indent=2) + '\n')

sources = [
    {'id': 'nasa-eclipses', 'publisher': 'NASA Science', 'title': 'Eclipses and the Moon', 'url': 'https://science.nasa.gov/moon/eclipses/', 'accessedAt': '2026-10-05'},
    {'id': 'nasa-geometry', 'publisher': 'NASA Science', 'title': 'Why Do Eclipses Happen?', 'url': 'https://science.nasa.gov/eclipses/geometry/', 'accessedAt': '2026-10-05'},
    {'id': 'nasa-safety', 'publisher': 'NASA Science', 'title': 'Eclipse Viewing Safety', 'url': 'https://science.nasa.gov/eclipses/safety/', 'accessedAt': '2026-10-05'},
]
claims = [
    {'id': 'solar', 'text': 'For a solar eclipse the Moon is between Sun and Earth; its shadow reaches part of Earth.', 'sourceIds': ['nasa-eclipses']},
    {'id': 'corona', 'text': 'At total solar eclipse the bright solar disk is hidden and the corona can be seen.', 'sourceIds': ['nasa-eclipses']},
    {'id': 'lunar', 'text': 'For a lunar eclipse Earth is between Sun and Moon; the Moon enters Earth\'s shadow.', 'sourceIds': ['nasa-eclipses']},
    {'id': 'red', 'text': 'During total lunar eclipse sunlight filtered and bent by Earth\'s atmosphere can illuminate the Moon red/orange.', 'sourceIds': ['nasa-eclipses']},
    {'id': 'tilt', 'text': 'The Moon\'s orbital plane is tilted about five degrees relative to Earth\'s orbital plane, so eclipses do not occur every month.', 'sourceIds': ['nasa-geometry']},
    {'id': 'safe', 'text': 'Direct solar viewing needs appropriate solar protection; ordinary sunglasses are unsafe. Direct-view eclipse glasses should meet ISO 12312-2.', 'sourceIds': ['nasa-safety']},
]
write('research.json', {'schemaVersion': 1, 'claims': claims, 'sources': sources})
(p/'research.md').write_text('# Lunar and solar eclipses\n\nPrimary sources checked: NASA Science, 2026-10-05.\n\n' + '\n'.join('- '+c['text'] for c in claims) + '\n\n' + '\n'.join('- ['+s['title']+']('+s['url']+')' for s in sources) + '\n\nAll visual geometry is schematic, not to scale. The red-Moon sequence depicts total lunar eclipse, not every lunar eclipse. Moon and Earth cast shadows; the Sun emits light. Motion is explanatory and time-compressed. No upcoming-event or visibility prediction is made.\n')
write('directions.json', {'schemaVersion': 1, 'directions': [
    {'id': 'two-shadows', 'title': 'Two eclipses. Two shadows.', 'tensionHook': 'One hides the Sun. The other turns the Moon red.', 'promise': 'Understand which body blocks the light and which receives the shadow.', 'payoff': 'Solar means Moon shadow on Earth; lunar means Earth shadow on Moon.', 'coreBeats': ['Solar alignment', 'Lunar alignment and red light', 'Orbital tilt'], 'evidenceIds': ['solar','lunar','red','tilt'], 'visualApproach': 'Original space illustrations, moving alignments and shadow sweeps'},
    {'id': 'missing-month', 'title': 'Why not every month?', 'tensionHook': 'The Moon circles Earth every month. Why not a monthly eclipse?', 'promise': 'Explain the role of orbital inclination.', 'payoff': 'The shadows usually miss because the orbital planes differ.'}
], 'recommendedDirectionId': 'two-shadows'})

rows = [
    ('hook', ['Same three worlds.', 'Two different eclipses.'], "One hides the Sun. The other turns the Moon red. Here's the difference.", 'Twin disks: Moon crosses the Sun while a second Moon darkens to copper.', ['solar','lunar']),
    ('solar', ['SOLAR ECLIPSE', 'The Moon is in between.'], 'In a solar eclipse, the Moon moves between the Sun and Earth. Its shadow falls on a small part of Earth.', 'Moon moves into Sun-Earth alignment; its narrow shadow meets Earth.', ['solar']),
    ('totality', ['The Sun disappears.', 'The corona emerges.'], "From that shadow, the Moon can cover the Sun. During totality, the Sun's outer atmosphere, the corona, becomes visible.", 'Large Moon disk crosses the solar disk; corona appears at complete coverage.', ['corona']),
    ('lunar', ['LUNAR ECLIPSE', 'Earth is in between.'], "In a lunar eclipse, Earth sits between the Sun and Moon. The Moon travels through Earth's shadow.", 'Earth remains central while Moon moves into its shadow cone.', ['lunar']),
    ('red', ['Why does it turn red?', 'Sunlight takes a detour.'], "During a total lunar eclipse, some sunlight bends through Earth's atmosphere. More red light reaches the Moon, giving it a copper glow.", 'Warm light paths curve around Earth and reach a Moon that changes from gray to copper.', ['red']),
    ('tilt', ['Why not every month?', 'A five-degree tilt.'], "Why not every month? The Moon's orbit is tilted about five degrees, so the shadows usually miss.", 'Moon follows a tilted orbital track and misses the extended shadow axis.', ['tilt']),
    ('recap', ['Follow the shadow.', 'Remember the difference.'], "Solar: the Moon's shadow on Earth. Lunar: Earth's shadow on the Moon. For solar viewing, use proper eclipse glasses, never ordinary sunglasses.", 'Two animated alignment rows recap the shadow direction, then reveal the solar-viewing note.', ['solar','lunar','safe']),
]
scenes = [{'id': identifier, 'purpose': title[0], 'narration': narration, 'onScreenText': title, 'durationRangeSec': {'min': 3, 'max': 15}, 'visualType': identifier, 'visual': visual, 'motion': {'action': visual, 'cue': 'Narration word timestamps and normalized scene duration', 'settle': 'Hold the final alignment for the conclusion'}, 'sfx': [], 'sourceIds': ids} for identifier,title,narration,visual,ids in rows]
video = {'schemaVersion': 1, 'meta': {'title': 'Lunar vs Solar Eclipses — Follow the Shadow', 'renderer': 'eclipses', 'language': 'en', 'platform': 'youtube_shorts', 'width': 1080, 'height': 1920, 'fps': 30}, 'captions': {'mode': 'word-highlight'}, 'audio': {'voice': {'provider': 'kokoro', 'model': 'hexgrad/Kokoro-82M', 'voice': 'af_heart', 'langCode': 'a', 'sampleRate': 24000, 'speed': 0.98}, 'music': {'file': 'assets/music/orbital-ambient.wav', 'volume': 0.13}}, 'design': {'visualThesis': 'Moving shadows make the two alignments instantly distinguishable.', 'mood': ['cosmic','clear','cinematic'], 'palette': {'background': '#050813', 'text': '#F5F3EB', 'muted': '#A3ADC3', 'accent': '#FFCF7B', 'solar': '#FFCF7B', 'lunar': '#99B7FF', 'copper': '#DD7851'}, 'typography': {'display': 'Arial', 'body': 'Arial'}, 'safeArea': {'top': 155, 'left': 90, 'right': 175, 'bottom': 330}, 'motionGrammar': 'Orbital movement, moving shadow cones, continuous solar transit, curved light rays; no static-slide substitutes.', 'assetLanguage': 'Original SVG planetary illustrations with shading and craters. No external imagery. Diagrams labeled not to scale.'}, 'scenes': scenes, 'authorization': {'mode': 'user-delegated', 'quote': 'automation all -> output mp4 clip', 'scope': 'Select direction, approve script and deliver rendered final MP4', 'assumption': 'sonar esclipse means solar eclipse'}}
write('video.json',video)
(p/'script.md').write_text('# Lunar vs Solar Eclipses — Follow the Shadow\n\nEnglish vertical short, general audience, target 60–75 seconds. User delegated the complete workflow. Interpretation: sonar means solar.\n\nPromise: understand the two shadows. Payoff: identify the body in the middle. Script reviewed against the NASA fact pack.\n\n'+'\n'.join('## '+s['id']+'\n\n'+s['narration']+'\n\nVisual: '+s['visual']+'\nSources: '+', '.join(s['sourceIds'])+'\n' for s in scenes))
write('assets/sources.json',{'schemaVersion':1,'assets':[{'id':'planetary-art','source':'Original SVG in renderer/src/EclipseVideo.tsx','license':'project-original'},{'id':'ambient-music','source':'Project make_soundtrack.py; original synthesized tones','license':'project-generated'},{'id':'narration','source':'https://huggingface.co/hexgrad/Kokoro-82M','license':'Apache-2.0 model; generated narration'}],'research':sources})
