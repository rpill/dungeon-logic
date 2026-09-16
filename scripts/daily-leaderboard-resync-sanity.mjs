import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/scenes/LeaderboardScene.ts', import.meta.url), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(!source.includes('DAILY_ENTRY_RETRY_DELAYS_MS'), 'LeaderboardScene must not delay rendering with fixed retry timers.');
assert(!source.includes('waitForMatchingPlayerEntry'), 'LeaderboardScene must not poll getPlayerEntry after submission.');
assert(source.includes("if (submit === 'submitted')"), 'Successful Daily submission must have an explicit optimistic UI path.');
assert(source.includes('rawCurrent = this.makeOptimisticCurrentEntry('), 'Successful Daily submission must immediately synthesize the current player row.');
assert(source.includes('leaderboardSnapshotCache.set(cacheKey'), 'Optimistic Daily submission must update the local leaderboard cache immediately.');
assert(source.includes('void this.refreshLeaderboardCacheAfterSubmit('), 'Successful Daily submission must refresh server data in the background without blocking rendering.');
assert(source.includes("console.warn('[Dungeon Logic] Daily leaderboard score submission was not accepted.'"), 'Rejected Daily submissions must remain visible in draft diagnostics.');

console.info('[Dungeon Logic] Daily leaderboard optimistic resync sanity passed');
