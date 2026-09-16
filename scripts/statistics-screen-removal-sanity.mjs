import { readFileSync } from 'node:fs';

const game = readFileSync('src/scenes/GameScene.ts', 'utf8');
const main = readFileSync('src/main.ts', 'utf8');
const selectors = readFileSync('src/runtime/StatsSelectors.ts', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(!game.includes('STATS_SCENE_KEY'), 'Game completion flow must not route to the dedicated Statistics scene.');
assert(!main.includes("import { StatsScene }"), 'Statistics scene must not be imported into the runtime scene registry.');
assert(!main.includes('    StatsScene,'), 'Statistics scene must not be registered with Phaser.');
assert(selectors.includes('getStatsViewModel'), 'Underlying statistics aggregation must remain available for contextual stats.');

console.log('statistics screen removal sanity passed');
