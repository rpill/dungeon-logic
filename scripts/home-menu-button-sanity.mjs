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

const expectedAssets = [
  'public/assets/ui/menu_button_fill.png',
  'public/assets/ui/menu_button_frame_normal.png',
  'public/assets/ui/menu_button_frame_hover.png',
  'public/assets/ui/menu_button_frame_pressed.png',
  'public/assets/ui/icons/play.svg',
  'public/assets/ui/icons/daily.svg',
  'public/assets/ui/icons/levels.svg',
  'public/assets/ui/icons/statistics.svg',
  'public/assets/ui/icons/settings.svg',
];

for (const relativePath of expectedAssets) {
  assert(existsSync(resolve(projectRoot, relativePath)), `Home menu asset must exist: ${relativePath}`);
}

assert(existsSync(rendererPath), 'Home menu must have a dedicated NineSlice button renderer.');
const rendererSource = existsSync(rendererPath) ? readFileSync(rendererPath, 'utf8') : '';

assert(
  bootSource.includes('preloadHomeMenuAssets(this)'),
  'BootScene must preload menu button textures and SVG icons.',
);
assert(
  rendererSource.includes('scene.add.nineslice') && rendererSource.match(/scene\.add\.nineslice/g)?.length === 4,
  'Both shared menu-button variants must each be composed from fill + frame NineSlice layers.',
);
assert(
  rendererSource.includes("'home-menu-frame-normal'")
    && rendererSource.includes("'home-menu-frame-hover'")
    && rendererSource.includes("'home-menu-frame-pressed'"),
  'The frame must switch between normal, hover, and pressed texture states.',
);
assert(
  rendererSource.includes("scene.load.svg('home-menu-icon-play'")
    && rendererSource.includes("scene.load.svg('home-menu-icon-daily'")
    && rendererSource.includes("scene.load.svg('home-menu-icon-levels'")
    && rendererSource.includes("scene.load.svg('home-menu-icon-statistics'")
    && rendererSource.includes("scene.load.svg('home-menu-icon-settings'"),
  'Menu icons must be loaded as SVG assets.',
);
assert(
  homeSource.includes("icon: 'play'")
    && homeSource.includes("icon: 'daily'")
    && homeSource.includes("icon: 'levels'")
    && homeSource.includes("icon: 'statistics'")
    && homeSource.includes("icon: 'settings'"),
  'Home actions must use the matching menu icons.',
);

assert(
  rendererSource.includes('const HOME_MENU_FILL_FLIPS')
    && rendererSource.includes("daily: { x: true, y: false }")
    && rendererSource.includes("levels: { x: false, y: true }")
    && rendererSource.includes("statistics: { x: true, y: true }")
    && rendererSource.includes('fill.setScale(fillFlip.x ? -1 : 1, fillFlip.y ? -1 : 1)'),
  'Menu button fill must use stable per-button flips so the shared texture does not repeat identically.',
);

assert(
  rendererSource.includes('const iconX = buttonLeft + options.width * 0.27')
    && rendererSource.includes('const labelX = buttonLeft + options.width * 0.41')
    && !rendererSource.includes('const contentWidth ='),
  'Menu buttons must use fixed icon and label columns instead of centering each icon/label group independently.',
);
assert(
  rendererSource.includes("const baseFontSize = scene.scale.width < 700 ? 22 : 24"),
  'Home menu button labels must use the larger 22px mobile / 24px desktop base size.',
);
assert(
  rendererSource.includes('readonly accentFrame?: boolean')
    && rendererSource.includes("const restingFrameState: HomeMenuButtonState = options.accentFrame ? 'hover' : 'normal'"),
  'The button renderer must support an accent frame that rests on the gold hover artwork.',
);
assert(
  homeSource.includes("accentFrame: icon === 'daily' && enabled"),
  'The actionable Daily home entry must use the gold accent frame by default.',
);


assert(
  !homeSource.includes('copy.home.levelContext('),
  'Home must not render current level helper text between menu buttons.',
);
assert(
  !homeSource.includes('copy.home.today(') && !homeSource.includes('copy.home.best('),
  'Home must not render Daily detail helper text between menu buttons.',
);

assert(
  !homeSource.includes('this.add.rectangle(x, y, width, height, 0x2a3038, 1)'),
  'The old wireframe rectangle button renderer must be removed from HomeScene.',
);

console.info('[Dungeon Logic] Home menu buttons sanity: NineSlice layers + states + SVG icons passed');
