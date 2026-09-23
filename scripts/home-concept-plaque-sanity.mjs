import fs from 'node:fs';

function read(path) { return fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'); }
function assert(condition, message) { if (!condition) throw new Error(message); }

const cards = read('src/runtime/HomeHubModeCard.ts');
const home = read('src/scenes/HomeScene.ts');
const mastery = read('src/runtime/MasteryStrip.ts');
const daily = read('src/scenes/DailyScene.ts');

for (const asset of [
  'home_hub_card_tall_moody_normal.webp',
  'home_hub_card_tall_moody_hover.webp',
  'home_hub_card_tall_moody_locked.webp',
  'home_hub_card_wide_moody_normal.webp',
  'home_hub_card_wide_moody_hover.webp',
  'home_hub_card_wide_moody_locked.webp',
]) {
  assert(cards.includes(asset), `Home plaque family must preload/use ${asset}.`);
}

assert(cards.includes("readonly visualStyle?: HomeHubModeCardVisualStyle"), 'Home card renderer must expose an isolated visual-style switch.');
assert(home.includes("visualStyle: 'soft-stone'"), 'Home mode cards must opt into the approved soft-stone family.');
assert(mastery.includes("visualStyle: 'soft-stone'"), 'Home mastery strip must opt into the same soft-stone family.');
assert(!daily.includes("visualStyle: 'soft-stone'"), 'Home redesign must not silently restyle Daily before its own migration pass.');
assert(cards.includes("resolvedState === 'hover'"), 'Home plaques must retain hover state handling.');
assert(cards.includes("resolvedState === 'locked'"), 'Home plaques must retain locked state handling.');
assert(mastery.includes("variant: 'wide'"), 'Mastery strip must share the Home wide plaque family.');
assert(home.includes("variant: 'tall'"), 'Home Levels/Daily cards must share the tall plaque family.');
assert(home.includes("variant: 'wide'"), 'Home Challenge card must share the wide plaque family.');
assert(home.includes('UI_ICON_KEYS.masteryForward'), 'Enabled Home wide cards must expose the same soft chevron language as the concept.');
assert(home.includes("variant: 'primary'"), 'Primary Continue action must remain the existing primary button family.');

console.info('[Dungeon Logic] Home concept plaque sanity: PASS');
