import { Audio, staticFile, useVideoConfig } from "remotion";
import type { VideoData } from "./video-types";

export const BackgroundMusic = ({ video, assetRoot }: { video: VideoData; assetRoot: string }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const music = video.audio?.music;
  if (!music) return null;
  const fadeIn = (music.fadeInSec ?? 25 / 30) * fps;
  const fadeOut = (music.fadeOutSec ?? 2) * fps;
  return <Audio
    src={staticFile(`${assetRoot}/${music.file}`)}
    volume={(frame) => music.volume *
      (fadeIn ? Math.min(1, frame / fadeIn) : 1) *
      (fadeOut ? Math.min(1, Math.max(0, (durationInFrames - frame) / fadeOut)) : 1)}
  />;
};
