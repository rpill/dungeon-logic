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

export interface DoorDefinition {
  position: GridPosition;

  orientation:
  | 'horizontal'
  | 'vertical';
}

export interface LevelDefinition {
  id: string;

  width: number;
  height: number;

  rowClues: readonly number[];
  columnClues: readonly number[];

  monsters: readonly GridPosition[];
  chests: readonly GridPosition[];

  blockers: readonly GridPosition[];
  doors: readonly DoorDefinition[];

  /**
   * # = wall
   * . = open space
   *
   * Monster and chest cells are represented
   * as open space in the solution.
   */
  solution: readonly string[];
}