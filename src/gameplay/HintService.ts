import { PuzzleState } from '../puzzle/PuzzleState';
import { CellState, type CellState as CellStateValue } from '../puzzle/types';

export interface PuzzleHint {
  readonly x: number;
  readonly y: number;
  readonly state: typeof CellState.Wall | typeof CellState.Floor;
}

function solutionStateAt(puzzle: PuzzleState, x: number, y: number): PuzzleHint['state'] {
  const symbol = puzzle.level.solution[y]?.[x];
  if (symbol === '#') return CellState.Wall;
  if (symbol === '.') return CellState.Floor;
  throw new Error(`Unsupported solution symbol at (${x}, ${y}): ${String(symbol)}.`);
}

export function chooseHint(puzzle: PuzzleState): PuzzleHint | null {
  for (let y = 0; y < puzzle.level.height; y += 1) {
    for (let x = 0; x < puzzle.level.width; x += 1) {
      if (puzzle.isFixedCell(x, y)) continue;

      const correctState = solutionStateAt(puzzle, x, y);
      const currentState: CellStateValue = puzzle.getCellState(x, y);
      if (currentState === correctState) continue;

      return { x, y, state: correctState };
    }
  }

  return null;
}
