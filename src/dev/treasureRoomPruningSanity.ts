import {
  propagateConstraints,
  propagateTreasureRoomConstraints,
} from '../puzzle/solver/PuzzleSolver';

import { SearchState } from '../puzzle/solver/SearchState';

import {
  SearchCellState,
} from '../puzzle/solver/types';

import type {
  LevelDefinition,
} from '../puzzle/types';

function assert(
  condition: boolean,
  message: string,
): void {
  if (!condition) {
    throw new Error(message);
  }
}

function checkTwoConfirmedEntrancesInvalidateRoom():
  void {
  const level: LevelDefinition = {
    id: 'solver-room-two-entrances',
    width: 4,
    height: 4,
    rowClues: [0, 0, 0, 0],
    columnClues: [0, 0, 0, 0],
    monsters: [],
    chests: [
      {
        x: 0,
        y: 0,
      },
    ],
    blockers: [],
    doors: [],
    solution: [
      '....',
      '....',
      '....',
      '....',
    ],
  };

  const state =
    new SearchState(level);

  assert(
    state
      .hasTreasureRoomCandidateForEveryChest(),
    'The corner Chest should initially have one viable 3x3 room candidate.',
  );

  assert(
    state.assign(
      3,
      0,
      SearchCellState.Open,
    ),
    'First boundary OPEN assignment should succeed.',
  );

  assert(
    state.assign(
      0,
      3,
      SearchCellState.Open,
    ),
    'Second boundary OPEN assignment should succeed.',
  );

  assert(
    !state
      .hasTreasureRoomCandidateForEveryChest(),
    'Two confirmed entrances must invalidate the only Treasure Room candidate.',
  );
}

function checkSingletonRoomForcesInteriorOpen():
  void {
  const level: LevelDefinition = {
    id: 'solver-room-singleton-open',
    width: 4,
    height: 4,
    rowClues: [0, 0, 0, 0],
    columnClues: [0, 0, 0, 0],
    monsters: [],
    chests: [
      {
        x: 0,
        y: 0,
      },
    ],
    blockers: [],
    doors: [],
    solution: [
      '....',
      '....',
      '....',
      '....',
    ],
  };

  const state =
    new SearchState(level);

  assert(
    propagateTreasureRoomConstraints(
      state,
    ),
    'Singleton Treasure Room propagation should remain feasible.',
  );

  for (let y = 0; y < 3; y += 1) {
    for (let x = 0; x < 3; x += 1) {
      assert(
        state.getCellState(x, y) ===
          SearchCellState.Open,
        `Singleton Treasure Room must force interior cell (${x}, ${y}) OPEN.`,
      );
    }
  }
}

function checkSolverFixedPointIncludesRoomPropagation():
  void {
  const level: LevelDefinition = {
    id: 'solver-room-fixed-point',
    width: 4,
    height: 4,
    rowClues: [1, 0, 1, 3],
    columnClues: [1, 1, 1, 2],
    monsters: [],
    chests: [
      {
        x: 0,
        y: 0,
      },
    ],
    blockers: [],
    doors: [],
    solution: [
      '...#',
      '....',
      '...#',
      '###.',
    ],
  };

  const state =
    new SearchState(level);

  assert(
    state.getCellState(2, 2) ===
      SearchCellState.Unassigned,
    'The checked interior cell must not start forced OPEN.',
  );

  assert(
    propagateConstraints(state),
    'Solver fixed-point propagation should remain feasible.',
  );

  assert(
    state.getCellState(2, 2) ===
      SearchCellState.Open,
    'Solver fixed-point must include Treasure Room propagation.',
  );
}


function checkConfirmedEntranceClosesBoundary():
  void {
  const level: LevelDefinition = {
    id: 'solver-room-close-boundary',
    width: 4,
    height: 4,
    rowClues: [0, 0, 0, 0],
    columnClues: [0, 0, 0, 0],
    monsters: [],
    chests: [
      {
        x: 0,
        y: 0,
      },
    ],
    blockers: [],
    doors: [],
    solution: [
      '....',
      '....',
      '....',
      '....',
    ],
  };

  const state =
    new SearchState(level);

  assert(
    state.assign(
      3,
      1,
      SearchCellState.Open,
    ),
    'Confirmed entrance OPEN assignment should succeed.',
  );

  assert(
    propagateTreasureRoomConstraints(
      state,
    ),
    'Confirmed entrance propagation should remain feasible.',
  );

  for (
    const position
    of [
      { x: 3, y: 0 },
      { x: 3, y: 2 },
      { x: 0, y: 3 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
    ]
  ) {
    assert(
      state.getCellState(
        position.x,
        position.y,
      ) === SearchCellState.Wall,
      `Confirmed entrance must force boundary cell (${position.x}, ${position.y}) WALL.`,
    );
  }

  assert(
    state.getCellState(3, 1) ===
      SearchCellState.Open,
    'Confirmed entrance must remain OPEN.',
  );
}

function checkLastPossibleEntranceForcedOpen():
  void {
  const level: LevelDefinition = {
    id: 'solver-room-last-entrance',
    width: 4,
    height: 4,
    rowClues: [0, 0, 0, 0],
    columnClues: [0, 0, 0, 0],
    monsters: [],
    chests: [
      {
        x: 0,
        y: 0,
      },
    ],
    blockers: [],
    doors: [],
    solution: [
      '....',
      '....',
      '....',
      '....',
    ],
  };

  const state =
    new SearchState(level);

  for (
    const position
    of [
      { x: 3, y: 0 },
      { x: 3, y: 1 },
      { x: 3, y: 2 },
      { x: 0, y: 3 },
      { x: 1, y: 3 },
    ]
  ) {
    assert(
      state.assign(
        position.x,
        position.y,
        SearchCellState.Wall,
      ),
      `Boundary WALL assignment (${position.x}, ${position.y}) should succeed.`,
    );
  }

  assert(
    state.getCellState(2, 3) ===
      SearchCellState.Unassigned,
    'Last possible entrance must start UNASSIGNED.',
  );

  assert(
    propagateTreasureRoomConstraints(
      state,
    ),
    'Last possible entrance propagation should remain feasible.',
  );

  assert(
    state.getCellState(2, 3) ===
      SearchCellState.Open,
    'The final possible Treasure Room entrance must be forced OPEN.',
  );
}

function checkBlockerClosesBoundaryWithoutWall():
  void {
  const level: LevelDefinition = {
    id: 'solver-room-blocker-boundary',
    width: 4,
    height: 4,
    rowClues: [0, 0, 0, 0],
    columnClues: [0, 0, 0, 0],
    monsters: [],
    chests: [
      {
        x: 0,
        y: 0,
      },
    ],
    blockers: [
      {
        x: 3,
        y: 0,
      },
    ],
    doors: [],
    solution: [
      '....',
      '....',
      '....',
      '....',
    ],
  };

  const state =
    new SearchState(level);

  assert(
    state.getCellState(3, 0) === null,
    'Boundary blocker must remain CLOSED metadata, not WALL.',
  );

  for (
    const position
    of [
      { x: 3, y: 1 },
      { x: 3, y: 2 },
      { x: 0, y: 3 },
      { x: 1, y: 3 },
    ]
  ) {
    assert(
      state.assign(
        position.x,
        position.y,
        SearchCellState.Wall,
      ),
      `Boundary WALL assignment (${position.x}, ${position.y}) should succeed.`,
    );
  }

  assert(
    propagateTreasureRoomConstraints(
      state,
    ),
    'Blocker-aware entrance propagation should remain feasible.',
  );

  assert(
    state.getCellState(2, 3) ===
      SearchCellState.Open,
    'A blocker must count CLOSED so the last mutable entrance is forced OPEN.',
  );

  assert(
    state.getCellState(3, 0) === null,
    'Treasure Room propagation must never convert blocker metadata into WALL.',
  );
}

function checkDoorCountsAsConfirmedEntrance():
  void {
  const level: LevelDefinition = {
    id: 'solver-room-door-entrance',
    width: 5,
    height: 5,
    rowClues: [0, 0, 0, 0, 0],
    columnClues: [0, 0, 0, 0, 0],
    monsters: [],
    chests: [
      {
        x: 0,
        y: 0,
      },
    ],
    blockers: [],
    doors: [
      {
        position: {
          x: 3,
          y: 1,
        },
        orientation: 'vertical',
      },
    ],
    solution: [
      '.....',
      '.....',
      '.....',
      '.....',
      '.....',
    ],
  };

  const state =
    new SearchState(level);

  assert(
    state.getCellState(3, 1) ===
      SearchCellState.Open,
    'Directional Door outside the room must start OPEN.',
  );

  assert(
    propagateTreasureRoomConstraints(
      state,
    ),
    'Door entrance propagation should remain feasible.',
  );

  for (
    const position
    of [
      { x: 3, y: 0 },
      { x: 3, y: 2 },
      { x: 0, y: 3 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
    ]
  ) {
    assert(
      state.getCellState(
        position.x,
        position.y,
      ) === SearchCellState.Wall,
      `Door as confirmed entrance must force boundary cell (${position.x}, ${position.y}) WALL.`,
    );
  }

  assert(
    state.getCellState(3, 1) ===
      SearchCellState.Open,
    'Directional Door must remain the confirmed OPEN entrance.',
  );
}

function main(): void {
  console.info(
    '[Dungeon Logic] Treasure room pruning sanity',
  );

  const cases:
    readonly {
      name: string;
      run: () => void;
    }[] = [
      {
        name:
          'two confirmed entrances invalidate room',
        run:
          checkTwoConfirmedEntrancesInvalidateRoom,
      },
      {
        name:
          'singleton room forces interior open',
        run:
          checkSingletonRoomForcesInteriorOpen,
      },
      {
        name:
          'solver fixed-point includes room propagation',
        run:
          checkSolverFixedPointIncludesRoomPropagation,
      },
      {
        name:
          'confirmed entrance closes boundary',
        run:
          checkConfirmedEntranceClosesBoundary,
      },
      {
        name:
          'last possible entrance forced open',
        run:
          checkLastPossibleEntranceForcedOpen,
      },
      {
        name:
          'blocker closes boundary without wall',
        run:
          checkBlockerClosesBoundaryWithoutWall,
      },
      {
        name:
          'door counts as confirmed entrance',
        run:
          checkDoorCountsAsConfirmedEntrance,
      },
    ];

  let passed = 0;

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

  if (passed !== cases.length) {
    throw new Error(
      'Treasure room pruning sanity failed.',
    );
  }
}

main();
