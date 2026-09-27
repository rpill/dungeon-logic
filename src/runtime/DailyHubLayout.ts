export type DailyHubDensity = 'ultra' | 'tight' | 'medium' | 'regular';

export interface DailyHubLayout {
  readonly density: DailyHubDensity;
  readonly narrow: boolean;
  readonly sideBySide: boolean;
  readonly headerHeight: number;
  readonly titleY: number;
  readonly backY: number;
  readonly contentWidth: number;
  readonly todayTitleY: number;
  readonly todayCardTop: number;
  readonly todayHeight: number;
  readonly archiveTitleY: number;
  readonly archiveProgressY: number;
  readonly monthHeaderY: number;
  readonly weekdaysY: number;
  readonly gridTopY: number;
  readonly calendarWidth: number;
  readonly columnGap: number;
  readonly cellSize: number;
  readonly numberGap: number;
  readonly numberHeight: number;
  readonly rowGap: number;
  readonly rowPitch: number;
  readonly calendarBottom: number;
  readonly outsideRatingY: number;
  readonly contentBottom: number;
}

function clampRows(rowCount: number): number {
  if (!Number.isInteger(rowCount) || rowCount < 4 || rowCount > 6) {
    throw new RangeError('Daily calendar row count must be an integer from 4 to 6.');
  }
  return rowCount;
}

export function getDailyCalendarRowCount(leadingEmptyDays: number, dayCount: number): number {
  if (!Number.isInteger(leadingEmptyDays) || leadingEmptyDays < 0 || leadingEmptyDays > 6) {
    throw new RangeError('leadingEmptyDays must be an integer from 0 to 6.');
  }
  if (!Number.isInteger(dayCount) || dayCount < 28 || dayCount > 31) {
    throw new RangeError('dayCount must be an integer from 28 to 31.');
  }
  return Math.ceil((leadingEmptyDays + dayCount) / 7);
}

export function calculateDailyHubLayout(
  viewportWidth: number,
  viewportHeight: number,
  rowCount: number,
): DailyHubLayout {
  if (!Number.isFinite(viewportWidth) || !Number.isFinite(viewportHeight) || viewportWidth <= 0 || viewportHeight <= 0) {
    throw new RangeError('Viewport dimensions must be positive finite numbers.');
  }

  const rows = clampRows(rowCount);
  const narrow = viewportWidth < 700;
  const sideBySide = !narrow && viewportWidth >= 900 && viewportHeight < 700;
  const density: DailyHubDensity = viewportHeight < 460 ? 'ultra'
    : viewportHeight < 680 ? 'tight'
      : viewportHeight < 860 ? 'medium' : 'regular';
  const compact = viewportHeight < 700;
  const largeDesktop = !narrow && viewportWidth >= 1600 && viewportHeight >= 860;
  const contentWidth = sideBySide ? Math.min(480, viewportWidth * 0.42)
    : Math.min(viewportWidth - (narrow ? 28 : 80), narrow ? 420 : largeDesktop ? 850 : 740);
  const todayCardTop = sideBySide ? 185 : narrow ? (compact ? 105 : viewportHeight >= 900 ? 145 : 135)
    : compact ? 105 : largeDesktop ? 150 : 120;
  const todayHeight = sideBySide ? 110 : narrow ? (compact ? 82 : 96) : compact ? 76 : largeDesktop ? 108 : 92;
  const actionHeight = narrow ? (compact ? 50 : 58) : compact ? 56 : 66;
  const actionGap = narrow ? 8 : 14;
  const actionsBottom = narrow
    ? todayCardTop + todayHeight + 12 + actionHeight * 2 + actionGap
    : todayCardTop + todayHeight + 15 + actionHeight;
  const monthHeaderY = sideBySide ? 128 : actionsBottom + (narrow ? 42 : compact ? 42 : 48);
  const weekdaysY = monthHeaderY + (narrow ? 34 : 37);
  const gridTopY = weekdaysY + (narrow ? 15 : 19);
  const calendarWidth = sideBySide ? Math.min(viewportWidth * 0.44, 560)
    : Math.min(contentWidth, narrow ? contentWidth : largeDesktop ? 720 : 650);
  const columnGap = narrow ? 5 : largeDesktop ? 10 : 8;
  const rowGap = narrow ? 5 : compact ? 6 : 8;
  const sideBound = Math.floor((calendarWidth - columnGap * 6) / 7);
  const heightBound = Math.floor((viewportHeight - gridTopY - (narrow ? 48 : 22) - rowGap * (rows - 1)) / rows);
  const cellCap = narrow ? 52 : largeDesktop ? 82 : sideBySide ? 68 : 74;
  const cellMin = narrow ? 37 : compact ? 38 : 43;
  const cellSize = Math.max(cellMin, Math.min(cellCap, sideBound, heightBound));
  const rowPitch = cellSize + rowGap;
  const calendarBottom = gridTopY + rows * cellSize + (rows - 1) * rowGap;
  const contentBottom = calendarBottom + (narrow ? 24 : 16);

  return {
    density,
    narrow,
    sideBySide,
    headerHeight: narrow ? 112 : 110,
    titleY: narrow ? 78 : 78,
    backY: narrow ? 46 : 60,
    contentWidth,
    todayTitleY: todayCardTop + todayHeight / 2,
    todayCardTop,
    todayHeight,
    archiveTitleY: monthHeaderY,
    archiveProgressY: monthHeaderY,
    monthHeaderY,
    weekdaysY,
    gridTopY,
    calendarWidth,
    columnGap,
    cellSize,
    numberGap: 0,
    numberHeight: 0,
    rowGap,
    rowPitch,
    calendarBottom,
    outsideRatingY: calendarBottom + 10,
    contentBottom,
  };
}
