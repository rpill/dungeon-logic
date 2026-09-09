const DAILY_RELEASE_COUNT = 365;
const UTC_DAY_MS = 24 * 60 * 60 * 1000;
const START_UTC_MS = Date.UTC(2026, 8, 9);

export const DAILY_RELEASE_DATE_KEYS: readonly string[] = Array.from(
  { length: DAILY_RELEASE_COUNT },
  (_, index) => new Date(START_UTC_MS + index * UTC_DAY_MS).toISOString().slice(0, 10),
);

export const DAILY_RELEASE_START_DATE_KEY = DAILY_RELEASE_DATE_KEYS[0];
export const DAILY_RELEASE_END_DATE_KEY = DAILY_RELEASE_DATE_KEYS[DAILY_RELEASE_DATE_KEYS.length - 1];
