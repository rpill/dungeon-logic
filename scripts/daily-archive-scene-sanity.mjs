import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const mainSource = readFileSync('src/main.ts', 'utf8');
const homeSource = readFileSync('src/scenes/HomeScene.ts', 'utf8');
const dailySceneSource = readFileSync('src/scenes/DailyScene.ts', 'utf8');
const calendarSource = readFileSync('src/runtime/DailyHubCalendar.ts', 'utf8');
const copySource = readFileSync('src/i18n/UiCopy.ts', 'utf8');

assert(mainSource.includes('DailyScene'), 'DailyScene must be registered in main scene order.');
assert(homeSource.includes("this.scene.start(DAILY_SCENE_KEY)"), 'Home Daily entry must open the dedicated Daily hub.');
assert(dailySceneSource.includes("export const DAILY_SCENE_KEY = 'DailyScene'"), 'DailyScene must expose a stable navigation key.');
assert(dailySceneSource.includes('getArchive()'), 'DailyScene must load released past Daily entries from DailyService.');
assert(dailySceneSource.includes('createDailyHubCalendarMonth'), 'DailyScene must render the archive through a month calendar model.');
assert(dailySceneSource.includes('shiftDailyHubCalendarMonth'), 'DailyScene must support previous/next month navigation.');
assert(!dailySceneSource.includes('archiveRows.forEach'), 'DailyScene must not render hundreds of archive rows in one long list.');
assert(calendarSource.includes("dateKey > today.dateKey"), 'Calendar model must distinguish future locked dates from released archive dates.');
assert(calendarSource.includes("state = archive.solved ? 'archive-solved' : 'archive-unsolved'"), 'Calendar model must preserve solved/unsolved archive state.');
assert(copySource.includes("archiveTitle: 'КАЛЕНДАРЬ'"), 'RU Daily calendar title copy must exist.');
assert(copySource.includes("archiveTitle: 'CALENDAR'"), 'EN Daily calendar title copy must exist.');

console.info('[Dungeon Logic] Daily archive scene sanity: monthly calendar + past-day navigation passed');
