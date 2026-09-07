import {
  DifficultyBand,
  DifficultyTarget,
  type DifficultyBand as DifficultyBandType,
  type DifficultyTarget as DifficultyTargetType,
} from '../difficulty/types';

import type {
  GeneratorArchetype as GeneratorArchetypeType,
} from './types';

export type TargetedDifficultyTarget =
  Exclude<
    DifficultyTargetType,
    typeof DifficultyTarget.Any
  >;

export type TargetedArchetypeQuotaMap =
  Readonly<
    Record<
      GeneratorArchetypeType,
      number
    >
  >;

export const TARGETED_POOL_SIZE = 50;
export const TARGETED_SHORTLIST_SIZE = 15;
export const TARGETED_SHORTLIST_SOFT_CAP = 9;
export const TARGETED_RESERVOIR_MULTIPLIER = 2;

export const TARGETED_ARCHETYPE_QUOTAS:
  Readonly<
    Record<
      TargetedDifficultyTarget,
      TargetedArchetypeQuotaMap
    >
  > = {
    easy: {
      'monster-only': 18,
      'mixed-one-room': 16,
      'mixed-two-rooms': 10,
      'chest-two-rooms': 4,
      'chest-one-room': 2,
    },
    medium: {
      'monster-only': 10,
      'mixed-one-room': 10,
      'mixed-two-rooms': 16,
      'chest-two-rooms': 8,
      'chest-one-room': 6,
    },
    hard: {
      'monster-only': 4,
      'mixed-one-room': 4,
      'mixed-two-rooms': 14,
      'chest-two-rooms': 20,
      'chest-one-room': 8,
    },
    expert: {
      'monster-only': 2,
      'mixed-one-room': 2,
      'mixed-two-rooms': 6,
      'chest-two-rooms': 10,
      'chest-one-room': 30,
    },
  };

const RATED_BAND_INDEX = {
  [DifficultyBand.Easy]: 0,
  [DifficultyBand.Medium]: 1,
  [DifficultyBand.Hard]: 2,
  [DifficultyBand.Expert]: 3,
} as const;

export function isTargetedDifficultyTarget(
  target: DifficultyTargetType,
): target is TargetedDifficultyTarget {
  return target !== DifficultyTarget.Any;
}

export function getTargetedArchetypeQuota(
  target: TargetedDifficultyTarget,
  archetype: GeneratorArchetypeType,
): number {
  return TARGETED_ARCHETYPE_QUOTAS[target][archetype];
}

export function getTargetedReservoirGoal(
  target: TargetedDifficultyTarget,
  archetype: GeneratorArchetypeType,
): number {
  return (
    getTargetedArchetypeQuota(
      target,
      archetype,
    ) *
    TARGETED_RESERVOIR_MULTIPLIER
  );
}

export function difficultyBandDistance(
  target: TargetedDifficultyTarget,
  band: DifficultyBandType,
): number {
  if (band === DifficultyBand.Unrated) {
    return 4;
  }

  return Math.abs(
    RATED_BAND_INDEX[target] -
    RATED_BAND_INDEX[band],
  );
}
