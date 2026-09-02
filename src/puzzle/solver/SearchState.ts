import type {
  GridPosition,
  LevelDefinition,
} from '../types';

import {
  SearchCellState,
  type SearchCellStateValue,
} from './types';

interface TrailEntry {
  x: number;
  y: number;
  previous: SearchCellStateValue;
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

  private positionKey(
    position: GridPosition,
  ): string {
    return (
      `${position.x}:${position.y}`
    );
  }
}
