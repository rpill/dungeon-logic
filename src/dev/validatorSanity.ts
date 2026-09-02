import {
  level001,
  level002,
  level003,
  level004,
  levels,
  resolveLevel,
} from '../data/levels';

import {
  validatePuzzle,
} from '../puzzle/LevelValidator';

import { PuzzleState } from '../puzzle/PuzzleState';

import {
  CellState,
  type DoorDefinition,
  type GridPosition,
  type LevelDefinition,
} from '../puzzle/types';

interface SanityCase {
  name: string;
  run: () => void;
}

const ORTHOGONAL_OFFSETS: readonly GridPosition[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export function runValidatorSanityChecks(): void {
  const cases: readonly SanityCase[] = [
    {
      name: 'valid level001 solution',
      run: checkValidLevel001,
    },
    {
      name: 'valid level002 solution',
      run: () => {
        checkValidLevel(level002);
      },
    },
    {
      name: 'valid level003 solution',
      run: () => {
        checkValidLevel(level003);
      },
    },
    {
      name: 'valid level004 solution',
      run: () => {
        checkValidLevel(level004);
      },
    },
    {
      name: 'all registered hidden solutions valid',
      run: checkRegisteredHiddenSolutions,
    },
    {
      name: 'authored chests stay away from room entrances',
      run: checkAuthoredChestPlacement,
    },
    {
      name: 'level query selection',
      run: checkLevelSelection,
    },
    {
      name: 'fixed blocker and door metadata',
      run: checkFixedMetadata,
    },
    {
      name: 'disconnected layout with correct clues',
      run: checkDisconnectedLayout,
    },
    {
      name: 'monster outside dead end',
      run: checkInvalidMonsterDeadEnd,
    },
    {
      name: 'open 2x2 outside treasure room',
      run: checkOpenTwoByTwo,
    },
    {
      name: 'treasure room with two entrances',
      run: checkTreasureRoomWithTwoEntrances,
    },
    {
      name: 'fixed object overlap rejected',
      run: checkFixedObjectOverlap,
    },
    {
      name: 'blocker closes dungeon topology',
      run: checkBlockerTopology,
    },
    {
      name: 'valid horizontal door',
      run: checkValidHorizontalDoor,
    },
    {
      name: 'blocker cannot frame directional door',
      run: checkBlockerCannotFrameDoor,
    },
    {
      name: 'invalid horizontal door side',
      run: checkInvalidHorizontalDoorSide,
    },
    {
      name: 'edge door invalid',
      run: checkEdgeDoorInvalid,
    },
    {
      name: 'door inside treasure room invalid',
      run: checkDoorInsideTreasureRoom,
    },
  ];

  let passed = 0;

  console.group(
    '[Dungeon Logic] Validator sanity',
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
      'Validator sanity checks failed.',
    );
  }
}

function checkValidLevel001(): void {
  checkValidLevel(level001);
}

function checkRegisteredHiddenSolutions(): void {
  for (const level of levels) {
    checkValidLevel(level);
  }
}

function checkAuthoredChestPlacement(): void {
  for (const level of levels.slice(4)) {
    for (const chest of level.chests) {
      const distances =
        findTreasureRoomEntranceDistances(
          level,
          chest,
        );

      assert(
        distances.some(
          (distance) => distance >= 2,
        ),
        `${level.id} chest at ${chest.x},${chest.y} must be at least two orthogonal steps from its Treasure Room entrance cell.`,
      );
    }
  }
}

function findTreasureRoomEntranceDistances(
  level: LevelDefinition,
  chest: GridPosition,
): readonly number[] {
  const distances: number[] = [];

  const minRoomX = Math.max(0, chest.x - 2);
  const maxRoomX = Math.min(
    chest.x,
    level.width - 3,
  );
  const minRoomY = Math.max(0, chest.y - 2);
  const maxRoomY = Math.min(
    chest.y,
    level.height - 3,
  );

  for (
    let roomY = minRoomY;
    roomY <= maxRoomY;
    roomY += 1
  ) {
    for (
      let roomX = minRoomX;
      roomX <= maxRoomX;
      roomX += 1
    ) {
      if (
        !isAuthoredTreasureRoomCandidate(
          level,
          chest,
          roomX,
          roomY,
        )
      ) {
        continue;
      }

      const entrances =
        findRoomEntrances(
          level,
          roomX,
          roomY,
        );

      if (entrances.length !== 1) {
        continue;
      }

      const entrance = entrances[0];

      distances.push(
        Math.abs(chest.x - entrance.x) +
          Math.abs(chest.y - entrance.y),
      );
    }
  }

  return distances;
}

function isAuthoredTreasureRoomCandidate(
  level: LevelDefinition,
  chest: GridPosition,
  roomX: number,
  roomY: number,
): boolean {
  const inside = (position: GridPosition): boolean =>
    position.x >= roomX &&
    position.x < roomX + 3 &&
    position.y >= roomY &&
    position.y < roomY + 3;

  if (!inside(chest)) {
    return false;
  }

  const chestCount =
    level.chests.filter(inside).length;

  if (chestCount !== 1) {
    return false;
  }

  if (
    level.monsters.some(inside) ||
    level.blockers.some(inside) ||
    level.doors.some(
      (door) => inside(door.position),
    )
  ) {
    return false;
  }

  for (let y = roomY; y < roomY + 3; y += 1) {
    for (let x = roomX; x < roomX + 3; x += 1) {
      if (level.solution[y][x] === '#') {
        return false;
      }
    }
  }

  return true;
}

function findRoomEntrances(
  level: LevelDefinition,
  roomX: number,
  roomY: number,
): readonly GridPosition[] {
  const roomCells = new Set<string>();

  for (let y = roomY; y < roomY + 3; y += 1) {
    for (let x = roomX; x < roomX + 3; x += 1) {
      if (level.solution[y][x] === '#') {
        return [];
      }

      roomCells.add(`${x}:${y}`);
    }
  }

  const entrances: GridPosition[] = [];

  for (let y = roomY; y < roomY + 3; y += 1) {
    for (let x = roomX; x < roomX + 3; x += 1) {
      for (const offset of ORTHOGONAL_OFFSETS) {
        const neighborX = x + offset.x;
        const neighborY = y + offset.y;

        if (
          neighborX < 0 ||
          neighborY < 0 ||
          neighborX >= level.width ||
          neighborY >= level.height
        ) {
          continue;
        }

        if (
          roomCells.has(
            `${neighborX}:${neighborY}`,
          )
        ) {
          continue;
        }

        if (
          level.solution[neighborY][neighborX] !== '#'
        ) {
          entrances.push({ x, y });
        }
      }
    }
  }

  return entrances;
}

function checkValidLevel(
  level: LevelDefinition,
): void {
  const puzzle =
    createPuzzleFromBoard(
      level,
      level.solution,
    );

  const result =
    validatePuzzle(puzzle);

  assert(
    result.rowCluesValid,
    'Row clues should be valid.',
  );

  assert(
    result.columnCluesValid,
    'Column clues should be valid.',
  );

  assert(
    result.treasureRoomsValid,
    'Treasure room should be valid.',
  );

  assert(
    result.connectivityValid,
    'Open area should be connected.',
  );

  assert(
    result.monsterDeadEndsValid,
    'Monster dead ends should be valid.',
  );

  assert(
    result.hallwayWidthValid,
    'Hallway width should be valid.',
  );

  assert(
    result.doorsValid,
    'Directional doors should be valid.',
  );

  assert(
    result.isSolved,
    `${level.id} must be solved.`,
  );
}

function checkLevelSelection(): void {
  assert(
    resolveLevel(null) === level001,
    'Missing level query should select level001.',
  );

  assert(
    resolveLevel('1') === level001,
    'Query level=1 should select level001.',
  );

  assert(
    resolveLevel('2') === level002,
    'Query level=2 should select level002.',
  );

  assert(
    resolveLevel('3') === level003,
    'Query level=3 should select level003.',
  );

  assert(
    resolveLevel('4') === level004,
    'Query level=4 should select level004.',
  );

  assert(
    resolveLevel('12') === levels[11],
    'Query level=12 should select level012.',
  );

  assert(
    resolveLevel('999') === level001,
    'Unknown level number should fall back to level001.',
  );

  assert(
    resolveLevel('banana') === level001,
    'Invalid level query should fall back to level001.',
  );
}

function checkFixedMetadata(): void {
  const level: LevelDefinition = {
    id: 'sanity-fixed-metadata',

    width: 3,
    height: 3,

    rowClues: [
      0,
      0,
      0,
    ],

    columnClues: [
      0,
      0,
      0,
    ],

    monsters: [],
    chests: [],

    blockers: [
      {
        x: 0,
        y: 0,
      },
    ],

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
      '...',
      '...',
      '...',
    ],
  };

  const puzzle =
    new PuzzleState(level);

  assert(
    puzzle.isBlocker(
      0,
      0,
    ),
    'Blocker metadata should be queryable.',
  );

  assert(
    puzzle.isDoor(
      1,
      1,
    ),
    'Door metadata should be queryable.',
  );

  assert(
    puzzle.getDoor(
      1,
      1,
    )?.orientation ===
    'horizontal',
    'Door orientation should be preserved.',
  );

  assert(
    puzzle.setCellState(
      0,
      0,
      CellState.Wall,
    ) !== CellState.Wall,
    'Blocker must reject mutable wall state.',
  );

  assert(
    puzzle.setCellState(
      1,
      1,
      CellState.Wall,
    ) === CellState.Floor,
    'Door must stay fixed open.',
  );
}

function checkDisconnectedLayout(): void {
  /*
   * Same row/column wall counts
   * as level001, but open space
   * is disconnected.
   */
  const board = [
    '#.##..',
    '#.....',
    '#.#...',
    '###.##',
    '#.####',
    '..####',
  ];

  const puzzle =
    createPuzzleFromBoard(
      level001,
      board,
    );

  const result =
    validatePuzzle(puzzle);

  assert(
    result.rowCluesValid,
    'Row clues must still match.',
  );

  assert(
    result.columnCluesValid,
    'Column clues must still match.',
  );

  assert(
    !result.connectivityValid,
    'Disconnected open area must fail connectivity.',
  );

  assert(
    !result.isSolved,
    'Disconnected layout must not solve the puzzle.',
  );
}

function checkInvalidMonsterDeadEnd(): void {
  const board = [
    '###',
    '...',
    '###',
  ];

  const level =
    createLevelFromBoard(
      'sanity-monster-dead-end',
      board,
      [
        {
          x: 1,
          y: 1,
        },
      ],
      [],
    );

  const puzzle =
    createPuzzleFromBoard(
      level,
      board,
    );

  const result =
    validatePuzzle(puzzle);

  assert(
    result.rowCluesValid,
    'Row clues should match fixture.',
  );

  assert(
    result.columnCluesValid,
    'Column clues should match fixture.',
  );

  assert(
    result.connectivityValid,
    'Fixture should stay connected.',
  );

  assert(
    !result.monsterDeadEndsValid,
    'Monster with two exits must fail dead-end rule.',
  );

  assert(
    !result.isSolved,
    'Invalid monster placement must not solve.',
  );
}

function checkOpenTwoByTwo(): void {
  const board = [
    '..',
    '..',
  ];

  const level =
    createLevelFromBoard(
      'sanity-open-2x2',
      board,
      [],
      [],
    );

  const puzzle =
    createPuzzleFromBoard(
      level,
      board,
    );

  const result =
    validatePuzzle(puzzle);

  assert(
    result.rowCluesValid,
    'Row clues should match fixture.',
  );

  assert(
    result.columnCluesValid,
    'Column clues should match fixture.',
  );

  assert(
    result.connectivityValid,
    'Open 2x2 should be connected.',
  );

  assert(
    !result.hallwayWidthValid,
    'Open 2x2 outside treasure room must fail.',
  );

  assert(
    !result.isSolved,
    'Open 2x2 must not solve.',
  );
}

function checkTreasureRoomWithTwoEntrances(): void {
  /*
   * Intended room:
   *
   * #####
   * #...#
   * M.C.M
   * #...#
   * #####
   *
   * The 3x3 room itself is open,
   * but it connects to hallway
   * cells from both left and right.
   */
  const board = [
    '#####',
    '#...#',
    '.....',
    '#...#',
    '#####',
  ];

  const level =
    createLevelFromBoard(
      'sanity-two-room-entrances',
      board,
      [
        {
          x: 0,
          y: 2,
        },
        {
          x: 4,
          y: 2,
        },
      ],
      [
        {
          x: 2,
          y: 2,
        },
      ],
    );

  const puzzle =
    createPuzzleFromBoard(
      level,
      board,
    );

  const result =
    validatePuzzle(puzzle);

  assert(
    result.rowCluesValid,
    'Row clues should match fixture.',
  );

  assert(
    result.columnCluesValid,
    'Column clues should match fixture.',
  );

  assert(
    result.connectivityValid,
    'Fixture should be connected.',
  );

  assert(
    !result.treasureRoomsValid,
    'Treasure room with two entrances must fail.',
  );

  assert(
    !result.isSolved,
    'Two-entrance treasure room must not solve.',
  );
}

function checkFixedObjectOverlap(): void {
  const level: LevelDefinition = {
    id: 'sanity-fixed-overlap',

    width: 2,
    height: 2,

    rowClues: [
      0,
      0,
    ],

    columnClues: [
      0,
      0,
    ],

    monsters: [
      {
        x: 0,
        y: 0,
      },
    ],

    chests: [],

    blockers: [
      {
        x: 0,
        y: 0,
      },
    ],

    doors: [],

    solution: [
      '..',
      '..',
    ],
  };

  let threw = false;

  try {
    new PuzzleState(level);
  } catch {
    threw = true;
  }

  assert(
    threw,
    'Overlapping fixed objects must be rejected.',
  );
}

function checkBlockerTopology(): void {
  const board = [
    '..',
    '..',
  ];

  const level =
    createLevelFromBoard(
      'sanity-blocker-topology',
      board,
      [],
      [],
      [
        {
          x: 0,
          y: 0,
        },
      ],
    );

  const puzzle =
    createPuzzleFromBoard(
      level,
      board,
    );

  const result =
    validatePuzzle(puzzle);

  assert(
    puzzle.getRowWallCount(0) === 0,
    'Blocker must not count as a row wall.',
  );

  assert(
    puzzle.getColumnWallCount(0) === 0,
    'Blocker must not count as a column wall.',
  );

  assert(
    result.hallwayWidthValid,
    'Blocker must break an otherwise open 2x2.',
  );
}

function checkValidHorizontalDoor(): void {
  const board = [
    '.#.',
    '...',
    '.#.',
  ];

  const level =
    createLevelFromBoard(
      'sanity-horizontal-door',
      board,
      [],
      [],
      [],
      [
        {
          position: {
            x: 1,
            y: 1,
          },
          orientation: 'horizontal',
        },
      ],
    );

  const puzzle =
    createPuzzleFromBoard(
      level,
      board,
    );

  const result =
    validatePuzzle(puzzle);

  assert(
    result.doorsValid,
    'Horizontal door should accept open left/right and wall up/down.',
  );
}

function checkBlockerCannotFrameDoor(): void {
  const board = [
    '...',
    '...',
    '.#.',
  ];

  const level =
    createLevelFromBoard(
      'sanity-blocker-door-frame',
      board,
      [],
      [],
      [
        {
          x: 1,
          y: 0,
        },
      ],
      [
        {
          position: {
            x: 1,
            y: 1,
          },
          orientation: 'horizontal',
        },
      ],
    );

  const puzzle =
    createPuzzleFromBoard(
      level,
      board,
    );

  const result =
    validatePuzzle(puzzle);

  assert(
    !result.doorsValid,
    'Blocker must not replace a wall framing a directional door.',
  );
}

function checkInvalidHorizontalDoorSide(): void {
  const board = [
    '.#.',
    '#..',
    '.#.',
  ];

  const level =
    createLevelFromBoard(
      'sanity-invalid-horizontal-door',
      board,
      [],
      [],
      [],
      [
        {
          position: {
            x: 1,
            y: 1,
          },
          orientation: 'horizontal',
        },
      ],
    );

  const puzzle =
    createPuzzleFromBoard(
      level,
      board,
    );

  const result =
    validatePuzzle(puzzle);

  assert(
    !result.doorsValid,
    'Horizontal door must reject a closed left/right neighbor.',
  );
}

function checkEdgeDoorInvalid(): void {
  const board = [
    '...',
    '...',
    '...',
  ];

  const level =
    createLevelFromBoard(
      'sanity-edge-door',
      board,
      [],
      [],
      [],
      [
        {
          position: {
            x: 0,
            y: 1,
          },
          orientation: 'vertical',
        },
      ],
    );

  const puzzle =
    createPuzzleFromBoard(
      level,
      board,
    );

  const result =
    validatePuzzle(puzzle);

  assert(
    !result.doorsValid,
    'Directional door on the board edge must be invalid.',
  );
}

function checkDoorInsideTreasureRoom(): void {
  const board = [
    '#####',
    '#...#',
    '#...#',
    '#...#',
    '##.##',
  ];

  const level =
    createLevelFromBoard(
      'sanity-door-inside-room',
      board,
      [],
      [
        {
          x: 2,
          y: 2,
        },
      ],
      [],
      [
        {
          position: {
            x: 1,
            y: 1,
          },
          orientation: 'horizontal',
        },
      ],
    );

  const puzzle =
    createPuzzleFromBoard(
      level,
      board,
    );

  const result =
    validatePuzzle(puzzle);

  assert(
    !result.treasureRoomsValid,
    'Directional door must not be accepted inside a treasure room.',
  );
}

function createPuzzleFromBoard(
  level: LevelDefinition,
  board: readonly string[],
): PuzzleState {
  validateBoardShape(
    board,
    level.width,
    level.height,
  );

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
      const symbol =
        board[y][x];

      if (symbol === '#') {
        puzzle.setCellState(
          x,
          y,
          CellState.Wall,
        );

        continue;
      }

      if (symbol !== '.') {
        throw new Error(
          `Unsupported board symbol "${symbol}" at (${x}, ${y}).`,
        );
      }
    }
  }

  return puzzle;
}

function createLevelFromBoard(
  id: string,
  board: readonly string[],
  monsters: readonly GridPosition[],
  chests: readonly GridPosition[],
  blockers: readonly GridPosition[] = [],
  doors: readonly DoorDefinition[] = [],
): LevelDefinition {
  if (board.length === 0) {
    throw new Error(
      'Sanity board cannot be empty.',
    );
  }

  const width =
    board[0].length;

  const height =
    board.length;

  validateBoardShape(
    board,
    width,
    height,
  );

  const rowClues =
    board.map(
      (row) =>
        countWalls(row),
    );

  const columnClues =
    Array.from(
      {
        length: width,
      },
      (
        _unused,
        x,
      ) => {
        let count = 0;

        for (
          let y = 0;
          y < height;
          y += 1
        ) {
          if (
            board[y][x] === '#'
          ) {
            count += 1;
          }
        }

        return count;
      },
    );

  return {
    id,
    width,
    height,
    rowClues,
    columnClues,
    monsters,
    chests,
    blockers,
    doors,
    solution: board,
  };
}

function countWalls(
  row: string,
): number {
  let count = 0;

  for (const symbol of row) {
    if (symbol === '#') {
      count += 1;

      continue;
    }

    if (symbol !== '.') {
      throw new Error(
        `Unsupported board symbol "${symbol}".`,
      );
    }
  }

  return count;
}

function validateBoardShape(
  board: readonly string[],
  width: number,
  height: number,
): void {
  if (
    board.length !== height
  ) {
    throw new Error(
      `Expected ${height} rows, received ${board.length}.`,
    );
  }

  for (
    let y = 0;
    y < board.length;
    y += 1
  ) {
    if (
      board[y].length !== width
    ) {
      throw new Error(
        `Row ${y} has width ${board[y].length}; expected ${width}.`,
      );
    }
  }
}

function assert(
  condition: boolean,
  message: string,
): void {
  if (!condition) {
    throw new Error(message);
  }
}