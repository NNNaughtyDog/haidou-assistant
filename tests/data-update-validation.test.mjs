import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('fresh rankings survive delayed pool source; corrupt same-source items still fail', async () => {
  const root = await mkdtemp(join(tmpdir(), 'haidou-validation-'));
  try {
    await mkdir(join(root, 'scripts'));
    await mkdir(join(root, 'app'));
    for (const path of ['scripts/validate-data.mjs', 'app/aramgg-snapshot.ts', 'app/hexdata-snapshot.ts', 'app/item-snapshot.ts']) {
      await copyFile(new URL(`../${path}`, import.meta.url), join(root, path));
    }
    const rankingPath = join(root, 'app/aramgg-snapshot.ts');
    await writeFile(rankingPath, (await readFile(rankingPath, 'utf8')).replace(/"patch":\s*"[^"]+"/, '"patch": "26.99"'));
    const run = () => spawnSync(process.execPath, [join(root, 'scripts/validate-data.mjs')], { encoding: 'utf8' });
    const delayed = run();
    assert.equal(delayed.status, 0, delayed.stderr);
    assert.match(delayed.stderr, /来源版本不同/);
    const itemPath = join(root, 'app/item-snapshot.ts');
    await writeFile(itemPath, (await readFile(itemPath, 'utf8')).replace(/"patch":\s*"[^"]+"/, '"patch": "16.1"'));
    const corrupt = run();
    assert.notEqual(corrupt.status, 0);
    assert.match(corrupt.stderr, /英雄与装备快照补丁不一致/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
