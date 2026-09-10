export type DailyHubDensity = 'ultra' | 'tight' | 'medium' | 'regular';

export interface DailyHubLayout {
  readonly density: DailyHubDensity;
  readonly narrow: boolean;
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

function getDensity(viewportHeight: number): DailyHubDensity {
  if (viewportHeight < 460) return 'ultra';
  if (viewportHeight < 620) return 'tight';
  if (viewportHeight < 800) return 'medium';
  return 'regular';
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
  const density = getDensity(viewportHeight);

  const vertical = density === 'ultra'
    ? {
        headerHeight: 48,
        titleY: 28,
        backY: 24,
        todayTitleY: 56,
        todayCardTop: 70,
        todayHeight: 46,
        archiveTitleY: 128,
        archiveProgressY: 142,
        monthHeaderY: 150,
        weekdaysY: 166,
        gridTopY: 178,
        columnGap: 5,
        numberGap: 1,
        numberHeight: 7,
        rowGap: 1,
        outsideGap: 4,
        outsideHeight: 7,
        bottomMargin: 5,
        cellCap: 36,
        cellMin: 18,
      }
    : density === 'tight'
      ? {
          headerHeight: 70,
          titleY: 42,
          backY: 28,
          todayTitleY: 82,
          todayCardTop: 100,
          todayHeight: 60,
          archiveTitleY: 182,
          archiveProgressY: 198,
          monthHeaderY: 212,
          weekdaysY: 232,
          gridTopY: 248,
          columnGap: 5,
          numberGap: 2,
          numberHeight: 8,
          rowGap: 2,
          outsideGap: 5,
          outsideHeight: 8,
          bottomMargin: 8,
          cellCap: 46,
          cellMin: 22,
        }
      : density === 'medium'
        ? {
            headerHeight: 96,
            titleY: 60,
            backY: 34,
            todayTitleY: 116,
            todayCardTop: 140,
            todayHeight: 78,
            archiveTitleY: 246,
            archiveProgressY: 266,
            monthHeaderY: 286,
            weekdaysY: 310,
            gridTopY: 330,
            columnGap: 7,
            numberGap: 3,
            numberHeight: 9,
            rowGap: 4,
            outsideGap: 7,
            outsideHeight: 9,
            bottomMargin: 10,
            cellCap: 58,
            cellMin: 26,
          }
        : {
            headerHeight: 118,
            titleY: 78,
            backY: 40,
            todayTitleY: 140,
            todayCardTop: 168,
            todayHeight: 92,
            archiveTitleY: 294,
            archiveProgressY: 316,
            monthHeaderY: 336,
            weekdaysY: 364,
            gridTopY: 386,
            columnGap: 8,
            numberGap: 4,
            numberHeight: 10,
            rowGap: 6,
            outsideGap: 8,
            outsideHeight: 10,
            bottomMargin: 12,
            cellCap: 68,
            cellMin: 28,
          };

  const contentWidth = Math.min(
    viewportWidth - (narrow ? 24 : 56),
    narrow ? 460 : 700,
  );
  const calendarWidth = Math.min(contentWidth, 680);
  const maxCellFromWidth = Math.floor(
    (calendarWidth - vertical.columnGap * 6) / 7,
  );
  const maxCellFromHeight = Math.floor(
    (
      viewportHeight
      - vertical.bottomMargin
      - vertical.gridTopY
      - rows * (vertical.numberGap + vertical.numberHeight)
      - Math.max(0, rows - 1) * vertical.rowGap
      - vertical.outsideGap
      - vertical.outsideHeight
    ) / rows,
  );
  const cellSize = Math.max(
    vertical.cellMin,
    Math.min(vertical.cellCap, maxCellFromWidth, maxCellFromHeight),
  );
  const rowPitch = cellSize + vertical.numberGap + vertical.numberHeight + vertical.rowGap;
  const calendarBottom = vertical.gridTopY
    + rows * (cellSize + vertical.numberGap + vertical.numberHeight)
    + Math.max(0, rows - 1) * vertical.rowGap;
  const outsideRatingY = calendarBottom + vertical.outsideGap;
  const contentBottom = outsideRatingY + vertical.outsideHeight + vertical.bottomMargin;

  return {
    density,
    narrow,
    headerHeight: vertical.headerHeight,
    titleY: vertical.titleY,
    backY: vertical.backY,
    contentWidth,
    todayTitleY: vertical.todayTitleY,
    todayCardTop: vertical.todayCardTop,
    todayHeight: vertical.todayHeight,
    archiveTitleY: vertical.archiveTitleY,
    archiveProgressY: vertical.archiveProgressY,
    monthHeaderY: vertical.monthHeaderY,
    weekdaysY: vertical.weekdaysY,
    gridTopY: vertical.gridTopY,
    calendarWidth,
    columnGap: vertical.columnGap,
    cellSize,
    numberGap: vertical.numberGap,
    numberHeight: vertical.numberHeight,
    rowGap: vertical.rowGap,
    rowPitch,
    calendarBottom,
    outsideRatingY,
    contentBottom,
  };
}
