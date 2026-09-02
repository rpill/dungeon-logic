import type {
  GridPosition,
  LevelDefinition,
} from '../types';

import { SeededRandom } from './SeededRandom';

import {
  ALLOWED_SIZES,
  GeneratorArchetype,
  type CandidateGenerationResult,
  type GeneratorArchetype as GeneratorArchetypeType,
  type GeneratorBoardSize,
  type PlannedRoom,
} from './types';

interface GrowthDirection {
  x: number;
  y: number;
}

interface FrontierEntry {
  position: GridPosition;
  previousDirection:
    | GrowthDirection
    | null;
}

interface RoomEnvironment {
  rooms: readonly PlannedRoom[];
  roomGroups:
    readonly ReadonlySet<string>[];
  roomCellKeys: ReadonlySet<string>;
  forbiddenExternalKeys:
    ReadonlySet<string>;
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

const EMPTY_KEY_SET =
  new Set<string>();

export function generateCandidate(
  input: GenerateCandidateInput,
): CandidateGenerationResult {
  if (
    !ALLOWED_SIZES[
      input.archetype
    ].includes(input.size)
  ) {
    return {
      ok: false,
      reason:
        `Size ${input.size} is not supported for ${input.archetype}.`,
    };
  }

  const random =
    new SeededRandom(input.seed);

  if (
    input.archetype ===
    GeneratorArchetype.MonsterOnly
  ) {
    return generateMonsterOnly(
      input,
      random,
    );
  }

  return generateRoomCandidate(
    input,
    random,
  );
}

function generateMonsterOnly(
  input: GenerateCandidateInput,
  random: SeededRandom,
): CandidateGenerationResult {
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

  const targetOpenCount =
    chooseTargetOpenCount(
      input.size,
      random,
    );

  growHallways(
    grid,
    [start],
    targetOpenCount,
    random,
    [],
    EMPTY_KEY_SET,
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

  return createCandidateResult(
    input,
    [],
    monsters,
    [],
    solution,
  );
}

function generateRoomCandidate(
  input: GenerateCandidateInput,
  random: SeededRandom,
): CandidateGenerationResult {
  const roomCount =
    getRoomCount(
      input.archetype,
    );

  const roomEnvironment =
    planRoomEnvironment(
      input.size,
      roomCount,
      random,
    );

  if (roomEnvironment === null) {
    return {
      ok: false,
      reason:
        'Could not place compatible Treasure Rooms.',
    };
  }

  const grid =
    createOpenGrid(input.size);

  openRoomEnvironment(
    grid,
    roomEnvironment,
  );

  const entrances =
    roomEnvironment.rooms.map(
      (room) =>
        room.externalEntrance,
    );

  if (roomCount === 1) {
    if (
      input.archetype ===
      GeneratorArchetype.ChestOneRoom
    ) {
      const backboneCreated =
        carveOneRoomChestOnlyBackbone(
          grid,
          entrances[0],
          roomEnvironment,
          random,
        );

      if (!backboneCreated) {
        return {
          ok: false,
          reason:
            'Could not create a dead-end-free hallway backbone for one Treasure Room.',
        };
      }
    }
  } else {
    const connected =
      carveConnection(
        grid,
        entrances[0],
        entrances[1],
        random,
        roomEnvironment,
      );

    if (!connected) {
      return {
        ok: false,
        reason:
          'Could not connect Treasure Room entrances.',
      };
    }
  }

  const targetOpenCount =
    chooseTargetOpenCount(
      input.size,
      random,
    );

  growHallways(
    grid,
    entrances,
    targetOpenCount,
    random,
    roomEnvironment.roomGroups,
    roomEnvironment.forbiddenExternalKeys,
  );

  const chestOnly =
    isChestOnly(
      input.archetype,
    );

  if (chestOnly) {
    const pruned =
      pruneHallwayDeadEnds(
        grid,
        roomEnvironment.rooms,
        entrances,
      );

    if (!pruned) {
      return {
        ok: false,
        reason:
          'Chest-only geometry could not eliminate hallway dead ends.',
      };
    }
  }

  const solution =
    serializeSolution(grid);

  const deadEnds =
    getHallwayDeadEnds(
      solution,
      roomEnvironment.rooms,
    );

  if (
    chestOnly &&
    deadEnds.length !== 0
  ) {
    return {
      ok: false,
      reason:
        'Chest-only geometry still has hallway dead ends.',
    };
  }

  if (
    !chestOnly &&
    deadEnds.length === 0
  ) {
    return {
      ok: false,
      reason:
        'Mixed geometry has no hallway dead ends for Monsters.',
    };
  }

  const chests =
    placeChests(
      roomEnvironment.rooms,
      random,
    );

  if (chests === null) {
    return {
      ok: false,
      reason:
        'Could not place Chest with required entrance distance.',
    };
  }

  return createCandidateResult(
    input,
    roomEnvironment.rooms,
    chestOnly ? [] : deadEnds,
    chests,
    solution,
  );
}

function createCandidateResult(
  input: GenerateCandidateInput,
  rooms: readonly PlannedRoom[],
  monsters: readonly GridPosition[],
  chests: readonly GridPosition[],
  solution: readonly string[],
): CandidateGenerationResult {
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
    chests,
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
      rooms,
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
  const width =
    validateSolutionShape(
      solution,
    );

  const rowClues =
    solution.map(
      (row) => countWalls(row),
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
          if (
            solution[y][x] === '#'
          ) {
            count += 1;
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

function getRoomCount(
  archetype: GeneratorArchetypeType,
): 1 | 2 {
  if (
    archetype ===
      GeneratorArchetype.ChestTwoRooms ||
    archetype ===
      GeneratorArchetype.MixedTwoRooms
  ) {
    return 2;
  }

  return 1;
}

function isChestOnly(
  archetype: GeneratorArchetypeType,
): boolean {
  return (
    archetype ===
      GeneratorArchetype.ChestOneRoom ||
    archetype ===
      GeneratorArchetype.ChestTwoRooms
  );
}

function planRoomEnvironment(
  size: number,
  roomCount: 1 | 2,
  random: SeededRandom,
): RoomEnvironment | null {
  const plans =
    random.shuffled(
      enumerateRoomPlans(size),
    );

  if (roomCount === 1) {
    for (const plan of plans) {
      const environment =
        buildRoomEnvironment(
          [plan],
        );

      if (environment !== null) {
        return environment;
      }
    }

    return null;
  }

  for (
    let firstIndex = 0;
    firstIndex < plans.length;
    firstIndex += 1
  ) {
    for (
      let secondIndex =
        firstIndex + 1;
      secondIndex < plans.length;
      secondIndex += 1
    ) {
      const first =
        plans[firstIndex];

      const second =
        plans[secondIndex];

      if (
        roomsOverlapOrTouch(
          first,
          second,
        )
      ) {
        continue;
      }

      const environment =
        buildRoomEnvironment(
          [first, second],
        );

      if (environment !== null) {
        return environment;
      }
    }
  }

  return null;
}

function enumerateRoomPlans(
  size: number,
): PlannedRoom[] {
  const plans:
    PlannedRoom[] = [];

  for (
    let top = 0;
    top <= size - 3;
    top += 1
  ) {
    for (
      let left = 0;
      left <= size - 3;
      left += 1
    ) {
      const candidates:
        PlannedRoom[] = [
          {
            topLeft: {
              x: left,
              y: top,
            },
            internalEntrance: {
              x: left,
              y: top + 1,
            },
            externalEntrance: {
              x: left - 1,
              y: top + 1,
            },
          },
          {
            topLeft: {
              x: left,
              y: top,
            },
            internalEntrance: {
              x: left + 2,
              y: top + 1,
            },
            externalEntrance: {
              x: left + 3,
              y: top + 1,
            },
          },
          {
            topLeft: {
              x: left,
              y: top,
            },
            internalEntrance: {
              x: left + 1,
              y: top,
            },
            externalEntrance: {
              x: left + 1,
              y: top - 1,
            },
          },
          {
            topLeft: {
              x: left,
              y: top,
            },
            internalEntrance: {
              x: left + 1,
              y: top + 2,
            },
            externalEntrance: {
              x: left + 1,
              y: top + 3,
            },
          },
        ];

      for (const candidate of candidates) {
        if (
          isInside(
            size,
            candidate.externalEntrance.x,
            candidate.externalEntrance.y,
          )
        ) {
          plans.push(candidate);
        }
      }
    }
  }

  return plans;
}

function buildRoomEnvironment(
  rooms: readonly PlannedRoom[],
): RoomEnvironment | null {
  const roomGroups =
    rooms.map(
      (room) =>
        collectSingleRoomCellKeys(
          room,
        ),
    );

  const roomCellKeys =
    new Set<string>();

  for (const group of roomGroups) {
    for (const key of group) {
      if (roomCellKeys.has(key)) {
        return null;
      }

      roomCellKeys.add(key);
    }
  }

  const forbiddenExternalKeys =
    new Set<string>();

  for (
    let roomIndex = 0;
    roomIndex < rooms.length;
    roomIndex += 1
  ) {
    const room =
      rooms[roomIndex];

    const group =
      roomGroups[roomIndex];

    const entranceKey =
      positionKey(
        room.externalEntrance.x,
        room.externalEntrance.y,
      );

    if (
      roomCellKeys.has(
        entranceKey,
      )
    ) {
      return null;
    }

    for (const key of group) {
      const position =
        parsePositionKey(key);

      for (
        const direction
        of ORTHOGONAL_DIRECTIONS
      ) {
        const neighbor = {
          x:
            position.x +
            direction.x,
          y:
            position.y +
            direction.y,
        };

        const neighborKey =
          positionKey(
            neighbor.x,
            neighbor.y,
          );

        if (
          roomCellKeys.has(
            neighborKey,
          ) ||
          neighborKey ===
            entranceKey
        ) {
          continue;
        }

        forbiddenExternalKeys.add(
          neighborKey,
        );
      }
    }
  }

  for (const room of rooms) {
    const entranceKey =
      positionKey(
        room.externalEntrance.x,
        room.externalEntrance.y,
      );

    if (
      forbiddenExternalKeys.has(
        entranceKey,
      )
    ) {
      return null;
    }
  }

  if (
    new Set(
      rooms.map(
        (room) =>
          positionKey(
            room.externalEntrance.x,
            room.externalEntrance.y,
          ),
      ),
    ).size !== rooms.length
  ) {
    return null;
  }

  return {
    rooms,
    roomGroups,
    roomCellKeys,
    forbiddenExternalKeys,
  };
}

function roomsOverlapOrTouch(
  first: PlannedRoom,
  second: PlannedRoom,
): boolean {
  const firstKeys =
    collectSingleRoomCellKeys(
      first,
    );

  const secondKeys =
    collectSingleRoomCellKeys(
      second,
    );

  for (const key of firstKeys) {
    if (secondKeys.has(key)) {
      return true;
    }

    const position =
      parsePositionKey(key);

    for (
      const direction
      of ORTHOGONAL_DIRECTIONS
    ) {
      if (
        secondKeys.has(
          positionKey(
            position.x +
              direction.x,
            position.y +
              direction.y,
          ),
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

function openRoomEnvironment(
  grid: boolean[][],
  environment: RoomEnvironment,
): void {
  for (
    const key
    of environment.roomCellKeys
  ) {
    const position =
      parsePositionKey(key);

    grid[position.y][position.x] =
      true;
  }

  for (
    const room
    of environment.rooms
  ) {
    grid[
      room.externalEntrance.y
    ][
      room.externalEntrance.x
    ] = true;
  }
}

function carveOneRoomChestOnlyBackbone(
  grid: boolean[][],
  entrance: GridPosition,
  environment: RoomEnvironment,
  random: SeededRandom,
): boolean {
  const size =
    grid.length;

  const blocked =
    new Set(
      environment.forbiddenExternalKeys,
    );

  for (
    const key
    of environment.roomCellKeys
  ) {
    blocked.add(key);
  }

  blocked.delete(
    positionKey(
      entrance.x,
      entrance.y,
    ),
  );

  const anchors:
    GridPosition[] = [];

  for (
    let y = 0;
    y < size;
    y += 1
  ) {
    for (
      let x = 0;
      x < size;
      x += 1
    ) {
      const key =
        positionKey(x, y);

      if (
        blocked.has(key) ||
        (
          x === entrance.x &&
          y === entrance.y
        )
      ) {
        continue;
      }

      anchors.push({ x, y });
    }
  }

  for (
    const anchor
    of random.shuffled(anchors)
  ) {
    const trial =
      cloneGrid(grid);

    const connected =
      carvePathToClosedTarget(
        trial,
        entrance,
        anchor,
        random,
        environment.roomGroups,
        blocked,
      );

    if (!connected) {
      continue;
    }

    if (
      carveCycleAtAnchor(
        trial,
        anchor,
        environment,
        random,
      )
    ) {
      copyGridInto(
        grid,
        trial,
      );

      return true;
    }
  }

  return false;
}

function carveCycleAtAnchor(
  grid: boolean[][],
  anchor: GridPosition,
  environment: RoomEnvironment,
  random: SeededRandom,
): boolean {
  const size =
    grid.length;

  const neighborCandidates =
    random.shuffled(
      ORTHOGONAL_DIRECTIONS
        .map(
          (direction) => ({
            x:
              anchor.x +
              direction.x,
            y:
              anchor.y +
              direction.y,
          }),
        )
        .filter(
          (position) => {
            const key =
              positionKey(
                position.x,
                position.y,
              );

            return (
              isInside(
                size,
                position.x,
                position.y,
              ) &&
              !grid[
                position.y
              ][
                position.x
              ] &&
              !environment.roomCellKeys.has(
                key,
              ) &&
              !environment.forbiddenExternalKeys.has(
                key,
              )
            );
          },
        ),
    );

  for (
    let firstIndex = 0;
    firstIndex <
      neighborCandidates.length;
    firstIndex += 1
  ) {
    for (
      let secondIndex =
        firstIndex + 1;
      secondIndex <
        neighborCandidates.length;
      secondIndex += 1
    ) {
      const trial =
        cloneGrid(grid);

      const first =
        neighborCandidates[firstIndex];

      const second =
        neighborCandidates[secondIndex];

      if (
        !canOpenWithoutTwoByTwo(
          trial,
          first.x,
          first.y,
          environment.roomGroups,
        )
      ) {
        continue;
      }

      trial[first.y][first.x] =
        true;

      const blocked =
        new Set(
          environment.forbiddenExternalKeys,
        );

      for (
        const key
        of environment.roomCellKeys
      ) {
        blocked.add(key);
      }

      blocked.add(
        positionKey(
          anchor.x,
          anchor.y,
        ),
      );

      const connected =
        carvePathToClosedTarget(
          trial,
          first,
          second,
          random,
          environment.roomGroups,
          blocked,
        );

      if (connected) {
        copyGridInto(
          grid,
          trial,
        );

        return true;
      }
    }
  }

  return false;
}

function carveConnection(
  grid: boolean[][],
  start: GridPosition,
  target: GridPosition,
  random: SeededRandom,
  environment: RoomEnvironment,
): boolean {
  if (
    positionsEqual(
      start,
      target,
    )
  ) {
    return false;
  }

  const blocked =
    new Set(
      environment.forbiddenExternalKeys,
    );

  for (
    const key
    of environment.roomCellKeys
  ) {
    blocked.add(key);
  }

  blocked.delete(
    positionKey(
      start.x,
      start.y,
    ),
  );

  blocked.delete(
    positionKey(
      target.x,
      target.y,
    ),
  );

  return carvePathToOpenTarget(
    grid,
    start,
    target,
    random,
    environment.roomGroups,
    blocked,
  );
}

function carvePathToClosedTarget(
  grid: boolean[][],
  current: GridPosition,
  target: GridPosition,
  random: SeededRandom,
  roomGroups:
    readonly ReadonlySet<string>[],
  blockedKeys: ReadonlySet<string>,
): boolean {
  const size =
    grid.length;

  const directions =
    orderPathDirections(
      current,
      target,
      random,
    );

  for (const direction of directions) {
    const next = {
      x:
        current.x +
        direction.x,
      y:
        current.y +
        direction.y,
    };

    if (
      !isInside(
        size,
        next.x,
        next.y,
      )
    ) {
      continue;
    }

    if (
      positionsEqual(
        next,
        target,
      )
    ) {
      if (
        canOpenWithoutTwoByTwo(
          grid,
          next.x,
          next.y,
          roomGroups,
        )
      ) {
        grid[next.y][next.x] =
          true;

        return true;
      }

      continue;
    }

    const key =
      positionKey(
        next.x,
        next.y,
      );

    if (
      blockedKeys.has(key) ||
      grid[next.y][next.x] ||
      !canOpenWithoutTwoByTwo(
        grid,
        next.x,
        next.y,
        roomGroups,
      )
    ) {
      continue;
    }

    grid[next.y][next.x] =
      true;

    if (
      carvePathToClosedTarget(
        grid,
        next,
        target,
        random,
        roomGroups,
        blockedKeys,
      )
    ) {
      return true;
    }

    grid[next.y][next.x] =
      false;
  }

  return false;
}

function carvePathToOpenTarget(
  grid: boolean[][],
  current: GridPosition,
  target: GridPosition,
  random: SeededRandom,
  roomGroups:
    readonly ReadonlySet<string>[],
  blockedKeys: ReadonlySet<string>,
): boolean {
  const size =
    grid.length;

  const directions =
    orderPathDirections(
      current,
      target,
      random,
    );

  for (const direction of directions) {
    const next = {
      x:
        current.x +
        direction.x,
      y:
        current.y +
        direction.y,
    };

    if (
      !isInside(
        size,
        next.x,
        next.y,
      )
    ) {
      continue;
    }

    if (
      positionsEqual(
        next,
        target,
      )
    ) {
      return true;
    }

    const key =
      positionKey(
        next.x,
        next.y,
      );

    if (
      blockedKeys.has(key) ||
      grid[next.y][next.x] ||
      !canOpenWithoutTwoByTwo(
        grid,
        next.x,
        next.y,
        roomGroups,
      )
    ) {
      continue;
    }

    grid[next.y][next.x] =
      true;

    if (
      carvePathToOpenTarget(
        grid,
        next,
        target,
        random,
        roomGroups,
        blockedKeys,
      )
    ) {
      return true;
    }

    grid[next.y][next.x] =
      false;
  }

  return false;
}

function orderPathDirections(
  current: GridPosition,
  target: GridPosition,
  random: SeededRandom,
): GrowthDirection[] {
  const shuffled =
    random.shuffled(
      ORTHOGONAL_DIRECTIONS,
    );

  return shuffled.sort(
    (first, second) => {
      const firstDistance =
        manhattanDistance(
          {
            x:
              current.x +
              first.x,
            y:
              current.y +
              first.y,
          },
          target,
        );

      const secondDistance =
        manhattanDistance(
          {
            x:
              current.x +
              second.x,
            y:
              current.y +
              second.y,
          },
          target,
        );

      return (
        firstDistance -
        secondDistance
      );
    },
  );
}

function growHallways(
  grid: boolean[][],
  seeds: readonly GridPosition[],
  targetOpenCount: number,
  random: SeededRandom,
  roomGroups:
    readonly ReadonlySet<string>[],
  forbiddenExternalKeys:
    ReadonlySet<string>,
): void {
  const roomCellKeys =
    mergeSets(roomGroups);

  const frontier:
    FrontierEntry[] = [];

  const seen =
    new Set<string>();

  for (const seed of seeds) {
    const key =
      positionKey(
        seed.x,
        seed.y,
      );

    if (!seen.has(key)) {
      seen.add(key);
      frontier.push({
        position: seed,
        previousDirection: null,
      });
    }
  }

  for (
    let y = 0;
    y < grid.length;
    y += 1
  ) {
    for (
      let x = 0;
      x < grid.length;
      x += 1
    ) {
      const key =
        positionKey(x, y);

      if (
        grid[y][x] &&
        !roomCellKeys.has(key) &&
        !seen.has(key)
      ) {
        seen.add(key);
        frontier.push({
          position: { x, y },
          previousDirection: null,
        });
      }
    }
  }

  let openCount =
    countOpenCells(grid);

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

      const key =
        positionKey(x, y);

      if (
        !isInside(
          grid.length,
          x,
          y,
        ) ||
        grid[y][x] ||
        forbiddenExternalKeys.has(
          key,
        ) ||
        roomCellKeys.has(key) ||
        !canOpenWithoutTwoByTwo(
          grid,
          x,
          y,
          roomGroups,
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

function pruneHallwayDeadEnds(
  grid: boolean[][],
  rooms: readonly PlannedRoom[],
  protectedEntrances:
    readonly GridPosition[],
): boolean {
  const protectedKeys =
    new Set(
      protectedEntrances.map(
        (position) =>
          positionKey(
            position.x,
            position.y,
          ),
      ),
    );

  while (true) {
    const deadEnds =
      getHallwayDeadEnds(
        serializeSolution(grid),
        rooms,
      );

    if (deadEnds.length === 0) {
      return true;
    }

    const removable =
      deadEnds.filter(
        (position) =>
          !protectedKeys.has(
            positionKey(
              position.x,
              position.y,
            ),
          ),
      );

    if (removable.length === 0) {
      return false;
    }

    for (const position of removable) {
      grid[position.y][position.x] =
        false;
    }
  }
}

function placeChests(
  rooms: readonly PlannedRoom[],
  random: SeededRandom,
): readonly GridPosition[] | null {
  const chests:
    GridPosition[] = [];

  for (const room of rooms) {
    const candidates:
      GridPosition[] = [];

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
        const position = {
          x:
            room.topLeft.x +
            offsetX,
          y:
            room.topLeft.y +
            offsetY,
        };

        if (
          manhattanDistance(
            position,
            room.internalEntrance,
          ) >= 2
        ) {
          candidates.push(
            position,
          );
        }
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    chests.push(
      random.choose(candidates),
    );
  }

  return chests;
}

function chooseTargetOpenCount(
  size: number,
  random: SeededRandom,
): number {
  const totalCells =
    size * size;

  const targetOpenRatio =
    0.46 +
    random.nextFloat() * 0.14;

  return Math.round(
    totalCells *
      targetOpenRatio,
  );
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
  roomGroups:
    readonly ReadonlySet<string>[],
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
        {
          x: left + 1,
          y: top,
        },
        {
          x: left,
          y: top + 1,
        },
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
        roomGroups.some(
          (group) =>
            cells.every(
              (cell) =>
                group.has(
                  positionKey(
                    cell.x,
                    cell.y,
                  ),
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
  return mergeSets(
    rooms.map(
      (room) =>
        collectSingleRoomCellKeys(
          room,
        ),
    ),
  );
}

function collectSingleRoomCellKeys(
  room: PlannedRoom,
): ReadonlySet<string> {
  const keys =
    new Set<string>();

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

  return keys;
}

function mergeSets(
  sets:
    readonly ReadonlySet<string>[],
): ReadonlySet<string> {
  const merged =
    new Set<string>();

  for (const set of sets) {
    for (const value of set) {
      merged.add(value);
    }
  }

  return merged;
}

function countOpenCells(
  grid: readonly boolean[][],
): number {
  let count = 0;

  for (const row of grid) {
    for (const isOpen of row) {
      if (isOpen) {
        count += 1;
      }
    }
  }

  return count;
}

function cloneGrid(
  grid: readonly boolean[][],
): boolean[][] {
  return grid.map(
    (row) => [...row],
  );
}

function copyGridInto(
  target: boolean[][],
  source: readonly boolean[][],
): void {
  for (
    let y = 0;
    y < target.length;
    y += 1
  ) {
    for (
      let x = 0;
      x < target[y].length;
      x += 1
    ) {
      target[y][x] =
        source[y][x];
    }
  }
}

function positionsEqual(
  first: GridPosition,
  second: GridPosition,
): boolean {
  return (
    first.x === second.x &&
    first.y === second.y
  );
}

function manhattanDistance(
  first: GridPosition,
  second: GridPosition,
): number {
  return (
    Math.abs(
      first.x - second.x,
    ) +
    Math.abs(
      first.y - second.y,
    )
  );
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
  const [xText, yText] =
    key.split(':');

  return {
    x: Number(xText),
    y: Number(yText),
  };
}
