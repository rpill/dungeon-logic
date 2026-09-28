export const STICKY_BOTTOM_INSET_REGISTRY_KEY = 'sticky-bottom-inset-px';

export interface ViewportInsets {
  readonly top?: number;
  readonly right?: number;
  readonly bottom?: number;
  readonly left?: number;
}

export interface AvailableViewport {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly right: number;
  readonly bottom: number;
  readonly centerX: number;
  readonly centerY: number;
}

interface CssStyleLike {
  getPropertyValue(name: string): string;
}

type CssStyleProvider = () => CssStyleLike | null;

function sanitizeDimension(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number.`);
  }
  return value;
}

export function sanitizeViewportInset(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, value)
    : 0;
}

export function calculateAvailableViewport(
  viewportWidth: number,
  viewportHeight: number,
  insets: ViewportInsets = {},
): AvailableViewport {
  const width = sanitizeDimension(viewportWidth, 'Viewport width');
  const height = sanitizeDimension(viewportHeight, 'Viewport height');

  const requestedLeft = sanitizeViewportInset(insets.left);
  const requestedRight = sanitizeViewportInset(insets.right);
  const requestedTop = sanitizeViewportInset(insets.top);
  const requestedBottom = sanitizeViewportInset(insets.bottom);

  const left = Math.min(requestedLeft, Math.max(0, width - 1));
  const rightInset = Math.min(requestedRight, Math.max(0, width - left - 1));
  const top = Math.min(requestedTop, Math.max(0, height - 1));
  const bottomInset = Math.min(requestedBottom, Math.max(0, height - top - 1));

  const availableWidth = Math.max(1, width - left - rightInset);
  const availableHeight = Math.max(1, height - top - bottomInset);
  const right = left + availableWidth;
  const bottom = top + availableHeight;

  return {
    x: left,
    y: top,
    width: availableWidth,
    height: availableHeight,
    right,
    bottom,
    centerX: left + availableWidth / 2,
    centerY: top + availableHeight / 2,
  };
}

function parseCssInset(style: CssStyleLike | null, property: string): number {
  if (style === null) return 0;
  const value = Number.parseFloat(style.getPropertyValue(property).trim());
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function defaultCssStyleProvider(): CssStyleLike | null {
  if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') {
    return null;
  }
  return getComputedStyle(document.documentElement);
}

export function readCssSafeAreaInsets(
  getStyle: CssStyleProvider = defaultCssStyleProvider,
): Required<ViewportInsets> {
  const style = getStyle();
  const browserTop = parseCssInset(style, '--browser-ui-inset-top');
  const browserBottom = parseCssInset(style, '--browser-ui-inset-bottom');
  return {
    top: Math.max(parseCssInset(style, '--safe-area-inset-top'), browserTop),
    right: parseCssInset(style, '--safe-area-inset-right'),
    bottom: Math.max(parseCssInset(style, '--safe-area-inset-bottom'), browserBottom),
    left: parseCssInset(style, '--safe-area-inset-left'),
  };
}
