import { classifyViewport, type ViewportClass } from '../scenes/GameBoardLayout';

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
  const portraitNarrow = viewportClass === 'narrow' && viewport.height >= viewport.width;

  if (portraitNarrow) {
    const margin = 16;
    const gapX = 8;
    const gapY = 8;
    const columns = Math.min(4, Math.max(1, itemCount));
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
    const compactHeader = viewport.height < 620;
    const headerBottom = compactHeader ? 126 : 138;
    const gridTop = headerBottom + 12;
    const cards = Array.from({ length: itemCount }, (_, index): LevelCardLayout => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const y = gridTop + cardSize / 2 + row * rowPitch;
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
      titleY: 32,
      titleFontSize: 28,
      continueY: 100,
      continueWidth: Math.min(viewport.width - margin * 2, 260),
      continueHeight: 46,
      continueFontSize: 16,
      headerBottom,
      contentBottom: cards.length === 0 ? headerBottom : cards[cards.length - 1].numberY + numberHeight / 2,
      columns,
      cardTitleFontSize: numberFontSize,
      cardStateFontSize: 11,
      cards,
    };
  }

  const margin = viewportClass === 'wide' ? 28 : 18;
  const gapX = viewportClass === 'wide' ? 10 : 8;
  const gapY = viewportClass === 'wide' ? 4 : 5;
  const columns = Math.min(8, Math.max(1, itemCount));
  const rows = columns === 0 ? 0 : Math.ceil(itemCount / columns);
  const shortViewport = viewport.height < 500;
  const headerBottom = shortViewport ? 136 : 154;
  const gridTop = headerBottom + 8;
  const bottomPadding = 24;
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
          - bottomPadding
          - rows * (numberGap + numberHeight)
          - gapY * Math.max(0, rows - 1)
        ) / rows,
      );
  const minimumReadableCard = shortViewport ? 46 : 48;
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
    const y = gridTop + cardSize / 2 + row * rowPitch;
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
    titleY: shortViewport ? 30 : 36,
    titleFontSize: shortViewport ? 28 : 32,
    continueY: shortViewport ? 88 : 102,
    continueWidth: Math.min(shortViewport ? 240 : 260, viewport.width - margin * 2),
    continueHeight: shortViewport ? 42 : 46,
    continueFontSize: shortViewport ? 14 : 16,
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
    titleFontSize: narrow ? 28 : 42,
    actionInset: narrow ? 16 : 40,
    actionFontSize: narrow ? 15 : 20,
    statusBottomInset: narrow ? 24 : 42,
    statusFontSize: narrow ? 13 : 18,
    modalWidth: Math.min(narrow ? 420 : 760, viewport.width - margin * 2),
    modalTitleFontSize: narrow ? 20 : 24,
    modalCopyFontSize: narrow ? 14 : 17,
    overlayButtonWidth: Math.min(220, viewport.width - margin * 2 - 48),
  };
}
