import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const helperPath = resolve('src/runtime/DailyLeaderboardPresentation.ts');
assert(existsSync(helperPath), 'Date-filtered leaderboard presentation helper must exist.');

const { reindexDateFilteredLeaderboardRows } = await import(pathToFileURL(helperPath).href);

const onlyCurrent = reindexDateFilteredLeaderboardRows([
  { entry: { place: 2, isCurrentPlayer: true }, timeMs: 136_000 },
]);
assert(onlyCurrent.length === 1, 'A single current Daily result must remain visible.');
assert(onlyCurrent[0]?.displayPlace === 1, 'A single visible Daily result must display place #1, not its global technical rank.');

const mixedGlobalRanks = reindexDateFilteredLeaderboardRows([
  { entry: { place: 8, isCurrentPlayer: true }, timeMs: 140_000 },
  { entry: { place: 5, isCurrentPlayer: false }, timeMs: 120_000 },
]);
assert(mixedGlobalRanks[0]?.entry.place === 5 && mixedGlobalRanks[0]?.displayPlace === 1, 'Filtered Daily rows must preserve platform order while restarting visible places at #1.');
assert(mixedGlobalRanks[1]?.entry.place === 8 && mixedGlobalRanks[1]?.displayPlace === 2, 'Current player must get the filtered Daily place, not the global leaderboard place.');

console.info('[Dungeon Logic] Daily leaderboard presentation sanity: PASS');
