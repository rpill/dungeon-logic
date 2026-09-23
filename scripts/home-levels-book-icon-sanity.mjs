import fs from 'node:fs';

const menu = fs.readFileSync('src/runtime/HomeMenuButton.ts', 'utf8');
const home = fs.readFileSync('src/scenes/HomeScene.ts', 'utf8');

if (!menu.includes("scene.load.image('home-menu-icon-levels', 'assets/ui/icons/levels_book_blue.webp')")) {
  throw new Error('Home Levels must preload the new blue book raster icon.');
}
if (menu.includes("scene.load.svg('home-menu-icon-levels'")) {
  throw new Error('Legacy Levels SVG preload must be removed from Home.');
}
if (!home.includes("options.icon === 'daily' || options.icon === 'levels'")) {
  throw new Error('Home Levels must use the large icon sizing family shared with Daily.');
}
if (!home.includes("options.icon !== 'daily' && options.icon !== 'levels'")) {
  throw new Error('Home Levels raster icon must bypass monochrome tinting.');
}

console.log('[Dungeon Logic] Home Levels book icon sanity: PASS');
