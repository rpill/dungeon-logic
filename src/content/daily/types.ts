import type { DifficultyBand } from '../../puzzle/difficulty/types';
import type { GeneratorArchetype } from '../../puzzle/generator/types';
import type { HumanSolveStatus } from '../../puzzle/human-solver/types';
import type { LevelDefinition } from '../../puzzle/types';

export interface DailyEntry {
  readonly id: string;
  readonly dateKey: string;
  readonly level: LevelDefinition;
}

export interface DailySnapshotProvenance {
  readonly sourceSeed: number;
  readonly sourceCandidateSeed: number;
  readonly sourceCandidateId: string;
  readonly sourceArchetype: GeneratorArchetype;
  readonly difficulty: Exclude<DifficultyBand, 'unrated'>;
  readonly difficultyScore: number;
  readonly humanStatus: Extract<HumanSolveStatus, 'solved-direct' | 'solved-with-contradiction'>;
  readonly targetScore: number;
}

export interface CuratedDailySnapshot {
  readonly ordinal: number;
  readonly id: string;
  readonly level: LevelDefinition;
  readonly provenance: DailySnapshotProvenance;
}
