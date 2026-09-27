import Phaser from 'phaser';

export interface QuietInsetOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly radius?: number;
  readonly fillAlpha?: number;
  readonly borderAlpha?: number;
}

// A functional reading surface, deliberately without a second stone frame.
export function createQuietInset(scene: Phaser.Scene, options: QuietInsetOptions): Phaser.GameObjects.Graphics {
  const radius = options.radius ?? 10;
  const graphics = scene.add.graphics();
  const left = options.x - options.width / 2;
  const top = options.y - options.height / 2;
  graphics.fillStyle(0x17243a, options.fillAlpha ?? 0.88);
  graphics.fillRoundedRect(left, top, options.width, options.height, radius);
  if ((options.borderAlpha ?? 0.35) > 0) {
    graphics.lineStyle(1, 0x93a4bc, options.borderAlpha ?? 0.35);
    graphics.strokeRoundedRect(left + 0.5, top + 0.5, options.width - 1, options.height - 1, radius);
  }
  return graphics;
}
