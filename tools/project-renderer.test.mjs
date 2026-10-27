import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, rm, symlink} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {loadProjectRenderer} from './project-renderer.mjs';

test('project renderer manifest validates ownership and survives removal of another project', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'renderer-contract-'));
  try {
    const manifest = {schemaVersion: 1, entryPoint: 'renderer/index.tsx', compositionId: 'ShortVideo', sceneIds: ['hook']};
    const a = path.join(root, '001-a');
    const b = path.join(root, '002-b');
    for (const dir of [a,b]) {
      await mkdir(path.join(dir, 'renderer'), {recursive:true});
      await writeFile(path.join(dir, 'renderer/index.tsx'), '// fixture');
      await assert.rejects(loadProjectRenderer(dir), /render.json/);
      await writeFile(path.join(dir, 'render.json'), JSON.stringify(manifest));
      assert.equal((await loadProjectRenderer(dir)).compositionId, 'ShortVideo');
    }
    await writeFile(path.join(a, 'render.json'), JSON.stringify({...manifest, renderOptions:{gl:'angle', concurrency:1}}));
    assert.deepEqual((await loadProjectRenderer(a)).renderOptions, {gl:'angle', concurrency:1});
    for (const renderOptions of [null, [], {gl:'invalid'}, {concurrency:0}, {concurrency:1.5}, {concurrency:17}, {unknown:true}]) {
      await writeFile(path.join(a, 'render.json'), JSON.stringify({...manifest, renderOptions}));
      await assert.rejects(loadProjectRenderer(a), /Invalid renderOptions/);
    }
    await writeFile(path.join(a, 'render.json'), JSON.stringify({...manifest, sceneIds:['hook','hook']}));
    await assert.rejects(loadProjectRenderer(a), /Invalid render.json/);
    await writeFile(path.join(a, 'render.json'), JSON.stringify({...manifest, entryPoint:'renderer/../../002-b/renderer/index.tsx'}));
    await assert.rejects(loadProjectRenderer(a), /inside the project/);
    await rm(path.join(a, 'renderer/index.tsx'));
    await symlink(path.join(b, 'renderer/index.tsx'), path.join(a, 'renderer/index.tsx'));
    await writeFile(path.join(a, 'render.json'), JSON.stringify(manifest));
    await assert.rejects(loadProjectRenderer(a), /inside the project/);
    await rm(a, {recursive:true});
    assert.equal((await loadProjectRenderer(b)).sceneIds[0], 'hook');
  } finally { await rm(root, {recursive:true, force:true}); }
});
