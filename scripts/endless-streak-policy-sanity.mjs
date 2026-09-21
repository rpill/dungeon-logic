import fs from 'node:fs';
const service = fs.readFileSync(new URL('../src/endless/EndlessService.ts', import.meta.url), 'utf8');
const game = fs.readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const copy = fs.readFileSync(new URL('../src/i18n/UiCopy.ts', import.meta.url), 'utf8');
function assert(condition, message) { if (!condition) throw new Error(message); }
assert(service.includes('const currentStreak = current.currentStreak + 1;'), 'Every ranked solve must advance the Endless streak, even with hints.');
assert(service.includes('currentStreak: 0'), 'Skip/Free Play state must still be able to reset the current streak.');
assert(!game.includes('displayedChallengeStreak = 0;'), 'Receiving a hint must not visually reset the Challenge streak.');
assert(copy.includes('`СЕРИЯ ${streak}`') && copy.includes('`STREAK ${streak}`'), 'Challenge HUD copy must use plain streak wording.');
assert(!copy.includes('ЧИСТАЯ СЕРИЯ') && !copy.includes('CLEAN STREAK'), 'Clean-streak wording must be removed from UI copy.');
console.info('[Dungeon Logic] Endless streak policy sanity: PASS');
