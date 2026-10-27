import {readFile, realpath, stat, lstat} from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';

// Each video owns its entry point and scene contract; no central topic registry.
export async function loadProjectRenderer(projectDir) {
  const manifestPath = path.join(projectDir, 'render.json');
  if ((await lstat(manifestPath).catch(() => null))?.isSymbolicLink()) throw new Error('Project render.json must not be a symbolic link.');
  let manifest;
  try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); }
  catch (error) { throw new Error(`Cannot load project render.json: ${error.message}`); }
  if (!manifest || manifest.schemaVersion !== 1 || typeof manifest.compositionId !== 'string' || !/^[A-Za-z0-9-]+$/.test(manifest.compositionId ?? '') ||
      !Array.isArray(manifest.sceneIds) || !manifest.sceneIds.length ||
      manifest.sceneIds.some(id => typeof id !== 'string' || !id.trim()) ||
      new Set(manifest.sceneIds).size !== manifest.sceneIds.length ||
      typeof manifest.entryPoint !== 'string' || !/^renderer\/.+\.[cm]?[jt]sx?$/.test(manifest.entryPoint)) {
    throw new Error('Invalid render.json: require schemaVersion 1, compositionId, unique sceneIds and renderer/ entryPoint.');
  }
  if (manifest.renderOptions !== undefined) {
    const options = manifest.renderOptions;
    if (!options || typeof options !== 'object' || Array.isArray(options) ||
        Object.keys(options).some(key => !['gl', 'concurrency'].includes(key)) ||
        (options.gl !== undefined && !['angle', 'swangle'].includes(options.gl)) ||
        (options.concurrency !== undefined && (!Number.isInteger(options.concurrency) || options.concurrency < 1 || options.concurrency > 16))) {
      throw new Error('Invalid renderOptions: use gl angle/swangle and integer concurrency 1–16.');
    }
  }
  const root = await realpath(projectDir);
  const sourceRoot = await realpath(path.join(projectDir, 'renderer'));
  const entryPoint = await realpath(path.resolve(projectDir, manifest.entryPoint));
  if (sourceRoot !== path.join(root, 'renderer') || !entryPoint.startsWith(`${sourceRoot}${path.sep}`) || !(await stat(entryPoint)).isFile()) {
    throw new Error('Renderer entry must stay inside the project renderer/ directory.');
  }
  return {...manifest, entryPoint};
}

export async function bundleProject(workspaceRoot, projectDir, options = {}) {
  const manifest = await loadProjectRenderer(projectDir);
  const rendererDir = path.join(workspaceRoot, 'renderer');
  const require = createRequire(path.join(rendererDir, 'package.json'));
  const {bundle} = require('@remotion/bundler');
  const serveUrl = await bundle({
    entryPoint: manifest.entryPoint,
    rootDir: rendererDir,
    publicDir: path.join(projectDir, '.cache/public'),
    ...options,
    webpackOverride: config => ({...config, resolve: {...config.resolve,
      modules: [path.join(rendererDir, 'node_modules'), ...(config.resolve?.modules ?? [])],
    }}),
  });
  return {manifest, serveUrl, require};
}
