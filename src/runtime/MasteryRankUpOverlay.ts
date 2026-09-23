import Phaser from 'phaser';

import { getAudioFeedback } from '../audio/AudioFeedbackService';
import type { UiCopy } from '../i18n/UiCopy';
import type { MasteryRankId } from '../mastery/MasteryProgress';
import { createMasteryEdgeGlow, createMasteryGlow, createMasterySeal } from './MasterySeal';
import { createModalPanel } from './ModalPanel';
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
  const panelWidth = Math.min(width - (narrow ? 34 : 110), narrow ? 360 : 520);
  const panelHeight = Math.min(height - (narrow ? 64 : 110), narrow ? 590 : 700);
  const centerX = width / 2;
  const centerY = height / 2;

  const veil = scene.add.rectangle(centerX, centerY, width, height, 0x050913, 0.84)
    .setDepth(depth)
    .setInteractive();
  const panel = createModalPanel(scene, {
    x: centerX,
    y: centerY,
    width: panelWidth,
    height: panelHeight,
    variant: 'rankup',
    alpha: 0.985,
  }).setDepth(depth + 1);

  const titleY = centerY - panelHeight * 0.315;
  const title = scene.add.text(
    centerX,
    titleY,
    options.masterRatingMilestone === undefined ? options.copy.newRank : options.copy.ratingMilestoneTitle,
    {
    fontFamily: "'Balsamiq Sans', sans-serif",
    fontSize: `${narrow ? 21 : 29}px`,
    color: '#fff7ea',
    stroke: '#425a8e',
    strokeThickness: narrow ? 4 : 5,
    fontStyle: 'bold',
    },
  ).setOrigin(0.5).setDepth(depth + 2);

  const sealSize = narrow ? Math.min(190, panelWidth * 0.55) : 275;
  const sealY = centerY - panelHeight * 0.025;
  const glow = createMasteryGlow(scene, {
    x: centerX,
    y: sealY - sealSize * 0.07,
    size: sealSize * (narrow ? 0.87 : 0.9),
    alpha: 0.78,
    depth: depth + 2,
    variant: 'rankup',
  });
  const edgeGlow = createMasteryEdgeGlow(scene, {
    x: centerX,
    y: sealY,
    size: sealSize,
    rank: options.toRank,
    depth: depth + 2,
    alpha: narrow ? 0.56 : 0.6,
  });
  const seal = createMasterySeal(scene, {
    x: centerX,
    y: sealY,
    size: sealSize,
    rank: options.toRank,
    depth: depth + 2,
  });

  const rankY = sealY + sealSize * 0.54;
  const rank = scene.add.text(
    centerX,
    rankY,
    options.masterRatingMilestone === undefined
      ? options.copy.rankLabel(options.toRank, options.copy.rankTitles[options.toRank])
      : options.masterRatingMilestone.rating,
    {
      fontFamily: "'Balsamiq Sans', sans-serif",
      fontSize: `${narrow ? 18 : 22}px`,
      color: '#fff1d2',
      fontStyle: 'bold',
      align: 'center',
    },
  ).setOrigin(0.5).setDepth(depth + 2);

  const description = scene.add.text(
    centerX,
    rankY + (narrow ? 32 : 40),
    options.masterRatingMilestone === undefined
      ? options.copy.rankDescriptions[options.toRank]
      : options.copy.ratingMilestoneReached(options.masterRatingMilestone.milestone),
    {
    fontFamily: "'Balsamiq Sans', sans-serif",
    fontSize: `${narrow ? 10 : 13}px`,
    color: '#c4d0e5',
    align: 'center',
    wordWrap: { width: panelWidth - (narrow ? 52 : 96) },
    },
  ).setOrigin(0.5).setDepth(depth + 2);

  const buttonWidth = Math.min(panelWidth - (narrow ? 62 : 130), narrow ? 238 : 268);
  const buttonHeight = narrow ? 50 : 56;
  const buttonY = centerY + panelHeight * 0.315;
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
