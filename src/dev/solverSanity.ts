import { SearchState } from '../puzzle/solver/SearchState';

import {
  SearchCellState,
} from '../puzzle/solver/types';

import type {
  LevelDefinition,
} from '../puzzle/types';

interface SanityCase {
  name: string;
  run: () => void;
}

export function runSolverSanityChecks(): void {
  const cases: readonly SanityCase[] = [
    {
      name: 'search state initialization and rollback',
      run: checkSearchStateInitialization,
    },
  ];

  let passed = 0;

  console.group(
    '[Dungeon Logic] Solver sanity',
  );

  for (const sanityCase of cases) {
    try {
      sanityCase.run();
      passed += 1;

      console.info(
        `PASS: ${sanityCase.name}`,
      );
    } catch (error) {
      console.error(
        `FAIL: ${sanityCase.name}`,
        error,
      );
    }
  }

  console.info(
    `${passed}/${cases.length} checks passed`,
  );

  console.groupEnd();

  if (passed !== cases.length) {
    throw new Error(
      'Solver sanity checks failed.',
    );
  }
}

function checkSearchStateInitialization(): void {
  const level: LevelDefinition = {
    id: 'solver-search-state',
    width: 3,
    height: 3,
    rowClues: [0, 0, 0],
    columnClues: [0, 0, 0],
    monsters: [
      { x: 0, y: 0 },
    ],
    chests: [
      { x: 2, y: 0 },
    ],
    blockers: [
      { x: 0, y: 2 },
    ],
    doors: [
      {
        position: { x: 1, y: 1 },
        orientation: 'horizontal',
      },
    ],
    solution: [
      '...',
      '...',
      '...',
    ],
  };

  const state = new SearchState(level);

  assert(
    state.getCellState(0, 0) ===
      SearchCellState.Open,
    'Monster must start OPEN.',
  );

  assert(
    state.getCellState(2, 0) ===
      SearchCellState.Open,
    'Chest must start OPEN.',
  );

  assert(
    state.getCellState(1, 1) ===
      SearchCellState.Open,
    'Door must start OPEN.',
  );

  assert(
    state.getCellState(0, 2) === null,
    'Blocker must be represented as CLOSED metadata, not WALL.',
  );

  assert(
    state.getCellState(2, 2) ===
      SearchCellState.Unassigned,
    'Ordinary mutable cell must start UNASSIGNED.',
  );

  const checkpoint =
    state.checkpoint();

  assert(
    state.assign(
      2,
      2,
      SearchCellState.Wall,
    ),
    'Ordinary cell should accept WALL.',
  );

  assert(
    state.getCellState(2, 2) ===
      SearchCellState.Wall,
    'Assigned WALL should be stored.',
  );

  state.rollback(checkpoint);

  assert(
    state.getCellState(2, 2) ===
      SearchCellState.Unassigned,
    'Rollback must restore UNASSIGNED.',
  );
}

function assert(
  condition: boolean,
  message: string,
): void {
  if (!condition) {
    throw new Error(message);
  }
}
