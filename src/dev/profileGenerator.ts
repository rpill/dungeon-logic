import { performance } from 'node:perf_hooks';

import {
  validatePuzzle,
} from '../puzzle/LevelValidator';

import { PuzzleState } from '../puzzle/PuzzleState';

import {
  CellState,
  type LevelDefinition,
} from '../puzzle/types';

import {
  analyzeLevelQuality,
} from '../puzzle/quality/LevelQualityAnalyzer';

import {
  solveLevelWithDiagnostics,
  type SolverDiagnostics,
} from '../puzzle/solver/PuzzleSolver';

import {
  chooseArchetypeAttemptSize,
  getGeneratorMonsterPolicy,
  isArchetypePoolComplete,
} from '../puzzle/generator/CandidateFactory';

import {
  ALL_GENERATOR_ARCHETYPES,
  CandidateStatus,
  RejectionReason,
  type CandidateEvaluation,
  type GeneratedCandidate,
  type GeneratorArchetype,
  type GeneratorBoardSize,
  type GeneratorConfig,
} from '../puzzle/generator/types';

import {
  SeededRandom,
  deriveCandidateSeed,
} from '../puzzle/generator/SeededRandom';

import {
  generateCandidate,
} from '../puzzle/generator/CandidateGenerator';

export interface CandidateProfileTimings {
  validationMs: number;
  solverMs: number;
  qualityMs: number;
  totalMs: number;
}

export interface GeneratedCandidateProfile {
  evaluation: CandidateEvaluation;
  solverDiagnostics:
    SolverDiagnostics | null;
  timings: CandidateProfileTimings;
}

export type GeneratorAttemptProfileStatus =
  | typeof RejectionReason.GenerationFailed
  | typeof RejectionReason.Duplicate
  | typeof RejectionReason.MonsterDensity
  | CandidateEvaluation['status'];

export interface GeneratorAttemptProfileTimings {
  generationMs: number;
  validationMs: number;
  solverMs: number;
  qualityMs: number;
  totalMs: number;
}

export interface GeneratorAttemptProfile {
  archetype: GeneratorArchetype;
  attempt: number;
  candidateSeed: number;
  size: GeneratorBoardSize;
  candidateId: string | null;
  status: GeneratorAttemptProfileStatus;
  diagnostic: string | null;
  solverDiagnostics:
    SolverDiagnostics | null;
  timings:
    GeneratorAttemptProfileTimings;
}

export interface GeneratorArchetypeProfile {
  archetype: GeneratorArchetype;
  attempts: number;
  accepted: number;
}

export interface GeneratorRunProfile {
  masterSeed: number;
  config: GeneratorConfig;
  completed: boolean;
  acceptedCandidateIds:
    readonly string[];
  attempts:
    readonly GeneratorAttemptProfile[];
  archetypes:
    readonly GeneratorArchetypeProfile[];
}

export function profileGeneratorRun(
  config: GeneratorConfig,
): GeneratorRunProfile {
  const attempts:
    GeneratorAttemptProfile[] = [];

  const archetypes:
    GeneratorArchetypeProfile[] = [];

  const acceptedCandidateIds:
    string[] = [];

  let completed = true;

  for (
    const archetype
    of ALL_GENERATOR_ARCHETYPES
  ) {
    const acceptedSignatures =
      new Set<string>();

    const acceptedSizes =
      new Set<GeneratorBoardSize>();

    let attempt = 0;
    let accepted = 0;

    while (
      attempt <
        config.maxAttemptsPerArchetype &&
      !isArchetypePoolComplete(
        archetype,
        accepted,
        acceptedSizes,
        config.acceptedPerArchetype,
      )
    ) {
      attempt += 1;

      const attemptStart =
        performance.now();

      const candidateSeed =
        deriveCandidateSeed(
          config.masterSeed,
          archetype,
          attempt,
        );

      const random =
        new SeededRandom(
          candidateSeed,
        );

      const size =
        chooseArchetypeAttemptSize(
          archetype,
          accepted,
          acceptedSizes,
          config.acceptedPerArchetype,
          random,
        );

      const generationStart =
        performance.now();

      const generation =
        generateCandidate({
          archetype,
          size,
          seed: candidateSeed,
        });

      const generationMs =
        performance.now() -
        generationStart;

      if (!generation.ok) {
        attempts.push({
          archetype,
          attempt,
          candidateSeed,
          size,
          candidateId: null,
          status:
            RejectionReason
              .GenerationFailed,
          diagnostic:
            generation.reason,
          solverDiagnostics: null,
          timings: {
            generationMs,
            validationMs: 0,
            solverMs: 0,
            qualityMs: 0,
            totalMs:
              performance.now() -
              attemptStart,
          },
        });

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
        attempts.push({
          archetype,
          attempt,
          candidateSeed,
          size,
          candidateId:
            generation.candidate.id,
          status:
            RejectionReason.Duplicate,
          diagnostic:
            'Playable puzzle duplicates an already accepted candidate.',
          solverDiagnostics: null,
          timings: {
            generationMs,
            validationMs: 0,
            solverMs: 0,
            qualityMs: 0,
            totalMs:
              performance.now() -
              attemptStart,
          },
        });

        continue;
      }

      const monsterPolicy =
        getGeneratorMonsterPolicy(
          generation.candidate,
        );

      if (monsterPolicy.reject) {
        attempts.push({
          archetype,
          attempt,
          candidateSeed,
          size,
          candidateId:
            generation.candidate.id,
          status:
            RejectionReason
              .MonsterDensity,
          diagnostic:
            monsterPolicy.diagnostic,
          solverDiagnostics: null,
          timings: {
            generationMs,
            validationMs: 0,
            solverMs: 0,
            qualityMs: 0,
            totalMs:
              performance.now() -
              attemptStart,
          },
        });

        continue;
      }

      const profile =
        profileGeneratedCandidate(
          generation.candidate,
        );

      if (
        profile.evaluation.status ===
        CandidateStatus.Accepted
      ) {
        acceptedSignatures.add(
          signature,
        );

        accepted += 1;

        acceptedSizes.add(size);

        acceptedCandidateIds.push(
          generation.candidate.id,
        );
      }

      attempts.push({
        archetype,
        attempt,
        candidateSeed,
        size,
        candidateId:
          generation.candidate.id,
        status:
          profile.evaluation.status,
        diagnostic:
          profile.evaluation.diagnostic,
        solverDiagnostics:
          profile.solverDiagnostics,
        timings: {
          generationMs,
          validationMs:
            profile.timings
              .validationMs,
          solverMs:
            profile.timings.solverMs,
          qualityMs:
            profile.timings.qualityMs,
          totalMs:
            performance.now() -
            attemptStart,
        },
      });
    }

    const archetypeCompleted =
      isArchetypePoolComplete(
        archetype,
        accepted,
        acceptedSizes,
        config.acceptedPerArchetype,
      );

    if (!archetypeCompleted) {
      completed = false;
    }

    archetypes.push({
      archetype,
      attempts: attempt,
      accepted,
    });
  }

  return {
    masterSeed:
      config.masterSeed >>> 0,
    config: {
      ...config,
      masterSeed:
        config.masterSeed >>> 0,
    },
    completed,
    acceptedCandidateIds,
    attempts,
    archetypes,
  };
}

export function formatGeneratorProfileReport(
  profile: GeneratorRunProfile,
  topN = 20,
): string {
  const lines: string[] = [];

  lines.push(
    `Generator profile seed ${profile.masterSeed}`,
  );

  lines.push('');
  lines.push('Archetype totals');

  for (
    const archetypeProfile
    of profile.archetypes
  ) {
    const attempts =
      profile.attempts.filter(
        (attempt) =>
          attempt.archetype ===
          archetypeProfile.archetype,
      );

    const totalMs =
      sumAttemptTime(
        attempts,
        'totalMs',
      );

    const generationMs =
      sumAttemptTime(
        attempts,
        'generationMs',
      );

    const solverMs =
      sumAttemptTime(
        attempts,
        'solverMs',
      );

    const qualityMs =
      sumAttemptTime(
        attempts,
        'qualityMs',
      );

    lines.push(
      `${archetypeProfile.archetype}: attempts=${archetypeProfile.attempts} accepted=${archetypeProfile.accepted} totalMs=${formatMs(totalMs)} generationMs=${formatMs(generationMs)} solverMs=${formatMs(solverMs)} qualityMs=${formatMs(qualityMs)}`,
    );
  }

  lines.push('');
  lines.push('Time by status');

  const statuses =
    Array.from(
      new Set(
        profile.attempts.map(
          (attempt) =>
            attempt.status,
        ),
      ),
    ).sort();

  for (const status of statuses) {
    const attempts =
      profile.attempts.filter(
        (attempt) =>
          attempt.status === status,
      );

    lines.push(
      `${status}: attempts=${attempts.length} totalMs=${formatMs(sumAttemptTime(attempts, 'totalMs'))} solverMs=${formatMs(sumAttemptTime(attempts, 'solverMs'))}`,
    );
  }

  const slowest =
    [...profile.attempts]
      .sort(
        (a, b) =>
          b.timings.totalMs -
            a.timings.totalMs ||
          a.archetype.localeCompare(
            b.archetype,
          ) ||
          a.attempt - b.attempt,
      )
      .slice(
        0,
        Math.max(0, topN),
      );

  lines.push('');
  lines.push(
    `Top ${topN} slow attempts`,
  );

  for (const attempt of slowest) {
    lines.push(
      formatAttemptLine(attempt),
    );
  }

  const mostNodes =
    profile.attempts
      .filter(
        (attempt) =>
          attempt.solverDiagnostics !==
          null,
      )
      .sort(
        (a, b) =>
          (
            b.solverDiagnostics
              ?.nodesVisited ?? 0
          ) -
            (
              a.solverDiagnostics
                ?.nodesVisited ?? 0
            ) ||
          b.timings.solverMs -
            a.timings.solverMs ||
          a.archetype.localeCompare(
            b.archetype,
          ) ||
          a.attempt - b.attempt,
      )
      .slice(
        0,
        Math.max(0, topN),
      );

  lines.push('');
  lines.push(
    `Top ${topN} solver node counts`,
  );

  for (const attempt of mostNodes) {
    lines.push(
      formatAttemptLine(attempt),
    );
  }

  return lines.join('\n');
}

function sumAttemptTime(
  attempts:
    readonly GeneratorAttemptProfile[],
  key:
    keyof GeneratorAttemptProfileTimings,
): number {
  return attempts.reduce(
    (sum, attempt) =>
      sum +
      attempt.timings[key],
    0,
  );
}

function formatMs(
  value: number,
): string {
  return value.toFixed(2);
}

function formatAttemptLine(
  attempt: GeneratorAttemptProfile,
): string {
  const diagnostics =
    attempt.solverDiagnostics;

  return (
    `${attempt.archetype} attempt=${attempt.attempt} seed=${attempt.candidateSeed} size=${attempt.size} status=${attempt.status}` +
    ` totalMs=${formatMs(attempt.timings.totalMs)}` +
    ` generationMs=${formatMs(attempt.timings.generationMs)}` +
    ` solverMs=${formatMs(attempt.timings.solverMs)}` +
    ` qualityMs=${formatMs(attempt.timings.qualityMs)}` +
    ` nodes=${diagnostics?.nodesVisited ?? 0}` +
    ` branches=${diagnostics?.branches ?? 0}` +
    ` propagationPasses=${diagnostics?.propagationPasses ?? 0}` +
    ` maxDepth=${diagnostics?.maxDepth ?? 0}` +
    ` completeCandidatesChecked=${diagnostics?.completeCandidatesChecked ?? 0}`
  );
}

export function profileGeneratedCandidate(
  candidate: GeneratedCandidate,
): GeneratedCandidateProfile {
  const totalStart =
    performance.now();

  const puzzle =
    createPuzzleFromSolution(
      candidate.level,
    );

  const validationStart =
    performance.now();

  const validation =
    validatePuzzle(puzzle);

  const validationMs =
    performance.now() -
    validationStart;

  if (!validation.isSolved) {
    return finishProfile(
      totalStart,
      {
        status:
          CandidateStatus.Invalid,
        accepted: null,
        diagnostic:
          describeValidationFailure(
            validation,
          ),
      },
      null,
      validationMs,
      0,
      0,
    );
  }

  const solverStart =
    performance.now();

  const solved =
    solveLevelWithDiagnostics(
      candidate.level,
    );

  const solverMs =
    performance.now() -
    solverStart;

  if (
    solved.result.solutionCount === 0
  ) {
    throw new Error(
      `Generator invariant violated: ${candidate.id} passed LevelValidator but PuzzleSolver found no solution.`,
    );
  }

  if (
    solved.result.solutionCount === 2
  ) {
    return finishProfile(
      totalStart,
      {
        status:
          CandidateStatus.NonUnique,
        accepted: null,
        diagnostic:
          'Solver found 2+ solutions.',
      },
      solved.diagnostics,
      validationMs,
      solverMs,
      0,
    );
  }

  const qualityStart =
    performance.now();

  const quality =
    analyzeLevelQuality(
      candidate.level,
    );

  const qualityMs =
    performance.now() -
    qualityStart;

  if (!quality.passes) {
    return finishProfile(
      totalStart,
      {
        status:
          CandidateStatus.HardQuality,
        accepted: null,
        diagnostic:
          quality.issues.join('; '),
      },
      solved.diagnostics,
      validationMs,
      solverMs,
      qualityMs,
    );
  }

  if (
    quality.warnings.length > 0
  ) {
    return finishProfile(
      totalStart,
      {
        status:
          CandidateStatus.GeometryWarning,
        accepted: null,
        diagnostic:
          quality.warnings.join('; '),
      },
      solved.diagnostics,
      validationMs,
      solverMs,
      qualityMs,
    );
  }

  return finishProfile(
    totalStart,
    {
      status:
        CandidateStatus.Accepted,
      accepted: {
        candidate,
        quality,
        solutionCount: 1,
      },
      diagnostic: null,
    },
    solved.diagnostics,
    validationMs,
    solverMs,
    qualityMs,
  );
}

function finishProfile(
  totalStart: number,
  evaluation: CandidateEvaluation,
  solverDiagnostics:
    SolverDiagnostics | null,
  validationMs: number,
  solverMs: number,
  qualityMs: number,
): GeneratedCandidateProfile {
  return {
    evaluation,
    solverDiagnostics,
    timings: {
      validationMs,
      solverMs,
      qualityMs,
      totalMs:
        performance.now() -
        totalStart,
    },
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

