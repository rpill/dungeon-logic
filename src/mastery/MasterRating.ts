import { DifficultyBand, type DifficultyBand as DifficultyBandValue } from '../puzzle/difficulty/types';
import type { SupportedLanguage } from '../i18n/Language';

export const MASTER_RATING_BASE = 1000 as const;
export const DAILY_MASTER_RATING_REWARD = 3 as const;

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
