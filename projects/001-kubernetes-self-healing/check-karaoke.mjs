import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { captionWords, activeWordAt } from '../../renderer/src/karaoke.ts';

const manifest = JSON.parse(await fs.readFile(new URL('./output/docs/voice-manifest.json', import.meta.url), 'utf8'));
let checked = 0;
for (const scene of manifest.scenes) {
  for (const caption of scene.captions) {
    const words = captionWords(scene.words, caption);
    assert.equal(words.map(w => w.text).join(' '), caption.text);
    for (const [i, word] of words.entries()) {
      assert.ok(word.endMs > word.startMs);
      assert.equal(activeWordAt(words, word.startMs), i);
      assert.equal(activeWordAt(words, (word.startMs + word.endMs)/2), i);
      assert.notEqual(activeWordAt(words, word.endMs), i);
      checked++;
    }
  }
}
const hook = manifest.scenes[0];
const firstPhrase = captionWords(hook.words, hook.captions[0]);
assert.equal(firstPhrase[activeWordAt(firstPhrase, 500)].text, 'Delete');
assert.equal(firstPhrase[activeWordAt(firstPhrase, 700)].text, 'one');
assert.equal(firstPhrase[activeWordAt(firstPhrase, 1000)].text, 'Pod.');
assert.equal(activeWordAt(firstPhrase, 0), -1);
console.log(`PASS: ${checked} words; exact caption coverage; start/mid/end boundaries; Delete → one → Pod at 0.50/0.70/1.00s.`);
