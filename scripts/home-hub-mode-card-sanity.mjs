import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const home = readFileSync(resolve(root, 'src/scenes/HomeScene.ts'), 'utf8');
const boot = readFileSync(resolve(root, 'src/scenes/BootScene.ts'), 'utf8');
const rendererPath = resolve(root, 'src/runtime/HomeHubModeCard.ts');
const renderer = readFileSync(rendererPath, 'utf8');

assert(home.includes("from '../runtime/HomeHubModeCard'"), 'Home must use the HomeHubModeCard renderer.');
assert(home.includes("visualStyle: 'soft-stone'"), 'Home must explicitly opt into the approved soft-stone card family.');
assert(home.includes('UI_ICON_KEYS.lock'), 'Locked Home cards must get a dedicated lock glyph.');
assert(home.includes('UI_THEME.colors.text.primary'), 'Unlocked card titles must use shared primary text color.');
assert(home.includes('UI_THEME.colors.text.secondary'), 'Unlocked card subtitles must use shared secondary text color.');
assert(existsSync(rendererPath), 'HomeHubModeCard renderer must exist.');

const expectedSoftAssets = [
  'public/assets/ui/home_hub_card_tall_moody_normal.webp',
  'public/assets/ui/home_hub_card_tall_moody_hover.webp',
  'public/assets/ui/home_hub_card_tall_moody_locked.webp',
  'public/assets/ui/home_hub_card_wide_moody_normal.webp',
  'public/assets/ui/home_hub_card_wide_moody_hover.webp',
  'public/assets/ui/home_hub_card_wide_moody_locked.webp',
];
for (const relativePath of expectedSoftAssets) {
  assert(existsSync(resolve(root, relativePath)), `Soft-dungeon Home card asset must exist: ${relativePath}`);
  assert(renderer.includes(relativePath.split('/').at(-1)), `Renderer must preload ${relativePath}.`);
}

assert(
  boot.includes("import { preloadHomeHubModeCardAssets } from '../runtime/HomeHubModeCard';")
    && boot.includes('preloadHomeHubModeCardAssets(this);'),
  'BootScene must preload Home hub card assets.',
);
assert(renderer.includes("export type HomeHubModeCardVisualStyle = 'legacy' | 'soft-stone'"), 'Renderer must isolate the new Home art behind a visual style.');
assert(renderer.includes("const visualStyle = options.visualStyle ?? 'legacy'"), 'Non-Home consumers must keep the legacy surface by default.');
assert(!renderer.includes('MATERIAL_BUTTON_KEYS.secondary'), 'Home hub cards must not render from the secondary button texture.');
assert(!renderer.includes('scene.add.graphics()'), 'Home hub card state feedback must remain asset-driven.');
assert(renderer.includes("type HomeHubModeCardState = 'normal' | 'hover' | 'pressed' | 'locked'"), 'Renderer must own normal/hover/pressed/locked states.');
assert(renderer.includes('setInteractive({ useHandCursor: true })'), 'Unlocked Home hub cards must remain interactive.');
assert(renderer.includes('getAudioFeedback'), 'Home hub cards must keep click audio feedback.');
assert(renderer.includes('isTouchLikePointer(pointer)'), 'Home hub cards must clear synthetic hover after touch release.');

console.info('[Dungeon Logic] Home hub mode card sanity: PASS');
