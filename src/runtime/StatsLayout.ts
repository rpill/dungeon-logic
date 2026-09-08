import { classifyViewport, type ViewportClass } from '../scenes/GameBoardLayout';

export interface StatsSummaryCardLayout {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface StatsCalendarLayout {
  readonly centerX: number;
  readonly titleY: number;
  readonly weekdayY: number;
  readonly gridTopY: number;
  readonly cellSize: number;
  readonly gap: number;
}

export interface StatsLayout {
  readonly viewportClass: ViewportClass;
  readonly mode: 'columns' | 'vertical';
  readonly titleY: number;
  readonly titleFontSize: number;
  readonly summaryCards: readonly StatsSummaryCardLayout[];
  readonly calendar: StatsCalendarLayout;
  readonly contentBottom: number;
}

function assertViewport(width: number, height: number): void {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new RangeError('Statistics viewport dimensions must be positive finite numbers.');
  }
}

export function calculateStatsLayout(viewportWidth: number, viewportHeight: number): StatsLayout {
  assertViewport(viewportWidth, viewportHeight);
  const viewportClass = classifyViewport(viewportWidth);

  if (viewportClass === 'wide') {
    const gap = 24;
    const maxCardWidth = 320;
    const totalAvailable = viewportWidth - 80;
    const cardWidth = Math.min(maxCardWidth, Math.floor((totalAvailable - gap * 2) / 3));
    const totalWidth = cardWidth * 3 + gap * 2;
    const startX = (viewportWidth - totalWidth) / 2 + cardWidth / 2;
    const summaryCards = Array.from({ length: 3 }, (_, index): StatsSummaryCardLayout => ({
      x: startX + index * (cardWidth + gap),
      y: 190,
      width: cardWidth,
      height: 150,
    }));
    const calendar = {
      centerX: viewportWidth / 2,
      titleY: 326,
      weekdayY: 372,
      gridTopY: 400,
      cellSize: 44,
      gap: 6,
    } as const;
    const contentBottom = calendar.gridTopY + calendar.cellSize * 6 + calendar.gap * 5;

    return {
      viewportClass,
      mode: 'columns',
      titleY: 62,
      titleFontSize: 40,
      summaryCards,
      calendar,
      contentBottom,
    };
  }

  const sideMargin = viewportClass === 'narrow' ? 16 : 24;
  const cardWidth = Math.min(viewportWidth - sideMargin * 2, 600);
  const cardHeight = viewportClass === 'narrow' ? 96 : 104;
  const cardGap = 12;
  const firstCardY = viewportClass === 'narrow' ? 138 : 150;
  const summaryCards = Array.from({ length: 3 }, (_, index): StatsSummaryCardLayout => ({
    x: viewportWidth / 2,
    y: firstCardY + index * (cardHeight + cardGap),
    width: cardWidth,
    height: cardHeight,
  }));
  const lastCard = summaryCards[summaryCards.length - 1];
  const calendarTitleY = lastCard.y + lastCard.height / 2 + 48;
  const calendarGap = 4;
  const maxCalendarWidth = Math.min(cardWidth, 420);
  const naturalCellSize = Math.floor((maxCalendarWidth - calendarGap * 6) / 7);
  const cellSize = Math.max(34, Math.min(42, naturalCellSize));
  const calendar = {
    centerX: viewportWidth / 2,
    titleY: calendarTitleY,
    weekdayY: calendarTitleY + 34,
    gridTopY: calendarTitleY + 54,
    cellSize,
    gap: calendarGap,
  } as const;
  const contentBottom = calendar.gridTopY + calendar.cellSize * 6 + calendar.gap * 5;

  return {
    viewportClass,
    mode: 'vertical',
    titleY: viewportClass === 'narrow' ? 54 : 60,
    titleFontSize: viewportClass === 'narrow' ? 30 : 34,
    summaryCards,
    calendar,
    contentBottom,
  };
}
