import {
  validatePuzzle,
} from '../LevelValidator';

import { PuzzleState } from '../PuzzleState';

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
  ALLOWED_SIZES,
  ALL_GENERATOR_ARCHETYPES,
  CandidateStatus,
  RejectionReason,
  type AcceptedCandidate,
  type ArchetypePoolResult,
  type CandidateEvaluation,
  type GeneratorArchetype,
  type GeneratorConfig,
  type GeneratorPoolReport,
  type GeneratedCandidate,
  type RejectionReason as RejectionReasonType,
  type RejectionSample,
} from './types';

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

  return {
    status:
      CandidateStatus.Accepted,
    accepted: {
      candidate,
      quality,
      solutionCount: 1,
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



export function createCandidatePool(
  config: GeneratorConfig,
): GeneratorPoolReport {
  validateGeneratorConfig(config);

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

  let attempts = 0;

  while (
    attempts <
      config.maxAttemptsPerArchetype &&
    accepted.length <
      config.acceptedPerArchetype
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
      random.choose(
        ALLOWED_SIZES[archetype],
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

    const evaluation =
      evaluateCandidate(
        generation.candidate,
      );

    if (
      evaluation.status ===
      CandidateStatus.Accepted
    ) {
      accepted.push(
        evaluation.accepted,
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
      accepted.length <
      config.acceptedPerArchetype,
  };
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
}

function createEmptyRejectionCounts():
  Record<
    RejectionReasonType,
    number
  > {
  return {
    [RejectionReason.GenerationFailed]:
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
