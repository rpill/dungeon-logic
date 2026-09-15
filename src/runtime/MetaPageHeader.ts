import Phaser from 'phaser';

import type { AvailableViewport } from './AvailableViewport';
import { calculateAvailableViewport } from './AvailableViewport';
import { createHeaderActionButton, getHeaderActionButtonMetrics, getHeaderActionPlacement } from './HeaderActionButton';
import { calculateMetaPageHeaderMetrics, type MetaPageHeaderMetrics } from './MetaPageHeaderLayout';

export interface MetaPageHeaderOptions {
  readonly title: string;
  readonly backLabel: string;
  readonly onBack: (pointer: Phaser.Input.Pointer) => void;
  readonly fixed?: boolean;
  readonly backButton?: boolean;
  readonly fixedBack?: boolean;
  readonly metrics?: MetaPageHeaderMetrics;
  readonly viewport?: AvailableViewport;
}

export interface MetaPageHeaderHandle {
  readonly metrics: MetaPageHeaderMetrics;
  readonly title: Phaser.GameObjects.Text;
  readonly backHit: Phaser.GameObjects.Zone;
}

function fitTitleBetweenBackAndRightEdge(
  title: Phaser.GameObjects.Text,
  metrics: MetaPageHeaderMetrics,
  viewport: AvailableViewport,
  backRight: number,
  backY: number,
): void {
  if (Math.abs(metrics.titleY - backY) >= 28) return;
  const symmetricInset = Math.max(backRight - viewport.x + 12, 18);
  const availableWidth = Math.max(92, viewport.width - symmetricInset * 2);
  if (title.width <= availableWidth) return;
  title.setFontSize(Math.max(18, Math.floor(metrics.titleFontSize * availableWidth / title.width)));
}

export function createMetaPageHeader(
  scene: Phaser.Scene,
  options: MetaPageHeaderOptions,
): MetaPageHeaderHandle {
  const viewport = options.viewport ?? calculateAvailableViewport(scene.scale.width, scene.scale.height);
  const baseMetrics = options.metrics ?? calculateMetaPageHeaderMetrics(viewport.width, viewport.height);
  const metrics: MetaPageHeaderMetrics = {
    ...baseMetrics,
    backY: viewport.y + baseMetrics.backY,
    titleY: viewport.y + baseMetrics.titleY,
    headerHeight: viewport.y + baseMetrics.headerHeight,
  };
  const fixed = options.fixed ?? false;
  const backButton = options.backButton ?? false;
  const fixedBack = options.fixedBack ?? fixed;
  const actionMetrics = getHeaderActionButtonMetrics(metrics.narrow);
  const backGap = actionMetrics.gap;
  const titleDepthBase = fixed ? 1001 : 1;
  const backDepthBase = fixedBack ? 1101 : titleDepthBase;
  const buttonWidth = actionMetrics.pillWidth;
  const buttonHeight = actionMetrics.height;
  const buttonRadius = actionMetrics.radius;
  const buttonPlacement = getHeaderActionPlacement(viewport, 'left', buttonWidth, buttonHeight);
  const buttonX = buttonPlacement.x;

  let backHit: Phaser.GameObjects.Zone;
  let backRight: number;
  if (backButton) {
    const action = createHeaderActionButton(scene, {
      x: buttonX,
      y: buttonPlacement.y,
      width: buttonWidth,
      height: buttonHeight,
      radius: buttonRadius,
      iconKey: 'ui-icon-back',
      iconSize: actionMetrics.iconSize,
      label: options.backLabel,
      fontSize: actionMetrics.fontSize,
      gap: backGap,
      fixed: fixedBack,
      depth: backDepthBase + 1,
      onActivate: options.onBack,
    });
    backHit = action.hit;
    backRight = buttonX + buttonWidth / 2;
  } else {
    const plainLeft = buttonPlacement.x - buttonWidth / 2;
    const backIcon = scene.add.image(plainLeft + actionMetrics.iconSize / 2, buttonPlacement.y, 'ui-icon-back')
      .setDisplaySize(actionMetrics.iconSize, actionMetrics.iconSize)
      .setTint(0xf4ead7)
      .setDepth(backDepthBase + 2);
    const backText = scene.add.text(
      plainLeft + actionMetrics.iconSize + backGap,
      buttonPlacement.y,
      options.backLabel.replace(/^←\s*/, ''),
      {
        fontFamily: 'monospace',
        fontSize: `${actionMetrics.fontSize}px`,
        color: '#f4ead7',
        fontStyle: 'bold',
      },
    ).setOrigin(0, 0.5).setDepth(backDepthBase + 2);
    const backWidth = actionMetrics.iconSize + backGap + backText.width;
    backHit = scene.add.zone(
      plainLeft + backWidth / 2,
      buttonPlacement.y,
      backWidth,
      actionMetrics.height,
    ).setDepth(backDepthBase + 3).setInteractive({ useHandCursor: true });
    backHit.on('pointerup', options.onBack);
    backRight = plainLeft + backWidth;
    if (fixedBack) {
      backIcon.setScrollFactor(0);
      backText.setScrollFactor(0);
      backHit.setScrollFactor(0);
    }
  }


  const title = scene.add.text(viewport.centerX, metrics.titleY, options.title, {
    fontFamily: 'monospace',
    fontSize: `${metrics.titleFontSize}px`,
    color: '#f4ead7',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(titleDepthBase + 1);
  fitTitleBetweenBackAndRightEdge(title, metrics, viewport, backRight, buttonPlacement.y);

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
    leftDiamondX - viewport.x - sideGap - 8,
    viewport.right - rightDiamondX - sideGap - 8,
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
