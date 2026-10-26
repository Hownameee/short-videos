import { createRequire } from "node:module";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareRender, normalizeRenderedAudio, probeMedia } from "./video-workflow.mjs";
import { checkRenderedAudio } from "./media-qc.mjs";

// A visual experiment deliberately has no authority to publish a production
// result or update script approval, canonical final media, or project state.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "renderer/package.json"));
const { bundle } = require("@remotion/bundler");
const {
  selectComposition,
  renderStill,
  renderMedia,
  openBrowser,
} = require("@remotion/renderer");
const project = path.join(root, "projects/001-kubernetes-self-healing");
const output = path.join(project, "output/3d-study");
const video = process.argv.includes("--video");
const prepared = await prepareRender(root, project);
const { video: data, voiceManifest, audioTimeline, fingerprint } = prepared;
if (!audioTimeline)
  throw new Error("The study needs the approved combined narration.");
const cues = {
  hook: ["delete"],
  declare: ["contains"],
  observe: ["deleted"],
  replace: ["replacement", "node", "containers"],
  service: ["service", "ready"],
  limits: ["broken"],
  takeaway: [],
};
for (const scene of voiceManifest.scenes) {
  if (!Object.hasOwn(cues, scene.id))
    throw new Error(`Unsupported study scene ${scene.id}`);
  for (const word of cues[scene.id]) {
    if (!scene.words.some((w) => w.text.toLowerCase() === word))
      throw new Error(`Missing cue ${scene.id}/${word}`);
  }
}
await mkdir(output, { recursive: true });
const staged = path.join(
  root,
  "renderer/public/workflow/001-kubernetes-self-healing",
);
await mkdir(path.join(staged, "output"), { recursive: true });
await cp(path.join(project, "assets"), path.join(staged, "assets"), {
  recursive: true,
});
await cp(
  path.join(project, "output/voice"),
  path.join(staged, "output/voice"),
  { recursive: true },
);
const inputProps = {
  renderMode: "preview",
  assetRoot: "workflow/001-kubernetes-self-healing",
  video: data,
  voiceManifest,
  audioTimeline,
};
await writeFile(
  path.join(output, "props.json"),
  JSON.stringify(inputProps, null, 2),
);
console.log("Preflight passed; bundling the study.");
const serveUrl = await bundle({
  entryPoint: path.join(root, "renderer/src/index.ts"),
  publicDir: path.join(root, "renderer/public"),
});
const chromiumOptions = { gl: "angle" };
const browserInstance = await openBrowser("chrome", { chromiumOptions });
try {
  const composition = await selectComposition({
    serveUrl,
    id: "Kubernetes3DStudy",
    inputProps,
    browserInstance,
  });
  const common = {
    serveUrl,
    composition,
    inputProps,
    browserInstance,
    chromiumOptions,
  };
  if (video) {
    const target = path.join(output, "kubernetes-3d-study.mp4");
    await renderMedia({
      ...common,
      codec: "h264",
      crf: 18,
      concurrency: 1,
      outputLocation: target,
      onProgress: ({ renderedFrames }) => {
        if (renderedFrames % 120 === 0)
          console.log(
            `Rendered ${renderedFrames}/${composition.durationInFrames}`,
          );
      },
    });
    await normalizeRenderedAudio(target, await probeMedia(target));
    const qc = await checkRenderedAudio(target, true);
    await writeFile(
      path.join(output, "audio-qc.json"),
      JSON.stringify(qc, null, 2),
    );
  } else {
    for (const [name, frame] of [
      ["opening", 0],
      ["hook", 65],
      ["container", 435],
      ["gap", 640],
      ["pending", 754],
      ["assigned", 832],
      ["started", 900],
      ["service-before", 1130],
      ["service-ready", 1190],
      ["limits", 1380],
      ["payoff", 1560],
      ["hook-repeat", 65],
    ]) {
      await renderStill({
        ...common,
        frame,
        imageFormat: "png",
        output: path.join(output, `${name}.png`),
      });
      console.log(`Reviewed-frame candidate: ${name} @ ${frame}`);
    }
    const baseline = await selectComposition({
      serveUrl,
      id: "ShortVideo",
      inputProps,
      browserInstance,
    });
    await renderStill({
      ...common,
      composition: baseline,
      frame: 65,
      imageFormat: "png",
      output: path.join(output, "baseline-2d.png"),
    });
    const same = (await readFile(path.join(output, "hook.png"))).equals(
      await readFile(path.join(output, "hook-repeat.png")),
    );
    if (!same)
      throw new Error("Repeated hook frame differs: investigate determinism.");
    console.log("Repeated hook PNG is byte-identical.");
  }
  await writeFile(
    path.join(output, video ? "render-inputs.json" : "still-inputs.json"),
    JSON.stringify(
      {
        kind: "visual-study",
        inputFingerprint: fingerprint,
        composition: composition.id,
        width: composition.width,
        height: composition.height,
        fps: composition.fps,
        durationInFrames: composition.durationInFrames,
        backend: "angle",
        concurrency: 1,
      },
      null,
      2,
    ),
  );
} finally {
  await browserInstance.close({ silent: true });
}
