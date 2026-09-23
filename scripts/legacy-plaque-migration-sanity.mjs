import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const daily = readFileSync('src/scenes/DailyScene.ts', 'utf8');
const uiPanel = readFileSync('src/ui/UiPanel.ts', 'utf8');
const mastery = readFileSync('src/scenes/MasteryScene.ts', 'utf8');
const leaderboard = readFileSync('src/scenes/LeaderboardScene.ts', 'utf8');
const masterRating = readFileSync('src/scenes/MasterRatingLeaderboardScene.ts', 'utf8');
const help = readFileSync('src/scenes/HelpScene.ts', 'utf8');
const stats = readFileSync('src/scenes/StatsScene.ts', 'utf8');

assert(uiPanel.includes("visualStyle: 'soft-stone'"), 'Shared wide/tall UiPanel surfaces must use the new soft-stone family.');
assert(daily.includes("visualStyle: 'soft-stone'"), 'Daily today plaque must use the new soft-stone wide card.');
assert(mastery.includes("variant: 'wide'"), 'Mastery requirement shell must migrate away from the flat panel surface.');
assert(!leaderboard.includes('const panel = this.add.graphics();'), 'Daily leaderboard page must not keep the old flat graphics panel.');
assert(!masterRating.includes('const panel = this.add.graphics();'), 'Master rating leaderboard page must not keep the old flat graphics panel.');
assert(!help.includes('const card = this.add.graphics()'), 'Help cards must not keep the old flat graphics plaques.');
assert(!stats.includes('const panel = this.add.graphics();'), 'Stats cards must not keep the old flat graphics plaques.');
console.info('[Dungeon Logic] Legacy plaque migration sanity: PASS');
