import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const bootSource = readFileSync(resolve(projectRoot, 'src/scenes/BootScene.ts'), 'utf8');
const homeSource = readFileSync(resolve(projectRoot, 'src/scenes/HomeScene.ts'), 'utf8');
const gameSource = readFileSync(resolve(projectRoot, 'src/scenes/GameScene.ts'), 'utf8');
const backgroundSource = readFileSync(resolve(projectRoot, 'src/runtime/SceneBackground.ts'), 'utf8');
const assetPlanSource = readFileSync(resolve(projectRoot, 'docs/visual/ASSET_PRODUCTION_PLAN.md'), 'utf8');

const expectedAssets = [
  'public/assets/backgrounds/meta/bg_meta_desktop.webp',
  'public/assets/backgrounds/meta/bg_meta_mobile.webp',
];

for (const relativePath of expectedAssets) {
  assert(existsSync(resolve(projectRoot, relativePath)), `Background asset must exist: ${relativePath}`);
}

const removedGameplayAssets = [
  'public/assets/backgrounds/gameplay/bg_gameplay_desktop.png',
  'public/assets/backgrounds/gameplay/bg_gameplay_mobile.png',
];
for (const relativePath of removedGameplayAssets) {
  assert(!existsSync(resolve(projectRoot, relativePath)), `Legacy gameplay background must be removed: ${relativePath}`);
}

assert(
  bootSource.includes('preloadSceneBackgrounds(this)'),
  'BootScene preloads the shared meta scene backgrounds before routing.',
);
assert(
  homeSource.includes("createSceneBackground(this, 'meta')"),
  'HomeScene renders the meta background behind the current wireframe UI.',
);
assert(
  gameSource.includes("createSceneBackground(this, 'meta')"),
  'GameScene renders the shared meta background behind the puzzle UI.',
);
assert(
  gameSource.includes('sceneBackground.sync()'),
  'GameScene keeps its background fitted and switches portrait/landscape texture on live resize.',
);
assert(
  !backgroundSource.includes("'gameplay'") &&
    !backgroundSource.includes('assets/backgrounds/gameplay/') &&
    !backgroundSource.includes('background-gameplay-'),
  'SceneBackground must expose only the shared meta background family.',
);
assert(
  !assetPlanSource.includes('assets/backgrounds/gameplay/') &&
    !assetPlanSource.includes('bg_gameplay_full.png'),
  'Visual asset plan must not request a separate gameplay background family.',
);

console.info('[Dungeon Logic] Background presentation sanity: single shared meta background passed');
