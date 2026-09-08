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
  ManuscriptId,
} from './types';

type RatedDifficulty = Exclude<DifficultyBand, 'unrated'>;

function rule(
  slot: number,
  chapterId: CampaignChapterId,
  manuscriptId: ManuscriptId,
  allowedArchetypes: readonly GeneratorArchetypeValue[],
  allowedDifficulties: readonly RatedDifficulty[],
  allowedSizes: readonly GeneratorBoardSize[],
  onboarding: readonly CampaignOnboardingId[] = [],
): CampaignCurationRule {
  return {
    slot,
    chapterId,
    manuscriptId,
    allowedArchetypes,
    allowedDifficulties,
    allowedSizes,
    onboarding,
  };
}

const M1: ManuscriptId = 'manuscript-i';
const M2: ManuscriptId = 'manuscript-ii';
const M3: ManuscriptId = 'manuscript-iii';
const M4: ManuscriptId = 'manuscript-iv';

/**
 * Release-v1 curation allow-list.
 *
 * Technical visual chapter ownership intentionally remains separate from
 * product manuscript ownership. Generic generator support for two-room
 * archetypes also remains intact; those archetypes are simply not eligible
 * for release-v1 campaign promotion.
 */
export const campaignCurationPlan = [
  rule(1, 'graveyard', M1, [GeneratorArchetype.MonsterOnly], ['easy'], [6], ['row-column-clues', 'monster-dead-end']),
  rule(2, 'graveyard', M1, [GeneratorArchetype.ChestOneRoom], ['easy'], [7], ['treasure-room-rule']),
  rule(3, 'graveyard', M1, [GeneratorArchetype.MonsterOnly], ['easy'], [6]),
  rule(4, 'graveyard', M1, [GeneratorArchetype.MixedOneRoom], ['easy'], [6]),
  rule(5, 'graveyard', M1, [GeneratorArchetype.ChestOneRoom], ['easy'], [6, 7]),
  rule(6, 'graveyard', M1, [GeneratorArchetype.MixedOneRoom], ['easy', 'medium'], [7]),
  rule(7, 'desert-ruins', M1, [GeneratorArchetype.MonsterOnly], ['easy', 'medium'], [7]),

  rule(8, 'desert-ruins', M2, [GeneratorArchetype.MonsterOnly], ['easy', 'medium'], [7]),
  rule(9, 'desert-ruins', M2, [GeneratorArchetype.MonsterOnly], ['medium'], [7]),
  rule(10, 'desert-ruins', M2, [GeneratorArchetype.MixedOneRoom], ['medium'], [7]),
  rule(11, 'desert-ruins', M2, [GeneratorArchetype.MonsterOnly], ['medium'], [7]),
  rule(12, 'desert-ruins', M2, [GeneratorArchetype.MonsterOnly], ['medium', 'hard'], [7]),
  rule(13, 'desert-ruins', M2, [GeneratorArchetype.MixedOneRoom], ['medium', 'hard'], [7]),
  rule(14, 'sewers', M2, [GeneratorArchetype.MonsterOnly], ['hard'], [7]),

  rule(15, 'sewers', M3, [GeneratorArchetype.ChestOneRoom], ['medium'], [7]),
  rule(16, 'sewers', M3, [GeneratorArchetype.ChestOneRoom], ['medium', 'hard'], [7]),
  rule(17, 'sewers', M3, [GeneratorArchetype.MixedOneRoom], ['medium'], [7]),
  rule(18, 'sewers', M3, [GeneratorArchetype.ChestOneRoom], ['hard'], [7]),
  rule(19, 'sewers', M3, [GeneratorArchetype.MixedOneRoom], ['medium', 'hard'], [7]),
  rule(20, 'sewers', M3, [GeneratorArchetype.ChestOneRoom], ['hard'], [7]),
  rule(21, 'sewers', M3, [GeneratorArchetype.MixedOneRoom], ['hard'], [7]),
  rule(22, 'sewers', M3, [GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [7]),

  rule(23, 'crypt', M4, [GeneratorArchetype.MonsterOnly], ['medium', 'hard'], [7, 8]),
  rule(24, 'crypt', M4, [GeneratorArchetype.ChestOneRoom], ['hard'], [7, 8]),
  rule(25, 'crypt', M4, [GeneratorArchetype.MixedOneRoom], ['hard'], [7, 8]),
  rule(26, 'crypt', M4, [GeneratorArchetype.MonsterOnly], ['hard'], [7, 8]),
  rule(27, 'crypt', M4, [GeneratorArchetype.ChestOneRoom], ['hard'], [7, 8]),
  rule(28, 'crypt', M4, [GeneratorArchetype.MixedOneRoom], ['hard'], [7, 8]),
  rule(29, 'crypt', M4, [GeneratorArchetype.MonsterOnly], ['hard'], [7, 8]),
  rule(30, 'crypt', M4, [
    GeneratorArchetype.MonsterOnly,
    GeneratorArchetype.ChestOneRoom,
    GeneratorArchetype.MixedOneRoom,
  ], ['hard'], [7, 8]),
] as const satisfies readonly CampaignCurationRule[];

export function getCampaignCurationRule(slot: number): CampaignCurationRule {
  const entry = campaignCurationPlan.find((candidate) => candidate.slot === slot);
  if (entry === undefined) throw new Error(`No campaign curation rule for slot ${slot}.`);
  return entry;
}
