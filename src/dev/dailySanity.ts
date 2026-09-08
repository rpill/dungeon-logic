import { DAILY_FIXTURE_ENTRIES } from '../content/daily/manifest';
import type { DailyEntry } from '../content/daily/types';
import { findDailyForDate, toUtcDateKey } from '../daily/DailySelector';
import { DailyService } from '../daily/DailyService';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import type { PlayerProfileV1 } from '../profile/types';
import type { TrustedClock } from '../platform/services';

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

assert(typeof DailyService.create === 'function', 'DailyService must expose a create factory.');

class MemoryProfileStorage implements PlayerProfileStorage {
  value: PlayerProfileV1 | null = null;

  async load(): Promise<unknown | null> {
    return this.value;
  }

  async save(profile: PlayerProfileV1): Promise<void> {
    this.value = profile;
  }
}

class MutableTrustedClock implements TrustedClock {
  value: Date | null = null;

  async now(): Promise<Date | null> {
    return this.value;
  }
}

async function runServiceChecks(): Promise<void> {
  const storage = new MemoryProfileStorage();
  const profileService = await PlayerProfileService.create([], storage, { saveDelayMs: 60_000 });
  const clock = new MutableTrustedClock();
  const service = DailyService.create(DAILY_FIXTURE_ENTRIES, profileService, clock);

  const unavailable = await service.getToday();
  assert(unavailable === null, 'Daily must be unavailable when trusted time is unavailable.');

  clock.value = new Date('2099-01-02T23:59:59.999Z');
  const today = await service.getToday();
  assert(today !== null, 'Daily must resolve when trusted time is available.');
  assert(today.dateKey === '2099-01-02', 'Daily must use the trusted UTC date key.');
  assert(today.entry?.id === 'daily-fixture-2099-01-02', 'Daily must select the manifest entry for the trusted UTC date.');
  assert(today.currentStreak === 0, 'Fresh profile must expose zero active Daily streak.');
  assert(today.bestStreak === 0, 'Fresh profile must expose zero best Daily streak.');
  assert(today.totalSolved === 0, 'Fresh profile must expose zero solved Daily total.');
  assert(today.solved === false, 'Fresh profile must report today as unsolved.');
  assert(today.result === null, 'Fresh profile must not expose a result for today.');

  clock.value = new Date('2099-01-01T12:00:00.000Z');
  const first = await service.completeToday({
    bestTimeMs: 120_000,
    minHintsUsed: 2,
    solvedWithoutHints: false,
  });
  assert(first !== null, 'Daily completion must resolve when trusted time and a manifest entry exist.');
  assert(first.dateKey === '2099-01-01', 'Completion must be recorded for the trusted UTC date.');
  assert(first.wasFirstSolve === true, 'First completion of a date must be marked as the first solve.');
  assert(first.currentStreak === 1 && first.bestStreak === 1, 'First Daily solve must start both streaks at one.');
  assert(first.totalSolved === 1, 'First Daily solve must increment total solved exactly once.');
  assert(first.persisted === true, 'Daily completion must flush the profile immediately.');
  assert(storage.value !== null, 'Daily completion flush must reach profile storage.');

  let history = service.getHistory();
  assert(history.lastSolvedDate === '2099-01-01', 'Daily history must track the last solved UTC date.');
  assert(history.solvedDates.length === 1 && history.solvedDates[0] === '2099-01-01', 'Daily history must add the solved UTC date.');
  assert(history.results['2099-01-01']?.bestTimeMs === 120_000, 'Daily history must store the result summary by UTC date.');

  clock.value = new Date('2099-01-02T08:00:00.000Z');
  const second = await service.completeToday({
    bestTimeMs: 110_000,
    minHintsUsed: 1,
    solvedWithoutHints: false,
  });
  assert(second !== null, 'Second Daily completion must resolve.');
  assert(second.currentStreak === 2, 'Solving the next UTC day must extend the current streak.');
  assert(second.bestStreak === 2, 'Extending the streak must update the best streak.');
  assert(second.totalSolved === 2, 'Solving a second unique Daily must increment total solved.');

  history = service.getHistory();
  assert(history.lastSolvedDate === '2099-01-02', 'Daily history must advance last solved date on a consecutive solve.');

  clock.value = new Date('2099-01-04T10:00:00.000Z');
  const afterGap = await service.completeToday({
    bestTimeMs: 100_000,
    minHintsUsed: 2,
    solvedWithoutHints: false,
  });
  assert(afterGap !== null, 'Daily completion after a skipped date must resolve.');
  assert(afterGap.currentStreak === 1, 'Skipping a UTC date must reset the current streak to one on the next solve.');
  assert(afterGap.bestStreak === 2, 'Resetting the current streak must preserve the best streak.');
  assert(afterGap.totalSolved === 3, 'A new date after a gap must still increment total solved.');

  const repeat = await service.completeToday({
    bestTimeMs: 80_000,
    minHintsUsed: 3,
    solvedWithoutHints: true,
  });
  assert(repeat !== null, 'Repeating an already solved Daily must resolve.');
  assert(repeat.wasFirstSolve === false, 'Repeating the same UTC date must not be treated as a first solve.');
  assert(repeat.currentStreak === 1, 'Repeating the same UTC date must not increase the current streak.');
  assert(repeat.bestStreak === 2, 'Repeating the same UTC date must not change the best streak.');
  assert(repeat.totalSolved === 3, 'Repeating the same UTC date must not increase total solved.');
  assert(repeat.result.bestTimeMs === 80_000, 'Repeat solve must keep the better completion time.');
  assert(repeat.result.minHintsUsed === 2, 'Repeat solve must keep the lower hint count.');
  assert(repeat.result.solvedWithoutHints === true, 'Repeat solve must preserve any no-hint solve.');

  const repeatWithFewerHints = await service.completeToday({
    bestTimeMs: 90_000,
    minHintsUsed: 1,
    solvedWithoutHints: false,
  });
  assert(repeatWithFewerHints !== null, 'A second repeat solve must resolve.');
  assert(repeatWithFewerHints.totalSolved === 3, 'Multiple repeats must remain idempotent for total solved.');
  assert(repeatWithFewerHints.result.bestTimeMs === 80_000, 'A slower repeat must not replace the best completion time.');
  assert(repeatWithFewerHints.result.minHintsUsed === 1, 'A repeat with fewer hints must improve minimum hints used.');
  assert(repeatWithFewerHints.result.solvedWithoutHints === true, 'A later hinted repeat must not erase a prior no-hint solve.');

  history = service.getHistory();
  assert(history.solvedDates.length === 3, 'Daily solved-date history must contain unique UTC dates only.');
  assert(history.results['2099-01-04']?.bestTimeMs === 80_000, 'Merged repeat result must be stored in history.');
  assert(history.results['2099-01-04']?.minHintsUsed === 1, 'Merged history result must preserve minimum hints.');
  assert(history.results['2099-01-04']?.solvedWithoutHints === true, 'Merged history result must preserve no-hint completion.');

  clock.value = new Date('2099-01-05T09:00:00.000Z');
  const nextDay = await service.getToday();
  assert(nextDay !== null && nextDay.currentStreak === 1, 'Current streak must remain active through the day after the last solve.');

  clock.value = new Date('2099-01-06T09:00:00.000Z');
  const expired = await service.getToday();
  assert(expired !== null, 'Trusted date without a fixture must still expose Daily status.');
  assert(expired.entry === null, 'A trusted date outside the manifest must expose no Daily entry.');
  assert(expired.currentStreak === 0, 'Displayed current streak must expire after a full missed UTC day.');
  assert(service.getHistory().currentStreak === 1, 'Stored streak history must remain intact after display streak expires.');

  const unavailableBefore = service.getHistory().totalSolved;
  clock.value = null;
  assert(await service.completeToday({ bestTimeMs: 1, minHintsUsed: 0, solvedWithoutHints: true }) === null, 'Completion must be unavailable without trusted time.');
  assert(service.getHistory().totalSolved === unavailableBefore, 'Unavailable trusted time must not mutate Daily history.');
}

async function runCalendarBoundaryChecks(): Promise<void> {
  const boundaryEntries: readonly DailyEntry[] = [
    { id: 'boundary-2099-01-31', dateKey: '2099-01-31', level: DAILY_FIXTURE_ENTRIES[0].level },
    { id: 'boundary-2099-02-01', dateKey: '2099-02-01', level: DAILY_FIXTURE_ENTRIES[1].level },
    { id: 'boundary-2099-12-31', dateKey: '2099-12-31', level: DAILY_FIXTURE_ENTRIES[2].level },
    { id: 'boundary-2100-01-01', dateKey: '2100-01-01', level: DAILY_FIXTURE_ENTRIES[3].level },
  ];
  const monthStorage = new MemoryProfileStorage();
  const monthProfile = await PlayerProfileService.create([], monthStorage, { saveDelayMs: 60_000 });
  const monthClock = new MutableTrustedClock();
  const monthService = DailyService.create(boundaryEntries, monthProfile, monthClock);
  monthClock.value = new Date('2099-01-31T23:59:00.000Z');
  await monthService.completeToday({ bestTimeMs: 50_000, minHintsUsed: 0, solvedWithoutHints: true });
  monthClock.value = new Date('2099-02-01T00:01:00.000Z');
  const monthNext = await monthService.completeToday({ bestTimeMs: 49_000, minHintsUsed: 0, solvedWithoutHints: true });
  assert(monthNext?.currentStreak === 2, 'Daily streak must continue across a UTC month boundary.');

  const yearStorage = new MemoryProfileStorage();
  const yearProfile = await PlayerProfileService.create([], yearStorage, { saveDelayMs: 60_000 });
  const yearClock = new MutableTrustedClock();
  const yearService = DailyService.create(boundaryEntries, yearProfile, yearClock);
  yearClock.value = new Date('2099-12-31T23:59:00.000Z');
  await yearService.completeToday({ bestTimeMs: 50_000, minHintsUsed: 0, solvedWithoutHints: true });
  yearClock.value = new Date('2100-01-01T00:01:00.000Z');
  const yearNext = await yearService.completeToday({ bestTimeMs: 49_000, minHintsUsed: 0, solvedWithoutHints: true });
  assert(yearNext?.currentStreak === 2, 'Daily streak must continue across a UTC year boundary.');
}

void Promise.all([runServiceChecks(), runCalendarBoundaryChecks()])
  .then(() => {
    console.info('[Dungeon Logic] Daily sanity: trusted UTC selection + streak/history invariants passed');
  })
  .catch((error) => {
    throw error;
  });
