import {
  calculateDailyHubLayout,
  getDailyCalendarRowCount,
} from '../src/runtime/DailyHubLayout.ts';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(getDailyCalendarRowCount(1, 30) === 5, 'A 30-day month with one leading blank should render five rows.');
assert(getDailyCalendarRowCount(6, 31) === 6, 'A long late-starting month should render six rows.');

for (const [width, height, rows, label] of [
  [1738, 864, 5, 'desktop 864p'],
  [1366, 768, 6, 'desktop 768p six-row month'],
  [844, 390, 6, 'normal landscape phone six-row month'],
  [390, 844, 6, 'normal portrait phone six-row month'],
]) {
  const layout = calculateDailyHubLayout(width, height, rows);
  assert(layout.contentBottom <= height, `${label} should fit without page scrolling.`);
}

const tiny = calculateDailyHubLayout(568, 320, 6);
assert(tiny.contentBottom > 320, 'Exceptionally short viewports may still require scrolling.');

const september = calculateDailyHubLayout(1738, 864, 5);
assert(september.cellSize >= 60, 'A normal desktop five-row month should keep comfortably readable calendar cells.');

const desktopCalendar = calculateDailyHubLayout(1366, 768, 6);
assert(desktopCalendar.rowGap >= 16, 'Desktop calendar rows should leave enough vertical clearance for the active-day marker above the next row.');

const landscapePhone = calculateDailyHubLayout(844, 390, 6);
assert(landscapePhone.rowGap === 3, 'Landscape phone calendar spacing should stay compact and unchanged.');

console.info('[Dungeon Logic] Daily fit layout sanity: normal desktop/phone heights fit; only unusually short screens overflow');

import { readFileSync } from 'node:fs';
const dailySceneSource = readFileSync(new URL('../src/scenes/DailyScene.ts', import.meta.url), 'utf8');
assert(dailySceneSource.includes('calculateDailyHubLayout'), 'DailyScene should render from the height-aware DailyHub layout helper.');
assert(dailySceneSource.includes('getDailyCalendarRowCount'), 'DailyScene should derive the real month row count instead of reserving six rows.');
assert(!dailySceneSource.includes('const calendarRows = 6'), 'DailyScene must not reserve six calendar rows for every month.');
