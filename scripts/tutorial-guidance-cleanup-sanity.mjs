import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const gameScene = readFileSync('src/scenes/GameScene.ts', 'utf8');
const copy = readFileSync('src/i18n/UiCopy.ts', 'utf8');

assert(!gameScene.includes('onboardingGuides'), 'Tutorial must not draw rectangular clue guide overlays.');
assert(!gameScene.includes('onboardingActionText'), 'Tutorial must not render the obsolete secondary action instruction under the main copy.');
assert(!copy.includes('ЗОЛОТЫЕ КЛЕТКИ'), 'Russian onboarding copy must not refer to obsolete gold cells.');
assert(!copy.includes('GOLD CELLS'), 'English onboarding copy must not refer to obsolete gold cells.');

console.info('[Dungeon Logic] Tutorial guidance cleanup sanity: no cross overlays and no obsolete gold-cell instruction passed');
