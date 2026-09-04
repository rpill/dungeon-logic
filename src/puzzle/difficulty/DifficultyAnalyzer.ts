import {
  HumanRule,
  HumanSolveStatus,
  type HumanSolveResult,
} from '../human-solver/types';

import type {
  LevelDefinition,
} from '../types';

import {
  DifficultyBand,
  ReasoningTier,
  type DifficultyBand as DifficultyBandType,
  type DifficultyComponents,
  type DifficultyProfile,
  type ReasoningTier as ReasoningTierType,
} from './types';

const ADVANCED_DIRECT_RULES = [
  HumanRule.Door,
  HumanRule.TreasureRoomInterior,
  HumanRule.TreasureRoomEntrance,
  HumanRule.MonsterDeadEnd,
  HumanRule.HallwayNotDeadEnd,
  HumanRule.Open2x2,
  HumanRule.Connectivity,
] as const;

interface SolvedClassification {
  band: Exclude<
    DifficultyBandType,
    typeof DifficultyBand.Unrated
  >;
  reasoningTier: Exclude<
    ReasoningTierType,
    typeof ReasoningTier.Unrated
  >;
}

export function analyzeDifficulty(
  level: LevelDefinition,
  humanResult: HumanSolveResult,
): DifficultyProfile {
  const ordinaryContradictions =
    humanResult.ruleCounts[
      HumanRule.Contradiction
    ];

  const treasureRoomVariantSteps =
    humanResult.ruleCounts[
      HumanRule.TreasureRoomVariant
    ];

  const treasureRoomStructuralConsensusSteps =
    humanResult.ruleCounts[
      HumanRule.TreasureRoomStructuralConsensus
    ];

  const treasureRoomHypothesisConsequenceSteps =
    humanResult.ruleCounts[
      HumanRule.TreasureRoomHypothesisConsequence
    ];

  if (
    humanResult.status ===
      HumanSolveStatus.Stuck ||
    humanResult.status ===
      HumanSolveStatus.Invalid
  ) {
    return createUnratedProfile(
      humanResult,
      ordinaryContradictions,
      treasureRoomVariantSteps,
      treasureRoomStructuralConsensusSteps,
      treasureRoomHypothesisConsequenceSteps,
    );
  }

  const classification =
    classifySolved(
      ordinaryContradictions,
      treasureRoomVariantSteps,
      treasureRoomStructuralConsensusSteps,
      treasureRoomHypothesisConsequenceSteps,
    );

  const rawComponents =
    calculateComponents(
      level,
      humanResult,
      classification.band,
      ordinaryContradictions,
      treasureRoomVariantSteps,
      treasureRoomStructuralConsensusSteps,
      treasureRoomHypothesisConsequenceSteps,
    );

  const score =
    calculateScore(
      classification.band,
      rawComponents,
    );

  const advancedFamiliesUsed =
    countAdvancedFamilies(
      humanResult,
    );

  return {
    version: 1,
    score,
    band: classification.band,
    reasoningTier:
      classification.reasoningTier,
    components: {
      boardLoad:
        roundComponent(
          rawComponents.boardLoad,
        ),
      directLoad:
        roundComponent(
          rawComponents.directLoad,
        ),
      advancedRuleLoad:
        roundComponent(
          rawComponents
            .advancedRuleLoad,
        ),
      lookaheadLoad:
        roundComponent(
          rawComponents.lookaheadLoad,
        ),
    },
    ordinaryContradictions,
    treasureRoomVariantSteps,
    treasureRoomStructuralConsensusSteps,
    treasureRoomHypothesisConsequenceSteps,
    reasons:
      buildReasons(
        level,
        humanResult,
        classification,
        ordinaryContradictions,
        treasureRoomVariantSteps,
        treasureRoomStructuralConsensusSteps,
        treasureRoomHypothesisConsequenceSteps,
        advancedFamiliesUsed,
      ),
  };
}

function createUnratedProfile(
  humanResult: HumanSolveResult,
  ordinaryContradictions: number,
  treasureRoomVariantSteps: number,
  treasureRoomStructuralConsensusSteps: number,
  treasureRoomHypothesisConsequenceSteps: number,
): DifficultyProfile {
  const reason =
    humanResult.status ===
    HumanSolveStatus.Stuck
      ? `Human Solver is stuck with ${humanResult.unknownRemaining} mutable cells unresolved.`
      : 'Human Solver marked the level invalid under the modeled rules.';

  return {
    version: 1,
    score: null,
    band: DifficultyBand.Unrated,
    reasoningTier:
      ReasoningTier.Unrated,
    components: {
      boardLoad: 0,
      directLoad: 0,
      advancedRuleLoad: 0,
      lookaheadLoad: 0,
    },
    ordinaryContradictions,
    treasureRoomVariantSteps,
    treasureRoomStructuralConsensusSteps,
    treasureRoomHypothesisConsequenceSteps,
    reasons: [reason],
  };
}

function classifySolved(
  ordinaryContradictions: number,
  treasureRoomVariantSteps: number,
  treasureRoomStructuralConsensusSteps: number,
  treasureRoomHypothesisConsequenceSteps: number,
): SolvedClassification {
  if (
    treasureRoomVariantSteps >= 1 ||
    treasureRoomStructuralConsensusSteps >= 1 ||
    treasureRoomHypothesisConsequenceSteps >= 1 ||
    ordinaryContradictions >= 9
  ) {
    return {
      band: DifficultyBand.Expert,
      reasoningTier:
        ReasoningTier.ExpertLookahead,
    };
  }

  if (
    ordinaryContradictions >= 3
  ) {
    return {
      band: DifficultyBand.Hard,
      reasoningTier:
        ReasoningTier.ContradictionHeavy,
    };
  }

  if (
    ordinaryContradictions >= 1
  ) {
    return {
      band: DifficultyBand.Medium,
      reasoningTier:
        ReasoningTier.ContradictionLight,
    };
  }

  return {
    band: DifficultyBand.Easy,
    reasoningTier:
      ReasoningTier.Direct,
  };
}

function calculateComponents(
  level: LevelDefinition,
  humanResult: HumanSolveResult,
  band: SolvedClassification['band'],
  ordinaryContradictions: number,
  treasureRoomVariantSteps: number,
  treasureRoomStructuralConsensusSteps: number,
  treasureRoomHypothesisConsequenceSteps: number,
): DifficultyComponents {
  const boardLoad =
    clamp01(
      (
        level.width *
        level.height -
        36
      ) / 28,
    );

  const directLoad =
    clamp01(
      humanResult.directSteps /
        30,
    );

  const advancedFamiliesUsed =
    countAdvancedFamilies(
      humanResult,
    );

  const advancedRuleLoad =
    advancedFamiliesUsed / 7;

  return {
    boardLoad,
    directLoad,
    advancedRuleLoad,
    lookaheadLoad:
      getLookaheadLoad(
        band,
        ordinaryContradictions,
        treasureRoomVariantSteps,
        treasureRoomStructuralConsensusSteps,
        treasureRoomHypothesisConsequenceSteps,
      ),
  };
}

function getLookaheadLoad(
  band: SolvedClassification['band'],
  ordinaryContradictions: number,
  treasureRoomVariantSteps: number,
  treasureRoomStructuralConsensusSteps: number,
  treasureRoomHypothesisConsequenceSteps: number,
): number {
  if (
    band === DifficultyBand.Easy
  ) {
    return 0;
  }

  if (
    band === DifficultyBand.Medium
  ) {
    return clamp01(
      ordinaryContradictions - 1,
    );
  }

  if (
    band === DifficultyBand.Hard
  ) {
    return clamp01(
      (
        ordinaryContradictions -
        3
      ) / 5,
    );
  }

  if (
    treasureRoomVariantSteps >= 1 ||
    treasureRoomStructuralConsensusSteps >= 1 ||
    treasureRoomHypothesisConsequenceSteps >= 1
  ) {
    return 1;
  }

  return clamp01(
    (
      ordinaryContradictions -
      9
    ) / 11,
  );
}

function calculateScore(
  band: SolvedClassification['band'],
  components: DifficultyComponents,
): number {
  if (
    band === DifficultyBand.Easy
  ) {
    const intra =
      0.35 * components.boardLoad +
      0.35 * components.directLoad +
      0.30 *
        components.advancedRuleLoad;

    return clampInteger(
      Math.round(24 * intra),
      0,
      24,
    );
  }

  const intra =
    0.15 * components.boardLoad +
    0.20 * components.directLoad +
    0.15 * components.advancedRuleLoad +
    0.50 * components.lookaheadLoad;

  if (
    band === DifficultyBand.Medium
  ) {
    return clampInteger(
      25 +
        Math.round(24 * intra),
      25,
      49,
    );
  }

  if (
    band === DifficultyBand.Hard
  ) {
    return clampInteger(
      50 +
        Math.round(24 * intra),
      50,
      74,
    );
  }

  return clampInteger(
    75 +
      Math.round(25 * intra),
    75,
    100,
  );
}

function countAdvancedFamilies(
  humanResult: HumanSolveResult,
): number {
  return ADVANCED_DIRECT_RULES
    .filter(
      (rule) =>
        humanResult.ruleCounts[rule] >
        0,
    )
    .length;
}

function buildReasons(
  level: LevelDefinition,
  humanResult: HumanSolveResult,
  classification: SolvedClassification,
  ordinaryContradictions: number,
  treasureRoomVariantSteps: number,
  treasureRoomStructuralConsensusSteps: number,
  treasureRoomHypothesisConsequenceSteps: number,
  advancedFamiliesUsed: number,
): readonly string[] {
  const reasons: string[] = [];

  if (
    classification.band ===
    DifficultyBand.Easy
  ) {
    reasons.push(
      'Solved without contradiction-tier reasoning.',
    );
  } else if (
    ordinaryContradictions === 1
  ) {
    reasons.push(
      'Requires 1 ordinary depth-1 contradiction deduction.',
    );
  } else if (
    ordinaryContradictions > 1
  ) {
    reasons.push(
      `Requires ${ordinaryContradictions} ordinary depth-1 contradiction deductions.`,
    );
  } else {
    reasons.push(
      'Requires contradiction-tier reasoning.',
    );
  }

  if (
    treasureRoomVariantSteps === 1
  ) {
    reasons.push(
      'Requires Treasure Room variant reasoning (1 step).',
    );
  } else if (
    treasureRoomVariantSteps > 1
  ) {
    reasons.push(
      `Requires Treasure Room variant reasoning (${treasureRoomVariantSteps} steps).`,
    );
  }

  if (
    treasureRoomStructuralConsensusSteps === 1
  ) {
    reasons.push(
      'Requires Treasure Room structural consensus reasoning (1 step).',
    );
  } else if (
    treasureRoomStructuralConsensusSteps > 1
  ) {
    reasons.push(
      `Requires Treasure Room structural consensus reasoning (${treasureRoomStructuralConsensusSteps} steps).`,
    );
  }

  if (
    treasureRoomHypothesisConsequenceSteps === 1
  ) {
    reasons.push(
      'Requires Treasure Room hypothesis consequence reasoning (1 step).',
    );
  } else if (
    treasureRoomHypothesisConsequenceSteps > 1
  ) {
    reasons.push(
      `Requires Treasure Room hypothesis consequence reasoning (${treasureRoomHypothesisConsequenceSteps} steps).`,
    );
  }

  reasons.push(
    `Board size is ${level.width}x${level.height}.`,
  );

  reasons.push(
    `Uses ${humanResult.directSteps} committed direct deduction steps.`,
  );

  reasons.push(
    `Uses ${advancedFamiliesUsed} advanced direct-rule families.`,
  );

  return reasons;
}

function clamp01(
  value: number,
): number {
  return Math.min(
    1,
    Math.max(0, value),
  );
}

function clampInteger(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  );
}

function roundComponent(
  value: number,
): number {
  return (
    Math.round(
      value * 1_000_000,
    ) / 1_000_000
  );
}
