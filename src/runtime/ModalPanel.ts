import Phaser from 'phaser';

export type ModalPanelVariant = 'wide' | 'tall' | 'rankup';

const MODAL_PANEL_KEYS: Record<ModalPanelVariant, string> = {
  wide: 'modal-panel-wide',
  tall: 'modal-panel-tall',
  rankup: 'mastery-rankup-panel',
};

const MODAL_SLICE_X: Record<ModalPanelVariant, number> = {
  wide: 74,
  tall: 66,
  rankup: 130,
};

const MODAL_SLICE_Y: Record<ModalPanelVariant, number> = {
  wide: 62,
  tall: 72,
  rankup: 130,
};

const MODAL_FRAME: Record<ModalPanelVariant, { x: number; y: number; width: number; height: number }> = {
  wide: { x: 3, y: 141, width: 892, height: 416 },
  tall: { x: 73, y: 46, width: 652, height: 931 },
  rankup: { x: 0, y: 0, width: 1122, height: 1402 },
};

export interface ModalPanelOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly variant: ModalPanelVariant;
  readonly alpha?: number;
}

export function preloadModalPanelAssets(scene: Phaser.Scene): void {
  scene.load.image(MODAL_PANEL_KEYS.wide, 'assets/ui/modal_panel_wide.webp');
  scene.load.image(MODAL_PANEL_KEYS.tall, 'assets/ui/modal_panel_tall.webp');
  scene.load.image(MODAL_PANEL_KEYS.rankup, 'assets/ui/mastery_rankup_panel_generated.webp');
}

export function createModalPanel(
  scene: Phaser.Scene,
  options: ModalPanelOptions,
): Phaser.GameObjects.NineSlice {
  const key = MODAL_PANEL_KEYS[options.variant];
  const texture = scene.textures.get(key);
  const frameKey = `${key}-trimmed`;
  const frame = MODAL_FRAME[options.variant];
  if (!texture.has(frameKey)) {
    texture.add(frameKey, 0, frame.x, frame.y, frame.width, frame.height);
  }
  const source = texture.get(frameKey);
  const sourceHeight = Math.max(1, source.height);
  const scale = options.height / sourceHeight;
  const localWidth = options.width / scale;
  const sliceX = MODAL_SLICE_X[options.variant];
  const sliceY = MODAL_SLICE_Y[options.variant];

  const surface = scene.add.nineslice(
    options.x,
    options.y,
    key,
    frameKey,
    localWidth,
    sourceHeight,
    sliceX,
    sliceX,
    sliceY,
    sliceY,
  ).setScale(scale);

  surface.setAlpha(options.alpha ?? 0.985);
  return surface;
}
