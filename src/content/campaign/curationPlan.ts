import {
  GeneratorArchetype,
  type GeneratorArchetype as GeneratorArchetypeValue,
  type GeneratorBoardSize,
} from '../../puzzle/generator/types';
import type { DifficultyBand } from '../../puzzle/difficulty/types';
import type { CampaignCurationRule } from './types';

type RatedDifficulty = Exclude<DifficultyBand, 'unrated'>;

function rule(
  slot: number,
  allowedArchetypes: readonly GeneratorArchetypeValue[],
  allowedDifficulties: readonly RatedDifficulty[],
  allowedSizes: readonly GeneratorBoardSize[],
): CampaignCurationRule {
  return { slot, allowedArchetypes, allowedDifficulties, allowedSizes };
}

/**
 * Flat 64-level release curation allow-list. Chapters/manuscripts are not
 * part of player progression; slot order alone carries the difficulty curve.
 */
export const campaignCurationPlan = [
  rule(1, [GeneratorArchetype.MonsterOnly], ['easy'], [6]),
  rule(2, [GeneratorArchetype.MonsterOnly], ['easy'], [6]),
  rule(3, [GeneratorArchetype.MixedOneRoom], ['easy'], [6]),
  rule(4, [GeneratorArchetype.ChestOneRoom], ['easy'], [6, 7]),
  rule(5, [GeneratorArchetype.MixedOneRoom], ['easy', 'medium'], [7]),
  rule(6, [GeneratorArchetype.ChestOneRoom], ['easy'], [7]),
  rule(7, [GeneratorArchetype.MonsterOnly], ['easy', 'medium'], [7]),
  rule(8, [GeneratorArchetype.MonsterOnly], ['easy', 'medium'], [7]),
  rule(9, [GeneratorArchetype.MonsterOnly], ['medium'], [7]),
  rule(10, [GeneratorArchetype.MixedOneRoom], ['medium'], [7]),
  rule(11, [GeneratorArchetype.MonsterOnly], ['medium'], [7]),
  rule(12, [GeneratorArchetype.MonsterOnly], ['medium', 'hard'], [7]),
  rule(13, [GeneratorArchetype.MixedOneRoom], ['medium', 'hard'], [7]),
  rule(14, [GeneratorArchetype.MonsterOnly], ['hard'], [7]),
  rule(15, [GeneratorArchetype.ChestOneRoom], ['medium'], [7]),
  rule(16, [GeneratorArchetype.ChestOneRoom], ['medium', 'hard'], [7]),
  rule(17, [GeneratorArchetype.MixedOneRoom], ['medium'], [7]),
  rule(18, [GeneratorArchetype.ChestOneRoom], ['hard'], [7]),
  rule(19, [GeneratorArchetype.MixedOneRoom], ['medium', 'hard'], [7]),
  rule(20, [GeneratorArchetype.ChestOneRoom], ['hard'], [7]),
  rule(21, [GeneratorArchetype.MixedOneRoom], ['hard'], [7]),
  rule(22, [GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [7]),
  rule(23, [GeneratorArchetype.MonsterOnly], ['medium', 'hard'], [7, 8]),
  rule(24, [GeneratorArchetype.ChestOneRoom], ['hard'], [7, 8]),
  rule(25, [GeneratorArchetype.MixedOneRoom], ['hard'], [7, 8]),
  rule(26, [GeneratorArchetype.MonsterOnly], ['hard'], [7, 8]),
  rule(27, [GeneratorArchetype.ChestOneRoom], ['hard'], [7, 8]),
  rule(28, [GeneratorArchetype.MixedOneRoom], ['hard'], [7, 8]),
  rule(29, [GeneratorArchetype.MonsterOnly], ['hard'], [7, 8]),
  rule(30, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [7, 8]),
  rule(31, [GeneratorArchetype.MonsterOnly], ['medium', 'hard'], [7]),
  rule(32, [GeneratorArchetype.MixedOneRoom], ['medium', 'hard'], [7]),
  rule(33, [GeneratorArchetype.ChestOneRoom], ['medium', 'hard'], [7]),
  rule(34, [GeneratorArchetype.MixedOneRoom], ['medium', 'hard'], [7]),
  rule(35, [GeneratorArchetype.MonsterOnly], ['medium', 'hard'], [7]),
  rule(36, [GeneratorArchetype.MonsterOnly], ['medium', 'hard'], [7]),
  rule(37, [GeneratorArchetype.MixedOneRoom], ['medium', 'hard'], [7]),
  rule(38, [GeneratorArchetype.ChestOneRoom], ['medium', 'hard'], [7]),
  rule(39, [GeneratorArchetype.MixedOneRoom], ['medium', 'hard'], [7]),
  rule(40, [GeneratorArchetype.MonsterOnly], ['medium', 'hard'], [7]),
  rule(41, [GeneratorArchetype.MonsterOnly], ['medium', 'hard'], [7]),
  rule(42, [GeneratorArchetype.MixedOneRoom], ['medium', 'hard'], [7]),
  rule(43, [GeneratorArchetype.ChestOneRoom], ['medium', 'hard'], [7]),
  rule(44, [GeneratorArchetype.MixedOneRoom], ['medium', 'hard'], [7]),
  rule(45, [GeneratorArchetype.MonsterOnly], ['medium', 'hard'], [7]),
  rule(46, [GeneratorArchetype.MonsterOnly], ['medium', 'hard'], [7]),
  rule(47, [GeneratorArchetype.MixedOneRoom], ['medium', 'hard'], [7]),
  rule(48, [GeneratorArchetype.ChestOneRoom], ['medium', 'hard'], [7]),
  rule(49, [GeneratorArchetype.MixedOneRoom], ['medium', 'hard'], [7]),
  rule(50, [GeneratorArchetype.MonsterOnly], ['medium', 'hard'], [7]),
  rule(51, [GeneratorArchetype.MonsterOnly], ['medium', 'hard'], [7]),
  rule(52, [GeneratorArchetype.MixedOneRoom], ['medium', 'hard'], [7]),
  rule(53, [GeneratorArchetype.ChestOneRoom], ['medium', 'hard'], [7]),
  rule(54, [GeneratorArchetype.MixedOneRoom], ['medium', 'hard'], [7]),
  rule(55, [GeneratorArchetype.MonsterOnly], ['medium', 'hard'], [7]),
  rule(56, [GeneratorArchetype.MonsterOnly], ['medium', 'hard'], [7]),
  rule(57, [GeneratorArchetype.MixedOneRoom], ['medium', 'hard'], [7]),
  rule(58, [GeneratorArchetype.ChestOneRoom], ['medium', 'hard'], [7]),
  rule(59, [GeneratorArchetype.MixedOneRoom], ['medium', 'hard'], [7]),
  rule(60, [GeneratorArchetype.MonsterOnly], ['medium', 'hard'], [7]),
  rule(61, [GeneratorArchetype.MonsterOnly], ['medium', 'hard'], [7]),
  rule(62, [GeneratorArchetype.MixedOneRoom], ['medium', 'hard'], [7]),
  rule(63, [GeneratorArchetype.MonsterOnly], ['medium', 'hard'], [7]),
  rule(64, [GeneratorArchetype.MixedOneRoom], ['medium', 'hard'], [7]),
] as const satisfies readonly CampaignCurationRule[];

export function getCampaignCurationRule(slot: number): CampaignCurationRule {
  const entry = campaignCurationPlan.find((candidate) => candidate.slot === slot);
  if (entry === undefined) throw new Error(`No campaign curation rule for slot ${slot}.`);
  return entry;
}
