import Phaser from 'phaser';
import { createModalPanel } from '../runtime/ModalPanel';
import type { UiDensity } from './UiDensity';
import { UI_THEME } from './UiTheme';

export interface UiModalOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly density: UiDensity;
  readonly variant: 'compact' | 'tall';
  readonly depth?: number;
}

export interface UiModalHandle {
  readonly veil: Phaser.GameObjects.Rectangle;
  readonly surface: Phaser.GameObjects.NineSlice;
  readonly contentBounds: Phaser.Geom.Rectangle;
  destroy(): void;
}

export function createUiModal(scene: Phaser.Scene, options: UiModalOptions): UiModalHandle {
  const depth = options.depth ?? 1000;
  const padding = options.density === 'mobile' ? 12 : options.density === 'compact' ? 16 : 24;
  const veil = scene.add.rectangle(
    scene.scale.width / 2,
    scene.scale.height / 2,
    scene.scale.width,
    scene.scale.height,
    UI_THEME.colors.background.overlay,
    0.84,
  ).setDepth(depth).setInteractive();
  const surface = createModalPanel(scene, {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    variant: options.variant === 'tall' ? 'tall' : 'wide',
    alpha: 0.985,
  }).setDepth(depth + 1);
  const contentBounds = new Phaser.Geom.Rectangle(
    options.x - options.width / 2 + padding,
    options.y - options.height / 2 + padding,
    options.width - padding * 2,
    options.height - padding * 2,
  );
  return {
    veil,
    surface,
    contentBounds,
    destroy: () => { veil.destroy(); surface.destroy(); },
  };
}
