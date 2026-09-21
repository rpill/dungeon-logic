import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const rendererPath = resolve(root, 'src/runtime/HomeHubModeCard.ts');
const renderer = readFileSync(rendererPath, 'utf8');

const expectedAssets = [
  'public/assets/ui/home_hub_card_tall_generated_trimmed.webp',
  'public/assets/ui/home_hub_card_wide_generated_trimmed.webp',
];
for (const relativePath of expectedAssets) {
  assert(existsSync(resolve(root, relativePath)), `Simplified Home card asset must exist: ${relativePath}`);
}

assert(
  renderer.includes('home_hub_card_tall_generated_trimmed.webp')
  && renderer.includes('home_hub_card_wide_generated_trimmed.webp'),
  'Home hub cards must preload the new generated home-plaque dungeon card asset pair.',
);
assert(!renderer.includes('home_hub_card_tall_moody_hover.webp'), 'Renderer must not preload separate moody hover art.');
assert(!renderer.includes('home_hub_card_tall_moody_locked.webp'), 'Renderer must not preload separate moody locked art.');
assert(!renderer.includes('home_hub_card_wide_moody_hover.webp'), 'Renderer must not preload separate moody wide hover art.');
assert(!renderer.includes('home_hub_card_wide_moody_locked.webp'), 'Renderer must not preload separate moody wide locked art.');

console.info('[Dungeon Logic] Home hub card generated home-plaque palette sanity: PASS');
