import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, stat, writeFile, rename, symlink } from "node:fs/promises";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  STATES,
  approveScript,
  completeDiscovery,
  createProject,
  directoryChecksum,
  fileChecksum,
  finalizeFinalRender,
  readJson,
  recordScriptDraft,
  selectDirection,
  slugify,
  temporarySibling,
  validateProductionInput,
  reviseProduction,
  renderFingerprint,
  requireCurrentPreview,
  validateFinalMedia,
  prepareRender,
} from "./video-workflow.mjs";

const makeWorkspace = async () => {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), "short-video-workflow-"));
  await mkdir(path.join(workspaceRoot, "renderer/src"), { recursive: true });
  await writeFile(path.join(workspaceRoot, "renderer/src/video-format.json"),
    await readFile(new URL("../renderer/src/video-format.json", import.meta.url)));
  await mkdir(path.join(workspaceRoot, "tools"));
  for (const file of ["video-cli.mjs","video-workflow.mjs","production-config.mjs","caption-validation.mjs","media-qc.mjs"]) {
    await writeFile(path.join(workspaceRoot,"tools",file), await readFile(new URL(`./${file}`,import.meta.url)));
  }
  await writeFile(path.join(workspaceRoot,"renderer/remotion.config.ts"), "// fixture config\n");
  await writeFile(path.join(workspaceRoot,"renderer/tsconfig.json"), "{}\n");
  await writeFile(
    path.join(workspaceRoot, "renderer/src/Composition.tsx"),
    "export const Composition = () => null;\n",
  );
  await writeFile(
    path.join(workspaceRoot, "renderer/package.json"),
    JSON.stringify({ dependencies: { remotion: "4.0.532" } }),
  );
  await writeFile(path.join(workspaceRoot, "renderer/package-lock.json"), "{}\n");
  return workspaceRoot;
};

const fillDiscovery = async (projectDir) => {
  await writeFile(
    path.join(projectDir, "research.md"),
    "# Research\n\nDocker packages an application with its runtime dependencies so environments are reproducible. This fixture is intentionally long enough for validation.\n",
  );
  await writeFile(
    path.join(projectDir, "research.json"),
    JSON.stringify({
      schemaVersion: 1,
      claims: [{ id: "claim-1", text: "A sourced claim", sourceIds: ["source-1"] }],
      sources: [{ id: "source-1", url: "https://example.com" }],
    }),
  );
  await writeFile(
    path.join(projectDir, "directions.json"),
    JSON.stringify({
      schemaVersion: 1,
      researchVersion: null,
      directions: [
        {
          id: "pain",
          title: "Pain",
          tensionHook: "It works locally and breaks in production.",
          promise: "Explain why.",
          payoff: "Use a reproducible image.",
        },
        {
          id: "analogy",
          title: "Analogy",
          tensionHook: "An image is not a running container.",
          promise: "Make the difference visible.",
          payoff: "Blueprint versus running house.",
        },
      ],
      recommendedDirectionId: "pain",
    }),
  );
};

const fillScript = async (projectDir, meta = { width: 1080, height: 1920, fps: 30 }) => {
  await writeFile(
    path.join(projectDir, "script.md"),
    "# Script\n\nYour app works on one machine because its runtime is already present. Docker packages that environment so the same image can run elsewhere. The takeaway is to reproduce the runtime, not to hide broken code.\n",
  );
  await writeFile(
    path.join(projectDir, "video.json"),
    JSON.stringify({
      schemaVersion: 1,
      meta,
      design: { visualThesis: "Stable environment" },
      audio: null,
      scenes: [
        {
          id: "hook",
          narration: "It works locally and breaks in production.",
          onScreenText: [],
          durationRangeSec: { min: 2, max: 4 },
        },
      ],
    }),
  );
};

const prepareApprovedProject = async (workspaceRoot) => {
  const created = await createProject(workspaceRoot, {
    prompt: "Docker works on my machine",
  });
  await fillDiscovery(created.projectDir);
  await completeDiscovery(workspaceRoot, created.project);
  await selectDirection(workspaceRoot, created.project, 1);
  await fillScript(created.projectDir);
  await recordScriptDraft(workspaceRoot, created.project);
  await approveScript(workspaceRoot, created.project);
  return created;
};

test("slugify normalizes Vietnamese text", () => {
  assert.equal(slugify("Đánh vần: Bé học A, B, C!"), "danh-van-be-hoc-a-b-c");
});

test("temporary sibling keeps the media extension for FFmpeg", () => {
  const temporary = temporarySibling("/tmp/contact-sheet.png", "next");
  assert.equal(path.extname(temporary), ".png");
  assert.match(path.basename(temporary), /^\.contact-sheet\.next-.+\.png$/);
});

test("new requests and scripts without a format approve as 4K60 and reject an HD final", async () => {
  const root = await makeWorkspace();
  const {project, projectDir} = await createProject(root, {prompt: "A new explainer"});
  const request = await readJson(path.join(projectDir, "request.json"));
  assert.deepEqual(
    [request.productionDefaults.width, request.productionDefaults.height, request.productionDefaults.fps],
    [2160, 3840, 60],
  );
  await fillDiscovery(projectDir);
  await completeDiscovery(root, project);
  await selectDirection(root, project, 1);
  await fillScript(projectDir, {title: "A new explainer"});
  await recordScriptDraft(root, project);
  await approveScript(root, project);
  const video = await readJson(path.join(projectDir, "video.json"));
  assert.deepEqual(video.meta, {title: "A new explainer", width: 2160, height: 3840, fps: 60});
  assert.equal(video.approval.approvedScriptVersion, video.scriptVersion);
  const stream = {codec_type: "video", codec_name: "h264", width: 2160, height: 3840, r_frame_rate: "60/1"};
  validateFinalMedia({streams: [stream], format: {duration: "10"}}, video, 10);
  assert.throws(() => validateFinalMedia({streams: [{...stream, width: 1080, height: 1920}], format: {duration: "10"}}, video, 10), /dimensions/);
  assert.throws(() => validateFinalMedia({streams: [{...stream, r_frame_rate: "30/1"}], format: {duration: "10"}}, video, 10), /FPS/);
});

test("draft defaults respect explicit legacy formats and request overrides; invalid FPS is rejected", async () => {
  const root = await makeWorkspace();
  const {project, projectDir} = await prepareApprovedProject(root);
  let video = await readJson(path.join(projectDir, "video.json"));
  assert.deepEqual(video.meta, {width: 1080, height: 1920, fps: 30});
  const request = await readJson(path.join(projectDir, "request.json"));
  request.productionDefaults.fps = 24;
  await writeFile(path.join(projectDir, "request.json"), JSON.stringify(request));
  await fillScript(projectDir, {width: 1080, height: 1920});
  await recordScriptDraft(root, project);
  video = await readJson(path.join(projectDir, "video.json"));
  assert.deepEqual(video.meta, {width: 1080, height: 1920, fps: 24});
  await fillScript(projectDir, {fps: 0});
  await assert.rejects(recordScriptDraft(root, project), /Invalid meta.fps/);
});

test("createProject allocates the next NNN folder and initial state", async () => {
  const workspaceRoot = await makeWorkspace();
  const first = await createProject(workspaceRoot, { prompt: "Video đầu tiên" });
  const second = await createProject(workspaceRoot, { prompt: "Video tiếp theo" });

  assert.equal(first.project, "projects/001-video-dau-tien");
  assert.equal(second.project, "projects/002-video-tiep-theo");
  const request = await readJson(path.join(first.projectDir, "request.json"));
  assert.equal(request.language, "en");
  assert.deepEqual(request.productionDefaults, {
    width: 2160,
    height: 3840,
    fps: 60,
    captions: "word-highlight",
    motion: "explanatory",
    backgroundSound: "intentional-music",
  });
  assert.equal((await readJson(path.join(first.projectDir, "state.json"))).state, STATES.REQUEST_CREATED);
  for (const directory of ["assets/images", "assets/footage", "assets/music", "assets/sfx", "voice", "output/docs", "output/video"]) {
    assert.equal((await stat(path.join(first.projectDir, directory))).isDirectory(), true);
  }
});

test("phase gates version research, direction, and approved script", async () => {
  const workspaceRoot = await makeWorkspace();
  const created = await prepareApprovedProject(workspaceRoot);
  const input = await validateProductionInput(workspaceRoot, created.project);
  assert.equal(input.state.state, STATES.SCRIPT_APPROVED);

  await writeFile(path.join(created.projectDir, "script.md"), `${input.video.scenes[0].narration}\nchanged after approval\n`);
  await assert.rejects(
    validateProductionInput(workspaceRoot, created.project),
    /approved script is stale/i,
  );
});

test("finalization records renderer checksum without copying source into projects", async () => {
  const workspaceRoot = await makeWorkspace();
  const created = await prepareApprovedProject(workspaceRoot);
  const outputDir = path.join(created.projectDir, "output");
  const reviewDir = path.join(created.projectDir, ".cache", "review");
  await mkdir(reviewDir, { recursive: true });
  await writeFile(path.join(reviewDir, "preview.mp4"), "preview");
  await writeFile(path.join(reviewDir, "contact-sheet.png"), "contact-sheet");
  const temporaryOutput = path.join(outputDir, ".final-fixture.mp4");
  await writeFile(temporaryOutput, "final-video");
  const video = await readJson(path.join(created.projectDir, "video.json"));
  const storyboardPath = path.join(created.projectDir, "storyboard.json");
  await writeFile(storyboardPath, JSON.stringify({ scriptVersion: video.scriptVersion, scenes: [] }));
  const probe = {
    streams: [
      {
        codec_type: "video",
        codec_name: "h264",
        width: 1080,
        height: 1920,
        r_frame_rate: "30/1",
      },
    ],
    format: { duration: "2.0", size: "11", format_name: "mp4" },
  };

  const result = await finalizeFinalRender({
    workspaceRoot,
    projectDir: created.projectDir,
    temporaryOutput,
    probe,
    video,
    prepared: { fingerprint: await registerPreview(workspaceRoot, created.projectDir), expectedDurationSec: 2, music: null },
    mediaQc: { decode: "passed", audio: null },
  });
  const state = await readJson(path.join(created.projectDir, "state.json"));
  const snapshot = await readJson(result.snapshotPath);
  const report = await readJson(result.reportPath);

  assert.equal(state.state, STATES.PRODUCED);
  assert.equal(result.finalPath, path.join(outputDir, "video", "final.mp4"));
  assert.equal(result.reportPath, path.join(outputDir, "docs", "report.json"));
  assert.equal(result.snapshotPath, path.join(outputDir, "docs", "render.snapshot.json"));
  assert.equal(state.outputs.preview, undefined);
  assert.equal(state.outputs.contactSheet, undefined);
  assert.equal(state.versions.render, result.checksums.finalMp4);
  assert.deepEqual(snapshot.checksums, result.checksums);
  assert.deepEqual(report.checksums, result.checksums);
  assert.equal(result.checksums.storyboard, await fileChecksum(storyboardPath));
  assert.equal(
    result.checksums.rendererSrc,
    await directoryChecksum(path.join(workspaceRoot, "renderer", "src")),
  );
  assert.equal(state.outputs.sourceSnapshot, undefined);
  await assert.rejects(stat(path.join(created.projectDir, "src")));
  assert.equal(await readFile(result.finalPath, "utf8"), "final-video");
  assert.equal((await readJson(path.join(outputDir, "docs", "automated-qc.json"))).backgroundSound.listening, "not-performed");
  await assert.rejects(stat(reviewDir));
  await writeFile(temporaryOutput, "bad-new-final");
  await assert.rejects(finalizeFinalRender({
    workspaceRoot, projectDir: created.projectDir, temporaryOutput, video,
    probe: {...probe, format: {...probe.format, duration: "0.01"}},
    prepared: {fingerprint: await renderFingerprint(workspaceRoot, created.projectDir), expectedDurationSec: 2},
    mediaQc: {decode: "passed", audio: null},
  }), /duration/);
  assert.equal(await fileChecksum(result.finalPath), result.checksums.finalMp4);
  await assert.rejects(stat(path.join(created.projectDir, "src")));
});

const registerPreview = async (root, project) => {
  const fingerprint = await renderFingerprint(root, project);
  const state = await readJson(path.join(project, "state.json"));
  state.outputs = {
    ...state.outputs,
    preview: { inputFingerprint: fingerprint.checksum, checksum: await fileChecksum(path.join(project, ".cache/review/preview.mp4")) },
    contactSheet: { checksum: await fileChecksum(path.join(project, ".cache/review/contact-sheet.png")) },
  };
  await writeFile(path.join(project, "state.json"), JSON.stringify(state));
  return fingerprint;
};

test("production correction retains approval; narration revision invalidates approval and preserves prior final", async () => {
  const root = await makeWorkspace();
  const {project, projectDir} = await prepareApprovedProject(root);
  const before = await readFile(path.join(projectDir, "video.json"), "utf8");
  await reviseProduction(root, project);
  const overlay = await readJson(path.join(projectDir, "production.json"));
  overlay.captions = {mode: "none"};
  await writeFile(path.join(projectDir, "production.json"), JSON.stringify(overlay));
  assert.equal((await validateProductionInput(root, project)).video.captions.mode, "none");
  assert.equal(await readFile(path.join(projectDir, "video.json"), "utf8"), before);
  const state = await readJson(path.join(projectDir, "state.json"));
  state.state = STATES.PRODUCED;
  state.outputs.final = {checksum: "previous"};
  await writeFile(path.join(projectDir, "state.json"), JSON.stringify(state));
  await writeFile(path.join(projectDir, "script.md"), `${await readFile(path.join(projectDir, "script.md"), "utf8")}\nA revised narration.\n`);
  await recordScriptDraft(root, project);
  assert.equal((await readJson(path.join(projectDir, "state.json"))).outputs.final.checksum, "previous");
  await assert.rejects(validateProductionInput(root, project), /state|Rendering/i);
  await approveScript(root, project);
  await assert.rejects(validateProductionInput(root, project), /production.json is stale/);
  await reviseProduction(root, project);
  await validateProductionInput(root, project);
});

test("preview detects changed assets, source and contact sheet", async () => {
  const root = await makeWorkspace();
  const {projectDir} = await prepareApprovedProject(root);
  await mkdir(path.join(projectDir, ".cache", "review"), { recursive: true });
  await writeFile(path.join(projectDir, ".cache/review/preview.mp4"), "preview");
  await writeFile(path.join(projectDir, ".cache/review/contact-sheet.png"), "sheet");
  let fingerprint = await registerPreview(root, projectDir);
  await requireCurrentPreview(root, projectDir, fingerprint);
  await writeFile(path.join(projectDir, "assets/music/track.wav"), "changed");
  await assert.rejects(requireCurrentPreview(root, projectDir, await renderFingerprint(root, projectDir)), /stale/);
  fingerprint = await registerPreview(root, projectDir);
  await writeFile(path.join(root, "renderer/src/Composition.tsx"), "changed");
  await assert.rejects(requireCurrentPreview(root, projectDir, await renderFingerprint(root, projectDir)), /stale/);
  fingerprint = await registerPreview(root, projectDir);
  await writeFile(path.join(root,"tools/example.test.mjs"),"// Does not affect rendering\n");
  assert.equal((await renderFingerprint(root,projectDir)).checksum, fingerprint.checksum);
  await writeFile(path.join(root,"renderer/remotion.config.ts"),"// Changed render config\n");
  await assert.rejects(requireCurrentPreview(root,projectDir,await renderFingerprint(root,projectDir)), /stale/);
  fingerprint = await registerPreview(root, projectDir);
  await writeFile(path.join(projectDir, ".cache/review/contact-sheet.png"), "changed");
  await assert.rejects(requireCurrentPreview(root, projectDir, fingerprint), /stale/);
});

test("final media rejects truncation, invalid duration and wrong codecs", () => {
  const video = {meta: {width:1080,height:1920,fps:30},audio:{}};
  const probe = {streams:[{codec_type:"video",codec_name:"h264",width:1080,height:1920,r_frame_rate:"30/1"},{codec_type:"audio",codec_name:"aac"}],format:{duration:"12.0"}};
  validateFinalMedia(probe, video, 12);
  for (const duration of ["0.01", "NaN", undefined, "14"]) {
    assert.throws(() => validateFinalMedia({...probe,format:{duration}}, video, 12), /duration/);
  }
  assert.throws(() => validateFinalMedia({...probe, streams:[{...probe.streams[0],codec_name:"vp9"},probe.streams[1]]}, video,12), /H.264/);
  assert.throws(() => validateFinalMedia({...probe, streams:[probe.streams[0]]}, video,12), /audio/);
});

test("real preflight verifies voice bytes and rejects a media symlink escaping the project", async () => {
  const root=await makeWorkspace();
  const {project,projectDir}=await prepareApprovedProject(root);
  const file=path.join(projectDir,"voice/hook.wav");
  await promisify(execFile)("ffmpeg",["-v","error","-f","lavfi","-i","sine=frequency=440:sample_rate=24000:duration=1",file]);
  const video=await readJson(path.join(projectDir,"video.json"));
  const manifest={scriptVersion:video.scriptVersion,sampleRate:24000,scenes:[{id:"hook",file:"hook.wav",durationSec:1,fileChecksum:await fileChecksum(file)}]};
  await writeFile(path.join(projectDir,"voice/manifest.json"),JSON.stringify(manifest));
  assert.equal((await prepareRender(root,project)).expectedDurationSec,2);
  const outside=path.join(root,"external.wav");
  await rename(file,outside);
  await symlink(outside,file);
  await assert.rejects(prepareRender(root,project),/escapes the project/);
});
