import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const rendererPath = resolve(root, 'src/runtime/HomeModeCard.ts');
const homePath = resolve(root, 'src/scenes/HomeScene.ts');
const bootPath = resolve(root, 'src/scenes/BootScene.ts');

assert(existsSync(rendererPath), 'Home mode cards must use a dedicated renderer.');
const renderer = readFileSync(rendererPath, 'utf8');
const home = readFileSync(homePath, 'utf8');
const boot = readFileSync(bootPath, 'utf8');

for (const asset of [
  'public/assets/ui/home_mode_card_tall.webp',
  'public/assets/ui/home_mode_card_wide.webp',
]) {
  assert(existsSync(resolve(root, asset)), `Home mode card asset must exist: ${asset}`);
}

assert(renderer.includes("HOME_MODE_CARD_TALL_KEY"), 'Renderer must define a dedicated tall-card texture key.');
assert(renderer.includes("HOME_MODE_CARD_WIDE_KEY"), 'Renderer must define a dedicated wide-card texture key.');
assert(renderer.includes('createHomeModeCard'), 'Renderer must expose createHomeModeCard().');
assert(renderer.includes("variant === 'tall'"), 'Renderer must distinguish tall and wide geometry instead of vertically stretching one asset.');
assert(!renderer.includes('accentGlow'), 'Active Daily must not add a second glow outline around the card.');
assert(!renderer.includes('accentAura'), 'Active Daily must not add an outer aura that reads as a double frame.');
assert(!renderer.includes('ACTIVE_ACCENT_TINT_NORMAL'), 'Active Daily must not tint the whole card body.');
assert(renderer.includes('accentBorder'), 'Active Daily must render a dedicated yellow outline.');
assert(renderer.includes('strokeRoundedRect'), 'Active Daily accent must be a single rounded outline around the card.');
assert(renderer.includes('0xf0bd63'), 'Active Daily outline must use the shared warm yellow accent.');
assert(renderer.includes('getAudioFeedback'), 'Mode cards must keep shared hover/click feedback.');
assert(renderer.includes('const surfaceScale = options.height / sourceHeight;'), 'Mode card artwork must scale uniformly from its native height.');
assert(renderer.includes('const localWidth = options.width / surfaceScale;'), 'Mode cards may extend only their horizontal center after uniform scaling.');
assert(renderer.includes('isTouchLikePointer(pointer)'), 'Mode cards must clear synthetic hover after touch release.');

assert(boot.includes('preloadHomeModeCardAssets(this);'), 'BootScene must preload the new home mode card assets.');
assert(home.includes("variant: 'tall'"), 'Levels and Daily must use tall home mode cards.');
assert(home.includes("variant: 'wide'"), 'Endless must use the wide home mode card.');
assert(home.includes('activeAccent: !solved'), 'Unsolved available Daily must opt in to the new accent treatment.');
assert(!home.includes("const HOME_FILL_KEY = 'home-menu-fill'"), 'Home mode cards must no longer use the old stretched menu fill asset.');
assert(!home.includes('HOME_FRAME_SLICE_Y'), 'Home mode cards must no longer depend on the old horizontally-oriented frame slicing.');

console.info('[Dungeon Logic] Home mode card sanity: PASS');
