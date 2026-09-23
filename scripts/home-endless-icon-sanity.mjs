import fs from 'node:fs';

const menu = fs.readFileSync('src/runtime/HomeMenuButton.ts', 'utf8');
const home = fs.readFileSync('src/scenes/HomeScene.ts', 'utf8');

if (!menu.includes("scene.load.image('home-menu-icon-endless', 'assets/ui/icons/endless_infinity_cream_blue.webp')")) {
  throw new Error('Home Endless must preload the new cream-blue infinity raster icon.');
}
if (menu.includes("scene.load.svg('home-menu-icon-endless'")) {
  throw new Error('Legacy Endless SVG preload must be removed.');
}
if (!home.includes('const iconSize = narrow ? 42 : 64;')) {
  throw new Error('Home Endless icon must use the larger illustrated-icon size.');
}
const wideStart = home.indexOf("  } else {\n    const iconX");
const wideEnd = home.indexOf('\n    if (!enabled) {', wideStart);
const wideIconBlock = home.slice(wideStart, wideEnd);
if (wideIconBlock.includes('.setTint(')) {
  throw new Error('Home Endless illustrated icon must preserve its native colors without tint.');
}
console.log('[Dungeon Logic] Home Endless icon sanity: PASS');
