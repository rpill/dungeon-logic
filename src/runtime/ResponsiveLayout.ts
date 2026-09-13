import { classifyViewport, type ViewportClass } from '../scenes/GameBoardLayout';
import { calculateMetaPageHeaderMetrics } from './MetaPageHeaderLayout';

export interface ViewportSize {
  readonly width: number;
  readonly height: number;
}

export interface LevelCardLayout {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly numberY: number;
}

export interface LevelSelectLayout {
  readonly viewportClass: ViewportClass;
  readonly titleY: number;
  readonly titleFontSize: number;
  readonly continueY: number;
  readonly continueWidth: number;
  readonly continueHeight: number;
  readonly continueFontSize: number;
  readonly progressLabelY: number;
  readonly progressLabelFontSize: number;
  readonly progressBarY: number;
  readonly progressBarWidth: number;
  readonly progressBarHeight: number;
  readonly headerBottom: number;
  readonly contentBottom: number;
  readonly columns: number;
  readonly cardTitleFontSize: number;
  readonly cardStateFontSize: number;
  readonly cards: readonly LevelCardLayout[];
}

export interface PuzzleChromeLayout {
  readonly titleY: number;
  readonly titleFontSize: number;
  readonly actionInset: number;
  readonly actionFontSize: number;
  readonly statusBottomInset: number;
  readonly statusFontSize: number;
  readonly modalWidth: number;
  readonly modalTitleFontSize: number;
  readonly modalCopyFontSize: number;
  readonly overlayButtonWidth: number;
}

export function getInitialViewportSize(width: number, height: number): ViewportSize {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new RangeError('Viewport dimensions must be positive finite numbers.');
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

export function calculateLevelSelectLayout(
  viewportWidth: number,
  viewportHeight: number,
  itemCount: number,
): LevelSelectLayout {
  const viewport = getInitialViewportSize(viewportWidth, viewportHeight);
  if (!Number.isInteger(itemCount) || itemCount < 0) {
    throw new RangeError('Level item count must be a non-negative integer.');
  }

  const viewportClass = classifyViewport(viewport.width);
  const metaHeader = calculateMetaPageHeaderMetrics(viewport.width, viewport.height);
  const portraitNarrow = viewportClass === 'narrow' && viewport.height >= viewport.width;

  if (portraitNarrow) {
    const margin = 16;
    const gapX = 16;
    const gapY = 22;
    const columns = Math.min(4, Math.max(1, itemCount));
    const rowsPerBlock = Math.max(1, Math.ceil(8 / columns));
    const blockGap = viewport.height < 620 ? 26 : 32;
    const maxCardWidth = Math.floor(
      (viewport.width - margin * 2 - gapX * Math.max(0, columns - 1)) / columns,
    );
    const cardSize = Math.min(72, maxCardWidth);
    const numberFontSize = Math.max(10, Math.min(13, Math.floor(cardSize * 0.18)));
    const numberGap = 3;
    const numberHeight = numberFontSize + 2;
    const rowPitch = cardSize + numberGap + numberHeight + gapY;
    const totalWidth = columns * cardSize + Math.max(0, columns - 1) * gapX;
    const startX = (viewport.width - totalWidth) / 2 + cardSize / 2;
    const continueHeight = viewport.height < 620 ? 42 : 46;
    const continueY = metaHeader.headerHeight + (viewport.height < 620 ? 26 : 32);
    const progressLabelY = continueY + continueHeight / 2 + (viewport.height < 620 ? 16 : 18);
    const progressBarY = progressLabelY + 18;
    const progressBarWidth = Math.min(viewport.width - margin * 2 - 52, 196);
    const progressBarHeight = 6;
    const headerBottom = progressBarY + progressBarHeight / 2 + 22;
    const gridTop = headerBottom + 16;
    const cards = Array.from({ length: itemCount }, (_, index): LevelCardLayout => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const blockBreaksBeforeRow = Math.floor(row / rowsPerBlock);
      const y = gridTop + cardSize / 2 + row * rowPitch + blockBreaksBeforeRow * blockGap;
      return {
        x: startX + column * (cardSize + gapX),
        y,
        width: cardSize,
        height: cardSize,
        numberY: y + cardSize / 2 + numberGap + numberHeight / 2,
      };
    });

    return {
      viewportClass,
      titleY: metaHeader.titleY,
      titleFontSize: metaHeader.titleFontSize,
      continueY,
      continueWidth: Math.min(viewport.width - margin * 2, 260),
      continueHeight,
      continueFontSize: 16,
      progressLabelY,
      progressLabelFontSize: 12,
      progressBarY,
      progressBarWidth,
      progressBarHeight,
      headerBottom,
      contentBottom: cards.length === 0 ? headerBottom : cards[cards.length - 1].numberY + numberHeight / 2,
      columns,
      cardTitleFontSize: numberFontSize,
      cardStateFontSize: 11,
      cards,
    };
  }

  const margin = viewportClass === 'wide' ? 28 : 18;
  const gapX = viewportClass === 'wide' ? 16 : 14;
  const gapY = viewportClass === 'wide' ? 4 : 5;
  const columns = Math.min(8, Math.max(1, itemCount));
  const rows = columns === 0 ? 0 : Math.ceil(itemCount / columns);
  const rowsPerBlock = Math.max(1, Math.ceil(8 / columns));
  const blockBreakCount = Math.max(0, Math.ceil(rows / rowsPerBlock) - 1);
  const shortViewport = viewport.height < 500;
  const blockGap = shortViewport ? 14 : viewport.height >= 860 ? 34 : viewport.height >= 760 ? 28 : 20;
  const continueHeight = shortViewport ? 42 : 46;
  const continueY = metaHeader.headerHeight + (shortViewport ? 24 : 25);
  const progressLabelY = continueY + continueHeight / 2 + (shortViewport ? 14 : 16);
  const progressBarY = progressLabelY + 16;
  const progressBarWidth = Math.min(shortViewport ? 208 : 244, viewport.width - margin * 2 - 48);
  const progressBarHeight = shortViewport ? 5 : 6;
  const headerBottom = progressBarY + progressBarHeight / 2 + (shortViewport ? 16 : 22);
  const gridTop = headerBottom + 10;
  const numberGap = 2;
  const numberFontSize = shortViewport ? 10 : 11;
  const numberHeight = numberFontSize + 2;
  const maxCardFromWidth = Math.floor(
    (viewport.width - margin * 2 - gapX * Math.max(0, columns - 1)) / columns,
  );
  const maxCardFromHeight = rows === 0
    ? 72
    : Math.floor(
        (
          viewport.height
          - gridTop
          - rows * (numberGap + numberHeight)
          - gapY * Math.max(0, rows - 1)
          - blockGap * blockBreakCount
        ) / rows,
      );
  const minimumReadableCard = shortViewport ? 46 : viewport.height < 760 ? 39 : 48;
  const cardSize = Math.max(
    minimumReadableCard,
    Math.min(72, maxCardFromWidth, maxCardFromHeight),
  );
  const rowPitch = cardSize + numberGap + numberHeight + gapY;
  const totalWidth = columns * cardSize + Math.max(0, columns - 1) * gapX;
  const startX = (viewport.width - totalWidth) / 2 + cardSize / 2;
  const cards = Array.from({ length: itemCount }, (_, index): LevelCardLayout => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const blockBreaksBeforeRow = Math.floor(row / rowsPerBlock);
    const y = gridTop + cardSize / 2 + row * rowPitch + blockBreaksBeforeRow * blockGap;
    return {
      x: startX + column * (cardSize + gapX),
      y,
      width: cardSize,
      height: cardSize,
      numberY: y + cardSize / 2 + numberGap + numberHeight / 2,
    };
  });

  return {
    viewportClass,
    titleY: metaHeader.titleY,
    titleFontSize: metaHeader.titleFontSize,
    continueY,
    continueWidth: Math.min(shortViewport ? 240 : 260, viewport.width - margin * 2),
    continueHeight,
    continueFontSize: shortViewport ? 14 : 16,
    progressLabelY,
    progressLabelFontSize: shortViewport ? 11 : 12,
    progressBarY,
    progressBarWidth,
    progressBarHeight,
    headerBottom,
    contentBottom: cards.length === 0 ? headerBottom : cards[cards.length - 1].numberY + numberHeight / 2,
    columns,
    cardTitleFontSize: numberFontSize,
    cardStateFontSize: 10,
    cards,
  };
}

export function calculatePuzzleChromeLayout(
  viewportWidth: number,
  viewportHeight: number,
): PuzzleChromeLayout {
  const viewport = getInitialViewportSize(viewportWidth, viewportHeight);
  const viewportClass = classifyViewport(viewport.width);
  const narrow = viewportClass === 'narrow';
  const margin = narrow ? 16 : 24;

  return {
    titleY: narrow ? 34 : 52,
    titleFontSize: narrow ? 24 : 42,
    actionInset: narrow ? 14 : 40,
    actionFontSize: narrow ? 14 : 20,
    statusBottomInset: narrow ? 24 : 42,
    statusFontSize: narrow ? 14 : 18,
    modalWidth: Math.min(narrow ? 420 : 760, viewport.width - margin * 2),
    modalTitleFontSize: narrow ? 20 : 24,
    modalCopyFontSize: narrow ? 14 : 17,
    overlayButtonWidth: Math.min(220, viewport.width - margin * 2 - 48),
  };
}
