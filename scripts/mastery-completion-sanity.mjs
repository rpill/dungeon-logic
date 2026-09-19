import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function assert(condition, message) { if (!condition) throw new Error(message); }
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const game = readFileSync(resolve(root, 'src/scenes/GameScene.ts'), 'utf8');
const formatterPath = resolve(root, 'src/runtime/MasteryCompletion.ts');
assert(existsSync(formatterPath), 'MasteryCompletion formatter must exist.');
assert(game.includes('compareMastery'), 'GameScene must compare Mastery before/after persisted completions.');
assert(game.includes("'campaign'"), 'Campaign completion must participate in Mastery.');
assert(game.includes("'daily'"), 'Ranked Daily completion must participate in Mastery.');
assert(game.includes("'endless'"), 'Endless completion must participate in Mastery.');
assert(game.includes('formatMasteryProgressNote'), 'GameScene must format compact Mastery progress notes.');
assert(game.includes('result.ranked') && game.includes('result.wasFirstSolve'), 'Daily Mastery must be restricted to ranked first solves.');
const formatter = existsSync(formatterPath) ? readFileSync(formatterPath, 'utf8') : '';
assert(formatter.includes('transition.rankAdvanced'), 'Rank-up must suppress the compact progress note.');
assert(formatter.includes("case 'campaign':") && formatter.includes("case 'daily-completed':") && formatter.includes("case 'endless-completed':"), 'Formatter must support all Mastery metrics.');
console.info('[Dungeon Logic] Mastery completion sanity: PASS');

assert(!game.includes('completionBoardReserve'), 'Completion UI must not shrink or move the gameplay board.');
assert(!game.includes('calculateStableBoardLayout(40)'), 'Completion states must not apply a second compact board layout.');