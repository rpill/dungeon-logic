import Phaser from 'phaser';
import type { UiDensity } from './UiDensity';
import { createUiTextStyle } from './UiText';
import { UI_THEME } from './UiTheme';

export interface UiSceneHeaderOptions {
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly density: UiDensity;
  readonly maxWidth?: number;
  readonly depth?: number;
}

export function createUiSceneHeader(scene: Phaser.Scene, options: UiSceneHeaderOptions): Phaser.GameObjects.Container {
  const depth = options.depth ?? 10;
  const container = scene.add.container(options.x, options.y).setDepth(depth);
  const label = scene.add.text(0, 0, options.label, createUiTextStyle('display', options.density, {
    align: 'center',
    color: UI_THEME.colors.text.primary,
  })).setOrigin(0.5);
  if (options.maxWidth !== undefined && label.width > options.maxWidth) label.setScale(options.maxWidth / label.width);

  const gap = options.density === 'mobile' ? 18 : 24;
  const lineWidth = options.density === 'comfortable' ? 42 : 34;
  const graphics = scene.add.graphics();
  graphics.lineStyle(2, UI_THEME.colors.semantic.gold, 0.9);
  graphics.lineBetween(-label.displayWidth / 2 - gap - lineWidth, 0, -label.displayWidth / 2 - gap, 0);
  graphics.lineBetween(label.displayWidth / 2 + gap, 0, label.displayWidth / 2 + gap + lineWidth, 0);
  graphics.fillStyle(UI_THEME.colors.semantic.gold, 1);
  for (const x of [-label.displayWidth / 2 - gap / 2, label.displayWidth / 2 + gap / 2]) {
    graphics.beginPath();
    graphics.moveTo(x, -5);
    graphics.lineTo(x + 5, 0);
    graphics.lineTo(x, 5);
    graphics.lineTo(x - 5, 0);
    graphics.closePath();
    graphics.fillPath();
  }
  container.add([graphics, label]);
  return container;
}

export function createUiSectionHeader(scene: Phaser.Scene, options: UiSceneHeaderOptions): Phaser.GameObjects.Text {
  const text = scene.add.text(options.x, options.y, options.label, createUiTextStyle('heading', options.density, {
    align: 'center',
    color: UI_THEME.colors.text.primary,
  })).setOrigin(0.5).setDepth(options.depth ?? 10);
  if (options.maxWidth !== undefined && text.width > options.maxWidth) text.setScale(options.maxWidth / text.width);
  return text;
}
