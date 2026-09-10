export interface MetaPageHeaderMetrics {
  readonly narrow: boolean;
  readonly density: 'ultra' | 'tight' | 'medium' | 'regular';
  readonly backY: number;
  readonly titleY: number;
  readonly headerHeight: number;
  readonly titleFontSize: number;
  readonly backFontSize: number;
  readonly backIconSize: number;
}

export function calculateMetaPageHeaderMetrics(
  viewportWidth: number,
  viewportHeight: number,
): MetaPageHeaderMetrics {
  if (!Number.isFinite(viewportWidth) || !Number.isFinite(viewportHeight) || viewportWidth <= 0 || viewportHeight <= 0) {
    throw new RangeError('Meta-page viewport dimensions must be positive finite numbers.');
  }

  const narrow = viewportWidth < 700;
  const density = viewportHeight < 460
    ? 'ultra'
    : viewportHeight < 620
      ? 'tight'
      : viewportHeight < 800
        ? 'medium'
        : 'regular';

  let vertical: Pick<MetaPageHeaderMetrics, 'backY' | 'titleY' | 'headerHeight'>;
  if (narrow) {
    vertical = density === 'ultra'
      ? { backY: 24, titleY: 58, headerHeight: 82 }
      : density === 'tight'
        ? { backY: 28, titleY: 64, headerHeight: 90 }
        : density === 'medium'
          ? { backY: 32, titleY: 72, headerHeight: 102 }
          : { backY: 36, titleY: 82, headerHeight: 116 };
  } else {
    vertical = density === 'ultra'
      ? { backY: 24, titleY: 28, headerHeight: 48 }
      : density === 'tight'
        ? { backY: 28, titleY: 42, headerHeight: 70 }
        : density === 'medium'
          ? { backY: 34, titleY: 60, headerHeight: 96 }
          : { backY: 40, titleY: 78, headerHeight: 118 };
  }

  const titleFontSize = density === 'ultra'
    ? 24
    : narrow
      ? 30
      : 40;

  return {
    narrow,
    density,
    ...vertical,
    titleFontSize,
    backFontSize: density === 'ultra' ? 12 : narrow ? 13 : 16,
    backIconSize: density === 'ultra' ? 20 : narrow ? 22 : 28,
  };
}
