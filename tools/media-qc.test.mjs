import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {checkRenderedAudio, measureAudio} from './media-qc.mjs';

const exec = promisify(execFile);
test('actual decode and loudness distinguish normalized, silent, quiet and corrupt media', async () => {
  const root=await mkdtemp(path.join(os.tmpdir(),'video-audio-qc-'));
  try {
    const tone=path.join(root,'tone.wav'); const quiet=path.join(root,'quiet.wav'); const silence=path.join(root,'silence.wav');
    await exec('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=440:duration=3','-af','loudnorm=I=-16:TP=-1.5:LRA=11',tone]);
    assert.equal((await checkRenderedAudio(tone,true)).decode,'passed');
    await exec('ffmpeg',['-v','error','-i',tone,'-af','volume=0.01',quiet]);
    await assert.rejects(checkRenderedAudio(quiet,true),/loudness/);
    await exec('ffmpeg',['-v','error','-f','lavfi','-i','anullsrc=r=24000:cl=mono','-t','3',silence]);
    assert.equal((await measureAudio(silence)).integratedLufs,-Infinity);
    await assert.rejects(checkRenderedAudio(silence,true),/loudness/);
    const broken=path.join(root,'broken.mp4'); await writeFile(broken,'not media');
    await assert.rejects(checkRenderedAudio(broken,false));
  } finally {await rm(root,{recursive:true,force:true});}
});
