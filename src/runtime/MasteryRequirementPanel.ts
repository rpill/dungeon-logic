import Phaser from 'phaser';
import { createSlateSurface } from './SlateSurface';

export function createMasteryRequirementPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): Phaser.GameObjects.NineSlice {
  return createSlateSurface(scene, x, y, width, height);
}
