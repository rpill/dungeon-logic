export interface DailyDifficultyBand {
  readonly min: number;
  readonly max: number;
}

/** UTC weekday index: Sunday=0 ... Saturday=6. */
export const DAILY_WEEKDAY_SCORE_BANDS: Readonly<Record<number, DailyDifficultyBand>> = {
  0: { min: 80, max: 95 },
  1: { min: 0, max: 15 },
  2: { min: 10, max: 30 },
  3: { min: 25, max: 45 },
  4: { min: 40, max: 60 },
  5: { min: 55, max: 75 },
  6: { min: 70, max: 90 },
};

export function getDailyDifficultyBandForDateKey(dateKey: string): DailyDifficultyBand {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime())) throw new Error(`Invalid Daily date key ${dateKey}.`);
  const band = DAILY_WEEKDAY_SCORE_BANDS[date.getUTCDay()];
  if (band === undefined) throw new Error(`Missing Daily weekday band for ${dateKey}.`);
  return band;
}

export function isDailyDifficultyAllowed(dateKey: string, score: number): boolean {
  const band = getDailyDifficultyBandForDateKey(dateKey);
  return Number.isFinite(score) && score >= band.min && score <= band.max;
}
