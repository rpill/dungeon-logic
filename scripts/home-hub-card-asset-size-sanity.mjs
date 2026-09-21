import { existsSync, readFileSync, statSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const renderer = readFileSync('src/runtime/HomeHubModeCard.ts', 'utf8');
const assets = [
  ['public/assets/ui/home_hub_card_tall_generated_trimmed.webp', 220_000],
  ['public/assets/ui/home_hub_card_wide_generated_trimmed.webp', 180_000],
];
for (const [path, maxBytes] of assets) {
  assert(existsSync(path), `Home card asset must exist: ${path}`);
  assert(statSync(path).size <= maxBytes, `${path} must stay under ${maxBytes} bytes.`);
}

assert(renderer.includes('tall: 52'), 'Tall NineSlice must scale with the downsized texture.');
assert(renderer.includes('wide: 62'), 'Wide NineSlice must scale with the downsized texture.');

console.info('[Dungeon Logic] Home hub card asset size sanity: PASS');
