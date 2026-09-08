export type ArchiveListViewportClass = 'wide' | 'compact' | 'narrow';

export interface ArchiveListLayout {
  readonly titleY: number;
  readonly headerBottom: number;
  readonly startY: number;
  readonly cardHeight: number;
  readonly gap: number;
  readonly centerX: number;
  readonly width: number;
}

export function calculateArchiveListLayout(
  viewportWidth: number,
  viewportClass: ArchiveListViewportClass,
  embedded: boolean,
): ArchiveListLayout {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) {
    throw new RangeError('Archive viewport width must be a positive finite number.');
  }

  if (embedded) {
    return {
      titleY: 74,
      headerBottom: 110,
      startY: 156,
      cardHeight: 64,
      gap: 10,
      centerX: 179,
      width: 274,
    };
  }

  if (viewportClass === 'narrow') {
    return {
      titleY: 62,
      headerBottom: 100,
      startY: 145,
      cardHeight: 62,
      gap: 9,
      centerX: viewportWidth / 2,
      width: Math.min(viewportWidth - 28, 560),
    };
  }

  return {
    titleY: 72,
    headerBottom: 112,
    startY: 161,
    cardHeight: 70,
    gap: 12,
    centerX: viewportWidth / 2,
    width: Math.min(viewportWidth - 48, 560),
  };
}
