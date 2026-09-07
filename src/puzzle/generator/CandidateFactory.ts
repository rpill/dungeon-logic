import {
  validatePuzzle,
} from '../LevelValidator';

import { PuzzleState } from '../PuzzleState';

import {
  analyzeDifficulty,
} from '../difficulty/DifficultyAnalyzer';

import {
  DifficultyTarget,
} from '../difficulty/types';

import {
  analyzeHumanSolvability,
} from '../human-solver/HumanSolver';

import {
  analyzeLevelQuality,
} from '../quality/LevelQualityAnalyzer';

import {
  solveLevel,
} from '../solver/PuzzleSolver';

import {
  CellState,
  type LevelDefinition,
} from '../types';

import {
  SeededRandom,
  deriveCandidateSeed,
} from './SeededRandom';

import {
  generateCandidate,
} from './CandidateGenerator';

import {
  TARGETED_ARCHETYPE_QUOTAS,
  TARGETED_POOL_SIZE,
  getTargetedArchetypeQuota,
  getTargetedReservoirGoal,
  isTargetedDifficultyTarget,
  type TargetedDifficultyTarget,
} from './DifficultyTargetPolicy';

import {
  selectTargetedPoolFromReservoirs,
} from './CandidateRanker';

import {
  ALLOWED_SIZES,
  ALL_GENERATOR_ARCHETYPES,
  CandidateStatus,
  GeneratorArchetype,
  RejectionReason,
  type AcceptedCandidate,
  type ArchetypePoolResult,
  type CandidateEvaluation,
  type GeneratorBoardSize,
  type GeneratorConfig,
  type GeneratorPoolReport,
  type GeneratedCandidate,
  type RejectionReason as RejectionReasonType,
  type RejectionSample,
} from './types';

const MONSTER_POLICY:
  Readonly<
    Record<
      GeneratorBoardSize,
      {
        penaltyCount: number;
        hardCap: number;
      }
    >
  > = {
    6: {
      penaltyCount: 5,
      hardCap: 5,
    },
    7: {
      penaltyCount: 7,
      hardCap: 7,
    },
    8: {
      penaltyCount: 8,
      hardCap: 8,
    },
  };

function isMonsterBearingArchetype(
  archetype: GeneratorArchetype,
): boolean {
  return (
    archetype ===
      GeneratorArchetype.MonsterOnly ||
    archetype ===
      GeneratorArchetype.MixedOneRoom ||
    archetype ===
      GeneratorArchetype.MixedTwoRooms
  );
}

export function getGeneratorMonsterPolicy(
  candidate: GeneratedCandidate,
): {
  reject: boolean;
  rankingPenalty: 0 | 4;
  reason:
    | typeof RejectionReason.MonsterDensity
    | null;
  diagnostic: string | null;
} {
  if (
    !isMonsterBearingArchetype(
      candidate.archetype,
    )
  ) {
    return {
      reject: false,
      rankingPenalty: 0,
      reason: null,
      diagnostic: null,
    };
  }

  const rule =
    MONSTER_POLICY[
      candidate.size
    ];

  const count =
    candidate.level.monsters.length;

  if (count > rule.hardCap) {
    return {
      reject: true,
      rankingPenalty: 0,
      reason:
        RejectionReason
          .MonsterDensity,
      diagnostic:
        `${candidate.size}x${candidate.size} candidate has ${count} Monsters; Generator v1.2 hard cap is ${rule.hardCap}.`,
    };
  }

  return {
    reject: false,
    rankingPenalty:
      count === rule.penaltyCount
        ? 4
        : 0,
    reason: null,
    diagnostic: null,
  };
}

export function evaluateCandidate(
  candidate: GeneratedCandidate,
): CandidateEvaluation {
  const puzzle =
    createPuzzleFromSolution(
      candidate.level,
    );

  const validation =
    validatePuzzle(puzzle);

  if (!validation.isSolved) {
    return {
      status:
        CandidateStatus.Invalid,
      accepted: null,
      diagnostic:
        describeValidationFailure(
          validation,
        ),
    };
  }

  const solveResult =
    solveLevel(candidate.level);

  if (
    solveResult.solutionCount === 0
  ) {
    throw new Error(
      `Generator invariant violated: ${candidate.id} passed LevelValidator but PuzzleSolver found no solution.`,
    );
  }

  if (
    solveResult.solutionCount === 2
  ) {
    return {
      status:
        CandidateStatus.NonUnique,
      accepted: null,
      diagnostic:
        'Solver found 2+ solutions.',
    };
  }

  const quality =
    analyzeLevelQuality(
      candidate.level,
    );

  if (!quality.passes) {
    return {
      status:
        CandidateStatus.HardQuality,
      accepted: null,
      diagnostic:
        quality.issues.join('; '),
    };
  }

  if (
    quality.warnings.length > 0
  ) {
    return {
      status:
        CandidateStatus.GeometryWarning,
      accepted: null,
      diagnostic:
        quality.warnings.join('; '),
    };
  }

  const humanResult =
    analyzeHumanSolvability(
      candidate.level,
    );

  const difficulty =
    analyzeDifficulty(
      candidate.level,
      humanResult,
    );

  return {
    status:
      CandidateStatus.Accepted,
    accepted: {
      candidate,
      quality,
      solutionCount: 1,
      difficulty,
    },
    diagnostic: null,
  };
}

function createPuzzleFromSolution(
  level: LevelDefinition,
): PuzzleState {
  const puzzle =
    new PuzzleState(level);

  for (
    let y = 0;
    y < level.height;
    y += 1
  ) {
    for (
      let x = 0;
      x < level.width;
      x += 1
    ) {
      if (
        level.solution[y][x] ===
        '#'
      ) {
        puzzle.setCellState(
          x,
          y,
          CellState.Wall,
        );
      }
    }
  }

  return puzzle;
}

function describeValidationFailure(
  validation:
    ReturnType<
      typeof validatePuzzle
    >,
): string {
  const failedFlags =
    Object.entries(validation)
      .filter(
        ([key, value]) =>
          key !== 'isSolved' &&
          value === false,
      )
      .map(([key]) => key);

  if (failedFlags.length === 0) {
    return (
      'Generated solution failed LevelValidator ' +
      'without a reported false validation flag.'
    );
  }

  return (
    'Generated solution failed: ' +
    failedFlags.join(', ')
  );
}



export function isTwoRoomGeneratorArchetype(
  archetype: GeneratorArchetype,
): boolean {
  return (
    archetype ===
      GeneratorArchetype.ChestTwoRooms ||
    archetype ===
      GeneratorArchetype.MixedTwoRooms
  );
}

export function isArchetypePoolComplete(
  archetype: GeneratorArchetype,
  acceptedCount: number,
  acceptedSizes:
    ReadonlySet<GeneratorBoardSize>,
  target: number,
): boolean {
  if (acceptedCount < target) {
    return false;
  }

  if (
    !isTwoRoomGeneratorArchetype(
      archetype,
    )
  ) {
    return true;
  }

  return (
    acceptedSizes.has(7) &&
    acceptedSizes.has(8)
  );
}

export function chooseArchetypeAttemptSize(
  archetype: GeneratorArchetype,
  acceptedCount: number,
  acceptedSizes:
    ReadonlySet<GeneratorBoardSize>,
  target: number,
  random: SeededRandom,
): GeneratorBoardSize {
  const allowed =
    ALLOWED_SIZES[archetype];

  if (
    acceptedCount >= target &&
    isTwoRoomGeneratorArchetype(
      archetype,
    )
  ) {
    if (!acceptedSizes.has(7)) {
      return 7;
    }

    if (!acceptedSizes.has(8)) {
      return 8;
    }
  }

  return random.choose(allowed);
}


export function createCandidatePool(
  config: GeneratorConfig,
): GeneratorPoolReport {
  validateGeneratorConfig(config);

  const difficultyTarget =
    config.difficultyTarget ??
    DifficultyTarget.Any;

  if (
    !isTargetedDifficultyTarget(
      difficultyTarget,
    )
  ) {
    return createCompatibilityCandidatePool(
      omitDifficultyTarget(config),
    );
  }

  return createTargetedCandidatePool(
    config,
    difficultyTarget,
  );
}

function createCompatibilityCandidatePool(
  config: GeneratorConfig,
): GeneratorPoolReport {
  const archetypes:
    ArchetypePoolResult[] = [];

  const accepted:
    AcceptedCandidate[] = [];

  for (
    const archetype
    of ALL_GENERATOR_ARCHETYPES
  ) {
    const archetypeResult =
      createArchetypePool(
        config,
        archetype,
      );

    archetypes.push(
      archetypeResult,
    );

    accepted.push(
      ...archetypeResult.accepted,
    );
  }

  return {
    masterSeed:
      config.masterSeed >>> 0,
    config: {
      ...config,
      masterSeed:
        config.masterSeed >>> 0,
    },
    archetypes,
    accepted,
    completed:
      archetypes.every(
        (result) =>
          !result.exhausted,
      ),
  };
}

interface TargetedArchetypeReservoirResult {
  archetype: GeneratorArchetype;
  attempts: number;
  reservoir:
    readonly AcceptedCandidate[];
  rejectionCounts:
    Readonly<
      Record<
        RejectionReasonType,
        number
      >
    >;
  rejectionSamples:
    readonly RejectionSample[];
  exhausted: boolean;
}

function createTargetedCandidatePool(
  config: GeneratorConfig,
  target: TargetedDifficultyTarget,
): GeneratorPoolReport {
  const reservoirResults:
    TargetedArchetypeReservoirResult[] = [];

  const reservoirs =
    createEmptyReservoirMap();

  for (
    const archetype
    of ALL_GENERATOR_ARCHETYPES
  ) {
    const result =
      createTargetedArchetypeReservoir(
        config,
        archetype,
        target,
      );

    reservoirResults.push(result);
    reservoirs[archetype] =
      [...result.reservoir];
  }

  const selection =
    selectTargetedPoolFromReservoirs(
      reservoirs,
      target,
      TARGETED_ARCHETYPE_QUOTAS[
        target
      ],
      TARGETED_POOL_SIZE,
    );

  const archetypes:
    ArchetypePoolResult[] =
      ALL_GENERATOR_ARCHETYPES.map(
        (archetype) => {
          const reservoirResult =
            reservoirResults.find(
              (entry) =>
                entry.archetype ===
                archetype,
            );

          if (
            reservoirResult ===
            undefined
          ) {
            throw new Error(
              `Missing targeted reservoir result for ${archetype}.`,
            );
          }

          const finalAccepted =
            selection.byArchetype[
              archetype
            ];

          return {
            stats: {
              archetype,
              attempts:
                reservoirResult.attempts,
              accepted:
                finalAccepted.length,
              rejectionCounts:
                reservoirResult
                  .rejectionCounts,
            },
            accepted: finalAccepted,
            rejectionSamples:
              reservoirResult
                .rejectionSamples,
            exhausted:
              reservoirResult.exhausted,
          };
        },
      );

  const exactCount =
    selection.accepted.filter(
      (entry) =>
        entry.difficulty.band ===
        target,
    ).length;

  const fallbackCount =
    selection.accepted.length -
    exactCount;

  const targetedArchetypes =
    ALL_GENERATOR_ARCHETYPES.map(
      (archetype) => {
        const reservoirResult =
          reservoirResults.find(
            (entry) =>
              entry.archetype ===
              archetype,
          );

        if (
          reservoirResult ===
          undefined
        ) {
          throw new Error(
            `Missing targeted reservoir diagnostics for ${archetype}.`,
          );
        }

        const finalAccepted =
          selection.byArchetype[
            archetype
          ];

        const archetypeExact =
          finalAccepted.filter(
            (entry) =>
              entry.difficulty.band ===
              target,
          ).length;

        return {
          archetype,
          nominalQuota:
            getTargetedArchetypeQuota(
              target,
              archetype,
            ),
          reservoirGoal:
            getTargetedReservoirGoal(
              target,
              archetype,
            ),
          reservoirCount:
            reservoirResult
              .reservoir.length,
          finalAccepted:
            finalAccepted.length,
          exactCount:
            archetypeExact,
          fallbackCount:
            finalAccepted.length -
            archetypeExact,
        };
      },
    );

  return {
    masterSeed:
      config.masterSeed >>> 0,
    config: {
      ...config,
      masterSeed:
        config.masterSeed >>> 0,
      difficultyTarget: target,
    },
    archetypes,
    accepted:
      selection.accepted,
    completed:
      selection.accepted.length ===
      TARGETED_POOL_SIZE,
    targeting: {
      difficultyTarget: target,
      requestedPoolSize:
        TARGETED_POOL_SIZE,
      nominalQuotas:
        TARGETED_ARCHETYPE_QUOTAS[
          target
        ],
      archetypes:
        targetedArchetypes,
      exactCount,
      fallbackCount,
      exactRate:
        selection.accepted.length === 0
          ? 0
          : roundMetric(
              exactCount /
              selection.accepted.length,
            ),
      backfillUsed:
        selection.backfillCount > 0,
      backfillCount:
        selection.backfillCount,
      missingSlots:
        Math.max(
          0,
          TARGETED_POOL_SIZE -
          selection.accepted.length,
        ),
    },
  };
}

function createTargetedArchetypeReservoir(
  config: GeneratorConfig,
  archetype: GeneratorArchetype,
  target: TargetedDifficultyTarget,
): TargetedArchetypeReservoirResult {
  const reservoir:
    AcceptedCandidate[] = [];

  const rejectionCounts =
    createEmptyRejectionCounts();

  const rejectionSamples:
    RejectionSample[] = [];

  const acceptedSignatures =
    new Set<string>();

  const acceptedSizes =
    new Set<GeneratorBoardSize>();

  const quota =
    getTargetedArchetypeQuota(
      target,
      archetype,
    );

  const reservoirGoal =
    getTargetedReservoirGoal(
      target,
      archetype,
    );

  let attempts = 0;

  while (
    attempts <
      config.maxAttemptsPerArchetype &&
    reservoir.length <
      reservoirGoal
  ) {
    attempts += 1;

    const candidateSeed =
      deriveCandidateSeed(
        config.masterSeed,
        archetype,
        attempts,
      );

    const random =
      new SeededRandom(
        candidateSeed,
      );

    const size =
      chooseArchetypeAttemptSize(
        archetype,
        reservoir.length,
        acceptedSizes,
        quota,
        random,
      );

    const generation =
      generateCandidate({
        archetype,
        size,
        seed: candidateSeed,
      });

    if (generation.ok === false) {
      recordRejection(
        rejectionCounts,
        rejectionSamples,
        attempts,
        candidateSeed,
        RejectionReason.GenerationFailed,
        generation.reason,
      );
      continue;
    }

    const signature =
      playableCandidateSignature(
        generation.candidate,
      );

    if (
      acceptedSignatures.has(
        signature,
      )
    ) {
      recordRejection(
        rejectionCounts,
        rejectionSamples,
        attempts,
        candidateSeed,
        RejectionReason.Duplicate,
        'Playable puzzle duplicates an already accepted candidate.',
      );
      continue;
    }

    const monsterPolicy =
      getGeneratorMonsterPolicy(
        generation.candidate,
      );

    if (monsterPolicy.reject) {
      recordRejection(
        rejectionCounts,
        rejectionSamples,
        attempts,
        candidateSeed,
        RejectionReason
          .MonsterDensity,
        monsterPolicy.diagnostic ??
          'Monster density rejected candidate.',
      );
      continue;
    }

    const evaluation =
      evaluateCandidate(
        generation.candidate,
      );

    if (
      evaluation.status ===
      CandidateStatus.Accepted
    ) {
      acceptedSignatures.add(
        signature,
      );
      reservoir.push(
        evaluation.accepted,
      );
      acceptedSizes.add(
        evaluation.accepted
          .candidate.size,
      );
      continue;
    }

    recordRejection(
      rejectionCounts,
      rejectionSamples,
      attempts,
      candidateSeed,
      rejectionReasonForStatus(
        evaluation.status,
      ),
      evaluation.diagnostic,
    );
  }

  return {
    archetype,
    attempts,
    reservoir,
    rejectionCounts,
    rejectionSamples,
    exhausted:
      reservoir.length <
      reservoirGoal,
  };
}

function createEmptyReservoirMap():
  Record<
    GeneratorArchetype,
    AcceptedCandidate[]
  > {
  return {
    [GeneratorArchetype.MonsterOnly]: [],
    [GeneratorArchetype.ChestOneRoom]: [],
    [GeneratorArchetype.ChestTwoRooms]: [],
    [GeneratorArchetype.MixedOneRoom]: [],
    [GeneratorArchetype.MixedTwoRooms]: [],
  };
}

function omitDifficultyTarget(
  config: GeneratorConfig,
): GeneratorConfig {
  const {
    difficultyTarget: _difficultyTarget,
    ...compatibilityConfig
  } = config;

  return compatibilityConfig;
}

function roundMetric(
  value: number,
): number {
  return (
    Math.round(
      value * 1_000_000,
    ) /
    1_000_000
  );
}

function createArchetypePool(
  config: GeneratorConfig,
  archetype: GeneratorArchetype,
): ArchetypePoolResult {
  const accepted:
    AcceptedCandidate[] = [];

  const rejectionCounts =
    createEmptyRejectionCounts();

  const rejectionSamples:
    RejectionSample[] = [];

  const acceptedSignatures =
    new Set<string>();

  const acceptedSizes =
    new Set<GeneratorBoardSize>();

  let attempts = 0;

  while (
    attempts <
      config.maxAttemptsPerArchetype &&
    !isArchetypePoolComplete(
      archetype,
      accepted.length,
      acceptedSizes,
      config.acceptedPerArchetype,
    )
  ) {
    attempts += 1;

    const candidateSeed =
      deriveCandidateSeed(
        config.masterSeed,
        archetype,
        attempts,
      );

    const random =
      new SeededRandom(
        candidateSeed,
      );

    const size =
      chooseArchetypeAttemptSize(
        archetype,
        accepted.length,
        acceptedSizes,
        config.acceptedPerArchetype,
        random,
      );

    const generation =
      generateCandidate({
        archetype,
        size,
        seed: candidateSeed,
      });

    if (!generation.ok) {
      recordRejection(
        rejectionCounts,
        rejectionSamples,
        attempts,
        candidateSeed,
        RejectionReason.GenerationFailed,
        generation.reason,
      );

      continue;
    }

    const signature =
      playableCandidateSignature(
        generation.candidate,
      );

    if (
      acceptedSignatures.has(
        signature,
      )
    ) {
      recordRejection(
        rejectionCounts,
        rejectionSamples,
        attempts,
        candidateSeed,
        RejectionReason.Duplicate,
        'Playable puzzle duplicates an already accepted candidate.',
      );

      continue;
    }

    const monsterPolicy =
      getGeneratorMonsterPolicy(
        generation.candidate,
      );

    if (monsterPolicy.reject) {
      recordRejection(
        rejectionCounts,
        rejectionSamples,
        attempts,
        candidateSeed,
        RejectionReason
          .MonsterDensity,
        monsterPolicy.diagnostic ??
          'Monster density rejected candidate.',
      );

      continue;
    }

    const evaluation =
      evaluateCandidate(
        generation.candidate,
      );

    if (
      evaluation.status ===
      CandidateStatus.Accepted
    ) {
      acceptedSignatures.add(
        signature,
      );

      accepted.push(
        evaluation.accepted,
      );

      acceptedSizes.add(
        evaluation.accepted
          .candidate.size,
      );

      continue;
    }

    recordRejection(
      rejectionCounts,
      rejectionSamples,
      attempts,
      candidateSeed,
      rejectionReasonForStatus(
        evaluation.status,
      ),
      evaluation.diagnostic,
    );
  }

  return {
    stats: {
      archetype,
      attempts,
      accepted:
        accepted.length,
      rejectionCounts,
    },
    accepted,
    rejectionSamples,
    exhausted:
      !isArchetypePoolComplete(
        archetype,
        accepted.length,
        acceptedSizes,
        config.acceptedPerArchetype,
      ),
  };
}

function playableCandidateSignature(
  candidate: GeneratedCandidate,
): string {
  const level =
    candidate.level;

  const positions =
    (
      values:
        readonly {
          x: number;
          y: number;
        }[],
    ): readonly string[] =>
      values
        .map(
          ({ x, y }) =>
            `${x}:${y}`,
        )
        .sort();

  const doors =
    level.doors
      .map(
        (door) =>
          `${door.position.x}:${door.position.y}:${door.orientation}`,
      )
      .sort();

  return JSON.stringify({
    size: candidate.size,
    rowClues: level.rowClues,
    columnClues:
      level.columnClues,
    monsters:
      positions(level.monsters),
    chests:
      positions(level.chests),
    blockers:
      positions(level.blockers),
    doors,
    solution:
      level.solution,
  });
}

function validateGeneratorConfig(
  config: GeneratorConfig,
): void {
  if (
    !Number.isInteger(
      config.masterSeed,
    )
  ) {
    throw new TypeError(
      'masterSeed must be an integer.',
    );
  }

  if (
    !Number.isInteger(
      config.acceptedPerArchetype,
    ) ||
    config.acceptedPerArchetype <= 0
  ) {
    throw new RangeError(
      'acceptedPerArchetype must be positive.',
    );
  }

  if (
    !Number.isInteger(
      config.shortlistPerArchetype,
    ) ||
    config.shortlistPerArchetype <= 0 ||
    config.shortlistPerArchetype >
      config.acceptedPerArchetype
  ) {
    throw new RangeError(
      'shortlistPerArchetype must be positive and not exceed acceptedPerArchetype.',
    );
  }

  if (
    !Number.isInteger(
      config.maxAttemptsPerArchetype,
    ) ||
    config.maxAttemptsPerArchetype <= 0
  ) {
    throw new RangeError(
      'maxAttemptsPerArchetype must be positive.',
    );
  }

  if (
    config.difficultyTarget !==
      undefined &&
    !Object.values(
      DifficultyTarget,
    ).includes(
      config.difficultyTarget,
    )
  ) {
    throw new RangeError(
      'difficultyTarget must be any, easy, medium, hard, or expert.',
    );
  }
}

function createEmptyRejectionCounts():
  Record<
    RejectionReasonType,
    number
  > {
  return {
    [RejectionReason.GenerationFailed]:
      0,
    [RejectionReason.Duplicate]: 0,
    [RejectionReason.MonsterDensity]:
      0,
    [RejectionReason.Invalid]: 0,
    [RejectionReason.NonUnique]: 0,
    [RejectionReason.HardQuality]:
      0,
    [RejectionReason.GeometryWarning]:
      0,
  };
}

function rejectionReasonForStatus(
  status:
    Exclude<
      CandidateEvaluation['status'],
      'accepted'
    >,
): RejectionReasonType {
  switch (status) {
    case CandidateStatus.Invalid:
      return RejectionReason.Invalid;

    case CandidateStatus.NonUnique:
      return RejectionReason.NonUnique;

    case CandidateStatus.HardQuality:
      return RejectionReason.HardQuality;

    case CandidateStatus.GeometryWarning:
      return RejectionReason.GeometryWarning;
  }
}

function recordRejection(
  counts:
    Record<
      RejectionReasonType,
      number
    >,
  samples: RejectionSample[],
  attempt: number,
  candidateSeed: number,
  reason: RejectionReasonType,
  diagnostic: string,
): void {
  counts[reason] += 1;

  let reasonSampleCount = 0;

  for (const sample of samples) {
    if (sample.reason === reason) {
      reasonSampleCount += 1;
    }
  }

  if (reasonSampleCount >= 5) {
    return;
  }

  samples.push({
    attempt,
    candidateSeed,
    reason,
    diagnostic,
  });
}
