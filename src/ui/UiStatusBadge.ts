import Phaser from 'phaser';
import type { UiDensity } from './UiDensity';
import { createUiInsetRow } from './UiInsetRow';
import { createUiTextStyle } from './UiText';
import { UI_THEME } from './UiTheme';

export type UiStatusTone = 'neutral' | 'success' | 'gold' | 'danger';

export interface UiStatusBadgeOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  readonly density: UiDensity;
  readonly tone?: UiStatusTone;
  readonly depth?: number;
}

export interface UiStatusBadgeHandle {
  readonly surface: Phaser.GameObjects.Graphics;
  readonly label: Phaser.GameObjects.Text;
  destroy(): void;
}

const toneColor = (tone: UiStatusTone): number => {
  if (tone === 'success') return UI_THEME.colors.semantic.success;
  if (tone === 'gold') return UI_THEME.colors.semantic.gold;
  if (tone === 'danger') return UI_THEME.colors.semantic.danger;
  return UI_THEME.colors.text.secondary;
};

export function createUiStatusBadge(scene: Phaser.Scene, options: UiStatusBadgeOptions): UiStatusBadgeHandle {
  const depth = options.depth ?? 0;
  const tone = options.tone ?? 'neutral';
  const surface = createUiInsetRow(scene, {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    depth,
    emphasized: tone !== 'neutral',
  });
  const label = scene.add.text(options.x, options.y, options.label, createUiTextStyle('meta', options.density, {
    color: toneColor(tone),
    align: 'center',
    fontStyle: 'bold',
  })).setOrigin(0.5).setDepth(depth + 1);
  return { surface, label, destroy: () => { label.destroy(); surface.destroy(); } };
}
