import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const home = readFileSync(new URL('../src/scenes/HomeScene.ts', import.meta.url), 'utf8');
const copy = readFileSync(new URL('../src/i18n/UiCopy.ts', import.meta.url), 'utf8');

assert(
  home.includes('mainY + mainHeight / 2 + 10'),
  'Tutorial progress must sit 10px below the tutorial button edge, not drift toward Daily.',
);
assert(
  home.includes('initialCopy.home.dailyLockedAfterLevel'),
  'Locked Daily must explain when it unlocks.',
);
assert(
  home.includes('copy.home.dailyLockedAfterLevel'),
  'Async locked Daily path must explain when it unlocks.',
);
assert(
  copy.includes("dailyLockedAfterLevel: 'DAILY · ПОСЛЕ УРОВНЯ 5'"),
  'Russian copy must say Daily unlocks after level 5.',
);
assert(
  copy.includes("dailyLockedAfterLevel: 'DAILY · AFTER LEVEL 5'"),
  'English copy must say Daily unlocks after level 5.',
);

console.info('Home onboarding spacing sanity: PASS');
