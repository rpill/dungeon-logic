import {
  DAILY_RELEASE_COUNT,
  DAILY_RELEASE_DATE_KEYS,
  DAILY_RELEASE_END_DATE_KEY,
  DAILY_RELEASE_START_DATE_KEY,
  formatDailyId,
} from '../content/daily/calendar';
import { findDailyForDate } from '../daily/DailySelector';
import { DAILY_PRODUCTION_ENTRIES } from './DailyProductionCatalog';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(DAILY_RELEASE_COUNT === 7305, 'Daily calendar must contain exactly 7305 dates.');
assert(DAILY_PRODUCTION_ENTRIES.length === DAILY_RELEASE_COUNT, 'Daily production catalog must bind one entry per date.');
assert(DAILY_RELEASE_START_DATE_KEY === '2026-09-09', 'Daily release start date changed unexpectedly.');
assert(DAILY_RELEASE_END_DATE_KEY === '2046-09-08', 'Daily release end date must cover exactly 7305 days.');

for (let index = 0; index < DAILY_RELEASE_COUNT; index += 1) {
  const entry = DAILY_PRODUCTION_ENTRIES[index];
  assert(entry.id === formatDailyId(index), `Daily id mismatch at index ${index}.`);
  assert(entry.dateKey === DAILY_RELEASE_DATE_KEYS[index], `Daily date mismatch at index ${index}.`);
  if (index > 0) {
    const previous = Date.parse(`${DAILY_PRODUCTION_ENTRIES[index - 1].dateKey}T00:00:00.000Z`);
    const current = Date.parse(`${entry.dateKey}T00:00:00.000Z`);
    assert(current - previous === 86_400_000, `Daily dates are not consecutive at index ${index}.`);
  }
}

assert(findDailyForDate(DAILY_PRODUCTION_ENTRIES, new Date('2026-09-09T12:00:00.000Z'))?.id === 'daily-0001', 'Release start must select daily-0001.');
assert(findDailyForDate(DAILY_PRODUCTION_ENTRIES, new Date('2046-09-08T23:59:59.999Z'))?.id === 'daily-7305', 'Release end must select daily-7305.');
assert(findDailyForDate(DAILY_PRODUCTION_ENTRIES, new Date('2026-09-08T23:59:59.999Z')) === null, 'Dates before release must return null.');
assert(findDailyForDate(DAILY_PRODUCTION_ENTRIES, new Date('2046-09-09T00:00:00.000Z')) === null, 'Dates after release must return null.');

console.info('[Dungeon Logic] Daily calendar sanity passed.');
