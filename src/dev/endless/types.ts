import type {
  RatedDifficultyBand,
} from '../../content/endless/CatalogFormat';
import type {
  GeneratorArchetype,
  GeneratorBoardSize,
} from '../../puzzle/generator/types';
import type {
  CandidateDiversitySignature,
} from '../../puzzle/generator/CandidateRanker';

export interface EndlessScanLane {
  readonly index: number;
  readonly id: string;
  readonly archetype: GeneratorArchetype;
  readonly size: GeneratorBoardSize;
  readonly startAttempt: number;
  readonly attemptCount: number;
}

export interface EndlessReservoirEntry {
  readonly laneIndex: number;
  readonly laneId: string;
  readonly attempt: number;
  readonly seed: number;
  readonly candidateId: string;
  readonly archetype: GeneratorArchetype;
  readonly size: GeneratorBoardSize;
  readonly difficultyScore: number;
  readonly difficultyBand: RatedDifficultyBand;
  readonly qualityScore: number;
  readonly structuralFingerprint: string;
  readonly diversity: CandidateDiversitySignature;
}

export type EndlessRejectionReason =
  | 'generation-failed'
  | 'duplicate-candidate-id'
  | 'invalid'
  | 'non-unique'
  | 'hard-quality'
  | 'geometry-warning'
  | 'unrated'
  | 'campaign-collision'
  | 'daily-collision'
  | 'structural-duplicate';

export interface EndlessLaneScanResult {
  readonly lane: EndlessScanLane;
  readonly attempts: number;
  readonly accepted: readonly EndlessReservoirEntry[];
  readonly rejectionCounts: Readonly<Record<EndlessRejectionReason, number>>;
}

export interface EndlessSelectedEntry extends EndlessReservoirEntry {
  readonly ordinal: number;
  readonly targetScore: number;
  readonly selectionScore: number;
  readonly previousDistance: number | null;
}

export type EndlessSelectionRecord = Omit<
  EndlessSelectedEntry,
  'diversity'
>;

export interface EndlessVerificationFailure {
  readonly ordinal: number;
  readonly candidateId: string;
  readonly reason: string;
}

export interface EndlessVerificationReport {
  readonly selectionHash: string;
  readonly ok: boolean;
  readonly verifiedCount: number;
  readonly rejectedVerificationCount: number;
  readonly duplicateCount: number;
  readonly campaignCollisionCount: number;
  readonly dailyCollisionCount: number;
  readonly failures: readonly EndlessVerificationFailure[];
}
