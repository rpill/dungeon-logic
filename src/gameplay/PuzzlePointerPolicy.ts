import type { PuzzleTool } from './PuzzleInteractionSession.ts';

export function resolvePointerTool(
  activeTool: PuzzleTool,
  isTouchLikePointer: boolean,
  rightButtonDown: boolean,
): PuzzleTool {
  if (isTouchLikePointer) {
    return activeTool;
  }
  return rightButtonDown ? 'floor' : 'wall';
}
