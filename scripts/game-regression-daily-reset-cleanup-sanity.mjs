import fs from 'node:fs';

const source = fs.readFileSync('src/dev/gameRegressionSanity.ts', 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(!source.includes("resetRequestSource.includes('board?.reset();')"), 'Regression sanity must not require board.reset to live directly inside requestReset.');
assert(source.includes("performPlayableResetSource.includes('board?.reset()')"), 'Regression sanity verifies the extracted reset helper clears board marks.');
assert(source.includes("resetRequestSource.includes('performPlayableReset();')"), 'Regression sanity verifies requestReset delegates to the playable reset helper.');
assert(source.includes("!resetRequestSource.includes('beginDaily(')"), 'Regression sanity keeps the ranked-Daily no-new-attempt guard.');

console.info('[Dungeon Logic] Daily reset regression cleanup sanity passed');
