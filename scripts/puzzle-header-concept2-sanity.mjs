import fs from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const game = fs.readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const copy = fs.readFileSync(new URL('../src/i18n/UiCopy.ts', import.meta.url), 'utf8');

assert(game.includes("from '../runtime/PuzzleHeaderLayout'"), 'GameScene must use the dedicated compact puzzle-header layout.');
assert(game.includes('headerTitlePanel'), 'GameScene must draw a decorative title panel.');
assert(game.includes('headerStatusPanel'), 'GameScene must draw a compact status panel.');
assert(game.includes('headerTimeText') && game.includes('headerStreakText'), 'Timed modes keep timer and Endless streak in one compact status row.');
assert(game.includes('.setDepth(10).setVisible(runTimerEnabled);'), 'Campaign/Tutorial hide the compact status panel entirely.');
assert(!game.includes('challengeStreakBackground'), 'Legacy third-row Endless streak badge must be removed.');
assert(!game.includes('challengeStreakText'), 'Legacy third-row Endless streak text must be removed.');
assert(copy.includes('`ИСПЫТАНИЕ ${ordinal}`'), 'Russian Endless title must drop the separator dot inside the framed title.');
assert(copy.includes('`CHALLENGE ${ordinal}`'), 'English Endless title must drop the separator dot inside the framed title.');
assert(copy.includes('`СЕРИЯ ${streak}`'), 'Russian compact streak copy must omit the colon.');
assert(copy.includes('`STREAK ${streak}`'), 'English compact streak copy must omit the colon.');

console.info('[Dungeon Logic] Puzzle header concept-2 sanity: timed compact status row + untimed title-only header passed');
