import type { BoardVisualTheme, SpriteFrameRef } from './BoardVisualTheme';

/**
 * Chooses only between same-silhouette, one-cell wall variants. The selection is
 * coordinate-stable so dragging and re-rendering can never make a placed wall flicker.
 */
export function resolveWallFrame(
  theme: BoardVisualTheme,
  x: number,
  y: number,
): SpriteFrameRef {
  const frames = theme.board.wallFrames;
  const hash = (
    Math.imul(x + 17, 73_856_093)
    ^ Math.imul(y + 23, 19_349_663)
  ) >>> 0;

  return frames[hash % frames.length]!;
}

export function resolveClueTileFrame(
  theme: BoardVisualTheme,
  _x: number,
  _y: number,
): SpriteFrameRef {
  return theme.board.clueTile;
}
