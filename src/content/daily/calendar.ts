export const DAILY_RELEASE_COUNT = 7305 as const;
const UTC_DAY_MS = 24 * 60 * 60 * 1000;
const START_UTC_MS = Date.UTC(2026, 8, 9);

export const DAILY_RELEASE_DATE_KEYS: readonly string[] = Array.from(
  { length: DAILY_RELEASE_COUNT },
  (_, index) => new Date(START_UTC_MS + index * UTC_DAY_MS).toISOString().slice(0, 10),
);

export const DAILY_RELEASE_START_DATE_KEY = DAILY_RELEASE_DATE_KEYS[0];
export const DAILY_RELEASE_END_DATE_KEY = DAILY_RELEASE_DATE_KEYS[DAILY_RELEASE_DATE_KEYS.length - 1];

export function formatDailyId(index: number): string {
  if (!Number.isInteger(index) || index < 0 || index >= DAILY_RELEASE_COUNT) {
    throw new RangeError(`Daily index ${index} is out of range.`);
  }
  return `daily-${String(index + 1).padStart(4, '0')}`;
}
