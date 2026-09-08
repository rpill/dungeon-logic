import { CAMPAIGN_MANUSCRIPTS } from '../content/campaign/manuscripts';
import type { PlayerProfileV1 } from '../profile/types';
import { toUtcDateKey } from '../daily/DailySelector';

const CAMPAIGN_TOTAL = 30;
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const UTC_DAY_MS = 24 * 60 * 60 * 1000;

export type DailyCalendarDayState = 'solved' | 'missed' | 'today' | 'future' | 'unavailable';

export interface StatsCampaignView {
  readonly solved: number;
  readonly total: number;
  readonly completedManuscripts: number;
  readonly totalManuscripts: number;
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

export interface DailyCalendarDayView {
  readonly dateKey: string;
  readonly dayOfMonth: number;
  readonly state: DailyCalendarDayState;
  readonly solved: boolean;
}

export interface DailyMonthCalendarView {
  readonly year: number;
  readonly month: number;
  readonly leadingBlankCount: number;
  readonly days: readonly DailyCalendarDayView[];
}

export interface StatsViewModel {
  readonly campaign: StatsCampaignView;
  readonly daily: StatsDailyView;
  readonly overall: StatsOverallView;
  readonly calendar: DailyMonthCalendarView | null;
}

function campaignLevelId(slot: number): string {
  return `campaign-${String(slot).padStart(3, '0')}`;
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
  profile: PlayerProfileV1,
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

function getCompletedManuscriptCount(completedLevelIds: ReadonlySet<string>): number {
  return CAMPAIGN_MANUSCRIPTS.filter((manuscript) => (
    manuscript.slots.every((slot) => completedLevelIds.has(campaignLevelId(slot)))
  )).length;
}

function createDailyMonthCalendar(
  profile: PlayerProfileV1,
  todayDateKey: string,
  availableDailyDateKeys: readonly string[],
): DailyMonthCalendarView {
  const today = parseUtcDateKey(todayDateKey);
  if (today === null) throw new RangeError(`Invalid trusted UTC date key: ${todayDateKey}`);

  const year = today.getUTCFullYear();
  const monthIndex = today.getUTCMonth();
  const month = monthIndex + 1;
  const firstDay = new Date(Date.UTC(year, monthIndex, 1));
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const leadingBlankCount = (firstDay.getUTCDay() + 6) % 7;
  const solvedDates = new Set(profile.daily.solvedDates);
  const availableDates = new Set(availableDailyDateKeys);

  const days = Array.from({ length: daysInMonth }, (_, index): DailyCalendarDayView => {
    const dayOfMonth = index + 1;
    const dateKey = toUtcDateKey(new Date(Date.UTC(year, monthIndex, dayOfMonth)));
    const available = availableDates.has(dateKey);
    const solved = available && solvedDates.has(dateKey);
    let state: DailyCalendarDayState;

    if (!available) {
      state = 'unavailable';
    } else if (dateKey === todayDateKey) {
      state = 'today';
    } else if (dateKey > todayDateKey) {
      state = 'future';
    } else {
      state = solved ? 'solved' : 'missed';
    }

    return {
      dateKey,
      dayOfMonth,
      state,
      solved,
    };
  });

  return {
    year,
    month,
    leadingBlankCount,
    days,
  };
}

export function getStatsViewModel(
  profile: PlayerProfileV1,
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
      completedManuscripts: getCompletedManuscriptCount(completedLevelIds),
      totalManuscripts: CAMPAIGN_MANUSCRIPTS.length,
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
    calendar: todayDateKey === null
      ? null
      : createDailyMonthCalendar(profile, todayDateKey, availableDailyDateKeys),
  };
}
