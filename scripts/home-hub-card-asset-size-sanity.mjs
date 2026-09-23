import { existsSync, readFileSync, statSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const renderer = readFileSync('src/runtime/HomeHubModeCard.ts', 'utf8');
const assets = [
  ['public/assets/ui/home_hub_card_tall_moody_normal.webp', 32_000],
  ['public/assets/ui/home_hub_card_tall_moody_hover.webp', 32_000],
  ['public/assets/ui/home_hub_card_tall_moody_locked.webp', 20_000],
  ['public/assets/ui/home_hub_card_wide_moody_normal.webp', 24_000],
  ['public/assets/ui/home_hub_card_wide_moody_hover.webp', 24_000],
  ['public/assets/ui/home_hub_card_wide_moody_locked.webp', 16_000],
];
for (const [path, maxBytes] of assets) {
  assert(existsSync(path), `Home soft-stone asset must exist: ${path}`);
  assert(statSync(path).size <= maxBytes, `${path} must stay under ${maxBytes} bytes.`);
}
assert(renderer.includes('tall: 46'), 'Soft tall NineSlice must match the approved asset corner geometry.');
assert(renderer.includes('wide: 54'), 'Soft wide NineSlice must match the approved asset corner geometry.');
console.info('[Dungeon Logic] Home hub card asset size sanity: PASS');
