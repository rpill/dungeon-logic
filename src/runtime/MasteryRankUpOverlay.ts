import Phaser from 'phaser';

import { getAudioFeedback } from '../audio/AudioFeedbackService';
import type { UiCopy } from '../i18n/UiCopy';
import type { MasteryRankId } from '../mastery/MasteryProgress';
import { createMasteryEdgeGlow, createMasteryGlow, createMasterySeal } from './MasterySeal';
import { createSlateSurface } from './SlateSurface';
import { createPrimaryActionButton } from './PrimaryActionButton';

export interface MasteryRankUpOverlayOptions {
  readonly fromRank: MasteryRankId;
  readonly toRank: MasteryRankId;
  readonly copy: UiCopy['mastery'];
  readonly masterRatingMilestone?: {
    readonly rating: string;
    readonly milestone: string;
  };
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
  const panelWidth = Math.min(width - (narrow ? 34 : 150), narrow ? 390 : 950);
  const panelHeight = Math.min(height - (narrow ? 100 : 120), narrow ? 620 : 520);
  const centerX = width / 2;
  const centerY = height / 2;

  const veil = scene.add.rectangle(centerX, centerY, width, height, 0x050913, 0.76)
    .setDepth(depth)
    .setInteractive();
  const panel = createSlateSurface(scene, centerX, centerY, panelWidth, panelHeight).setDepth(depth + 1);

  const titleY = centerY - panelHeight * (narrow ? 0.35 : 0.35);
  const title = scene.add.text(
    centerX,
    titleY,
    options.masterRatingMilestone === undefined ? options.copy.newRank : options.copy.ratingMilestoneTitle,
    {
    fontFamily: "'Balsamiq Sans', sans-serif",
    fontSize: `${narrow ? 25 : 34}px`,
    color: '#f4ead7',
    stroke: '#101b2d',
    strokeThickness: narrow ? 2 : 3,
    fontStyle: 'bold',
    },
  ).setOrigin(0.5).setDepth(depth + 2);

  const sealSize = narrow
    ? Math.min(214, panelWidth * 0.60, panelHeight * 0.35)
    : Math.min(292, panelWidth * 0.31, panelHeight * 0.59);
  const sealX = narrow ? centerX : centerX - panelWidth * 0.24;
  const sealY = narrow ? centerY - panelHeight * 0.07 : centerY + 7;
  const glow = createMasteryGlow(scene, {
    x: sealX,
    y: sealY - sealSize * 0.07,
    size: sealSize * (narrow ? 0.87 : 0.9),
    alpha: 0.34,
    depth: depth + 2,
    variant: 'rankup',
  });
  const edgeGlow = createMasteryEdgeGlow(scene, {
    x: sealX,
    y: sealY,
    size: sealSize,
    rank: options.toRank,
    depth: depth + 2,
    alpha: 0.32,
  });
  const seal = createMasterySeal(scene, {
    x: sealX,
    y: sealY,
    size: sealSize,
    rank: options.toRank,
    depth: depth + 2,
  });

  const textX = narrow ? centerX : centerX + panelWidth * 0.20;
  const rankY = narrow ? sealY + sealSize * 0.58 + 10 : centerY - 34;
  const rank = scene.add.text(
    textX,
    rankY,
    options.masterRatingMilestone === undefined
      ? options.copy.rankLabel(options.toRank, options.copy.rankTitles[options.toRank])
      : options.masterRatingMilestone.rating,
    {
      fontFamily: "'Balsamiq Sans', sans-serif",
      fontSize: `${narrow ? 21 : 25}px`,
      color: '#eabf70',
      fontStyle: 'bold',
      align: 'center',
    },
  ).setOrigin(0.5).setDepth(depth + 2);
  const rankMaxWidth = panelWidth * (narrow ? 0.86 : 0.48);
  if (rank.width > rankMaxWidth) rank.setScale(rankMaxWidth / rank.width);

  const description = scene.add.text(
    textX,
    rankY + (narrow ? 43 : 48),
    options.masterRatingMilestone === undefined
      ? options.copy.rankDescriptions[options.toRank]
      : options.copy.ratingMilestoneReached(options.masterRatingMilestone.milestone),
    {
    fontFamily: "'Balsamiq Sans', sans-serif",
    fontSize: `${narrow ? 15 : 17}px`,
    color: '#d4deeb',
    align: 'center',
    wordWrap: { width: panelWidth * (narrow ? 0.84 : 0.46) },
    },
  ).setOrigin(0.5).setDepth(depth + 2);

  const buttonWidth = Math.min(panelWidth - (narrow ? 58 : 120), narrow ? 300 : 350);
  const buttonHeight = narrow ? 60 : 70;
  const buttonY = centerY + panelHeight * (narrow ? 0.36 : 0.22);
  let destroyed = false;
  let button: ReturnType<typeof createPrimaryActionButton> | null = null;

  const destroy = (): void => {
    if (destroyed) return;
    destroyed = true;
    button?.destroy();
    description.destroy();
    rank.destroy();
    seal.destroy();
    edgeGlow.destroy();
    glow.destroy();
    title.destroy();
    panel.destroy();
    veil.destroy();
  };

  button = createPrimaryActionButton(scene, {
    x: textX,
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
