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
import type { PlayerProfileV5 } from '../profile/types';
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

assert(DAILY_RELEASE_ENTRIES.length === 365, 'Daily release manifest must contain exactly 365 entries.');
for (let index = 0; index < expectedStart.length; index += 1) {
  const [dateKey, id] = expectedStart[index];
  const entry = DAILY_RELEASE_ENTRIES[index];
  assert(entry.dateKey === dateKey, `Release Daily ${index + 1} must use ${dateKey}.`);
  assert(entry.id === id, `Release Daily ${index + 1} must use ${id}.`);
  assert(entry.level.id === id, `Release Daily ${index + 1} must reuse curated ${id}.`);
}
assert(DAILY_RELEASE_ENTRIES[364].dateKey === '2027-09-08' && DAILY_RELEASE_ENTRIES[364].id === 'daily-365', 'Release calendar must end with daily-365 on 2027-09-08.');
assert(findDailyForDate(DAILY_RELEASE_ENTRIES, new Date('2026-09-08T23:59:59.999Z')) === null, 'Dates before the release calendar must return null.');
assert(findDailyForDate(DAILY_RELEASE_ENTRIES, new Date('2027-09-09T00:00:00.000Z')) === null, 'Dates after the release calendar must return null.');

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
assert(dailyLaunch.context.mode === 'daily' && dailyLaunch.context.archive === false, 'Default live Daily launch must not be marked as archive.');

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
  value: PlayerProfileV5 | null = null;

  async load(): Promise<unknown | null> {
    return this.value;
  }

  async save(profile: PlayerProfileV5): Promise<void> {
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
  const firstAttempt = await service.beginDaily('2026-09-09', 'daily-001');
  assert(firstAttempt?.ranked === true, 'Unsolved Daily must begin a ranked attempt.');
  assert(firstAttempt?.attempt === 'new', 'First Daily launch is new before its fresh draft is created.');
  assert(service.getHistory().drafts['2026-09-09']?.puzzleId === 'daily-001', 'Ranked Daily attempt must persist its per-date draft immediately.');
  assert(service.getHistory().drafts['2026-09-09']?.startedAtMs === Date.parse('2026-09-09T12:00:00.000Z'), 'Ranked Daily attempt must use trusted start time.');
  clock.value = new Date('2026-09-09T12:01:00.000Z');
  const resumedAttempt = await service.beginDaily('2026-09-09', 'daily-001');
  assert(resumedAttempt?.ranked === true, 'Leaving and reopening an unsolved Daily must resume the ranked attempt.');
  assert(resumedAttempt?.attempt === 'resume', 'Compatible unfinished Daily draft resumes.');
  assert(resumedAttempt.elapsedMsAtLaunch === 60_000, 'Resumed ranked Daily must include elapsed trusted time since the original start.');
  assert(service.getHistory().drafts['2026-09-09']?.startedAtMs === Date.parse('2026-09-09T12:00:00.000Z'), 'Resuming Daily must preserve the original ranked start timestamp.');
  clock.value = new Date('2026-09-09T12:02:00.000Z');
  const first = await service.completeToday();
  assert(first !== null, 'Daily completion must resolve when trusted time and a manifest entry exist.');
  assert(first.dateKey === '2026-09-09', 'Completion must be recorded for the trusted UTC date.');
  assert(first.dailyId === 'daily-001', 'Completion must retain the launched Daily id for leaderboard routing.');
  assert(first.wasFirstSolve === true, 'First completion of a date must be marked as the first solve.');
  assert(first.ranked === true && first.archive === false, 'On-time first completion must remain ranked and non-archive.');
  assert(first.currentStreak === 1 && first.bestStreak === 1, 'First Daily solve must start both streaks at one.');
  assert(first.totalSolved === 1, 'First Daily solve must increment total solved exactly once.');
  assert(first.persisted === true, 'Daily completion must flush the profile immediately.');
  assert(storage.value !== null, 'Daily completion flush must reach profile storage.');

  let history = service.getHistory();
  assert(history.lastSolvedDate === '2026-09-09', 'Daily history must track the last solved UTC date.');
  assert(history.solvedDates.length === 1 && history.solvedDates[0] === '2026-09-09', 'Daily history must add the solved UTC date.');
  assert(history.results['2026-09-09']?.bestTimeMs === 120_000, 'Daily history must store the result summary by UTC date.');
  assert(history.drafts['2026-09-09'] === undefined, 'Completing a Daily removes only that date draft.');

  clock.value = new Date('2026-09-10T08:00:00.000Z');
  const secondAttempt = await service.beginDaily('2026-09-10', 'daily-002');
  assert(secondAttempt?.ranked === true, 'Next unsolved Daily must begin a new ranked attempt.');
  clock.value = new Date('2026-09-10T08:01:50.000Z');
  const second = await service.completeToday();
  assert(second !== null, 'Second Daily completion must resolve.');
  assert(second.currentStreak === 2, 'Solving the next UTC day must extend the current streak.');
  assert(second.bestStreak === 2, 'Extending the streak must update the best streak.');
  assert(second.totalSolved === 2, 'Solving a second unique Daily must increment total solved.');

  history = service.getHistory();
  assert(history.lastSolvedDate === '2026-09-10', 'Daily history must advance last solved date on a consecutive solve.');

  clock.value = new Date('2026-09-12T10:00:00.000Z');
  const gapAttempt = await service.beginDaily('2026-09-12', 'daily-004');
  assert(gapAttempt?.ranked === true, 'Daily after a skipped date must still begin ranked.');
  clock.value = new Date('2026-09-12T10:01:40.000Z');
  const afterGap = await service.completeToday();
  assert(afterGap !== null, 'Daily completion after a skipped date must resolve.');
  assert(afterGap.currentStreak === 1, 'Skipping a UTC date must reset the current streak to one on the next solve.');
  assert(afterGap.bestStreak === 2, 'Resetting the current streak must preserve the best streak.');
  assert(afterGap.totalSolved === 3, 'A new date after a gap must still increment total solved.');

  const fixedFirstTime = afterGap.result.bestTimeMs;
  clock.value = new Date('2026-09-12T10:03:00.000Z');
  const repeat = await service.completeToday();
  assert(repeat !== null, 'Repeating an already solved Daily must resolve idempotently.');
  assert(repeat.wasFirstSolve === false, 'Repeating the same UTC date must not be treated as a first solve.');
  assert(repeat.currentStreak === 1, 'Repeating the same UTC date must not increase the current streak.');
  assert(repeat.bestStreak === 2, 'Repeating the same UTC date must not change the best streak.');
  assert(repeat.totalSolved === 3, 'Repeating the same UTC date must not increase total solved.');
  assert(repeat.result.bestTimeMs === fixedFirstTime, 'Daily result must remain the first successful time forever.');
  assert(repeat.result.minHintsUsed === 0 && repeat.result.solvedWithoutHints, 'Ranked Daily result must be hint-free.');

  const practice = await service.beginDaily('2026-09-12', 'daily-004');
  assert(practice?.ranked === false, 'Solved Daily must relaunch only as practice outside the ranking.');
  assert(practice?.attempt === 'replay', 'Solved Daily launches as replay practice.');
  assert(practice?.archive === false, 'Solved current Daily practice is not an archive launch.');
  assert(service.getHistory().drafts['2026-09-12'] === undefined, 'Solved Daily practice must not recreate a saved Daily draft.');

  history = service.getHistory();
  assert(history.solvedDates.length === 3, 'Daily solved-date history must contain unique UTC dates only.');
  assert(history.results['2026-09-12']?.bestTimeMs === fixedFirstTime, 'History must preserve the immutable first Daily time.');
  assert(history.results['2026-09-12']?.minHintsUsed === 0, 'Ranked history must stay hint-free.');
  assert(history.results['2026-09-12']?.solvedWithoutHints === true, 'Ranked history must mark no-hint completion.');

  clock.value = new Date('2026-09-13T09:00:00.000Z');
  const nextDay = await service.getToday();
  assert(nextDay !== null && nextDay.currentStreak === 1, 'Current streak must remain active through the day after the last solve.');

  clock.value = new Date('2027-09-09T09:00:00.000Z');
  const expired = await service.getToday();
  assert(expired !== null, 'Trusted date outside the release calendar must still expose Daily status.');
  assert(expired.entry === null, 'A trusted date outside the release calendar must expose no Daily entry.');
  assert(expired.currentStreak === 0, 'Displayed current streak must expire after a full missed UTC day.');
  assert(service.getHistory().currentStreak === 1, 'Stored streak history must remain intact after display streak expires.');

  const unavailableBefore = service.getHistory().totalSolved;
  clock.value = null;
  assert(await service.completeToday() === null, 'Completion must be unavailable without trusted time.');
  assert(service.getHistory().totalSolved === unavailableBefore, 'Unavailable trusted time must not mutate Daily history.');
}

async function runLaunchCompletionChecks(): Promise<void> {
  const dailyData = createDailyGameSceneData(DAILY_RELEASE_ENTRIES[0]);
  assert(dailyData.context.mode === 'daily', 'Daily launch context must remain narrowed for completion checks.');
  const completion = {
    dailyId: 'daily-001',
    dateKey: '2026-09-09',
    wasFirstSolve: true,
    ranked: true,
    archive: false,
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
  const port = {
    completeDaily: async (
      dateKey: string,
      dailyId: string,
    ) => {
      calls += 1;
      forwardedDateKey = dateKey;
      forwardedDailyId = dailyId;
      return completion;
    },
  };

  const resolved = await completeDailyGameLaunch(dailyData, port);
  assert(resolved === completion, 'Daily GameScene completion must return the DailyService result unchanged.');
  assert(calls === 1, 'Daily GameScene completion must forward completion exactly once.');
  assert(
    forwardedDateKey === dailyData.context.dateKey && forwardedDailyId === dailyData.context.dailyId,
    'Daily GameScene completion must credit the exact launched Daily id/date even across UTC midnight.',
  );

  const devResolved = await completeDailyGameLaunch(
    createDevGameSceneData(DAILY_RELEASE_ENTRIES[0].level),
    port,
  );
  assert(devResolved === null, 'Dev completion must not use DailyService.');
  assert(calls === 1, 'Dev completion must not call the Daily completion port.');
}

async function runLaunchedDateCompletionChecks(): Promise<void> {
  const storage = new MemoryProfileStorage();
  const profileService = await PlayerProfileService.create([], storage, { saveDelayMs: 60_000 });
  const clock = new MutableTrustedClock();
  const service = DailyService.create(DAILY_RELEASE_ENTRIES, profileService, clock);

  clock.value = new Date('2026-09-09T23:55:00.000Z');
  const launched = await service.beginDaily('2026-09-09', 'daily-001');
  assert(launched?.ranked === true, 'Cross-midnight Daily must begin ranked on its launched date.');
  clock.value = new Date('2026-09-10T00:05:00.000Z');
  const completed = await service.completeDaily(
    '2026-09-09',
    'daily-001',
  );
  assert(completed?.dateKey === '2026-09-09', 'A Daily opened before UTC midnight must credit its launched date after midnight.');
  assert(completed?.ranked === false && completed.archive === true, 'A Daily finished after its UTC date ends must be preserved outside the ranking.');
  assert(completed?.currentStreak === 0, 'Cross-midnight late completion must not create or extend a streak.');
  assert(service.getHistory().solvedDates.includes('2026-09-09'), 'Cross-midnight completion must store the launched date in history.');
  assert(!service.getHistory().solvedDates.includes('2026-09-10'), 'Cross-midnight completion must not credit the new UTC day with the old board.');

  const beforeInvalid = service.getHistory().totalSolved;
  const invalid = await service.completeDaily(
    '2026-09-09',
    'daily-002',
  );
  assert(invalid === null, 'Daily completion must reject a mismatched launched id/date pair.');
  assert(service.getHistory().totalSolved === beforeInvalid, 'Rejected Daily completion must not mutate history.');
}



async function runArchiveChecks(): Promise<void> {
  const storage = new MemoryProfileStorage();
  const profileService = await PlayerProfileService.create([], storage, { saveDelayMs: 60_000 });
  const clock = new MutableTrustedClock();
  clock.value = new Date('2026-09-12T12:00:00.000Z');
  const service = DailyService.create(DAILY_RELEASE_ENTRIES, profileService, clock);

  const archive = await service.getArchive();
  assert(archive.length === 3, 'Archive must expose every released Daily strictly before trusted today.');
  assert(archive[0].entry.id === 'daily-003' && archive[2].entry.id === 'daily-001', 'Archive must list past Daily entries newest first.');
  assert(archive.every((item) => item.archive && !item.ranked), 'Archive view models must be explicitly unranked archive entries.');
  assert(archive.every((item) => item.result === null), 'Fresh archive entries must initially be unsolved.');

  const archiveDraftAttempt = await service.beginDaily('2026-09-11', 'daily-003');
  assert(archiveDraftAttempt?.archive === true && archiveDraftAttempt.ranked === false, 'Past unsolved Daily launches as archive practice.');
  assert(service.getHistory().drafts['2026-09-11']?.puzzleId === 'daily-003', 'Past unsolved Daily persists its own per-date draft.');

  const pastAttempt = await service.beginDaily('2026-09-10', 'daily-002');
  assert(pastAttempt?.ranked === false && pastAttempt.archive === true, 'A released past Daily must launch as unranked archive play.');
  assert(service.getHistory().drafts['2026-09-11']?.puzzleId === 'daily-003', 'Opening another archive Daily must preserve the earlier date draft.');
  assert(service.getHistory().drafts['2026-09-10']?.puzzleId === 'daily-002', 'Archive play must persist the newly opened date draft.');

  clock.value = new Date('2026-09-12T12:02:00.000Z');
  const pastCompletion = await service.completeDaily('2026-09-10', 'daily-002', 95_000);
  assert(pastCompletion !== null && pastCompletion.wasFirstSolve, 'First archive completion must be persisted.');
  assert(pastCompletion.ranked === false && pastCompletion.archive === true, 'Archive completion must remain outside ranking.');
  assert(pastCompletion.result.bestTimeMs === 95_000, 'Archive completion must preserve its first local active-play time.');
  assert(pastCompletion.totalSolved === 1, 'Archive completion must contribute to total Daily completion count.');
  assert(pastCompletion.currentStreak === 0 && pastCompletion.bestStreak === 0, 'Archive completion must not mutate streaks.');
  assert(service.getHistory().lastSolvedDate === null, 'Archive completion must not become the last on-time solved date.');
  assert(service.getHistory().drafts['2026-09-10'] === undefined, 'Completing an archive Daily removes its own draft.');
  assert(service.getHistory().drafts['2026-09-11']?.puzzleId === 'daily-003', 'Completing one archive Daily preserves other unfinished Daily drafts.');

  const replay = await service.beginDaily('2026-09-10', 'daily-002');
  assert(replay?.ranked === false && replay.archive === true, 'Solved archive Daily may replay only outside ranking.');
  const replayCompletion = await service.completeDaily('2026-09-10', 'daily-002', 10_000);
  assert(replayCompletion?.wasFirstSolve === false, 'Archive replay must not replace the first completion.');
  assert(replayCompletion?.result.bestTimeMs === 95_000, 'Archive replay must preserve the immutable first time.');

  const futureAttempt = await service.beginDaily('2026-09-13', 'daily-005');
  assert(futureAttempt === null, 'Future Daily entries must never be launchable before their trusted UTC date.');

  const todayAttempt = await service.beginDaily('2026-09-12', 'daily-004');
  assert(todayAttempt?.ranked === true && todayAttempt.archive === false, 'Trusted-today Daily must still launch ranked after archive play.');
  clock.value = new Date('2026-09-12T12:04:00.000Z');
  const todayCompletion = await service.completeDaily('2026-09-12', 'daily-004');
  assert(todayCompletion?.ranked === true, 'Trusted-today completion must still be ranked.');
  assert(todayCompletion?.currentStreak === 1, 'On-time Daily completion must start the streak even after archive completions.');
  assert(todayCompletion?.totalSolved === 2, 'Total solved must count both archive and current Daily first completions.');
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

  clock.value = new Date('2027-09-08T20:00:00.000Z');
  await service.beginDaily('2027-09-08', 'daily-365');
  clock.value = new Date('2027-09-08T20:01:05.000Z');
  const finalSolve = await service.completeToday();
  assert(finalSolve?.dateKey === '2027-09-08' && finalSolve.currentStreak === 1, 'Final scheduled Daily can start a streak.');

  clock.value = new Date('2027-09-09T08:00:00.000Z');
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
  monthClock.value = new Date('2099-01-31T23:58:00.000Z');
  await monthService.beginDaily('2099-01-31', 'boundary-2099-01-31');
  monthClock.value = new Date('2099-01-31T23:59:00.000Z');
  await monthService.completeToday();
  monthClock.value = new Date('2099-02-01T00:00:00.000Z');
  await monthService.beginDaily('2099-02-01', 'boundary-2099-02-01');
  monthClock.value = new Date('2099-02-01T00:01:00.000Z');
  const monthNext = await monthService.completeToday();
  assert(monthNext?.currentStreak === 2, 'Daily streak must continue across a UTC month boundary.');

  const yearStorage = new MemoryProfileStorage();
  const yearProfile = await PlayerProfileService.create([], yearStorage, { saveDelayMs: 60_000 });
  const yearClock = new MutableTrustedClock();
  const yearService = DailyService.create(boundaryEntries, yearProfile, yearClock);
  yearClock.value = new Date('2099-12-31T23:58:00.000Z');
  await yearService.beginDaily('2099-12-31', 'boundary-2099-12-31');
  yearClock.value = new Date('2099-12-31T23:59:00.000Z');
  await yearService.completeToday();
  yearClock.value = new Date('2100-01-01T00:00:00.000Z');
  await yearService.beginDaily('2100-01-01', 'boundary-2100-01-01');
  yearClock.value = new Date('2100-01-01T00:01:00.000Z');
  const yearNext = await yearService.completeToday();
  assert(yearNext?.currentStreak === 2, 'Daily streak must continue across a UTC year boundary.');
}


async function runAssistedRankedDailyChecks(): Promise<void> {
  const storage = new MemoryProfileStorage();
  const profileService = await PlayerProfileService.create([], storage, { saveDelayMs: 60_000 });
  const clock = new MutableTrustedClock();
  const service = DailyService.create(DAILY_RELEASE_ENTRIES, profileService, clock);

  clock.value = new Date('2026-09-12T12:00:00.000Z');
  const attempt = await service.beginDaily('2026-09-12', 'daily-004');
  assert(attempt?.ranked === true, 'Today starts leaderboard-eligible before a hint is used.');

  clock.value = new Date('2026-09-12T12:06:00.000Z');
  const assisted = await service.completeDaily('2026-09-12', 'daily-004', undefined, 1);
  assert(assisted !== null && assisted.wasFirstSolve, 'Assisted on-time Daily still records the first solve.');
  assert(assisted.archive === false, 'Assisted on-time Daily is not mislabeled as archive play.');
  assert(assisted.ranked === false, 'Using a hint removes leaderboard eligibility.');
  assert(assisted.result.minHintsUsed === 1, 'Assisted Daily history preserves actual hint usage.');
  assert(!assisted.result.solvedWithoutHints, 'Assisted Daily is not marked as hint-free.');
  assert(assisted.currentStreak === 1 && assisted.bestStreak === 1, 'Assisted on-time Daily still counts toward the daily streak.');
  assert(assisted.totalSolved === 1, 'Assisted on-time Daily still counts as completed content.');
}

void Promise.all([
  runServiceChecks(),
  runCalendarBoundaryChecks(),
  runReleaseStartStreakChecks(),
  runReleaseEndStreakChecks(),
  runLaunchCompletionChecks(),
  runLaunchedDateCompletionChecks(),
  runArchiveChecks(),
  runAssistedRankedDailyChecks(),
])
  .then(() => {
    console.info('[Dungeon Logic] Daily sanity: trusted UTC selection + streak/history invariants passed');
  })
  .catch((error) => {
    throw error;
  });
