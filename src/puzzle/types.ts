export const CellState = {
  Unknown: 'unknown',
  Wall: 'wall',
  Floor: 'floor',
} as const;

export type CellState =
  typeof CellState[keyof typeof CellState];

export interface GridPosition {
  x: number;
  y: number;
}

export interface LevelDefinition {
  id: string;

  width: number;
  height: number;

  rowClues: readonly number[];
  columnClues: readonly number[];

  monsters: readonly GridPosition[];

  /**
   * # = wall
   * . = floor
   *
   * Monster cells are represented as floor here.
   */
  solution: readonly string[];
}