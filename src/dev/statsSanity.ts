import { DAILY_RELEASE_DATE_KEYS } from '../content/daily/calendar';
import type { PlayerProfile } from '../profile/types';
import { calculateStatsLayout } from '../runtime/StatsLayout';
import { getStatsViewModel } from '../runtime/StatsSelectors';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function campaignId(slot: number): string {
  return `campaign-${String(slot).padStart(3, '0')}`;
}

const completedLevelIds = Array.from({ length: 15 }, (_, index) => campaignId(index + 1));
const profile: PlayerProfile = {
  schemaVersion: 1,
  tutorial: {
    completedLevelIds: ['tutorial-001', 'tutorial-002', 'tutorial-003', 'tutorial-004', 'tutorial-005'],
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
    drafts: {},
  },
  daily: {
    drafts: {},
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
  endless: { nextFreshIndex: 0, completed: 0, skipped: [], freshSolvesSinceRetry: 0, activeCatalogIndex: null, activeKind: null, activePuzzle: null, currentStreak: 0, bestStreak: 0, freePlayOrdinal: 0 },
  mastery: { rating: 1000 },
  settings: {
    musicEnabled: true,
    soundEnabled: true,
    language: 'ru',
  },
  hints: {
    freeRemaining: 0,
    totalUsed: 6,
  },
  totals: {
    activePlayMs: 3_661_000,
  },
};

const scheduledDates = ['2026-09-03', '2026-09-08', '2026-09-09', '2026-09-10'];
const stats = getStatsViewModel(profile, '2026-09-08', scheduledDates);
assert(stats.campaign.solved === 15 && stats.campaign.total === 64, 'Campaign stats expose solved / 64.');
assert(stats.campaign.solvedWithoutHints === 2, 'Campaign no-hint solves count completed level results.');
assert(stats.daily.totalSolved === 10, 'Daily total comes from persisted Daily total.');
assert(stats.daily.currentStreak === 4 && stats.daily.bestStreak === 7, 'Active and best Daily streaks are projected.');
assert(stats.daily.solvedWithoutHints === 3, 'Daily no-hint total counts solved dates and ignores orphan summaries.');
assert(stats.overall.totalPuzzlesSolved === 25, 'Overall puzzles combine Campaign completion and Daily totalSolved.');
assert(stats.overall.activePlayMs === 3_661_000 && stats.overall.totalHintsUsed === 6, 'Overall active time and hints come from profile totals.');
assert(!('calendar' in stats), 'Statistics view model must not duplicate Daily calendar data.');

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

const untrusted = getStatsViewModel(profile, null, scheduledDates);
assert(untrusted.daily.currentStreak === null, 'Without trusted date the UI does not claim that a stored streak is currently active.');

console.info('[Dungeon Logic] Stats sanity: Campaign + Daily + overall projections without duplicate calendar passed');

const wideLayout = calculateStatsLayout(1280, 720);
assert(wideLayout.mode === 'vertical', 'Wide Statistics layout uses a single centered column of wider summary cards.');
assert(wideLayout.summaryCards.length === 3, 'Statistics layout always reserves Campaign, Daily, and Overall sections.');
assert(wideLayout.contentBottom <= 720, 'Reference wide viewport fits Statistics without vertical scrolling.');

const landscapePhone = calculateStatsLayout(844, 390);
assert(landscapePhone.mode === 'columns', 'Landscape phone keeps three compact columns to avoid vertical overflow.');
assert(landscapePhone.contentBottom <= 390, 'Reference landscape phone fits simplified Statistics without scrolling.');

const narrowLayout = calculateStatsLayout(390, 700);
assert(narrowLayout.mode === 'vertical', 'Portrait narrow Statistics stacks the three summary sections vertically.');
assert(narrowLayout.summaryCards.every((card) => card.width <= 358), 'Narrow cards respect 16px side margins.');
assert(narrowLayout.contentBottom <= 700, 'Reference portrait phone fits simplified Statistics without calendar scroll.');

console.info('[Dungeon Logic] Stats layout sanity: wide single-column desktop + compact landscape + portrait geometry passed');
