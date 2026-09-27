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
const renderer = readFileSync(rendererPath, 'utf8');

const expectedAssets = [
  'public/assets/ui/action_gold_m1.png',
  'public/assets/ui/action_slate_m1.png',
  'public/assets/ui/slate_surface_m1.png',
  'public/assets/ui/icons/play.svg',
  'public/assets/ui/icons/daily_calendar_star.webp',
  'public/assets/ui/icons/levels_book_blue.webp',
  'public/assets/ui/icons/settings.svg',
  'public/assets/ui/icons/endless_infinity_cream_blue.webp',
];

for (const relativePath of expectedAssets) {
  assert(existsSync(resolve(projectRoot, relativePath)), `Home hub asset must exist: ${relativePath}`);
}

assert(existsSync(rendererPath), 'Shared HomeMenuButton renderer must remain available to game menus.');
assert(
  bootSource.includes('preloadHomeMenuAssets(this)'),
  'BootScene must preload the shared Home icons and action skins.',
);
assert(
  homeSource.includes("play: 'home-menu-icon-play'")
    && homeSource.includes("daily: 'home-menu-icon-daily'")
    && homeSource.includes("levels: 'home-menu-icon-levels'")
    && homeSource.includes("endless: 'home-menu-icon-endless'"),
  'Home cards must reuse the matching project icons.',
);
assert(existsSync(headerActionPath), 'Shared header-action renderer must exist for top navigation controls.');
assert(
  homeSource.includes('createHeaderActionButton(scene, {')
    && homeSource.includes("iconKey: 'home-menu-icon-settings'"),
  'Home must expose Settings as a compact top-right gear using the shared header style.',
);
assert(
  homeSource.includes('createSlateSurface(scene,')
    && homeSource.includes('createPrimaryActionButton(scene, {')
    && renderer.includes('createMaterialActionButton(scene, {')
    && !bootSource.includes('preloadHomeModeCardAssets(this)')
    && !bootSource.includes('preloadHomeHubModeCardAssets(this)'),
  'Home and shared menu actions must use the current slate/material family without legacy card preloads.',
);
assert(
  !homeSource.includes('STATS_SCENE_KEY'),
  'Statistics must not return as a dedicated Home action.',
);

console.info('[Dungeon Logic] Home hub buttons sanity: shared slate/actions/icons passed');
