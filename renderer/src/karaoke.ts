import type { Caption } from "./video-types";

// Kokoro emits punctuation as separate tokens; keep it attached to its word.
export const captionWords = (words: Caption[], caption: Caption): Caption[] => {
  const joined: Caption[] = [];
  for (const word of words) {
    if (/^[,.:;?!]+$/.test(word.text) && joined.length) {
      joined[joined.length - 1].text += word.text;
      joined[joined.length - 1].endMs = word.endMs;
    } else {
      joined.push({ ...word });
    }
  }
  return joined.filter(
    (word) => word.startMs >= caption.startMs && word.startMs < caption.endMs,
  );
};

export const activeWordAt = (words: Caption[], timeMs: number): number =>
  words.findIndex((word) => timeMs >= word.startMs && timeMs < word.endMs);
