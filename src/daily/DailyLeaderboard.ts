import type { DailyEntry } from '../content/daily/types';

const DAILY_ID_PATTERN = /^daily-(\d{3,})$/;
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const UTC_DAY_MS = 24 * 60 * 60 * 1000;
const SCORE_DAY_SPAN = 100_000_000;
const SCORE_MAX_TIME_MS = SCORE_DAY_SPAN - 1;

export const DAILY_LEADERBOARD_NAME = 'daily';

function parseUtcDateKey(dateKey: string): number | null {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (match === null) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcMs = Date.UTC(year, month - 1, day);
  const date = new Date(utcMs);
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() + 1 !== month
    || date.getUTCDate() !== day
  ) return null;
  return utcMs;
}

function toDateKeyFromUtcDay(utcDay: number): string | null {
  if (!Number.isInteger(utcDay) || utcDay < 0) return null;
  const utcMs = utcDay * UTC_DAY_MS;
  if (!Number.isSafeInteger(utcMs)) return null;
  const date = new Date(utcMs);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDailyLeaderboardName(dailyId: string): string {
  if (!DAILY_ID_PATTERN.test(dailyId)) {
    throw new Error(`Unsupported Daily id for leaderboard: ${dailyId}.`);
  }
  return DAILY_LEADERBOARD_NAME;
}

export function getDailyLeaderboardNameForEntry(entry: DailyEntry): string {
  return getDailyLeaderboardName(entry.id);
}

export function encodeDailyLeaderboardScore(dateKey: string, timeMs: number): number {
  const utcMs = parseUtcDateKey(dateKey);
  if (utcMs === null) {
    throw new Error(`Unsupported Daily date key for leaderboard: ${dateKey}.`);
  }
  if (!Number.isFinite(timeMs) || timeMs < 0) {
    throw new Error(`Unsupported Daily completion time for leaderboard: ${timeMs}.`);
  }

  const utcDay = Math.floor(utcMs / UTC_DAY_MS);
  const boundedTimeMs = Math.min(SCORE_MAX_TIME_MS, Math.floor(timeMs));
  const score = utcDay * SCORE_DAY_SPAN + (SCORE_MAX_TIME_MS - boundedTimeMs);
  if (!Number.isSafeInteger(score) || score < 0) {
    throw new Error(`Daily leaderboard score is outside the JavaScript safe-integer range: ${score}.`);
  }
  return score;
}

export function decodeDailyLeaderboardScore(
  score: number,
): { readonly dateKey: string; readonly timeMs: number } | null {
  if (!Number.isSafeInteger(score) || score < 0) return null;
  const utcDay = Math.floor(score / SCORE_DAY_SPAN);
  const remainder = score - utcDay * SCORE_DAY_SPAN;
  if (!Number.isInteger(remainder) || remainder < 0 || remainder > SCORE_MAX_TIME_MS) return null;
  const dateKey = toDateKeyFromUtcDay(utcDay);
  if (dateKey === null) return null;
  return {
    dateKey,
    timeMs: SCORE_MAX_TIME_MS - remainder,
  };
}
