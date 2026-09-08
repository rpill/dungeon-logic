import { PuzzleState } from '../puzzle/PuzzleState';
import { CellState, type CellState as CellStateValue } from '../puzzle/types';

export type PuzzleTool = 'wall' | 'floor';

type GestureMode = 'paint' | 'erase';
type PuzzleSnapshot = readonly (readonly CellStateValue[])[];

interface ActiveGesture {
  readonly tool: PuzzleTool;
  readonly before: PuzzleSnapshot;
  readonly visited: Set<string>;
  mode: GestureMode | null;
  changed: boolean;
}

function capture(puzzle: PuzzleState): PuzzleSnapshot {
  return Array.from(
    { length: puzzle.level.height },
    (_, y) => Array.from(
      { length: puzzle.level.width },
      (_, x) => puzzle.getCellState(x, y),
    ),
  );
}

function toolState(tool: PuzzleTool): CellStateValue {
  return tool === 'wall'
    ? CellState.Wall
    : CellState.Floor;
}

export class PuzzleInteractionSession {
  private readonly puzzle: PuzzleState;
  private activeTool: PuzzleTool = 'wall';
  private readonly history: PuzzleSnapshot[] = [];
  private gesture: ActiveGesture | null = null;

  constructor(puzzle: PuzzleState) {
    this.puzzle = puzzle;
  }

  setActiveTool(tool: PuzzleTool): void {
    this.activeTool = tool;
  }

  getActiveTool(): PuzzleTool {
    return this.activeTool;
  }

  beginGesture(
    x: number,
    y: number,
    toolOverride?: PuzzleTool,
  ): void {
    if (this.gesture !== null) {
      this.endGesture();
    }

    const tool = toolOverride ?? this.activeTool;
    const mode = this.puzzle.isFixedCell(x, y)
      ? null
      : this.puzzle.getCellState(x, y) === toolState(tool)
        ? 'erase'
        : 'paint';

    this.gesture = {
      tool,
      before: capture(this.puzzle),
      visited: new Set<string>(),
      mode,
      changed: false,
    };
  }

  visitGestureCell(x: number, y: number): boolean {
    const gesture = this.gesture;
    if (gesture === null) {
      return false;
    }

    const key = `${x}:${y}`;
    if (gesture.visited.has(key)) {
      return false;
    }
    gesture.visited.add(key);

    if (this.puzzle.isFixedCell(x, y)) {
      return false;
    }

    const target = toolState(gesture.tool);
    if (gesture.mode === null) {
      gesture.mode = this.puzzle.getCellState(x, y) === target
        ? 'erase'
        : 'paint';
    }

    const next = gesture.mode === 'erase'
      ? CellState.Unknown
      : target;
    const current = this.puzzle.getCellState(x, y);

    if (current === next) {
      return false;
    }

    this.puzzle.setCellState(x, y, next);
    gesture.changed = true;
    return true;
  }

  endGesture(): boolean {
    const gesture = this.gesture;
    if (gesture === null) {
      return false;
    }

    this.gesture = null;
    if (!gesture.changed) {
      return false;
    }

    this.history.push(gesture.before);
    return true;
  }

  undo(): boolean {
    if (this.gesture !== null) {
      this.endGesture();
    }

    const snapshot = this.history.pop();
    if (snapshot === undefined) {
      return false;
    }

    this.restore(snapshot);
    return true;
  }

  reset(): boolean {
    if (this.gesture !== null) {
      this.endGesture();
    }

    if (this.getEditCount() === 0) {
      return false;
    }

    const before = capture(this.puzzle);
    this.puzzle.reset();
    this.history.push(before);
    return true;
  }

  canUndo(): boolean {
    return this.history.length > 0 || this.gesture?.changed === true;
  }

  getEditCount(): number {
    let count = 0;

    for (let y = 0; y < this.puzzle.level.height; y += 1) {
      for (let x = 0; x < this.puzzle.level.width; x += 1) {
        if (
          !this.puzzle.isFixedCell(x, y)
          && this.puzzle.getCellState(x, y) !== CellState.Unknown
        ) {
          count += 1;
        }
      }
    }

    return count;
  }

  private restore(snapshot: PuzzleSnapshot): void {
    for (let y = 0; y < this.puzzle.level.height; y += 1) {
      for (let x = 0; x < this.puzzle.level.width; x += 1) {
        if (!this.puzzle.isFixedCell(x, y)) {
          this.puzzle.setCellState(x, y, snapshot[y][x]);
        }
      }
    }
  }
}
