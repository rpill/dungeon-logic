import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const cases = [
  {
    webp: 'public/assets/backgrounds/meta/bg_meta_desktop.webp',
    old: 'public/assets/backgrounds/meta/bg_meta_desktop.png',
    source: 'src/runtime/SceneBackground.ts',
    ref: 'assets/backgrounds/meta/bg_meta_desktop.webp',
    maxBytes: 90_000,
  },
  {
    webp: 'public/assets/backgrounds/meta/bg_meta_mobile.webp',
    old: 'public/assets/backgrounds/meta/bg_meta_mobile.png',
    source: 'src/runtime/SceneBackground.ts',
    ref: 'assets/backgrounds/meta/bg_meta_mobile.webp',
    maxBytes: 90_000,
  },
  {
    webp: 'public/assets/logo.webp',
    old: 'public/assets/logo.png',
    source: 'src/scenes/BootScene.ts',
    ref: 'assets/logo.webp',
    maxBytes: 100_000,
  },
];

const failures = [];
for (const item of cases) {
  const webpPath = resolve(root, item.webp);
  if (!existsSync(webpPath)) {
    failures.push(`missing ${item.webp}`);
  } else {
    const header = readFileSync(webpPath).subarray(0, 12);
    if (header.toString('ascii', 0, 4) !== 'RIFF' || header.toString('ascii', 8, 12) !== 'WEBP') {
      failures.push(`${item.webp} is not a WebP file`);
    }
    const bytes = statSync(webpPath).size;
    if (bytes > item.maxBytes) failures.push(`${item.webp} is too large: ${bytes} bytes`);
  }

  if (existsSync(resolve(root, item.old))) failures.push(`old PNG still present: ${item.old}`);

  const source = readFileSync(resolve(root, item.source), 'utf8');
  if (!source.includes(item.ref)) failures.push(`${item.source} does not reference ${item.ref}`);
  if (source.includes(item.old.replace(/^public/, ''))) failures.push(`${item.source} still references old PNG ${item.old}`);
}

if (failures.length) {
  console.error('[Dungeon Logic] Raster asset optimization sanity FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[Dungeon Logic] Raster asset optimization sanity passed');
