import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const leaderboard = readFileSync('src/scenes/LeaderboardScene.ts', 'utf8');
const stats = readFileSync('src/scenes/StatsScene.ts', 'utf8');
const statsLayout = readFileSync('src/runtime/StatsLayout.ts', 'utf8');

assert(
  leaderboard.includes('const authButtonY = Math.max('),
  'Leaderboard auth button must use an explicit Y position derived from the summary block.',
);
assert(
  leaderboard.includes('const detailBottomY ='),
  'Leaderboard must calculate the summary detail bottom before placing the auth button.',
);
assert(
  leaderboard.includes('detailBottomY + (layout.compactHeight ? 8 : 12) + buttonHeight / 2'),
  'Leaderboard auth button must keep an explicit gap below the summary detail text.',
);
assert(
  stats.includes('const firstLineY = card.y - card.height / 2 +'),
  'Statistics body rows must be anchored from the card top instead of recentered into the title row.',
);
assert(
  statsLayout.includes(': (compactVertical ? 118 : 124);'),
  'Desktop statistics cards should stay compact after typography grows.',
);

console.info('[Dungeon Logic] Meta spacing regression sanity: PASS');
