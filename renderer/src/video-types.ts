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
  captions?: { mode: "word-highlight" | "phrase" | "none" };
  audio?: {
    music?: { file: string; volume: number; fadeInSec?: number; fadeOutSec?: number } | null;
    sfx?: boolean;
  } | null;
  meta: {
    title: string;
    renderer?: string;
    width: number;
    height: number;
    fps: number;
  };
  design: {
    palette: Record<string, string>;
    presenterOverlay?: { x: number; y: number; width: number; height: number };
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

export type AudioTimeline = {
  audioFile: string;
  fps: number;
  totalFrames: number;
  scenes: {
    id: string;
    startFrame: number;
    voiceFrames: number;
    pauseFrames: number;
    endFrame: number;
  }[];
};

export type VideoProps = {
  projectDir?: string;
  videoJson?: string;
  renderMode: "preview" | "final";
  assetRoot: string;
  video: VideoData;
  voiceManifest: VoiceManifest;
  audioTimeline?: AudioTimeline;
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
