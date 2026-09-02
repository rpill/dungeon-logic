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
  CandidateStatus,
  type CandidateEvaluation,
  type GeneratedCandidate,
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
