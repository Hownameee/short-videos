import unittest
from captions import build_captions


def word(text, start, end):
    return {"text": text, "startMs": start, "endMs": end, "timestampMs": None, "confidence": None}


class CaptionTests(unittest.TestCase):
    def test_preserves_measured_durations_and_pauses(self):
        words, phrases = build_captions([word("One", 100, 250), word("long", 600, 1250), word("word", 1250, 1450), word(".", 1450, 1500)], 1.6)
        self.assertEqual([w["startMs"] for w in words], [100, 600, 1250])
        self.assertEqual(words[-1]["text"], "word.")
        self.assertEqual(phrases[0]["text"], "One long word.")
        self.assertEqual(phrases[0]["endMs"], 1600)

    def test_balances_long_sentence_without_orphan_punctuation(self):
        raw = [word(str(i), i*100, (i+1)*100) for i in range(8)]
        raw.append(word(".", 800, 820))
        _, phrases = build_captions(raw, 0.9)
        self.assertEqual([len(p["text"].split()) for p in phrases], [4, 4])
        self.assertEqual(phrases[1]["startMs"], 400)

    def test_missing_overlapping_and_out_of_range_timings_fail(self):
        for words in [[], [word("bad", 200, 100)], [word("a", 0, 400), word("b", 200, 500)], [word("late", 0, 2000)]]:
            with self.subTest(words=words), self.assertRaises(ValueError):
                build_captions(words, 1)


if __name__ == "__main__":
    unittest.main()
