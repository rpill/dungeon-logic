import Phaser from 'phaser';
import { UI_THEME } from './UiTheme';

export interface UiInsetRowOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly depth?: number;
  readonly emphasized?: boolean;
}

export function createUiInsetRow(scene: Phaser.Scene, options: UiInsetRowOptions): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics().setDepth(options.depth ?? 0);
  const radius = Math.min(UI_THEME.radius.medium, Math.floor(options.height / 3));
  const left = options.x - options.width / 2;
  const top = options.y - options.height / 2;
  graphics.fillStyle(options.emphasized ? UI_THEME.colors.surface.base : UI_THEME.colors.surface.inset, 0.98);
  graphics.fillRoundedRect(left, top, options.width, options.height, radius);
  graphics.lineStyle(1, options.emphasized ? UI_THEME.colors.border.bright : UI_THEME.colors.border.normal, 0.9);
  graphics.strokeRoundedRect(left, top, options.width, options.height, radius);
  return graphics;
}
