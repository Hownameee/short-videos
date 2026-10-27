import {useMemo} from 'react';
import {AbsoluteFill, Audio, Composition, registerRoot, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {KaraokeCaptions} from '../../../renderer/src/KaraokeCaptions';
import {BackgroundMusic} from '../../../renderer/src/BackgroundMusic';
import type {VideoProps,VideoData,VoiceScene} from '../../../renderer/src/video-types';
import video from '../video.json';
import voices from '../output/docs/voice-manifest.json';
import timeline from '../output/docs/audio-timeline.json';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>{const x=clamp(n);return x*x*(3-2*x);};
const seed=(i:number)=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const cue=(voice:VoiceScene,word:string)=>{const found=voice.words?.find(w=>w.text.toLowerCase().replace(/[^a-z]/g,'')===word);if(!found)throw new Error(`Missing cue ${word}`);return found.startMs/1000;};
const planetMaterial={
 vertexShader:`varying vec3 vNormal; varying vec3 vPosition; void main(){vNormal=normalize(normalMatrix*normal);vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec3 vNormal;varying vec3 vPosition;void main(){float y=vPosition.y;float b=sin(y*29.+sin(y*13.)*.7)*.5+.5;float fine=sin(y*110.)*.03;vec3 c=mix(vec3(.49,.35,.21),vec3(.91,.77,.52),b*.45+.35+fine);float light=max(dot(normalize(vNormal),normalize(vec3(-.6,.7,1.))),0.);float rim=pow(1.-abs(normalize(vNormal).z),3.);gl_FragColor=vec4(c*(.15+light*.95)+vec3(.18,.27,.32)*rim*.3,1.);}`
};
function Saturn({time=0,lanes=false}:{time?:number;lanes?:boolean}){
 return <group rotation={[0.30,0,-0.34]}><mesh scale={[1,.91,1]}><sphereGeometry args={[1,72,48]}/><shaderMaterial {...planetMaterial}/></mesh>
 <mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.31,2.55,192]}/><shaderMaterial side={THREE.DoubleSide} vertexShader={`varying vec2 p;void main(){p=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`} fragmentShader={`varying vec2 p;void main(){float r=length(p);if(r>1.91&&r<2.03)discard;float b=.57+.09*sin(r*31.)+.045*sin(r*91.);if(r<1.5)b*=.65;vec3 c=vec3(1.,.89,.72)*b;gl_FragColor=vec4(c,1.);}`}/></mesh>
 {lanes&&[1.6,2.3].map((r,i)=><group key={r}><mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[r-.009,r+.009,128]}/><meshBasicMaterial color={i?'#ffe5a8':'#77e6f7'} side={THREE.DoubleSide}/></mesh><mesh position={[Math.cos(time*(i?.38:.7))*r,.035,Math.sin(time*(i?.38:.7))*r]}><sphereGeometry args={[.055,12,10]}/><meshBasicMaterial color={i?'#ffe5a8':'#77e6f7'}/></mesh></group>)}
 </group>;
}
function Ice({time,large=false,reveal=0}:{time:number;large?:boolean;reveal?:number}){
 const geo=useMemo(()=>new THREE.IcosahedronGeometry(1,0),[]);
 return <group rotation={[.12,0,-.13]}>{Array.from({length:100},(_,i)=>{const x=(seed(i*3)-.5)*12;const z=(seed(i*3+1)-.5)*12;const s=.04+seed(i*3+2)*.16;return <mesh key={i} geometry={geo} position={[x+time*.18,Math.sin(i)*.09,z]} scale={[s,s*.65,s*.9]} rotation={[i,time*.07+i,i*.3]}><meshStandardMaterial color={i%4?'#a8cfdf':'#d6e8ef'} metalness={.18} roughness={.28} flatShading/></mesh>;})}
 <mesh geometry={geo} position={[large?3.8-3.1*reveal:-.2,large?.45:0,large?.7:1]} scale={large?[.93,.76,.86]:[.48,.35,.42]} rotation={[.3,time*.11,.4]}><meshStandardMaterial color="#c5e8f0" roughness={.2} metalness={.25} flatShading/></mesh></group>;
}
function World({index,t,voice}:{index:number;t:number;voice:VoiceScene}){
 const {camera}=useThree();
 let pos:[number,number,number];
 if(index===0){const q=ease((t-cue(voice,'closer'))/3);pos=[.2+q*.6,3.4-q*.9,7.8-q*2.4];}
 else if(index===1)pos=[2.9-t*.1,2.7,5.8-t*.12];
 else if(index===2){const q=ease((t-cue(voice,'far'))/2);pos=t>=cue(voice,'far')?[.5,3.2+q*.5,5.5+q*2.5]:[2.8-t*.11,2.5,5.2];}
 else {const q=ease((t-1)/5);pos=[1.5-q,2.5+q*1.2,5.8+q*2.4];}
 camera.position.set(...pos);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 return <><ambientLight intensity={.8}/><directionalLight position={[-4,6,5]} intensity={3} color="#fff0d3"/><directionalLight position={[5,2,-3]} intensity={2} color="#75bce5"/>
 {index===0||index===3||(index===2&&t>=cue(voice,'far'))?<Saturn time={Math.max(0,t-(index===3?cue(voice,'speeds'):0))} lanes={index===3&&t>=cue(voice,'speeds')}/>:<Ice time={t} large={index===2} reveal={index===2?ease((t-cue(voice,'house')+.4)/1.5):0}/>}
 </>;
}
const Scene=({index,voice,mode}:{index:number;voice:VoiceScene;mode:'word-highlight'|'phrase'|'none'})=>{
 const f=useCurrentFrame(),{fps,width,height}=useVideoConfig();const t=f/fps;
 const line=video.scenes[index].onScreenText;
 return <AbsoluteFill>
 <div style={{position:'absolute',top:height*.24,width,height:height*.43}}><ThreeCanvas width={width} height={Math.round(height*.43)} camera={{fov:43,near:.1,far:100}} gl={{antialias:true,alpha:true}}><World index={index} t={t} voice={voice}/></ThreeCanvas></div>
 <div style={{position:'absolute',width:1080,height:1920,transform:`scale(${width/1080})`,transformOrigin:'top left',color:'#f5f3ed'}}>
 <div style={{position:'absolute',left:84,top:155,color:'#83e1ef',fontSize:24,letterSpacing:6}}>A CLOSER LOOK / SATURN</div>
 <div style={{position:'absolute',left:80,top:242,width:870,fontSize:index===0?110:61,fontWeight:750,lineHeight:1.04,letterSpacing:-2}}>{line[0]}</div>
 <div style={{position:'absolute',left:84,top:395,width:840,fontSize:44,color:'#c3d0dc',lineHeight:1.16}}>{line[1]}</div>
 <div style={{position:'absolute',top:1320,left:84,color:'#9aaab9',fontSize:23,letterSpacing:2}}>ILLUSTRATIVE SCALE & MOTION</div>
 <div style={{position:'absolute',top:1410,left:76,width:824,fontSize:41,lineHeight:1.35,fontWeight:600,textAlign:'center'}}><KaraokeCaptions captions={voice.captions} words={voice.words??[]} timeMs={t*1000} highlight="#83e1ef" mode={mode}/></div>
 <div style={{position:'absolute',left:84,top:1650,width:820,borderTop:'1px solid #243340',paddingTop:22,fontSize:21,letterSpacing:2,color:'#91a3b5'}}>NASA · SATURN FACTS <span style={{float:'right'}}>0{index+1} / 04</span></div>
 </div></AbsoluteFill>;
};
const Video=(props:VideoProps)=>{const {fps}=useVideoConfig();return <AbsoluteFill style={{background:'radial-gradient(ellipse at 50% 48%,#152232 0%,#050912 62%)',fontFamily:'Arial, sans-serif'}}>{props.audioTimeline!.scenes.map((s,i)=><Sequence key={s.id} from={s.startFrame} durationInFrames={s.endFrame-s.startFrame} premountFor={fps}><Scene index={i} voice={props.voiceManifest.scenes[i]} mode={props.video.captions?.mode??'word-highlight'}/></Sequence>)}<Audio src={staticFile(`${props.assetRoot}/${props.audioTimeline!.audioFile}`)}/><BackgroundMusic video={props.video} assetRoot={props.assetRoot}/></AbsoluteFill>;};
const Root=()=> <Composition id="SaturnRings" component={Video} width={2160} height={3840} fps={60} durationInFrames={timeline.totalFrames} defaultProps={{video:video as VideoData,voiceManifest:voices,audioTimeline:timeline,assetRoot:'workflow/002-saturn-rings',renderMode:'preview'}} calculateMetadata={({props})=>({durationInFrames:props.audioTimeline!.totalFrames,width:props.video.meta.width,height:props.video.meta.height,fps:props.video.meta.fps})}/>;
registerRoot(Root);
