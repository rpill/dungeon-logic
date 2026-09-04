export const DifficultyBand = {
  Easy: 'easy',
  Medium: 'medium',
  Hard: 'hard',
  Expert: 'expert',
  Unrated: 'unrated',
} as const;

export type DifficultyBand =
  typeof DifficultyBand[
    keyof typeof DifficultyBand
  ];

export const ReasoningTier = {
  Direct: 'direct',
  ContradictionLight:
    'contradiction-light',
  ContradictionHeavy:
    'contradiction-heavy',
  ExpertLookahead:
    'expert-lookahead',
  Unrated: 'unrated',
} as const;

export type ReasoningTier =
  typeof ReasoningTier[
    keyof typeof ReasoningTier
  ];

export const DifficultyTarget = {
  Any: 'any',
  Easy: 'easy',
  Medium: 'medium',
  Hard: 'hard',
  Expert: 'expert',
} as const;

export type DifficultyTarget =
  typeof DifficultyTarget[
    keyof typeof DifficultyTarget
  ];

export interface DifficultyComponents {
  readonly boardLoad: number;
  readonly directLoad: number;
  readonly advancedRuleLoad: number;
  readonly lookaheadLoad: number;
}

export interface DifficultyProfile {
  readonly version: 1;
  readonly score: number | null;
  readonly band: DifficultyBand;
  readonly reasoningTier: ReasoningTier;
  readonly components:
    DifficultyComponents;
  readonly ordinaryContradictions:
    number;
  readonly treasureRoomVariantSteps:
    number;
  readonly reasons:
    readonly string[];
}
