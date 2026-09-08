export const META_SCROLL_BOTTOM_PADDING = 24;
export const META_SCROLL_DRAG_THRESHOLD = 8;

export function getMetaScrollMaxY(
  viewportHeight: number,
  contentBottom: number,
  bottomPadding = META_SCROLL_BOTTOM_PADDING,
): number {
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) return 0;
  if (!Number.isFinite(contentBottom) || contentBottom <= 0) return 0;
  return Math.max(0, Math.ceil(contentBottom + bottomPadding - viewportHeight));
}

export function clampMetaScrollY(value: number, maxY: number): number {
  if (!Number.isFinite(value)) return 0;
  if (!Number.isFinite(maxY) || maxY <= 0) return 0;
  return Math.min(maxY, Math.max(0, value));
}

export function isMetaScrollDrag(
  startY: number,
  currentY: number,
  threshold = META_SCROLL_DRAG_THRESHOLD,
): boolean {
  return Math.abs(currentY - startY) > threshold;
}
