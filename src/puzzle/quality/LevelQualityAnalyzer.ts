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

  thickWallCellCount: number;
  thickWallCellRatio: number;
  wallOpenBoundaryEdgeCount: number;
  wallOpenBoundaryPerWall: number;
  largestWallComponentSize: number;
  largestWallComponentRatio: number;
  largestWallComponentPerimeterPerWall: number;

  clueOnlyForcedWallCount: number;
  clueOnlyForcedWallRatio: number;

  objectAwareForcedWallCount: number;
  objectAssistedForcedWallCount: number;

  basicPropagationResolvedWallCount: number;
  basicPropagationResolvedNonWallCount: number;
  basicPropagationResolvedCount: number;
  basicPropagationResolvedRatio: number;
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
  warnings: readonly string[];
}

export interface LevelGeometryWarningThresholds {
  maxThickWallCellRatio: number;
  minWallOpenBoundaryPerWall: number;
  maxLargestWallComponentRatio: number;
  maxBasicPropagationResolvedRatio: number;
}

export const DEFAULT_AUTHORED_QUALITY_LIMITS:
  LevelQualityLimits = {
    maxWallDensity: 0.55,
    maxFullWallLineCount: 0,
    maxSolidWall3x3Count: 0,
    maxClueOnlyForcedWallRatio: 0.25,
  };

export const DEFAULT_GEOMETRY_WARNING_THRESHOLDS:
  LevelGeometryWarningThresholds = {
    maxThickWallCellRatio: 0.60,
    minWallOpenBoundaryPerWall: 1.30,
    maxLargestWallComponentRatio: 0.75,
    maxBasicPropagationResolvedRatio: 0.70,
  };

export function analyzeLevelQuality(
  level: LevelDefinition,
  limits: LevelQualityLimits =
    DEFAULT_AUTHORED_QUALITY_LIMITS,
  warningThresholds: LevelGeometryWarningThresholds =
    DEFAULT_GEOMETRY_WARNING_THRESHOLDS,
): LevelQualityReport {
  validateSolutionShape(level);

  const totalCells =
    level.width * level.height;

  const wallCount =
    countSolutionWalls(level);

  const geometry =
    analyzeWallGeometry(level, wallCount);

  const clueOnlyForcedWallCount =
    countLinePropagationWalls(
      level,
      false,
    );

  const basicPropagation =
    analyzeLinePropagation(
      level,
      true,
    );

  const objectAwareForcedWallCount =
    basicPropagation.wallCount;

  const basicPropagationResolvedCount =
    basicPropagation.wallCount +
    basicPropagation.nonWallCount;

  const metrics: LevelQualityMetrics = {
    wallDensity:
      wallCount / totalCells,

    fullWallLineCount:
      countFullWallLines(level),

    nearFullWallLineCount:
      countNearFullWallLines(level),

    solidWall3x3Count:
      countSolidWall3x3(level),

    thickWallCellCount:
      geometry.thickWallCellCount,

    thickWallCellRatio:
      geometry.thickWallCellRatio,

    wallOpenBoundaryEdgeCount:
      geometry.wallOpenBoundaryEdgeCount,

    wallOpenBoundaryPerWall:
      geometry.wallOpenBoundaryPerWall,

    largestWallComponentSize:
      geometry.largestWallComponentSize,

    largestWallComponentRatio:
      geometry.largestWallComponentRatio,

    largestWallComponentPerimeterPerWall:
      geometry.largestWallComponentPerimeterPerWall,

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

    basicPropagationResolvedWallCount:
      basicPropagation.wallCount,

    basicPropagationResolvedNonWallCount:
      basicPropagation.nonWallCount,

    basicPropagationResolvedCount,

    basicPropagationResolvedRatio:
      basicPropagationResolvedCount /
      totalCells,
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

  const warnings: string[] = [];

  if (
    metrics.thickWallCellRatio >
    warningThresholds.maxThickWallCellRatio
  ) {
    warnings.push(
      `thick-wall cell ratio ${formatPercent(metrics.thickWallCellRatio)} exceeds warning threshold ${formatPercent(warningThresholds.maxThickWallCellRatio)}`,
    );
  }

  if (
    wallCount > 0 &&
    metrics.wallOpenBoundaryPerWall <
      warningThresholds.minWallOpenBoundaryPerWall
  ) {
    warnings.push(
      `wall/open boundary per wall ${metrics.wallOpenBoundaryPerWall.toFixed(2)} is below warning threshold ${warningThresholds.minWallOpenBoundaryPerWall.toFixed(2)}`,
    );
  }

  if (
    metrics.largestWallComponentRatio >
    warningThresholds.maxLargestWallComponentRatio
  ) {
    warnings.push(
      `largest wall component ratio ${formatPercent(metrics.largestWallComponentRatio)} exceeds warning threshold ${formatPercent(warningThresholds.maxLargestWallComponentRatio)}`,
    );
  }

  if (
    metrics.basicPropagationResolvedRatio >
    warningThresholds.maxBasicPropagationResolvedRatio
  ) {
    warnings.push(
      `basic propagation resolved ratio ${formatPercent(metrics.basicPropagationResolvedRatio)} exceeds warning threshold ${formatPercent(warningThresholds.maxBasicPropagationResolvedRatio)}`,
    );
  }

  return {
    passes: issues.length === 0,
    metrics,
    issues,
    warnings,
  };
}


interface WallGeometryMetrics {
  thickWallCellCount: number;
  thickWallCellRatio: number;
  wallOpenBoundaryEdgeCount: number;
  wallOpenBoundaryPerWall: number;
  largestWallComponentSize: number;
  largestWallComponentRatio: number;
  largestWallComponentPerimeterPerWall: number;
}

const ORTHOGONAL_OFFSETS: readonly GridPosition[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

function analyzeWallGeometry(
  level: LevelDefinition,
  wallCount: number,
): WallGeometryMetrics {
  if (wallCount === 0) {
    return {
      thickWallCellCount: 0,
      thickWallCellRatio: 0,
      wallOpenBoundaryEdgeCount: 0,
      wallOpenBoundaryPerWall: 0,
      largestWallComponentSize: 0,
      largestWallComponentRatio: 0,
      largestWallComponentPerimeterPerWall: 0,
    };
  }

  const walls = new Set<string>();

  for (let y = 0; y < level.height; y += 1) {
    for (let x = 0; x < level.width; x += 1) {
      if (level.solution[y][x] === '#') {
        walls.add(positionKey(x, y));
      }
    }
  }

  const thickWalls = new Set<string>();

  for (let y = 0; y < level.height - 1; y += 1) {
    for (let x = 0; x < level.width - 1; x += 1) {
      const block = [
        positionKey(x, y),
        positionKey(x + 1, y),
        positionKey(x, y + 1),
        positionKey(x + 1, y + 1),
      ];

      if (block.every((key) => walls.has(key))) {
        for (const key of block) {
          thickWalls.add(key);
        }
      }
    }
  }

  let wallOpenBoundaryEdgeCount = 0;

  for (const key of walls) {
    const position = parsePositionKey(key);

    for (const offset of ORTHOGONAL_OFFSETS) {
      const x = position.x + offset.x;
      const y = position.y + offset.y;

      if (
        x >= 0 &&
        y >= 0 &&
        x < level.width &&
        y < level.height &&
        !walls.has(positionKey(x, y))
      ) {
        wallOpenBoundaryEdgeCount += 1;
      }
    }
  }

  const unseen = new Set(walls);
  let largestComponent = new Set<string>();

  while (unseen.size > 0) {
    const first = unseen.values().next().value;

    if (first === undefined) {
      break;
    }

    unseen.delete(first);

    const component = new Set<string>([first]);
    const queue = [first];

    while (queue.length > 0) {
      const current = queue.pop();

      if (current === undefined) {
        break;
      }

      const position = parsePositionKey(current);

      for (const offset of ORTHOGONAL_OFFSETS) {
        const neighborKey = positionKey(
          position.x + offset.x,
          position.y + offset.y,
        );

        if (unseen.has(neighborKey)) {
          unseen.delete(neighborKey);
          component.add(neighborKey);
          queue.push(neighborKey);
        }
      }
    }

    if (component.size > largestComponent.size) {
      largestComponent = component;
    }
  }

  let largestComponentPerimeter = 0;

  for (const key of largestComponent) {
    const position = parsePositionKey(key);

    for (const offset of ORTHOGONAL_OFFSETS) {
      const neighborKey = positionKey(
        position.x + offset.x,
        position.y + offset.y,
      );

      if (!largestComponent.has(neighborKey)) {
        largestComponentPerimeter += 1;
      }
    }
  }

  return {
    thickWallCellCount: thickWalls.size,
    thickWallCellRatio: thickWalls.size / wallCount,
    wallOpenBoundaryEdgeCount,
    wallOpenBoundaryPerWall:
      wallOpenBoundaryEdgeCount / wallCount,
    largestWallComponentSize: largestComponent.size,
    largestWallComponentRatio:
      largestComponent.size / wallCount,
    largestWallComponentPerimeterPerWall:
      largestComponent.size === 0
        ? 0
        : largestComponentPerimeter /
          largestComponent.size,
  };
}

function positionKey(
  x: number,
  y: number,
): string {
  return `${x}:${y}`;
}

function parsePositionKey(
  key: string,
): GridPosition {
  const [xText, yText] = key.split(':');

  return {
    x: Number(xText),
    y: Number(yText),
  };
}

interface LinePropagationMetrics {
  wallCount: number;
  nonWallCount: number;
}

function countLinePropagationWalls(
  level: LevelDefinition,
  useFixedNonWalls: boolean,
): number {
  return analyzeLinePropagation(
    level,
    useFixedNonWalls,
  ).wallCount;
}

function analyzeLinePropagation(
  level: LevelDefinition,
  useFixedNonWalls: boolean,
): LinePropagationMetrics {
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

  let wallCount = 0;
  let nonWallCount = 0;

  for (const row of cells) {
    for (const cell of row) {
      if (
        cell ===
        ProbeCellState.Wall
      ) {
        wallCount += 1;
      } else if (
        cell ===
        ProbeCellState.NonWall
      ) {
        nonWallCount += 1;
      }
    }
  }

  return {
    wallCount,
    nonWallCount,
  };
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
