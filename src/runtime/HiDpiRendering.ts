import Phaser from 'phaser';

export const MAX_RENDER_DPR = 2;

interface DrawingContextLike {
  useCanvas: boolean;
  setScissorBox: (x: number, y: number, width: number, height: number) => void;
  getClone: (...args: unknown[]) => DrawingContextLike;
}

interface WebGlRendererLike {
  type: number;
  isBooted: boolean;
  baseDrawingContext: DrawingContextLike | null;
  resize: (width: number, height: number) => unknown;
  setProjectionMatrix: (width: number, height: number, flipY?: boolean) => unknown;
  setProjectionMatrixFromDrawingContext: (drawingContext: DrawingContextLike) => unknown;
  resetProjectionMatrix: () => unknown;
}

interface HiDpiState {
  dpr: number;
  logicalWidth: number;
  logicalHeight: number;
}

const patchedDrawingContexts = new WeakSet<object>();
let textFactoryPatched = false;

function getRenderDpr(): number {
  const deviceDpr = Number.isFinite(window.devicePixelRatio) ? window.devicePixelRatio : 1;
  return Phaser.Math.Clamp(deviceDpr, 1, MAX_RENDER_DPR);
}


function installHiDpiTextFactory(): void {
  if (textFactoryPatched) return;
  textFactoryPatched = true;

  const factoryPrototype = Phaser.GameObjects.GameObjectFactory.prototype;
  const originalTextFactory = factoryPrototype.text;
  factoryPrototype.text = function (
    x: number,
    y: number,
    text: string | string[],
    style?: Phaser.Types.GameObjects.Text.TextStyle,
  ): Phaser.GameObjects.Text {
    return originalTextFactory.call(this, x, y, text, {
      ...style,
      resolution: getRenderDpr(),
    });
  };
}

function patchCanvasDrawingContext(context: DrawingContextLike, state: HiDpiState): void {
  if (patchedDrawingContexts.has(context)) return;
  patchedDrawingContexts.add(context);

  const originalSetScissorBox = context.setScissorBox.bind(context);
  context.setScissorBox = (x: number, y: number, width: number, height: number): void => {
    const dpr = context.useCanvas ? state.dpr : 1;
    originalSetScissorBox(x * dpr, y * dpr, width * dpr, height * dpr);
  };

  const originalGetClone = context.getClone.bind(context);
  context.getClone = (...args: unknown[]): DrawingContextLike => {
    const clone = originalGetClone(...args);
    patchCanvasDrawingContext(clone, state);
    return clone;
  };
}

/**
 * Phaser 4 RESIZE keeps the WebGL drawing buffer at CSS-pixel resolution.
 * On HiDPI phones that makes the whole Phaser canvas look soft. This bridge
 * keeps ScaleManager / input / scene coordinates in logical CSS pixels while
 * increasing only the WebGL drawing buffer resolution (capped for performance).
 */
export function installHiDpiRendering(game: Phaser.Game): void {
  installHiDpiTextFactory();

  const install = (): void => {
    const renderer = game.renderer as unknown as WebGlRendererLike | null;
    if (!renderer || renderer.type !== Phaser.WEBGL || !renderer.isBooted || !renderer.baseDrawingContext) {
      return;
    }

    const canvas = game.canvas;
    const state: HiDpiState = {
      dpr: 1,
      logicalWidth: Math.max(1, Math.round(game.scale.width)),
      logicalHeight: Math.max(1, Math.round(game.scale.height)),
    };

    patchCanvasDrawingContext(renderer.baseDrawingContext, state);

    const originalSetProjectionMatrixFromDrawingContext = renderer.setProjectionMatrixFromDrawingContext.bind(renderer);
    renderer.setProjectionMatrixFromDrawingContext = (drawingContext: DrawingContextLike): unknown => {
      if (drawingContext.useCanvas) {
        return renderer.setProjectionMatrix(state.logicalWidth, state.logicalHeight);
      }
      return originalSetProjectionMatrixFromDrawingContext(drawingContext);
    };

    renderer.resetProjectionMatrix = (): unknown => (
      renderer.setProjectionMatrix(state.logicalWidth, state.logicalHeight)
    );

    const applyHiDpi = (): void => {
      const logicalWidth = Math.max(1, Math.round(game.scale.width));
      const logicalHeight = Math.max(1, Math.round(game.scale.height));
      const dpr = getRenderDpr();
      const physicalWidth = Math.max(1, Math.round(logicalWidth * dpr));
      const physicalHeight = Math.max(1, Math.round(logicalHeight * dpr));

      state.dpr = dpr;
      state.logicalWidth = logicalWidth;
      state.logicalHeight = logicalHeight;

      canvas.width = physicalWidth;
      canvas.height = physicalHeight;

      renderer.resize(physicalWidth, physicalHeight);
      renderer.setProjectionMatrix(logicalWidth, logicalHeight);

      // Scale.NONE leaves viewport ownership to VisualViewportBridge. Keep the
      // DOM/input rectangle in logical CSS pixels while only the backing buffer
      // uses HiDPI pixels. Never recenter here: fullscreen/browser-chrome
      // transitions must not accumulate Phaser canvas margins.
      canvas.style.width = `${logicalWidth}px`;
      canvas.style.height = `${logicalHeight}px`;
      game.scale.updateBounds();
      game.scale.displayScale.set(
        game.scale.baseSize.width / Math.max(1, game.scale.canvasBounds.width),
        game.scale.baseSize.height / Math.max(1, game.scale.canvasBounds.height),
      );
    };

    // Phaser's renderer handles RESIZE first and temporarily restores a 1x
    // backing buffer; our later listener reapplies HiDPI without touching the
    // logical ScaleManager dimensions.
    game.scale.on(Phaser.Scale.Events.RESIZE, applyHiDpi);
    applyHiDpi();
  };

  if (game.isRunning) {
    install();
  } else {
    game.events.once(Phaser.Core.Events.READY, install);
  }
}
