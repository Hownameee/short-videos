import assert from 'node:assert/strict';
import test from 'node:test';
import {resolveProductionVideo, validateRenderConfig, expectedDuration, reviewTimes} from './production-config.mjs';

const base = () => ({scriptVersion:'v1',meta:{renderer:'eclipses',width:1080,height:1920,fps:30},audio:{music:{file:'assets/music/score.wav',volume:0.2}},scenes:[{id:'hook',onScreenText:['Hook']},{id:'solar',onScreenText:['Solar']}]});

test('production overlays cannot alter approved narrative and reject unknown/stale settings', () => {
  const video = base();
  const overlay = {schemaVersion:1,scriptVersion:'v1',audio:{music:null,sfx:false},captions:{mode:'none'}};
  const resolved = resolveProductionVideo(video, overlay);
  validateRenderConfig(resolved);
  assert.equal(resolved.audio.music,null);
  assert.equal(video.audio.music.volume,0.2);
  for(const extra of [{scenes:[]},{audio:{voice:{speed:2}}},{scriptVersion:'v2'}]) {
    assert.throws(() => resolveProductionVideo(video,{...overlay,...extra}), /Unsupported|stale/);
  }
});

test('render preflight rejects ignored configuration and escaping assets', () => {
  for(const mutate of [v=>v.meta.renderer='unknown',v=>v.captions={mode:'other'},v=>v.scenes[0].id='unknown',v=>v.scenes[0].onScreenText='string',v=>delete v.audio.music,v=>v.audio.music.volume=0,v=>v.audio.music.file='assets/../secret.wav',v=>v.audio.music.file='https://example.com/track.wav']) {
    const video=base(); mutate(video); assert.throws(()=>validateRenderConfig(video));
  }
  for(const mode of ['word-highlight','phrase','none']) validateRenderConfig({...base(),captions:{mode}});
});

test('contact sheet covers each scene plus opening and final frame', () => {
  const video=base(); const manifest={scenes:[{durationSec:1},{durationSec:2}]};
  assert.equal(expectedDuration(video,manifest),118/30);
  assert.deepEqual(reviewTimes(video,manifest),[0,22/30,81/30,117/30]);
});
