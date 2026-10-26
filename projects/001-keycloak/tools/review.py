from pathlib import Path
import json,subprocess
p=Path(__file__).resolve().parents[1]; tl=json.loads((p/'output/docs/audio-timeline.json').read_text()); m=json.loads((p/'output/docs/voice-manifest.json').read_text())
# Three frames through each causal action, plus three consecutive spoken highlights.
local=[[1.4,2.2,3.1],[5.1,5.8,6.4],[5.9,7.5,8.9],[3.4,4.4,5.4],[6.9,7.6,9.9],[.5,2.2,4.4]]
times=[]
for s,cues in zip(tl['scenes'],local):times += [s['startSeconds']+t for t in cues]
for i in [0,4]:
 for w in m['scenes'][i]['words'][3:6]:times.append(tl['scenes'][i]['startSeconds']+(w['startMs']+w['endMs'])/2000)
out=p/'output/docs/review';out.mkdir(exist_ok=True)
for i,t in enumerate(times):
 subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(p/'.cache/review/preview.mp4'),'-frames:v','1','-vf','scale=270:480',str(out/f'{i:02}.png')],check=True)
from PIL import Image,ImageDraw
for batch in range(4):
 canvas=Image.new('RGB',(3*278,2*515),'#101820');draw=ImageDraw.Draw(canvas)
 for j in range(6):
  i=batch*6+j
  im=Image.open(out/f'{i:02}.png');x=(j%3)*278;y=(j//3)*515;canvas.paste(im,(x,y+25));draw.text((x+8,y+6),f'{times[i]:.3f}s',fill='white')
 canvas.save(out/f'motion-{batch}.jpg')
(out/'times.json').write_text(json.dumps({'times':times,'sequence':'First 18: three action states per scene. Last six: consecutive words in hook and API scene.'},indent=2))
