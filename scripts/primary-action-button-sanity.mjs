import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const rendererPath = resolve(root, 'src/runtime/PrimaryActionButton.ts');
const boot = readFileSync(resolve(root, 'src/scenes/BootScene.ts'), 'utf8');
const home = readFileSync(resolve(root, 'src/scenes/HomeScene.ts'), 'utf8');
const daily = readFileSync(resolve(root, 'src/scenes/DailyScene.ts'), 'utf8');
const levels = readFileSync(resolve(root, 'src/scenes/LevelSelectScene.ts'), 'utf8');
const game = readFileSync(resolve(root, 'src/scenes/GameScene.ts'), 'utf8');
const responsive = readFileSync(resolve(root, 'src/runtime/ResponsiveLayout.ts'), 'utf8');

const asset = 'public/assets/ui/primary_button_normal.webp';
assert(existsSync(resolve(root, asset)), `Primary CTA asset must exist: ${asset}`);

assert(existsSync(rendererPath), 'Shared PrimaryActionButton renderer must exist.');
const renderer = readFileSync(rendererPath, 'utf8');
assert(renderer.includes("fontFamily: 'monospace'"), 'Primary CTA text must remain code-rendered rather than baked into the texture.');
assert(renderer.includes('surfaceHeight = options.surfaceHeight ?? options.height'), 'Primary CTA must support a separate uniformly-scaled visual surface height.');
assert(renderer.includes('const surfaceScale = surfaceHeight / frame.height'), 'Primary CTA visual surface must scale uniformly so circular details stay circular.');
assert(
  renderer.includes('const surfaceScale = surfaceHeight / frame.height;')
    && renderer.includes('options.width / surfaceScale')
    && renderer.includes(').setScale(surfaceScale);'),
  'Primary CTA must scale the source uniformly by height and stretch only its horizontal middle so rivets stay circular.',
);

assert(boot.includes('preloadPrimaryActionButtonAssets(this)'), 'BootScene must preload primary CTA textures.');
assert(home.includes('createPrimaryActionButton(scene, {'), 'Home primary campaign action must use the yellow primary CTA renderer.');
assert(daily.includes('if (options.accentFrame) {') && daily.includes('createPrimaryActionButton(this, {'), 'Daily must use the yellow CTA only for the currently primary action.');
assert(daily.includes('createHomeMenuButton(this, {'), 'Daily secondary action must keep the existing dark menu-button renderer.');

assert(levels.includes('createPrimaryActionButton(this, {'), 'Levels Continue button must use the shared yellow primary CTA renderer.');
assert(levels.includes("iconKey: 'home-menu-icon-play'"), 'Levels Continue primary CTA must keep the play icon.');
assert(game.includes('createPrimaryActionButton(this, {'), 'Game completion overlay must be able to render the yellow primary CTA renderer.');
assert(game.includes('primary: true') && game.includes('label: copy.game.next'), 'Completion overlay must mark Next as the primary yellow CTA.');
assert(/label: copy\.game\.startLevels,[\s\S]{0,120}primary: true/.test(game), 'Tutorial completion Start Game action must use the yellow primary CTA.');
assert(game.includes('const surfaceHeight = rect.height + 8;'), 'Completion actions must preserve the yellow artwork padding while following the compact responsive panel height.');


assert(
  responsive.includes('const continueHeight = viewport.height < 620 ? 50 : 54;')
    && responsive.includes('const continueHeight = shortViewport ? 50 : 54;'),
  'Levels Continue CTA must use the taller 50/54 px responsive heights.',
);
assert(game.includes('CompletionActionRect'), 'Completion action sizing must come from the responsive completion-panel layout.');

console.info('[Dungeon Logic] Primary action button sanity: shared yellow CTA assets and integration passed');
