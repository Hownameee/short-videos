export type Caption = {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number | null;
  confidence: number | null;
  pageBreakAfter?: boolean;
};

export type VideoScene = {
  id: string;
  purpose: string;
  narration: string;
  onScreenText: string[];
  visualType: string;
  visual: string;
  sfx: string[];
};

export type VideoData = {
  meta: {
    title: string;
    width: number;
    height: number;
    fps: number;
  };
  design: {
    palette: Record<string, string>;
  };
  scenes: VideoScene[];
};

export type VoiceScene = {
  id: string;
  file: string;
  durationSec: number;
  captions: Caption[];
  words?: Caption[];
};

export type VoiceManifest = {
  scriptVersion: string | null;
  scenes: VoiceScene[];
};

export type VideoProps = {
  projectDir?: string;
  videoJson?: string;
  renderMode: "preview" | "final";
  assetRoot: string;
  video: VideoData;
  voiceManifest: VoiceManifest;
  storyboard?: Storyboard;
};

export type Storyboard = {
  scriptVersion: string;
  design: { palette: Record<string, string>; fontFile: string };
  scenes: {
    id: string;
    cues: number[];
    sfx: { file: string; atSec: number }[];
  }[];
};
