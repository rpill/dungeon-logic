import Phaser from 'phaser';

import type { GridPosition, LevelDefinition } from '../puzzle/types';

export interface PreviewWallRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface LevelThumbnailBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface LevelThumbnailOptions {
  readonly showIncompleteOverlay: boolean;
}

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

export function drawLevelThumbnail(
  scene: Phaser.Scene,
  level: LevelDefinition,
  walls: readonly GridPosition[],
  bounds: LevelThumbnailBounds,
  options: LevelThumbnailOptions,
): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0);
  const inset = Math.max(3, Math.floor(bounds.width * 0.08));
  const available = Math.max(1, Math.floor(Math.min(bounds.width, bounds.height) - inset * 2));
  const scale = available / Math.max(level.width, level.height);
  const boardWidth = Math.max(level.width, Math.round(scale * level.width));
  const boardHeight = Math.max(level.height, Math.round(scale * level.height));
  const left = Math.round(bounds.x - boardWidth / 2);
  const top = Math.round(bounds.y - boardHeight / 2);
  const graphics = scene.add.graphics();
  container.add(graphics);

  const xEdge = (x: number): number => left + Math.round((x * boardWidth) / level.width);
  const yEdge = (y: number): number => top + Math.round((y * boardHeight) / level.height);
  const cellBounds = (x: number, y: number): { left: number; top: number; right: number; bottom: number } => ({
    left: xEdge(x),
    top: yEdge(y),
    right: xEdge(x + 1),
    bottom: yEdge(y + 1),
  });

  graphics.fillStyle(0x171b20, 1);
  graphics.fillRect(left, top, boardWidth, boardHeight);
  graphics.lineStyle(1, 0x3f464f, 0.72);
  graphics.strokeRect(left, top, boardWidth, boardHeight);

  graphics.fillStyle(0x8b5f45, 1);
  for (const wall of mergePreviewWallCells(walls)) {
    const x0 = xEdge(wall.x);
    const x1 = xEdge(wall.x + wall.width);
    const y0 = yEdge(wall.y);
    const y1 = yEdge(wall.y + wall.height);
    graphics.fillRect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
  }

  graphics.fillStyle(0xb65f59, 1);
  for (const monster of level.monsters) {
    const cell = cellBounds(monster.x, monster.y);
    const cellWidth = cell.right - cell.left;
    const cellHeight = cell.bottom - cell.top;
    graphics.fillCircle(
      (cell.left + cell.right) / 2,
      (cell.top + cell.bottom) / 2,
      Math.max(1.4, Math.min(cellWidth, cellHeight) * 0.23),
    );
  }

  graphics.fillStyle(0xd3aa59, 1);
  for (const chest of level.chests) {
    const cell = cellBounds(chest.x, chest.y);
    const cellWidth = cell.right - cell.left;
    const cellHeight = cell.bottom - cell.top;
    graphics.fillRect(
      cell.left + cellWidth * 0.25,
      cell.top + cellHeight * 0.3,
      Math.max(1, cellWidth * 0.5),
      Math.max(1, cellHeight * 0.4),
    );
  }

  for (const blocker of level.blockers) {
    const cell = cellBounds(blocker.x, blocker.y);
    const cellWidth = cell.right - cell.left;
    const cellHeight = cell.bottom - cell.top;
    graphics.lineStyle(Math.max(1, Math.min(cellWidth, cellHeight) * 0.12), 0x747b84, 1);
    const x0 = cell.left + cellWidth * 0.25;
    const x1 = cell.left + cellWidth * 0.75;
    const y0 = cell.top + cellHeight * 0.25;
    const y1 = cell.top + cellHeight * 0.75;
    graphics.lineBetween(x0, y0, x1, y1);
    graphics.lineBetween(x1, y0, x0, y1);
  }

  for (const door of level.doors) {
    const cell = cellBounds(door.position.x, door.position.y);
    const cellWidth = cell.right - cell.left;
    const cellHeight = cell.bottom - cell.top;
    const centerX = (cell.left + cell.right) / 2;
    const centerY = (cell.top + cell.bottom) / 2;
    graphics.lineStyle(Math.max(1, Math.min(cellWidth, cellHeight) * 0.16), 0xc49b55, 1);
    if (door.orientation === 'horizontal') {
      graphics.lineBetween(centerX - cellWidth * 0.3, centerY, centerX + cellWidth * 0.3, centerY);
    } else {
      graphics.lineBetween(centerX, centerY - cellHeight * 0.3, centerX, centerY + cellHeight * 0.3);
    }
  }

  if (options.showIncompleteOverlay) {
    container.add(scene.add.rectangle(
      bounds.x,
      bounds.y,
      bounds.width - 4,
      bounds.height - 4,
      0xf3eee5,
      0.2,
    ));
  }

  return container;
}
