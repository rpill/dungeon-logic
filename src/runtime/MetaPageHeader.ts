import Phaser from 'phaser';

import { createHeaderActionButton, getHeaderActionButtonMetrics } from './HeaderActionButton';
import { calculateMetaPageHeaderMetrics, type MetaPageHeaderMetrics } from './MetaPageHeaderLayout';

export interface MetaPageHeaderOptions {
  readonly title: string;
  readonly backLabel: string;
  readonly onBack: (pointer: Phaser.Input.Pointer) => void;
  readonly fixed?: boolean;
  readonly backButton?: boolean;
  readonly fixedBack?: boolean;
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
  const backButton = options.backButton ?? false;
  const fixedBack = options.fixedBack ?? fixed;
  const backInset = metrics.narrow ? 16 : 28;
  const actionMetrics = getHeaderActionButtonMetrics(metrics.narrow);
  const backGap = actionMetrics.gap;
  const titleDepthBase = fixed ? 1001 : 1;
  const backDepthBase = fixedBack ? 1101 : titleDepthBase;
  const buttonWidth = actionMetrics.pillWidth;
  const buttonHeight = metrics.density === 'ultra' ? 38 : actionMetrics.height;
  const buttonRadius = actionMetrics.radius;
  const buttonX = backInset + buttonWidth / 2;

  let backHit: Phaser.GameObjects.Zone;
  let backRight: number;
  if (backButton) {
    const action = createHeaderActionButton(scene, {
      x: buttonX,
      y: metrics.backY,
      width: buttonWidth,
      height: buttonHeight,
      radius: buttonRadius,
      iconKey: 'ui-icon-back',
      iconSize: metrics.backIconSize,
      label: options.backLabel,
      fontSize: metrics.backFontSize,
      gap: backGap,
      fixed: fixedBack,
      depth: backDepthBase + 1,
      onActivate: options.onBack,
    });
    backHit = action.hit;
    backRight = backInset + buttonWidth;
  } else {
    const backIcon = scene.add.image(backInset + metrics.backIconSize / 2, metrics.backY, 'ui-icon-back')
      .setDisplaySize(metrics.backIconSize, metrics.backIconSize)
      .setTint(0xf4ead7)
      .setDepth(backDepthBase + 2);
    const backText = scene.add.text(
      backInset + metrics.backIconSize + backGap,
      metrics.backY,
      options.backLabel.replace(/^←\s*/, ''),
      {
        fontFamily: 'monospace',
        fontSize: `${metrics.backFontSize}px`,
        color: '#f4ead7',
        fontStyle: 'bold',
      },
    ).setOrigin(0, 0.5).setDepth(backDepthBase + 2);
    const backWidth = metrics.backIconSize + backGap + backText.width;
    backHit = scene.add.zone(
      backInset + backWidth / 2,
      metrics.backY,
      backWidth,
      Math.max(42, metrics.backIconSize + 10),
    ).setDepth(backDepthBase + 3).setInteractive({ useHandCursor: true });
    backHit.on('pointerup', options.onBack);
    backRight = backInset + backWidth;
    if (fixedBack) {
      backIcon.setScrollFactor(0);
      backText.setScrollFactor(0);
      backHit.setScrollFactor(0);
    }
  }


  const title = scene.add.text(scene.scale.width / 2, metrics.titleY, options.title, {
    fontFamily: 'monospace',
    fontSize: `${metrics.titleFontSize}px`,
    color: '#f4ead7',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(titleDepthBase + 1);
  fitTitleBetweenBackAndRightEdge(title, metrics, scene.scale.width, backRight);

  const decor = scene.add.graphics().setDepth(titleDepthBase);
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
    title.setScrollFactor(0);
    decor.setScrollFactor(0);
  }

  return { metrics, title, backHit };
}
