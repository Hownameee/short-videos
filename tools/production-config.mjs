const captionModes = ["word-highlight", "phrase", "none"];
const sceneIds = {
  kubernetes: ["hook", "declare", "observe", "replace", "service", "limits", "takeaway"],
  eclipses: ["hook", "solar", "totality", "lunar", "red", "tilt", "recap"],
  grpc: ["hook", "rest-bottleneck", "protobuf", "http2-multiplex", "streaming", "takeaway"],
};

export const assertLocalMediaPath = (file, prefix) => {
  if (typeof file !== "string" || !file.startsWith(`${prefix}/`) ||
      file.includes("\\") || file.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error(`Media path must stay inside ${prefix}/: ${file}`);
  }
};

const onlyKeys = (value, allowed, label) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new Error(`Unsupported ${label} field: ${key}`);
  }
};

/** Production overrides never contain narration, voice settings, scene text or approval. */
export const resolveProductionVideo = (approved, production) => {
  const video = structuredClone(approved);
  if (production) {
    onlyKeys(production, ["schemaVersion", "scriptVersion", "audio", "captions", "soundIntent", "soundOverride"], "production");
    if (production.schemaVersion !== 1 || production.scriptVersion !== video.scriptVersion) {
      throw new Error("production.json is stale or unsupported. Run video revise after script approval.");
    }
    if (production.audio !== undefined) {
      onlyKeys(production.audio, ["music", "sfx"], "production.audio");
      video.audio = { ...(video.audio ?? {}), ...production.audio };
    }
    if (production.captions !== undefined) {
      onlyKeys(production.captions, ["mode"], "production.captions");
      video.captions = production.captions;
    }
  }
  return video;
};

export const validateRenderConfig = (video) => {
  const renderer = video.meta.renderer ?? "kubernetes";
  if (!sceneIds[renderer]) throw new Error(`Unsupported renderer: ${renderer}. Add a composition before rendering this topic.`);
  for (const field of ["width", "height", "fps"]) {
    if (!Number.isInteger(video.meta[field]) || video.meta[field] <= 0) throw new Error(`Invalid meta.${field}.`);
  }
  if (!captionModes.includes(video.captions?.mode ?? "word-highlight")) throw new Error("Unknown captions.mode.");
  for (const scene of video.scenes) {
    if (!sceneIds[renderer].includes(scene.id)) throw new Error(`Unsupported ${renderer} scene: ${scene.id}`);
    if (!Array.isArray(scene.onScreenText) || scene.onScreenText.some((text) => typeof text !== "string")) {
      throw new Error(`${scene.id}: onScreenText must be an array of strings.`);
    }
  }
  const music = video.audio?.music;
  if (video.audio !== null && music === undefined) {
    throw new Error("Background music is missing. Select a track or explicitly set audio.music to null for a sound override.");
  }
  if (music !== null && music !== undefined) {
    onlyKeys(music, ["file", "volume", "fadeInSec", "fadeOutSec"], "audio.music");
    assertLocalMediaPath(music.file, "assets");
    if (!Number.isFinite(music.volume) || music.volume <= 0 || music.volume > 1) throw new Error("Music volume must be greater than 0 and at most 1; use null to disable music.");
    for (const field of ["fadeInSec", "fadeOutSec"]) {
      if (music[field] !== undefined && (!Number.isFinite(music[field]) || music[field] < 0)) throw new Error(`Invalid music ${field}.`);
    }
  }
  if (video.audio?.sfx !== undefined && typeof video.audio.sfx !== "boolean") throw new Error("audio.sfx must be a boolean.");
};

export const sceneTimeline = (video, manifest) => {
  let fromFrame = 0;
  return manifest.scenes.map((voice, index) => {
    const durationInFrames = Math.ceil((voice.durationSec + 0.45) * video.meta.fps);
    const scene = { id: video.scenes[index].id, fromFrame, durationInFrames };
    fromFrame += durationInFrames;
    return scene;
  });
};

export const expectedDuration = (video, manifest) =>
  Math.max(60, sceneTimeline(video, manifest).reduce((total, s) => total + s.durationInFrames, 0)) / video.meta.fps;

export const reviewTimes = (video, manifest) => {
  const timeline = sceneTimeline(video, manifest);
  const lastFrame = timeline.at(-1).fromFrame + timeline.at(-1).durationInFrames - 1;
  return [...new Set([0, ...timeline.map((s) => s.fromFrame + Math.floor(s.durationInFrames / 2)), lastFrame])]
    .map((frame) => frame / video.meta.fps);
};
