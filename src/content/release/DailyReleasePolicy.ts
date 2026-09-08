import type { DifficultyBand } from '../../puzzle/difficulty/types';
import {
  GeneratorArchetype,
  type GeneratorArchetype as GeneratorArchetypeValue,
  type GeneratorBoardSize,
} from '../../puzzle/generator/types';
import type { HumanSolveStatus } from '../../puzzle/human-solver/types';

export const V1_RELEASE_ARCHETYPES = [
  GeneratorArchetype.MonsterOnly,
  GeneratorArchetype.ChestOneRoom,
  GeneratorArchetype.MixedOneRoom,
] as const satisfies readonly GeneratorArchetypeValue[];

export const DAILY_RELEASE_MIN_DIFFICULTY_SCORE = 30;
export const DAILY_RELEASE_MAX_DIFFICULTY_SCORE = 68;

export interface DailyReleaseCandidateFacts {
  readonly archetype: GeneratorArchetypeValue;
  readonly size: GeneratorBoardSize;
  readonly difficultyBand: DifficultyBand;
  readonly difficultyScore: number | null;
  readonly humanStatus: HumanSolveStatus;
  readonly blockerCount: number;
  readonly doorCount: number;
}

export interface DailyReleaseEligibility {
  readonly eligible: boolean;
  readonly reasons: readonly string[];
}

export function evaluateDailyReleaseEligibility(
  facts: DailyReleaseCandidateFacts,
): DailyReleaseEligibility {
  const reasons: string[] = [];

  if (!V1_RELEASE_ARCHETYPES.includes(facts.archetype as typeof V1_RELEASE_ARCHETYPES[number])) {
    reasons.push('archetype-not-in-v1');
  }

  if (facts.size !== 7 && facts.size !== 8) {
    reasons.push('daily-size-outside-7-8');
  }

  if (facts.blockerCount > 0 || facts.doorCount > 0) {
    reasons.push('forbidden-release-mechanic');
  }

  if (
    facts.humanStatus !== 'solved-direct'
    && facts.humanStatus !== 'solved-with-contradiction'
  ) {
    reasons.push('not-human-solved');
  }

  if (facts.difficultyBand !== 'medium' && facts.difficultyBand !== 'hard') {
    reasons.push('daily-difficulty-band-outside-medium-hard');
  }

  if (
    facts.difficultyScore === null
    || !Number.isFinite(facts.difficultyScore)
    || facts.difficultyScore < DAILY_RELEASE_MIN_DIFFICULTY_SCORE
    || facts.difficultyScore > DAILY_RELEASE_MAX_DIFFICULTY_SCORE
  ) {
    reasons.push('daily-difficulty-score-outside-30-68');
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}
