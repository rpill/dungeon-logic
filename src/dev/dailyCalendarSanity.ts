import {
  DAILY_RELEASE_END_DATE_KEY,
  DAILY_RELEASE_ENTRIES,
  DAILY_RELEASE_START_DATE_KEY,
} from '../content/daily/manifest';
import { curatedDailySnapshots } from '../content/daily/snapshots';
import { findDailyForDate } from '../daily/DailySelector';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const UTC_DAY_MS = 24 * 60 * 60 * 1000;

assert(DAILY_RELEASE_START_DATE_KEY === '2026-09-09', 'V1 Daily calendar starts on the explicit UTC release anchor.');
assert(DAILY_RELEASE_END_DATE_KEY === '2027-09-08', '365 consecutive Daily entries end on 2027-09-08 UTC.');
assert(DAILY_RELEASE_ENTRIES.length === 365, 'Daily calendar must bind exactly 365 curated snapshots.');
assert(curatedDailySnapshots.length === DAILY_RELEASE_ENTRIES.length, 'Every curated Daily snapshot must receive exactly one release date.');

const seenDates = new Set<string>();
const seenIds = new Set<string>();
for (let index = 0; index < DAILY_RELEASE_ENTRIES.length; index += 1) {
  const entry = DAILY_RELEASE_ENTRIES[index];
  const snapshot = curatedDailySnapshots[index];
  assert(entry.id === snapshot.id, `Daily ${index + 1} keeps immutable snapshot id ${snapshot.id}.`);
  assert(entry.level === snapshot.level, `Daily ${entry.id} reuses the curated immutable level object.`);
  assert(!entry.dateKey.startsWith('2099-'), 'Release calendar must not contain the old 2099 development fixtures.');
  assert(!seenDates.has(entry.dateKey), `Duplicate Daily date ${entry.dateKey}.`);
  assert(!seenIds.has(entry.id), `Duplicate Daily id ${entry.id}.`);
  seenDates.add(entry.dateKey);
  seenIds.add(entry.id);

  if (index > 0) {
    const previous = new Date(`${DAILY_RELEASE_ENTRIES[index - 1].dateKey}T00:00:00.000Z`).getTime();
    const current = new Date(`${entry.dateKey}T00:00:00.000Z`).getTime();
    assert(current - previous === UTC_DAY_MS, `Daily dates must be consecutive at ${entry.dateKey}.`);
  }
}

assert(findDailyForDate(DAILY_RELEASE_ENTRIES, new Date('2026-09-09T12:00:00.000Z'))?.id === 'daily-001', 'Release start selects daily-001.');
assert(findDailyForDate(DAILY_RELEASE_ENTRIES, new Date('2026-09-30T23:59:59.999Z'))?.id === 'daily-022', 'September month boundary keeps the correct Daily ordinal.');
assert(findDailyForDate(DAILY_RELEASE_ENTRIES, new Date('2026-10-01T00:00:00.000Z'))?.id === 'daily-023', 'October month boundary advances to daily-023.');
assert(findDailyForDate(DAILY_RELEASE_ENTRIES, new Date('2026-11-07T23:59:59.999Z'))?.id === 'daily-060', 'Existing day 60 keeps its immutable binding.');
assert(findDailyForDate(DAILY_RELEASE_ENTRIES, new Date('2027-09-08T23:59:59.999Z'))?.id === 'daily-365', 'Release end selects daily-365.');
assert(findDailyForDate(DAILY_RELEASE_ENTRIES, new Date('2026-09-08T23:59:59.999Z')) === null, 'Dates before the release calendar have no Daily.');
assert(findDailyForDate(DAILY_RELEASE_ENTRIES, new Date('2027-09-09T00:00:00.000Z')) === null, 'Dates after the one-year release calendar have no Daily.');

console.info('[Dungeon Logic] Daily calendar sanity: 365 immutable UTC bindings + month boundary passed');
