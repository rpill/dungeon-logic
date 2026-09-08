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

  if (viewportClass === 'narrow') {
    const margin = 16;
    const gapX = 12;
    const gapY = 12;
    const columns = Math.min(2, Math.max(1, itemCount));
    const cardWidth = Math.floor(
      (viewport.width - margin * 2 - gapX * Math.max(0, columns - 1)) / columns,
    );
    const compactHeight = viewport.height < 620;
    const cardHeight = compactHeight ? 88 : 104;
    const startY = compactHeight ? 152 : 174;
    const cards = Array.from({ length: itemCount }, (_, index): LevelCardLayout => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      return {
        x: margin + cardWidth / 2 + column * (cardWidth + gapX),
        y: startY + cardHeight / 2 + row * (cardHeight + gapY),
        width: cardWidth,
        height: cardHeight,
      };
    });

    return {
      viewportClass,
      titleY: 42,
      titleFontSize: 30,
      continueY: 98,
      continueWidth: viewport.width - margin * 2,
      continueHeight: 48,
      continueFontSize: 17,
      headerBottom: compactHeight ? 140 : 158,
      contentBottom: cards.length === 0 ? (compactHeight ? 140 : 158) : cards[cards.length - 1].y + cards[cards.length - 1].height / 2,
      columns,
      cardTitleFontSize: 18,
      cardStateFontSize: 13,
      cards,
    };
  }

  if (viewportClass === 'compact') {
    const margin = 24;
    const gapX = 18;
    const gapY = 18;
    const columns = Math.min(3, Math.max(1, itemCount));
    const cardWidth = Math.min(
      190,
      Math.floor(
        (viewport.width - margin * 2 - gapX * Math.max(0, columns - 1)) / columns,
      ),
    );
    const cardHeight = 130;
    const totalWidth = columns * cardWidth + Math.max(0, columns - 1) * gapX;
    const startX = (viewport.width - totalWidth) / 2 + cardWidth / 2;
    const cards = Array.from({ length: itemCount }, (_, index): LevelCardLayout => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      return {
        x: startX + column * (cardWidth + gapX),
        y: 210 + cardHeight / 2 + row * (cardHeight + gapY),
        width: cardWidth,
        height: cardHeight,
      };
    });

    return {
      viewportClass,
      titleY: 54,
      titleFontSize: 38,
      continueY: 116,
      continueWidth: Math.min(330, viewport.width - margin * 2),
      continueHeight: 52,
      continueFontSize: 19,
      headerBottom: 166,
      contentBottom: cards.length === 0 ? 166 : cards[cards.length - 1].y + cards[cards.length - 1].height / 2,
      columns,
      cardTitleFontSize: 21,
      cardStateFontSize: 15,
      cards,
    };
  }

  const cardWidth = 190;
  const cardGap = 22;
  const columns = Math.min(5, Math.max(1, itemCount));
  const totalWidth = columns * cardWidth + Math.max(0, columns - 1) * cardGap;
  const startX = (viewport.width - totalWidth) / 2 + cardWidth / 2;
  const cards = Array.from({ length: itemCount }, (_, index): LevelCardLayout => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      x: startX + column * (cardWidth + cardGap),
      y: 310 + row * 192,
      width: cardWidth,
      height: 170,
    };
  });

  return {
    viewportClass,
    titleY: 70,
    titleFontSize: 44,
    continueY: 138,
    continueWidth: 330,
    continueHeight: 54,
    continueFontSize: 20,
    headerBottom: 190,
    contentBottom: cards.length === 0 ? 190 : cards[cards.length - 1].y + cards[cards.length - 1].height / 2,
    columns,
    cardTitleFontSize: 24,
    cardStateFontSize: 16,
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
