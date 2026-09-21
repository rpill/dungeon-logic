import { existsSync, readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const renderer = readFileSync('src/runtime/HomeHubModeCard.ts', 'utf8');
for (const path of [
  'public/assets/ui/home_hub_card_wide_generated_trimmed.webp',
  'public/assets/ui/home_hub_card_tall_generated_trimmed.webp',
]) {
  assert(existsSync(path), `Trimmed generated Home card asset must exist: ${path}`);
}

assert(renderer.includes('home_hub_card_wide_generated_trimmed.webp'), 'Wide Home card must use the trimmed generated asset.');
assert(renderer.includes('home_hub_card_tall_generated_trimmed.webp'), 'Tall Home card must use the trimmed generated asset.');
assert(renderer.includes('wide: 62'), 'Wide NineSlice must preserve the complete generated corner/rivet artwork after downscaling.');
assert(renderer.includes('tall: 52'), 'Tall NineSlice must preserve the complete generated corner/rivet artwork after downscaling.');

console.info('[Dungeon Logic] Home generated asset trim sanity: PASS');
