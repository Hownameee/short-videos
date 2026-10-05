"""Phrase captions from measured word timings; never estimate timings by text length."""
import math
import re


def build_captions(raw_words: list[dict], duration_sec: float) -> tuple[list[dict], list[dict]]:
    words = []
    for word in raw_words:
        if words and re.fullmatch(r"[,.:;?!]+", word["text"]):
            words[-1]["text"] += word["text"]
            words[-1]["endMs"] = max(words[-1]["endMs"], word["endMs"])
        else:
            words.append(dict(word))
    previous_end = 0
    for word in words:
        if not (previous_end <= word["startMs"] < word["endMs"] <= math.ceil(duration_sec * 1000)):
            raise ValueError(f"Invalid or overlapping word timing: {word['text']}")
        previous_end = word["endMs"]
    if not words:
        raise ValueError("Word timestamps are required for karaoke captions; regenerate or align the voice.")

    sentences, sentence = [], []
    for word in words:
        sentence.append(word)
        if word["text"].endswith((".", "?", "!")):
            sentences.append(sentence)
            sentence = []
    if sentence:
        sentences.append(sentence)

    captions = []
    for sentence in sentences:
        count = math.ceil(len(sentence) / 7)
        for index in range(count):
            chunk = sentence[round(index * len(sentence) / count):round((index + 1) * len(sentence) / count)]
            captions.append({
                "text": " ".join(word["text"] for word in chunk),
                "startMs": chunk[0]["startMs"], "endMs": chunk[-1]["endMs"],
                "timestampMs": None, "confidence": None, "pageBreakAfter": True,
            })
    for index, caption in enumerate(captions):
        caption["endMs"] = captions[index + 1]["startMs"] if index + 1 < len(captions) else round(duration_sec * 1000)
    return words, captions
