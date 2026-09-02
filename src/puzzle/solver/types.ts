export const SearchCellState = {
  Unassigned: 'unassigned',
  Wall: 'wall',
  Open: 'open',
} as const;

export type SearchCellStateValue =
  typeof SearchCellState[
    keyof typeof SearchCellState
  ];

export interface SolveResult {
  solutionCount: 0 | 1 | 2;

  firstSolution:
    | readonly string[]
    | null;
}

export interface LineStatus {
  target: number;
  wallsPlaced: number;
  unassigned: readonly {
    x: number;
    y: number;
  }[];
}
