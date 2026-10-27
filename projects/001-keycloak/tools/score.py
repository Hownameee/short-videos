"""Original electronic score with phrase structure and narration-aware ducking."""
from pathlib import Path
import json, hashlib
import numpy as np
import soundfile as sf
p=Path(__file__).resolve().parents[1]
tl=json.loads((p/'output/docs/audio-timeline.json').read_text()); sr=24000; dur=tl['durationSeconds']; n=round(dur*sr); t=np.arange(n)/sr
mix=np.zeros(n); beat=60/104; rng=np.random.default_rng(26)
chords=[[50,57,60,64],[46,53,57,60],[53,60,64,67],[48,55,59,62]]
def add(start,length,freq,gain,kind='pluck'):
 a=round(start*sr); b=min(n,a+round(length*sr))
 if a>=n:return
 u=np.arange(b-a)/sr
 if kind=='pad': env=np.sin(np.pi*u/length)**2; wave=np.sin(2*np.pi*freq*u)+.17*np.sin(2*np.pi*freq*2*u)
 elif kind=='kick':env=np.exp(-u*18); wave=np.sin(2*np.pi*(48*u+2.5*(1-np.exp(-u*22))))
 elif kind=='hat':env=np.exp(-u*65); noise=rng.standard_normal(len(u)); wave=np.concatenate(([0],np.diff(noise)))*.5
 else:env=(1-np.exp(-u*90))*np.exp(-u*4.5);wave=np.sin(2*np.pi*freq*u)+.25*np.sin(2*np.pi*freq*2*u)+.08*np.sin(2*np.pi*freq*3*u)
 mix[a:b]+=gain*wave*env
for bar in range(int(dur/(beat*4))+1):
 st=bar*beat*4; chord=chords[bar%4]
 for midi in chord:add(st,beat*4,440*2**((midi-69)/12),.025,'pad')
 for k in range(4):
  add(st+k*beat,.25,48,.075,'kick')
  add(st+(k+.5)*beat,.09,0,.018,'hat')
  midi=chord[[0,2,1,3][k]]+12
  add(st+k*beat,1.0,440*2**((midi-69)/12),.042)
# Evolving opening and final harmonic lift.
arc=np.interp(t,[0,6,17,45,tl['scenes'][-1]['startSeconds'],dur],[.8,.65,.53,.58,.85,.7])
voice,_=sf.read(p/'output/voice/full.wav');block=240
energy=np.array([np.sqrt(np.mean(voice[i:i+block]**2)) for i in range(0,len(voice),block)])
active=(energy>.014).astype(float); smoothed=np.convolve(active,np.ones(21)/21,mode='same')
duck=np.interp(t,np.arange(len(smoothed))*.01,1-.32*smoothed)
fade=np.minimum(1,t/.6)*np.minimum(1,np.maximum(0,(dur-t)/1.6))
mix*=arc*duck*fade
# Keep the effective music around 16 dB beneath active narration.
mask=(np.interp(t,np.arange(len(active))*.01,active)>.8)&(t>1)&(t<dur-2)
vrms=np.sqrt(np.mean(voice[mask]**2)); mrms=np.sqrt(np.mean(mix[mask]**2)); mix*=vrms/(10**(16/20)*mrms)
out=p/'assets/music/login-journey.wav'; sf.write(out,mix,sr,subtype='PCM_16')
report={'durationSec':dur,'sampleRate':sr,'bpm':104,'voiceActiveRmsDbfs':float(20*np.log10(vrms)),'musicActiveRmsDbfs':float(20*np.log10(np.sqrt(np.mean(mix[mask]**2)))),'differenceDb':16,'method':'RMS over identical 10ms voice-active windows, voice threshold 0.014, excluding first 1s and last 2s; baked arc, ducking and fades','musicSha256':hashlib.sha256(out.read_bytes()).hexdigest(),'listening':'not-performed'}
(p/'output/docs/mix-evidence.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
