import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/dev/gameRegressionSanity.ts', import.meta.url), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(!source.includes('Campaign 003 disputed hint target is Floor.'), 'Legacy Campaign 003 disputed-hint regression must be removed.');
assert(!source.includes('Wrong Wall does not change Campaign 003 hint truth.'), 'Legacy Campaign 003 wrong-wall hint regression must be removed.');
assert(!source.includes('Completed review reconstructs the canonical Floor in the disputed cell.'), 'Legacy disputed-cell completed-review assertion must be removed.');
assert(!source.includes("from '../gameplay/HintService'"), 'gameRegressionSanity must no longer import HintService only for the legacy disputed-cell case.');
assert(!source.includes("from '../puzzle/PuzzleState'"), 'gameRegressionSanity must no longer import PuzzleState only for the legacy disputed-cell case.');
assert(!source.includes("from '../puzzle/types'"), 'gameRegressionSanity must no longer import CellState only for the legacy disputed-cell case.');
console.info('[Dungeon Logic] game regression cleanup sanity: PASS');
