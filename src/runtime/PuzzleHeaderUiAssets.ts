import Phaser from 'phaser';
import { createUiInsetRow } from '../ui/UiInsetRow';
import { createUiPanel } from '../ui/UiPanel';

export const PUZZLE_HEADER_UI_KEYS = {
  titlePanel: 'puzzle-header-title-panel-v3',
  statusPanel: 'puzzle-header-status-panel-v3',
  streakIcon: 'puzzle-header-streak-icon-v3',
} as const;

export function preloadPuzzleHeaderUiAssets(scene: Phaser.Scene): void {
  // Compatibility preload: streak icon remains in use and old panel art stays available
  // until the remaining screens finish migrating to the common UI system.
  scene.load.image(PUZZLE_HEADER_UI_KEYS.titlePanel, 'assets/ui/puzzle_header_title_panel_v3.png');
  scene.load.image(PUZZLE_HEADER_UI_KEYS.statusPanel, 'assets/ui/puzzle_header_status_panel_v3.png');
  scene.load.image(PUZZLE_HEADER_UI_KEYS.streakIcon, 'assets/ui/puzzle_header_streak_icon_v3.png');
}

export function createPuzzleHeaderTitlePanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): Phaser.GameObjects.NineSlice {
  return createUiPanel(scene, { x, y, width, height, variant: 'wide', alpha: 0.98 });
}

export function createPuzzleHeaderStatusPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): Phaser.GameObjects.Graphics {
  return createUiInsetRow(scene, { x, y, width, height });
}
