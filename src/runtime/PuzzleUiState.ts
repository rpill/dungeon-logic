import type { PuzzleTool } from '../gameplay/PuzzleInteractionSession.ts';
import type { SupportedLanguage } from '../i18n/Language';
import { getUiCopy } from '../i18n/UiCopy';
import { classifyViewport } from '../scenes/GameBoardLayout.ts';

export type PuzzleToolbarButtonId = 'wall' | 'floor' | 'undo' | 'reset' | 'hint';

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

export interface PuzzleToolbarHintPresentation {
  readonly label: string;
  readonly disabled: boolean;
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
  freeHintsRemaining = 0,
  rewardedHintAvailable = false,
  language: SupportedLanguage = 'en',
  hintPresentation?: PuzzleToolbarHintPresentation,
): PuzzleToolbarState {
  const copy = getUiCopy(language).game;
  const buttons: PuzzleToolbarButtonState[] = [];

  if (showToolButtons) {
    buttons.push(
      { id: 'wall', label: copy.wall, active: activeTool === 'wall', disabled: false },
      { id: 'floor', label: copy.floor, active: activeTool === 'floor', disabled: false },
    );
  }

  buttons.push(
    { id: 'undo', label: copy.undo, active: false, disabled: !canUndo },
    { id: 'reset', label: copy.reset, active: false, disabled: false },
    {
      id: 'hint',
      label: hintPresentation?.label ?? (freeHintsRemaining > 0
        ? copy.hintFree(freeHintsRemaining)
        : rewardedHintAvailable
          ? copy.hintRewarded
          : copy.hint),
      active: false,
      disabled: hintPresentation?.disabled ?? (freeHintsRemaining <= 0 && !rewardedHintAvailable),
    },
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
    const buttonHeight = viewportClass === 'wide' ? 58 : 54;
    const buttonWidth = viewportClass === 'wide' ? 260 : 210;
    const totalWidth = buttonWidth * 3 + gap * 2;
    const startX = (viewportWidth - totalWidth) / 2;
    const y = viewportHeight - bottomInset - margin - buttonHeight / 2;

    return {
      mode: 'inline',
      buttonHeight,
      bottomY: y,
      buttons: [
        { id: 'undo', x: startX + buttonWidth / 2, y, width: buttonWidth, height: buttonHeight },
        { id: 'reset', x: startX + buttonWidth + gap + buttonWidth / 2, y, width: buttonWidth, height: buttonHeight },
        { id: 'hint', x: startX + (buttonWidth + gap) * 2 + buttonWidth / 2, y, width: buttonWidth, height: buttonHeight },
      ],
    };
  }

  if (viewportClass === 'narrow') {
    const margin = 12;
    const gapX = 8;
    const gapY = 22;
    const actionButtonHeight = 48;
    const toolButtonHeight = 52;
    const toolButtonWidth = Math.floor((viewportWidth - margin * 2 - gapX) / 2);
    const actionButtonWidth = Math.floor((viewportWidth - margin * 2 - gapX * 2) / 3);
    const bottomY = viewportHeight - bottomInset - margin - actionButtonHeight / 2;
    const topY = bottomY - actionButtonHeight / 2 - gapY - toolButtonHeight / 2;
    const leftToolX = margin + toolButtonWidth / 2;
    const rightToolX = viewportWidth - margin - toolButtonWidth / 2;
    const firstActionX = margin + actionButtonWidth / 2;

    return {
      mode: 'stacked',
      buttonHeight: actionButtonHeight,
      bottomY,
      buttons: [
        { id: 'wall', x: leftToolX, y: topY, width: toolButtonWidth, height: toolButtonHeight },
        { id: 'floor', x: rightToolX, y: topY, width: toolButtonWidth, height: toolButtonHeight },
        { id: 'undo', x: firstActionX, y: bottomY, width: actionButtonWidth, height: actionButtonHeight },
        { id: 'reset', x: firstActionX + actionButtonWidth + gapX, y: bottomY, width: actionButtonWidth, height: actionButtonHeight },
        { id: 'hint', x: firstActionX + (actionButtonWidth + gapX) * 2, y: bottomY, width: actionButtonWidth, height: actionButtonHeight },
      ],
    };
  }

  const buttonHeight = 48;
  const gap = viewportClass === 'wide' ? 12 : 10;
  const widths = viewportClass === 'wide'
    ? [126, 126, 104, 104, 104]
    : [108, 108, 96, 96, 96];
  const totalWidth = widths.reduce((sum, width) => sum + width, 0) + gap * 4;
  const startX = (viewportWidth - totalWidth) / 2;
  const bottomMargin = viewportClass === 'wide' ? 22 : 16;
  const y = viewportHeight - bottomInset - bottomMargin - buttonHeight / 2;
  let cursor = startX;

  const ids: readonly PuzzleToolbarButtonId[] = ['wall', 'floor', 'undo', 'reset', 'hint'];
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
