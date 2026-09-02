import {
  validatePuzzle,
} from '../LevelValidator';

import { PuzzleState } from '../PuzzleState';

import {
  CellState,
  type GridPosition,
  type LevelDefinition,
} from '../types';

import { SearchState } from './SearchState';

import {
  SearchCellState,
  type LineStatus,
  type SolveResult,
} from './types';

interface SearchContext {
  solutionCount: 0 | 1 | 2;
  firstSolution:
    | readonly string[]
    | null;
}

export function solveLevel(
  level: LevelDefinition,
): SolveResult {
  new PuzzleState(level);

  const state =
    new SearchState(level);

  const context: SearchContext = {
    solutionCount: 0,
    firstSolution: null,
  };

  search(state, context);

  return {
    solutionCount:
      context.solutionCount,
    firstSolution:
      context.firstSolution,
  };
}

function search(
  state: SearchState,
  context: SearchContext,
): void {
  if (context.solutionCount === 2) {
    return;
  }

  const checkpoint =
    state.checkpoint();

  const propagated =
    propagateConstraints(state);

  if (
    !propagated ||
    !areLineConstraintsFeasible(
      state,
    ) ||
    !state
      .isPotentialConnectivityValid()
  ) {
    state.rollback(checkpoint);
    return;
  }

  if (state.isComplete()) {
    acceptCompleteCandidate(
      state,
      context,
    );

    state.rollback(checkpoint);
    return;
  }

  const next =
    state
      .getUnassignedMutablePositions()[0];

  if (next === undefined) {
    state.rollback(checkpoint);
    return;
  }

  branch(
    state,
    context,
    next,
    SearchCellState.Wall,
  );

  if (context.solutionCount < 2) {
    branch(
      state,
      context,
      next,
      SearchCellState.Open,
    );
  }

  state.rollback(checkpoint);
}

function branch(
  state: SearchState,
  context: SearchContext,
  position: GridPosition,
  value:
    | typeof SearchCellState.Wall
    | typeof SearchCellState.Open,
): void {
  const checkpoint =
    state.checkpoint();

  if (
    state.assign(
      position.x,
      position.y,
      value,
    )
  ) {
    search(state, context);
  }

  state.rollback(checkpoint);
}

function propagateConstraints(
  state: SearchState,
): boolean {
  let changed = true;

  while (changed) {
    const before =
      state.checkpoint();

    if (
      !propagateDoorConstraints(
        state,
      )
    ) {
      return false;
    }

    if (
      !propagateLineConstraints(
        state,
      )
    ) {
      return false;
    }

    changed =
      state.checkpoint() >
      before;
  }

  return true;
}

export function propagateDoorConstraints(
  state: SearchState,
): boolean {
  for (
    const door
    of state.level.doors
  ) {
    const {
      x,
      y,
    } = door.position;

    if (
      x <= 0 ||
      x >= state.level.width - 1 ||
      y <= 0 ||
      y >= state.level.height - 1
    ) {
      return false;
    }

    const required:
      readonly {
        x: number;
        y: number;
        value:
          | typeof SearchCellState.Wall
          | typeof SearchCellState.Open;
      }[] =
      door.orientation ===
      'horizontal'
        ? [
            {
              x: x - 1,
              y,
              value:
                SearchCellState.Open,
            },
            {
              x: x + 1,
              y,
              value:
                SearchCellState.Open,
            },
            {
              x,
              y: y - 1,
              value:
                SearchCellState.Wall,
            },
            {
              x,
              y: y + 1,
              value:
                SearchCellState.Wall,
            },
          ]
        : [
            {
              x,
              y: y - 1,
              value:
                SearchCellState.Open,
            },
            {
              x,
              y: y + 1,
              value:
                SearchCellState.Open,
            },
            {
              x: x - 1,
              y,
              value:
                SearchCellState.Wall,
            },
            {
              x: x + 1,
              y,
              value:
                SearchCellState.Wall,
            },
          ];

    for (const item of required) {
      if (
        !state.assign(
          item.x,
          item.y,
          item.value,
        )
      ) {
        return false;
      }
    }
  }

  return true;
}

function propagateLineConstraints(
  state: SearchState,
): boolean {
  let changed = true;

  while (changed) {
    changed = false;

    for (
      let y = 0;
      y < state.level.height;
      y += 1
    ) {
      const result =
        propagateLine(
          state,
          state.getRowStatus(y),
        );

      if (!result.valid) {
        return false;
      }

      changed =
        changed ||
        result.changed;
    }

    for (
      let x = 0;
      x < state.level.width;
      x += 1
    ) {
      const result =
        propagateLine(
          state,
          state.getColumnStatus(x),
        );

      if (!result.valid) {
        return false;
      }

      changed =
        changed ||
        result.changed;
    }
  }

  return true;
}

function propagateLine(
  state: SearchState,
  status: LineStatus,
): {
  valid: boolean;
  changed: boolean;
} {
  if (!isLineFeasible(status)) {
    return {
      valid: false,
      changed: false,
    };
  }

  const wallsNeeded =
    status.target -
    status.wallsPlaced;

  let changed = false;

  if (wallsNeeded === 0) {
    for (
      const position
      of status.unassigned
    ) {
      if (
        !state.assign(
          position.x,
          position.y,
          SearchCellState.Open,
        )
      ) {
        return {
          valid: false,
          changed,
        };
      }

      changed = true;
    }
  } else if (
    wallsNeeded ===
    status.unassigned.length
  ) {
    for (
      const position
      of status.unassigned
    ) {
      if (
        !state.assign(
          position.x,
          position.y,
          SearchCellState.Wall,
        )
      ) {
        return {
          valid: false,
          changed,
        };
      }

      changed = true;
    }
  }

  return {
    valid: true,
    changed,
  };
}

function isLineFeasible(
  status: LineStatus,
): boolean {
  return (
    status.wallsPlaced <=
      status.target &&
    status.wallsPlaced +
      status.unassigned.length >=
      status.target
  );
}

function areLineConstraintsFeasible(
  state: SearchState,
): boolean {
  for (
    let y = 0;
    y < state.level.height;
    y += 1
  ) {
    if (
      !isLineFeasible(
        state.getRowStatus(y),
      )
    ) {
      return false;
    }
  }

  for (
    let x = 0;
    x < state.level.width;
    x += 1
  ) {
    if (
      !isLineFeasible(
        state.getColumnStatus(x),
      )
    ) {
      return false;
    }
  }

  return true;
}

function acceptCompleteCandidate(
  state: SearchState,
  context: SearchContext,
): void {
  const puzzle =
    new PuzzleState(state.level);

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
        state.getCellState(x, y) ===
        SearchCellState.Wall
      ) {
        puzzle.setCellState(
          x,
          y,
          CellState.Wall,
        );
      }
    }
  }

  if (!validatePuzzle(puzzle).isSolved) {
    return;
  }

  const solution =
    serializeSolution(state);

  if (
    context.firstSolution === null
  ) {
    context.firstSolution = solution;
    context.solutionCount = 1;
    return;
  }

  context.solutionCount = 2;
}

function serializeSolution(
  state: SearchState,
): readonly string[] {
  const rows: string[] = [];

  for (
    let y = 0;
    y < state.level.height;
    y += 1
  ) {
    let row = '';

    for (
      let x = 0;
      x < state.level.width;
      x += 1
    ) {
      row +=
        state.getCellState(x, y) ===
        SearchCellState.Wall
          ? '#'
          : '.';
    }

    rows.push(row);
  }

  return rows;
}
