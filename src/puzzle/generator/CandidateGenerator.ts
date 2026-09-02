import type {
  GridPosition,
  LevelDefinition,
} from '../types';

import { SeededRandom } from './SeededRandom';

import {
  GeneratorArchetype,
  type CandidateGenerationResult,
  type GeneratorArchetype as GeneratorArchetypeType,
  type GeneratorBoardSize,
  type PlannedRoom,
} from './types';

interface MutablePosition {
  x: number;
  y: number;
}

interface GrowthDirection {
  x: number;
  y: number;
}

interface FrontierEntry {
  position: MutablePosition;
  previousDirection:
    | GrowthDirection
    | null;
}

export interface GenerateCandidateInput {
  archetype: GeneratorArchetypeType;
  size: GeneratorBoardSize;
  seed: number;
}

const ORTHOGONAL_DIRECTIONS:
  readonly GrowthDirection[] = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

const EMPTY_ROOM_KEYS =
  new Set<string>();

export function generateCandidate(
  input: GenerateCandidateInput,
): CandidateGenerationResult {
  if (
    input.archetype !==
    GeneratorArchetype.MonsterOnly
  ) {
    return {
      ok: false,
      reason:
        `Archetype ${input.archetype} is not implemented yet.`,
    };
  }

  const random =
    new SeededRandom(input.seed);

  const grid =
    createOpenGrid(input.size);

  const start = {
    x: random.int(
      0,
      input.size,
    ),
    y: random.int(
      0,
      input.size,
    ),
  };

  grid[start.y][start.x] =
    true;

  const totalCells =
    input.size * input.size;

  const targetOpenRatio =
    0.46 +
    random.nextFloat() * 0.14;

  const targetOpenCount =
    Math.round(
      totalCells *
        targetOpenRatio,
    );

  growHallways(
    grid,
    start,
    targetOpenCount,
    random,
  );

  const solution =
    serializeSolution(grid);

  const monsters =
    getHallwayDeadEnds(
      solution,
      [],
    );

  if (monsters.length === 0) {
    return {
      ok: false,
      reason:
        'Monster-only geometry has no hallway dead ends.',
    };
  }

  const {
    rowClues,
    columnClues,
  } = deriveClues(solution);

  const level: LevelDefinition = {
    id:
      `generated-${input.archetype}-${input.size}-${input.seed >>> 0}`,
    width: input.size,
    height: input.size,
    rowClues,
    columnClues,
    monsters,
    chests: [],
    blockers: [],
    doors: [],
    solution,
  };

  return {
    ok: true,
    candidate: {
      id: level.id,
      seed: input.seed >>> 0,
      archetype: input.archetype,
      size: input.size,
      rooms: [],
      level,
    },
  };
}

export function deriveClues(
  solution: readonly string[],
): {
  rowClues: readonly number[];
  columnClues: readonly number[];
} {
  if (solution.length === 0) {
    throw new Error(
      'Solution must contain at least one row.',
    );
  }

  const width =
    solution[0].length;

  if (width === 0) {
    throw new Error(
      'Solution rows must not be empty.',
    );
  }

  for (
    let y = 0;
    y < solution.length;
    y += 1
  ) {
    if (
      solution[y].length !== width
    ) {
      throw new Error(
        `Solution row ${y} has width ${solution[y].length}; expected ${width}.`,
      );
    }
  }

  const rowClues =
    solution.map(
      (row) =>
        countWalls(row),
    );

  const columnClues =
    Array.from(
      { length: width },
      (_, x) => {
        let count = 0;

        for (
          let y = 0;
          y < solution.length;
          y += 1
        ) {
          const symbol =
            solution[y][x];

          if (symbol === '#') {
            count += 1;
            continue;
          }

          if (symbol !== '.') {
            throw new Error(
              `Unsupported board symbol "${symbol}" at (${x}, ${y}).`,
            );
          }
        }

        return count;
      },
    );

  return {
    rowClues,
    columnClues,
  };
}

export function getHallwayDeadEnds(
  solution: readonly string[],
  rooms: readonly PlannedRoom[],
): readonly GridPosition[] {
  const width =
    validateSolutionShape(
      solution,
    );

  const height =
    solution.length;

  const roomCellKeys =
    collectRoomCellKeys(rooms);

  const deadEnds:
    GridPosition[] = [];

  for (
    let y = 0;
    y < height;
    y += 1
  ) {
    for (
      let x = 0;
      x < width;
      x += 1
    ) {
      if (
        solution[y][x] !== '.' ||
        roomCellKeys.has(
          positionKey(x, y),
        )
      ) {
        continue;
      }

      let openNeighbors = 0;

      for (
        const direction
        of ORTHOGONAL_DIRECTIONS
      ) {
        const neighborX =
          x + direction.x;

        const neighborY =
          y + direction.y;

        if (
          neighborX < 0 ||
          neighborX >= width ||
          neighborY < 0 ||
          neighborY >= height
        ) {
          continue;
        }

        if (
          solution[neighborY][neighborX] ===
          '.'
        ) {
          openNeighbors += 1;
        }
      }

      if (openNeighbors === 1) {
        deadEnds.push({ x, y });
      }
    }
  }

  return deadEnds;
}

function createOpenGrid(
  size: number,
): boolean[][] {
  return Array.from(
    { length: size },
    () =>
      Array.from(
        { length: size },
        () => false,
      ),
  );
}

function growHallways(
  grid: boolean[][],
  start: MutablePosition,
  targetOpenCount: number,
  random: SeededRandom,
): void {
  const size =
    grid.length;

  const frontier:
    FrontierEntry[] = [
      {
        position: start,
        previousDirection: null,
      },
    ];

  let openCount = 1;

  while (
    openCount < targetOpenCount &&
    frontier.length > 0
  ) {
    const frontierIndex =
      random.int(
        0,
        frontier.length,
      );

    const entry =
      frontier[frontierIndex];

    const directions =
      biasedDirections(
        random,
        entry.previousDirection,
      );

    let opened = false;

    for (const direction of directions) {
      const x =
        entry.position.x +
        direction.x;

      const y =
        entry.position.y +
        direction.y;

      if (
        !isInside(
          size,
          x,
          y,
        ) ||
        grid[y][x] ||
        !canOpenWithoutTwoByTwo(
          grid,
          x,
          y,
          EMPTY_ROOM_KEYS,
        )
      ) {
        continue;
      }

      grid[y][x] = true;
      openCount += 1;
      opened = true;

      frontier.push({
        position: { x, y },
        previousDirection:
          direction,
      });

      break;
    }

    if (!opened) {
      frontier.splice(
        frontierIndex,
        1,
      );
    }
  }
}

function biasedDirections(
  random: SeededRandom,
  previousDirection:
    | GrowthDirection
    | null,
): GrowthDirection[] {
  const directions =
    random.shuffled(
      ORTHOGONAL_DIRECTIONS,
    );

  if (
    previousDirection === null ||
    random.nextFloat() >= 0.65
  ) {
    return directions;
  }

  const previousIndex =
    directions.findIndex(
      (direction) =>
        direction.x ===
          previousDirection.x &&
        direction.y ===
          previousDirection.y,
    );

  if (previousIndex <= 0) {
    return directions;
  }

  const [continuation] =
    directions.splice(
      previousIndex,
      1,
    );

  directions.unshift(
    continuation,
  );

  return directions;
}

function isInside(
  size: number,
  x: number,
  y: number,
): boolean {
  return (
    x >= 0 &&
    x < size &&
    y >= 0 &&
    y < size
  );
}

function canOpenWithoutTwoByTwo(
  grid: readonly boolean[][],
  x: number,
  y: number,
  roomCellKeys: ReadonlySet<string>,
): boolean {
  const size =
    grid.length;

  for (
    let top = y - 1;
    top <= y;
    top += 1
  ) {
    for (
      let left = x - 1;
      left <= x;
      left += 1
    ) {
      if (
        left < 0 ||
        top < 0 ||
        left + 1 >= size ||
        top + 1 >= size
      ) {
        continue;
      }

      const cells = [
        { x: left, y: top },
        { x: left + 1, y: top },
        { x: left, y: top + 1 },
        {
          x: left + 1,
          y: top + 1,
        },
      ];

      const allOpen =
        cells.every(
          (cell) =>
            (
              cell.x === x &&
              cell.y === y
            ) ||
            grid[cell.y][cell.x],
        );

      if (!allOpen) {
        continue;
      }

      const entirelyInsideRoom =
        cells.every(
          (cell) =>
            roomCellKeys.has(
              positionKey(
                cell.x,
                cell.y,
              ),
            ),
        );

      if (!entirelyInsideRoom) {
        return false;
      }
    }
  }

  return true;
}

function serializeSolution(
  grid: readonly boolean[][],
): readonly string[] {
  return grid.map(
    (row) =>
      row
        .map(
          (isOpen) =>
            isOpen ? '.' : '#',
        )
        .join(''),
  );
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

function validateSolutionShape(
  solution: readonly string[],
): number {
  if (solution.length === 0) {
    throw new Error(
      'Solution must contain at least one row.',
    );
  }

  const width =
    solution[0].length;

  if (width === 0) {
    throw new Error(
      'Solution rows must not be empty.',
    );
  }

  for (
    let y = 0;
    y < solution.length;
    y += 1
  ) {
    if (
      solution[y].length !== width
    ) {
      throw new Error(
        `Solution row ${y} has width ${solution[y].length}; expected ${width}.`,
      );
    }

    countWalls(solution[y]);
  }

  return width;
}

function collectRoomCellKeys(
  rooms: readonly PlannedRoom[],
): ReadonlySet<string> {
  const keys =
    new Set<string>();

  for (const room of rooms) {
    for (
      let offsetY = 0;
      offsetY < 3;
      offsetY += 1
    ) {
      for (
        let offsetX = 0;
        offsetX < 3;
        offsetX += 1
      ) {
        keys.add(
          positionKey(
            room.topLeft.x +
              offsetX,
            room.topLeft.y +
              offsetY,
          ),
        );
      }
    }
  }

  return keys;
}

function positionKey(
  x: number,
  y: number,
): string {
  return `${x}:${y}`;
}
