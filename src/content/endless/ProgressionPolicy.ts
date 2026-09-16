import { DifficultyBand } from '../../puzzle/difficulty/types';
import type { RatedDifficultyBand } from './CatalogFormat';
import type { GeneratorBoardSize } from '../../puzzle/generator/types';

export interface EndlessProgressionTarget {
  readonly targetScore: number;
  readonly allowedBands: readonly RatedDifficultyBand[];
  readonly allowedSizes: readonly GeneratorBoardSize[];
  readonly recovery: boolean;
}

const OPENING = [4, 5, 6, 7, 8, 11, 14, 17, 20, 24, 28, 32] as const;
const WAVE = [
  -18, -15, -11, -6, 0, 6, 12, 18, 23, 27, 24, 20, 15, 9,
  3, -3, -9, -14, -18, -21, -19, -15, -10, -5, 1, 7, 13, 18,
] as const;

const EASY_ONLY = [DifficultyBand.Easy] as const;
const EASY_MEDIUM = [DifficultyBand.Easy, DifficultyBand.Medium] as const;
const MEDIUM_ONLY = [DifficultyBand.Medium] as const;
const MEDIUM_HARD = [DifficultyBand.Medium, DifficultyBand.Hard] as const;
const HARD_ONLY = [DifficultyBand.Hard] as const;
const HARD_EXPERT = [DifficultyBand.Hard, DifficultyBand.Expert] as const;

export function getEndlessProgressionTarget(ordinal: number): EndlessProgressionTarget {
  if (!Number.isInteger(ordinal) || ordinal <= 0) {
    throw new RangeError('Endless ordinal must be a positive integer.');
  }

  if (ordinal <= OPENING.length) {
    const targetScore = OPENING[ordinal - 1];
    return targetForScore(targetScore, ordinal <= 5 ? [6] : [6, 7, 8], false);
  }

  const waveOrdinal = ordinal - OPENING.length - 1;
  const cycle = Math.floor(waveOrdinal / WAVE.length);
  const phase = waveOrdinal % WAVE.length;
  const cycleBias = (mix32(cycle + 17) % 9) - 4;
  const jitter = (mix32(ordinal * 31 + 7) % 7) - 3;
  const expertAccent = cycle % 4 === 3 && (phase === 9 || phase === 10) ? 8 : 0;
  const targetScore = clamp(50 + WAVE[phase] + cycleBias + jitter + expertAccent, 26, 88);
  const recovery = WAVE[phase] <= -15;
  return targetForScore(targetScore, targetScore >= 50 ? [7, 8] : [6, 7, 8], recovery);
}

function targetForScore(
  targetScore: number,
  allowedSizes: readonly GeneratorBoardSize[],
  recovery: boolean,
): EndlessProgressionTarget {
  const allowedBands: readonly RatedDifficultyBand[] =
    targetScore <= 20 ? EASY_ONLY
      : targetScore < 30 ? EASY_MEDIUM
        : targetScore <= 47 ? MEDIUM_ONLY
          : targetScore < 56 ? MEDIUM_HARD
            : targetScore <= 73 ? HARD_ONLY
              : HARD_EXPERT;
  return { targetScore, allowedBands, allowedSizes, recovery };
}

function mix32(value: number): number {
  let x = value >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Offline catalog curation keeps the verified pool broad and unique. Runtime
// Endless progression is intentionally separate so a finite asset can back an
// effectively endless, wave-shaped player experience.
const CATALOG_LONG_RUN_WAVE = [
  0, 2, 3, 5, 6, 7, 8, 10, 11, 11, 12, 12,
  12, 12, 11, 11, 10, 8, 7, 6, 5, 3, 2, 0,
  0, -2, -3, -5, -6, -7, -8, -10, -11, -11, -12, -12,
  -12, -12, -11, -11, -10, -8, -7, -6, -5, -3, -2, 0,
] as const;

export function getEndlessCatalogSelectionTarget(ordinal: number): EndlessProgressionTarget {
  if (!Number.isInteger(ordinal) || ordinal <= 0) {
    throw new RangeError('Endless ordinal must be a positive integer.');
  }
  if (ordinal <= 29) return { targetScore: interpolate(ordinal, 1, 29, 4, 8), allowedBands: EASY_ONLY, allowedSizes: [6], recovery: false };
  if (ordinal <= 60) return { targetScore: interpolate(ordinal, 30, 60, 14, 20), allowedBands: EASY_ONLY, allowedSizes: [8], recovery: false };
  if (ordinal <= 90) return { targetScore: interpolate(ordinal, 61, 90, 28, 32), allowedBands: [DifficultyBand.Medium], allowedSizes: [6, 7], recovery: false };
  if (ordinal <= 150) return { targetScore: interpolate(ordinal, 91, 150, 31, 44), allowedBands: [DifficultyBand.Medium], allowedSizes: [7, 8], recovery: false };
  if (ordinal <= 300) return { targetScore: interpolate(ordinal, 151, 300, 50, 72), allowedBands: [DifficultyBand.Hard], allowedSizes: [7, 8], recovery: false };
  if (ordinal <= 500) {
    const expertPeak = ordinal === 450 || ordinal === 500;
    return {
      targetScore: expertPeak ? 82 : interpolate(ordinal, 301, 500, 62, 82),
      allowedBands: expertPeak ? [DifficultyBand.Expert] : HARD_EXPERT,
      allowedSizes: [7, 8],
      recovery: false,
    };
  }
  const cycleIndex = (ordinal - 501) % CATALOG_LONG_RUN_WAVE.length;
  const recovery = cycleIndex % 12 === 11;
  const targetScore = clamp(68 + CATALOG_LONG_RUN_WAVE[cycleIndex] + (recovery ? -12 : 0), 45, 92);
  const expertPeak = cycleIndex === 10 || cycleIndex === 14;
  return {
    targetScore: expertPeak ? Math.max(80, targetScore) : targetScore,
    allowedBands: expertPeak
      ? [DifficultyBand.Expert]
      : targetScore < 60 ? MEDIUM_HARD : targetScore < 75 ? HARD_ONLY : HARD_EXPERT,
    allowedSizes: [7, 8],
    recovery,
  };
}

function interpolate(value: number, start: number, end: number, min: number, max: number): number {
  if (start === end) return min;
  const ratio = (value - start) / (end - start);
  return Math.round(min + (max - min) * ratio);
}
