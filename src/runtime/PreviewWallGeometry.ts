import type { GridPosition } from '../puzzle/types';

export interface PreviewWallRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

// Pure thumbnail geometry shared by the runtime preview state and Phaser renderer.
export function mergePreviewWallCells(walls: readonly GridPosition[]): PreviewWallRect[] {
  const rows = new Map<number, number[]>();
  for (const wall of walls) {
    const row = rows.get(wall.y);
    if (row === undefined) {
      rows.set(wall.y, [wall.x]);
    } else if (!row.includes(wall.x)) {
      row.push(wall.x);
    }
  }

  const rectangles: PreviewWallRect[] = [];
  let active = new Map<string, PreviewWallRect>();

  for (const y of [...rows.keys()].sort((a, b) => a - b)) {
    const xs = (rows.get(y) ?? []).sort((a, b) => a - b);
    const runs: Array<{ x: number; width: number }> = [];
    for (const x of xs) {
      const last = runs[runs.length - 1];
      if (last !== undefined && x === last.x + last.width) {
        last.width += 1;
      } else {
        runs.push({ x, width: 1 });
      }
    }

    const next = new Map<string, PreviewWallRect>();
    for (const run of runs) {
      const key = `${run.x}:${run.width}`;
      const previous = active.get(key);
      if (previous !== undefined && previous.y + previous.height === y) {
        const extended = { ...previous, height: previous.height + 1 };
        const index = rectangles.indexOf(previous);
        if (index >= 0) rectangles[index] = extended;
        next.set(key, extended);
      } else {
        const rectangle = { x: run.x, y, width: run.width, height: 1 };
        rectangles.push(rectangle);
        next.set(key, rectangle);
      }
    }
    active = next;
  }

  return rectangles;
}
