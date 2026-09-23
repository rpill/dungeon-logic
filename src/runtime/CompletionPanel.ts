import Phaser from 'phaser';

const COMPLETION_PANEL_KEY = 'completion-panel';
const COMPLETION_PANEL_SLICE_X = 68;
const COMPLETION_PANEL_SLICE_Y = 68;

export function preloadCompletionPanelAssets(scene: Phaser.Scene): void {
  scene.load.image(COMPLETION_PANEL_KEY, 'assets/ui/completion_panel.webp');
}

export function createCompletionPanelSurface(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
): Phaser.GameObjects.NineSlice {
  return scene.add.nineslice(
    x,
    y,
    COMPLETION_PANEL_KEY,
    undefined,
    width,
    height,
    COMPLETION_PANEL_SLICE_X,
    COMPLETION_PANEL_SLICE_X,
    COMPLETION_PANEL_SLICE_Y,
    COMPLETION_PANEL_SLICE_Y,
  );
}

export function drawCompletionCrown(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();
  const half = size / 2;
  const baseY = y + size * 0.18;
  const outline = Math.max(2, size * 0.05);

  graphics.fillStyle(0xffc53a, 1);
  graphics.lineStyle(outline, 0x734008, 1);
  graphics.beginPath();
  graphics.moveTo(x - half * 0.78, baseY);
  graphics.lineTo(x - half * 0.58, y - size * 0.08);
  graphics.lineTo(x - half * 0.2, y - half * 0.82);
  graphics.lineTo(x, y - size * 0.05);
  graphics.lineTo(x + half * 0.26, y - half * 0.88);
  graphics.lineTo(x + half * 0.58, y - size * 0.08);
  graphics.lineTo(x + half * 0.78, baseY);
  graphics.closePath();
  graphics.fillPath();
  graphics.strokePath();

  graphics.fillStyle(0xffe17a, 1);
  graphics.beginPath();
  graphics.moveTo(x - half * 0.58, baseY - size * 0.01);
  graphics.lineTo(x - half * 0.42, y + size * 0.02);
  graphics.lineTo(x - half * 0.15, y - half * 0.54);
  graphics.lineTo(x, y - size * 0.01);
  graphics.lineTo(x + half * 0.2, y - half * 0.58);
  graphics.lineTo(x + half * 0.42, y + size * 0.02);
  graphics.lineTo(x + half * 0.58, baseY - size * 0.01);
  graphics.closePath();
  graphics.fillPath();

  const jewelRadius = Math.max(2, size * 0.05);
  graphics.fillStyle(0xffeb9d, 1);
  graphics.fillCircle(x - half * 0.2, y - half * 0.8, jewelRadius);
  graphics.fillCircle(x + half * 0.26, y - half * 0.86, jewelRadius);
  graphics.fillCircle(x, baseY - size * 0.07, jewelRadius);

  return graphics;
}
