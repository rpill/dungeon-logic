import {
  GeneratorArchetype,
  type GeneratorArchetype as GeneratorArchetypeValue,
  type GeneratorBoardSize,
} from '../../puzzle/generator/types';
import type { DifficultyBand } from '../../puzzle/difficulty/types';
import type {
  CampaignChapterId,
  CampaignCurationRule,
  CampaignOnboardingId,
} from './types';

type RatedDifficulty = Exclude<DifficultyBand, 'unrated'>;

function rule(
  slot: number,
  chapterId: CampaignChapterId,
  allowedArchetypes: readonly GeneratorArchetypeValue[],
  allowedDifficulties: readonly RatedDifficulty[],
  allowedSizes: readonly GeneratorBoardSize[],
  onboarding: readonly CampaignOnboardingId[] = [],
): CampaignCurationRule {
  return { slot, chapterId, allowedArchetypes, allowedDifficulties, allowedSizes, onboarding };
}

export const campaignCurationPlan = [
  rule(1, 'graveyard', [GeneratorArchetype.MonsterOnly], ['easy'], [6], ['row-column-clues', 'monster-dead-end']),
  rule(2, 'graveyard', [GeneratorArchetype.ChestOneRoom], ['easy'], [7], ['treasure-room-rule']),
  rule(3, 'graveyard', [GeneratorArchetype.MonsterOnly], ['easy'], [6]),
  rule(4, 'graveyard', [GeneratorArchetype.MixedOneRoom], ['easy'], [6]),
  rule(5, 'graveyard', [GeneratorArchetype.ChestOneRoom], ['easy'], [6, 7]),
  rule(6, 'graveyard', [GeneratorArchetype.MixedOneRoom], ['easy'], [7]),
  rule(7, 'desert-ruins', [GeneratorArchetype.MonsterOnly], ['easy'], [7]),
  rule(8, 'desert-ruins', [GeneratorArchetype.MixedOneRoom], ['easy'], [7]),
  rule(9, 'desert-ruins', [GeneratorArchetype.ChestOneRoom], ['medium'], [7]),
  rule(10, 'desert-ruins', [GeneratorArchetype.MixedOneRoom], ['medium'], [7]),
  rule(11, 'desert-ruins', [GeneratorArchetype.ChestTwoRooms], ['medium'], [7]),
  rule(12, 'desert-ruins', [GeneratorArchetype.MonsterOnly], ['medium'], [7, 8]),
  rule(13, 'desert-ruins', [GeneratorArchetype.MixedTwoRooms], ['medium'], [7, 8]),
  rule(14, 'sewers', [GeneratorArchetype.MixedOneRoom], ['medium'], [8]),
  rule(15, 'sewers', [GeneratorArchetype.ChestTwoRooms], ['medium'], [8]),
  rule(16, 'sewers', [GeneratorArchetype.MonsterOnly], ['medium'], [8]),
  rule(17, 'sewers', [GeneratorArchetype.MixedTwoRooms], ['medium'], [8]),
  rule(18, 'sewers', [GeneratorArchetype.ChestOneRoom], ['medium'], [7]),
  rule(19, 'sewers', [GeneratorArchetype.MixedTwoRooms], ['medium'], [8]),
  rule(20, 'sewers', [GeneratorArchetype.ChestTwoRooms], ['medium'], [8]),
  rule(21, 'sewers', [GeneratorArchetype.MonsterOnly], ['medium'], [8]),
  rule(22, 'sewers', [GeneratorArchetype.MixedTwoRooms], ['medium', 'hard'], [8]),
  rule(23, 'crypt', [GeneratorArchetype.ChestTwoRooms], ['medium'], [8]),
  rule(24, 'crypt', [GeneratorArchetype.MixedOneRoom], ['hard'], [8]),
  rule(25, 'crypt', [GeneratorArchetype.MixedTwoRooms], ['hard'], [8]),
  rule(26, 'crypt', [GeneratorArchetype.MonsterOnly], ['hard'], [8]),
  rule(27, 'crypt', [GeneratorArchetype.ChestTwoRooms], ['hard'], [8]),
  rule(28, 'crypt', [GeneratorArchetype.MixedTwoRooms], ['hard'], [8]),
  rule(29, 'crypt', [GeneratorArchetype.ChestOneRoom], ['hard'], [8]),
  rule(30, 'crypt', [GeneratorArchetype.MixedTwoRooms], ['hard'], [8]),
] as const satisfies readonly CampaignCurationRule[];

export function getCampaignCurationRule(slot: number): CampaignCurationRule {
  const entry = campaignCurationPlan.find((candidate) => candidate.slot === slot);
  if (entry === undefined) throw new Error(`No campaign curation rule for slot ${slot}.`);
  return entry;
}
