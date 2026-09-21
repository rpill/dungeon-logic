import Phaser from 'phaser';

export const PUZZLE_HEADER_UI_KEYS = {
  titlePanel: 'puzzle-header-title-panel-v3',
  statusPanel: 'puzzle-header-status-panel-v3',
  streakIcon: 'puzzle-header-streak-icon-v3',
} as const;

export function preloadPuzzleHeaderUiAssets(scene: Phaser.Scene): void {
  scene.load.image(PUZZLE_HEADER_UI_KEYS.titlePanel, 'assets/ui/puzzle_header_title_panel_v3.png');
  scene.load.image(PUZZLE_HEADER_UI_KEYS.statusPanel, 'assets/ui/puzzle_header_status_panel_v3.png');
  scene.load.image(PUZZLE_HEADER_UI_KEYS.streakIcon, 'assets/ui/puzzle_header_streak_icon_v3.png');
}

function createScaledImage(
  scene: Phaser.Scene,
  textureKey: string,
  x: number,
  y: number,
  width: number,
  height: number,
): Phaser.GameObjects.Image {
  return scene.add.image(x, y, textureKey).setOrigin(0.5).setDisplaySize(width, height);
}

export function createPuzzleHeaderTitlePanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): Phaser.GameObjects.Image {
  return createScaledImage(scene, PUZZLE_HEADER_UI_KEYS.titlePanel, x, y, width, height);
}

export function createPuzzleHeaderStatusPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): Phaser.GameObjects.Image {
  return createScaledImage(scene, PUZZLE_HEADER_UI_KEYS.statusPanel, x, y, width, height);
}
