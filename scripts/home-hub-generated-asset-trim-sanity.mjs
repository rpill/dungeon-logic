import { existsSync, readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const renderer = readFileSync('src/runtime/HomeHubModeCard.ts', 'utf8');
for (const path of [
  'public/assets/ui/home_hub_card_wide_generated_trimmed.webp',
  'public/assets/ui/home_hub_card_tall_generated_trimmed.webp',
]) {
  assert(existsSync(path), `Legacy shared Home-card asset must remain available for non-Home consumers: ${path}`);
}
assert(renderer.includes('home_hub_card_wide_generated_trimmed.webp'), 'Legacy wide asset must remain available behind the default visual style.');
assert(renderer.includes('home_hub_card_tall_generated_trimmed.webp'), 'Legacy tall asset must remain available behind the default visual style.');
assert(renderer.includes('wide: 62'), 'Legacy wide NineSlice geometry must remain stable.');
assert(renderer.includes('tall: 52'), 'Legacy tall NineSlice geometry must remain stable.');
console.info('[Dungeon Logic] Home legacy shared asset compatibility sanity: PASS');
