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
assert(home.includes('UI_THEME.colors.text.primary'), 'Unlocked card titles must use shared primary text color.');
assert(home.includes('UI_THEME.colors.text.secondary'), 'Unlocked card subtitles must use shared secondary text color.');
assert(!home.includes("from '../runtime/HomeModeCard'"), 'Home must stop using the legacy HomeModeCard renderer.');
assert(existsSync(rendererPath), 'HomeHubModeCard renderer must exist.');

const expectedAssets = [
  'public/assets/ui/home_hub_card_tall_generated_trimmed.webp',
  'public/assets/ui/home_hub_card_wide_generated_trimmed.webp',
];
for (const relativePath of expectedAssets) {
  assert(existsSync(resolve(root, relativePath)), `Dedicated generated home-plaque Home card asset must exist: ${relativePath}`);
}

assert(
  boot.includes("import { preloadHomeHubModeCardAssets } from '../runtime/HomeHubModeCard';")
    && boot.includes('preloadHomeHubModeCardAssets(this);'),
  'BootScene must preload dedicated Home hub card assets.',
);
assert(
  renderer.includes('home_hub_card_tall_generated_trimmed.webp')
    && renderer.includes('home_hub_card_wide_generated_trimmed.webp'),
  'Home hub cards must use the generated home-plaque wide/tall card textures.',
);
assert(!renderer.includes('moody_hover'), 'Home hub cards must not depend on separate hover art anymore.');
assert(!renderer.includes('moody_locked'), 'Home hub cards must not depend on separate locked art anymore.');
assert(!renderer.includes('home_hub_card_tall_hover.webp'), 'Home hub cards must not depend on old hover texture names.');
assert(!renderer.includes('home_hub_card_tall_locked.webp'), 'Home hub cards must not depend on old locked texture names.');
assert(!renderer.includes('MATERIAL_BUTTON_KEYS.secondary'), 'Home hub cards must not render from the secondary button texture.');
assert(!renderer.includes('MATERIAL_BUTTON_SLICE_X'), 'Home hub cards must not inherit button nine-slice geometry.');
assert(!renderer.includes('ACTIVE_ACCENT_RIM_COLOR'), 'Home hub cards must not draw gold accent rims.');
assert(!renderer.includes('ACTIVE_RIM_COLOR'), 'Home hub cards must not draw extra blue outline rims.');
assert(!renderer.includes('scene.add.graphics()'), 'Home hub card state feedback must not use overlay rims.');
assert(
  renderer.includes("type HomeHubModeCardState = 'normal' | 'hover' | 'pressed' | 'locked'"),
  'Renderer must own normal/hover/pressed/locked states.',
);
assert(renderer.includes('setTint('), 'Locked state must be handled in code via tinting.');
assert(renderer.includes('setAlpha('), 'Hover/pressed/locked state feedback must be handled in code via alpha changes.');
assert(renderer.includes('setInteractive({ useHandCursor: true })'), 'Unlocked Home hub cards must remain interactive.');
assert(renderer.includes('getAudioFeedback'), 'Home hub cards must keep hover/click audio feedback.');
assert(renderer.includes('isTouchLikePointer(pointer)'), 'Home hub cards must clear synthetic hover after touch release.');

console.info('[Dungeon Logic] Home hub mode card sanity: PASS');
