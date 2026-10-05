import type { Caption } from "./video-types";
import { activeWordAt, captionWords } from "./karaoke";

/** Supply scene-local time so highlights share the narration's frame clock. */
export const KaraokeCaptions = ({
  captions,
  words,
  timeMs,
  highlight = "#D7FF78",
  textColor = "#F3F7F2",
  activeTextColor = "#081522",
  pendingColor = "#C6D3DC",
}: {
  captions: Caption[];
  words: Caption[];
  timeMs: number;
  highlight?: string;
  textColor?: string;
  activeTextColor?: string;
  pendingColor?: string;
}) => {
  const caption = captions.find((c) => timeMs >= c.startMs && timeMs < c.endMs);
  if (!caption) return null;
  const phrase = captionWords(words, caption);
  if (!phrase.length)
    throw new Error(
      "Karaoke captions need word timestamps; regenerate the voice manifest.",
    );
  const active = activeWordAt(phrase, timeMs);
  return (
    <div>
      {phrase.map((word, index) => (
        <span
          key={`${word.startMs}-${index}`}
          style={{
            display: "inline-block",
            padding: "5px 8px",
            margin: "2px 0",
            borderRadius: 9,
            backgroundColor: index === active ? highlight : "transparent",
            color:
              index === active
                ? activeTextColor
                : timeMs >= word.endMs
                  ? textColor
                  : pendingColor,
            translate: index === active ? "0px -3px" : "0px 0px",
          }}
        >
          {word.text}
        </span>
      ))}
    </div>
  );
};
