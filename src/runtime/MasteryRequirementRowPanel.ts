import Phaser from 'phaser';
import { createQuietInset } from './QuietInset';

export function createMasteryRequirementRowPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  depth = 0,
): Phaser.GameObjects.Graphics {
  return createQuietInset(scene, {
    x, y, width, height,
    radius: Math.min(10, height * 0.16),
    fillAlpha: 0.82,
    borderAlpha: 0.24,
  }).setDepth(depth);
}
