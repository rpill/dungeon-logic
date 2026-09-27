import Phaser from 'phaser';

const PANEL_KEY = 'soft-stone-panel-monolith';
const SLICE_X = 200;
const SLICE_Y = 160;

export function preloadSoftStonePanelAssets(scene: Phaser.Scene): void {
  scene.load.image(PANEL_KEY, 'assets/ui/soft_stone_panel_monolith.webp');
}

export function createSoftStonePanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): Phaser.GameObjects.NineSlice {
  const source = scene.textures.get(PANEL_KEY).get();
  const scale = height / Math.max(1, source.height);
  return scene.add.nineslice(
    x,
    y,
    PANEL_KEY,
    undefined,
    width / scale,
    source.height,
    SLICE_X,
    SLICE_X,
    SLICE_Y,
    SLICE_Y,
  ).setScale(scale);
}
