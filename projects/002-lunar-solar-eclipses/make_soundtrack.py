"""Create a speech-ducked curiosity score, SRT captions and scene timings."""
import hashlib
import json
import math
from pathlib import Path
import numpy as np
import soundfile as sf

p=Path(__file__).parent
manifest=json.loads((p/'voice/manifest.json').read_text())
timings=[]
cursor=0
for s in manifest['scenes']:
    frames=math.ceil((s['durationSec']+0.45)*30)
    timings.append({'id':s['id'],'fromFrame':cursor,'durationInFrames':frames,'voiceSec':s['durationSec']})
    cursor+=frames
duration=cursor/30
rate=48000
t=np.arange(round(duration*rate))/rate
music=np.zeros((len(t),2))
beat=60/86
starts={s['id']:s['fromFrame']/30 for s in timings}
cues=[
    {'id':'corona-reveal','atSec':starts['totality']+3.4},
    {'id':'copper-moon','atSec':starts['red']+5.5},
    {'id':'resolved-recap','atSec':starts['recap']},
]

def add_note(start, length, midi, level, pan=0, attack=0.02, decay=0.6):
    """Soft harmonic plucks/pads; equal-power pan remains audible in mono."""
    first=round(start*rate)
    count=min(round(length*rate), len(t)-first)
    if count<=0:
        return
    local=np.arange(count)/rate
    freq=440*2**((midi-69)/12)
    envelope=(1-np.exp(-local/attack))*np.exp(-local/decay)
    envelope*=np.clip((length-local)/0.12,0,1)
    tone=(np.sin(2*np.pi*freq*local)
          +0.24*np.sin(2*np.pi*freq*2*local)*np.exp(-local/0.35)
          +0.08*np.sin(2*np.pi*freq*3*local)*np.exp(-local/0.18))
    gains=np.array([math.sqrt((1-pan)/2),math.sqrt((1+pan)/2)])
    music[first:first+count]+=level*(tone*envelope)[:,None]*gains

# Minor/add-nine harmony creates curiosity; the recap settles into E-flat major.
chords=[[48,55,62,63],[44,51,58,60],[46,53,60,62],[43,50,57,58]]
for bar,start in enumerate(np.arange(0,duration,beat*4)):
    chord=[51,58,62,67] if start>=starts['recap'] else chords[bar%4]
    for index,note in enumerate(chord):
        add_note(start,beat*5,note,0.2,pan=(index-1.5)*0.25,attack=0.35,decay=3.0)
    for step,degree in enumerate([0,2,1,3,2,1,3,2]):
        when=start+step*beat/2
        level=0.24 if step%2==0 else 0.13
        add_note(when,1.7,chord[degree]+12,level,pan=(-0.32 if step%2 else 0.32))
        # A quiet stereo echo gives the pluck space without a dense melody.
        add_note(when+beat*0.75,1.2,chord[degree]+12,level*0.22,pan=(-0.4 if step%2==0 else 0.4))
    for pulse in range(4):
        add_note(start+pulse*beat,0.45,chord[0]-12,0.22,attack=0.008,decay=0.15)
        add_note(start+pulse*beat,0.35,chord[0],0.1,attack=0.008,decay=0.12)

# Tonal swells lead into the visible reveals, with restrained chime tails.
for cue in cues:
    at=cue['atSec']
    local=t-(at-1.4)
    swell=np.clip(local/1.4,0,1)**2*np.clip((1.6-local)/0.2,0,1)
    for channel in range(2):
        music[:,channel]+=0.12*swell*np.sin(2*np.pi*(196*local+26*local**2)+channel*0.2)
    for index,note in enumerate([63,67,74]):
        add_note(at+index*0.07,3,note,0.19,pan=(index-1)*0.3,attack=0.015,decay=0.85)

# A short dip before the next question lets the narration reset the tension.
question=starts['tilt']
arc=np.interp(t,[0,4,starts['solar'],starts['totality'],question-0.2,question,
                 question+0.5,question+1.4,starts['recap'],duration],
              [1.1,1.1,0.8,1,1,0.38,0.38,0.95,1.1,1])
speech=np.zeros_like(t)
voice_mix=np.zeros_like(t)
for scene,timing in zip(manifest['scenes'],timings,strict=True):
    offset=timing['fromFrame']/30
    voice,voice_rate=sf.read(p/'voice'/scene['file'])
    if voice.ndim==2:
        voice=voice.mean(axis=1)
    first=round(offset*rate)
    count=min(round(len(voice)/voice_rate*rate),len(t)-first)
    voice_mix[first:first+count]=np.interp(np.arange(count)/rate,np.arange(len(voice))/voice_rate,voice)
    for word in scene['words']:
        start=offset+word['startMs']/1000
        end=offset+word['endMs']/1000
        first=max(0,round((start-0.06)*rate))
        last=min(len(t),round((end+0.2)*rate))
        envelope=np.minimum(np.clip((t[first:last]-start+0.06)/0.06,0,1),
                            np.clip((end+0.2-t[first:last])/0.2,0,1))
        speech[first:last]=np.maximum(speech[first:last],envelope)
duck=1-0.4*speech
fade=np.clip(t/0.18,0,1)*np.clip((duration-t)/1.1,0,1)
music*=(arc*duck*fade)[:,None]

# Calibrate against the actual voice, not just an arbitrary volume slider.
# Target music RMS 14 dB below speech-active narration at the configured gain.
volume=json.loads((p/'video.json').read_text())['audio']['music']['volume']
active=speech>0.9
voice_rms=np.sqrt(np.mean(voice_mix[active]**2))
music_rms=np.sqrt(np.mean(music[active]**2))
gain=voice_rms*10**(-14/20)/(music_rms*volume)
music*=min(gain,0.85/np.max(np.abs(music)))
metrics={
    'speechActiveVoiceRmsDbfs':float(20*np.log10(voice_rms)),
    'speechActiveMusicRmsDbfs':float(20*np.log10(np.sqrt(np.mean(music[active]**2))*volume)),
    'musicPeakDbfs':float(20*np.log10(np.max(np.abs(music)))),
    'preNormalizationMixPeakDbfs':float(20*np.log10(np.max(np.abs(voice_mix[:,None]+music*volume)))),
}
target=p/'assets/music/orbital-ambient.wav'
sf.write(target,music,rate,subtype='PCM_16')
(p/'assets/audio-manifest.json').write_text(json.dumps({
    'generator':'make_soundtrack.py','license':'project-generated',
    'file':'assets/music/orbital-ambient.wav','durationSec':len(t)/rate,
    'sampleRate':rate,'channels':2,'bpm':86,
    'description':'Original curiosity pulse, evolving pads, reveal swells and warm resolution',
    'mix':{'volume':volume,'speechDuckGain':0.6,'fadeInSec':0.18,'fadeOutSec':1.1,**metrics},
    'cues':cues,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),
    'generatorSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
},indent=2)+'\n')
(p/'timings.json').write_text(json.dumps(timings,indent=2)+'\n')
def ts(ms):
    ms=round(ms)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
captions=[]
for s,timing in zip(manifest['scenes'],timings,strict=True):
    offset=timing['fromFrame']/30*1000
    for c in s['captions']:
        captions.append(f"{len(captions)+1}\n{ts(offset+c['startMs'])} --> {ts(offset+c['endMs'])}\n{c['text']}\n")
(p/'output/captions.en.srt').write_text('\n'.join(captions))
print(json.dumps({'durationSec':duration,'frames':cursor,'captionPhrases':len(captions),'timings':timings},indent=2))
