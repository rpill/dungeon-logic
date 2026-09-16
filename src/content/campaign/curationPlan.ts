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
  rule(8, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['easy'], [8]),
  rule(9, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['easy'], [8]),
  rule(10, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['medium'], [6, 7, 8]),
  rule(11, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['medium'], [6, 7, 8]),
  rule(12, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['medium'], [6, 7, 8]),
  rule(13, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['medium'], [6, 7, 8]),
  rule(14, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['medium'], [6, 7, 8]),
  rule(15, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['medium'], [6, 7, 8]),
  rule(16, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['medium'], [6, 7, 8]),
  rule(17, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['medium'], [6, 7, 8]),
  rule(18, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['medium'], [6, 7, 8]),
  rule(19, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['medium'], [6, 7, 8]),
  rule(20, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['medium'], [6, 7, 8]),
  rule(21, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['medium'], [6, 7, 8]),
  rule(22, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['medium'], [6, 7, 8]),
  rule(23, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['medium'], [6, 7, 8]),
  rule(24, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['medium'], [6, 7, 8]),
  rule(25, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(26, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(27, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(28, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(29, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(30, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(31, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(32, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(33, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(34, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(35, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(36, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(37, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(38, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(39, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(40, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(41, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(42, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(43, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(44, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(45, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(46, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(47, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(48, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(49, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(50, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(51, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(52, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(53, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(54, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(55, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(56, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(57, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(58, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(59, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(60, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(61, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(62, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(63, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
  rule(64, [GeneratorArchetype.MonsterOnly, GeneratorArchetype.ChestOneRoom, GeneratorArchetype.MixedOneRoom], ['hard'], [6, 7, 8]),
] as const satisfies readonly CampaignCurationRule[];

export function getCampaignCurationRule(slot: number): CampaignCurationRule {
  const entry = campaignCurationPlan.find((candidate) => candidate.slot === slot);
  if (entry === undefined) throw new Error(`No campaign curation rule for slot ${slot}.`);
  return entry;
}
