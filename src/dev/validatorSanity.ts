import { level001 } from '../data/levels/level001';

import {
  validatePuzzle,
} from '../puzzle/LevelValidator';

import { PuzzleState } from '../puzzle/PuzzleState';

import {
  CellState,
  type GridPosition,
  type LevelDefinition,
} from '../puzzle/types';

interface SanityCase {
  name: string;
  run: () => void;
}

export function runValidatorSanityChecks(): void {
  const cases: readonly SanityCase[] = [
    {
      name: 'valid level001 solution',
      run: checkValidLevel001,
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
  const puzzle =
    createPuzzleFromBoard(
      level001,
      level001.solution,
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
    result.isSolved,
    'Valid level001 must be solved.',
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