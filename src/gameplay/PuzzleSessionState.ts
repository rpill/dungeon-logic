import { PuzzleState } from '../puzzle/PuzzleState';
import { CellState, type LevelDefinition } from '../puzzle/types';
import type { SerializedPuzzleState } from '../profile/types';

const VALID_CELL_STATES = new Set<string>([
  CellState.Unknown,
  CellState.Wall,
  CellState.Floor,
]);

function isNonNegativeFinite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

export function capturePuzzleCells(
  puzzle: PuzzleState,
): SerializedPuzzleState['cells'] {
  return Array.from(
    { length: puzzle.level.height },
    (_, y) => Array.from(
      { length: puzzle.level.width },
      (_, x) => puzzle.getCellState(x, y),
    ),
  );
}

export function isCompatiblePuzzleSnapshot(
  level: LevelDefinition,
  mode: SerializedPuzzleState['mode'],
  puzzleId: string,
  saved: SerializedPuzzleState | undefined,
): saved is SerializedPuzzleState {
  if (saved === undefined) return false;
  if (saved.mode !== mode || saved.puzzleId !== puzzleId) return false;
  if (!Array.isArray(saved.cells) || saved.cells.length !== level.height) return false;
  if (!isNonNegativeFinite(saved.activePlayMs)) return false;
  if (!isNonNegativeInteger(saved.hintsUsed)) return false;
  if (!isNonNegativeFinite(saved.startedAtMs)) return false;

  const fresh = new PuzzleState(level);

  for (let y = 0; y < level.height; y += 1) {
    const row = saved.cells[y];
    if (!Array.isArray(row) || row.length !== level.width) return false;

    for (let x = 0; x < level.width; x += 1) {
      const state = row[x];
      if (typeof state !== 'string' || !VALID_CELL_STATES.has(state)) return false;
      if (fresh.isFixedCell(x, y) && state !== fresh.getCellState(x, y)) return false;
    }
  }

  return true;
}

export class PuzzleSessionState {
  readonly puzzle: PuzzleState;
  readonly mode: SerializedPuzzleState['mode'];
  readonly puzzleId: string;
  private activePlayMs: number;
  private hintsUsed: number;
  private readonly startedAtMs: number;

  private constructor(
    puzzle: PuzzleState,
    mode: SerializedPuzzleState['mode'],
    puzzleId: string,
    activePlayMs: number,
    hintsUsed: number,
    startedAtMs: number,
  ) {
    this.puzzle = puzzle;
    this.mode = mode;
    this.puzzleId = puzzleId;
    this.activePlayMs = activePlayMs;
    this.hintsUsed = hintsUsed;
    this.startedAtMs = startedAtMs;
  }

  static create(
    level: LevelDefinition,
    mode: SerializedPuzzleState['mode'],
    puzzleId: string,
    saved: SerializedPuzzleState | undefined,
    nowMs: number,
  ): PuzzleSessionState {
    const compatible = isCompatiblePuzzleSnapshot(level, mode, puzzleId, saved);
    const puzzle = new PuzzleState(level);

    if (compatible) {
      for (let y = 0; y < level.height; y += 1) {
        for (let x = 0; x < level.width; x += 1) {
          if (!puzzle.isFixedCell(x, y)) {
            puzzle.setCellState(x, y, saved.cells[y][x]);
          }
        }
      }

      return new PuzzleSessionState(
        puzzle,
        mode,
        puzzleId,
        saved.activePlayMs,
        saved.hintsUsed,
        saved.startedAtMs,
      );
    }

    return new PuzzleSessionState(
      puzzle,
      mode,
      puzzleId,
      0,
      0,
      Math.max(0, Number.isFinite(nowMs) ? nowMs : 0),
    );
  }

  snapshot(): SerializedPuzzleState {
    return {
      mode: this.mode,
      puzzleId: this.puzzleId,
      cells: capturePuzzleCells(this.puzzle),
      activePlayMs: this.activePlayMs,
      hintsUsed: this.hintsUsed,
      startedAtMs: this.startedAtMs,
    };
  }

  addActiveTime(ms: number): void {
    if (!Number.isFinite(ms) || ms <= 0) return;
    this.activePlayMs += ms;
  }

  recordHint(): void {
    this.hintsUsed += 1;
  }

  getActivePlayMs(): number {
    return this.activePlayMs;
  }

  getHintsUsed(): number {
    return this.hintsUsed;
  }

  getStartedAtMs(): number {
    return this.startedAtMs;
  }
}
