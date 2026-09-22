import Phaser from 'phaser';
import { UI_THEME, uiColorHex } from './UiTheme';

let progressTextureSerial = 0;

export interface UiProgressBarOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly current: number;
  readonly target: number;
  readonly depth?: number;
}

export function createUiProgressBar(
  scene: Phaser.Scene,
  options: UiProgressBarOptions,
): Phaser.GameObjects.Container {
  const width = Math.max(1, options.width);
  const height = Math.max(1, options.height);
  const ratio = Phaser.Math.Clamp(options.current / Math.max(1, options.target), 0, 1);
  const depth = options.depth ?? 0;
  const radius = height / 2;

  const container = scene.add.container(options.x, options.y).setDepth(depth);
  const track = scene.add.graphics();
  track.fillStyle(UI_THEME.colors.surface.inset, 0.98);
  track.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
  track.lineStyle(1, UI_THEME.colors.border.dark, 0.95);
  track.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
  container.add(track);

  if (ratio <= 0) return container;

  const textureWidth = Math.max(2, Math.ceil(width));
  const textureHeight = Math.max(2, Math.ceil(height));
  const visibleWidth = Math.max(textureHeight, textureWidth * ratio);
  const textureKey = `ui-progress-fill-${progressTextureSerial++}`;
  const texture = scene.textures.createCanvas(textureKey, textureWidth, textureHeight);
  if (texture === null) return container;

  const ctx = texture.context;
  const gradient = ctx.createLinearGradient(0, 0, textureWidth, 0);
  gradient.addColorStop(0, uiColorHex(UI_THEME.colors.semantic.gold));
  gradient.addColorStop(1, uiColorHex(UI_THEME.colors.semantic.success));

  const paintWidth = Math.min(textureWidth, visibleWidth);
  const paintRadius = Math.min(textureHeight / 2, paintWidth / 2);
  ctx.clearRect(0, 0, textureWidth, textureHeight);
  ctx.beginPath();
  ctx.moveTo(paintRadius, 0);
  ctx.lineTo(paintWidth - paintRadius, 0);
  ctx.quadraticCurveTo(paintWidth, 0, paintWidth, paintRadius);
  ctx.lineTo(paintWidth, textureHeight - paintRadius);
  ctx.quadraticCurveTo(paintWidth, textureHeight, paintWidth - paintRadius, textureHeight);
  ctx.lineTo(paintRadius, textureHeight);
  ctx.quadraticCurveTo(0, textureHeight, 0, textureHeight - paintRadius);
  ctx.lineTo(0, paintRadius);
  ctx.quadraticCurveTo(0, 0, paintRadius, 0);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  texture.refresh();

  const fillImage = scene.add.image(-width / 2, 0, textureKey)
    .setOrigin(0, 0.5)
    .setDisplaySize(width, height);
  container.add(fillImage);
  container.once('destroy', () => {
    if (scene.textures.exists(textureKey)) scene.textures.remove(textureKey);
  });
  return container;
}
