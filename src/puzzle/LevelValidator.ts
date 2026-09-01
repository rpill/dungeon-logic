import { PuzzleState } from './PuzzleState';

import {
  CellState,
  type GridPosition,
} from './types';

export interface ValidationResult {
  rowCluesValid: boolean;
  columnCluesValid: boolean;

  treasureRoomsValid: boolean;
  connectivityValid: boolean;

  monsterDeadEndsValid: boolean;
  hallwayWidthValid: boolean;

  isSolved: boolean;
}

interface RoomCandidate {
  topLeft: GridPosition;
  cellKeys: Set<string>;
}

type RoomLayout =
  readonly RoomCandidate[];

const DIRECTIONS = [
  {
    x: 1,
    y: 0,
  },
  {
    x: -1,
    y: 0,
  },
  {
    x: 0,
    y: 1,
  },
  {
    x: 0,
    y: -1,
  },
] as const;

export function validatePuzzle(
  puzzle: PuzzleState,
): ValidationResult {
  const rowCluesValid =
    areRowCluesValid(puzzle);

  const columnCluesValid =
    areColumnCluesValid(puzzle);

  const connectivityValid =
    isOpenAreaConnected(puzzle);

  const roomLayouts =
    findTreasureRoomLayouts(
      puzzle,
    );

  const treasureRoomsValid =
    roomLayouts.length > 0;

  let monsterDeadEndsValid = false;
  let hallwayWidthValid = false;

  let compatibleRoomLayoutExists =
    false;

  for (
    const layout
    of roomLayouts
  ) {
    const roomCells =
      collectRoomCellKeys(
        layout,
      );

    const monstersValid =
      areMonsterDeadEndsValid(
        puzzle,
        roomCells,
      );

    const hallwaysValid =
      hasValidHallwayWidth(
        puzzle,
        layout,
      );

    if (monstersValid) {
      monsterDeadEndsValid = true;
    }

    if (hallwaysValid) {
      hallwayWidthValid = true;
    }

    if (
      monstersValid &&
      hallwaysValid
    ) {
      compatibleRoomLayoutExists =
        true;

      break;
    }
  }

  const isSolved =
    rowCluesValid &&
    columnCluesValid &&
    connectivityValid &&
    treasureRoomsValid &&
    compatibleRoomLayoutExists;

  return {
    rowCluesValid,
    columnCluesValid,
    treasureRoomsValid,
    connectivityValid,
    monsterDeadEndsValid,
    hallwayWidthValid,
    isSolved,
  };
}

function areRowCluesValid(
  puzzle: PuzzleState,
): boolean {
  const level = puzzle.level;

  for (
    let y = 0;
    y < level.height;
    y += 1
  ) {
    if (
      puzzle.getRowWallCount(y) !==
      level.rowClues[y]
    ) {
      return false;
    }
  }

  return true;
}

function areColumnCluesValid(
  puzzle: PuzzleState,
): boolean {
  const level = puzzle.level;

  for (
    let x = 0;
    x < level.width;
    x += 1
  ) {
    if (
      puzzle.getColumnWallCount(x) !==
      level.columnClues[x]
    ) {
      return false;
    }
  }

  return true;
}

function findTreasureRoomLayouts(
  puzzle: PuzzleState,
): RoomLayout[] {
  const chests =
    puzzle.level.chests;

  if (chests.length === 0) {
    return [
      [],
    ];
  }

  const candidatesByChest =
    chests.map(
      (chest) =>
        findRoomCandidatesForChest(
          puzzle,
          chest,
        ),
    );

  if (
    candidatesByChest.some(
      (candidates) =>
        candidates.length === 0,
    )
  ) {
    return [];
  }

  const layouts: RoomCandidate[][] =
    [];

  buildRoomLayouts(
    candidatesByChest,
    0,
    [],
    new Set<string>(),
    layouts,
  );

  return layouts;
}

function findRoomCandidatesForChest(
  puzzle: PuzzleState,
  chest: GridPosition,
): RoomCandidate[] {
  const candidates: RoomCandidate[] =
    [];

  for (
    let topY = chest.y - 2;
    topY <= chest.y;
    topY += 1
  ) {
    for (
      let topX = chest.x - 2;
      topX <= chest.x;
      topX += 1
    ) {
      if (
        topX < 0 ||
        topY < 0 ||
        topX + 2 >=
        puzzle.level.width ||
        topY + 2 >=
        puzzle.level.height
      ) {
        continue;
      }

      const candidate =
        createRoomCandidate(
          topX,
          topY,
        );

      if (
        !isRoomCandidateValid(
          puzzle,
          candidate,
        )
      ) {
        continue;
      }

      candidates.push(
        candidate,
      );
    }
  }

  return candidates;
}

function createRoomCandidate(
  topX: number,
  topY: number,
): RoomCandidate {
  const cellKeys =
    new Set<string>();

  for (
    let y = topY;
    y < topY + 3;
    y += 1
  ) {
    for (
      let x = topX;
      x < topX + 3;
      x += 1
    ) {
      cellKeys.add(
        makeKey(x, y),
      );
    }
  }

  return {
    topLeft: {
      x: topX,
      y: topY,
    },
    cellKeys,
  };
}

function isRoomCandidateValid(
  puzzle: PuzzleState,
  candidate: RoomCandidate,
): boolean {
  /*
   * All nine room cells must be open.
   */
  for (
    const key
    of candidate.cellKeys
  ) {
    const position =
      parseKey(key);

    if (
      !isOpen(
        puzzle,
        position.x,
        position.y,
      )
    ) {
      return false;
    }

    /*
     * A monster cannot be inside a
     * treasure room: every monster
     * must be a hallway dead end.
     */
    if (
      puzzle.isMonster(
        position.x,
        position.y,
      )
    ) {
      return false;
    }
  }

  /*
   * Exactly one chest must belong
   * to this 3x3 room.
   */
  let chestCount = 0;

  for (
    const chest
    of puzzle.level.chests
  ) {
    if (
      candidate.cellKeys.has(
        makeKey(
          chest.x,
          chest.y,
        ),
      )
    ) {
      chestCount += 1;
    }
  }

  if (chestCount !== 1) {
    return false;
  }

  return (
    countRoomEntrances(
      puzzle,
      candidate,
    ) === 1
  );
}

function countRoomEntrances(
  puzzle: PuzzleState,
  room: RoomCandidate,
): number {
  let entrances = 0;

  for (
    const key
    of room.cellKeys
  ) {
    const position =
      parseKey(key);

    for (
      const direction
      of DIRECTIONS
    ) {
      const neighborX =
        position.x +
        direction.x;

      const neighborY =
        position.y +
        direction.y;

      if (
        !isInsideBoard(
          puzzle,
          neighborX,
          neighborY,
        )
      ) {
        continue;
      }

      const neighborKey =
        makeKey(
          neighborX,
          neighborY,
        );

      if (
        room.cellKeys.has(
          neighborKey,
        )
      ) {
        continue;
      }

      if (
        isOpen(
          puzzle,
          neighborX,
          neighborY,
        )
      ) {
        entrances += 1;
      }
    }
  }

  return entrances;
}

function buildRoomLayouts(
  candidatesByChest:
    readonly RoomCandidate[][],
  index: number,
  selected: RoomCandidate[],
  occupied: Set<string>,
  results: RoomCandidate[][],
): void {
  if (
    index ===
    candidatesByChest.length
  ) {
    results.push(
      [...selected],
    );

    return;
  }

  for (
    const candidate
    of candidatesByChest[index]
  ) {
    if (
      overlapsOccupiedCells(
        candidate,
        occupied,
      )
    ) {
      continue;
    }

    selected.push(candidate);

    for (
      const key
      of candidate.cellKeys
    ) {
      occupied.add(key);
    }

    buildRoomLayouts(
      candidatesByChest,
      index + 1,
      selected,
      occupied,
      results,
    );

    selected.pop();

    /*
     * Rebuild occupied rather than
     * blindly deleting keys because
     * this keeps the function safe
     * if room rules change later.
     */
    occupied.clear();

    for (
      const room
      of selected
    ) {
      for (
        const key
        of room.cellKeys
      ) {
        occupied.add(key);
      }
    }
  }
}

function overlapsOccupiedCells(
  candidate: RoomCandidate,
  occupied: Set<string>,
): boolean {
  for (
    const key
    of candidate.cellKeys
  ) {
    if (occupied.has(key)) {
      return true;
    }
  }

  return false;
}

function collectRoomCellKeys(
  layout: RoomLayout,
): Set<string> {
  const keys =
    new Set<string>();

  for (
    const room
    of layout
  ) {
    for (
      const key
      of room.cellKeys
    ) {
      keys.add(key);
    }
  }

  return keys;
}

function isOpenAreaConnected(
  puzzle: PuzzleState,
): boolean {
  const openCells: GridPosition[] =
    [];

  for (
    let y = 0;
    y < puzzle.level.height;
    y += 1
  ) {
    for (
      let x = 0;
      x < puzzle.level.width;
      x += 1
    ) {
      if (
        isOpen(
          puzzle,
          x,
          y,
        )
      ) {
        openCells.push({
          x,
          y,
        });
      }
    }
  }

  if (openCells.length === 0) {
    return false;
  }

  const visited =
    new Set<string>();

  const queue: GridPosition[] = [
    openCells[0],
  ];

  visited.add(
    makeKey(
      openCells[0].x,
      openCells[0].y,
    ),
  );

  let queueIndex = 0;

  while (
    queueIndex <
    queue.length
  ) {
    const current =
      queue[queueIndex];

    queueIndex += 1;

    for (
      const direction
      of DIRECTIONS
    ) {
      const x =
        current.x +
        direction.x;

      const y =
        current.y +
        direction.y;

      if (
        !isInsideBoard(
          puzzle,
          x,
          y,
        ) ||
        !isOpen(
          puzzle,
          x,
          y,
        )
      ) {
        continue;
      }

      const key =
        makeKey(x, y);

      if (visited.has(key)) {
        continue;
      }

      visited.add(key);

      queue.push({
        x,
        y,
      });
    }
  }

  return (
    visited.size ===
    openCells.length
  );
}

function areMonsterDeadEndsValid(
  puzzle: PuzzleState,
  roomCells: Set<string>,
): boolean {
  /*
   * First:
   * every monster must be a hallway
   * cell with exactly one open neighbor.
   */
  for (
    const monster
    of puzzle.level.monsters
  ) {
    const monsterKey =
      makeKey(
        monster.x,
        monster.y,
      );

    if (
      roomCells.has(
        monsterKey,
      )
    ) {
      return false;
    }

    if (
      countOpenNeighbors(
        puzzle,
        monster.x,
        monster.y,
      ) !== 1
    ) {
      return false;
    }
  }

  /*
   * Second:
   * every hallway dead end must
   * contain a monster.
   */
  for (
    let y = 0;
    y < puzzle.level.height;
    y += 1
  ) {
    for (
      let x = 0;
      x < puzzle.level.width;
      x += 1
    ) {
      if (
        !isOpen(
          puzzle,
          x,
          y,
        )
      ) {
        continue;
      }

      if (
        roomCells.has(
          makeKey(x, y),
        )
      ) {
        continue;
      }

      const neighbors =
        countOpenNeighbors(
          puzzle,
          x,
          y,
        );

      if (
        neighbors === 1 &&
        !puzzle.isMonster(
          x,
          y,
        )
      ) {
        return false;
      }
    }
  }

  return true;
}

function hasValidHallwayWidth(
  puzzle: PuzzleState,
  rooms: RoomLayout,
): boolean {
  for (
    let y = 0;
    y <
    puzzle.level.height - 1;
    y += 1
  ) {
    for (
      let x = 0;
      x <
      puzzle.level.width - 1;
      x += 1
    ) {
      const block = [
        makeKey(x, y),
        makeKey(x + 1, y),
        makeKey(x, y + 1),
        makeKey(x + 1, y + 1),
      ];

      const allOpen =
        isOpen(
          puzzle,
          x,
          y,
        ) &&
        isOpen(
          puzzle,
          x + 1,
          y,
        ) &&
        isOpen(
          puzzle,
          x,
          y + 1,
        ) &&
        isOpen(
          puzzle,
          x + 1,
          y + 1,
        );

      if (!allOpen) {
        continue;
      }

      const insideTreasureRoom =
        rooms.some(
          (room) =>
            block.every(
              (key) =>
                room.cellKeys.has(
                  key,
                ),
            ),
        );

      if (
        !insideTreasureRoom
      ) {
        return false;
      }
    }
  }

  return true;
}

function countOpenNeighbors(
  puzzle: PuzzleState,
  x: number,
  y: number,
): number {
  let count = 0;

  for (
    const direction
    of DIRECTIONS
  ) {
    const neighborX =
      x + direction.x;

    const neighborY =
      y + direction.y;

    if (
      !isInsideBoard(
        puzzle,
        neighborX,
        neighborY,
      )
    ) {
      continue;
    }

    if (
      isOpen(
        puzzle,
        neighborX,
        neighborY,
      )
    ) {
      count += 1;
    }
  }

  return count;
}

function isOpen(
  puzzle: PuzzleState,
  x: number,
  y: number,
): boolean {
  return (
    puzzle.getCellState(
      x,
      y,
    ) !== CellState.Wall
  );
}

function isInsideBoard(
  puzzle: PuzzleState,
  x: number,
  y: number,
): boolean {
  return (
    x >= 0 &&
    x < puzzle.level.width &&
    y >= 0 &&
    y < puzzle.level.height
  );
}

function makeKey(
  x: number,
  y: number,
): string {
  return `${x}:${y}`;
}

function parseKey(
  key: string,
): GridPosition {
  const [
    xText,
    yText,
  ] = key.split(':');

  return {
    x: Number(xText),
    y: Number(yText),
  };
}