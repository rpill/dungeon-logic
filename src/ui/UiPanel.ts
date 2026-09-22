import Phaser from 'phaser';
import { createHomeHubModeCard } from '../runtime/HomeHubModeCard';

export interface UiPanelOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly variant: 'wide' | 'tall';
  readonly depth?: number;
  readonly alpha?: number;
}

export function createUiPanel(scene: Phaser.Scene, options: UiPanelOptions): Phaser.GameObjects.NineSlice {
  return createHomeHubModeCard(scene, {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    variant: options.variant,
    interactive: false,
    onActivate: () => {},
  }).setDepth(options.depth ?? 0).setAlpha(options.alpha ?? 0.97);
}
