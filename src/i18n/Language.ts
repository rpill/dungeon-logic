export type SupportedLanguage = 'ru' | 'en';

export const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

export function resolveSupportedLanguage(
  rawLanguage: string | null | undefined,
): SupportedLanguage {
  if (typeof rawLanguage !== 'string') return FALLBACK_LANGUAGE;
  const normalized = rawLanguage.trim().toLowerCase();
  return normalized === 'ru' || normalized.startsWith('ru-') ? 'ru' : 'en';
}

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return value === 'ru' || value === 'en';
}
