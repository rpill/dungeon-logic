import type { PuzzleTool } from '../gameplay/PuzzleInteractionSession.ts';
import { classifyViewport } from '../scenes/GameBoardLayout.ts';

export type PuzzleToolbarButtonId = 'wall' | 'floor' | 'undo' | 'reset';

export interface PuzzleToolbarButtonState {
  readonly id: PuzzleToolbarButtonId;
  readonly label: string;
  readonly active: boolean;
  readonly disabled: boolean;
}

export interface PuzzleToolbarState {
  readonly activeTool: PuzzleTool;
  readonly buttons: readonly PuzzleToolbarButtonState[];
}

export interface PuzzleToolbarButtonLayout {
  readonly id: PuzzleToolbarButtonId;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface PuzzleToolbarLayout {
  readonly mode: 'stacked' | 'inline';
  readonly buttonHeight: number;
  readonly bottomY: number;
  readonly buttons: readonly PuzzleToolbarButtonLayout[];
}

export function createPuzzleToolbarState(
  activeTool: PuzzleTool,
  canUndo: boolean,
  showToolButtons = true,
): PuzzleToolbarState {
  const buttons: PuzzleToolbarButtonState[] = [];

  if (showToolButtons) {
    buttons.push(
      { id: 'wall', label: 'WALL', active: activeTool === 'wall', disabled: false },
      { id: 'floor', label: 'FLOOR', active: activeTool === 'floor', disabled: false },
    );
  }

  buttons.push(
    { id: 'undo', label: 'UNDO', active: false, disabled: !canUndo },
    { id: 'reset', label: 'RESET', active: false, disabled: false },
  );

  return { activeTool, buttons };
}

export function shouldShowTouchToolButtons(
  hasCoarsePointer: boolean,
  maxTouchPoints: number,
): boolean {
  return hasCoarsePointer || maxTouchPoints > 0;
}


export function shouldConfirmReset(editCount: number): boolean {
  if (!Number.isInteger(editCount) || editCount < 0) {
    throw new RangeError('Edit count must be a non-negative integer.');
  }
  return editCount >= 3;
}

export function calculatePuzzleToolbarLayout(
  viewportWidth: number,
  viewportHeight: number,
  safeAreaBottom = 0,
  showToolButtons = true,
): PuzzleToolbarLayout {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    throw new RangeError('Viewport dimensions must be positive.');
  }

  const viewportClass = classifyViewport(viewportWidth);
  const bottomInset = Math.max(0, safeAreaBottom);

  if (!showToolButtons) {
    const margin = viewportClass === 'narrow' ? 12 : 16;
    const gap = 10;
    const buttonHeight = 48;
    const buttonWidth = viewportClass === 'wide' ? 116 : 104;
    const totalWidth = buttonWidth * 2 + gap;
    const startX = (viewportWidth - totalWidth) / 2;
    const y = viewportHeight - bottomInset - margin - buttonHeight / 2;

    return {
      mode: 'inline',
      buttonHeight,
      bottomY: y,
      buttons: [
        { id: 'undo', x: startX + buttonWidth / 2, y, width: buttonWidth, height: buttonHeight },
        { id: 'reset', x: startX + buttonWidth + gap + buttonWidth / 2, y, width: buttonWidth, height: buttonHeight },
      ],
    };
  }

  if (viewportClass === 'narrow') {
    const margin = 12;
    const gapX = 8;
    const gapY = 8;
    const buttonHeight = 48;
    const buttonWidth = Math.floor((viewportWidth - margin * 2 - gapX) / 2);
    const bottomY = viewportHeight - bottomInset - margin - buttonHeight / 2;
    const topY = bottomY - buttonHeight - gapY;
    const leftX = margin + buttonWidth / 2;
    const rightX = viewportWidth - margin - buttonWidth / 2;

    return {
      mode: 'stacked',
      buttonHeight,
      bottomY,
      buttons: [
        { id: 'wall', x: leftX, y: topY, width: buttonWidth, height: buttonHeight },
        { id: 'floor', x: rightX, y: topY, width: buttonWidth, height: buttonHeight },
        { id: 'undo', x: leftX, y: bottomY, width: buttonWidth, height: buttonHeight },
        { id: 'reset', x: rightX, y: bottomY, width: buttonWidth, height: buttonHeight },
      ],
    };
  }

  const buttonHeight = 48;
  const gap = viewportClass === 'wide' ? 12 : 10;
  const widths = viewportClass === 'wide'
    ? [132, 132, 116, 116]
    : [116, 116, 104, 104];
  const totalWidth = widths.reduce((sum, width) => sum + width, 0) + gap * 3;
  const startX = (viewportWidth - totalWidth) / 2;
  const bottomMargin = viewportClass === 'wide' ? 22 : 16;
  const y = viewportHeight - bottomInset - bottomMargin - buttonHeight / 2;
  let cursor = startX;

  const ids: readonly PuzzleToolbarButtonId[] = ['wall', 'floor', 'undo', 'reset'];
  const buttons = ids.map((id, index): PuzzleToolbarButtonLayout => {
    const width = widths[index];
    const button = {
      id,
      x: cursor + width / 2,
      y,
      width,
      height: buttonHeight,
    };
    cursor += width + gap;
    return button;
  });

  return {
    mode: 'inline',
    buttonHeight,
    bottomY: y,
    buttons,
  };
}
