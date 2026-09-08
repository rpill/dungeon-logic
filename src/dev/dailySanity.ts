import { DAILY_RELEASE_ENTRIES } from '../content/daily/manifest';
import type { DailyEntry } from '../content/daily/types';
import { findDailyForDate, toUtcDateKey } from '../daily/DailySelector';
import { DailyService, getRecentDailyHistory } from '../daily/DailyService';
import {
  completeDailyGameLaunch,
  createDailyGameSceneData,
  createDevGameSceneData,
} from '../runtime/GameLaunch';
import { PlayerProfileService } from '../profile/PlayerProfileService';
import type { PlayerProfileStorage } from '../profile/PlayerProfileStorage';
import type { PlayerProfileV1 } from '../profile/types';
import type { TrustedClock } from '../platform/services';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const beforeMidnight = new Date('2026-09-09T23:59:59.999Z');
const atMidnight = new Date('2026-09-10T00:00:00.000Z');

assert(toUtcDateKey(beforeMidnight) === '2026-09-09', 'UTC date key must stay on Sep 9 before midnight.');
assert(toUtcDateKey(atMidnight) === '2026-09-10', 'UTC date key must advance exactly at UTC midnight.');

const releaseStartA = findDailyForDate(DAILY_RELEASE_ENTRIES, new Date('2026-09-09T01:00:00.000Z'));
const releaseStartB = findDailyForDate(DAILY_RELEASE_ENTRIES, new Date('2026-09-09T22:15:00.000Z'));
assert(releaseStartA !== null && releaseStartB !== null, 'Release-start Daily must exist.');
assert(releaseStartA.id === releaseStartB.id, 'Same UTC date must always select the same Daily entry.');
assert(releaseStartA.id === 'daily-001' && releaseStartA.level.id === 'daily-001', 'Release start must use curated daily-001.');

const expectedStart = [
  ['2026-09-09', 'daily-001'],
  ['2026-09-10', 'daily-002'],
  ['2026-09-11', 'daily-003'],
  ['2026-09-12', 'daily-004'],
  ['2026-09-13', 'daily-005'],
] as const;

assert(DAILY_RELEASE_ENTRIES.length === 60, 'Daily release manifest must contain exactly sixty entries.');
for (let index = 0; index < expectedStart.length; index += 1) {
  const [dateKey, id] = expectedStart[index];
  const entry = DAILY_RELEASE_ENTRIES[index];
  assert(entry.dateKey === dateKey, `Release Daily ${index + 1} must use ${dateKey}.`);
  assert(entry.id === id, `Release Daily ${index + 1} must use ${id}.`);
  assert(entry.level.id === id, `Release Daily ${index + 1} must reuse curated ${id}.`);
}
assert(DAILY_RELEASE_ENTRIES[59].dateKey === '2026-11-07' && DAILY_RELEASE_ENTRIES[59].id === 'daily-060', 'Release calendar must end with daily-060 on 2026-11-07.');
assert(findDailyForDate(DAILY_RELEASE_ENTRIES, new Date('2026-09-08T23:59:59.999Z')) === null, 'Dates before the release calendar must return null.');
assert(findDailyForDate(DAILY_RELEASE_ENTRIES, new Date('2026-11-08T00:00:00.000Z')) === null, 'Dates after the release calendar must return null.');

assert(typeof DailyService.create === 'function', 'DailyService must expose a create factory.');

const dailyLaunch = createDailyGameSceneData(DAILY_RELEASE_ENTRIES[0]);
assert(dailyLaunch.level === DAILY_RELEASE_ENTRIES[0].level, 'Daily launch must reuse the immutable Daily snapshot.');
assert(dailyLaunch.context.mode === 'daily', 'Daily launch must use daily mode.');
assert(
  dailyLaunch.context.mode === 'daily'
    && dailyLaunch.context.dailyId === DAILY_RELEASE_ENTRIES[0].id
    && dailyLaunch.context.dateKey === DAILY_RELEASE_ENTRIES[0].dateKey,
  'Daily launch must carry the exact Daily id and UTC date key.',
);
assert(dailyLaunch.onboarding.length === 0, 'Daily launch must not replay campaign onboarding.');

const recentHistory = getRecentDailyHistory(
  '2100-01-02',
  ['2099-12-28', '2099-12-31', '2100-01-02'],
  7,
);
assert(recentHistory.length === 7, 'Daily win history must expose a compact seven-day window.');
assert(recentHistory[0].dateKey === '2099-12-27', 'Recent Daily history must cross UTC year boundaries correctly.');
assert(recentHistory[6].dateKey === '2100-01-02' && recentHistory[6].isToday, 'Recent Daily history must end on today.');
assert(recentHistory[1].solved, 'Recent Daily history must mark solved dates.');
assert(!recentHistory[2].solved, 'Recent Daily history must preserve missed dates.');
assert(recentHistory[4].solved, 'Recent Daily history must mark Dec 31 across the year boundary.');

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
  const service = DailyService.create(DAILY_RELEASE_ENTRIES, profileService, clock);

  const unavailable = await service.getToday();
  assert(unavailable === null, 'Daily must be unavailable when trusted time is unavailable.');

  clock.value = new Date('2026-09-10T23:59:59.999Z');
  const today = await service.getToday();
  assert(today !== null, 'Daily must resolve when trusted time is available.');
  assert(today.dateKey === '2026-09-10', 'Daily must use the trusted UTC date key.');
  assert(today.entry?.id === 'daily-002', 'Daily must select the release entry for the trusted UTC date.');
  assert(today.currentStreak === 0, 'Fresh profile must expose zero active Daily streak.');
  assert(today.bestStreak === 0, 'Fresh profile must expose zero best Daily streak.');
  assert(today.totalSolved === 0, 'Fresh profile must expose zero solved Daily total.');
  assert(today.solved === false, 'Fresh profile must report today as unsolved.');
  assert(today.result === null, 'Fresh profile must not expose a result for today.');

  clock.value = new Date('2026-09-09T12:00:00.000Z');
  const first = await service.completeToday({
    bestTimeMs: 120_000,
    minHintsUsed: 2,
    solvedWithoutHints: false,
  });
  assert(first !== null, 'Daily completion must resolve when trusted time and a manifest entry exist.');
  assert(first.dateKey === '2026-09-09', 'Completion must be recorded for the trusted UTC date.');
  assert(first.wasFirstSolve === true, 'First completion of a date must be marked as the first solve.');
  assert(first.currentStreak === 1 && first.bestStreak === 1, 'First Daily solve must start both streaks at one.');
  assert(first.totalSolved === 1, 'First Daily solve must increment total solved exactly once.');
  assert(first.persisted === true, 'Daily completion must flush the profile immediately.');
  assert(storage.value !== null, 'Daily completion flush must reach profile storage.');

  let history = service.getHistory();
  assert(history.lastSolvedDate === '2026-09-09', 'Daily history must track the last solved UTC date.');
  assert(history.solvedDates.length === 1 && history.solvedDates[0] === '2026-09-09', 'Daily history must add the solved UTC date.');
  assert(history.results['2026-09-09']?.bestTimeMs === 120_000, 'Daily history must store the result summary by UTC date.');

  clock.value = new Date('2026-09-10T08:00:00.000Z');
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
  assert(history.lastSolvedDate === '2026-09-10', 'Daily history must advance last solved date on a consecutive solve.');

  clock.value = new Date('2026-09-12T10:00:00.000Z');
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
  assert(history.results['2026-09-12']?.bestTimeMs === 80_000, 'Merged repeat result must be stored in history.');
  assert(history.results['2026-09-12']?.minHintsUsed === 1, 'Merged history result must preserve minimum hints.');
  assert(history.results['2026-09-12']?.solvedWithoutHints === true, 'Merged history result must preserve no-hint completion.');

  clock.value = new Date('2026-09-13T09:00:00.000Z');
  const nextDay = await service.getToday();
  assert(nextDay !== null && nextDay.currentStreak === 1, 'Current streak must remain active through the day after the last solve.');

  clock.value = new Date('2026-11-08T09:00:00.000Z');
  const expired = await service.getToday();
  assert(expired !== null, 'Trusted date outside the release calendar must still expose Daily status.');
  assert(expired.entry === null, 'A trusted date outside the release calendar must expose no Daily entry.');
  assert(expired.currentStreak === 0, 'Displayed current streak must expire after a full missed UTC day.');
  assert(service.getHistory().currentStreak === 1, 'Stored streak history must remain intact after display streak expires.');

  const unavailableBefore = service.getHistory().totalSolved;
  clock.value = null;
  assert(await service.completeToday({ bestTimeMs: 1, minHintsUsed: 0, solvedWithoutHints: true }) === null, 'Completion must be unavailable without trusted time.');
  assert(service.getHistory().totalSolved === unavailableBefore, 'Unavailable trusted time must not mutate Daily history.');
}

async function runLaunchCompletionChecks(): Promise<void> {
  const dailyData = createDailyGameSceneData(DAILY_RELEASE_ENTRIES[0]);
  assert(dailyData.context.mode === 'daily', 'Daily launch context must remain narrowed for completion checks.');
  const completion = {
    dateKey: '2026-09-09',
    wasFirstSolve: true,
    currentStreak: 4,
    bestStreak: 7,
    totalSolved: 12,
    result: {
      bestTimeMs: 75_000,
      minHintsUsed: 1,
      solvedWithoutHints: false,
    },
    persisted: true,
  } as const;
  let calls = 0;
  let forwardedDateKey: string | null = null;
  let forwardedDailyId: string | null = null;
  let forwarded: import('../profile/types').DailyResultSummary | null = null;
  const port = {
    completeDaily: async (
      dateKey: string,
      dailyId: string,
      result: import('../profile/types').DailyResultSummary,
    ) => {
      calls += 1;
      forwardedDateKey = dateKey;
      forwardedDailyId = dailyId;
      forwarded = result;
      return completion;
    },
  };
  const result = {
    bestTimeMs: 75_000,
    minHintsUsed: 1,
    solvedWithoutHints: false,
  } as const;

  const resolved = await completeDailyGameLaunch(dailyData, port, result);
  assert(resolved === completion, 'Daily GameScene completion must return the DailyService result unchanged.');
  assert(calls === 1 && forwarded === result, 'Daily GameScene completion must forward the exact result once.');
  assert(
    forwardedDateKey === dailyData.context.dateKey && forwardedDailyId === dailyData.context.dailyId,
    'Daily GameScene completion must credit the exact launched Daily id/date even across UTC midnight.',
  );

  const devResolved = await completeDailyGameLaunch(
    createDevGameSceneData(DAILY_RELEASE_ENTRIES[0].level),
    port,
    result,
  );
  assert(devResolved === null, 'Dev completion must not use DailyService.');
  assert(calls === 1, 'Dev completion must not call the Daily completion port.');
}

async function runLaunchedDateCompletionChecks(): Promise<void> {
  const storage = new MemoryProfileStorage();
  const profileService = await PlayerProfileService.create([], storage, { saveDelayMs: 60_000 });
  const clock = new MutableTrustedClock();
  const service = DailyService.create(DAILY_RELEASE_ENTRIES, profileService, clock);

  clock.value = new Date('2026-09-10T00:05:00.000Z');
  const completed = await service.completeDaily(
    '2026-09-09',
    'daily-001',
    { bestTimeMs: 70_000, minHintsUsed: 0, solvedWithoutHints: true },
  );
  assert(completed?.dateKey === '2026-09-09', 'A Daily opened before UTC midnight must credit its launched date after midnight.');
  assert(service.getHistory().solvedDates.includes('2026-09-09'), 'Cross-midnight completion must store the launched date in history.');
  assert(!service.getHistory().solvedDates.includes('2026-09-10'), 'Cross-midnight completion must not credit the new UTC day with the old board.');

  const beforeInvalid = service.getHistory().totalSolved;
  const invalid = await service.completeDaily(
    '2026-09-09',
    'daily-002',
    { bestTimeMs: 60_000, minHintsUsed: 0, solvedWithoutHints: true },
  );
  assert(invalid === null, 'Daily completion must reject a mismatched launched id/date pair.');
  assert(service.getHistory().totalSolved === beforeInvalid, 'Rejected Daily completion must not mutate history.');
}


async function runReleaseStartStreakChecks(): Promise<void> {
  const storage = new MemoryProfileStorage();
  const profileService = await PlayerProfileService.create([], storage, { saveDelayMs: 60_000 });
  profileService.update((profile) => ({
    ...profile,
    daily: {
      ...profile.daily,
      currentStreak: 4,
      bestStreak: 4,
      lastSolvedDate: '2026-09-08',
      totalSolved: 1,
      solvedDates: ['2026-09-08'],
      results: {
        '2026-09-08': { bestTimeMs: 90_000, minHintsUsed: 0, solvedWithoutHints: true },
      },
    },
  }));
  await profileService.flush();
  const clock = new MutableTrustedClock();
  clock.value = new Date('2026-09-09T08:00:00.000Z');
  const service = DailyService.create(DAILY_RELEASE_ENTRIES, profileService, clock);
  const firstReleaseDay = await service.getToday();
  assert(firstReleaseDay?.entry?.id === 'daily-001', 'First release day must resolve daily-001.');
  assert(firstReleaseDay.currentStreak === 0, 'Release-day streak must not continue from an unscheduled pre-release date.');
}

async function runReleaseEndStreakChecks(): Promise<void> {
  const storage = new MemoryProfileStorage();
  const profileService = await PlayerProfileService.create([], storage, { saveDelayMs: 60_000 });
  const clock = new MutableTrustedClock();
  const service = DailyService.create(DAILY_RELEASE_ENTRIES, profileService, clock);

  clock.value = new Date('2026-11-07T20:00:00.000Z');
  const finalSolve = await service.completeToday({ bestTimeMs: 65_000, minHintsUsed: 0, solvedWithoutHints: true });
  assert(finalSolve?.dateKey === '2026-11-07' && finalSolve.currentStreak === 1, 'Final scheduled Daily can start a streak.');

  clock.value = new Date('2026-11-08T08:00:00.000Z');
  const afterCalendar = await service.getToday();
  assert(afterCalendar !== null && afterCalendar.entry === null, 'Day after the release calendar has no Daily entry.');
  assert(afterCalendar.currentStreak === 0, 'A streak must not be displayed as active when today has no scheduled Daily.');
}

async function runCalendarBoundaryChecks(): Promise<void> {
  const boundaryEntries: readonly DailyEntry[] = [
    { id: 'boundary-2099-01-31', dateKey: '2099-01-31', level: DAILY_RELEASE_ENTRIES[0].level },
    { id: 'boundary-2099-02-01', dateKey: '2099-02-01', level: DAILY_RELEASE_ENTRIES[1].level },
    { id: 'boundary-2099-12-31', dateKey: '2099-12-31', level: DAILY_RELEASE_ENTRIES[2].level },
    { id: 'boundary-2100-01-01', dateKey: '2100-01-01', level: DAILY_RELEASE_ENTRIES[3].level },
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

void Promise.all([
  runServiceChecks(),
  runCalendarBoundaryChecks(),
  runReleaseStartStreakChecks(),
  runReleaseEndStreakChecks(),
  runLaunchCompletionChecks(),
  runLaunchedDateCompletionChecks(),
])
  .then(() => {
    console.info('[Dungeon Logic] Daily sanity: trusted UTC selection + streak/history invariants passed');
  })
  .catch((error) => {
    throw error;
  });
