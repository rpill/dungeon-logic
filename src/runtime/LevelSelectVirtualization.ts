export interface VirtualLevelCardLike {
  readonly y: number;
  readonly height: number;
}

export interface VirtualLevelCardWindowOptions {
  readonly scrollY: number;
  readonly viewportTop: number;
  readonly viewportBottom: number;
  readonly bufferRows?: number;
  readonly pinnedIndices?: readonly number[];
}

export function getLevelCardRowStride(cards: readonly VirtualLevelCardLike[]): number {
  if (cards.length <= 1) {
    return cards.length === 0 ? 1 : Math.max(1, cards[0]!.height);
  }

  const uniqueYs = [...new Set(cards.map((card) => card.y))].sort((a, b) => a - b);
  let stride = Number.POSITIVE_INFINITY;
  for (let index = 1; index < uniqueYs.length; index += 1) {
    const delta = uniqueYs[index]! - uniqueYs[index - 1]!;
    if (delta > 0) stride = Math.min(stride, delta);
  }

  if (Number.isFinite(stride)) return stride;
  return Math.max(1, cards[0]!.height);
}

export function getLevelCardVirtualWindowKey(scrollY: number, rowStride: number): number {
  const safeStride = Number.isFinite(rowStride) && rowStride > 0 ? rowStride : 1;
  const safeScrollY = Number.isFinite(scrollY) ? Math.max(0, scrollY) : 0;
  return Math.floor(safeScrollY / safeStride);
}

export function getVirtualizedLevelCardIndices(
  cards: readonly VirtualLevelCardLike[],
  options: VirtualLevelCardWindowOptions,
): readonly number[] {
  if (cards.length === 0) return [];

  const bufferRows = Math.max(0, options.bufferRows ?? 2);
  const rowStride = getLevelCardRowStride(cards);
  const bufferPx = rowStride * bufferRows;
  const worldTop = options.scrollY + options.viewportTop - bufferPx;
  const worldBottom = options.scrollY + options.viewportBottom + bufferPx;
  const result = new Set<number>();

  cards.forEach((card, index) => {
    const cardTop = card.y - card.height / 2;
    const cardBottom = card.y + card.height / 2;
    if (cardBottom >= worldTop && cardTop <= worldBottom) {
      result.add(index);
    }
  });

  for (const index of options.pinnedIndices ?? []) {
    if (Number.isInteger(index) && index >= 0 && index < cards.length) {
      result.add(index);
    }
  }

  return [...result].sort((a, b) => a - b);
}
