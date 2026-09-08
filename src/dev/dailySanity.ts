import { DAILY_FIXTURE_ENTRIES } from '../content/daily/manifest';
import { findDailyForDate, toUtcDateKey } from '../daily/DailySelector';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const beforeMidnight = new Date('2099-01-01T23:59:59.999Z');
const atMidnight = new Date('2099-01-02T00:00:00.000Z');

assert(toUtcDateKey(beforeMidnight) === '2099-01-01', 'UTC date key must stay on Jan 1 before midnight.');
assert(toUtcDateKey(atMidnight) === '2099-01-02', 'UTC date key must advance exactly at UTC midnight.');

const jan1A = findDailyForDate(DAILY_FIXTURE_ENTRIES, new Date('2099-01-01T01:00:00.000Z'));
const jan1B = findDailyForDate(DAILY_FIXTURE_ENTRIES, new Date('2099-01-01T22:15:00.000Z'));
assert(jan1A !== null && jan1B !== null, 'Fixture Jan 1 Daily must exist.');
assert(jan1A.id === jan1B.id, 'Same UTC date must always select the same Daily entry.');
assert(jan1A.level.id === 'level-001', '2099-01-01 fixture must reuse level001.');

const expected = [
  ['2099-01-01', 'daily-fixture-2099-01-01', 'level-001'],
  ['2099-01-02', 'daily-fixture-2099-01-02', 'level-002'],
  ['2099-01-03', 'daily-fixture-2099-01-03', 'level-003'],
  ['2099-01-04', 'daily-fixture-2099-01-04', 'level-004'],
  ['2099-01-05', 'daily-fixture-2099-01-05', 'level-005'],
] as const;

assert(DAILY_FIXTURE_ENTRIES.length === expected.length, 'Daily fixture manifest must contain exactly five entries.');
for (let index = 0; index < expected.length; index += 1) {
  const [dateKey, id, levelId] = expected[index];
  const entry = DAILY_FIXTURE_ENTRIES[index];
  assert(entry.dateKey === dateKey, `Fixture ${index + 1} must use ${dateKey}.`);
  assert(entry.id === id, `Fixture ${index + 1} must use ${id}.`);
  assert(entry.level.id === levelId, `Fixture ${index + 1} must reuse ${levelId}.`);
}

assert(findDailyForDate(DAILY_FIXTURE_ENTRIES, new Date('2099-01-06T00:00:00.000Z')) === null, 'Dates outside fixture manifest must return null.');

console.info('[Dungeon Logic] Daily sanity: UTC date keys + deterministic fixture selection passed');
