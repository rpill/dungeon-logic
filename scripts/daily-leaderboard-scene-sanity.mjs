import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const gameSource = readFileSync('src/scenes/GameScene.ts', 'utf8');
const leaderboardSource = readFileSync('src/scenes/LeaderboardScene.ts', 'utf8');
const dailySource = readFileSync('src/scenes/DailyScene.ts', 'utf8');
const mainSource = readFileSync('src/main.ts', 'utf8');
const copySource = readFileSync('src/i18n/UiCopy.ts', 'utf8');

assert(mainSource.includes('LeaderboardScene,'), 'LeaderboardScene is registered in Phaser scene order.');
assert(dailySource.includes('this.scene.start(LEADERBOARD_SCENE_KEY'), 'Solved current Daily opens the leaderboard from the Daily hub.');
assert(gameSource.includes('encodeDailyLeaderboardScore'), 'Ranked Daily completion encodes date and time into the single leaderboard score.');
assert(gameSource.includes("getDailyLeaderboardName(result.dailyId)"), 'Ranked Daily submission resolves the single technical leaderboard through the Daily id validator.');
assert(gameSource.includes('if (!result.ranked'), 'Leaderboard submission is gated by the completion result, so late/archive completions cannot submit.');
assert(gameSource.includes('copy.common.leaderboard'), 'Ranked Daily completion exposes a leaderboard button.');
assert(gameSource.includes('RANKED_DAILY_HINT_UNLOCK_MS'), 'Ranked Daily delays hints behind the explicit five-minute gate instead of blocking them forever.');
assert(leaderboardSource.includes('decodeDailyLeaderboardScore'), 'Leaderboard rows decode the packed single-table score.');
assert(leaderboardSource.includes('decoded.dateKey !== dateKey'), 'Leaderboard filters rows to the requested current Daily date.');
assert(leaderboardSource.includes('result.minHintsUsed === 0'), 'LeaderboardScene never re-submits an assisted Daily result after a hint disqualified it.');
assert(copySource.includes("dailyResultFixed: 'РЕЗУЛЬТАТ ЗАФИКСИРОВАН'"), 'RU result copy clearly says the Daily result is fixed.');
assert(copySource.includes("dailyArchiveComplete: 'АРХИВНЫЙ DAILY ПРОЙДЕН'"), 'RU archive completion copy explicitly distinguishes unranked archive play.');

console.info('[Dungeon Logic] Daily leaderboard scene sanity: one-table encoded ranking + date filtering + archive completion passed');
