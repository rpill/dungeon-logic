import {
  validatePuzzle,
} from '../LevelValidator';

import { PuzzleState } from '../PuzzleState';

import {
  CellState,
  type LevelDefinition,
} from '../types';

import { SearchState } from '../solver/SearchState';

import {
  SearchCellState,
} from '../solver/types';

import {
  runDirectFixedPoint,
} from './DirectDeductionEngine';

import {
  HumanDeductionTier,
  HumanRule,
  HumanSolveStatus,
  createEmptyHumanRuleCounts,
  type HumanAssignment,
  type HumanContradictionProof,
  type HumanProofStep,
  type HumanSolveResult,
  type HumanSolveStep,
} from './types';

interface ContradictionMove {
  assignment: HumanAssignment;
  proof: HumanContradictionProof;
}

type ContradictionSearchResult =
  | {
      kind: 'move';
      move: ContradictionMove;
    }
  | {
      kind: 'none';
    }
  | {
      kind: 'invalid';
    };

interface AssumptionProbeResult {
  assumption: HumanAssignment;
  deductions:
    readonly HumanProofStep[];
  contradiction: string | null;
}

export function analyzeHumanSolvability(
  level: LevelDefinition,
): HumanSolveResult {
  new PuzzleState(level);

  const state =
    new SearchState(level);

  const steps: HumanSolveStep[] = [];
  let usedContradiction = false;

  while (true) {
    const direct =
      runDirectFixedPoint(state);

    appendDirectSteps(
      steps,
      direct.steps,
    );

    if (!direct.ok) {
      return buildResult(
        HumanSolveStatus.Invalid,
        state,
        steps,
      );
    }

    if (state.isComplete()) {
      const puzzle =
        materializePuzzle(
          state,
        );

      const validation =
        validatePuzzle(puzzle);

      return buildResult(
        validation.isSolved
          ? usedContradiction
            ? HumanSolveStatus
                .SolvedWithContradiction
            : HumanSolveStatus
                .SolvedDirect
          : HumanSolveStatus.Invalid,
        state,
        steps,
      );
    }

    const contradiction =
      findContradictionMove(
        state,
      );

    if (
      contradiction.kind ===
      'invalid'
    ) {
      return buildResult(
        HumanSolveStatus.Invalid,
        state,
        steps,
      );
    }

    if (
      contradiction.kind ===
      'none'
    ) {
      return buildResult(
        HumanSolveStatus.Stuck,
        state,
        steps,
      );
    }

    const move =
      contradiction.move;

    if (
      !state.assign(
        move.assignment.position.x,
        move.assignment.position.y,
        move.assignment.value,
      )
    ) {
      return buildResult(
        HumanSolveStatus.Invalid,
        state,
        steps,
      );
    }

    steps.push({
      index: steps.length + 1,
      tier:
        HumanDeductionTier
          .Contradiction,
      rule:
        HumanRule.Contradiction,
      assignments: [
        move.assignment,
      ],
      explanation:
        `Assuming (${move.proof.assumption.position.x},${move.proof.assumption.position.y}) is ${move.proof.assumption.value.toUpperCase()} leads to a direct contradiction, so it must be ${move.assignment.value.toUpperCase()}.`,
      proof: move.proof,
    });

    usedContradiction = true;
  }
}

function appendDirectSteps(
  target: HumanSolveStep[],
  proofSteps:
    readonly HumanProofStep[],
): void {
  for (
    const step
    of proofSteps
  ) {
    target.push({
      index: target.length + 1,
      tier:
        HumanDeductionTier.Direct,
      rule: step.rule,
      assignments:
        step.assignments,
      explanation:
        step.explanation,
      proof: null,
    });
  }
}

function findContradictionMove(
  state: SearchState,
): ContradictionSearchResult {
  for (
    const position
    of state
      .getUnassignedMutablePositions()
  ) {
    const wallProbe =
      probeAssumption(
        state,
        {
          position: {
            x: position.x,
            y: position.y,
          },
          value:
            SearchCellState.Wall,
        },
      );

    const openProbe =
      probeAssumption(
        state,
        {
          position: {
            x: position.x,
            y: position.y,
          },
          value:
            SearchCellState.Open,
        },
      );

    const wallContradicts =
      wallProbe.contradiction !==
      null;
    const openContradicts =
      openProbe.contradiction !==
      null;

    if (
      wallContradicts &&
      openContradicts
    ) {
      return {
        kind: 'invalid',
      };
    }

    if (wallContradicts) {
      return {
        kind: 'move',
        move: {
          assignment: {
            position: {
              x: position.x,
              y: position.y,
            },
            value:
              SearchCellState.Open,
          },
          proof:
            buildContradictionProof(
              wallProbe,
            ),
        },
      };
    }

    if (openContradicts) {
      return {
        kind: 'move',
        move: {
          assignment: {
            position: {
              x: position.x,
              y: position.y,
            },
            value:
              SearchCellState.Wall,
          },
          proof:
            buildContradictionProof(
              openProbe,
            ),
        },
      };
    }
  }

  return {
    kind: 'none',
  };
}

function probeAssumption(
  state: SearchState,
  assumption: HumanAssignment,
): AssumptionProbeResult {
  const checkpoint =
    state.checkpoint();

  if (
    !state.assign(
      assumption.position.x,
      assumption.position.y,
      assumption.value,
    )
  ) {
    state.rollback(
      checkpoint,
    );

    return {
      assumption,
      deductions: [],
      contradiction:
        `Cannot assume ${assumption.value} at (${assumption.position.x},${assumption.position.y}).`,
    };
  }

  const direct =
    runDirectFixedPoint(state);

  let contradiction:
    string | null =
      direct.ok
        ? null
        : direct.contradiction;

  if (
    direct.ok &&
    state.isComplete()
  ) {
    const validation =
      validatePuzzle(
        materializePuzzle(
          state,
        ),
      );

    if (!validation.isSolved) {
      contradiction =
        'The complete board produced by the assumption is rejected by the canonical validator.';
    }
  }

  state.rollback(
    checkpoint,
  );

  return {
    assumption,
    deductions: direct.steps,
    contradiction,
  };
}

function buildContradictionProof(
  probe: AssumptionProbeResult,
): HumanContradictionProof {
  if (
    probe.contradiction === null
  ) {
    throw new Error(
      'Cannot build contradiction proof from a non-contradictory probe.',
    );
  }

  return {
    assumption:
      probe.assumption,
    deductions:
      probe.deductions,
    contradiction:
      probe.contradiction,
  };
}

function buildResult(
  status:
    HumanSolveResult['status'],
  state: SearchState,
  steps:
    readonly HumanSolveStep[],
): HumanSolveResult {
  const ruleCounts =
    createEmptyHumanRuleCounts();

  let assignments = 0;

  for (const step of steps) {
    ruleCounts[step.rule] += 1;
    assignments +=
      step.assignments.length;
  }

  return {
    status,
    directSteps:
      steps.filter(
        (step) =>
          step.tier ===
          HumanDeductionTier.Direct,
      ).length,
    contradictionSteps:
      steps.filter(
        (step) =>
          step.tier ===
          HumanDeductionTier
            .Contradiction,
      ).length,
    assignments,
    unknownRemaining:
      state
        .getUnassignedMutablePositions()
        .length,
    ruleCounts,
    steps,
  };
}

function materializePuzzle(
  state: SearchState,
): PuzzleState {
  const puzzle =
    new PuzzleState(
      state.level,
    );

  for (
    let y = 0;
    y < state.level.height;
    y += 1
  ) {
    for (
      let x = 0;
      x < state.level.width;
      x += 1
    ) {
      if (
        state.getCellState(x, y) !==
        SearchCellState.Wall
      ) {
        continue;
      }

      puzzle.setCellState(
        x,
        y,
        CellState.Wall,
      );
    }
  }

  return puzzle;
}
