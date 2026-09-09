import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const mainSource = readFileSync('src/main.ts', 'utf8');
const homeSource = readFileSync('src/scenes/HomeScene.ts', 'utf8');
const dailySceneSource = readFileSync('src/scenes/DailyScene.ts', 'utf8');
const copySource = readFileSync('src/i18n/UiCopy.ts', 'utf8');

assert(mainSource.includes('DailyScene'), 'DailyScene must be registered in main scene order.');
assert(homeSource.includes("this.scene.start(DAILY_SCENE_KEY)"), 'Home Daily entry must open the dedicated Daily hub.');
assert(dailySceneSource.includes("export const DAILY_SCENE_KEY = 'DailyScene'"), 'DailyScene must expose a stable navigation key.');
assert(dailySceneSource.includes('getArchive()'), 'DailyScene must load released past Daily entries from DailyService.');
assert(dailySceneSource.includes('archiveRows'), 'DailyScene must render archive rows.');
assert(dailySceneSource.includes('setScroll'), 'DailyScene must support a scrollable archive list.');
assert(copySource.includes("archiveTitle: 'АРХИВ DAILY'"), 'RU Daily archive title copy must exist.');
assert(copySource.includes("archiveTitle: 'DAILY ARCHIVE'"), 'EN Daily archive title copy must exist.');
assert(copySource.includes("archiveNotSolved: 'НЕ ПРОЙДЕНО'"), 'RU archive unsolved state copy must exist.');
assert(copySource.includes("archiveNotSolved: 'NOT SOLVED'"), 'EN archive unsolved state copy must exist.');

console.info('[Dungeon Logic] Daily archive scene sanity: dedicated hub + archive list + navigation passed');
