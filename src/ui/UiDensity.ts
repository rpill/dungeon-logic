export type UiDensity = 'comfortable' | 'compact' | 'mobile';

export function resolveUiDensity(viewportWidth: number, viewportHeight: number): UiDensity {
  if (!Number.isFinite(viewportWidth) || !Number.isFinite(viewportHeight) || viewportWidth <= 0 || viewportHeight <= 0) {
    throw new RangeError('Viewport dimensions must be positive finite numbers.');
  }
  if (viewportWidth < 700 && viewportHeight >= viewportWidth) return 'mobile';
  if (viewportHeight <= 800) return 'compact';
  return 'comfortable';
}
