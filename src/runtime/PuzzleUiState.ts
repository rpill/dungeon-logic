import type { PuzzleTool } from '../gameplay/PuzzleInteractionSession.ts';
import type { SupportedLanguage } from '../i18n/Language';
import { getUiCopy } from '../i18n/UiCopy';
import { classifyViewport, useInlineTouchToolbar } from '../scenes/GameBoardLayout.ts';

export type PuzzleToolbarButtonId = 'wall' | 'floor' | 'undo' | 'reset' | 'hint' | 'skip';

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

export function formatCompactHintLabel(freeHintsRemaining: number): string {
  if (!Number.isInteger(freeHintsRemaining) || freeHintsRemaining < 0) {
    throw new RangeError('Free hints remaining must be a non-negative integer.');
  }
  return `×${freeHintsRemaining}`;
}

export function shouldUseCompactHintLabel(
  viewportWidth: number,
  viewportHeight: number,
  showTouchToolButtons: boolean,
): boolean {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    throw new RangeError('Viewport dimensions must be positive.');
  }
  return showTouchToolButtons && (viewportWidth < 700 || viewportHeight < 520);
}

export function createPuzzleToolbarState(
  activeTool: PuzzleTool,
  canUndo: boolean,
  showToolButtons = true,
  freeHintsRemaining = 0,
  rewardedHintAvailable = false,
  language: SupportedLanguage = 'en',
  hintPresentation?: PuzzleToolbarHintPresentation,
  showSkipButton = false,
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
  if (showSkipButton) {
    buttons.push({ id: 'skip', label: copy.skip, active: false, disabled: false });
  }

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
  boardBottom?: number,
  hideHintButton = false,
  showSkipButton = false,
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
    const actionIds: readonly PuzzleToolbarButtonId[] = showSkipButton
      ? ['undo', 'reset', 'hint', 'skip']
      : ['undo', 'reset', 'hint'];
    const preferredWidth = viewportClass === 'wide' ? 260 : 210;
    const buttonWidth = Math.min(
      preferredWidth,
      Math.floor((viewportWidth - margin * 2 - gap * Math.max(0, actionIds.length - 1)) / actionIds.length),
    );
    const totalWidth = buttonWidth * actionIds.length + gap * Math.max(0, actionIds.length - 1);
    const startX = (viewportWidth - totalWidth) / 2;
    const y = viewportHeight - bottomInset - margin - buttonHeight / 2;

    return {
      mode: 'inline',
      buttonHeight,
      bottomY: y,
      buttons: actionIds.map((id, index) => ({
        id,
        x: startX + buttonWidth / 2 + index * (buttonWidth + gap),
        y,
        width: buttonWidth,
        height: buttonHeight,
      })),
    };
  }

  if (showToolButtons && viewportClass !== 'wide' && !useInlineTouchToolbar(viewportWidth, viewportHeight)) {
    const margin = viewportClass === 'narrow' ? 12 : 18;
    const gapX = 8;
    const gapY = 22;
    const actionButtonHeight = 48;
    const toolButtonHeight = 52;
    const toolButtonWidth = Math.min(
      viewportClass === 'narrow' ? Number.POSITIVE_INFINITY : 280,
      Math.floor((viewportWidth - margin * 2 - gapX) / 2),
    );
    const actionIds: readonly PuzzleToolbarButtonId[] = [
      'undo',
      'reset',
      ...(hideHintButton ? [] : ['hint'] as const),
      ...(showSkipButton ? ['skip'] as const : []),
    ];
    const actionButtonWidth = Math.min(
      viewportClass === 'narrow' ? Number.POSITIVE_INFINITY : (actionIds.length === 2 ? 240 : 210),
      Math.floor(
        (viewportWidth - margin * 2 - gapX * Math.max(0, actionIds.length - 1)) / actionIds.length,
      ),
    );
    const bottomY = viewportHeight - bottomInset - margin - actionButtonHeight / 2;
    const actionTop = bottomY - actionButtonHeight / 2;
    const maxToolY = actionTop - gapY - toolButtonHeight / 2;
    const desiredToolY = boardBottom === undefined
      ? maxToolY
      : boardBottom + 12 + toolButtonHeight / 2;
    const topY = Math.min(desiredToolY, maxToolY);
    const toolTotalWidth = toolButtonWidth * 2 + gapX;
    const toolStartX = (viewportWidth - toolTotalWidth) / 2;
    const leftToolX = toolStartX + toolButtonWidth / 2;
    const rightToolX = toolStartX + toolButtonWidth + gapX + toolButtonWidth / 2;
    const actionTotalWidth = actionButtonWidth * actionIds.length + gapX * Math.max(0, actionIds.length - 1);
    const actionStartX = (viewportWidth - actionTotalWidth) / 2;
    const firstActionX = actionStartX + actionButtonWidth / 2;
    const actionButtons = actionIds.map((id, index): PuzzleToolbarButtonLayout => ({
      id,
      x: firstActionX + index * (actionButtonWidth + gapX),
      y: bottomY,
      width: actionButtonWidth,
      height: actionButtonHeight,
    }));

    return {
      mode: 'stacked',
      buttonHeight: actionButtonHeight,
      bottomY,
      buttons: [
        { id: 'wall', x: leftToolX, y: topY, width: toolButtonWidth, height: toolButtonHeight },
        { id: 'floor', x: rightToolX, y: topY, width: toolButtonWidth, height: toolButtonHeight },
        ...actionButtons,
      ],
    };
  }

  const buttonHeight = 48;
  const gap = viewportClass === 'wide' ? 12 : 10;
  const ids: readonly PuzzleToolbarButtonId[] = [
    'wall', 'floor', 'undo', 'reset', 'hint',
    ...(showSkipButton ? ['skip'] as const : []),
  ];
  const toolWidth = viewportClass === 'wide' ? 126 : 108;
  const actionWidth = viewportClass === 'wide' ? 104 : 96;
  const preferredWidths = ids.map((id) => id === 'wall' || id === 'floor' ? toolWidth : actionWidth);
  const preferredTotal = preferredWidths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, ids.length - 1);
  const maxWidth = Math.max(1, viewportWidth - (viewportClass === 'wide' ? 32 : 20));
  const scale = preferredTotal > maxWidth ? maxWidth / preferredTotal : 1;
  const widths = preferredWidths.map((width) => Math.max(58, Math.floor(width * scale)));
  const totalWidth = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, ids.length - 1);
  const startX = (viewportWidth - totalWidth) / 2;
  const bottomMargin = viewportClass === 'wide' ? 22 : 16;
  const y = viewportHeight - bottomInset - bottomMargin - buttonHeight / 2;
  let cursor = startX;

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
