#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  approveScript,
  cleanupTemporaryRender,
  completeDiscovery,
  createProject,
  finalizeFinalRender,
  getStatus,
  makeTemporaryRenderPath,
  markProductionError,
  markProductionRequested,
  normalizeRenderedAudio,
  probeMedia,
  recordPreview,
  recordScriptDraft,
  renderWithRemotion,
  selectDirection,
  reviseProduction,
  prepareRender,
  requireCurrentPreview,
} from "./video-workflow.mjs";
import { checkRenderedAudio } from "./media-qc.mjs";

const defaultWorkspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const workspaceRoot = path.resolve(
  process.env.SHORT_VIDEO_WORKSPACE_ROOT || defaultWorkspaceRoot,
);

const usage = `
Short-video workflow CLI

New video default: 2160x3840 at 60 fps (renderer/src/video-format.json).
script --draft fills missing format fields; explicit video.meta values win.

Create a project:
  npm run video -- discover --prompt "Topic" [--name slug-source]

Complete discovery after research.md, research.json and directions.json are filled:
  npm run video -- discover --project projects/001-topic --complete

Select a direction, record a script draft, then approve it:
  npm run video -- script --project projects/001-topic --direction 2
  npm run video -- script --project projects/001-topic --draft
  npm run video -- script --project projects/001-topic --approve

Render through the shared renderer:
  npm run video -- render --project projects/001-topic --preview
  npm run video -- render --project projects/001-topic --final

Inspect state:
  npm run video -- status --project projects/001-topic

Revise audio/captions without changing approved narration:
  npm run video -- revise --project projects/001-topic
  # Edit production.json, then render a fresh preview and final.

Validate inputs without launching Chromium:
  npm run video -- preflight --project projects/001-topic
`;

const parseArgs = (argv) => {
  const [command, ...tokens] = argv;
  const options = {};
  const positionals = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }
    const key = token.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const next = tokens[index + 1];
    if (next === undefined || next.startsWith("--")) options[key] = true;
    else {
      options[key] = next;
      index += 1;
    }
  }
  return { command, options, positionals };
};

const printResult = (result) => {
  const clean = { ...result };
  if (clean.projectDir) delete clean.projectDir;
  console.log(JSON.stringify(clean, null, 2));
};

const runDiscover = async (options) => {
  if (options.prompt) {
    const result = await createProject(workspaceRoot, options);
    printResult(result);
    console.log(
      `Next: fill research.md, research.json and directions.json, then run:\n` +
        `npm run video -- discover --project ${result.project} --complete`,
    );
    return;
  }
  if (options.complete) {
    const result = await completeDiscovery(workspaceRoot, options.project);
    printResult(result);
    return;
  }
  throw new Error("discover requires --prompt for a new project or --project with --complete.");
};

const runScript = async (options) => {
  const modes = [options.direction !== undefined, Boolean(options.draft), Boolean(options.approve)];
  if (modes.filter(Boolean).length !== 1) {
    throw new Error("script requires exactly one of --direction, --draft, or --approve.");
  }
  if (options.direction !== undefined) {
    printResult(
      await selectDirection(
        workspaceRoot,
        options.project,
        options.direction,
        options.notes || "",
      ),
    );
  } else if (options.draft) {
    printResult(await recordScriptDraft(workspaceRoot, options.project));
  } else {
    printResult(await approveScript(workspaceRoot, options.project));
  }
};

const runRender = async (options) => {
  const kind = options.preview ? "preview" : options.final ? "final" : null;
  if (!kind || (options.preview && options.final)) {
    throw new Error("render requires exactly one of --preview or --final.");
  }
  const input = await prepareRender(workspaceRoot, options.project);
  if (kind === "final") await requireCurrentPreview(workspaceRoot, input.projectDir, input.fingerprint);
  await markProductionRequested(input.projectDir, input.state, kind);
  const temporaryOutput = makeTemporaryRenderPath(input.projectDir, kind);

  try {
    await renderWithRemotion({
      workspaceRoot,
      projectDir: input.projectDir,
      kind,
      composition: options.composition || "ShortVideo",
      output: temporaryOutput,
      prepared: input,
    });
    let probe = await probeMedia(temporaryOutput);
    await normalizeRenderedAudio(temporaryOutput, probe);
    probe = await probeMedia(temporaryOutput);
    if (kind === "preview") {
      printResult(
        await recordPreview({
          workspaceRoot,
          projectDir: input.projectDir,
          temporaryOutput,
          probe,
          prepared: input,
        }),
      );
    } else {
      const mediaQc = await checkRenderedAudio(temporaryOutput, probe.streams.some((s) => s.codec_type === "audio"));
      printResult(
        await finalizeFinalRender({
          workspaceRoot,
          projectDir: input.projectDir,
          temporaryOutput,
          probe,
          video: input.video,
          prepared: input,
          mediaQc,
        }),
      );
    }
  } catch (error) {
    await cleanupTemporaryRender(temporaryOutput);
    await markProductionError(input.projectDir, error.message).catch(() => {});
    throw error;
  }
};

const main = async () => {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (!command || command === "help" || options.help) {
    console.log(usage.trim());
    return;
  }

  if (command === "discover") await runDiscover(options);
  else if (command === "revise") printResult(await reviseProduction(workspaceRoot, options.project));
  else if (command === "preflight") {
    const input = await prepareRender(workspaceRoot, options.project);
    printResult({ expectedDurationSec: input.expectedDurationSec, fingerprint: input.fingerprint, music: input.music, reviewTimes: input.reviewTimes });
  }
  else if (command === "script") await runScript(options);
  else if (command === "render") await runRender(options);
  else if (command === "status") printResult(await getStatus(workspaceRoot, options.project));
  else throw new Error(`Unknown command: ${command}\n${usage}`);
};

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
