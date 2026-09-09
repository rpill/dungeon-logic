import { DAILY_RELEASE_DATE_KEYS } from '../content/daily/manifest';
import type { PlayerProfileV2 } from '../profile/types';
import { getStatsViewModel } from '../runtime/StatsSelectors';
import { calculateStatsLayout } from '../runtime/StatsLayout';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function campaignId(slot: number): string {
  return `campaign-${String(slot).padStart(3, '0')}`;
}

const completedLevelIds = Array.from({ length: 15 }, (_, index) => campaignId(index + 1));
const profile: PlayerProfileV2 = {
  schemaVersion: 2,
  tutorial: {
    completedLevelIds: ['tutorial-001', 'tutorial-002', 'tutorial-003', 'tutorial-004'],
    completed: true,
    activePuzzle: null,
  },
  campaign: {
    completedLevelIds,
    lastPlayedLevelId: 'campaign-016',
    levelResults: {
      'campaign-001': { bestTimeMs: 61_000, minHintsUsed: 0, solveCount: 1, solvedWithoutHints: true },
      'campaign-002': { bestTimeMs: 74_000, minHintsUsed: 1, solveCount: 1, solvedWithoutHints: false },
      'campaign-003': { bestTimeMs: 82_000, minHintsUsed: 0, solveCount: 2, solvedWithoutHints: true },
    },
    activePuzzle: null,
  },
  daily: {
    activePuzzle: null,
    currentStreak: 4,
    bestStreak: 7,
    lastSolvedDate: '2026-09-08',
    totalSolved: 10,
    solvedDates: ['2026-08-31', '2026-09-01', '2026-09-03', '2026-09-08'],
    results: {
      '2026-09-01': { bestTimeMs: 150_000, minHintsUsed: 0, solvedWithoutHints: true },
      '2026-09-03': { bestTimeMs: 170_000, minHintsUsed: 1, solvedWithoutHints: false },
      '2026-09-08': { bestTimeMs: 120_000, minHintsUsed: 0, solvedWithoutHints: true },
      '2026-08-31': { bestTimeMs: 190_000, minHintsUsed: 0, solvedWithoutHints: true },
      '2030-01-01': { bestTimeMs: 80_000, minHintsUsed: 0, solvedWithoutHints: true },
    },
  },
  settings: {
    musicEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    language: 'ru',
  },
  hints: {
    freeRemaining: 0,
    totalUsed: 6,
  },
  ads: {
    campaignCompletionsSinceOpportunity: 0,
    lastInterstitialAtMs: null,
  },
  totals: {
    activePlayMs: 3_661_000,
  },
};

const scheduledDates = ['2026-09-03', '2026-09-08', '2026-09-09', '2026-09-10'];
const stats = getStatsViewModel(profile, '2026-09-08', scheduledDates);
assert(stats.campaign.solved === 15 && stats.campaign.total === 30, 'Campaign stats expose solved / 30.');
assert(stats.campaign.completedManuscripts === 2 && stats.campaign.totalManuscripts === 4, 'Two fully solved manuscripts are counted from manuscript slots.');
assert(stats.campaign.solvedWithoutHints === 2, 'Campaign no-hint solves count solvedWithoutHints level results.');
assert(stats.daily.totalSolved === 10, 'Daily total comes from persisted Daily total.');
assert(stats.daily.currentStreak === 4 && stats.daily.bestStreak === 7, 'Active and best Daily streaks are projected.');
assert(stats.daily.solvedWithoutHints === 3, 'Daily no-hint total counts solved dates across all months and ignores orphan result summaries.');
assert(stats.overall.totalPuzzlesSolved === 25, 'Overall puzzles combine unique campaign completion and Daily totalSolved.');
assert(stats.overall.activePlayMs === 3_661_000 && stats.overall.totalHintsUsed === 6, 'Overall active time and hint usage come from profile totals.');

assert(stats.calendar !== null, 'Trusted date produces a current-month Daily calendar.');
assert(stats.calendar.year === 2026 && stats.calendar.month === 9, 'Calendar uses the trusted UTC year/month.');
assert(stats.calendar.leadingBlankCount === 1, 'September 2026 starts Tuesday, so Monday-first calendar has one leading blank.');
assert(stats.calendar.days.length === 30, 'September calendar contains all 30 dates.');
const day1 = stats.calendar.days[0];
const day2 = stats.calendar.days[1];
const day8 = stats.calendar.days[7];
const day9 = stats.calendar.days[8];
assert(day1.dateKey === '2026-09-01' && day1.state === 'unavailable', 'Dates outside the release schedule stay unavailable even if legacy history contains them.');
assert(day1.solved === false, 'Unscheduled dates must not render legacy Daily history as a solved release-calendar day.');
assert(day2.dateKey === '2026-09-02' && day2.state === 'unavailable', 'Unscheduled past dates are not falsely marked missed.');
const day3 = stats.calendar.days[2];
assert(day3.dateKey === '2026-09-03' && day3.state === 'solved', 'Solved scheduled past day is marked solved.');
assert(day8.dateKey === '2026-09-08' && day8.state === 'today' && day8.solved, 'Today remains explicitly today while retaining solved state.');
assert(day9.state === 'future', 'Future current-month dates stay neutral rather than missed.');

const releaseStartWithLegacyStreak = getStatsViewModel({
  ...profile,
  daily: {
    ...profile.daily,
    currentStreak: 4,
    lastSolvedDate: '2026-09-08',
  },
}, '2026-09-09', DAILY_RELEASE_DATE_KEYS);
assert(releaseStartWithLegacyStreak.daily.currentStreak === 0, 'Release-start Statistics must not continue a streak from an unscheduled pre-release date.');

const releaseScheduleStats = getStatsViewModel({
  ...profile,
  daily: {
    ...profile.daily,
    currentStreak: 1,
    lastSolvedDate: '2026-09-09',
    solvedDates: ['2026-09-09'],
    results: {
      '2026-09-09': { bestTimeMs: 140_000, minHintsUsed: 0, solvedWithoutHints: true },
    },
    totalSolved: 1,
  },
}, '2026-09-10', DAILY_RELEASE_DATE_KEYS);
assert(releaseScheduleStats.daily.currentStreak === 1, 'Real release schedule keeps a Sep 9 solve active on scheduled Sep 10.');
assert(releaseScheduleStats.calendar?.days[0].state === 'unavailable', 'Real release calendar keeps Sep 1 unavailable before the Sep 9 anchor.');
assert(releaseScheduleStats.calendar?.days[7].state === 'unavailable', 'Real release calendar keeps Sep 8 unavailable before the anchor.');
assert(releaseScheduleStats.calendar?.days[8].state === 'solved', 'Real release calendar marks Sep 9 as the first solved scheduled Daily.');
assert(releaseScheduleStats.calendar?.days[9].state === 'today', 'Real release calendar marks scheduled Sep 10 as today.');

const stale = getStatsViewModel({
  ...profile,
  daily: {
    ...profile.daily,
    currentStreak: 4,
    lastSolvedDate: '2026-09-08',
  },
}, '2026-09-10', scheduledDates);
assert(stale.daily.currentStreak === 0, 'Stored streak is projected as inactive after a full missed UTC day.');

const afterSeason = getStatsViewModel({
  ...profile,
  daily: {
    ...profile.daily,
    currentStreak: 5,
    lastSolvedDate: '2026-11-07',
  },
}, '2026-11-08', ['2026-11-07']);
assert(afterSeason.daily.currentStreak === 0, 'Statistics must not present a streak as active after the Daily schedule ends.');
assert(afterSeason.calendar?.days[7].state === 'unavailable', 'Today is unavailable after the Daily schedule ends.');

const untrusted = getStatsViewModel(profile, null, scheduledDates);
assert(untrusted.calendar === null, 'Without trusted date the calendar is unavailable instead of using local device time.');
assert(untrusted.daily.currentStreak === null, 'Without trusted date the UI does not claim that a stored streak is currently active.');

console.info('[Dungeon Logic] Stats sanity: campaign + Daily + overall projections + UTC monthly calendar passed');


const wideLayout = calculateStatsLayout(1280, 720);
assert(wideLayout.mode === 'columns', 'Wide Statistics layout uses three summary columns.');
assert(wideLayout.summaryCards.length === 3, 'Statistics layout always reserves Campaign, Daily, and Overall sections.');
assert(wideLayout.contentBottom <= 720, 'Reference wide viewport fits Statistics without vertical scrolling.');

const narrowLayout = calculateStatsLayout(390, 700);
assert(narrowLayout.mode === 'vertical', 'Narrow Statistics layout stacks summary sections vertically.');
assert(narrowLayout.summaryCards.every((card) => card.width <= 358), 'Narrow cards respect 16px side margins.');
assert(narrowLayout.calendar.cellSize >= 34, 'Narrow Daily calendar cells remain touch-readable.');
assert(narrowLayout.contentBottom > 700, 'Narrow Statistics may scroll instead of crushing the calendar.');

console.info('[Dungeon Logic] Stats layout sanity: wide columns + narrow vertical responsive geometry passed');
