const {createRequire}=require('node:module');
const path=require('node:path');
const fs=require('node:fs');
const r=createRequire(path.resolve('renderer/package.json'));
(async()=>{
 const browser=await r('@remotion/renderer').openBrowser('chrome',{chromiumOptions:{gl:'angle'}});
 const page=await browser.newPage({context:()=>Promise.resolve(null),logLevel:'error',indent:false,pageIndex:0,onBrowserLog:null,onLog:()=>{}});
 const data=await page.evaluate(()=>{const c=document.createElement('canvas');const gl=c.getContext('webgl2');if(!gl)return {available:false};const ext=gl.getExtension('WEBGL_debug_renderer_info');return {available:true,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),maxRenderbufferSize:gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),maxTextureSize:gl.getParameter(gl.MAX_TEXTURE_SIZE)};});
 fs.writeFileSync('projects/002-saturn-rings/output/docs/gpu.json',JSON.stringify(data,null,2));console.log(data);await browser.close({silent:true});
})().catch(e=>{console.error(e);process.exitCode=1;});
