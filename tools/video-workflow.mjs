import { createHash, randomUUID } from "node:crypto";
import {
  access,
  cp,
  mkdir,
  lstat,
  realpath,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { validateVoiceCaptions } from "./caption-validation.mjs";
import { assertLocalMediaPath, resolveProductionVideo, validateRenderConfig, expectedDuration, reviewTimes } from "./production-config.mjs";
import { measureAudio } from "./media-qc.mjs";

const defaultVideoFormat = JSON.parse(await readFile(
  new URL("../renderer/src/video-format.json", import.meta.url), "utf8",
));

export const STATES = Object.freeze({
  REQUEST_CREATED: "request_created",
  DIRECTIONS_PROPOSED: "directions_proposed",
  DIRECTION_SELECTED: "direction_selected",
  SCRIPT_DRAFT: "script_draft",
  SCRIPT_APPROVED: "script_approved",
  PRODUCTION_REQUESTED: "production_requested",
  PRODUCED: "produced",
});

const PROJECT_NAME_PATTERN = /^(\d{3})-([a-z0-9]+(?:-[a-z0-9]+)*)$/;

const now = () => new Date().toISOString();

const sha256 = (value) =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`;

const jsonText = (value) => `${JSON.stringify(value, null, 2)}\n`;

const normalizeForStableJson = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeForStableJson);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, normalizeForStableJson(value[key])]),
    );
  }
  return value;
};

const stableJson = (value) => JSON.stringify(normalizeForStableJson(value));

export const slugify = (value) => {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");

  return slug || "untitled-video";
};

export const atomicWriteText = async (target, content) => {
  const temporary = `${target}.tmp-${process.pid}-${randomUUID()}`;
  await mkdir(path.dirname(target), { recursive: true });
  try {
    await writeFile(temporary, content, "utf8");
    await rename(temporary, target);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
};

export const atomicWriteJson = (target, value) =>
  atomicWriteText(target, jsonText(value));

export const readJson = async (target) => {
  try {
    return JSON.parse(await readFile(target, "utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${target}`);
    }
    throw error;
  }
};

const pathExists = async (target) => {
  try {
    await access(target, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
};

export const fileChecksum = async (target) => sha256(await readFile(target));

const collectFiles = async (directory, prefix = "") => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === "__pycache__") continue;
    if (entry.isSymbolicLink()) throw new Error(`Cannot fingerprint a symbolic link: ${path.join(directory, entry.name)}`);
    const relative = path.posix.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolute, relative)));
    } else if (entry.isFile()) {
      files.push({ absolute, relative });
    }
  }

  return files;
};

export const directoryChecksum = async (directory) => {
  const hash = createHash("sha256");
  const files = await collectFiles(directory);
  for (const file of files) {
    hash.update(file.relative);
    hash.update("\0");
    hash.update(await readFile(file.absolute));
    hash.update("\0");
  }
  return `sha256:${hash.digest("hex")}`;
};

const combinedChecksum = async (targets) => {
  const hash = createHash("sha256");
  for (const target of targets) {
    hash.update(path.basename(target));
    hash.update("\0");
    hash.update(await readFile(target));
    hash.update("\0");
  }
  return `sha256:${hash.digest("hex")}`;
};

const projectRelativePath = (workspaceRoot, projectDir) =>
  path.relative(workspaceRoot, projectDir).split(path.sep).join("/");

export const resolveProject = async (workspaceRoot, projectInput) => {
  if (!projectInput) {
    throw new Error("Missing --project <projects/NNN-slug>.");
  }

  const projectsRoot = path.resolve(workspaceRoot, "projects");
  const projectDir = path.resolve(workspaceRoot, projectInput);
  const relative = path.relative(projectsRoot, projectDir);

  if (
    !relative ||
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    relative.includes(path.sep)
  ) {
    throw new Error("Project must be a direct child of the workspace projects/ folder.");
  }
  if (!PROJECT_NAME_PATTERN.test(path.basename(projectDir))) {
    throw new Error("Project folder must match projects/NNN-slug.");
  }

  const projectStat = await lstat(projectDir).catch(() => null);
  if (!projectStat?.isDirectory()) {
    throw new Error(`Project does not exist: ${projectInput}`);
  }

  return projectDir;
};

const nextProjectNumber = async (projectsRoot) => {
  const entries = await readdir(projectsRoot, { withFileTypes: true });
  return entries.reduce((highest, entry) => {
    if (!entry.isDirectory()) return highest;
    const match = PROJECT_NAME_PATTERN.exec(entry.name);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0) + 1;
};

const initialState = (requestVersion) => ({
  schemaVersion: 1,
  state: STATES.REQUEST_CREATED,
  updatedAt: now(),
  versions: {
    request: requestVersion,
    research: null,
    directions: null,
    direction: null,
    script: null,
    render: null,
  },
  productionRequest: null,
  outputs: {},
  lastError: null,
});

export const createProject = async (workspaceRoot, options) => {
  const prompt = options.prompt?.trim();
  if (!prompt) throw new Error("Missing --prompt.");

  const projectsRoot = path.join(workspaceRoot, "projects");
  await mkdir(projectsRoot, { recursive: true });
  const slug = slugify(options.name || prompt);
  let number = await nextProjectNumber(projectsRoot);
  let projectDir;

  for (;;) {
    if (number > 999) throw new Error("Project number exceeds the NNN naming contract.");
    projectDir = path.join(projectsRoot, `${String(number).padStart(3, "0")}-${slug}`);
    try {
      await mkdir(projectDir);
      break;
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      number += 1;
    }
  }

  try {
    for (const directory of [
      "assets/images",
      "assets/footage",
      "assets/music",
      "assets/sfx",
      "voice",
      "output/docs",
      "output/video",
    ]) {
      await mkdir(path.join(projectDir, directory), { recursive: true });
    }

    const durationMin = Number(options.durationMin ?? 45);
    const durationMax = Number(options.durationMax ?? 75);
    if (!(durationMin > 0 && durationMax >= durationMin)) {
      throw new Error("Duration must be positive and max must be greater than or equal to min.");
    }

    const request = {
      schemaVersion: 1,
      projectId: path.basename(projectDir),
      slug,
      prompt,
      audience: options.audience || null,
      platform: options.platform || "youtube_shorts",
      language: options.language || "en",
      productionDefaults: {
        ...defaultVideoFormat,
        captions: "word-highlight",
        motion: "explanatory",
        backgroundSound: "intentional-music",
      },
      durationRangeSec: { min: durationMin, max: durationMax },
      tone: options.tone || null,
      goal: options.goal || null,
      ctaGoal: options.cta || null,
      constraints: [],
      assumptions: [],
      createdAt: now(),
    };
    const requestPath = path.join(projectDir, "request.json");
    await atomicWriteJson(requestPath, request);
    const requestVersion = await fileChecksum(requestPath);
    await atomicWriteJson(path.join(projectDir, "state.json"), initialState(requestVersion));
    await atomicWriteText(
      path.join(projectDir, "research.md"),
      `# Research: ${options.name || prompt}\n\nStatus: draft\n`,
    );
    await atomicWriteJson(path.join(projectDir, "research.json"), {
      schemaVersion: 1,
      claims: [],
      sources: [],
    });
    await atomicWriteJson(path.join(projectDir, "directions.json"), {
      schemaVersion: 1,
      researchVersion: null,
      directions: [],
      recommendedDirectionId: null,
    });
    await atomicWriteJson(path.join(projectDir, "assets/sources.json"), {
      schemaVersion: 1,
      assets: [],
    });

    return {
      projectDir,
      project: projectRelativePath(workspaceRoot, projectDir),
      state: STATES.REQUEST_CREATED,
    };
  } catch (error) {
    await rm(projectDir, { recursive: true, force: true });
    throw error;
  }
};

const readState = (projectDir) => readJson(path.join(projectDir, "state.json"));

const nextState = (state, patch) => ({
  ...state,
  ...patch,
  versions: { ...state.versions, ...(patch.versions || {}) },
  updatedAt: now(),
});

const writeState = async (projectDir, state, patch) => {
  const next = nextState(state, patch);
  await atomicWriteJson(path.join(projectDir, "state.json"), next);
  return next;
};

const requireState = (state, allowed, action) => {
  if (!allowed.includes(state.state)) {
    throw new Error(
      `${action} requires state ${allowed.join(" or ")}; current state is ${state.state}.`,
    );
  }
};

const validateDirections = (directions) => {
  if (!Array.isArray(directions) || directions.length < 2 || directions.length > 4) {
    throw new Error("directions.json must contain 2 to 4 directions.");
  }
  const ids = new Set();
  for (const direction of directions) {
    for (const field of ["id", "title", "tensionHook", "promise", "payoff"]) {
      if (typeof direction[field] !== "string" || !direction[field].trim()) {
        throw new Error(`Each direction requires a non-empty ${field}.`);
      }
    }
    if (ids.has(direction.id)) throw new Error(`Duplicate direction id: ${direction.id}`);
    ids.add(direction.id);
  }
};

export const completeDiscovery = async (workspaceRoot, projectInput) => {
  const projectDir = await resolveProject(workspaceRoot, projectInput);
  const state = await readState(projectDir);
  requireState(
    state,
    [STATES.REQUEST_CREATED, STATES.DIRECTIONS_PROPOSED],
    "Completing discovery",
  );

  const researchMarkdownPath = path.join(projectDir, "research.md");
  const researchJsonPath = path.join(projectDir, "research.json");
  const directionsPath = path.join(projectDir, "directions.json");
  const researchMarkdown = await readFile(researchMarkdownPath, "utf8");
  const research = await readJson(researchJsonPath);
  const directions = await readJson(directionsPath);

  if (researchMarkdown.includes("Status: draft") || researchMarkdown.trim().length < 80) {
    throw new Error("research.md is still a draft or is too short to complete discovery.");
  }
  if (!Array.isArray(research.claims) || research.claims.length === 0) {
    throw new Error("research.json must contain at least one claim.");
  }
  validateDirections(directions.directions);

  const researchVersion = await combinedChecksum([researchMarkdownPath, researchJsonPath]);
  directions.researchVersion = researchVersion;
  if (
    directions.recommendedDirectionId &&
    !directions.directions.some((item) => item.id === directions.recommendedDirectionId)
  ) {
    throw new Error("recommendedDirectionId does not match any direction.");
  }
  await atomicWriteJson(directionsPath, directions);
  const directionsVersion = await fileChecksum(directionsPath);

  await writeState(projectDir, state, {
    state: STATES.DIRECTIONS_PROPOSED,
    versions: {
      research: researchVersion,
      directions: directionsVersion,
      direction: null,
      script: null,
      render: null,
    },
    productionRequest: null,
    outputs: {},
    lastError: null,
  });

  return { projectDir, state: STATES.DIRECTIONS_PROPOSED, researchVersion };
};

export const selectDirection = async (workspaceRoot, projectInput, choice, notes = "") => {
  if (choice === undefined || choice === true || String(choice).trim() === "") {
    throw new Error("Missing --direction <id|number>.");
  }
  const projectDir = await resolveProject(workspaceRoot, projectInput);
  const state = await readState(projectDir);
  requireState(
    state,
    [STATES.DIRECTIONS_PROPOSED, STATES.DIRECTION_SELECTED],
    "Selecting a direction",
  );
  const directions = await readJson(path.join(projectDir, "directions.json"));
  if (directions.researchVersion !== state.versions.research) {
    throw new Error("directions.json is stale relative to the current research version.");
  }

  const numericChoice = /^\d+$/.test(String(choice)) ? Number(choice) : null;
  const selected = numericChoice
    ? directions.directions[numericChoice - 1]
    : directions.directions.find((direction) => direction.id === choice);
  if (!selected) throw new Error(`Unknown direction: ${choice}`);

  const directionPath = path.join(projectDir, "direction.json");
  await atomicWriteJson(directionPath, {
    schemaVersion: 1,
    directionId: selected.id,
    researchVersion: state.versions.research,
    selectedAt: now(),
    userNotes: notes,
    overrides: {},
    assumptions: [],
  });
  const directionVersion = await fileChecksum(directionPath);
  await writeState(projectDir, state, {
    state: STATES.DIRECTION_SELECTED,
    versions: { direction: directionVersion, script: null, render: null },
    productionRequest: null,
    outputs: {},
    lastError: null,
  });

  return { projectDir, state: STATES.DIRECTION_SELECTED, directionId: selected.id };
};

const validateVideo = (video) => {
  if (!video || typeof video !== "object") throw new Error("video.json must be an object.");
  if (!video.meta || typeof video.meta !== "object") {
    throw new Error("video.json requires meta.");
  }
  if (!video.design || typeof video.design !== "object") {
    throw new Error("video.json requires a design block before production.");
  }
  if (!Array.isArray(video.scenes) || video.scenes.length === 0) {
    throw new Error("video.json requires at least one scene.");
  }
  const sceneIds = new Set();
  for (const scene of video.scenes) {
    if (!scene.id || typeof scene.id !== "string") throw new Error("Each scene requires an id.");
    if (sceneIds.has(scene.id)) throw new Error(`Duplicate scene id: ${scene.id}`);
    sceneIds.add(scene.id);
    if (typeof scene.narration !== "string" || !scene.narration.trim()) {
      throw new Error(`Scene ${scene.id} requires narration.`);
    }
    const range = scene.durationRangeSec;
    if (!range || !(Number(range.min) > 0) || Number(range.max) < Number(range.min)) {
      throw new Error(`Scene ${scene.id} has an invalid durationRangeSec.`);
    }
  }
};

const scriptChecksum = (scriptMarkdown, video) => {
  const content = { ...video };
  delete content.scriptVersion;
  delete content.approval;
  return sha256(`${scriptMarkdown}\0${stableJson(content)}`);
};

export const recordScriptDraft = async (workspaceRoot, projectInput) => {
  const projectDir = await resolveProject(workspaceRoot, projectInput);
  const state = await readState(projectDir);
  requireState(
    state,
    [STATES.DIRECTION_SELECTED, STATES.SCRIPT_DRAFT, STATES.SCRIPT_APPROVED, STATES.PRODUCTION_REQUESTED, STATES.PRODUCED],
    "Recording a script draft",
  );

  const scriptPath = path.join(projectDir, "script.md");
  const videoPath = path.join(projectDir, "video.json");
  const scriptMarkdown = await readFile(scriptPath, "utf8").catch(() => "");
  if (scriptMarkdown.trim().length < 100) {
    throw new Error("script.md is missing or too short to record as a draft.");
  }
  const video = await readJson(videoPath);
  validateVideo(video);
  const request = await readJson(path.join(projectDir, "request.json"));
  for (const field of ["width", "height", "fps"]) {
    if (video.meta[field] === undefined) {
      video.meta[field] = request.productionDefaults?.[field] ?? defaultVideoFormat[field];
    }
    if (!Number.isInteger(video.meta[field]) || video.meta[field] <= 0) {
      throw new Error(`Invalid meta.${field}.`);
    }
  }
  const version = scriptChecksum(scriptMarkdown, video);
  video.scriptVersion = version;
  video.approval = {
    status: "pending",
    approvedAt: null,
    approvedScriptVersion: null,
  };
  await atomicWriteJson(videoPath, video);
  await writeState(projectDir, state, {
    state: STATES.SCRIPT_DRAFT,
    versions: { script: version, render: null },
    productionRequest: null,
    outputs: state.outputs,
    lastError: null,
  });

  return { projectDir, state: STATES.SCRIPT_DRAFT, scriptVersion: version };
};

const readCurrentScript = async (projectDir) => {
  const scriptMarkdown = await readFile(path.join(projectDir, "script.md"), "utf8");
  const video = await readJson(path.join(projectDir, "video.json"));
  validateVideo(video);
  return { scriptMarkdown, video, version: scriptChecksum(scriptMarkdown, video) };
};

export const approveScript = async (workspaceRoot, projectInput) => {
  const projectDir = await resolveProject(workspaceRoot, projectInput);
  const state = await readState(projectDir);
  requireState(state, [STATES.SCRIPT_DRAFT, STATES.SCRIPT_APPROVED], "Approving script");
  const { video, version } = await readCurrentScript(projectDir);
  if (state.versions.script !== version || video.scriptVersion !== version) {
    throw new Error("Script or video.json changed after the draft was recorded. Run --draft again.");
  }

  video.approval = {
    status: "approved",
    approvedAt: now(),
    approvedScriptVersion: version,
  };
  await atomicWriteJson(path.join(projectDir, "video.json"), video);
  await writeState(projectDir, state, {
    state: STATES.SCRIPT_APPROVED,
    versions: { script: version },
    productionRequest: null,
    lastError: null,
  });

  return { projectDir, state: STATES.SCRIPT_APPROVED, scriptVersion: version };
};

export const validateProductionInput = async (workspaceRoot, projectInput) => {
  const projectDir = await resolveProject(workspaceRoot, projectInput);
  const state = await readState(projectDir);
  requireState(
    state,
    [STATES.SCRIPT_APPROVED, STATES.PRODUCTION_REQUESTED, STATES.PRODUCED],
    "Rendering",
  );
  const { video, version } = await readCurrentScript(projectDir);
  if (
    state.versions.script !== version ||
    video.scriptVersion !== version ||
    video.approval?.status !== "approved" ||
    video.approval?.approvedScriptVersion !== version
  ) {
    throw new Error("The approved script is stale. Record and approve the current draft again.");
  }
  const productionPath = path.join(projectDir, "production.json");
  const production = await pathExists(productionPath) ? await readJson(productionPath) : undefined;
  return { projectDir, state, video: resolveProductionVideo(video, production), approvedVideo: video, production };
};

export const reviseProduction = async (workspaceRoot, projectInput) => {
  const projectDir = await resolveProject(workspaceRoot, projectInput);
  const state = await readState(projectDir);
  requireState(state, [STATES.SCRIPT_APPROVED, STATES.PRODUCTION_REQUESTED, STATES.PRODUCED], "Revising production");
  const { video, version } = await readCurrentScript(projectDir);
  if (video.approval?.status !== "approved" || version !== video.approval.approvedScriptVersion || version !== state.versions.script) {
    throw new Error("The approved script is stale. Run script --draft, then obtain script approval before revising production.");
  }
  const target = path.join(projectDir, "production.json");
  const previous = await pathExists(target) ? await readJson(target) : {};
  const production = { ...previous, schemaVersion: 1, scriptVersion: video.scriptVersion };
  resolveProductionVideo(video, production);
  await atomicWriteJson(target, production);
  return { projectDir, productionPath: target, scriptVersion: video.scriptVersion };
};

export const renderFingerprint = async (workspaceRoot, projectDir) => {
  const entries = {};
  for (const name of ["video.json", "script.md", "production.json", "storyboard.json", "output/docs/audio-timeline.json"]) {
    const file = path.join(projectDir, name);
    if (await pathExists(file)) entries[name] = await fileChecksum(file);
  }
  for (const name of ["voice", "assets"]) {
    const directory = path.join(projectDir, name);
    if (await pathExists(directory)) entries[name] = await directoryChecksum(directory);
  }
  entries.renderer = await directoryChecksum(path.join(workspaceRoot, "renderer/src"));
  entries.lockfile = await fileChecksum(path.join(workspaceRoot, "renderer/package-lock.json"));
  const runtimeFiles = [
    "renderer/package.json", "renderer/remotion.config.ts", "renderer/tsconfig.json",
    "tools/video-cli.mjs", "tools/video-workflow.mjs", "tools/production-config.mjs",
    "tools/caption-validation.mjs", "tools/media-qc.mjs",
  ];
  const runtime = {};
  for (const name of runtimeFiles) runtime[name] = await fileChecksum(path.join(workspaceRoot, name));
  entries.workflow = sha256(stableJson(runtime));
  entries.runtimeFiles = runtime;
  return { checksum: sha256(stableJson(entries)), inputs: entries };
};

const checkedMedia = async (projectDir, file, prefix) => {
  assertLocalMediaPath(file, prefix);
  const root = await realpath(projectDir);
  const target = await realpath(path.join(projectDir, file));
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error(`Media escapes the project: ${file}`);
  return target;
};

export const prepareRender = async (workspaceRoot, projectInput) => {
  const input = await validateProductionInput(workspaceRoot, projectInput);
  const { projectDir, video } = input;
  validateRenderConfig(video);
  const voiceManifest = await readJson(path.join(projectDir, "voice/manifest.json"));
  if (voiceManifest.scriptVersion !== video.scriptVersion) throw new Error("Voice manifest is stale relative to the approved script version. Run the shared voice generator.");
  validateVoiceCaptions(video, voiceManifest);
  for (const voice of voiceManifest.scenes) {
    const file = await checkedMedia(projectDir, `voice/${voice.file}`, "voice");
    if (await fileChecksum(file) !== voice.fileChecksum) throw new Error(`Voice checksum mismatch: ${voice.file}`);
    const probe = await probeMedia(file);
    if (!Number.isFinite(Number(probe.format.duration)) || Math.abs(Number(probe.format.duration) - voice.durationSec) > 0.03) throw new Error(`Voice duration mismatch: ${voice.file}`);
    const audioStream = probe.streams?.find((stream) => stream.codec_type === "audio");
    if (Number(audioStream?.sample_rate) !== Number(voiceManifest.sampleRate ?? 24000)) throw new Error(`Voice sample rate mismatch: ${voice.file}`);
  }
  const audioTimelinePath = path.join(projectDir, "output/docs/audio-timeline.json");
  const audioTimeline = await pathExists(audioTimelinePath) ? await readJson(audioTimelinePath) : undefined;
  if (audioTimeline) {
    if ((video.meta.renderer ?? "kubernetes") !== "kubernetes") throw new Error("Combined narration is currently supported only by the Kubernetes renderer.");
    if (audioTimeline.schemaVersion !== 1 || audioTimeline.audioFile !== "voice/full.wav" ||
        audioTimeline.fps !== video.meta.fps || audioTimeline.sampleRate !== voiceManifest.sampleRate ||
        audioTimeline.scriptVersion !== video.scriptVersion ||
        audioTimeline.voiceManifestChecksum !== await fileChecksum(path.join(projectDir, "voice/manifest.json")) ||
        audioTimeline.scenes?.length !== voiceManifest.scenes.length) {
      throw new Error("Combined narration timeline is stale or invalid; rerun assemble_voice.py.");
    }
    let cursor = 0;
    for (const [index, scene] of audioTimeline.scenes.entries()) {
      const voice = voiceManifest.scenes[index];
      const samplesPerFrame = audioTimeline.sampleRate / audioTimeline.fps;
      if (!Number.isInteger(samplesPerFrame) || scene.id !== voice.id ||
          scene.voiceFile !== `voice/${voice.file}` || scene.voiceChecksum !== voice.fileChecksum ||
          !Number.isInteger(scene.voiceSamples) || scene.voiceSamples <= 0 ||
          Math.abs(scene.voiceSamples / audioTimeline.sampleRate - voice.durationSec) > 0.001 ||
          scene.voiceFrames !== Math.ceil(scene.voiceSamples / samplesPerFrame) ||
          !Number.isInteger(scene.pauseFrames) || scene.pauseFrames < 0 ||
          scene.startFrame !== cursor || scene.endFrame !== cursor + scene.voiceFrames + scene.pauseFrames) {
        throw new Error(`Combined narration timing is invalid at scene ${voice.id}; rerun assemble_voice.py.`);
      }
      cursor = scene.endFrame;
    }
    if (cursor !== audioTimeline.totalFrames || audioTimeline.totalFrames / audioTimeline.fps !== audioTimeline.durationSeconds) {
      throw new Error("Combined narration total duration is invalid; rerun assemble_voice.py.");
    }
    const combinedFile = await checkedMedia(projectDir, audioTimeline.audioFile, "voice");
    if (await fileChecksum(combinedFile) !== audioTimeline.audioChecksum) throw new Error("Combined narration checksum mismatch; rerun assemble_voice.py.");
    const combinedProbe = await probeMedia(combinedFile);
    if (Math.abs(Number(combinedProbe.format.duration) - audioTimeline.durationSeconds) > 1 / audioTimeline.fps ||
        Number(combinedProbe.streams?.find((stream) => stream.codec_type === "audio")?.sample_rate) !== audioTimeline.sampleRate) {
      throw new Error("Combined narration media duration or sample rate is invalid; rerun assemble_voice.py.");
    }
  }
  const storyboardPath = path.join(projectDir, "storyboard.json");
  const storyboard = await pathExists(storyboardPath) ? await readJson(storyboardPath) : undefined;
  if (storyboard && storyboard.scriptVersion !== video.scriptVersion) throw new Error("Storyboard is stale relative to the approved script version.");
  // Existing topic renderers do not consume storyboard fields. Fail visibly instead of ignoring edits.
  if (storyboard && (storyboard.scenes?.length || storyboard.design)) throw new Error("These renderers do not implement storyboard overrides; edit the topic renderer or use supported production.json audio/caption settings.");
  let music = null;
  if (video.audio?.music) {
    const file = await checkedMedia(projectDir, video.audio.music.file, "assets");
    music = { file: video.audio.music.file, checksum: await fileChecksum(file), ...await measureAudio(file) };
    music.effectiveLufsBeforeAutomation = music.integratedLufs + 20 * Math.log10(video.audio.music.volume);
    if (!Number.isFinite(music.integratedLufs) || music.effectiveLufsBeforeAutomation < -60) throw new Error("Background music is silent or effectively inaudible; fix the track/gain or record a sound override.");
    const probe = await probeMedia(file);
    if (Number(probe.format.duration) + 1 / video.meta.fps < expectedDuration(video, voiceManifest, audioTimeline)) throw new Error("Background track is shorter than the video; prepare its loop/fade before rendering.");
  }
  if ((video.meta.renderer ?? "kubernetes") === "kubernetes" && video.audio !== null && video.audio?.sfx !== false && video.scenes.some((s) => s.id === "replace")) {
    await checkedMedia(projectDir, "assets/sfx/success-chime.wav", "assets");
  }
  const fingerprint = await renderFingerprint(workspaceRoot, projectDir);
  return { ...input, voiceManifest, audioTimeline, fingerprint, music, expectedDurationSec: expectedDuration(video, voiceManifest, audioTimeline), reviewTimes: reviewTimes(video, voiceManifest, audioTimeline) };
};

export const requireCurrentPreview = async (workspaceRoot, projectDir, fingerprint) => {
  const state = await readState(projectDir);
  const preview = state.outputs?.preview;
  if (preview?.inputFingerprint !== fingerprint.checksum ||
      await fileChecksum(path.join(projectDir, ".cache/review/preview.mp4")).catch(() => null) !== preview?.checksum ||
      await fileChecksum(path.join(projectDir, ".cache/review/contact-sheet.png")).catch(() => null) !== state.outputs?.contactSheet?.checksum) {
    throw new Error("Preview is missing or stale for current inputs. Render --preview and review it before --final.");
  }
};

export const markProductionRequested = async (projectDir, state, kind) =>
  writeState(projectDir, state, {
    state: STATES.PRODUCTION_REQUESTED,
    productionRequest: { kind, requestedAt: now() },
    lastError: null,
  });

export const markProductionError = async (projectDir, message) => {
  const state = await readState(projectDir);
  return writeState(projectDir, state, {
    lastError: { phase: "render", message, at: now() },
  });
};

const runCommand = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code ?? signal}.`));
    });
  });

export const renderWithRemotion = async ({
  workspaceRoot,
  projectDir,
  kind,
  composition = "ShortVideo",
  output,
  prepared,
}) => {
  const rendererDir = path.join(workspaceRoot, "renderer");
  const executable = path.join(
    rendererDir,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "remotion.cmd" : "remotion",
  );
  if (!(await pathExists(executable))) {
    throw new Error("Remotion is not installed. Run npm install inside renderer/.");
  }

  const { video, voiceManifest, audioTimeline } = prepared ?? await prepareRender(workspaceRoot, projectDir);
  const assetRoot = await stageProjectMedia(rendererDir, projectDir);

  const props = JSON.stringify({
    projectDir,
    videoJson: path.join(projectDir, "video.json"),
    renderMode: kind,
    assetRoot,
    video,
    voiceManifest,
    audioTimeline,
  });
  const args = ["render", composition, output, "--overwrite", "--props", props];
  if (kind === "preview") args.push("--scale", "0.5", "--crf", "28");
  else args.push("--crf", "18");

  await runCommand(executable, args, { cwd: rendererDir, env: process.env });
};

const stageProjectMedia = async (rendererDir, projectDir) => {
  const publicRoot = path.join(rendererDir, "public", "workflow");
  const projectName = path.basename(projectDir);
  const target = path.join(publicRoot, projectName);
  const temporary = temporarySibling(target, "next");
  await mkdir(temporary, { recursive: true });
  try {
    await cp(path.join(projectDir, "voice"), path.join(temporary, "voice"), {
      recursive: true,
    });
    await cp(path.join(projectDir, "assets"), path.join(temporary, "assets"), {
      recursive: true,
    });
    await replaceTargets([{ source: temporary, target }]);
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
  return `workflow/${projectName}`;
};

export const probeMedia = async (target) => {
  const result = await new Promise((resolve, reject) => {
    const child = spawn(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration,size,format_name:stream=index,codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels",
        "-of",
        "json",
        target,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`ffprobe failed: ${stderr.trim() || `exit ${code}`}`));
    });
  });
  return JSON.parse(result);
};

export const normalizeRenderedAudio = async (target, probe) => {
  if (!probe.streams?.some((stream) => stream.codec_type === "audio")) return;
  const normalized = temporarySibling(target, "normalized");
  try {
    await runCommand(
      "ffmpeg",
      [
        "-y",
        "-v",
        "error",
        "-i",
        target,
        "-map",
        "0:v:0",
        "-map",
        "0:a:0",
        "-c:v",
        "copy",
        "-af",
        "loudnorm=I=-16:TP=-1.5:LRA=11",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        normalized,
      ],
      { stdio: "inherit" },
    );
    await rename(normalized, target);
  } catch (error) {
    await rm(normalized, { force: true });
    throw error;
  }
};

const rationalNumber = (value) => {
  const [numerator, denominator = "1"] = String(value).split("/").map(Number);
  return denominator ? numerator / denominator : 0;
};

export const validateFinalMedia = (probe, video, expectedDurationSec) => {
  const videoStream = probe.streams?.find((stream) => stream.codec_type === "video");
  if (!videoStream) throw new Error("Final output has no video stream.");
  const expectedWidth = Number(video.meta.width ?? defaultVideoFormat.width);
  const expectedHeight = Number(video.meta.height ?? defaultVideoFormat.height);
  const expectedFps = Number(video.meta.fps ?? defaultVideoFormat.fps);
  if (videoStream.width !== expectedWidth || videoStream.height !== expectedHeight) {
    throw new Error(
      `Final dimensions are ${videoStream.width}x${videoStream.height}; expected ${expectedWidth}x${expectedHeight}.`,
    );
  }
  if (Math.abs(rationalNumber(videoStream.r_frame_rate) - expectedFps) > 0.01) {
    throw new Error(`Final FPS does not match ${expectedFps}.`);
  }
  if (!Number.isFinite(expectedDurationSec) || expectedDurationSec <= 0 || !Number.isFinite(Number(probe.format?.duration)) ||
      Math.abs(Number(probe.format?.duration) - expectedDurationSec) > Math.max(0.15, 2 / expectedFps)) {
    throw new Error(`Final duration ${probe.format?.duration} does not match timeline ${expectedDurationSec}.`);
  }
  if (videoStream.codec_name !== "h264") throw new Error("Final video must use H.264.");
  if (video.audio && !probe.streams?.some((stream) => stream.codec_type === "audio")) {
    throw new Error("Final output has no audio stream although video.json declares audio.");
  }
  if (probe.streams?.some((stream) => stream.codec_type === "audio" && stream.codec_name !== "aac")) throw new Error("Final audio must use AAC.");
};

export const createContactSheet = async (previewPath, outputPath, times, fps) => {
  const frames = times.map((time) => Math.round(time * fps));
  const select = frames.map((frame) => `eq(n\\,${frame})`).join("+");
  const filter = `select=${select},scale=270:-1,tile=3x${Math.ceil(frames.length / 3)}:padding=8:margin=8`;
  await runCommand(
    "ffmpeg",
    ["-y", "-v", "error", "-i", previewPath, "-vf", filter, "-frames:v", "1", outputPath],
    { stdio: "inherit" },
  );
};

export const temporarySibling = (target, label) => {
  const extension = path.extname(target);
  const basename = path.basename(target, extension);
  return path.join(
    path.dirname(target),
    `.${basename}.${label}-${randomUUID()}${extension}`,
  );
};

const replaceTargets = async (replacements) => {
  const completed = [];
  try {
    for (const replacement of replacements) {
      const backup = temporarySibling(replacement.target, "backup");
      const hadTarget = await pathExists(replacement.target);
      if (hadTarget) await rename(replacement.target, backup);
      try {
        await rename(replacement.source, replacement.target);
      } catch (error) {
        if (hadTarget) await rename(backup, replacement.target);
        throw error;
      }
      completed.push({ ...replacement, backup, hadTarget });
    }
  } catch (error) {
    for (const replacement of completed.reverse()) {
      await rm(replacement.target, { recursive: true, force: true });
      if (replacement.hadTarget) await rename(replacement.backup, replacement.target);
    }
    throw error;
  }

  for (const replacement of completed) {
    if (replacement.hadTarget) {
      await rm(replacement.backup, { recursive: true, force: true });
    }
  }
};

const writeTemporaryJson = async (target, value) => {
  await writeFile(target, jsonText(value), "utf8");
};

const relativeOutput = (workspaceRoot, target) =>
  path.relative(workspaceRoot, target).split(path.sep).join("/");

export const recordPreview = async ({
  workspaceRoot,
  projectDir,
  temporaryOutput,
  probe,
  prepared,
}) => {
  const reviewDir = path.join(projectDir, ".cache", "review");
  await mkdir(reviewDir, { recursive: true });
  const previewPath = path.join(reviewDir, "preview.mp4");
  const contactSheetPath = path.join(reviewDir, "contact-sheet.png");
  const statePath = path.join(projectDir, "state.json");
  const temporaryContactSheet = temporarySibling(contactSheetPath, "next");
  const temporaryState = temporarySibling(statePath, "next");
  try {
    if (!prepared || (await renderFingerprint(workspaceRoot, projectDir)).checksum !== prepared.fingerprint.checksum) throw new Error("Inputs changed during preview rendering; render again.");
    if (!Number.isFinite(Number(probe.format?.duration)) || Math.abs(Number(probe.format?.duration) - prepared.expectedDurationSec) > 0.15) throw new Error("Preview duration does not match the timeline.");
    await createContactSheet(temporaryOutput, temporaryContactSheet, prepared.reviewTimes, prepared.video.meta.fps);
    const state = await readState(projectDir);
    const previewChecksum = await fileChecksum(temporaryOutput);
    const contactSheetChecksum = await fileChecksum(temporaryContactSheet);
    const createdAt = now();
    await writeTemporaryJson(
      temporaryState,
      nextState(state, {
        state: STATES.PRODUCTION_REQUESTED,
        outputs: {
          ...state.outputs,
          preview: {
            path: relativeOutput(workspaceRoot, previewPath),
            checksum: previewChecksum,
            createdAt,
            inputFingerprint: prepared.fingerprint.checksum,
          },
          contactSheet: {
            path: relativeOutput(workspaceRoot, contactSheetPath),
            checksum: contactSheetChecksum,
            timesSec: prepared.reviewTimes,
          },
        },
        lastError: null,
      }),
    );

    await replaceTargets([
      { source: temporaryOutput, target: previewPath },
      { source: temporaryContactSheet, target: contactSheetPath },
      { source: temporaryState, target: statePath },
    ]);
    return { previewPath, contactSheetPath, previewChecksum };
  } catch (error) {
    await rm(temporaryContactSheet, { force: true });
    await rm(temporaryState, { force: true });
    throw error;
  }
};

export const finalizeFinalRender = async ({
  workspaceRoot,
  projectDir,
  temporaryOutput,
  probe,
  video,
  prepared,
  mediaQc,
}) => {
  if (!prepared || !mediaQc || mediaQc.decode !== "passed") throw new Error("Finalization requires prepared inputs and completed media QC.");
  validateFinalMedia(probe, video, prepared.expectedDurationSec);
  if ((await renderFingerprint(workspaceRoot, projectDir)).checksum !== prepared.fingerprint.checksum) throw new Error("Inputs changed during final rendering; render a new preview.");
  await requireCurrentPreview(workspaceRoot, projectDir, prepared.fingerprint);
  const reviewDir = path.join(projectDir, ".cache", "review");
  const previewPath = path.join(reviewDir, "preview.mp4");
  const contactSheetPath = path.join(reviewDir, "contact-sheet.png");
  if (!(await pathExists(previewPath)) || !(await pathExists(contactSheetPath))) {
    throw new Error("Final render requires preview.mp4 and contact-sheet.png first.");
  }

  const videoDir = path.join(projectDir, "output", "video");
  const docsDir = path.join(projectDir, "output", "docs");
  await mkdir(videoDir, { recursive: true });
  await mkdir(docsDir, { recursive: true });
  const finalPath = path.join(videoDir, "final.mp4");
  const reportPath = path.join(docsDir, "report.json");
  const snapshotPath = path.join(docsDir, "render.snapshot.json");
  const statePath = path.join(projectDir, "state.json");
  const temporaryReport = temporarySibling(reportPath, "next");
  const temporarySnapshot = temporarySibling(snapshotPath, "next");
  const temporaryState = temporarySibling(statePath, "next");
  const qcPath = path.join(docsDir, "automated-qc.json");
  const temporaryQc = temporarySibling(qcPath, "next");
  let checksums;
  try {
    const rendererPackage = await readJson(path.join(workspaceRoot, "renderer/package.json"));
    const lockfilePath = path.join(workspaceRoot, "renderer/package-lock.json");
    checksums = {
      videoJson: await fileChecksum(path.join(projectDir, "video.json")),
      rendererSrc: prepared.fingerprint.inputs.renderer,
      dependencyLockfile: await fileChecksum(lockfilePath),
      finalMp4: await fileChecksum(temporaryOutput),
      renderInputs: prepared.fingerprint.checksum,
    };
    if (await directoryChecksum(path.join(workspaceRoot, "renderer/src")) !== checksums.rendererSrc) throw new Error("Renderer source changed during finalization; render a fresh preview.");
    const storyboardPath = path.join(projectDir, "storyboard.json");
    if (await pathExists(storyboardPath)) {
      checksums.storyboard = await fileChecksum(storyboardPath);
    }
    const createdAt = now();
    const sources = await readJson(path.join(projectDir, "assets/sources.json"));
    const runtime = {
      node: process.version,
      remotion: rendererPackage.dependencies?.remotion,
    };
    const automatedQc = {
      schemaVersion: 1, createdAt, finalMp4: checksums.finalMp4,
      inputFingerprint: prepared.fingerprint.checksum,
      expectedDurationSec: prepared.expectedDurationSec,
      measuredDurationSec: Number(probe.format.duration),
      ...mediaQc,
      backgroundSound: {
        sourceMeasurement: prepared.music,
        soundIntent: prepared.production?.soundIntent ?? null,
        soundOverride: prepared.production?.soundOverride ?? null,
        listening: "not-performed",
        note: "Source levels and final mix loudness do not prove speech intelligibility or emotional fit.",
      },
      editorialReview: "requires-review-for-this-export",
    };
    await writeTemporaryJson(temporaryQc, automatedQc);
    await writeTemporaryJson(temporaryReport, {
      schemaVersion: 1,
      createdAt,
      media: probe,
      sources,
      warnings: ["Automated checks passed; listening and editorial review are separate."],
      automatedQc,
      runtime,
      checksums,
      inputs: prepared.fingerprint.inputs,
    });
    await writeTemporaryJson(temporarySnapshot, {
      schemaVersion: 1,
      createdAt,
      runtime,
      checksums,
      inputs: prepared.fingerprint.inputs,
    });

    const stateBefore = await readState(projectDir);
    const retainedOutputs = { ...stateBefore.outputs };
    delete retainedOutputs.preview;
    delete retainedOutputs.contactSheet;
    delete retainedOutputs.sourceSnapshot;
    await writeTemporaryJson(
      temporaryState,
      nextState(stateBefore, {
        state: STATES.PRODUCED,
        versions: { render: checksums.finalMp4 },
        outputs: {
          ...retainedOutputs,
          final: {
            path: relativeOutput(workspaceRoot, finalPath),
            checksum: checksums.finalMp4,
            createdAt,
          },
          report: { path: relativeOutput(workspaceRoot, reportPath) },
        },
        lastError: null,
      }),
    );

    await replaceTargets([
      { source: temporaryOutput, target: finalPath },
      { source: temporaryReport, target: reportPath },
      { source: temporarySnapshot, target: snapshotPath },
      { source: temporaryState, target: statePath },
      { source: temporaryQc, target: qcPath },
    ]);
    await rm(reviewDir, { recursive: true, force: true });
    return { finalPath, reportPath, snapshotPath, checksums };
  } catch (error) {
    await rm(temporaryOutput, { force: true });
    await rm(temporaryReport, { force: true });
    await rm(temporarySnapshot, { force: true });
    await rm(temporaryState, { force: true });
    await rm(temporaryQc, { force: true });
    throw error;
  }
};

export const makeTemporaryRenderPath = (projectDir, kind) =>
  path.join(projectDir, "output", `.${kind}-render-${randomUUID()}.mp4`);

export const getStatus = async (workspaceRoot, projectInput) => {
  const projectDir = await resolveProject(workspaceRoot, projectInput);
  return {
    projectDir,
    project: projectRelativePath(workspaceRoot, projectDir),
    state: await readState(projectDir),
  };
};

export const cleanupTemporaryRender = (target) => rm(target, { force: true });
