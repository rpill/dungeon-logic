import {
  DifficultyBand,
} from '../../puzzle/difficulty/types';
import type {
  RatedDifficultyBand,
} from './CatalogFormat';

export interface EndlessProgressionTarget {
  readonly targetScore: number;
  readonly allowedBands: readonly RatedDifficultyBand[];
  readonly recovery: boolean;
}

const EASY_ONLY = [
  DifficultyBand.Easy,
] as const;
const EASY_MEDIUM = [
  DifficultyBand.Easy,
  DifficultyBand.Medium,
] as const;
const MEDIUM_HARD = [
  DifficultyBand.Medium,
  DifficultyBand.Hard,
] as const;
const HARD_ONLY = [
  DifficultyBand.Hard,
] as const;
const HARD_EXPERT = [
  DifficultyBand.Hard,
  DifficultyBand.Expert,
] as const;
const EXPERT_ONLY = [
  DifficultyBand.Expert,
] as const;

// Integer lookup keeps catalog selection reproducible without depending on
// platform-specific floating-point trig details.
const LONG_RUN_WAVE = [
  0, 2, 3, 5, 6, 7, 8, 10, 11, 11, 12, 12,
  12, 12, 11, 11, 10, 8, 7, 6, 5, 3, 2, 0,
  0, -2, -3, -5, -6, -7, -8, -10, -11, -11, -12, -12,
  -12, -12, -11, -11, -10, -8, -7, -6, -5, -3, -2, 0,
] as const;

export function getEndlessProgressionTarget(
  ordinal: number,
): EndlessProgressionTarget {
  if (!Number.isInteger(ordinal) || ordinal <= 0) {
    throw new RangeError(
      'Endless ordinal must be a positive integer.',
    );
  }

  if (ordinal <= 20) {
    return {
      targetScore: interpolate(ordinal, 1, 20, 8, 24),
      allowedBands: EASY_ONLY,
      recovery: false,
    };
  }
  if (ordinal <= 60) {
    return {
      targetScore: interpolate(ordinal, 21, 60, 22, 42),
      allowedBands: EASY_MEDIUM,
      recovery: false,
    };
  }
  if (ordinal <= 150) {
    return {
      targetScore: interpolate(ordinal, 61, 150, 38, 58),
      allowedBands: MEDIUM_HARD,
      recovery: false,
    };
  }
  if (ordinal <= 300) {
    return {
      targetScore: interpolate(ordinal, 151, 300, 50, 72),
      allowedBands: MEDIUM_HARD,
      recovery: false,
    };
  }
  if (ordinal <= 500) {
    const expertPeak =
      ordinal === 450 || ordinal === 500;
    return {
      targetScore: expertPeak
        ? 82
        : interpolate(ordinal, 301, 500, 62, 82),
      allowedBands: expertPeak
        ? EXPERT_ONLY
        : HARD_EXPERT,
      recovery: false,
    };
  }

  const cycleIndex = (ordinal - 501) % LONG_RUN_WAVE.length;
  const recovery = cycleIndex % 12 === 11;
  const recoveryDip = recovery ? -12 : 0;
  const targetScore = clamp(
    68 + LONG_RUN_WAVE[cycleIndex] + recoveryDip,
    45,
    92,
  );

  const expertPeak =
    cycleIndex === 10 || cycleIndex === 14;

  return {
    targetScore: expertPeak
      ? Math.max(80, targetScore)
      : targetScore,
    allowedBands: expertPeak
      ? EXPERT_ONLY
      : targetScore < 60
        ? MEDIUM_HARD
        : targetScore < 75
          ? HARD_ONLY
          : HARD_EXPERT,
    recovery,
  };
}

function interpolate(
  value: number,
  start: number,
  end: number,
  min: number,
  max: number,
): number {
  if (start === end) return min;
  const ratio = (value - start) / (end - start);
  return Math.round(min + (max - min) * ratio);
}

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.max(min, Math.min(max, value));
}
