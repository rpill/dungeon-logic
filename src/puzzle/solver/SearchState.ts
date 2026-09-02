import type {
  GridPosition,
  LevelDefinition,
} from '../types';

import {
  SearchCellState,
  type LineStatus,
  type SearchCellStateValue,
} from './types';

interface TrailEntry {
  x: number;
  y: number;
  previous: SearchCellStateValue;
}

interface RoomCandidate {
  cells: readonly GridPosition[];
}

export class SearchState {
  readonly level: LevelDefinition;

  private readonly cells:
    (
      SearchCellStateValue |
      null
    )[][];

  private readonly fixedOpen =
    new Set<string>();

  private readonly trail:
    TrailEntry[] = [];

  private readonly roomCandidates =
    new Map<
      string,
      readonly RoomCandidate[]
    >();

  constructor(level: LevelDefinition) {
    this.level = level;

    this.cells = Array.from(
      { length: level.height },
      () =>
        Array<SearchCellStateValue | null>(
          level.width,
        ).fill(
          SearchCellState.Unassigned,
        ),
    );

    for (const blocker of level.blockers) {
      this.cells[blocker.y][blocker.x] =
        null;
    }

    for (
      const position
      of [
        ...level.monsters,
        ...level.chests,
        ...level.doors.map(
          (door) => door.position,
        ),
      ]
    ) {
      const key =
        this.positionKey(position);

      this.fixedOpen.add(key);

      this.cells[position.y][position.x] =
        SearchCellState.Open;
    }

    this.initializeRoomCandidates();
  }

  getCellState(
    x: number,
    y: number,
  ): SearchCellStateValue | null {
    return this.cells[y][x];
  }

  isMutableCell(
    x: number,
    y: number,
  ): boolean {
    if (this.cells[y][x] === null) {
      return false;
    }

    return !this.fixedOpen.has(
      `${x}:${y}`,
    );
  }

  assign(
    x: number,
    y: number,
    next: SearchCellStateValue,
  ): boolean {
    if (
      next ===
      SearchCellState.Unassigned
    ) {
      throw new Error(
        'SearchState.assign cannot assign UNASSIGNED.',
      );
    }

    const current =
      this.cells[y][x];

    if (current === null) {
      return false;
    }

    if (current === next) {
      return true;
    }

    if (
      current !==
      SearchCellState.Unassigned
    ) {
      return false;
    }

    if (!this.isMutableCell(x, y)) {
      return false;
    }

    this.trail.push({
      x,
      y,
      previous: current,
    });

    this.cells[y][x] = next;

    return true;
  }

  checkpoint(): number {
    return this.trail.length;
  }

  rollback(
    checkpoint: number,
  ): void {
    while (
      this.trail.length >
      checkpoint
    ) {
      const entry =
        this.trail.pop();

      if (entry === undefined) {
        throw new Error(
          'SearchState trail underflow.',
        );
      }

      this.cells[entry.y][entry.x] =
        entry.previous;
    }
  }

  isComplete(): boolean {
    return (
      this.getUnassignedMutablePositions()
        .length === 0
    );
  }

  getUnassignedMutablePositions():
    readonly GridPosition[] {
    const result: GridPosition[] = [];

    for (
      let y = 0;
      y < this.level.height;
      y += 1
    ) {
      for (
        let x = 0;
        x < this.level.width;
        x += 1
      ) {
        if (
          this.isMutableCell(x, y) &&
          this.cells[y][x] ===
            SearchCellState.Unassigned
        ) {
          result.push({ x, y });
        }
      }
    }

    return result;
  }

  getRowStatus(
    y: number,
  ): LineStatus {
    const unassigned:
      GridPosition[] = [];

    let wallsPlaced = 0;

    for (
      let x = 0;
      x < this.level.width;
      x += 1
    ) {
      const state =
        this.cells[y][x];

      if (
        state ===
        SearchCellState.Wall
      ) {
        wallsPlaced += 1;
      } else if (
        state ===
        SearchCellState.Unassigned &&
        this.isMutableCell(x, y)
      ) {
        unassigned.push({ x, y });
      }
    }

    return {
      target: this.level.rowClues[y],
      wallsPlaced,
      unassigned,
    };
  }

  getColumnStatus(
    x: number,
  ): LineStatus {
    const unassigned:
      GridPosition[] = [];

    let wallsPlaced = 0;

    for (
      let y = 0;
      y < this.level.height;
      y += 1
    ) {
      const state =
        this.cells[y][x];

      if (
        state ===
        SearchCellState.Wall
      ) {
        wallsPlaced += 1;
      } else if (
        state ===
        SearchCellState.Unassigned &&
        this.isMutableCell(x, y)
      ) {
        unassigned.push({ x, y });
      }
    }

    return {
      target:
        this.level.columnClues[x],
      wallsPlaced,
      unassigned,
    };
  }

  isPotentialConnectivityValid():
    boolean {
    const mandatoryOpen:
      GridPosition[] = [];

    for (
      let y = 0;
      y < this.level.height;
      y += 1
    ) {
      for (
        let x = 0;
        x < this.level.width;
        x += 1
      ) {
        if (
          this.cells[y][x] ===
          SearchCellState.Open
        ) {
          mandatoryOpen.push({
            x,
            y,
          });
        }
      }
    }

    if (mandatoryOpen.length <= 1) {
      return true;
    }

    const start =
      mandatoryOpen[0];

    const queue:
      GridPosition[] = [start];

    const visited =
      new Set<string>();

    while (queue.length > 0) {
      const current =
        queue.shift();

      if (current === undefined) {
        break;
      }

      const key =
        `${current.x}:${current.y}`;

      if (visited.has(key)) {
        continue;
      }

      visited.add(key);

      const neighbors = [
        {
          x: current.x + 1,
          y: current.y,
        },
        {
          x: current.x - 1,
          y: current.y,
        },
        {
          x: current.x,
          y: current.y + 1,
        },
        {
          x: current.x,
          y: current.y - 1,
        },
      ];

      for (
        const neighbor
        of neighbors
      ) {
        if (
          neighbor.x < 0 ||
          neighbor.x >=
            this.level.width ||
          neighbor.y < 0 ||
          neighbor.y >=
            this.level.height
        ) {
          continue;
        }

        const cell =
          this.cells[
            neighbor.y
          ][neighbor.x];

        if (
          cell === null ||
          cell ===
            SearchCellState.Wall
        ) {
          continue;
        }

        const neighborKey =
          `${neighbor.x}:${neighbor.y}`;

        if (
          !visited.has(
            neighborKey,
          )
        ) {
          queue.push(neighbor);
        }
      }
    }

    return mandatoryOpen.every(
      (position) =>
        visited.has(
          `${position.x}:${position.y}`,
        ),
    );
  }

  hasTreasureRoomCandidateForEveryChest():
    boolean {
    for (
      const chest
      of this.level.chests
    ) {
      const candidates =
        this.roomCandidates.get(
          this.positionKey(chest),
        ) ?? [];

      const hasPossible =
        candidates.some(
          (candidate) =>
            candidate.cells.every(
              (position) =>
                this.cells[
                  position.y
                ][position.x] !==
                  SearchCellState.Wall,
            ),
        );

      if (!hasPossible) {
        return false;
      }
    }

    return true;
  }

  selectMostConstrainedCell():
    GridPosition | null {
    const candidates =
      this.getUnassignedMutablePositions();

    let best:
      GridPosition | null = null;

    let bestScore =
      Number.NEGATIVE_INFINITY;

    for (
      const position
      of candidates
    ) {
      const score =
        this.constraintScore(
          position,
        );

      if (score > bestScore) {
        best = position;
        bestScore = score;
      }
    }

    return best;
  }

  private initializeRoomCandidates():
    void {
    for (
      const chest
      of this.level.chests
    ) {
      const candidates:
        RoomCandidate[] = [];

      for (
        let top =
          chest.y - 2;
        top <= chest.y;
        top += 1
      ) {
        for (
          let left =
            chest.x - 2;
          left <= chest.x;
          left += 1
        ) {
          if (
            left < 0 ||
            top < 0 ||
            left + 2 >=
              this.level.width ||
            top + 2 >=
              this.level.height
          ) {
            continue;
          }

          const cells:
            GridPosition[] = [];

          for (
            let y = top;
            y < top + 3;
            y += 1
          ) {
            for (
              let x = left;
              x < left + 3;
              x += 1
            ) {
              cells.push({
                x,
                y,
              });
            }
          }

          if (
            !this
              .isStaticRoomCandidateValid(
                cells,
                chest,
              )
          ) {
            continue;
          }

          candidates.push({
            cells,
          });
        }
      }

      this.roomCandidates.set(
        this.positionKey(chest),
        candidates,
      );
    }
  }

  private isStaticRoomCandidateValid(
    cells: readonly GridPosition[],
    chest: GridPosition,
  ): boolean {
    let chestCount = 0;

    for (const position of cells) {
      if (
        this.level.blockers.some(
          (blocker) =>
            blocker.x ===
              position.x &&
            blocker.y ===
              position.y,
        )
      ) {
        return false;
      }

      if (
        this.level.monsters.some(
          (monster) =>
            monster.x ===
              position.x &&
            monster.y ===
              position.y,
        )
      ) {
        return false;
      }

      if (
        this.level.doors.some(
          (door) =>
            door.position.x ===
              position.x &&
            door.position.y ===
              position.y,
        )
      ) {
        return false;
      }

      if (
        this.level.chests.some(
          (candidateChest) =>
            candidateChest.x ===
              position.x &&
            candidateChest.y ===
              position.y,
        )
      ) {
        chestCount += 1;
      }
    }

    return (
      chestCount === 1 &&
      cells.some(
        (position) =>
          position.x === chest.x &&
          position.y === chest.y,
      )
    );
  }

  private constraintScore(
    position: GridPosition,
  ): number {
    const row =
      this.getRowStatus(
        position.y,
      );

    const column =
      this.getColumnStatus(
        position.x,
      );

    const rowScore =
      this.lineConstraintScore(row);

    const columnScore =
      this.lineConstraintScore(
        column,
      );

    const doorScore =
      this.level.doors.some(
        (door) =>
          Math.abs(
            door.position.x -
              position.x,
          ) +
            Math.abs(
              door.position.y -
                position.y,
            ) ===
          1,
      )
        ? 25
        : 0;

    const roomScore =
      this.roomCandidatePressure(
        position,
      );

    return (
      rowScore +
      columnScore +
      doorScore +
      roomScore
    );
  }

  private lineConstraintScore(
    status: LineStatus,
  ): number {
    const remaining =
      status.unassigned.length;

    if (remaining === 0) {
      return 0;
    }

    const wallsNeeded =
      status.target -
      status.wallsPlaced;

    const openNeeded =
      remaining -
      wallsNeeded;

    const slack =
      Math.min(
        wallsNeeded,
        openNeeded,
      );

    return 100 - slack;
  }

  private roomCandidatePressure(
    position: GridPosition,
  ): number {
    let pressure = 0;

    for (
      const candidates
      of this.roomCandidates.values()
    ) {
      const viable =
        candidates.filter(
          (candidate) =>
            candidate.cells.every(
              (cell) =>
                this.cells[
                  cell.y
                ][cell.x] !==
                  SearchCellState.Wall,
            ),
        );

      if (
        viable.some(
          (candidate) =>
            candidate.cells.some(
              (cell) =>
                cell.x ===
                  position.x &&
                cell.y ===
                  position.y,
            ),
        )
      ) {
        pressure +=
          Math.max(
            1,
            20 - viable.length,
          );
      }
    }

    return pressure;
  }

  private positionKey(
    position: GridPosition,
  ): string {
    return (
      `${position.x}:${position.y}`
    );
  }
}
