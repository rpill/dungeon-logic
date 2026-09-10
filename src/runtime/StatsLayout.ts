import { classifyViewport, type ViewportClass } from '../scenes/GameBoardLayout';
import { calculateMetaPageHeaderMetrics } from './MetaPageHeaderLayout';

export interface StatsSummaryCardLayout {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface StatsLayout {
  readonly viewportClass: ViewportClass;
  readonly mode: 'columns' | 'vertical';
  readonly titleY: number;
  readonly titleFontSize: number;
  readonly summaryCards: readonly StatsSummaryCardLayout[];
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
  const header = calculateMetaPageHeaderMetrics(viewportWidth, viewportHeight);
  const compactLandscape = viewportHeight <= 460 && viewportWidth < 900;

  if (compactLandscape) {
    const sideMargin = 18;
    const gap = 12;
    const cardWidth = Math.min(
      252,
      Math.floor((viewportWidth - sideMargin * 2 - gap * 2) / 3),
    );
    const totalWidth = cardWidth * 3 + gap * 2;
    const startX = (viewportWidth - totalWidth) / 2 + cardWidth / 2;
    const titleY = header.titleY;
    const cardHeight = 164;
    const cardY = 206;
    const summaryCards = Array.from({ length: 3 }, (_, index): StatsSummaryCardLayout => ({
      x: startX + index * (cardWidth + gap),
      y: cardY,
      width: cardWidth,
      height: cardHeight,
    }));

    return {
      viewportClass,
      mode: 'columns',
      titleY,
      titleFontSize: header.titleFontSize,
      summaryCards,
      contentBottom: cardY + cardHeight / 2 + 18,
    };
  }

  const sideMargin = viewportClass === 'narrow' ? 16 : 24;
  const cardWidth = Math.min(
    viewportWidth - sideMargin * 2,
    viewportClass === 'narrow' ? 358 : 430,
  );
  const titleY = header.titleY;
  const compactVertical = viewportHeight < 660;
  const cardHeight = viewportClass === 'narrow'
    ? (compactVertical ? 138 : 146)
    : (compactVertical ? 150 : 170);
  const cardGap = viewportClass === 'narrow'
    ? (compactVertical ? 14 : 18)
    : (compactVertical ? 20 : 26);
  const firstCardY = header.headerHeight + (
    viewportClass === 'narrow'
      ? compactVertical ? 82 : 95
      : compactVertical ? 90 : 105
  );
  const summaryCards = Array.from({ length: 3 }, (_, index): StatsSummaryCardLayout => ({
    x: viewportWidth / 2,
    y: firstCardY + index * (cardHeight + cardGap),
    width: cardWidth,
    height: cardHeight,
  }));
  const lastCard = summaryCards[summaryCards.length - 1];

  return {
    viewportClass,
    mode: 'vertical',
    titleY,
    titleFontSize: header.titleFontSize,
    summaryCards,
    contentBottom: lastCard.y + lastCard.height / 2 + 20,
  };
}
