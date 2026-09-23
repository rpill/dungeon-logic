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
const renderer = readFileSync(rendererPath, 'utf8');

assert(home.includes("from '../runtime/HomeHubModeCard'"), 'Home must use the HomeHubModeCard renderer.');
assert(home.includes('UI_ICON_KEYS.lock'), 'Locked Home cards must get a dedicated lock glyph.');
assert(home.includes('UI_THEME.colors.text.primary'), 'Unlocked card titles must use the shared primary text color.');
assert(home.includes('UI_THEME.colors.text.secondary'), 'Unlocked card subtitles must use the shared secondary text color.');
assert(!home.includes("from '../runtime/HomeModeCard'"), 'Home must stop using the legacy HomeModeCard renderer.');
assert(existsSync(rendererPath), 'HomeHubModeCard renderer must exist.');

const expectedAssets = [
  'public/assets/ui/home_hub_card_tall_moody_normal.webp',
  'public/assets/ui/home_hub_card_tall_moody_hover.webp',
  'public/assets/ui/home_hub_card_tall_moody_locked.webp',
  'public/assets/ui/home_hub_card_wide_moody_normal.webp',
  'public/assets/ui/home_hub_card_wide_moody_hover.webp',
  'public/assets/ui/home_hub_card_wide_moody_locked.webp',
];
for (const relativePath of expectedAssets) {
  assert(existsSync(resolve(root, relativePath)), `Soft-stone Home card asset must exist: ${relativePath}`);
}

assert(
  boot.includes("import { preloadHomeHubModeCardAssets } from '../runtime/HomeHubModeCard';")
    && boot.includes('preloadHomeHubModeCardAssets(this);'),
  'BootScene must preload dedicated Home hub card assets.',
);
assert(
  renderer.includes('home_hub_card_tall_moody_normal.webp')
    && renderer.includes('home_hub_card_wide_moody_normal.webp'),
  'Home hub cards must use the approved soft-stone tall/wide textures.',
);
assert(renderer.includes("type HomeHubModeCardState = 'normal' | 'hover' | 'pressed' | 'locked'"),
  'Renderer must own normal/hover/pressed/locked states.');
assert(renderer.includes("surface.setTexture(SOFT_SURFACE_KEYS[options.variant][textureState])"),
  'Soft-stone hover/locked states must switch dedicated textures.');
assert(renderer.includes('setAlpha('), 'Pressed state feedback must use alpha changes.');
assert(renderer.includes('setInteractive({ useHandCursor: true })'), 'Unlocked Home hub cards must remain interactive.');
assert(renderer.includes('getAudioFeedback'), 'Home hub cards must keep click audio feedback.');
assert(renderer.includes('isTouchLikePointer(pointer)'), 'Home hub cards must clear synthetic hover after touch release.');

console.info('[Dungeon Logic] Home hub mode card sanity: PASS');
