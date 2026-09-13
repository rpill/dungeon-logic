import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const mainSource = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
const commonIconsSource = readFileSync(new URL('../src/runtime/UiIcons.ts', import.meta.url), 'utf8');
const homeMenuSource = readFileSync(new URL('../src/runtime/HomeMenuButton.ts', import.meta.url), 'utf8');

assert(mainSource.includes('pixelArt: false'), 'Global renderer must not force pixel-art filtering.');
assert(mainSource.includes('antialias: true'), 'Renderer must explicitly enable antialiasing.');
assert(mainSource.includes('antialiasGL: true'), 'WebGL antialiasing must be enabled.');
assert(commonIconsSource.includes('const UI_ICON_RASTER_SIZE = 96;'), 'Common UI SVG icons should rasterize at 96px.');
assert(commonIconsSource.includes('rasterizeConfig'), 'Common UI SVG preload should use a shared rasterization config.');
assert(homeMenuSource.includes('const HOME_MENU_ICON_RASTER_SIZE = 96;'), 'Home menu SVG icons should rasterize at 96px.');
assert(homeMenuSource.includes("scene.load.svg('home-menu-icon-play', 'assets/ui/icons/play.svg', rasterizeConfig);"), 'Home menu icons must be loaded with the shared rasterization config.');

console.info('Icon rendering sanity: PASS');
