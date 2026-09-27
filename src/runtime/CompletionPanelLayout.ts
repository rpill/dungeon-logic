export type CompletionPanelMode = 'desktop' | 'phone';

export interface CompletionActionRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface CompletionPanelLayout {
  readonly mode: CompletionPanelMode;
  readonly panelX: number;
  readonly panelY: number;
  readonly panelWidth: number;
  readonly panelHeight: number;
  readonly panelTop: number;
  readonly panelBottom: number;
  readonly boardCenterX: number;
  readonly titleY: number;
  readonly statusY: number;
  readonly statusWidth: number;
  readonly illustrationY: number;
  readonly illustrationSize: number;
  readonly primaryAction: CompletionActionRect | null;
  readonly secondaryActions: readonly CompletionActionRect[];
  readonly boardBottomReserve: number;
}

export interface CompletionContentLayout {
  readonly boardFrameWidth?: number;
  readonly infoCount?: number;
  readonly showMascots?: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Keep the regular gameplay reserve stable; completion has its own overlay.
export function desktopCompletionPanelHeight(viewportWidth: number): number {
  return Math.round(clamp(viewportWidth * 0.46, 580, 740) / (1600 / 378));
}

export function calculateCompletionPanelLayout(
  viewportWidth: number,
  viewportHeight: number,
  safeBottom: number,
  actionCount: number,
  hasPrimary = true,
  content: CompletionContentLayout = {},
): CompletionPanelLayout {
  if (!Number.isFinite(viewportWidth) || !Number.isFinite(viewportHeight) || viewportWidth <= 0 || viewportHeight <= 0) {
    throw new RangeError('Completion panel viewport dimensions must be positive finite numbers.');
  }
  const phone = viewportWidth < 700 && viewportHeight > viewportWidth;
  const count = Math.max(0, Math.floor(actionCount));
  const infoCount = Math.max(0, Math.floor(content.infoCount ?? 2));
  const showMascots = content.showMascots ?? false;
  const secondaryCount = Math.max(0, count - (hasPrimary ? 1 : 0));
  const panelBottom = viewportHeight - Math.max(0, safeBottom) - (phone ? 10 : 14);

  if (phone) {
    const panelWidth = Math.max(240, viewportWidth - 24);
    const panelHeight = infoCount > 2 ? 316 : showMascots ? 326 : 284;
    const panelTop = panelBottom - panelHeight;
    const panelX = viewportWidth / 2;
    const buttonWidth = panelWidth - 42;
    const buttonHeight = 50;
    const primaryAction = count > 0 && hasPrimary
      ? { x: panelX, y: panelBottom - 96, width: buttonWidth, height: buttonHeight }
      : null;
    const gap = 8;
    const secondaryWidth = secondaryCount > 0
      ? (buttonWidth - gap * (secondaryCount - 1)) / secondaryCount
      : 0;
    const secondaryActions = Array.from({ length: secondaryCount }, (_, index) => ({
      x: panelX - buttonWidth / 2 + secondaryWidth / 2 + index * (secondaryWidth + gap),
      y: panelBottom - (hasPrimary ? 39 : 65),
      width: secondaryWidth,
      height: buttonHeight,
    }));
    const oldPhonePanelHeight = Math.round(panelWidth * 747 / 1100);
    return {
      mode: 'phone', panelX, panelY: panelTop + panelHeight / 2,
      panelWidth, panelHeight, panelTop, panelBottom,
      boardCenterX: panelX,
      titleY: panelTop + 43,
      statusY: panelTop + (showMascots ? 182 : 130),
      statusWidth: panelWidth - 46,
      illustrationY: panelTop + 105,
      illustrationSize: showMascots ? 94 : 72,
      primaryAction, secondaryActions,
      boardBottomReserve: Math.max(0, panelHeight - oldPhonePanelHeight + 18),
    };
  }

  const panelWidth = clamp(viewportWidth * 0.33, 440, 570);
  const panelHeight = showMascots
    ? clamp(viewportHeight * 0.47, 300, 430)
    : clamp(viewportHeight * 0.40, 300, 390);
  const panelTop = (viewportHeight - panelHeight) / 2 + (viewportHeight > 800 ? 16 : 0);
  const gapToBoard = clamp(viewportWidth * 0.03, 28, 58);
  const boardFrameWidth = content.boardFrameWidth ?? viewportWidth * 0.38;
  const totalWidth = boardFrameWidth + gapToBoard + panelWidth;
  const groupLeft = (viewportWidth - totalWidth) / 2;
  const boardCenterX = groupLeft + boardFrameWidth / 2;
  const panelX = groupLeft + boardFrameWidth + gapToBoard + panelWidth / 2;
  const actionWidth = panelWidth - 66;
  const actionGap = 12;
  const buttonHeight = viewportHeight <= 640 ? 48 : 54;
  const buttonWidth = count > 0 ? (actionWidth - actionGap * (count - 1)) / count : 0;
  const allActions = Array.from({ length: count }, (_, index) => ({
    x: panelX - actionWidth / 2 + buttonWidth / 2 + index * (buttonWidth + actionGap),
    y: panelTop + panelHeight - (viewportHeight <= 640 ? 42 : 50),
    width: buttonWidth,
    height: buttonHeight,
  }));
  return {
    mode: 'desktop', panelX, panelY: panelTop + panelHeight / 2,
    panelWidth, panelHeight, panelTop, panelBottom: panelTop + panelHeight,
    boardCenterX,
    titleY: panelTop + (viewportHeight <= 640 ? 47 : 61),
    statusY: panelTop + (showMascots ? panelHeight * 0.69 : panelHeight * 0.44),
    statusWidth: panelWidth - 66,
    illustrationY: panelTop + panelHeight * 0.40,
    illustrationSize: clamp(panelHeight * 0.35, 90, 140),
    primaryAction: hasPrimary && allActions.length > 0 ? allActions[allActions.length - 1]! : null,
    secondaryActions: hasPrimary ? allActions.slice(0, -1) : allActions,
    boardBottomReserve: 0,
  };
}
