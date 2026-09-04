import {
  analyzeHumanSolvability,
  findTreasureRoomVariantInference,
} from '../puzzle/human-solver/HumanSolver';

import {
  runDirectFixedPoint,
} from '../puzzle/human-solver/DirectDeductionEngine';

import {
  SearchState,
} from '../puzzle/solver/SearchState';

import {
  SearchCellState,
} from '../puzzle/solver/types';

import type {
  GridPosition,
  LevelDefinition,
} from '../puzzle/types';

interface ViableRoomCandidateShape {
  cells:
    readonly GridPosition[];
  boundary:
    readonly GridPosition[];
}

interface ViableRoomQueryShape {
  getViableTreasureRoomCandidates?: (
    chest: GridPosition,
  ) =>
    readonly ViableRoomCandidateShape[];
}

function assert(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const directCorridor:
  LevelDefinition = {
  id: 'human-direct-corridor',
  width: 3,
  height: 3,
  rowClues: [
    3,
    0,
    3,
  ],
  columnClues: [
    2,
    2,
    2,
  ],
  monsters: [
    { x: 0, y: 1 },
    { x: 2, y: 1 },
  ],
  chests: [],
  blockers: [],
  doors: [],
  solution: [
    '###',
    '...',
    '###',
  ],
};

const horizontalDoor:
  LevelDefinition = {
  id: 'human-horizontal-door',
  width: 5,
  height: 5,
  rowClues: [
    2,
    2,
    2,
    2,
    2,
  ],
  columnClues: [
    2,
    2,
    2,
    2,
    2,
  ],
  monsters: [],
  chests: [],
  blockers: [],
  doors: [
    {
      position: {
        x: 2,
        y: 2,
      },
      orientation:
        'horizontal',
    },
  ],
  solution: [
    '#..#.',
    '..#.#',
    '#...#',
    '.##..',
    '.#.#.',
  ],
};

const cornerChest:
  LevelDefinition = {
  id: 'human-corner-chest-query',
  width: 4,
  height: 4,
  rowClues: [
    0,
    0,
    0,
    0,
  ],
  columnClues: [
    0,
    0,
    0,
    0,
  ],
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


const singletonRoom:
  LevelDefinition = {
  id: 'human-singleton-room-interior',
  width: 5,
  height: 5,
  rowClues: [
    2,
    2,
    2,
    2,
    2,
  ],
  columnClues: [
    2,
    2,
    2,
    2,
    2,
  ],
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
    '.....',
    '.....',
    '.....',
    '.....',
    '.....',
  ],
};


const confirmedRoomEntrance:
  LevelDefinition = {
  id: 'human-confirmed-room-entrance',
  width: 5,
  height: 5,
  rowClues: [
    1,
    1,
    1,
    3,
    2,
  ],
  columnClues: [
    1,
    1,
    1,
    3,
    2,
  ],
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
    '...#.',
    '....#',
    '...#.',
    '###..',
    '...##',
  ],
};

const lastPossibleRoomEntrance:
  LevelDefinition = {
  id: 'human-last-room-entrance',
  width: 5,
  height: 5,
  rowClues: [
    1,
    1,
    1,
    1,
    1,
  ],
  columnClues: [
    0,
    0,
    0,
    2,
    3,
  ],
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
    {
      x: 3,
      y: 2,
    },
    {
      x: 0,
      y: 3,
    },
    {
      x: 1,
      y: 3,
    },
    {
      x: 2,
      y: 3,
    },
  ],
  doors: [],
  solution: [
    '....#',
    '....#',
    '....#',
    '...#.',
    '...#.',
  ],
};


const monsterConfirmedExit:
  LevelDefinition = {
  id: 'human-monster-confirmed-exit',
  width: 5,
  height: 5,
  rowClues: [
    2,
    2,
    2,
    2,
    2,
  ],
  columnClues: [
    2,
    2,
    2,
    2,
    2,
  ],
  monsters: [
    {
      x: 2,
      y: 2,
    },
  ],
  chests: [],
  blockers: [],
  doors: [],
  solution: [
    '##...',
    '..#..',
    '.#.#.',
    '..#..',
    '...##',
  ],
};


const monsterLastPossibleExit:
  LevelDefinition = {
  id: 'human-monster-last-possible-exit',
  width: 5,
  height: 5,
  rowClues: [
    2,
    2,
    1,
    2,
    2,
  ],
  columnClues: [
    2,
    2,
    1,
    2,
    2,
  ],
  monsters: [
    {
      x: 2,
      y: 2,
    },
  ],
  chests: [],
  blockers: [
    {
      x: 2,
      y: 1,
    },
    {
      x: 1,
      y: 2,
    },
    {
      x: 3,
      y: 2,
    },
  ],
  doors: [],
  solution: [
    '##...',
    '#..#.',
    '#...#',
    '.#...',
    '...##',
  ],
};


const monsterTooManyExits:
  LevelDefinition = {
  id: 'human-monster-too-many-exits',
  width: 5,
  height: 5,
  rowClues: [
    2,
    2,
    2,
    2,
    2,
  ],
  columnClues: [
    2,
    2,
    2,
    2,
    2,
  ],
  monsters: [
    {
      x: 2,
      y: 2,
    },
  ],
  chests: [],
  blockers: [],
  doors: [],
  solution: [
    '##...',
    '..#..',
    '.....',
    '..#..',
    '...##',
  ],
};

const monsterNoPossibleExit:
  LevelDefinition = {
  id: 'human-monster-no-possible-exit',
  width: 5,
  height: 5,
  rowClues: [
    2,
    2,
    1,
    2,
    2,
  ],
  columnClues: [
    2,
    2,
    1,
    2,
    2,
  ],
  monsters: [
    {
      x: 2,
      y: 2,
    },
  ],
  chests: [],
  blockers: [
    {
      x: 2,
      y: 1,
    },
    {
      x: 1,
      y: 2,
    },
    {
      x: 3,
      y: 2,
    },
    {
      x: 2,
      y: 3,
    },
  ],
  doors: [],
  solution: [
    '##...',
    '#....',
    '#...#',
    '....#',
    '...##',
  ],
};


const hallwayLastContinuation:
  LevelDefinition = {
  id: 'human-hallway-last-continuation',
  width: 5,
  height: 5,
  rowClues: [
    2,
    2,
    1,
    2,
    2,
  ],
  columnClues: [
    2,
    2,
    2,
    2,
    2,
  ],
  monsters: [],
  chests: [],
  blockers: [
    {
      x: 1,
      y: 2,
    },
    {
      x: 3,
      y: 2,
    },
  ],
  doors: [],
  solution: [
    '##...',
    '#....',
    '.....',
    '....#',
    '...##',
  ],
};


const hallwayImpossibleDeadEnd:
  LevelDefinition = {
  id: 'human-hallway-impossible-dead-end',
  width: 5,
  height: 5,
  rowClues: [
    2,
    2,
    2,
    2,
    2,
  ],
  columnClues: [
    2,
    2,
    2,
    2,
    2,
  ],
  monsters: [],
  chests: [],
  blockers: [
    {
      x: 1,
      y: 2,
    },
    {
      x: 3,
      y: 2,
    },
    {
      x: 2,
      y: 3,
    },
  ],
  doors: [],
  solution: [
    '##...',
    '#....',
    '.....',
    '....#',
    '...##',
  ],
};


const open2x2LastCell:
  LevelDefinition = {
  id: 'human-open-2x2-last-cell',
  width: 5,
  height: 5,
  rowClues: [2, 2, 2, 2, 2],
  columnClues: [2, 2, 2, 2, 2],
  monsters: [],
  chests: [],
  blockers: [],
  doors: [],
  solution: [
    '##...',
    '...##',
    '.##..',
    '..##.',
    '##...',
  ],
};

const open2x2Contradiction:
  LevelDefinition = {
  id: 'human-open-2x2-contradiction',
  width: 5,
  height: 5,
  rowClues: [2, 2, 2, 2, 2],
  columnClues: [2, 2, 2, 2, 2],
  monsters: [],
  chests: [],
  blockers: [],
  doors: [],
  solution: [
    '##...',
    '...##',
    '.##..',
    '..##.',
    '##...',
  ],
};

const open2x2TreasureRoomExemption:
  LevelDefinition = {
  id: 'human-open-2x2-room-exemption',
  width: 5,
  height: 5,
  rowClues: [2, 2, 2, 2, 2],
  columnClues: [2, 2, 2, 2, 2],
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
    '.....',
    '.....',
    '.....',
    '.....',
    '.....',
  ],
};

const connectivityBridge:
  LevelDefinition = {
  id: 'human-connectivity-bridge',
  width: 9,
  height: 8,
  rowClues: [
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
  ],
  columnClues: [
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
  ],
  monsters: [],
  chests: [],
  blockers: [
    { x: 5, y: 0 },
    { x: 6, y: 0 },
    { x: 7, y: 0 },
    { x: 4, y: 1 },
    { x: 8, y: 1 },
    { x: 6, y: 2 },
    { x: 8, y: 2 },
    { x: 4, y: 3 },
    { x: 8, y: 3 },
    { x: 5, y: 4 },
    { x: 6, y: 4 },
    { x: 7, y: 4 },
  ],
  doors: [],
  solution: [
    '.........',
    '.........',
    '.........',
    '.........',
    '.........',
    '.........',
    '.........',
    '.........',
  ],
};


const treasureRoomVariantSharedFootprint:
  LevelDefinition = {
  id: 'human-room-variant-shared-footprint',
  width: 8,
  height: 8,
  rowClues: [
    5,
    2,
    5,
    2,
    3,
    2,
    4,
    3,
  ],
  columnClues: [
    2,
    5,
    3,
    2,
    2,
    5,
    2,
    5,
  ],
  monsters: [],
  chests: [
    {
      x: 2,
      y: 5,
    },
  ],
  blockers: [],
  doors: [],
  solution: Array(8).fill(
    '........',
  ),
};

const treasureRoomVariantUniqueEntrance:
  LevelDefinition = {
  id: 'human-room-variant-unique-entrance',
  width: 8,
  height: 8,
  rowClues: [
    2,
    3,
    3,
    4,
    2,
    3,
    5,
    2,
  ],
  columnClues: [
    5,
    2,
    2,
    3,
    3,
    2,
    5,
    2,
  ],
  monsters: [],
  chests: [
    {
      x: 0,
      y: 2,
    },
    {
      x: 5,
      y: 5,
    },
  ],
  blockers: [],
  doors: [],
  solution: Array(8).fill(
    '........',
  ),
};

const contradictionSolved:
  LevelDefinition = {
  id: 'human-depth-one-contradiction-solved',
  width: 5,
  height: 5,
  rowClues: [
    2,
    2,
    1,
    2,
    5,
  ],
  columnClues: [
    2,
    2,
    1,
    4,
    3,
  ],
  monsters: [
    {
      x: 4,
      y: 2,
    },
  ],
  chests: [
    {
      x: 1,
      y: 1,
    },
  ],
  blockers: [],
  doors: [],
  solution: [
    '...##',
    '...##',
    '...#.',
    '##...',
    '#####',
  ],
};

function checkDirectCorridor(): void {
  const result =
    analyzeHumanSolvability(
      directCorridor,
    );

  assert(
    result.status ===
      'solved-direct',
    'Line-only corridor must be solved-direct.',
  );

  assert(
    result.contradictionSteps === 0,
    'Direct corridor must not use contradiction reasoning.',
  );

  assert(
    result.unknownRemaining === 0,
    'Direct corridor must have no unknown cells remaining.',
  );

  assert(
    result.steps.length > 0,
    'Direct corridor must record at least one human deduction step.',
  );

  assert(
    result.steps.every(
      (step) =>
        step.tier === 'direct',
    ),
    'Every Task 1 deduction step must be direct.',
  );
}

function checkHorizontalDoor(): void {
  const result =
    analyzeHumanSolvability(
      horizontalDoor,
    );

  const doorStep =
    result.steps.find(
      (step) =>
        step.rule === 'door',
    );

  assert(
    doorStep !== undefined,
    'Horizontal Directional Door must produce a door deduction step.',
  );

  const assignments =
    new Map(
      doorStep.assignments.map(
        (assignment) => [
          `${assignment.position.x}:${assignment.position.y}`,
          assignment.value,
        ],
      ),
    );

  assert(
    assignments.get('1:2') ===
      'open',
    'Horizontal Door must force its left neighbor OPEN.',
  );

  assert(
    assignments.get('3:2') ===
      'open',
    'Horizontal Door must force its right neighbor OPEN.',
  );

  assert(
    assignments.get('2:1') ===
      'wall',
    'Horizontal Door must force its upper framing cell WALL.',
  );

  assert(
    assignments.get('2:3') ===
      'wall',
    'Horizontal Door must force its lower framing cell WALL.',
  );

  assert(
    doorStep.explanation.includes(
      'horizontal',
    ),
    'Door explanation must identify the horizontal orientation.',
  );

  assert(
    doorStep.explanation.includes(
      '(2,2)',
    ),
    'Door explanation must identify the Door coordinate.',
  );
}

function checkViableRoomQuery(): void {
  const state =
    new SearchState(
      cornerChest,
    );

  const queryState =
    state as unknown as
      ViableRoomQueryShape;

  assert(
    typeof queryState
      .getViableTreasureRoomCandidates ===
      'function',
    'SearchState must expose the current viable Treasure Room candidates.',
  );

  const chest =
    cornerChest.chests[0];

  const candidates =
    queryState
      .getViableTreasureRoomCandidates(
        chest,
      );

  assert(
    candidates.length === 1,
    'Corner Chest on 4x4 must expose exactly one viable 3x3 room candidate.',
  );

  const candidate =
    candidates[0];

  assert(
    candidate.cells.length === 9,
    'Viable Treasure Room candidate must expose all nine interior cells.',
  );

  assert(
    candidate.boundary.length > 0,
    'Viable Treasure Room candidate must expose its in-board boundary.',
  );
}


function checkSingletonRoomInterior(): void {
  const state =
    new SearchState(
      singletonRoom,
    );

  const direct =
    runDirectFixedPoint(
      state,
    );

  const roomStep =
    direct.steps.find(
      (step) =>
        step.rule ===
          'treasure-room-interior',
    );

  assert(
    roomStep !== undefined,
    'Singleton Treasure Room must produce a treasure-room-interior deduction step.',
  );

  const expected =
    [
      '1:0',
      '2:0',
      '0:1',
      '1:1',
      '2:1',
      '0:2',
      '1:2',
      '2:2',
    ];

  const assignments =
    new Map(
      roomStep.assignments.map(
        (assignment) => [
          `${assignment.position.x}:${assignment.position.y}`,
          assignment.value,
        ],
      ),
    );

  for (const key of expected) {
    assert(
      assignments.get(key) ===
        SearchCellState.Open,
      `Singleton Treasure Room must force ${key} OPEN.`,
    );
  }

  assert(
    roomStep.assignments.length ===
      expected.length,
    'Singleton Treasure Room interior step must contain exactly the eight mutable room cells.',
  );

  assert(
    roomStep.explanation.includes(
      '(0,0)',
    ),
    'Treasure Room explanation must identify the Chest coordinate.',
  );
}


function checkConfirmedRoomEntrance(): void {
  const state =
    new SearchState(
      confirmedRoomEntrance,
    );

  assert(
    state.assign(
      3,
      1,
      SearchCellState.Open,
    ),
    'Confirmed room entrance fixture must allow the boundary entrance to start OPEN.',
  );

  const direct =
    runDirectFixedPoint(
      state,
    );

  const entranceStep =
    direct.steps.find(
      (step) =>
        step.rule ===
          'treasure-room-entrance',
    );

  assert(
    entranceStep !== undefined,
    'A confirmed Treasure Room entrance must produce a treasure-room-entrance deduction step.',
  );

  const expectedClosed =
    [
      '0:3',
      '1:3',
      '2:3',
    ];

  const assignments =
    new Map(
      entranceStep.assignments.map(
        (assignment) => [
          `${assignment.position.x}:${assignment.position.y}`,
          assignment.value,
        ],
      ),
    );

  for (
    const key
    of expectedClosed
  ) {
    assert(
      assignments.get(key) ===
        SearchCellState.Wall,
      `Confirmed Treasure Room entrance must force remaining boundary cell ${key} WALL.`,
    );
  }

  assert(
    entranceStep.explanation.includes(
      '(0,0)',
    ),
    'Treasure Room entrance explanation must identify the Chest coordinate.',
  );
}

function checkLastPossibleRoomEntrance(): void {
  const state =
    new SearchState(
      lastPossibleRoomEntrance,
    );

  const direct =
    runDirectFixedPoint(
      state,
    );

  const entranceStep =
    direct.steps.find(
      (step) =>
        step.rule ===
          'treasure-room-entrance' &&
        step.assignments.some(
          (assignment) =>
            assignment.position.x === 3 &&
            assignment.position.y === 1 &&
            assignment.value ===
              SearchCellState.Open,
        ),
    );

  assert(
    entranceStep !== undefined,
    'The last possible Treasure Room entrance must be forced OPEN.',
  );

  assert(
    entranceStep.assignments.length ===
      1,
    'Last possible Treasure Room entrance step must assign exactly one OPEN boundary cell.',
  );

  assert(
    entranceStep.explanation.includes(
      '(3,1)',
    ),
    'Last possible entrance explanation must identify the forced entrance coordinate.',
  );
}


function checkMonsterConfirmedExit(): void {
  const state =
    new SearchState(
      monsterConfirmedExit,
    );

  assert(
    state.assign(
      2,
      1,
      SearchCellState.Open,
    ),
    'Monster fixture must allow one neighboring hallway cell to start OPEN.',
  );

  const direct =
    runDirectFixedPoint(
      state,
    );

  const monsterStep =
    direct.steps.find(
      (step) =>
        step.rule ===
          'monster-dead-end',
    );

  assert(
    monsterStep !== undefined,
    'Monster with one confirmed OPEN exit must produce a monster-dead-end deduction step.',
  );

  const assignments =
    new Map(
      monsterStep.assignments.map(
        (assignment) => [
          `${assignment.position.x}:${assignment.position.y}`,
          assignment.value,
        ],
      ),
    );

  const expectedClosed =
    [
      '1:2',
      '3:2',
      '2:3',
    ];

  for (
    const key
    of expectedClosed
  ) {
    assert(
      assignments.get(key) ===
        SearchCellState.Wall,
      `Monster with one confirmed exit must force remaining neighbor ${key} WALL.`,
    );
  }

  assert(
    monsterStep.assignments.length ===
      expectedClosed.length,
    'Monster confirmed-exit deduction must close exactly the three remaining neighboring cells.',
  );

  assert(
    monsterStep.explanation.includes(
      '(2,2)',
    ),
    'Monster deduction explanation must identify the Monster coordinate.',
  );
}


function checkMonsterLastPossibleExit(): void {
  const state =
    new SearchState(
      monsterLastPossibleExit,
    );

  assert(
    state.getCellState(
      2,
      3,
    ) ===
      SearchCellState.Unassigned,
    'Monster last-exit fixture must begin with its only possible exit UNASSIGNED.',
  );

  const direct =
    runDirectFixedPoint(
      state,
    );

  const monsterStep =
    direct.steps.find(
      (step) =>
        step.rule ===
          'monster-dead-end' &&
        step.assignments.some(
          (assignment) =>
            assignment.position.x === 2 &&
            assignment.position.y === 3 &&
            assignment.value ===
              SearchCellState.Open,
        ),
    );

  assert(
    monsterStep !== undefined,
    'Monster with no confirmed exit and one possible neighboring cell must force that cell OPEN.',
  );

  assert(
    monsterStep.assignments.length === 1,
    'Monster last-possible-exit deduction must assign exactly one cell.',
  );

  assert(
    monsterStep.explanation.includes(
      '(2,2)',
    ),
    'Monster last-exit explanation must identify the Monster coordinate.',
  );

  assert(
    monsterStep.explanation.includes(
      '(2,3)',
    ),
    'Monster last-exit explanation must identify the forced exit coordinate.',
  );
}


function checkMonsterTooManyExitsContradiction(): void {
  const state =
    new SearchState(
      monsterTooManyExits,
    );

  assert(
    state.assign(
      2,
      1,
      SearchCellState.Open,
    ),
    'Two-exit Monster fixture must allow its first neighboring OPEN assignment.',
  );

  assert(
    state.assign(
      1,
      2,
      SearchCellState.Open,
    ),
    'Two-exit Monster fixture must allow its second neighboring OPEN assignment.',
  );

  const direct =
    runDirectFixedPoint(
      state,
    );

  assert(
    direct.ok === false,
    'Monster with two confirmed OPEN exits must be a direct contradiction.',
  );

  if (direct.ok === false) {
    assert(
      direct.contradiction.includes(
        'Monster',
      ),
      'Two-exit contradiction must identify the Monster rule.',
    );

    assert(
      direct.contradiction.includes(
        '(2,2)',
      ),
      'Two-exit contradiction must identify the Monster coordinate.',
    );
  }
}

function checkMonsterNoPossibleExitContradiction(): void {
  const state =
    new SearchState(
      monsterNoPossibleExit,
    );

  const direct =
    runDirectFixedPoint(
      state,
    );

  assert(
    direct.ok === false,
    'Monster with no possible neighboring exit must be a direct contradiction.',
  );

  if (direct.ok === false) {
    assert(
      direct.contradiction.includes(
        'Monster',
      ),
      'No-exit contradiction must identify the Monster rule.',
    );

    assert(
      direct.contradiction.includes(
        '(2,2)',
      ),
      'No-exit contradiction must identify the Monster coordinate.',
    );
  }
}


function checkHallwayLastContinuation(): void {
  const state =
    new SearchState(
      hallwayLastContinuation,
    );

  assert(
    state.assign(
      2,
      2,
      SearchCellState.Open,
    ),
    'Hallway fixture must allow the central ordinary cell to start OPEN.',
  );

  assert(
    state.assign(
      2,
      1,
      SearchCellState.Open,
    ),
    'Hallway fixture must allow one confirmed OPEN continuation.',
  );

  assert(
    state.getCellState(
      2,
      3,
    ) ===
      SearchCellState.Unassigned,
    'Hallway fixture must begin with its final possible continuation UNASSIGNED.',
  );

  const direct =
    runDirectFixedPoint(
      state,
    );

  const hallwayStep =
    direct.steps.find(
      (step) =>
        step.rule ===
          'hallway-not-dead-end' &&
        step.assignments.some(
          (assignment) =>
            assignment.position.x === 2 &&
            assignment.position.y === 3 &&
            assignment.value ===
              SearchCellState.Open,
        ),
    );

  assert(
    hallwayStep !== undefined,
    'Confirmed non-Monster hallway with one OPEN neighbor and one possible continuation must force that continuation OPEN.',
  );

  assert(
    hallwayStep.assignments.length ===
      1,
    'Hallway last-continuation deduction must assign exactly one cell.',
  );

  assert(
    hallwayStep.explanation.includes(
      '(2,2)',
    ),
    'Hallway deduction explanation must identify the proven hallway cell.',
  );

  assert(
    hallwayStep.explanation.includes(
      '(2,3)',
    ),
    'Hallway deduction explanation must identify the forced continuation coordinate.',
  );
}


function checkHallwayImpossibleDeadEnd(): void {
  const state =
    new SearchState(
      hallwayImpossibleDeadEnd,
    );

  assert(
    state.assign(
      2,
      2,
      SearchCellState.Open,
    ),
    'Impossible hallway fixture must allow the central ordinary cell to start OPEN.',
  );

  assert(
    state.assign(
      2,
      1,
      SearchCellState.Open,
    ),
    'Impossible hallway fixture must allow its only OPEN neighbor.',
  );

  const direct =
    runDirectFixedPoint(
      state,
    );

  assert(
    direct.ok === false,
    'Confirmed non-Monster hallway that can never reach two OPEN neighbors must be a direct contradiction.',
  );

  if (direct.ok === false) {
    assert(
      direct.contradiction.includes(
        '(2,2)',
      ),
      'Hallway contradiction must identify the proven hallway cell.',
    );

    assert(
      direct.contradiction.includes(
        'dead end',
      ),
      'Hallway contradiction must explain the forbidden dead end.',
    );
  }
}


function checkOpen2x2LastCell(): void {
  const state =
    new SearchState(
      open2x2LastCell,
    );

  for (
    const position
    of [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ]
  ) {
    assert(
      state.assign(
        position.x,
        position.y,
        SearchCellState.Open,
      ),
      'OPEN 2x2 fixture must allow its three confirmed OPEN cells.',
    );
  }

  const direct =
    runDirectFixedPoint(
      state,
    );

  const step =
    direct.steps.find(
      (candidate) =>
        candidate.rule ===
          'open-2x2' &&
        candidate.assignments.some(
          (assignment) =>
            assignment.position.x === 2 &&
            assignment.position.y === 2 &&
            assignment.value ===
              SearchCellState.Wall,
        ),
    );

  assert(
    step !== undefined,
    'Three OPEN cells in a non-room 2x2 must force the fourth cell WALL.',
  );
}

function checkOpen2x2Contradiction(): void {
  const state =
    new SearchState(
      open2x2Contradiction,
    );

  for (
    const position
    of [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ]
  ) {
    assert(
      state.assign(
        position.x,
        position.y,
        SearchCellState.Open,
      ),
      'OPEN 2x2 contradiction fixture must allow its confirmed OPEN cells.',
    );
  }

  const direct =
    runDirectFixedPoint(
      state,
    );

  assert(
    direct.ok === false,
    'A full OPEN 2x2 outside Treasure Rooms must be a direct contradiction.',
  );

  if (direct.ok === false) {
    assert(
      direct.contradiction.includes(
        '2x2',
      ),
      'OPEN 2x2 contradiction must explain the forbidden 2x2.',
    );
  }
}

function checkOpen2x2TreasureRoomExemption(): void {
  const state =
    new SearchState(
      open2x2TreasureRoomExemption,
    );

  const direct =
    runDirectFixedPoint(
      state,
    );

  assert(
    !direct.steps.some(
      (step) =>
        step.rule ===
          'open-2x2',
    ),
    'OPEN 2x2 blocks that can be fully contained in a viable Treasure Room must not trigger the hallway-width rule.',
  );
}

function createConnectivityBridgeState():
  SearchState {
  const state =
    new SearchState(
      connectivityBridge,
    );

  assert(
    state.assign(
      1,
      2,
      SearchCellState.Open,
    ),
    'Connectivity fixture must allow its left mandatory OPEN cell.',
  );

  for (
    const position
    of [
      { x: 5, y: 1 },
      { x: 6, y: 1 },
      { x: 7, y: 1 },
      { x: 5, y: 2 },
      { x: 7, y: 2 },
      { x: 5, y: 3 },
      { x: 6, y: 3 },
      { x: 7, y: 3 },
    ]
  ) {
    assert(
      state.assign(
        position.x,
        position.y,
        SearchCellState.Open,
      ),
      'Connectivity fixture must allow its isolated confirmed OPEN loop.',
    );
  }

  return state;
}

function checkConnectivityBridge(): void {
  const state =
    createConnectivityBridgeState();

  assert(
    state.getCellState(
      4,
      2,
    ) ===
      SearchCellState.Unassigned,
    'Connectivity bridge must begin UNASSIGNED.',
  );

  const direct =
    runDirectFixedPoint(
      state,
    );

  const step =
    direct.steps.find(
      (candidate) =>
        candidate.rule ===
          'connectivity' &&
        candidate.assignments.some(
          (assignment) =>
            assignment.position.x === 4 &&
            assignment.position.y === 2 &&
            assignment.value ===
              SearchCellState.Open,
        ),
    );

  assert(
    step !== undefined,
    'An UNASSIGNED articulation cell required to connect mandatory OPEN regions must be forced OPEN.',
  );
}

function checkConnectivityContradiction(): void {
  const state =
    createConnectivityBridgeState();

  assert(
    state.assign(
      4,
      2,
      SearchCellState.Wall,
    ),
    'Connectivity contradiction fixture must allow the bridge to be assumed WALL.',
  );

  const direct =
    runDirectFixedPoint(
      state,
    );

  assert(
    direct.ok === false,
    'Disconnected mandatory OPEN regions in the potential graph must be a direct contradiction.',
  );

  if (direct.ok === false) {
    assert(
      direct.contradiction.toLowerCase().includes(
        'connect',
      ),
      'Connectivity contradiction must explain the connectivity failure.',
    );
  }
}


function checkTreasureRoomVariantSharedFootprint(): void {
  const result =
    analyzeHumanSolvability(
      treasureRoomVariantSharedFootprint,
    );

  assert(
    result.status ===
      'solved-with-contradiction',
    'Treasure Room variant filtering must turn the shared-footprint fixture into a contradiction-tier solve.',
  );

  const variantStep =
    result.steps.find(
      (step) =>
        step.rule ===
          'treasure-room-variant',
    );

  assert(
    variantStep !== undefined,
    'Shared-footprint fixture must record a Treasure Room variant step.',
  );

  assert(
    variantStep.tier ===
      'contradiction',
    'Treasure Room variant reasoning must count as contradiction-tier, not direct.',
  );

  assert(
    variantStep.assignments.length === 8,
    'Shared-footprint variant step must assign only the eight mutable cells of the forced 3x3 room interior.',
  );

  assert(
    variantStep.assignments.every(
      (assignment) =>
        assignment.value ===
          SearchCellState.Open &&
        assignment.position.x >= 2 &&
        assignment.position.x <= 4 &&
        assignment.position.y >= 3 &&
        assignment.position.y <= 5,
    ),
    'Shared-footprint variant step must force only the common Treasure Room interior OPEN.',
  );

  assert(
    !variantStep.assignments.some(
      (assignment) =>
        assignment.value ===
          SearchCellState.Wall,
    ),
    'Multiple surviving entrances must not trigger broad boundary-consensus WALL assignments.',
  );

  assert(
    variantStep.proof === null,
    'Treasure Room structural variant step must not masquerade as a single-cell contradiction proof.',
  );
}

function checkTreasureRoomVariantUniqueEntrance(): void {
  const state =
    new SearchState(
      treasureRoomVariantUniqueEntrance,
    );

  const committed:
    readonly [
      number,
      number,
      | typeof SearchCellState.Open
      | typeof SearchCellState.Wall,
    ][] = [
      [1, 2, SearchCellState.Open],
      [2, 2, SearchCellState.Open],
      [0, 5, SearchCellState.Wall],
      [0, 6, SearchCellState.Wall],
      [0, 7, SearchCellState.Wall],
      [2, 7, SearchCellState.Open],
      [3, 7, SearchCellState.Open],
      [5, 7, SearchCellState.Open],
      [6, 7, SearchCellState.Open],
    ];

  for (
    const [x, y, value]
    of committed
  ) {
    assert(
      state.assign(
        x,
        y,
        value,
      ),
      'Treasure Room variant diagnostic fixture must accept its committed stuck-state assignments.',
    );
  }

  const directBefore =
    runDirectFixedPoint(
      state,
    );

  assert(
    directBefore.ok &&
      directBefore.steps.length === 0,
    'Treasure Room variant diagnostic state must begin at a direct fixed point.',
  );

  const first =
    findTreasureRoomVariantInference(
      state,
    );

  assert(
    first.kind === 'move' &&
      first.move.chest.x === 0 &&
      first.move.chest.y === 2 &&
      first.move.uniqueEntrance === false,
    'First structural inference must identify the shared footprint around Chest (0,2) without inventing an entrance.',
  );

  if (first.kind === 'move') {
    for (
      const assignment
      of first.move.assignments
    ) {
      assert(
        state.assign(
          assignment.position.x,
          assignment.position.y,
          assignment.value,
        ),
        'Shared-footprint inference assignments must apply cleanly to the diagnostic state.',
      );
    }
  }

  const directAfterFirst =
    runDirectFixedPoint(
      state,
    );

  assert(
    directAfterFirst.ok,
    'Direct propagation after the first structural room inference must remain feasible.',
  );

  const second =
    findTreasureRoomVariantInference(
      state,
    );

  assert(
    second.kind === 'move' &&
      second.move.chest.x === 5 &&
      second.move.chest.y === 5 &&
      second.move.uniqueEntrance,
    'Second structural inference must reduce Chest (5,5) to one full room+entrance variant.',
  );

  assert(
    second.kind === 'move' &&
      second.move.assignments.some(
        (assignment) =>
          assignment.position.x === 2 &&
          assignment.position.y === 4 &&
          assignment.value ===
            SearchCellState.Open,
      ),
    'Exactly one surviving full variant must force its sole entrance (2,4) OPEN.',
  );

  assert(
    second.kind === 'move' &&
      second.move.assignments.some(
        (assignment) =>
          assignment.position.x === 3 &&
          assignment.position.y === 2 &&
          assignment.value ===
            SearchCellState.Wall,
      ),
    'Exactly one surviving full variant must close every remaining mutable non-entrance boundary cell as ordinary WALL.',
  );
}

function checkDepthOneContradictionSolve(): void {
  const result =
    analyzeHumanSolvability(
      contradictionSolved,
    );

  assert(
    result.status ===
      'solved-with-contradiction',
    'Depth-1 contradiction must solve the contradiction fixture without DFS guessing.',
  );

  assert(
    result.contradictionSteps === 1,
    'Contradiction fixture must require exactly one committed contradiction step.',
  );

  assert(
    result.unknownRemaining === 0,
    'Solved contradiction fixture must leave no unknown mutable cells.',
  );

  const contradictionStep =
    result.steps.find(
      (step) =>
        step.rule ===
          'contradiction',
    );

  assert(
    contradictionStep !== undefined,
    'Solved contradiction fixture must record its contradiction step.',
  );

  assert(
    contradictionStep.tier ===
      'contradiction',
    'Contradiction step must use the contradiction deduction tier.',
  );

  assert(
    contradictionStep.assignments.length ===
      1 &&
    contradictionStep.assignments[0]
      .position.x === 0 &&
    contradictionStep.assignments[0]
      .position.y === 0 &&
    contradictionStep.assignments[0]
      .value ===
        SearchCellState.Open,
    'Contradiction step must commit (0,0) OPEN.',
  );

  assert(
    contradictionStep.proof !== null,
    'Contradiction step must preserve the failed assumption proof.',
  );

  if (
    contradictionStep.proof !== null
  ) {
    assert(
      contradictionStep.proof
        .assumption.position.x === 0 &&
      contradictionStep.proof
        .assumption.position.y === 0 &&
      contradictionStep.proof
        .assumption.value ===
          SearchCellState.Wall,
      'Contradiction proof must record the rejected assumption (0,0)=WALL.',
    );

    assert(
      contradictionStep.proof
        .deductions.length > 0,
      'Contradiction proof must include the direct deductions reached under the assumption.',
    );

    assert(
      contradictionStep.proof
        .deductions.every(
          (deduction) =>
            String(
              deduction.rule,
            ) !==
              'contradiction',
        ),
      'Depth-1 contradiction proof must never contain a nested contradiction step.',
    );

    assert(
      contradictionStep.proof
        .contradiction.includes(
          'Monster',
        ),
      'Contradiction proof must preserve the direct Monster contradiction that killed the assumption.',
    );
  }

  assert(
    result.ruleCounts
      .contradiction === 1,
    'Rule counts must include the committed contradiction step exactly once.',
  );

  assert(
    !result.steps.some(
      (step) =>
        step.rule !==
          'contradiction' &&
        step.assignments.some(
          (assignment) =>
            assignment.position.x === 0 &&
            assignment.position.y === 0 &&
            assignment.value ===
              SearchCellState.Wall,
        ),
    ),
    'Rejected WALL assumption must be rolled back instead of leaking into committed direct steps.',
  );
}

function main(): void {
  console.info(
    '[Dungeon Logic] Human solver sanity',
  );

  checkDirectCorridor();

  console.info(
    'PASS: direct line deductions',
  );

  checkHorizontalDoor();

  console.info(
    'PASS: horizontal door deduction',
  );

  checkViableRoomQuery();

  console.info(
    'PASS: viable treasure room query',
  );

  checkSingletonRoomInterior();

  console.info(
    'PASS: singleton treasure room interior',
  );

  checkConfirmedRoomEntrance();

  console.info(
    'PASS: confirmed treasure room entrance',
  );

  checkLastPossibleRoomEntrance();

  console.info(
    'PASS: last possible treasure room entrance',
  );

  checkMonsterConfirmedExit();

  console.info(
    'PASS: monster confirmed exit',
  );

  checkMonsterLastPossibleExit();

  console.info(
    'PASS: monster last possible exit',
  );

  checkMonsterTooManyExitsContradiction();

  console.info(
    'PASS: monster too many exits contradiction',
  );

  checkMonsterNoPossibleExitContradiction();

  console.info(
    'PASS: monster no possible exit contradiction',
  );

  checkHallwayLastContinuation();

  console.info(
    'PASS: hallway last continuation',
  );

  checkHallwayImpossibleDeadEnd();

  console.info(
    'PASS: hallway impossible dead end contradiction',
  );

  checkOpen2x2LastCell();

  console.info(
    'PASS: open 2x2 last cell',
  );

  checkOpen2x2Contradiction();

  console.info(
    'PASS: open 2x2 contradiction',
  );

  checkOpen2x2TreasureRoomExemption();

  console.info(
    'PASS: open 2x2 treasure room exemption',
  );

  checkConnectivityBridge();

  console.info(
    'PASS: connectivity articulation bridge',
  );

  checkConnectivityContradiction();

  console.info(
    'PASS: connectivity contradiction',
  );

  checkTreasureRoomVariantSharedFootprint();

  console.info(
    'PASS: treasure room variant shared footprint',
  );

  checkTreasureRoomVariantUniqueEntrance();

  console.info(
    'PASS: treasure room variant unique entrance',
  );

  checkDepthOneContradictionSolve();

  console.info(
    'PASS: depth-one contradiction solve',
  );

  console.info(
    '98/98 checks passed',
  );
}

main();
