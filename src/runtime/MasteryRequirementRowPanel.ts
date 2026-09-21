import Phaser from 'phaser';

const MASTERY_REQUIREMENT_ROW_PANEL_KEY = 'mastery-requirement-row-panel';
const SLICE_X = 28;
const SLICE_Y = 28;

export function preloadMasteryRequirementRowPanelAssets(scene: Phaser.Scene): void {
  scene.load.image(MASTERY_REQUIREMENT_ROW_PANEL_KEY, 'assets/ui/mastery_requirement_row_flat.webp');
}

export function createMasteryRequirementRowPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  depth = 0,
): Phaser.GameObjects.NineSlice {
  const source = scene.textures.get(MASTERY_REQUIREMENT_ROW_PANEL_KEY).get();
  const sourceHeight = Math.max(1, source.height);
  const surfaceScale = height / sourceHeight;
  const localWidth = width / surfaceScale;

  return scene.add.nineslice(
    x,
    y,
    MASTERY_REQUIREMENT_ROW_PANEL_KEY,
    undefined,
    localWidth,
    sourceHeight,
    SLICE_X,
    SLICE_X,
    SLICE_Y,
    SLICE_Y,
  ).setScale(surfaceScale).setDepth(depth);
}
