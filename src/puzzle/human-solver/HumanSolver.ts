import {
  validatePuzzle,
} from '../LevelValidator';

import { PuzzleState } from '../PuzzleState';

import {
  CellState,
  type GridPosition,
  type LevelDefinition,
} from '../types';

import {
  SearchState,
  type RoomCandidate,
} from '../solver/SearchState';

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

interface TreasureRoomVariant {
  candidate: RoomCandidate;
  entrance: GridPosition;
}

export interface TreasureRoomVariantInference {
  assignments:
    readonly HumanAssignment[];
  chest: GridPosition;
  survivingVariants: number;
  uniqueEntrance: boolean;
}

export type TreasureRoomVariantInferenceResult =
  | {
      kind: 'move';
      move: TreasureRoomVariantInference;
    }
  | {
      kind: 'none';
    }
  | {
      kind: 'invalid';
    };

export interface TreasureRoomStructuralConsensusInference {
  assignments:
    readonly HumanAssignment[];
  chest: GridPosition;
  survivingVariants: number;
  survivingFootprints: number;
}

export type TreasureRoomStructuralConsensusInferenceResult =
  | {
      kind: 'move';
      move:
        TreasureRoomStructuralConsensusInference;
    }
  | {
      kind: 'none';
    }
  | {
      kind: 'invalid';
    };

export interface TreasureRoomHypothesisConsequenceInference {
  assignments:
    readonly HumanAssignment[];
  chest: GridPosition;
  survivingVariants: number;
  survivingFootprints: number;
  directStepsMinimum: number;
  directStepsMaximum: number;
}

export type TreasureRoomHypothesisConsequenceInferenceResult =
  | {
      kind: 'move';
      move:
        TreasureRoomHypothesisConsequenceInference;
    }
  | {
      kind: 'none';
    }
  | {
      kind: 'invalid';
    };

interface TreasureRoomVariantBranch {
  candidate: RoomCandidate;
  entrance: GridPosition;
  directSteps: number;
  cells: readonly (readonly SearchSnapshotCell[])[];
}

type SearchSnapshotCell =
  | typeof SearchCellState.Unassigned
  | typeof SearchCellState.Wall
  | typeof SearchCellState.Open
  | null;

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
      'move'
    ) {
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
      continue;
    }

    const roomVariant =
      findTreasureRoomVariantInference(
        state,
      );

    if (
      roomVariant.kind ===
      'invalid'
    ) {
      return buildResult(
        HumanSolveStatus.Invalid,
        state,
        steps,
      );
    }

    if (
      roomVariant.kind ===
      'move'
    ) {
      const roomMove =
        roomVariant.move;

      if (
        !applyAssignments(
          state,
          roomMove.assignments,
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
          HumanRule
            .TreasureRoomVariant,
        assignments:
          roomMove.assignments,
        explanation:
          roomMove.uniqueEntrance
            ? `Testing every viable Treasure Room plus its sole entrance for Chest at (${roomMove.chest.x},${roomMove.chest.y}) leaves exactly one full room-and-entrance variant, so its room and boundary are forced.`
            : `Testing every viable Treasure Room plus its sole entrance for Chest at (${roomMove.chest.x},${roomMove.chest.y}) leaves ${roomMove.survivingVariants} variants that all share one 3x3 footprint, so that room interior is forced OPEN.`,
        proof: null,
      });

      usedContradiction = true;
      continue;
    }

    const structuralConsensus =
      findTreasureRoomStructuralConsensusInference(
        state,
      );

    if (
      structuralConsensus.kind ===
      'invalid'
    ) {
      return buildResult(
        HumanSolveStatus.Invalid,
        state,
        steps,
      );
    }

    if (
      structuralConsensus.kind ===
      'move'
    ) {
      const move =
        structuralConsensus.move;

      if (
        !applyAssignments(
          state,
          move.assignments,
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
          HumanRule
            .TreasureRoomStructuralConsensus,
        assignments:
          move.assignments,
        explanation:
          `Testing every direct-surviving Treasure Room plus sole entrance for Chest at (${move.chest.x},${move.chest.y}) leaves ${move.survivingVariants} variants across ${move.survivingFootprints} footprints; the committed cells have the same structural OPEN/WALL requirement in every survivor.`,
        proof: null,
      });

      usedContradiction = true;
      continue;
    }

    const consequence =
      findTreasureRoomHypothesisConsequenceInference(
        state,
      );

    if (
      consequence.kind ===
      'invalid'
    ) {
      return buildResult(
        HumanSolveStatus.Invalid,
        state,
        steps,
      );
    }

    if (
      consequence.kind ===
      'move'
    ) {
      const move =
        consequence.move;

      if (
        !applyAssignments(
          state,
          move.assignments,
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
          HumanRule
            .TreasureRoomHypothesisConsequence,
        assignments:
          move.assignments,
        explanation:
          `Testing all ${move.survivingVariants} direct-surviving Treasure Room hypotheses for Chest at (${move.chest.x},${move.chest.y}) across ${move.survivingFootprints} footprints produces the same downstream cell states after direct closure (${move.directStepsMinimum}..${move.directStepsMaximum} direct steps per survivor), so those shared consequences are forced.`,
        proof: null,
      });

      usedContradiction = true;
      continue;
    }

    return buildResult(
      HumanSolveStatus.Stuck,
      state,
      steps,
    );
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

export function findTreasureRoomVariantInference(
  state: SearchState,
): TreasureRoomVariantInferenceResult {
  for (
    const chest
    of state.level.chests
  ) {
    const candidates =
      state
        .getViableTreasureRoomCandidates(
          chest,
        );

    if (candidates.length === 0) {
      return {
        kind: 'invalid',
      };
    }

    const surviving:
      TreasureRoomVariant[] = [];

    for (
      const candidate
      of candidates
    ) {
      for (
        const entrance
        of candidate.boundary
      ) {
        if (
          treasureRoomVariantSurvives(
            state,
            candidate,
            entrance,
          )
        ) {
          surviving.push({
            candidate,
            entrance,
          });
        }
      }
    }

    if (surviving.length === 0) {
      return {
        kind: 'invalid',
      };
    }

    const footprintKeys =
      new Set(
        surviving.map(
          (variant) =>
            roomFootprintKey(
              variant.candidate,
            ),
        ),
      );

    if (footprintKeys.size !== 1) {
      continue;
    }

    const onlyVariant =
      surviving.length === 1
        ? surviving[0]
        : null;

    const assignments =
      onlyVariant === null
        ? collectRoomInteriorAssignments(
            state,
            surviving[0]
              .candidate,
          )
        : collectFullRoomVariantAssignments(
            state,
            onlyVariant.candidate,
            onlyVariant.entrance,
          );

    if (assignments.length === 0) {
      continue;
    }

    return {
      kind: 'move',
      move: {
        assignments,
        chest: {
          x: chest.x,
          y: chest.y,
        },
        survivingVariants:
          surviving.length,
        uniqueEntrance:
          onlyVariant !== null,
      },
    };
  }

  return {
    kind: 'none',
  };
}

export function findTreasureRoomStructuralConsensusInference(
  state: SearchState,
): TreasureRoomStructuralConsensusInferenceResult {
  for (
    const chest
    of state.level.chests
  ) {
    const branches =
      collectSurvivingTreasureRoomBranches(
        state,
        chest,
      );

    if (branches.kind !== 'ok') {
      return branches;
    }

    const assignments =
      collectStructuralConsensusAssignments(
        state,
        branches.variants,
      );

    if (assignments.length === 0) {
      continue;
    }

    return {
      kind: 'move',
      move: {
        assignments,
        chest: clonePosition(chest),
        survivingVariants:
          branches.variants.length,
        survivingFootprints:
          countDistinctFootprints(
            branches.variants,
          ),
      },
    };
  }

  return { kind: 'none' };
}

export function findTreasureRoomHypothesisConsequenceInference(
  state: SearchState,
): TreasureRoomHypothesisConsequenceInferenceResult {
  const baseline =
    snapshotSearchState(state);

  for (
    const chest
    of state.level.chests
  ) {
    const branches =
      collectSurvivingTreasureRoomBranches(
        state,
        chest,
      );

    if (branches.kind !== 'ok') {
      return branches;
    }

    const assignments =
      collectConsequenceConsensusAssignments(
        state,
        baseline,
        branches.variants,
      );

    if (assignments.length === 0) {
      continue;
    }

    const directStepCounts =
      branches.variants.map(
        (branch) =>
          branch.directSteps,
      );

    return {
      kind: 'move',
      move: {
        assignments,
        chest: clonePosition(chest),
        survivingVariants:
          branches.variants.length,
        survivingFootprints:
          countDistinctFootprints(
            branches.variants,
          ),
        directStepsMinimum:
          Math.min(
            ...directStepCounts,
          ),
        directStepsMaximum:
          Math.max(
            ...directStepCounts,
          ),
      },
    };
  }

  return { kind: 'none' };
}

type SurvivingTreasureRoomBranchesResult =
  | {
      kind: 'ok';
      variants:
        readonly TreasureRoomVariantBranch[];
    }
  | {
      kind: 'invalid';
    };

function collectSurvivingTreasureRoomBranches(
  state: SearchState,
  chest: GridPosition,
): SurvivingTreasureRoomBranchesResult {
  const candidates =
    state
      .getViableTreasureRoomCandidates(
        chest,
      );

  if (candidates.length === 0) {
    return { kind: 'invalid' };
  }

  const variants:
    TreasureRoomVariantBranch[] = [];

  for (
    const candidate
    of candidates
  ) {
    for (
      const entrance
      of candidate.boundary
    ) {
      const branch =
        evaluateTreasureRoomVariantBranch(
          state,
          candidate,
          entrance,
        );

      if (branch !== null) {
        variants.push(branch);
      }
    }
  }

  if (variants.length === 0) {
    return { kind: 'invalid' };
  }

  return {
    kind: 'ok',
    variants,
  };
}

function evaluateTreasureRoomVariantBranch(
  state: SearchState,
  candidate: RoomCandidate,
  entrance: GridPosition,
): TreasureRoomVariantBranch | null {
  const checkpoint =
    state.checkpoint();

  if (
    !applyTreasureRoomVariant(
      state,
      candidate,
      entrance,
    )
  ) {
    state.rollback(checkpoint);
    return null;
  }

  const direct =
    runDirectFixedPoint(state);

  let survives =
    direct.ok;

  if (
    survives &&
    state.isComplete()
  ) {
    survives =
      validatePuzzle(
        materializePuzzle(state),
      ).isSolved;
  }

  const branch =
    survives
      ? {
          candidate,
          entrance:
            clonePosition(entrance),
          directSteps:
            direct.steps.length,
          cells:
            snapshotSearchState(
              state,
            ),
        }
      : null;

  state.rollback(checkpoint);

  return branch;
}

function collectStructuralConsensusAssignments(
  state: SearchState,
  branches:
    readonly TreasureRoomVariantBranch[],
): readonly HumanAssignment[] {
  const requirementMaps =
    branches.map(
      (branch) =>
        structuralRequirements(
          branch,
        ),
    );

  const assignments:
    HumanAssignment[] = [];

  for (
    const [key, value]
    of requirementMaps[0]
  ) {
    if (
      !requirementMaps.every(
        (requirements) =>
          requirements.get(key) ===
          value,
      )
    ) {
      continue;
    }

    const position =
      parsePositionKey(key);

    if (
      !state.isMutableCell(
        position.x,
        position.y,
      ) ||
      state.getCellState(
        position.x,
        position.y,
      ) !==
        SearchCellState.Unassigned
    ) {
      continue;
    }

    assignments.push({
      position,
      value,
    });
  }

  assignments.sort(
    compareAssignments,
  );

  return assignments;
}

function collectConsequenceConsensusAssignments(
  state: SearchState,
  baseline:
    readonly (readonly SearchSnapshotCell[])[],
  branches:
    readonly TreasureRoomVariantBranch[],
): readonly HumanAssignment[] {
  const assignments:
    HumanAssignment[] = [];

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
        baseline[y][x] !==
          SearchCellState.Unassigned ||
        !state.isMutableCell(x, y)
      ) {
        continue;
      }

      const first =
        branches[0].cells[y][x];

      if (
        first !==
          SearchCellState.Wall &&
        first !==
          SearchCellState.Open
      ) {
        continue;
      }

      if (
        branches.every(
          (branch) =>
            branch.cells[y][x] ===
            first,
        )
      ) {
        assignments.push({
          position: { x, y },
          value: first,
        });
      }
    }
  }

  return assignments;
}

function structuralRequirements(
  branch: TreasureRoomVariantBranch,
): ReadonlyMap<
  string,
  | typeof SearchCellState.Open
  | typeof SearchCellState.Wall
> {
  const result =
    new Map<
      string,
      | typeof SearchCellState.Open
      | typeof SearchCellState.Wall
    >();

  for (
    const position
    of branch.candidate.cells
  ) {
    result.set(
      positionKey(position),
      SearchCellState.Open,
    );
  }

  for (
    const position
    of branch.candidate.boundary
  ) {
    result.set(
      positionKey(position),
      samePosition(
        position,
        branch.entrance,
      )
        ? SearchCellState.Open
        : SearchCellState.Wall,
    );
  }

  return result;
}

function snapshotSearchState(
  state: SearchState,
): readonly (readonly SearchSnapshotCell[])[] {
  const rows:
    SearchSnapshotCell[][] = [];

  for (
    let y = 0;
    y < state.level.height;
    y += 1
  ) {
    const row:
      SearchSnapshotCell[] = [];

    for (
      let x = 0;
      x < state.level.width;
      x += 1
    ) {
      row.push(
        state.getCellState(x, y),
      );
    }

    rows.push(row);
  }

  return rows;
}

function countDistinctFootprints(
  branches:
    readonly TreasureRoomVariantBranch[],
): number {
  return new Set(
    branches.map(
      (branch) =>
        roomFootprintKey(
          branch.candidate,
        ),
    ),
  ).size;
}

function applyAssignments(
  state: SearchState,
  assignments:
    readonly HumanAssignment[],
): boolean {
  for (
    const assignment
    of assignments
  ) {
    if (
      !state.assign(
        assignment.position.x,
        assignment.position.y,
        assignment.value,
      )
    ) {
      return false;
    }
  }

  return true;
}

function positionKey(
  position: GridPosition,
): string {
  return `${position.x}:${position.y}`;
}

function parsePositionKey(
  key: string,
): GridPosition {
  const [x, y] =
    key.split(':').map(Number);

  return { x, y };
}

function clonePosition(
  position: GridPosition,
): GridPosition {
  return {
    x: position.x,
    y: position.y,
  };
}

function samePosition(
  left: GridPosition,
  right: GridPosition,
): boolean {
  return (
    left.x === right.x &&
    left.y === right.y
  );
}

function compareAssignments(
  left: HumanAssignment,
  right: HumanAssignment,
): number {
  return (
    left.position.y -
      right.position.y ||
    left.position.x -
      right.position.x
  );
}

function treasureRoomVariantSurvives(
  state: SearchState,
  candidate: RoomCandidate,
  entrance: GridPosition,
): boolean {
  const checkpoint =
    state.checkpoint();

  const applied =
    applyTreasureRoomVariant(
      state,
      candidate,
      entrance,
    );

  if (!applied) {
    state.rollback(
      checkpoint,
    );
    return false;
  }

  const direct =
    runDirectFixedPoint(
      state,
    );

  let survives =
    direct.ok;

  if (
    survives &&
    state.isComplete()
  ) {
    survives =
      validatePuzzle(
        materializePuzzle(
          state,
        ),
      ).isSolved;
  }

  state.rollback(
    checkpoint,
  );

  return survives;
}

function applyTreasureRoomVariant(
  state: SearchState,
  candidate: RoomCandidate,
  entrance: GridPosition,
): boolean {
  for (
    const position
    of candidate.cells
  ) {
    if (
      !applyVariantRequirement(
        state,
        position,
        SearchCellState.Open,
        false,
      )
    ) {
      return false;
    }
  }

  for (
    const position
    of candidate.boundary
  ) {
    const isEntrance =
      position.x === entrance.x &&
      position.y === entrance.y;

    if (
      !applyVariantRequirement(
        state,
        position,
        isEntrance
          ? SearchCellState.Open
          : SearchCellState.Wall,
        !isEntrance,
      )
    ) {
      return false;
    }
  }

  return true;
}

function applyVariantRequirement(
  state: SearchState,
  position: GridPosition,
  value:
    | typeof SearchCellState.Open
    | typeof SearchCellState.Wall,
  blockerMayClose: boolean,
): boolean {
  const current =
    state.getCellState(
      position.x,
      position.y,
    );

  if (current === value) {
    return true;
  }

  if (current === null) {
    return (
      blockerMayClose &&
      value ===
        SearchCellState.Wall
    );
  }

  if (
    current !==
      SearchCellState.Unassigned ||
    !state.isMutableCell(
      position.x,
      position.y,
    )
  ) {
    return false;
  }

  return state.assign(
    position.x,
    position.y,
    value,
  );
}

function collectRoomInteriorAssignments(
  state: SearchState,
  candidate: RoomCandidate,
): readonly HumanAssignment[] {
  const assignments:
    HumanAssignment[] = [];

  for (
    const position
    of candidate.cells
  ) {
    if (
      state.getCellState(
        position.x,
        position.y,
      ) !==
        SearchCellState.Unassigned ||
      !state.isMutableCell(
        position.x,
        position.y,
      )
    ) {
      continue;
    }

    assignments.push({
      position: {
        x: position.x,
        y: position.y,
      },
      value:
        SearchCellState.Open,
    });
  }

  return assignments;
}

function collectFullRoomVariantAssignments(
  state: SearchState,
  candidate: RoomCandidate,
  entrance: GridPosition,
): readonly HumanAssignment[] {
  const assignments = [
    ...collectRoomInteriorAssignments(
      state,
      candidate,
    ),
  ];

  for (
    const position
    of candidate.boundary
  ) {
    if (
      state.getCellState(
        position.x,
        position.y,
      ) !==
        SearchCellState.Unassigned ||
      !state.isMutableCell(
        position.x,
        position.y,
      )
    ) {
      continue;
    }

    const isEntrance =
      position.x === entrance.x &&
      position.y === entrance.y;

    assignments.push({
      position: {
        x: position.x,
        y: position.y,
      },
      value:
        isEntrance
          ? SearchCellState.Open
          : SearchCellState.Wall,
    });
  }

  return assignments;
}

function roomFootprintKey(
  candidate: RoomCandidate,
): string {
  const topLeft =
    candidate.cells[0];

  return (
    `${topLeft.x}:${topLeft.y}`
  );
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
