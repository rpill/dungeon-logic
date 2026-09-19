import { DifficultyBand, type DifficultyBand as DifficultyBandValue } from '../puzzle/difficulty/types';
import type { SupportedLanguage } from '../i18n/Language';

export const MASTER_RATING_BASE = 1000 as const;
export const DAILY_MASTER_RATING_REWARD = 3 as const;

export const MASTER_RATING_MILESTONE_STEP = 100 as const;

export function getMasterRatingMilestone(beforeRating: number, afterRating: number): number | null {
  const before = Math.max(0, Math.floor(Number.isFinite(beforeRating) ? beforeRating : 0));
  const after = Math.max(0, Math.floor(Number.isFinite(afterRating) ? afterRating : 0));
  if (after <= before) return null;
  const beforeMilestone = Math.floor(before / MASTER_RATING_MILESTONE_STEP);
  const afterMilestone = Math.floor(after / MASTER_RATING_MILESTONE_STEP);
  if (afterMilestone <= beforeMilestone) return null;
  return afterMilestone * MASTER_RATING_MILESTONE_STEP;
}

export function getEndlessMasterRatingReward(band: DifficultyBandValue): number {
  switch (band) {
    case DifficultyBand.Easy: return 2;
    case DifficultyBand.Medium: return 3;
    case DifficultyBand.Hard: return 5;
    case DifficultyBand.Expert: return 8;
    case DifficultyBand.Unrated: return 0;
  }
}

export function formatMasterRating(rating: number, language: SupportedLanguage): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(rating) ? rating : 0));
  const separator = language === 'ru' ? ' ' : ',';
  return String(safe).replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}
