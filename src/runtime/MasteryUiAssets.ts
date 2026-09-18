import Phaser from 'phaser';

export const MASTERY_UI_ASSET_KEYS = {
  strip: 'mastery-strip-simple',
  panel: 'mastery-panel-simple',
} as const;

export function preloadMasteryUiAssets(scene: Phaser.Scene): void {
  scene.load.image(MASTERY_UI_ASSET_KEYS.strip, 'assets/ui/mastery_strip_simple.png');
  scene.load.image(MASTERY_UI_ASSET_KEYS.panel, 'assets/ui/mastery_panel_simple.png');
}
