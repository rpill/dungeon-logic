import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const renderer = readFileSync(resolve(root, 'src/runtime/HomeHubModeCard.ts'), 'utf8');
const home = readFileSync(resolve(root, 'src/scenes/HomeScene.ts'), 'utf8');
const strip = readFileSync(resolve(root, 'src/runtime/MasteryStrip.ts'), 'utf8');

const expectedAssets = [
  'public/assets/ui/home_hub_card_tall_moody_normal.webp',
  'public/assets/ui/home_hub_card_tall_moody_hover.webp',
  'public/assets/ui/home_hub_card_tall_moody_locked.webp',
  'public/assets/ui/home_hub_card_wide_moody_normal.webp',
  'public/assets/ui/home_hub_card_wide_moody_hover.webp',
  'public/assets/ui/home_hub_card_wide_moody_locked.webp',
];
for (const relativePath of expectedAssets) {
  assert(existsSync(resolve(root, relativePath)), `Moody Home card asset must exist: ${relativePath}`);
  assert(renderer.includes(relativePath.split('/').at(-1)), `Renderer must preload ${relativePath}.`);
}
assert(home.includes("visualStyle: 'soft-stone'"), 'Home cards must use the soft-stone state family.');
assert(strip.includes("visualStyle: 'soft-stone'"), 'Home mastery strip must use the same soft-stone state family.');
assert(renderer.includes("options.visualStyle ?? 'legacy'"), 'Other shared consumers must not silently inherit the Home redesign.');
console.info('[Dungeon Logic] Home hub card soft-dungeon palette sanity: PASS');
