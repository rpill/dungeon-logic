import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const home = readFileSync(new URL('../src/scenes/HomeScene.ts', import.meta.url), 'utf8');
const game = readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const copy = readFileSync(new URL('../src/i18n/UiCopy.ts', import.meta.url), 'utf8');

assert(home.includes('const endlessUnlocked = campaign.isEndlessUnlocked();'), 'Home must derive Endless availability from Campaign progress.');
assert(home.includes('enabled: endlessUnlocked'), 'Locked Endless card must be non-interactive.');
assert(home.includes('subtitle: endlessUnlocked'), 'Endless card must show different copy while locked.');
assert(home.includes('if (!campaign.isEndlessUnlocked()) return;'), 'Home launch path must guard Endless even if invoked outside the card interaction.');
assert(copy.includes("endlessLockedAfterLevel: 'ПОСЛЕ УРОВНЯ 8'"), 'Russian Home copy must explain the Endless unlock requirement.');
assert(copy.includes("endlessLockedAfterLevel: 'AFTER LEVEL 8'"), 'English Home copy must explain the Endless unlock requirement.');
assert(game.includes('result.recommendedNextLevel !== null'), 'Campaign completion must retain its current Next/Done branching.');
assert(game.includes('showEndlessCompletionState'), 'Endless completion must retain its separate mode result.');

console.info('[Dungeon Logic] Endless unlock gate sanity: PASS');
