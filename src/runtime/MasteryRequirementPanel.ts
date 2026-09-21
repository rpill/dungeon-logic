import Phaser from 'phaser';

const MASTERY_REQUIREMENT_PANEL_KEY = 'mastery-requirements-panel';
const SLICE_X = 52;
const SLICE_Y = 52;

export function preloadMasteryRequirementPanelAssets(scene: Phaser.Scene): void {
  scene.load.image(MASTERY_REQUIREMENT_PANEL_KEY, 'assets/ui/home_hub_card_tall_generated_trimmed.webp');
}

export function createMasteryRequirementPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): Phaser.GameObjects.NineSlice {
  const source = scene.textures.get(MASTERY_REQUIREMENT_PANEL_KEY).get();
  const sourceHeight = Math.max(1, source.height);
  const surfaceScale = height / sourceHeight;
  const localWidth = width / surfaceScale;

  return scene.add.nineslice(
    x,
    y,
    MASTERY_REQUIREMENT_PANEL_KEY,
    undefined,
    localWidth,
    sourceHeight,
    SLICE_X,
    SLICE_X,
    SLICE_Y,
    SLICE_Y,
  ).setScale(surfaceScale);
}
