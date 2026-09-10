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

const expectedAssets = [
  'public/assets/backgrounds/meta/bg_meta_desktop.png',
  'public/assets/backgrounds/meta/bg_meta_mobile.png',
  'public/assets/backgrounds/gameplay/bg_gameplay_desktop.png',
  'public/assets/backgrounds/gameplay/bg_gameplay_mobile.png',
];

for (const relativePath of expectedAssets) {
  assert(existsSync(resolve(projectRoot, relativePath)), `Background asset must exist: ${relativePath}`);
}

assert(
  bootSource.includes('preloadSceneBackgrounds(this)'),
  'BootScene preloads the four static scene backgrounds before routing.',
);
assert(
  homeSource.includes("createSceneBackground(this, 'meta')"),
  'HomeScene renders the meta background behind the current wireframe UI.',
);
assert(
  gameSource.includes("createSceneBackground(this, 'gameplay')"),
  'GameScene renders the gameplay background behind the current puzzle UI.',
);
assert(
  gameSource.includes('sceneBackground.sync()'),
  'GameScene keeps its background fitted and switches portrait/landscape texture on live resize.',
);

console.info('[Dungeon Logic] Background presentation sanity: preload + Home/Game integration hooks passed');
