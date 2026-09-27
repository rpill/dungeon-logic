import Phaser from 'phaser';

import type { GridPosition, LevelDefinition } from '../puzzle/types';
import { mergePreviewWallCells } from '../runtime/PreviewWallGeometry';
export { mergePreviewWallCells } from '../runtime/PreviewWallGeometry';
export type { PreviewWallRect } from '../runtime/PreviewWallGeometry';

export interface LevelThumbnailBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface LevelThumbnailOptions {
  readonly showIncompleteOverlay: boolean;
}

interface PreviewCellBounds {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

interface PreviewSquare {
  readonly left: number;
  readonly top: number;
  readonly size: number;
}

const PREVIEW_COLORS = {
  background: 0x141f33,
  border: 0x30445f,
  wall: 0xa9aecf,
  monster: 0xff6a66,
  chest: 0xf0cb66,
  chestLid: 0xd8a74d,
  chestLock: 0x7f5628,
  blocker: 0x7d879c,
  door: 0xf0b14f,
} as const;

function centeredSquare(cell: PreviewCellBounds, fillRatio: number): PreviewSquare {
  const cellWidth = Math.max(1, cell.right - cell.left);
  const cellHeight = Math.max(1, cell.bottom - cell.top);
  const baseSize = Math.max(1, Math.min(cellWidth, cellHeight));
  const size = Math.max(1, Math.min(baseSize, Math.round(baseSize * fillRatio)));
  const left = Math.round((cell.left + cell.right - size) / 2);
  const top = Math.round((cell.top + cell.bottom - size) / 2);
  return { left, top, size };
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
  const cellBounds = (x: number, y: number): PreviewCellBounds => ({
    left: xEdge(x),
    top: yEdge(y),
    right: xEdge(x + 1),
    bottom: yEdge(y + 1),
  });

  graphics.fillStyle(PREVIEW_COLORS.background, 1);
  graphics.fillRect(left, top, boardWidth, boardHeight);
  graphics.lineStyle(1, PREVIEW_COLORS.border, 0.72);
  graphics.strokeRect(left, top, boardWidth, boardHeight);

  graphics.fillStyle(PREVIEW_COLORS.wall, 1);
  for (const wall of mergePreviewWallCells(walls)) {
    const x0 = xEdge(wall.x);
    const x1 = xEdge(wall.x + wall.width);
    const y0 = yEdge(wall.y);
    const y1 = yEdge(wall.y + wall.height);
    graphics.fillRect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
  }

  graphics.fillStyle(PREVIEW_COLORS.monster, 1);
  for (const monster of level.monsters) {
    const monsterRect = centeredSquare(cellBounds(monster.x, monster.y), 0.42);
    graphics.fillRect(monsterRect.left, monsterRect.top, monsterRect.size, monsterRect.size);
  }

  for (const chest of level.chests) {
    const chestRect = centeredSquare(cellBounds(chest.x, chest.y), 0.5);
    graphics.fillStyle(PREVIEW_COLORS.chest, 1);
    graphics.fillRect(chestRect.left, chestRect.top, chestRect.size, chestRect.size);
    if (chestRect.size >= 3) {
      const lidHeight = Math.max(1, Math.floor(chestRect.size * 0.34));
      graphics.fillStyle(PREVIEW_COLORS.chestLid, 1);
      graphics.fillRect(chestRect.left, chestRect.top, chestRect.size, lidHeight);
    }
    if (chestRect.size >= 5) {
      const lockSize = Math.max(1, Math.floor(chestRect.size * 0.18));
      const lockLeft = Math.round(chestRect.left + (chestRect.size - lockSize) / 2);
      const lockTop = Math.round(chestRect.top + chestRect.size * 0.46);
      graphics.fillStyle(PREVIEW_COLORS.chestLock, 1);
      graphics.fillRect(lockLeft, lockTop, lockSize, lockSize);
    }
  }

  for (const blocker of level.blockers) {
    const cell = cellBounds(blocker.x, blocker.y);
    const cellWidth = cell.right - cell.left;
    const cellHeight = cell.bottom - cell.top;
    graphics.lineStyle(Math.max(1, Math.min(cellWidth, cellHeight) * 0.12), PREVIEW_COLORS.blocker, 1);
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
    graphics.lineStyle(Math.max(1, Math.min(cellWidth, cellHeight) * 0.16), PREVIEW_COLORS.door, 1);
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
