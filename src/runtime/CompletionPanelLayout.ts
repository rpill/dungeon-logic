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
  readonly titleY: number;
  readonly statusY: number;
  readonly statusWidth: number;
  readonly primaryAction: CompletionActionRect | null;
  readonly secondaryActions: readonly CompletionActionRect[];
  readonly boardBottomReserve: number;
}

const DESKTOP_PANEL_MAX_WIDTH = 560;
const DESKTOP_PANEL_MIN_WIDTH = 500;
const DESKTOP_SHORT_HEIGHT = 132;
const DESKTOP_TALL_HEIGHT = 140;
const PHONE_SIDE_MARGIN = 12;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function calculateCompletionPanelLayout(
  viewportWidth: number,
  viewportHeight: number,
  safeBottom: number,
  actionCount: number,
  hasPrimary = true,
): CompletionPanelLayout {
  if (!Number.isFinite(viewportWidth) || !Number.isFinite(viewportHeight) || viewportWidth <= 0 || viewportHeight <= 0) {
    throw new RangeError('Completion panel viewport dimensions must be positive finite numbers.');
  }

  const phone = viewportWidth < 700 && viewportHeight > viewportWidth;
  const bottomMargin = phone ? 10 : 8;
  const count = Math.max(0, Math.floor(actionCount));

  if (phone) {
    const short = viewportHeight < 720;
    const panelWidth = Math.max(240, viewportWidth - PHONE_SIDE_MARGIN * 2);
    const panelHeight = short ? 188 : 214;
    const panelBottom = viewportHeight - Math.max(0, safeBottom) - bottomMargin;
    const panelTop = panelBottom - panelHeight;
    const panelX = viewportWidth / 2;
    const panelY = panelTop + panelHeight / 2;
    const innerPadding = 14;
    const buttonHeight = short ? 34 : 38;
    const rowGap = 8;
    const secondaryCount = Math.max(0, count - (hasPrimary ? 1 : 0));
    const primaryY = panelBottom - innerPadding - buttonHeight * 1.5 - rowGap;
    const secondaryY = panelBottom - innerPadding - buttonHeight / 2;
    const primaryAction = count > 0 && hasPrimary
      ? {
          x: panelX,
          y: primaryY,
          width: panelWidth - innerPadding * 2,
          height: buttonHeight,
        }
      : null;
    const secondaryGap = 8;
    const secondaryWidth = secondaryCount > 0
      ? (panelWidth - innerPadding * 2 - secondaryGap * (secondaryCount - 1)) / secondaryCount
      : 0;
    const secondaryActions = Array.from({ length: secondaryCount }, (_, index) => ({
      x: panelX - (panelWidth - innerPadding * 2) / 2 + secondaryWidth / 2 + index * (secondaryWidth + secondaryGap),
      y: secondaryY,
      width: secondaryWidth,
      height: buttonHeight,
    }));

    return {
      mode: 'phone',
      panelX,
      panelY,
      panelWidth,
      panelHeight,
      panelTop,
      panelBottom,
      titleY: panelTop + (short ? 27 : 31),
      statusY: panelTop + (short ? 68 : 76),
      statusWidth: panelWidth - 40,
      primaryAction,
      secondaryActions,
      boardBottomReserve: short ? 78 : 56,
    };
  }

  const panelWidth = clamp(viewportWidth * 0.42, DESKTOP_PANEL_MIN_WIDTH, DESKTOP_PANEL_MAX_WIDTH);
  const panelHeight = viewportHeight <= 640 ? DESKTOP_SHORT_HEIGHT : DESKTOP_TALL_HEIGHT;
  const panelBottom = viewportHeight - Math.max(0, safeBottom) - bottomMargin;
  const panelTop = panelBottom - panelHeight;
  const panelX = viewportWidth / 2;
  const panelY = panelTop + panelHeight / 2;
  const innerPadding = 20;
  const gap = count >= 3 ? 8 : 12;
  const actionHeight = viewportHeight <= 640 ? 30 : 32;
  const actionAreaWidth = panelWidth - innerPadding * 2;
  const actionWidth = count <= 1
    ? Math.min(220, actionAreaWidth)
    : (actionAreaWidth - gap * (count - 1)) / count;
  const actionY = panelBottom - innerPadding - actionHeight / 2;
  const allActions = Array.from({ length: count }, (_, index) => ({
    x: panelX - (actionWidth * count + gap * (count - 1)) / 2 + actionWidth / 2 + index * (actionWidth + gap),
    y: actionY,
    width: actionWidth,
    height: actionHeight,
  }));

  return {
    mode: 'desktop',
    panelX,
    panelY,
    panelWidth,
    panelHeight,
    panelTop,
    panelBottom,
    titleY: panelTop + (viewportHeight <= 640 ? 28 : 32),
    statusY: panelTop + (viewportHeight <= 640 ? 64 : 70),
    statusWidth: panelWidth - 44,
    primaryAction: hasPrimary && allActions.length > 0 ? allActions[allActions.length - 1]! : null,
    secondaryActions: hasPrimary ? allActions.slice(0, -1) : allActions,
    boardBottomReserve: viewportHeight <= 640 ? 72 : 80,
  };
}
