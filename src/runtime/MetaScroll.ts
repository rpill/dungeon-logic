export const META_SCROLL_BOTTOM_PADDING = 24;
export const META_SCROLL_DRAG_THRESHOLD = 8;
export const META_SCROLL_INERTIA_FRICTION = 0.92;
export const META_SCROLL_MIN_INERTIA_SPEED = 18;
export const META_SCROLL_MAX_INERTIA_SPEED = 2600;
export const META_SCROLL_MAX_FRAME_MS = 34;

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

export function getMetaScrollVelocity(
  previousPointerY: number,
  currentPointerY: number,
  elapsedMs: number,
  previousVelocity = 0,
): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0 || elapsedMs > 120) return 0;

  const sampleVelocity = -((currentPointerY - previousPointerY) / elapsedMs) * 1000;
  const clampedSample = Math.max(
    -META_SCROLL_MAX_INERTIA_SPEED,
    Math.min(META_SCROLL_MAX_INERTIA_SPEED, sampleVelocity),
  );

  if (!Number.isFinite(previousVelocity) || Math.abs(previousVelocity) < META_SCROLL_MIN_INERTIA_SPEED) {
    return clampedSample;
  }

  // Bias toward the newest movement so a quick flick feels immediate, while
  // still filtering the large velocity spikes common in touchmove events.
  return previousVelocity + (clampedSample - previousVelocity) * 0.55;
}

export function stepMetaScrollInertia(
  scrollY: number,
  velocityY: number,
  deltaMs: number,
  maxY: number,
): { scrollY: number; velocityY: number } {
  if (!Number.isFinite(velocityY) || Math.abs(velocityY) < META_SCROLL_MIN_INERTIA_SPEED) {
    return { scrollY: clampMetaScrollY(scrollY, maxY), velocityY: 0 };
  }

  const safeDeltaMs = Math.max(0, Math.min(META_SCROLL_MAX_FRAME_MS, deltaMs));
  const nextScrollY = clampMetaScrollY(scrollY + velocityY * (safeDeltaMs / 1000), maxY);
  const hitStart = nextScrollY <= 0 && velocityY < 0;
  const hitEnd = nextScrollY >= maxY && velocityY > 0;
  if (hitStart || hitEnd) {
    return { scrollY: nextScrollY, velocityY: 0 };
  }

  const frameRatio = safeDeltaMs / (1000 / 60);
  const nextVelocity = velocityY * Math.pow(META_SCROLL_INERTIA_FRICTION, frameRatio);
  return {
    scrollY: nextScrollY,
    velocityY: Math.abs(nextVelocity) < META_SCROLL_MIN_INERTIA_SPEED ? 0 : nextVelocity,
  };
}
