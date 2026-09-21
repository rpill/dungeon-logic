export interface PuzzleHeaderLayout {
  readonly titleY: number;
  readonly statusY: number;
  readonly bottom: number;
  readonly titleFontSize: number;
  readonly statusFontSize: number;
  readonly titlePanelHeight: number;
  readonly statusPanelHeight: number;
  readonly titlePanelMaxWidth: number;
  readonly statusPanelMaxWidth: number;
  readonly titlePaddingX: number;
  readonly statusPaddingX: number;
  readonly cornerRadius: number;
  readonly compact: boolean;
}

export interface PuzzleHeaderPanelSizes {
  readonly titleWidth: number;
  readonly titleHeight: number;
  readonly statusWidth: number;
  readonly statusHeight: number;
}

export function calculatePuzzleHeaderPanelSizes(
  layout: PuzzleHeaderLayout,
  availableTitleWidth: number,
): PuzzleHeaderPanelSizes {
  const safeAvailableWidth = Math.max(1, availableTitleWidth);
  const titleScale = Math.min(1, safeAvailableWidth / layout.titlePanelMaxWidth);
  const statusScale = Math.min(1, safeAvailableWidth / layout.statusPanelMaxWidth);

  return {
    titleWidth: Math.round(layout.titlePanelMaxWidth * titleScale),
    titleHeight: Math.round(layout.titlePanelHeight * titleScale),
    statusWidth: Math.round(layout.statusPanelMaxWidth * statusScale),
    statusHeight: Math.round(layout.statusPanelHeight * statusScale),
  };
}

export function calculatePuzzleHeaderLayout(
  viewportWidth: number,
  viewportHeight: number,
): PuzzleHeaderLayout {
  if (!Number.isFinite(viewportWidth) || !Number.isFinite(viewportHeight) || viewportWidth <= 0 || viewportHeight <= 0) {
    throw new RangeError('Viewport dimensions must be positive finite numbers.');
  }

  const portraitPhone = viewportWidth < 600 && viewportHeight >= viewportWidth;
  const landscapePhone = viewportHeight <= 520 && viewportWidth > viewportHeight;
  const compactLaptop = !portraitPhone && !landscapePhone && viewportHeight < 700;
  const compact = portraitPhone || landscapePhone || compactLaptop;

  if (portraitPhone) {
    const titlePanelHeight = 48;
    const statusPanelHeight = 32;
    const titleY = 72;
    const statusY = 108;
    return {
      titleY,
      statusY,
      bottom: statusY + statusPanelHeight / 2,
      titleFontSize: 21,
      statusFontSize: 12,
      titlePanelHeight,
      statusPanelHeight,
      titlePanelMaxWidth: Math.min(230, Math.max(190, viewportWidth - 96)),
      statusPanelMaxWidth: Math.min(165, Math.max(145, viewportWidth - 158)),
      titlePaddingX: 22,
      statusPaddingX: 14,
      cornerRadius: 9,
      compact,
    };
  }

  if (landscapePhone) {
    const titlePanelHeight = 54;
    const statusPanelHeight = 35;
    const titleY = 40;
    const statusY = 78;
    return {
      titleY,
      statusY,
      bottom: statusY + statusPanelHeight / 2,
      titleFontSize: 22,
      statusFontSize: 13,
      titlePanelHeight,
      statusPanelHeight,
      titlePanelMaxWidth: Math.min(270, Math.max(240, viewportWidth - 280)),
      statusPanelMaxWidth: Math.min(185, Math.max(165, viewportWidth - 450)),
      titlePaddingX: 22,
      statusPaddingX: 14,
      cornerRadius: 9,
      compact,
    };
  }

  if (compactLaptop) {
    const titlePanelHeight = 62;
    const statusPanelHeight = 40;
    const titleY = 45;
    const statusY = 88;
    return {
      titleY,
      statusY,
      bottom: statusY + statusPanelHeight / 2,
      titleFontSize: 24,
      statusFontSize: 14,
      titlePanelHeight,
      statusPanelHeight,
      titlePanelMaxWidth: 305,
      statusPanelMaxWidth: 198,
      titlePaddingX: 22,
      statusPaddingX: 14,
      cornerRadius: 10,
      compact,
    };
  }

  const largeDesktop = viewportWidth >= 1500;
  const titlePanelHeight = largeDesktop ? 70 : 66;
  const statusPanelHeight = largeDesktop ? 46 : 44;
  const titleY = largeDesktop ? 48 : 47;
  const statusY = largeDesktop ? 96 : 92;
  return {
    titleY,
    statusY,
    bottom: statusY + statusPanelHeight / 2,
    titleFontSize: largeDesktop ? 31 : 27,
    statusFontSize: largeDesktop ? 16 : 14,
    titlePanelHeight,
    statusPanelHeight,
    titlePanelMaxWidth: largeDesktop ? 350 : 330,
    statusPanelMaxWidth: largeDesktop ? 232 : 218,
    titlePaddingX: largeDesktop ? 28 : 24,
    statusPaddingX: largeDesktop ? 18 : 15,
    cornerRadius: 11,
    compact,
  };
}
