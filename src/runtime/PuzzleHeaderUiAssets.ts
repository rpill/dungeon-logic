import Phaser from 'phaser';
import { createQuietInset } from './QuietInset';
import { createSlateSurface } from './SlateSurface';

export const PUZZLE_HEADER_UI_KEYS = {
  titlePanel: 'puzzle-header-title-panel-v3',
  statusPanel: 'puzzle-header-status-panel-v3',
  streakIcon: 'puzzle-header-streak-icon-v3',
} as const;

export function preloadPuzzleHeaderUiAssets(scene: Phaser.Scene): void {
  scene.load.image(PUZZLE_HEADER_UI_KEYS.streakIcon, 'assets/ui/puzzle_header_streak_icon_v3.png');
}

export function createPuzzleHeaderTitlePanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): Phaser.GameObjects.NineSlice {
  return createSlateSurface(scene, x, y, width, height);
}

export function createPuzzleHeaderStatusPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): Phaser.GameObjects.Graphics {
  return createQuietInset(scene, { x, y, width, height, radius: Math.min(12, height * 0.4) });
}
