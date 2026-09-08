import type { PlayerProfileV1 } from '../profile/types';
import { getStatsViewModel } from '../runtime/StatsSelectors';
import { calculateStatsLayout } from '../runtime/StatsLayout';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function campaignId(slot: number): string {
  return `campaign-${String(slot).padStart(3, '0')}`;
}

const completedLevelIds = Array.from({ length: 15 }, (_, index) => campaignId(index + 1));
const profile: PlayerProfileV1 = {
  schemaVersion: 1,
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

const stats = getStatsViewModel(profile, '2026-09-08');
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
assert(day1.dateKey === '2026-09-01' && day1.state === 'solved', 'Solved past day is marked solved.');
assert(day2.dateKey === '2026-09-02' && day2.state === 'missed', 'Unsolved past day is marked missed.');
assert(day8.dateKey === '2026-09-08' && day8.state === 'today' && day8.solved, 'Today remains explicitly today while retaining solved state.');
assert(day9.state === 'future', 'Future current-month dates stay neutral rather than missed.');

const stale = getStatsViewModel({
  ...profile,
  daily: {
    ...profile.daily,
    currentStreak: 4,
    lastSolvedDate: '2026-09-08',
  },
}, '2026-09-10');
assert(stale.daily.currentStreak === 0, 'Stored streak is projected as inactive after a full missed UTC day.');

const untrusted = getStatsViewModel(profile, null);
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
