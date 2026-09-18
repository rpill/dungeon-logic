import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const homePath = resolve(root, 'src/scenes/HomeScene.ts');
const bootPath = resolve(root, 'src/scenes/BootScene.ts');
const rendererPath = resolve(root, 'src/runtime/HomeHubModeCard.ts');

const home = readFileSync(homePath, 'utf8');
const boot = readFileSync(bootPath, 'utf8');

assert(home.includes("from '../runtime/HomeHubModeCard'"), 'Home must use the HomeHubModeCard renderer.');
assert(home.includes('UI_ICON_KEYS.lock'), 'Locked Home cards must get a dedicated lock glyph.');
assert(home.includes("'#fff1d2'"), 'Unlocked card titles must use the brighter warm-cream palette.');
assert(home.includes("'#c4d0e5'"), 'Unlocked card subtitles must use the brighter cool palette.');
assert(!home.includes("from '../runtime/HomeModeCard'"), 'Home must stop using the legacy HomeModeCard renderer.');
assert(existsSync(rendererPath), 'HomeHubModeCard renderer must exist.');

const expectedAssets = [
  'public/assets/ui/home_hub_card_tall_normal.webp',
  'public/assets/ui/home_hub_card_tall_hover.webp',
  'public/assets/ui/home_hub_card_wide_normal.webp',
  'public/assets/ui/home_hub_card_wide_hover.webp',
  'public/assets/ui/home_hub_card_tall_locked.webp',
  'public/assets/ui/home_hub_card_wide_locked.webp',
];
for (const relativePath of expectedAssets) {
  assert(existsSync(resolve(root, relativePath)), `Dedicated Home card asset must exist: ${relativePath}`);
}

const renderer = readFileSync(rendererPath, 'utf8');

assert(
  boot.includes("import { preloadHomeHubModeCardAssets } from '../runtime/HomeHubModeCard';")
    && boot.includes('preloadHomeHubModeCardAssets(this);'),
  'BootScene must preload dedicated Home hub card assets.',
);
assert(
  renderer.includes('home_hub_card_tall_normal.webp')
    && renderer.includes('home_hub_card_tall_hover.webp')
    && renderer.includes('home_hub_card_wide_normal.webp')
    && renderer.includes('home_hub_card_wide_hover.webp'),
  'Home hub cards must use card-specific normal/hover textures, not stretched button artwork.',
);
assert(!renderer.includes('MATERIAL_BUTTON_KEYS.secondary'), 'Home hub cards must not render from the secondary button texture.');
assert(!renderer.includes('MATERIAL_BUTTON_SLICE_X'), 'Home hub cards must not inherit button nine-slice geometry.');
assert(!renderer.includes('ACTIVE_ACCENT_RIM_COLOR'), 'Home hub cards must not draw gold accent rims.');
assert(!renderer.includes('ACTIVE_RIM_COLOR'), 'Home hub cards must not draw extra blue outline rims.');
assert(!renderer.includes('scene.add.graphics()'), 'Home hub card state feedback must not use overlay rims.');
assert(
  renderer.includes("type HomeHubModeCardState = 'normal' | 'hover' | 'pressed' | 'locked'"),
  'Renderer must own normal/hover/pressed/locked states.',
);
assert(renderer.includes('setTexture('), 'Hover state must swap to the dedicated card hover texture.');
assert(renderer.includes('setInteractive({ useHandCursor: true })'), 'Unlocked Home hub cards must remain interactive.');
assert(renderer.includes('getAudioFeedback'), 'Home hub cards must keep hover/click audio feedback.');
assert(renderer.includes('isTouchLikePointer(pointer)'), 'Home hub cards must clear synthetic hover after touch release.');

console.info('[Dungeon Logic] Home hub mode card sanity: PASS');
