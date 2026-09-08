import type { DailyEntry } from '../content/daily/types';

export function toUtcDateKey(date: Date): string {
  if (!Number.isFinite(date.getTime())) {
    throw new Error('Cannot create a Daily date key from an invalid Date.');
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function findDailyForDate(
  entries: readonly DailyEntry[],
  date: Date,
): DailyEntry | null {
  const dateKey = toUtcDateKey(date);
  return entries.find((entry) => entry.dateKey === dateKey) ?? null;
}
