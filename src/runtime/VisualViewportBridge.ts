export interface BrowserViewportSize {
  readonly width: number;
  readonly height: number;
}

export interface BrowserViewportMetrics extends BrowserViewportSize {
  readonly offsetLeft: number;
  readonly offsetTop: number;
}

export interface BrowserUiInsets {
  readonly top: number;
  readonly bottom: number;
}

interface VisualViewportLike {
  readonly width: number;
  readonly height: number;
  readonly offsetLeft?: number;
  readonly offsetTop?: number;
  addEventListener(type: 'resize' | 'scroll', listener: () => void): void;
  removeEventListener(type: 'resize' | 'scroll', listener: () => void): void;
}

interface WindowLike {
  readonly innerWidth: number;
  readonly innerHeight: number;
  readonly visualViewport?: VisualViewportLike | null;
  addEventListener(type: 'resize' | 'orientationchange', listener: () => void): void;
  removeEventListener(type: 'resize' | 'orientationchange', listener: () => void): void;
  requestAnimationFrame(callback: () => void): number;
  cancelAnimationFrame(handle: number): void;
}

interface StyleLike {
  setProperty(name: string, value: string): void;
}

interface DocumentLike {
  readonly documentElement: { readonly style: StyleLike };
  addEventListener(type: 'fullscreenchange', listener: () => void): void;
  removeEventListener(type: 'fullscreenchange', listener: () => void): void;
}

interface ScaleLike {
  width: number;
  height: number;
  resize(width: number, height: number): unknown;
}

interface GameLike {
  readonly scale: ScaleLike;
}

interface VisualViewportEnvironment {
  readonly window?: WindowLike;
  readonly document?: DocumentLike;
}

function sanitizeViewportDimension(value: number, fallback: number): number {
  const candidate = Number.isFinite(value) && value > 0 ? value : fallback;
  return Math.max(1, Math.round(candidate));
}

function sanitizeViewportOffset(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value ?? 0)) : 0;
}

export function getBrowserViewportMetrics(source: {
  readonly innerWidth: number;
  readonly innerHeight: number;
  readonly visualViewport?: Pick<VisualViewportLike, 'width' | 'height' | 'offsetLeft' | 'offsetTop'> | null;
}): BrowserViewportMetrics {
  const layoutWidth = sanitizeViewportDimension(source.innerWidth, 1);
  const layoutHeight = sanitizeViewportDimension(source.innerHeight, 1);
  const visualViewport = source.visualViewport;

  return {
    width: sanitizeViewportDimension(visualViewport?.width ?? layoutWidth, layoutWidth),
    height: sanitizeViewportDimension(visualViewport?.height ?? layoutHeight, layoutHeight),
    offsetLeft: sanitizeViewportOffset(visualViewport?.offsetLeft),
    offsetTop: sanitizeViewportOffset(visualViewport?.offsetTop),
  };
}

export function getBrowserViewportSize(source: {
  readonly innerWidth: number;
  readonly innerHeight: number;
  readonly visualViewport?: Pick<VisualViewportLike, 'width' | 'height'> | null;
}): BrowserViewportSize {
  const viewport = getBrowserViewportMetrics(source);
  return { width: viewport.width, height: viewport.height };
}

export function applyBrowserViewportCss(
  viewport: BrowserViewportSize & Partial<Pick<BrowserViewportMetrics, 'offsetLeft' | 'offsetTop'>>,
  targetDocument: DocumentLike | Document = document,
): void {
  targetDocument.documentElement.style.setProperty('--app-viewport-width', `${viewport.width}px`);
  targetDocument.documentElement.style.setProperty('--app-viewport-height', `${viewport.height}px`);
  targetDocument.documentElement.style.setProperty('--app-viewport-left', '0px');
  targetDocument.documentElement.style.setProperty('--app-viewport-top', '0px');
  const browserUiInsets = getBrowserUiInsets(viewport.width, viewport.height);
  targetDocument.documentElement.style.setProperty('--browser-ui-inset-top', `${browserUiInsets.top}px`);
  targetDocument.documentElement.style.setProperty('--browser-ui-inset-bottom', `${browserUiInsets.bottom}px`);
}

export function getBrowserUiInsets(width: number, height: number): BrowserUiInsets {
  void width;
  void height;
  return { top: 0, bottom: 0 };
}

function getDefaultWindow(): WindowLike | undefined {
  return typeof window === 'undefined' ? undefined : window;
}

function getDefaultDocument(): DocumentLike | undefined {
  return typeof document === 'undefined' ? undefined : document;
}

/**
 * Owns Phaser's logical canvas size while the game uses Scale.NONE. Mobile
 * browser chrome can shrink VisualViewport without immediately changing the
 * layout viewport / 100vh, so the bridge explicitly resizes Phaser to the
 * actually visible rectangle. Keeping one resize owner avoids Scale.RESIZE and
 * manual resize passes fighting each other during fullscreen transitions.
 */
export function installVisualViewportSync(
  game: GameLike,
  environment: VisualViewportEnvironment = {},
): () => void {
  const targetWindow = environment.window ?? getDefaultWindow();
  const targetDocument = environment.document ?? getDefaultDocument();
  if (targetWindow === undefined || targetDocument === undefined) return () => {};

  let frameHandle: number | null = null;
  let disposed = false;

  const syncNow = (): void => {
    if (disposed) return;
    const viewport = getBrowserViewportMetrics(targetWindow);
    applyBrowserViewportCss(viewport, targetDocument);
    if (Math.round(game.scale.width) === viewport.width && Math.round(game.scale.height) === viewport.height) {
      return;
    }
    game.scale.resize(viewport.width, viewport.height);
  };

  const scheduleSync = (): void => {
    if (disposed || frameHandle !== null) return;
    frameHandle = targetWindow.requestAnimationFrame(() => {
      frameHandle = null;
      syncNow();
    });
  };

  const visualViewport = targetWindow.visualViewport ?? null;
  visualViewport?.addEventListener('resize', scheduleSync);
  visualViewport?.addEventListener('scroll', scheduleSync);
  targetWindow.addEventListener('resize', scheduleSync);
  targetWindow.addEventListener('orientationchange', scheduleSync);
  targetDocument.addEventListener('fullscreenchange', scheduleSync);

  syncNow();

  return () => {
    if (disposed) return;
    disposed = true;
    if (frameHandle !== null) {
      targetWindow.cancelAnimationFrame(frameHandle);
      frameHandle = null;
    }
    visualViewport?.removeEventListener('resize', scheduleSync);
    visualViewport?.removeEventListener('scroll', scheduleSync);
    targetWindow.removeEventListener('resize', scheduleSync);
    targetWindow.removeEventListener('orientationchange', scheduleSync);
    targetDocument.removeEventListener('fullscreenchange', scheduleSync);
  };
}
