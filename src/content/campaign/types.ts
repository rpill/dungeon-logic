import type { DifficultyBand } from '../../puzzle/difficulty/types';
import type {
  GeneratorArchetype,
  GeneratorBoardSize,
} from '../../puzzle/generator/types';
import type { LevelDefinition } from '../../puzzle/types';

export type CampaignOnboardingId =
  | 'row-column-clues'
  | 'monster-dead-end'
  | 'treasure-room-rule';

export interface CampaignCurationRule {
  readonly slot: number;
  readonly allowedArchetypes: readonly GeneratorArchetype[];
  readonly allowedDifficulties: readonly Exclude<DifficultyBand, 'unrated'>[];
  readonly allowedSizes: readonly GeneratorBoardSize[];
}

export interface CampaignLevelProvenance {
  readonly sourceSeed: number;
  readonly sourceCandidateId: string;
  readonly sourceArchetype: GeneratorArchetype;
  readonly difficulty: Exclude<DifficultyBand, 'unrated'>;
  readonly difficultyScore: number;
  readonly humanStatus: 'solved-direct' | 'solved-with-contradiction';
}

export interface PromotedCampaignLevelSource {
  readonly slot: number;
  readonly level: LevelDefinition;
  readonly provenance: CampaignLevelProvenance;
}

export interface CampaignLevelEntry {
  readonly slot: number;
  readonly id: string;
  readonly level: LevelDefinition;
}
