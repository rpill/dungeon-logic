import { levels } from '../data/levels';

import {
  validatePuzzle,
} from '../puzzle/LevelValidator';

import { PuzzleState } from '../puzzle/PuzzleState';

import {
  propagateDoorConstraints,
  solveLevel,
} from '../puzzle/solver/PuzzleSolver';

import { SearchState } from '../puzzle/solver/SearchState';

import {
  SearchCellState,
} from '../puzzle/solver/types';

import {
  CellState,
  type LevelDefinition,
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
    {
      name: 'unique 3x3 solver fixture',
      run: checkUniqueFixture,
    },
    {
      name: 'unsolvable 4x4 solver fixture',
      run: checkUnsolvableFixture,
    },
    {
      name: 'ambiguous solver stops at 2+',
      run: checkAmbiguousFixture,
    },
    {
      name: 'malformed fixed metadata throws',
      run: checkMalformedLevelThrows,
    },
    {
      name: 'directional door propagation',
      run: checkDirectionalDoorPropagation,
    },
    {
      name: 'registered level diversity batch',
      run: checkRegisteredLevelDiversityBatch,
    },
    {
      name: 'registered levels are unique',
      run: checkCurrentLevelsUnique,
    },
    {
      name: 'blocker cannot frame solver door',
      run: checkSolverRejectsBlockerDoorFrame,
    },
    {
      name: 'potential connectivity pruning',
      run: checkPotentialConnectivity,
    },
    {
      name: 'treasure room candidate pruning',
      run: checkTreasureRoomCandidatePruning,
    },
    {
      name: 'most constrained tie break is deterministic',
      run: checkMostConstrainedTieBreak,
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

function checkUniqueFixture(): void {
  const level: LevelDefinition = {
    id: 'solver-unique-3x3',
    width: 3,
    height: 3,
    rowClues: [0, 1, 0],
    columnClues: [0, 1, 0],
    monsters: [],
    chests: [],
    blockers: [],
    doors: [],
    solution: [
      '###',
      '###',
      '###',
    ],
  };

  const result =
    solveLevel(level);

  assert(
    result.solutionCount === 1,
    '3x3 fixture must be unique.',
  );

  assert(
    arraysEqual(
      result.firstSolution,
      [
        '...',
        '.#.',
        '...',
      ],
    ),
    'Unique fixture should return the center-wall solution.',
  );

  assertFirstSolutionValid(
    level,
    result.firstSolution,
  );
}

function checkUnsolvableFixture(): void {
  const level: LevelDefinition = {
    id: 'solver-unsolvable-4x4',
    width: 4,
    height: 4,
    rowClues: [0, 0, 0, 0],
    columnClues: [0, 0, 0, 0],
    monsters: [],
    chests: [],
    blockers: [],
    doors: [],
    solution: [
      '####',
      '####',
      '####',
      '####',
    ],
  };

  const result =
    solveLevel(level);

  assert(
    result.solutionCount === 0,
    'Fully open 4x4 must be rejected by dungeon rules.',
  );

  assert(
    result.firstSolution === null,
    '0-solution result must have null firstSolution.',
  );
}

function checkAmbiguousFixture(): void {
  const level: LevelDefinition = {
    id: 'solver-ambiguous-4x4',
    width: 4,
    height: 4,
    rowClues: [1, 1, 1, 1],
    columnClues: [1, 1, 1, 1],
    monsters: [],
    chests: [],
    blockers: [],
    doors: [],
    solution: [
      '....',
      '....',
      '....',
      '....',
    ],
  };

  const result =
    solveLevel(level);

  assert(
    result.solutionCount === 2,
    'Ambiguous fixture must clamp at 2 meaning 2+.',
  );

  assert(
    result.firstSolution !== null,
    'Ambiguous result must retain firstSolution.',
  );

  assertFirstSolutionValid(
    level,
    result.firstSolution,
  );

  const repeated =
    solveLevel(level);

  assert(
    repeated.solutionCount ===
      result.solutionCount,
    'Repeated deterministic solve must return the same count.',
  );

  assert(
    arraysEqual(
      repeated.firstSolution,
      result.firstSolution ?? [],
    ),
    'Repeated deterministic solve must return the same firstSolution.',
  );
}

function checkMalformedLevelThrows(): void {
  const level: LevelDefinition = {
    id: 'solver-malformed-overlap',
    width: 2,
    height: 2,
    rowClues: [0, 0],
    columnClues: [0, 0],
    monsters: [
      { x: 0, y: 0 },
    ],
    chests: [],
    blockers: [
      { x: 0, y: 0 },
    ],
    doors: [],
    solution: [
      '..',
      '..',
    ],
  };

  let threw = false;

  try {
    solveLevel(level);
  } catch {
    threw = true;
  }

  assert(
    threw,
    'Malformed fixed metadata must throw instead of returning 0.',
  );
}

function checkDirectionalDoorPropagation(): void {
  const level: LevelDefinition = {
    id: 'solver-door-propagation',
    width: 3,
    height: 3,
    rowClues: [1, 0, 1],
    columnClues: [0, 2, 0],
    monsters: [],
    chests: [],
    blockers: [],
    doors: [
      {
        position: {
          x: 1,
          y: 1,
        },
        orientation: 'horizontal',
      },
    ],
    solution: [
      '.#.',
      '...',
      '.#.',
    ],
  };

  const state =
    new SearchState(level);

  assert(
    propagateDoorConstraints(state),
    'Valid horizontal door propagation should succeed.',
  );

  assert(
    state.getCellState(0, 1) ===
      SearchCellState.Open,
    'Horizontal door left neighbor must become OPEN.',
  );

  assert(
    state.getCellState(2, 1) ===
      SearchCellState.Open,
    'Horizontal door right neighbor must become OPEN.',
  );

  assert(
    state.getCellState(1, 0) ===
      SearchCellState.Wall,
    'Horizontal door upper neighbor must become WALL.',
  );

  assert(
    state.getCellState(1, 2) ===
      SearchCellState.Wall,
    'Horizontal door lower neighbor must become WALL.',
  );
}

function checkRegisteredLevelDiversityBatch(): void {
  assert(
    levels.length === 12,
    'Expected level001 through level012 to be registered.',
  );

  for (
    let index = 0;
    index < levels.length;
    index += 1
  ) {
    const expectedId =
      `level-${String(index + 1).padStart(3, '0')}`;

    assert(
      levels[index].id === expectedId,
      `Expected ${expectedId} at level index ${index}.`,
    );
  }
}

function checkCurrentLevelsUnique(): void {
  for (const level of levels) {
    const result =
      solveLevel(level);

    assert(
      result.solutionCount === 1,
      `${level.id} should have exactly one solution.`,
    );

    assertFirstSolutionValid(
      level,
      result.firstSolution,
    );
  }
}

function checkSolverRejectsBlockerDoorFrame(): void {
  const level: LevelDefinition = {
    id: 'solver-blocker-door-frame',
    width: 3,
    height: 3,
    rowClues: [0, 0, 0],
    columnClues: [0, 0, 0],
    monsters: [],
    chests: [],
    blockers: [
      { x: 1, y: 0 },
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

  const state =
    new SearchState(level);

  assert(
    !propagateDoorConstraints(state),
    'Blocker must not satisfy a door framing WALL during propagation.',
  );

  const result =
    solveLevel(level);

  assert(
    result.solutionCount === 0,
    'Blocker-framed door level must have no solution.',
  );
}

function checkPotentialConnectivity(): void {
  const level: LevelDefinition = {
    id: 'solver-connectivity-prune',
    width: 3,
    height: 3,
    rowClues: [0, 0, 0],
    columnClues: [0, 0, 0],
    monsters: [],
    chests: [],
    blockers: [],
    doors: [],
    solution: [
      '...',
      '...',
      '...',
    ],
  };

  const blocked =
    new SearchState(level);

  assert(
    blocked.assign(
      0,
      1,
      SearchCellState.Open,
    ),
    'Left OPEN assignment should succeed.',
  );

  assert(
    blocked.assign(
      2,
      1,
      SearchCellState.Open,
    ),
    'Right OPEN assignment should succeed.',
  );

  for (const y of [0, 1, 2]) {
    assert(
      blocked.assign(
        1,
        y,
        SearchCellState.Wall,
      ),
      'Barrier WALL assignment should succeed.',
    );
  }

  assert(
    !blocked.isPotentialConnectivityValid(),
    'Mandatory OPEN regions separated by permanent WALLs must be impossible.',
  );

  const possible =
    new SearchState(level);

  assert(
    possible.assign(
      0,
      1,
      SearchCellState.Open,
    ),
    'Left OPEN assignment should succeed.',
  );

  assert(
    possible.assign(
      2,
      1,
      SearchCellState.Open,
    ),
    'Right OPEN assignment should succeed.',
  );

  assert(
    possible.assign(
      1,
      0,
      SearchCellState.Wall,
    ),
    'Top barrier WALL should succeed.',
  );

  assert(
    possible.assign(
      1,
      2,
      SearchCellState.Wall,
    ),
    'Bottom barrier WALL should succeed.',
  );

  assert(
    possible.isPotentialConnectivityValid(),
    'UNASSIGNED center must remain a possible bridge.',
  );
}

function checkTreasureRoomCandidatePruning(): void {
  const level: LevelDefinition = {
    id: 'solver-room-candidate',
    width: 3,
    height: 3,
    rowClues: [0, 0, 0],
    columnClues: [0, 0, 0],
    monsters: [],
    chests: [
      { x: 1, y: 1 },
    ],
    blockers: [],
    doors: [],
    solution: [
      '...',
      '...',
      '...',
    ],
  };

  const state =
    new SearchState(level);

  assert(
    state
      .hasTreasureRoomCandidateForEveryChest(),
    'Open 3x3 must provide one candidate for center chest.',
  );

  assert(
    state.assign(
      0,
      0,
      SearchCellState.Wall,
    ),
    'Room test WALL assignment should succeed.',
  );

  assert(
    !state
      .hasTreasureRoomCandidateForEveryChest(),
    'WALL inside the only 3x3 room must remove the final candidate.',
  );
}

function checkMostConstrainedTieBreak(): void {
  const level: LevelDefinition = {
    id: 'solver-branch-tie',
    width: 3,
    height: 3,
    rowClues: [1, 1, 1],
    columnClues: [1, 1, 1],
    monsters: [],
    chests: [],
    blockers: [],
    doors: [],
    solution: [
      '...',
      '...',
      '...',
    ],
  };

  const state =
    new SearchState(level);

  const selected =
    state.selectMostConstrainedCell();

  assert(
    selected?.x === 0 &&
      selected.y === 0,
    'Equal scores must use stable y -> x tie break.',
  );
}

function assertFirstSolutionValid(
  level: LevelDefinition,
  board: readonly string[] | null,
): void {
  assert(
    board !== null,
    'Expected firstSolution.',
  );

  if (board === null) {
    return;
  }

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
      if (board[y][x] === '#') {
        puzzle.setCellState(
          x,
          y,
          CellState.Wall,
        );
      }
    }
  }

  assert(
    validatePuzzle(puzzle).isSolved,
    'firstSolution must pass LevelValidator.',
  );
}

function arraysEqual(
  actual: readonly string[] | null,
  expected: readonly string[],
): boolean {
  if (
    actual === null ||
    actual.length !== expected.length
  ) {
    return false;
  }

  return actual.every(
    (row, index) =>
      row === expected[index],
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
