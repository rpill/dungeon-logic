import Phaser from 'phaser';

import { getAudioFeedback } from '../audio/AudioFeedbackService';
import type { UiCopy } from '../i18n/UiCopy';
import type { MasteryRankId } from '../mastery/MasteryProgress';
import { createMasterySeal } from './MasterySeal';
import { createPrimaryActionButton } from './PrimaryActionButton';

export interface MasteryRankUpOverlayOptions {
  readonly fromRank: MasteryRankId;
  readonly toRank: MasteryRankId;
  readonly copy: UiCopy['mastery'];
  readonly onContinue: () => void;
}

export interface MasteryRankUpOverlayHandle {
  destroy(): void;
}

export function showMasteryRankUpOverlay(
  scene: Phaser.Scene,
  options: MasteryRankUpOverlayOptions,
): MasteryRankUpOverlayHandle {
  const depth = 2000;
  const narrow = scene.scale.width < 700;
  const width = scene.scale.width;
  const height = scene.scale.height;
  const panelWidth = Math.min(width - (narrow ? 28 : 80), narrow ? 360 : 520);
  const panelHeight = Math.min(height - (narrow ? 52 : 100), narrow ? 500 : 590);
  const centerX = width / 2;
  const centerY = height / 2;

  const veil = scene.add.rectangle(centerX, centerY, width, height, 0x050913, 0.84)
    .setDepth(depth)
    .setInteractive();
  const panel = scene.add.graphics().setDepth(depth + 1);
  const radius = narrow ? 18 : 22;
  panel.fillStyle(0x101e35, 0.985);
  panel.fillRoundedRect(centerX - panelWidth / 2, centerY - panelHeight / 2, panelWidth, panelHeight, radius);
  panel.lineStyle(narrow ? 2 : 2.5, 0x6d85a7, 0.95);
  panel.strokeRoundedRect(centerX - panelWidth / 2, centerY - panelHeight / 2, panelWidth, panelHeight, radius);

  const titleY = centerY - panelHeight * 0.36;
  const title = scene.add.text(centerX, titleY, options.copy.newRank, {
    fontFamily: 'monospace',
    fontSize: `${narrow ? 24 : 34}px`,
    color: '#ffd978',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(depth + 2);

  const sealSize = narrow ? Math.min(150, panelWidth * 0.42) : 220;
  const sealY = centerY - panelHeight * 0.11;
  const seal = createMasterySeal(scene, {
    x: centerX,
    y: sealY,
    size: sealSize,
    rank: options.toRank,
    depth: depth + 2,
  });

  const rankY = sealY + sealSize * 0.56;
  const rank = scene.add.text(
    centerX,
    rankY,
    options.copy.rankLabel(options.toRank, options.copy.rankTitles[options.toRank]),
    {
      fontFamily: 'monospace',
      fontSize: `${narrow ? 19 : 26}px`,
      color: '#fff1d2',
      fontStyle: 'bold',
      align: 'center',
    },
  ).setOrigin(0.5).setDepth(depth + 2);

  const description = scene.add.text(centerX, rankY + (narrow ? 38 : 48), options.copy.rankDescriptions[options.toRank], {
    fontFamily: 'monospace',
    fontSize: `${narrow ? 11 : 14}px`,
    color: '#c4d0e5',
    align: 'center',
    wordWrap: { width: panelWidth - (narrow ? 44 : 80) },
  }).setOrigin(0.5).setDepth(depth + 2);

  const buttonWidth = Math.min(panelWidth - (narrow ? 42 : 90), narrow ? 280 : 320);
  const buttonHeight = narrow ? 54 : 62;
  const buttonY = centerY + panelHeight * 0.36;
  let destroyed = false;
  let button: ReturnType<typeof createPrimaryActionButton> | null = null;

  const destroy = (): void => {
    if (destroyed) return;
    destroyed = true;
    button?.destroy();
    description.destroy();
    rank.destroy();
    seal.destroy();
    title.destroy();
    panel.destroy();
    veil.destroy();
  };

  button = createPrimaryActionButton(scene, {
    x: centerX,
    y: buttonY,
    width: buttonWidth,
    height: buttonHeight,
    label: options.copy.continue,
    onActivate: () => {
      destroy();
      options.onContinue();
    },
  });
  button.surface.setDepth(depth + 3);
  button.label.setDepth(depth + 4);
  button.icon?.setDepth(depth + 4);
  button.subtitle?.setDepth(depth + 4);

  getAudioFeedback(scene).play('complete');

  return { destroy };
}
