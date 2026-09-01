import {
  CellState,
  type GridPosition,
  type LevelDefinition,
} from './types';

export class PuzzleState {
  readonly level: LevelDefinition;

  private cells: CellState[][];

  constructor(level: LevelDefinition) {
    this.level = level;
    this.cells = this.createInitialGrid();
  }

  getCellState(
    x: number,
    y: number,
  ): CellState {
    this.assertInsideBoard(x, y);

    return this.cells[y][x];
  }

  toggleWall(
    x: number,
    y: number,
  ): CellState {
    return this.toggleCellState(
      x,
      y,
      CellState.Wall,
    );
  }

  toggleFloor(
    x: number,
    y: number,
  ): CellState {
    return this.toggleCellState(
      x,
      y,
      CellState.Floor,
    );
  }

  setCellState(
    x: number,
    y: number,
    state: CellState,
  ): CellState {
    this.assertInsideBoard(x, y);

    if (this.isFixedCell(x, y)) {
      return CellState.Floor;
    }

    this.cells[y][x] = state;

    return state;
  }

  reset(): void {
    this.cells = this.createInitialGrid();
  }

  isMonster(
    x: number,
    y: number,
  ): boolean {
    return this.level.monsters.some(
      (monster) =>
        monster.x === x &&
        monster.y === y,
    );
  }

  isChest(
    x: number,
    y: number,
  ): boolean {
    return this.level.chests.some(
      (chest) =>
        chest.x === x &&
        chest.y === y,
    );
  }

  isFixedCell(
    x: number,
    y: number,
  ): boolean {
    return (
      this.isMonster(x, y) ||
      this.isChest(x, y)
    );
  }

  getRowWallCount(
    y: number,
  ): number {
    if (
      y < 0 ||
      y >= this.level.height
    ) {
      throw new RangeError(
        `Row ${y} is outside the board.`,
      );
    }

    let count = 0;

    for (
      let x = 0;
      x < this.level.width;
      x += 1
    ) {
      if (
        this.cells[y][x] ===
        CellState.Wall
      ) {
        count += 1;
      }
    }

    return count;
  }

  getColumnWallCount(
    x: number,
  ): number {
    if (
      x < 0 ||
      x >= this.level.width
    ) {
      throw new RangeError(
        `Column ${x} is outside the board.`,
      );
    }

    let count = 0;

    for (
      let y = 0;
      y < this.level.height;
      y += 1
    ) {
      if (
        this.cells[y][x] ===
        CellState.Wall
      ) {
        count += 1;
      }
    }

    return count;
  }

  private createInitialGrid(): CellState[][] {
    const grid = Array.from(
      { length: this.level.height },
      () =>
        Array<CellState>(
          this.level.width,
        ).fill(CellState.Unknown),
    );

    for (
      const monster
      of this.level.monsters
    ) {
      this.assertPositionInsideBoard(
        monster,
      );

      grid[monster.y][monster.x] =
        CellState.Floor;
    }

    for (
      const chest
      of this.level.chests
    ) {
      this.assertPositionInsideBoard(
        chest,
      );

      grid[chest.y][chest.x] =
        CellState.Floor;
    }

    return grid;
  }

  private assertInsideBoard(
    x: number,
    y: number,
  ): void {
    if (
      x < 0 ||
      x >= this.level.width ||
      y < 0 ||
      y >= this.level.height
    ) {
      throw new RangeError(
        `Cell (${x}, ${y}) is outside the board.`,
      );
    }
  }

  private toggleCellState(
    x: number,
    y: number,
    targetState: CellState,
  ): CellState {
    this.assertInsideBoard(x, y);

    if (this.isFixedCell(x, y)) {
      return CellState.Floor;
    }

    const current =
      this.cells[y][x];

    const next =
      current === targetState
        ? CellState.Unknown
        : targetState;

    return this.setCellState(
      x,
      y,
      next,
    );
  }

  private assertPositionInsideBoard(
    position: GridPosition,
  ): void {
    this.assertInsideBoard(
      position.x,
      position.y,
    );
  }
}