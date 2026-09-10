import type { PlayerProfileV4 } from '../profile/types';
import { toUtcDateKey } from '../daily/DailySelector';

const CAMPAIGN_TOTAL = 64;
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const UTC_DAY_MS = 24 * 60 * 60 * 1000;

export interface StatsCampaignView {
  readonly solved: number;
  readonly total: number;
  readonly solvedWithoutHints: number;
}

export interface StatsDailyView {
  readonly totalSolved: number;
  readonly currentStreak: number | null;
  readonly bestStreak: number;
  readonly solvedWithoutHints: number;
}

export interface StatsOverallView {
  readonly activePlayMs: number;
  readonly totalPuzzlesSolved: number;
  readonly totalHintsUsed: number;
}

export interface StatsViewModel {
  readonly campaign: StatsCampaignView;
  readonly daily: StatsDailyView;
  readonly overall: StatsOverallView;
}

function parseUtcDateKey(dateKey: string): Date | null {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (match === null) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return toUtcDateKey(date) === dateKey ? date : null;
}

function previousUtcDateKey(dateKey: string): string | null {
  const date = parseUtcDateKey(dateKey);
  if (date === null) return null;
  return toUtcDateKey(new Date(date.getTime() - UTC_DAY_MS));
}

function getActiveDailyStreak(
  profile: PlayerProfileV4,
  todayDateKey: string | null,
  availableDailyDateKeys: readonly string[],
): number | null {
  if (todayDateKey === null) return null;
  const today = parseUtcDateKey(todayDateKey);
  if (today === null) throw new RangeError(`Invalid trusted UTC date key: ${todayDateKey}`);
  const availableDates = new Set(availableDailyDateKeys);
  if (!availableDates.has(todayDateKey)) return 0;

  const lastSolved = profile.daily.lastSolvedDate;
  const previousDateKey = previousUtcDateKey(todayDateKey);
  if (
    lastSolved === todayDateKey
    || (previousDateKey !== null && availableDates.has(previousDateKey) && lastSolved === previousDateKey)
  ) {
    return profile.daily.currentStreak;
  }
  return 0;
}

export function getStatsViewModel(
  profile: PlayerProfileV4,
  todayDateKey: string | null,
  availableDailyDateKeys: readonly string[],
): StatsViewModel {
  const completedLevelIds = new Set(profile.campaign.completedLevelIds);
  const campaignNoHint = Object.entries(profile.campaign.levelResults)
    .filter(([levelId, result]) => completedLevelIds.has(levelId) && result.solvedWithoutHints)
    .length;
  const dailyNoHint = profile.daily.solvedDates
    .filter((dateKey) => profile.daily.results[dateKey]?.solvedWithoutHints === true)
    .length;

  return {
    campaign: {
      solved: completedLevelIds.size,
      total: CAMPAIGN_TOTAL,
      solvedWithoutHints: campaignNoHint,
    },
    daily: {
      totalSolved: profile.daily.totalSolved,
      currentStreak: getActiveDailyStreak(profile, todayDateKey, availableDailyDateKeys),
      bestStreak: profile.daily.bestStreak,
      solvedWithoutHints: dailyNoHint,
    },
    overall: {
      activePlayMs: profile.totals.activePlayMs,
      totalPuzzlesSolved: completedLevelIds.size + profile.daily.totalSolved,
      totalHintsUsed: profile.hints.totalUsed,
    },
  };
}
