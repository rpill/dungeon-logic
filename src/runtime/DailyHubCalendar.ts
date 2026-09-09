import type { DailyEntry } from '../content/daily/types';
import type { DailyArchiveEntry, DailyTodaySnapshot } from '../daily/DailyService';

export type DailyHubCalendarDayState =
  | 'unavailable'
  | 'archive-unsolved'
  | 'archive-solved'
  | 'today'
  | 'future';

export interface DailyHubCalendarDay {
  readonly day: number;
  readonly dateKey: string;
  readonly state: DailyHubCalendarDayState;
  readonly entry: DailyEntry | null;
}

export interface DailyHubCalendarMonth {
  readonly year: number;
  readonly month: number;
  readonly leadingEmptyDays: number;
  readonly days: readonly DailyHubCalendarDay[];
  readonly canGoPrevious: boolean;
  readonly canGoNext: boolean;
}

interface YearMonth {
  readonly year: number;
  readonly month: number;
}

function parseDateKey(dateKey: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateKey.split('-').map(Number);
  return { year, month, day };
}

function toDateKey(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function monthIndex(value: YearMonth): number {
  return value.year * 12 + value.month - 1;
}

function fromMonthIndex(index: number): YearMonth {
  return {
    year: Math.floor(index / 12),
    month: (index % 12) + 1,
  };
}

function clampMonth(value: YearMonth, first: YearMonth, last: YearMonth): YearMonth {
  const index = Math.min(Math.max(monthIndex(value), monthIndex(first)), monthIndex(last));
  return fromMonthIndex(index);
}

function getBounds(entries: readonly DailyEntry[], todayDateKey: string): { first: YearMonth; last: YearMonth } {
  const today = parseDateKey(todayDateKey);
  if (entries.length === 0) {
    const month = { year: today.year, month: today.month };
    return { first: month, last: month };
  }

  const firstEntry = parseDateKey(entries[0].dateKey);
  const lastEntry = parseDateKey(entries[entries.length - 1].dateKey);
  const first = { year: firstEntry.year, month: firstEntry.month };
  const finalRelease = { year: lastEntry.year, month: lastEntry.month };
  const current = { year: today.year, month: today.month };
  const last = monthIndex(current) < monthIndex(first)
    ? first
    : monthIndex(current) > monthIndex(finalRelease)
      ? finalRelease
      : current;
  return { first, last };
}

export function getInitialDailyHubCalendarMonth(
  entries: readonly DailyEntry[],
  todayDateKey: string,
): YearMonth {
  const today = parseDateKey(todayDateKey);
  const bounds = getBounds(entries, todayDateKey);
  return clampMonth({ year: today.year, month: today.month }, bounds.first, bounds.last);
}

export function shiftDailyHubCalendarMonth(
  entries: readonly DailyEntry[],
  todayDateKey: string,
  year: number,
  month: number,
  delta: -1 | 1,
): YearMonth {
  const bounds = getBounds(entries, todayDateKey);
  return clampMonth(fromMonthIndex(monthIndex({ year, month }) + delta), bounds.first, bounds.last);
}

export function createDailyHubCalendarMonth(
  entries: readonly DailyEntry[],
  archiveRows: readonly DailyArchiveEntry[],
  today: DailyTodaySnapshot,
  year: number,
  month: number,
): DailyHubCalendarMonth {
  const bounds = getBounds(entries, today.dateKey);
  const selected = clampMonth({ year, month }, bounds.first, bounds.last);
  const entryByDate = new Map(entries.map((entry) => [entry.dateKey, entry] as const));
  const archiveByDate = new Map(archiveRows.map((row) => [row.dateKey, row] as const));
  const daysInMonth = new Date(Date.UTC(selected.year, selected.month, 0)).getUTCDate();
  const firstWeekdaySundayZero = new Date(Date.UTC(selected.year, selected.month - 1, 1)).getUTCDay();
  const leadingEmptyDays = (firstWeekdaySundayZero + 6) % 7;

  const days = Array.from({ length: daysInMonth }, (_, index): DailyHubCalendarDay => {
    const day = index + 1;
    const dateKey = toDateKey(selected.year, selected.month, day);
    const entry = entryByDate.get(dateKey) ?? null;
    const archive = archiveByDate.get(dateKey);

    let state: DailyHubCalendarDayState = 'unavailable';
    if (dateKey === today.dateKey && entry !== null) {
      state = 'today';
    } else if (dateKey > today.dateKey) {
      state = entry === null ? 'unavailable' : 'future';
    } else if (entry !== null && archive !== undefined) {
      state = archive.solved ? 'archive-solved' : 'archive-unsolved';
    }

    return { day, dateKey, state, entry };
  });

  const selectedIndex = monthIndex(selected);
  return {
    year: selected.year,
    month: selected.month,
    leadingEmptyDays,
    days,
    canGoPrevious: selectedIndex > monthIndex(bounds.first),
    canGoNext: selectedIndex < monthIndex(bounds.last),
  };
}
