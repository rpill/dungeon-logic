import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const leaderboard = readFileSync('src/scenes/LeaderboardScene.ts', 'utf8');
const stats = readFileSync('src/scenes/StatsScene.ts', 'utf8');
const statsLayout = readFileSync('src/runtime/StatsLayout.ts', 'utf8');
const statsSelectors = readFileSync('src/runtime/StatsSelectors.ts', 'utf8');
const uiCopy = readFileSync('src/i18n/UiCopy.ts', 'utf8');
const homeButton = readFileSync('src/runtime/HomeMenuButton.ts', 'utf8');

assert(leaderboard.includes("createSceneBackground(this, 'meta')"), 'Leaderboard must reuse the shared meta background.');
assert(leaderboard.includes("this.scene.start('DailyScene')"), 'Leaderboard Back must return to Daily.');
assert(leaderboard.includes('createCenteredTextMenuButton'), 'Leaderboard authorization must use the shared menu-button assets.');
assert(leaderboard.includes("services.kind === 'yandex'"), 'Leaderboard must distinguish Yandex authorization from local preview mode.');
assert(!leaderboard.includes('!authorized && fixedScoreMs !== null'), 'Authorization offer must not depend on already having a score.');
assert(leaderboard.includes('createMetaPageHeader'), 'Leaderboard title must use the shared gold line/diamond visual language.');
assert(uiCopy.includes("title: 'ТАБЛИЦА ЛИДЕРОВ'"), 'RU leaderboard title must be concise.');
assert(uiCopy.includes("back: '← DAILY'"), 'RU leaderboard back label must return to Daily.');
assert(homeButton.includes('export function createCenteredTextMenuButton'), 'Shared menu assets must expose a centered text-only action for authorization.');

assert(stats.includes("createSceneBackground(this, 'meta')"), 'Statistics must reuse the shared meta background.');
assert(stats.includes('createMetaPageHeader'), 'Statistics title must use the shared gold line/diamond visual language.');
assert(!stats.includes('renderCalendar('), 'Statistics must not duplicate the Daily calendar UI.');
assert(!stats.includes('DailyMonthCalendarView'), 'Statistics scene must not depend on Daily calendar presentation types.');
assert(!statsLayout.includes('StatsCalendarLayout'), 'Statistics layout must no longer reserve calendar geometry.');
assert(!statsSelectors.includes('DailyMonthCalendarView'), 'Statistics view model must no longer build duplicate calendar data.');
assert(stats.includes("'home-menu-icon-levels'"), 'Campaign statistics card must reuse the Levels icon.');
assert(stats.includes("'home-menu-icon-daily'"), 'Daily statistics card must reuse the Daily icon.');
assert(stats.includes("'home-menu-icon-statistics'"), 'Overall statistics card must reuse the Statistics icon.');

console.info('[Dungeon Logic] Meta pages visual sanity: leaderboard + simplified statistics requirements passed');
