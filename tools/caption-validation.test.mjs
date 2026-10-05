import assert from "node:assert/strict";
import test from "node:test";
import { validateVoiceCaptions } from "./caption-validation.mjs";

const fixture = () => ({
  video: { audio: {}, scenes: [{ id: "hook", narration: "Hello world." }] },
  manifest: {
    scenes: [
      {
        id: "hook",
        durationSec: 1.5,
        words: [
          { text: "Hello", startMs: 100, endMs: 450 },
          { text: "world.", startMs: 700, endMs: 1300 },
        ],
        captions: [{ text: "Hello world.", startMs: 100, endMs: 1500 }],
      },
    ],
  },
});

test("default karaoke accepts measured words with natural silence", () => {
  const { video, manifest } = fixture();
  assert.doesNotThrow(() => validateVoiceCaptions(video, manifest));
});

test("karaoke rejects old sentence-only manifests before rendering", () => {
  const { video, manifest } = fixture();
  delete manifest.scenes[0].words;
  assert.throws(
    () => validateVoiceCaptions(video, manifest),
    /measured timestamps/,
  );
});

test("rejects overlapping words, stale text and captions that cut words", () => {
  for (const mutate of [
    (m) => {
      m.scenes[0].words[1].startMs = 200;
    },
    (m) => {
      m.scenes[0].words[1].text = "wrong";
    },
    (m) => {
      m.scenes[0].captions[0].endMs = 800;
    },
    (m) => {
      m.scenes[0].words[1].endMs = 1600;
    },
    (m) => {
      m.scenes[0].id = "wrong-order";
    },
  ]) {
    const { video, manifest } = fixture();
    mutate(manifest);
    assert.throws(() => validateVoiceCaptions(video, manifest));
  }
});

test("explicit phrase captions opt out; misspelled modes do not", () => {
  const { video, manifest } = fixture();
  delete manifest.scenes[0].words;
  video.captions = { mode: "phrase" };
  assert.doesNotThrow(() => validateVoiceCaptions(video, manifest));
  video.captions.mode = "word-higlight";
  assert.throws(
    () => validateVoiceCaptions(video, manifest),
    /Unknown captions.mode/,
  );
});

test("pronunciation substitutions validate spoken words instead of display spelling", () => {
  const { video, manifest } = fixture();
  video.scenes[0].narration = "Hello K8s.";
  video.scenes[0].pronunciation = [{ written: "K8s", spoken: "world" }];
  assert.doesNotThrow(() => validateVoiceCaptions(video, manifest));
});
