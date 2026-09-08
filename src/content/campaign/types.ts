import type { DifficultyBand } from '../../puzzle/difficulty/types';
import type {
  GeneratorArchetype,
  GeneratorBoardSize,
} from '../../puzzle/generator/types';
import type { LevelDefinition } from '../../puzzle/types';

export type CampaignChapterId =
  | 'graveyard'
  | 'desert-ruins'
  | 'sewers'
  | 'crypt';

export type CampaignThemeId = CampaignChapterId;

export type ManuscriptId =
  | 'manuscript-i'
  | 'manuscript-ii'
  | 'manuscript-iii'
  | 'manuscript-iv';

export interface ManuscriptDefinition {
  readonly id: ManuscriptId;
  readonly roman: 'I' | 'II' | 'III' | 'IV';
  readonly title: 'Азбука' | 'Дедукция' | 'Комнаты' | 'Мастерство';
  readonly slots: readonly number[];
  readonly requiredPreviousSolved: number;
}

export type CampaignOnboardingId =
  | 'row-column-clues'
  | 'monster-dead-end'
  | 'treasure-room-rule';

export interface CampaignChapterDefinition {
  readonly id: CampaignChapterId;
  readonly title: string;
  readonly themeId: CampaignThemeId;
  readonly slots: readonly number[];
}

export interface CampaignCurationRule {
  readonly slot: number;
  readonly chapterId: CampaignChapterId;
  readonly allowedArchetypes: readonly GeneratorArchetype[];
  readonly allowedDifficulties: readonly Exclude<DifficultyBand, 'unrated'>[];
  readonly allowedSizes: readonly GeneratorBoardSize[];
  readonly onboarding: readonly CampaignOnboardingId[];
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
  readonly chapterId: CampaignChapterId;
  readonly onboarding: readonly CampaignOnboardingId[];
}
