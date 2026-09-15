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
const rendererPath = resolve(projectRoot, 'src/runtime/HomeMenuButton.ts');
const headerActionPath = resolve(projectRoot, 'src/runtime/HeaderActionButton.ts');
const homeModeCardPath = resolve(projectRoot, 'src/runtime/HomeModeCard.ts');

const expectedAssets = [
  'public/assets/ui/menu_button_fill.webp',
  'public/assets/ui/menu_button_frame_normal.png',
  'public/assets/ui/menu_button_frame_hover.png',
  'public/assets/ui/menu_button_frame_pressed.png',
  'public/assets/ui/icons/play.svg',
  'public/assets/ui/icons/daily.svg',
  'public/assets/ui/icons/levels.svg',
  'public/assets/ui/icons/settings.svg',
  'public/assets/ui/icons/endless.svg',
];

for (const relativePath of expectedAssets) {
  assert(existsSync(resolve(projectRoot, relativePath)), `Home hub asset must exist: ${relativePath}`);
}

assert(existsSync(rendererPath), 'Shared HomeMenuButton renderer must remain available to game menus.');
assert(
  bootSource.includes('preloadHomeMenuAssets(this)'),
  'BootScene must preload the shared Home hub textures and SVG icons.',
);
assert(
  homeSource.includes("play: 'home-menu-icon-play'")
    && homeSource.includes("daily: 'home-menu-icon-daily'")
    && homeSource.includes("levels: 'home-menu-icon-levels'")
    && homeSource.includes("endless: 'home-menu-icon-endless'"),
  'Home hub cards must reuse the matching project SVG icons.',
);
assert(existsSync(headerActionPath), 'Shared header-action renderer must exist for top navigation controls.');
assert(
  homeSource.includes('createHeaderActionButton(scene, {')
    && homeSource.includes("iconKey: 'home-menu-icon-settings'"),
  'Home must expose Settings as a compact top-right gear using the shared header style.',
);
assert(existsSync(homeModeCardPath), 'Dedicated HomeModeCard renderer must exist for Home navigation cards.');
assert(
  bootSource.includes('preloadHomeModeCardAssets(this)')
    && homeSource.includes('createHomeModeCard(scene, {'),
  'Home navigation cards must use the dedicated material-card assets instead of the old stretched menu frames.',
);
assert(
  !homeSource.includes('STATS_SCENE_KEY'),
  'Statistics must not return as a dedicated Home action.',
);

console.info('[Dungeon Logic] Home hub buttons sanity: material mode cards + shared icons passed');
