import Phaser from 'phaser';

import { getAudioFeedback } from '../audio/AudioFeedbackService';
import { calculateMetaPageHeaderMetrics, type MetaPageHeaderMetrics } from './MetaPageHeaderLayout';

export interface MetaPageHeaderOptions {
  readonly title: string;
  readonly backLabel: string;
  readonly onBack: (pointer: Phaser.Input.Pointer) => void;
  readonly fixed?: boolean;
  readonly metrics?: MetaPageHeaderMetrics;
}

export interface MetaPageHeaderHandle {
  readonly metrics: MetaPageHeaderMetrics;
  readonly title: Phaser.GameObjects.Text;
  readonly backHit: Phaser.GameObjects.Zone;
}

function fitTitleBetweenBackAndRightEdge(
  title: Phaser.GameObjects.Text,
  metrics: MetaPageHeaderMetrics,
  viewportWidth: number,
  backRight: number,
): void {
  if (Math.abs(metrics.titleY - metrics.backY) >= 28) return;
  const symmetricInset = Math.max(backRight + 12, 18);
  const availableWidth = Math.max(92, viewportWidth - symmetricInset * 2);
  if (title.width <= availableWidth) return;
  title.setFontSize(Math.max(18, Math.floor(metrics.titleFontSize * availableWidth / title.width)));
}

export function createMetaPageHeader(
  scene: Phaser.Scene,
  options: MetaPageHeaderOptions,
): MetaPageHeaderHandle {
  const metrics = options.metrics ?? calculateMetaPageHeaderMetrics(scene.scale.width, scene.scale.height);
  const fixed = options.fixed ?? false;
  const backX = metrics.narrow ? 16 : 28;
  const backGap = metrics.narrow ? 8 : 10;
  const depthBase = fixed ? 1001 : 1;

  const backIcon = scene.add.image(backX + metrics.backIconSize / 2, metrics.backY, 'ui-icon-back')
    .setDisplaySize(metrics.backIconSize, metrics.backIconSize)
    .setTint(0xf4ead7)
    .setDepth(depthBase + 2);
  const backText = scene.add.text(
    backX + metrics.backIconSize + backGap,
    metrics.backY,
    options.backLabel.replace(/^←\s*/, ''),
    {
      fontFamily: 'monospace',
      fontSize: `${metrics.backFontSize}px`,
      color: '#f4ead7',
      fontStyle: 'bold',
    },
  ).setOrigin(0, 0.5).setDepth(depthBase + 2);

  const backWidth = metrics.backIconSize + backGap + backText.width;
  const backHit = scene.add.zone(
    backX + backWidth / 2,
    metrics.backY,
    backWidth,
    Math.max(42, metrics.backIconSize + 10),
  ).setDepth(depthBase + 3).setInteractive({ useHandCursor: true });
  backHit.on('pointerover', () => {
    getAudioFeedback(scene).play('ui-hover');
  });
  backHit.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    getAudioFeedback(scene).play('ui-click');
    options.onBack(pointer);
  });

  const title = scene.add.text(scene.scale.width / 2, metrics.titleY, options.title, {
    fontFamily: 'monospace',
    fontSize: `${metrics.titleFontSize}px`,
    color: '#f4ead7',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(depthBase + 1);
  fitTitleBetweenBackAndRightEdge(title, metrics, scene.scale.width, backX + backWidth);

  const decor = scene.add.graphics().setDepth(depthBase);
  decor.fillStyle(0xf0b14f, 0.95);
  const diamondSize = metrics.density === 'ultra' ? 3 : metrics.narrow ? 4 : 6;
  const desiredLineWidth = metrics.density === 'ultra' ? 26 : metrics.narrow ? 34 : 46;
  const gap = metrics.density === 'ultra' ? 16 : metrics.narrow ? 20 : 34;
  const sideGap = metrics.density === 'ultra' ? 8 : metrics.narrow ? 12 : 20;
  const leftDiamondX = title.x - title.width / 2 - gap;
  const rightDiamondX = title.x + title.width / 2 + gap;
  const maxLineWidth = Math.max(0, Math.min(
    desiredLineWidth,
    leftDiamondX - sideGap - 8,
    scene.scale.width - rightDiamondX - sideGap - 8,
  ));
  const drawDiamond = (x: number): void => {
    decor.beginPath();
    decor.moveTo(x, metrics.titleY - diamondSize);
    decor.lineTo(x + diamondSize, metrics.titleY);
    decor.lineTo(x, metrics.titleY + diamondSize);
    decor.lineTo(x - diamondSize, metrics.titleY);
    decor.closePath();
    decor.fillPath();
  };
  drawDiamond(leftDiamondX);
  drawDiamond(rightDiamondX);
  if (maxLineWidth > 0) {
    decor.fillRect(leftDiamondX - maxLineWidth - sideGap, metrics.titleY - 1, maxLineWidth, 2);
    decor.fillRect(rightDiamondX + sideGap, metrics.titleY - 1, maxLineWidth, 2);
  }

  if (fixed) {
    for (const object of [backIcon, backText, backHit, title, decor]) {
      object.setScrollFactor(0);
    }
  }

  return { metrics, title, backHit };
}
