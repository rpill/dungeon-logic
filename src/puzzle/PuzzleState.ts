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

    if (this.isMonster(x, y)) {
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

    if (this.isMonster(x, y)) {
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