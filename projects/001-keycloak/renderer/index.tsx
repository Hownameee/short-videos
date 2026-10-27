import {AbsoluteFill,Audio,Composition,registerRoot,Sequence,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {KaraokeCaptions} from '../../../renderer/src/KaraokeCaptions';
import {BackgroundMusic} from '../../../renderer/src/BackgroundMusic';
import type {VideoProps,VoiceScene,VideoData} from '../../../renderer/src/video-types';
import {Api,Exchange,Hook,Payoff,Redirect,Tokens} from './scenes';
import {C,Txt} from './visuals';
import videoData from '../video.json';
import manifestData from '../output/docs/voice-manifest.json';
import audioData from '../output/docs/audio-timeline.json';
const titles=[['You clicked','Log in. Now what?'],['Your app sends you','to Keycloak.'],['The code comes back.','Then the exchange.'],['Two tokens.','Two different jobs.'],['The API makes','the final check.'],['One login.','Three clear steps.']];
const visuals=[Hook,Redirect,Exchange,Tokens,Api,Payoff];
const Scene=({index,voice}:{index:number;voice:VoiceScene})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig();const t=frame/fps;const Visual=visuals[index];
 return <AbsoluteFill><svg width={1080} height={1920} viewBox="0 0 1080 1920"><Txt x={90} y={198} size={26} color={C.cyan} weight={700}>KEYCLOAK / THE LOGIN JOURNEY</Txt><Txt x={90} y={333} size={72} weight={700}>{titles[index][0]}</Txt><Txt x={90} y={420} size={72} weight={700}>{titles[index][1]}</Txt><line x1={90} y1={485} x2={900} y2={485} stroke={C.line} strokeWidth={2}/><Txt x={90} y={535} size={24} color={C.muted}>BROWSER APP · CODE FLOW + PKCE</Txt><Visual t={t}/></svg><div style={{position:'absolute',top:1460,left:82,width:820,minHeight:150,fontSize:42,lineHeight:1.32,fontWeight:600,textAlign:'center',color:C.white}}><KaraokeCaptions captions={voice.captions} words={voice.words??[]} timeMs={t*1000} highlight={C.green}/></div><div style={{position:'absolute',bottom:182,left:90,color:C.muted,fontSize:22,letterSpacing:3}}>FOLLOW THE REQUEST<span style={{marginLeft:340}}>{'0'+(index+1)} / 06</span></div></AbsoluteFill>;
};
const Video=(props:VideoProps)=>{
 const {width,fps}=useVideoConfig();
 return <AbsoluteFill style={{backgroundColor:C.bg,fontFamily:'Arial, sans-serif'}}><div style={{width:1080,height:1920,position:'absolute',transform:`scale(${width/1080})`,transformOrigin:'top left',backgroundImage:'radial-gradient(ellipse at 80% 25%, #153846 0%, #091A25 65%)'}}>{props.audioTimeline!.scenes.map((scene,i)=><Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.endFrame-scene.startFrame} premountFor={fps}><Scene index={i} voice={props.voiceManifest.scenes[i]}/></Sequence>)}</div><Audio src={staticFile(`${props.assetRoot}/${props.audioTimeline!.audioFile}`)}/><BackgroundMusic video={props.video} assetRoot={props.assetRoot}/></AbsoluteFill>;
};
const Root=()=> <Composition id="KeycloakLogin" component={Video} width={2160} height={3840} fps={60} durationInFrames={audioData.totalFrames} defaultProps={{video:videoData as VideoData,voiceManifest:manifestData,audioTimeline:audioData,assetRoot:'workflow/001-keycloak',renderMode:'preview'}} calculateMetadata={({props})=>({durationInFrames:props.audioTimeline!.totalFrames,width:props.video.meta.width,height:props.video.meta.height,fps:props.video.meta.fps})}/>;
registerRoot(Root);
