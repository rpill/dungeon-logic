import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
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
    webp: 'public/assets/logo_en.webp',
    old: 'public/assets/logo.webp',
    source: 'src/scenes/BootScene.ts',
    ref: 'assets/logo_en.webp',
    maxBytes: 150_000,
  },
  {
    webp: 'public/assets/logo_ru.webp',
    old: 'public/assets/logo.webp',
    source: 'src/scenes/BootScene.ts',
    ref: 'assets/logo_ru.webp',
    maxBytes: 150_000,
  },
  {
    webp: 'public/assets/ui/slate_surface_m1.webp',
    old: 'public/assets/ui/slate_surface_m1.png',
    source: 'src/runtime/SlateSurface.ts',
    ref: 'assets/ui/slate_surface_m1.webp',
    maxBytes: 430_000,
  },
  {
    webp: 'public/assets/ui/action_gold_m1.webp',
    old: 'public/assets/ui/action_gold_m1.png',
    source: 'src/runtime/PrimaryActionButton.ts',
    ref: 'assets/ui/action_gold_m1.webp',
    maxBytes: 85_000,
  },
  {
    webp: 'public/assets/ui/action_slate_m1.webp',
    old: 'public/assets/ui/action_slate_m1.png',
    source: 'src/runtime/MaterialActionButton.ts',
    ref: 'assets/ui/action_slate_m1.webp',
    maxBytes: 80_000,
  },
  {
    webp: 'public/assets/ui/action_red_m1.webp',
    old: 'public/assets/ui/action_red_m1.png',
    source: 'src/runtime/MaterialActionButton.ts',
    ref: 'assets/ui/action_red_m1.webp',
    maxBytes: 85_000,
  },
  {
    webp: 'public/assets/ui/action_square_slate_m1.webp',
    old: 'public/assets/ui/action_square_slate_m1.png',
    source: 'src/runtime/HeaderActionButton.ts',
    ref: 'assets/ui/action_square_slate_m1.webp',
    maxBytes: 40_000,
  },
  {
    webp: 'public/assets/ui/puzzle_header_streak_icon_v3.webp',
    old: 'public/assets/ui/puzzle_header_streak_icon_v3.png',
    source: 'src/runtime/PuzzleHeaderUiAssets.ts',
    ref: 'assets/ui/puzzle_header_streak_icon_v3.webp',
    maxBytes: 20_000,
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

  if (existsSync(resolve(root, item.old))) failures.push(`obsolete asset still present: ${item.old}`);

  const source = readFileSync(resolve(root, item.source), 'utf8');
  if (!source.includes(item.ref)) failures.push(`${item.source} does not reference ${item.ref}`);
  if (source.includes(item.old.replace(/^public/, ''))) failures.push(`${item.source} still references old PNG ${item.old}`);
}

for (const directory of [
  'public/assets/floor',
  'public/assets/wall',
  'public/assets/monsters',
  'public/assets/items',
  'public/assets/board-frame/v2',
]) {
  const pngs = readdirSync(resolve(root, directory)).filter((name) => name.endsWith('.png'));
  if (pngs.length > 0) failures.push(`${directory} still contains runtime PNGs: ${pngs.join(', ')}`);
}

if (existsSync(resolve(root, 'public/assets/mark.png'))) failures.push('obsolete asset still present: public/assets/mark.png');
if (!existsSync(resolve(root, 'public/assets/mark.webp'))) failures.push('missing public/assets/mark.webp');

if (failures.length) {
  console.error('[Dungeon Logic] Raster asset optimization sanity FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[Dungeon Logic] Raster asset optimization sanity passed');
