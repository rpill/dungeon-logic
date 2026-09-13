import {
  deriveCandidateSeed,
} from '../../puzzle/generator/SeededRandom';
import {
  ALLOWED_SIZES,
  ALL_GENERATOR_ARCHETYPES,
} from '../../puzzle/generator/types';
import type {
  EndlessScanLane,
} from './types';

export function buildEndlessScanPlan(
  masterSeed: number,
  attemptsPerLane: number,
): readonly EndlessScanLane[] {
  validateMasterSeed(masterSeed);
  if (
    !Number.isInteger(attemptsPerLane) ||
    attemptsPerLane < 0
  ) {
    throw new RangeError(
      'Endless attemptsPerLane must be a non-negative integer.',
    );
  }

  const lanes: EndlessScanLane[] = [];

  for (const archetype of ALL_GENERATOR_ARCHETYPES) {
    for (const size of ALLOWED_SIZES[archetype]) {
      const index = lanes.length;
      lanes.push({
        index,
        id: `${archetype}:${size}`,
        archetype,
        size,
        startAttempt: 0,
        attemptCount: attemptsPerLane,
      });
    }
  }

  return lanes;
}

export function deriveEndlessCandidateSeed(
  masterSeed: number,
  lane: EndlessScanLane,
  attempt: number,
): number {
  validateMasterSeed(masterSeed);
  if (
    !Number.isInteger(attempt) ||
    attempt < 0
  ) {
    throw new RangeError(
      'Endless attempt must be a non-negative integer.',
    );
  }

  return deriveCandidateSeed(
    masterSeed,
    lane.id,
    attempt,
  );
}

function validateMasterSeed(
  masterSeed: number,
): void {
  if (!Number.isInteger(masterSeed)) {
    throw new TypeError(
      'Endless master seed must be an integer.',
    );
  }
}
