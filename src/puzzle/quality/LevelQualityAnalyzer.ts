import type {
  GridPosition,
  LevelDefinition,
} from '../types';

const ProbeCellState = {
  Unknown: 'unknown',
  Wall: 'wall',
  NonWall: 'non-wall',
} as const;

type ProbeCellStateValue =
  typeof ProbeCellState[
    keyof typeof ProbeCellState
  ];

export interface LevelQualityMetrics {
  wallDensity: number;
  fullWallLineCount: number;
  nearFullWallLineCount: number;
  solidWall3x3Count: number;

  clueOnlyForcedWallCount: number;
  clueOnlyForcedWallRatio: number;

  objectAwareForcedWallCount: number;
  objectAssistedForcedWallCount: number;
}

export interface LevelQualityLimits {
  maxWallDensity: number;
  maxFullWallLineCount: number;
  maxSolidWall3x3Count: number;
  maxClueOnlyForcedWallRatio: number;
}

export interface LevelQualityReport {
  passes: boolean;
  metrics: LevelQualityMetrics;
  issues: readonly string[];
}

export const DEFAULT_AUTHORED_QUALITY_LIMITS:
  LevelQualityLimits = {
    maxWallDensity: 0.55,
    maxFullWallLineCount: 0,
    maxSolidWall3x3Count: 0,
    maxClueOnlyForcedWallRatio: 0.25,
  };

export function analyzeLevelQuality(
  level: LevelDefinition,
  limits: LevelQualityLimits =
    DEFAULT_AUTHORED_QUALITY_LIMITS,
): LevelQualityReport {
  validateSolutionShape(level);

  const totalCells =
    level.width * level.height;

  const wallCount =
    countSolutionWalls(level);

  const clueOnlyForcedWallCount =
    countLinePropagationWalls(
      level,
      false,
    );

  const objectAwareForcedWallCount =
    countLinePropagationWalls(
      level,
      true,
    );

  const metrics: LevelQualityMetrics = {
    wallDensity:
      wallCount / totalCells,

    fullWallLineCount:
      countFullWallLines(level),

    nearFullWallLineCount:
      countNearFullWallLines(level),

    solidWall3x3Count:
      countSolidWall3x3(level),

    clueOnlyForcedWallCount,

    clueOnlyForcedWallRatio:
      clueOnlyForcedWallCount /
      totalCells,

    objectAwareForcedWallCount,

    objectAssistedForcedWallCount:
      Math.max(
        0,
        objectAwareForcedWallCount -
          clueOnlyForcedWallCount,
      ),
  };

  const issues: string[] = [];

  if (
    metrics.wallDensity >
    limits.maxWallDensity
  ) {
    issues.push(
      `wall density ${formatPercent(metrics.wallDensity)} exceeds ${formatPercent(limits.maxWallDensity)}`,
    );
  }

  if (
    metrics.fullWallLineCount >
    limits.maxFullWallLineCount
  ) {
    issues.push(
      `${metrics.fullWallLineCount} full wall line(s) exceed allowed ${limits.maxFullWallLineCount}`,
    );
  }

  if (
    metrics.solidWall3x3Count >
    limits.maxSolidWall3x3Count
  ) {
    issues.push(
      `${metrics.solidWall3x3Count} solid 3x3 wall block(s) exceed allowed ${limits.maxSolidWall3x3Count}`,
    );
  }

  if (
    metrics.clueOnlyForcedWallRatio >
    limits.maxClueOnlyForcedWallRatio
  ) {
    issues.push(
      `clue-only forced wall ratio ${formatPercent(metrics.clueOnlyForcedWallRatio)} exceeds ${formatPercent(limits.maxClueOnlyForcedWallRatio)}`,
    );
  }

  return {
    passes: issues.length === 0,
    metrics,
    issues,
  };
}

function countLinePropagationWalls(
  level: LevelDefinition,
  useFixedNonWalls: boolean,
): number {
  const cells: ProbeCellStateValue[][] =
    Array.from(
      {
        length: level.height,
      },
      () =>
        Array.from(
          {
            length: level.width,
          },
          () => ProbeCellState.Unknown,
        ),
    );

  if (useFixedNonWalls) {
    for (
      const position
      of getFixedNonWallPositions(level)
    ) {
      cells[position.y][position.x] =
        ProbeCellState.NonWall;
    }
  }

  let changed = true;

  while (changed) {
    changed = false;

    for (
      let y = 0;
      y < level.height;
      y += 1
    ) {
      if (
        propagateLine(
          level.rowClues[y],
          getRowCoordinates(
            level.width,
            y,
          ),
          cells,
        )
      ) {
        changed = true;
      }
    }

    for (
      let x = 0;
      x < level.width;
      x += 1
    ) {
      if (
        propagateLine(
          level.columnClues[x],
          getColumnCoordinates(
            level.height,
            x,
          ),
          cells,
        )
      ) {
        changed = true;
      }
    }
  }

  let walls = 0;

  for (const row of cells) {
    for (const cell of row) {
      if (
        cell ===
        ProbeCellState.Wall
      ) {
        walls += 1;
      }
    }
  }

  return walls;
}

function propagateLine(
  target: number,
  coordinates: readonly GridPosition[],
  cells: ProbeCellStateValue[][],
): boolean {
  let wallsPlaced = 0;

  const unknown:
    GridPosition[] = [];

  for (
    const position
    of coordinates
  ) {
    const current =
      cells[position.y][position.x];

    if (
      current ===
      ProbeCellState.Wall
    ) {
      wallsPlaced += 1;
    } else if (
      current ===
      ProbeCellState.Unknown
    ) {
      unknown.push(position);
    }
  }

  let next:
    ProbeCellStateValue |
    null = null;

  if (wallsPlaced === target) {
    next = ProbeCellState.NonWall;
  } else if (
    wallsPlaced +
      unknown.length ===
    target
  ) {
    next = ProbeCellState.Wall;
  }

  if (
    next === null ||
    unknown.length === 0
  ) {
    return false;
  }

  for (
    const position
    of unknown
  ) {
    cells[position.y][position.x] =
      next;
  }

  return true;
}

function getFixedNonWallPositions(
  level: LevelDefinition,
): readonly GridPosition[] {
  const result: GridPosition[] = [
    ...level.monsters,
    ...level.chests,
  ];

  for (const door of level.doors) {
    result.push(
      door.position,
    );
  }

  /*
   * A blocker is CLOSED topology, but it is
   * still known not to be an ordinary clue
   * WALL. For line-count propagation it
   * therefore removes one ordinary-wall
   * candidate just like other fixed cells.
   */
  result.push(
    ...level.blockers,
  );

  return result;
}

function getRowCoordinates(
  width: number,
  y: number,
): readonly GridPosition[] {
  return Array.from(
    {
      length: width,
    },
    (
      _unused,
      x,
    ) => ({ x, y }),
  );
}

function getColumnCoordinates(
  height: number,
  x: number,
): readonly GridPosition[] {
  return Array.from(
    {
      length: height,
    },
    (
      _unused,
      y,
    ) => ({ x, y }),
  );
}

function countSolutionWalls(
  level: LevelDefinition,
): number {
  let count = 0;

  for (
    const row
    of level.solution
  ) {
    for (const symbol of row) {
      if (symbol === '#') {
        count += 1;
      }
    }
  }

  return count;
}

function countFullWallLines(
  level: LevelDefinition,
): number {
  let count = 0;

  for (
    const clue
    of level.rowClues
  ) {
    if (clue === level.width) {
      count += 1;
    }
  }

  for (
    const clue
    of level.columnClues
  ) {
    if (clue === level.height) {
      count += 1;
    }
  }

  return count;
}

function countNearFullWallLines(
  level: LevelDefinition,
): number {
  let count = 0;

  for (
    const clue
    of level.rowClues
  ) {
    if (
      clue ===
      level.width - 1
    ) {
      count += 1;
    }
  }

  for (
    const clue
    of level.columnClues
  ) {
    if (
      clue ===
      level.height - 1
    ) {
      count += 1;
    }
  }

  return count;
}

function countSolidWall3x3(
  level: LevelDefinition,
): number {
  let count = 0;

  for (
    let topY = 0;
    topY <= level.height - 3;
    topY += 1
  ) {
    for (
      let topX = 0;
      topX <= level.width - 3;
      topX += 1
    ) {
      let allWalls = true;

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
          if (
            level.solution[y][x] !== '#'
          ) {
            allWalls = false;
          }
        }
      }

      if (allWalls) {
        count += 1;
      }
    }
  }

  return count;
}

function validateSolutionShape(
  level: LevelDefinition,
): void {
  if (
    level.solution.length !==
    level.height
  ) {
    throw new Error(
      `${level.id} solution height does not match level height.`,
    );
  }

  for (
    let y = 0;
    y < level.height;
    y += 1
  ) {
    const row =
      level.solution[y];

    if (
      row.length !==
      level.width
    ) {
      throw new Error(
        `${level.id} solution row ${y} does not match level width.`,
      );
    }

    for (const symbol of row) {
      if (
        symbol !== '#' &&
        symbol !== '.'
      ) {
        throw new Error(
          `${level.id} solution contains unsupported symbol "${symbol}".`,
        );
      }
    }
  }
}

function formatPercent(
  value: number,
): string {
  return `${(
    value * 100
  ).toFixed(1)}%`;
}
