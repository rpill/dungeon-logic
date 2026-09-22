export interface MasteryDesktopLayout {
  readonly density: number;
  readonly cardGap: number;
  readonly topSectionHeight: number;
  readonly panelHeight: number;
  readonly pathHeight: number;
  readonly totalHeight: number;
  readonly sealSize: number;
  readonly sealOffsetX: number;
  readonly sealOffsetY: number;
  readonly textOffsetX: number;
  readonly rankLabelOffsetY: number;
  readonly rankTitleOffsetY: number;
  readonly descriptionOffsetY: number;
  readonly rankLabelFontSize: number;
  readonly rankTitleFontSize: number;
  readonly descriptionFontSize: number;
  readonly descriptionWidthInset: number;
  readonly panelTitleOffsetY: number;
  readonly panelTitleFontSize: number;
  readonly firstRowOffsetY: number;
  readonly rowHeight: number;
  readonly rowGap: number;
  readonly rowFontSize: number;
  readonly iconSize: number;
  readonly textLeftInset: number;
  readonly statusRightInset: number;
  readonly barStatusGap: number;
  readonly barHeight: number;
  readonly statusRadius: number;
  readonly statusFillRadius: number;
  readonly checkSize: number;
  readonly rankTrackLineOffsetY: number;
  readonly rankTrackLabelOffsetY: number;
  readonly rankTrackFontSize: number;
}

const MIN_TOTAL_HEIGHT = 456;
const MAX_TOTAL_HEIGHT = 814;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t;
}

export function calculateMasteryDesktopLayout(availableHeight: number): MasteryDesktopLayout {
  if (!Number.isFinite(availableHeight) || availableHeight <= 0) {
    throw new RangeError('Mastery desktop available height must be a positive finite number.');
  }

  const density = clamp01((availableHeight - MIN_TOTAL_HEIGHT) / (MAX_TOTAL_HEIGHT - MIN_TOTAL_HEIGHT));
  const cardGap = lerp(8, 22, density);
  const topSectionHeight = lerp(140, 236, density);
  const panelHeight = lerp(240, 408, density);
  const pathHeight = lerp(60, 126, density);
  const totalHeight = topSectionHeight + panelHeight + pathHeight + cardGap * 2;
  const rowHeight = lerp(48, 78, density);
  const rowGap = rowHeight + lerp(7, 10, density);

  return {
    density,
    cardGap,
    topSectionHeight,
    panelHeight,
    pathHeight,
    totalHeight,
    sealSize: lerp(160, 250, density),
    sealOffsetX: lerp(120, 158, density),
    sealOffsetY: lerp(74, 126, density),
    textOffsetX: lerp(232, 318, density),
    rankLabelOffsetY: lerp(15, 42, density),
    rankTitleOffsetY: lerp(38, 74, density),
    descriptionOffsetY: lerp(70, 126, density),
    rankLabelFontSize: lerp(13, 18, density),
    rankTitleFontSize: lerp(22, 34, density),
    descriptionFontSize: lerp(10, 14, density),
    descriptionWidthInset: lerp(258, 342, density),
    panelTitleOffsetY: lerp(34, 59, density),
    panelTitleFontSize: lerp(14, 18, density),
    firstRowOffsetY: lerp(78, 137, density),
    rowHeight,
    rowGap,
    rowFontSize: lerp(13, 18, density),
    iconSize: lerp(20, 29, density),
    textLeftInset: lerp(48, 66, density),
    statusRightInset: lerp(28, 36, density),
    barStatusGap: lerp(16, 22, density),
    barHeight: lerp(8, 11, density),
    statusRadius: lerp(11, 15, density),
    statusFillRadius: lerp(8, 10.2, density),
    checkSize: lerp(10, 14, density),
    rankTrackLineOffsetY: lerp(15, 23, density),
    rankTrackLabelOffsetY: lerp(34, 51, density),
    rankTrackFontSize: lerp(10, 12, density),
  };
}
