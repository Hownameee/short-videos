const normalize = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

export const validateVoiceCaptions = (video, manifest) => {
  const mode = video.captions?.mode ?? "word-highlight";
  if (!["word-highlight", "phrase", "none"].includes(mode)) {
    throw new Error(`Unknown captions.mode: ${mode}`);
  }
  if (manifest.scenes?.length !== video.scenes.length) {
    throw new Error("Voice scenes must match video scenes in count and order.");
  }
  for (const [index, scene] of video.scenes.entries()) {
    const voice = manifest.scenes[index];
    const fail = (reason) => {
      throw new Error(
        `${scene.id}: ${reason} Regenerate word timestamps with tools/kokoro/generate_audio.py.`,
      );
    };
    if (voice.id !== scene.id)
      fail("Voice scene order does not match the video.");
    if (!Number.isFinite(voice.durationSec) || voice.durationSec <= 0)
      fail("Invalid voice duration.");
    if (mode === "none" || video.audio === null) continue;
    if (mode === "phrase") {
      let previousEnd = 0;
      for (const caption of voice.captions ?? []) {
        if (typeof caption.text !== "string" || !caption.text.trim() ||
            !Number.isFinite(caption.startMs) || !Number.isFinite(caption.endMs) ||
            caption.startMs < previousEnd || caption.endMs <= caption.startMs ||
            caption.endMs > Math.ceil(voice.durationSec * 1000)) fail("Invalid phrase caption timing.");
        previousEnd = caption.endMs;
      }
      let spoken = scene.narration;
      for (const entry of scene.pronunciation ?? []) {
        if (entry.written && entry.spoken) spoken = spoken.split(entry.written).join(entry.spoken);
      }
      if (normalize((voice.captions ?? []).map((c) => c.text).join(" ")) !== normalize(spoken)) fail("Phrase captions do not cover the approved spoken text.");
      continue;
    }
    if (!Array.isArray(voice.words) || voice.words.length === 0)
      fail("Karaoke requires words with measured timestamps.");
    let previousEnd = 0;
    for (const word of voice.words) {
      if (
        typeof word.text !== "string" ||
        !word.text.trim() ||
        !Number.isFinite(word.startMs) ||
        !Number.isFinite(word.endMs) ||
        word.startMs < previousEnd ||
        word.endMs <= word.startMs ||
        word.endMs > Math.ceil(voice.durationSec * 1000)
      )
        fail("Invalid or overlapping word timestamps.");
      previousEnd = word.endMs;
    }
    let spoken = scene.narration;
    for (const entry of scene.pronunciation || []) {
      if (entry.written && entry.spoken)
        spoken = spoken.split(entry.written).join(entry.spoken);
    }
    if (
      normalize(voice.words.map((word) => word.text).join(" ")) !==
      normalize(spoken)
    )
      fail("Timed words do not cover the approved spoken text.");
    if (!Array.isArray(voice.captions) || voice.captions.length === 0)
      fail("Phrase captions are missing.");
    previousEnd = 0;
    for (const caption of voice.captions) {
      if (
        typeof caption.text !== "string" ||
        !Number.isFinite(caption.startMs) ||
        !Number.isFinite(caption.endMs) ||
        caption.startMs < previousEnd ||
        caption.endMs <= caption.startMs ||
        caption.endMs > Math.ceil(voice.durationSec * 1000)
      )
        fail("Invalid phrase caption timing.");
      const words = voice.words.filter(
        (word) =>
          word.startMs >= caption.startMs && word.startMs < caption.endMs,
      );
      if (
        normalize(words.map((word) => word.text).join(" ")) !==
        normalize(caption.text)
      )
        fail("Phrase boundaries do not match timed words.");
      if (words.some((word) => word.endMs > caption.endMs))
        fail("A caption cuts off a spoken word.");
      previousEnd = caption.endMs;
    }
    if (
      normalize(voice.captions.map((caption) => caption.text).join(" ")) !==
      normalize(spoken)
    )
      fail("Captions omit or repeat spoken text.");
  }
};
