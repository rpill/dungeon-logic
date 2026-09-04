import type {
  GridPosition,
  LevelDefinition,
} from '../types';

import type {
  LevelQualityReport,
} from '../quality/LevelQualityAnalyzer';

import type {
  DifficultyProfile,
  DifficultyTarget,
} from '../difficulty/types';

export const GeneratorArchetype = {
  MonsterOnly: 'monster-only',
  ChestOneRoom: 'chest-one-room',
  ChestTwoRooms: 'chest-two-rooms',
  MixedOneRoom: 'mixed-one-room',
  MixedTwoRooms: 'mixed-two-rooms',
} as const;

export type GeneratorArchetype =
  typeof GeneratorArchetype[
    keyof typeof GeneratorArchetype
  ];

export type GeneratorBoardSize =
  | 6
  | 7
  | 8;

export interface GeneratorConfig {
  masterSeed: number;
  acceptedPerArchetype: number;
  shortlistPerArchetype: number;
  maxAttemptsPerArchetype: number;
}

export interface PlannedRoom {
  topLeft: GridPosition;
  internalEntrance: GridPosition;
  externalEntrance: GridPosition;
}

export interface GeneratedCandidate {
  id: string;
  seed: number;
  archetype: GeneratorArchetype;
  size: GeneratorBoardSize;
  rooms: readonly PlannedRoom[];
  level: LevelDefinition;
}

export type CandidateGenerationResult =
  | {
      ok: true;
      candidate: GeneratedCandidate;
    }
  | {
      ok: false;
      reason: string;
    };

export const CandidateStatus = {
  Invalid: 'invalid',
  NonUnique: 'non-unique',
  HardQuality: 'hard-quality',
  GeometryWarning: 'geometry-warning',
  Accepted: 'accepted',
} as const;

export type CandidateStatus =
  typeof CandidateStatus[
    keyof typeof CandidateStatus
  ];

export interface AcceptedCandidate {
  candidate: GeneratedCandidate;
  quality: LevelQualityReport;
  solutionCount: 1;
  difficulty: DifficultyProfile;
}

export type CandidateEvaluation =
  | {
      status: 'accepted';
      accepted: AcceptedCandidate;
      diagnostic: null;
    }
  | {
      status:
        | 'invalid'
        | 'non-unique'
        | 'hard-quality'
        | 'geometry-warning';
      accepted: null;
      diagnostic: string;
    };


export const RejectionReason = {
  GenerationFailed: 'generation-failed',
  Duplicate: 'duplicate',
  MonsterDensity: 'monster-density',
  Invalid: 'invalid',
  NonUnique: 'non-unique',
  HardQuality: 'hard-quality',
  GeometryWarning: 'geometry-warning',
} as const;

export type RejectionReason =
  typeof RejectionReason[
    keyof typeof RejectionReason
  ];

export interface RejectionSample {
  attempt: number;
  candidateSeed: number;
  reason: RejectionReason;
  diagnostic: string;
}

export interface ArchetypeRunStats {
  archetype: GeneratorArchetype;
  attempts: number;
  accepted: number;
  rejectionCounts:
    Readonly<
      Record<
        RejectionReason,
        number
      >
    >;
}

export interface ArchetypePoolResult {
  stats: ArchetypeRunStats;
  accepted:
    readonly AcceptedCandidate[];
  rejectionSamples:
    readonly RejectionSample[];
  exhausted: boolean;
}

export interface GeneratorPoolReport {
  masterSeed: number;
  config: GeneratorConfig;
  archetypes:
    readonly ArchetypePoolResult[];
  accepted:
    readonly AcceptedCandidate[];
  completed: boolean;
}

export interface RankedCandidate {
  accepted: AcceptedCandidate;
  qualityScore: number;
  diversityScore: number;
  selectionScore: number;
  rankWithinArchetype: number;
}

export interface GeneratorRunReport {
  schemaVersion: 1;
  masterSeed: number;
  difficultyTarget: DifficultyTarget;
  config: GeneratorConfig;
  pool: GeneratorPoolReport;
  shortlist:
    readonly RankedCandidate[];
}

export const DEFAULT_GENERATOR_CONFIG:
  GeneratorConfig = {
    masterSeed: 123456,
    acceptedPerArchetype: 10,
    shortlistPerArchetype: 3,
    maxAttemptsPerArchetype: 5000,
  };

export const ALL_GENERATOR_ARCHETYPES:
  readonly GeneratorArchetype[] = [
    GeneratorArchetype.MonsterOnly,
    GeneratorArchetype.ChestOneRoom,
    GeneratorArchetype.ChestTwoRooms,
    GeneratorArchetype.MixedOneRoom,
    GeneratorArchetype.MixedTwoRooms,
  ];

export const ALLOWED_SIZES:
  Readonly<
    Record<
      GeneratorArchetype,
      readonly GeneratorBoardSize[]
    >
  > = {
    'monster-only': [6, 7, 8],
    'chest-one-room': [6, 7, 8],
    'chest-two-rooms': [7, 8],
    'mixed-one-room': [6, 7, 8],
    'mixed-two-rooms': [7, 8],
  };
