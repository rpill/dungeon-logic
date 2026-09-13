import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const home = readFileSync(new URL('../src/scenes/HomeScene.ts', import.meta.url), 'utf8');
const copy = readFileSync(new URL('../src/i18n/UiCopy.ts', import.meta.url), 'utf8');

assert(
  home.includes('copy.game.tutorialTitle(entry.slot, tutorial.getLevels().length)'),
  'Tutorial resume progress must live inside the primary Home card subtitle.',
);
assert(
  home.includes('initialCopy.home.dailyLockedShort') && home.includes('copy.home.dailyLockedShort'),
  'Locked Daily card must keep a short unlock explanation in both sync and async paths.',
);
assert(
  copy.includes("dailyLockedShort: 'ПОСЛЕ УРОВНЯ 5'")
    && copy.includes("dailyLockedShort: 'AFTER LEVEL 5'"),
  'Daily locked subtitle must be localized for the compact Home tile.',
);
assert(
  !home.includes('copy.common.tutorial') && !home.includes('copy.common.howToPlay'),
  'Standalone Tutorial and How to Play utility buttons must be removed from compact Home.',
);

console.info('Home onboarding spacing sanity: compact hub PASS');
