import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';

const [directory, origin] = process.argv.slice(2);
if (!directory || !origin) throw new Error('Usage: verify-production.mjs <dist> <origin>');
const html = await readFile(resolve(directory, 'index.html'), 'utf8');
const assets = [...html.matchAll(/(?:src|href)="([^"?#]+\.(?:js|css))"/g)].map(match => match[1]);
if (!assets.some(path => path.endsWith('.js'))) throw new Error('Build has no JavaScript entry');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
for (const path of ['/index.html', ...assets]) {
  const expected = hash(await readFile(resolve(directory, path.replace(/^\//, ''))));
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const url = new URL(path, origin);
      url.searchParams.set('verify', expected);
      const response = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { 'Cache-Control': 'no-cache' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (hash(Buffer.from(await response.arrayBuffer())) !== expected) throw new Error('Production differs from the verified build');
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await setTimeout(3000);
    }
  }
  if (lastError) throw new Error(`${path}: ${lastError.message}`);
  console.log(`Verified production SHA-256: ${path}`);
}
