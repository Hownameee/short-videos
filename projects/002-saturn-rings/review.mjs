import {bundleProject} from '../../tools/render/project-renderer.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();const projectDir=path.join(root,'projects/002-saturn-rings');
const {serveUrl,require}=await bundleProject(root,projectDir);
const {selectComposition,renderStill,renderMedia,openBrowser}=require('@remotion/renderer');
const read=async f=>JSON.parse(await readFile(path.join(projectDir,f),'utf8'));
const inputProps={video:await read('video.json'),voiceManifest:await read('output/docs/voice-manifest.json'),audioTimeline:await read('output/docs/audio-timeline.json'),assetRoot:'workflow/002-saturn-rings',renderMode:'preview'};
const chromiumOptions={gl:'angle'};
const browser=await openBrowser('chrome',{chromiumOptions});
const comp=await selectComposition({serveUrl,id:'SaturnRings',inputProps,puppeteerInstance:browser,chromiumOptions});
const frames=process.argv.slice(2).map(Number);
for(const frame of frames.length?frames:[0,180,650,1100,1660]){
 await renderStill({serveUrl,composition:comp,inputProps,frame,scale:.25,imageFormat:'png',output:path.join(projectDir,`output/docs/evidence/frame-${frame}.png`),puppeteerInstance:browser,chromiumOptions});
 console.log('frame',frame);
}
if(process.env.ANIMATIC==='1') await renderMedia({serveUrl,composition:comp,inputProps,frameRange:[360,720],scale:.25,concurrency:1,codec:'h264',outputLocation:path.join(projectDir,'output/docs/evidence/animatic.mp4'),puppeteerInstance:browser,chromiumOptions});
await browser.close({silent:true});
