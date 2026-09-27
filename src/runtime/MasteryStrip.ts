import Phaser from 'phaser';
import { getAudioFeedback } from '../audio/AudioFeedbackService';

import type { UiCopy } from '../i18n/UiCopy';
import type { MasterySnapshot } from '../mastery/MasteryProgress';
import { createMasterySeal } from './MasterySeal';
import { createSlateSurface } from './SlateSurface';
import { UI_ICON_KEYS } from './UiIcons';
import { isTouchLikePointer } from './PointerInput';

export interface MasteryStripOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly snapshot: MasterySnapshot;
  readonly copy: UiCopy['mastery'];
  readonly masterRatingLabel?: string;
  readonly onActivate: (pointer: Phaser.Input.Pointer) => void;
}

export interface MasteryStripHandle {
  destroy(): void;
}

export function createMasteryStrip(scene: Phaser.Scene, options: MasteryStripOptions): MasteryStripHandle {
  const background = createSlateSurface(scene, options.x, options.y, options.width, options.height);
  const narrow = scene.scale.width < 700;
  const left = options.x - options.width / 2;
  const sealSize = Math.min(options.height * 0.76, narrow ? 74 : 126);
  const iconX = left + sealSize / 2 + (narrow ? 12 : 18);
  const contentLeft = left + sealSize + (narrow ? 22 : 38);
  const contentWidth = options.width - (contentLeft - left) - (narrow ? 38 : 46);

  const seal = createMasterySeal(scene, {
    x: iconX,
    y: options.y,
    size: sealSize,
    rank: options.snapshot.currentRank,
    showRankPlaque: false,
    textureVariant: 'small',
  });

  const rankTitle = options.copy.rankTitles[options.snapshot.currentRank];
  const title = narrow ? options.copy.homeTitle(options.snapshot.currentRank)
    : `${options.copy.homeTitle(options.snapshot.currentRank)} — ${rankTitle}`;
  const subtitle = options.snapshot.nextRank === null
    ? (options.masterRatingLabel ?? options.copy.maxRank)
    : options.copy.homeNext(options.snapshot.nextRank, options.snapshot.remainingConditions);

  const titleText = scene.add.text(contentLeft, options.y - (narrow ? 15 : 24), title, {
    fontFamily: "'Balsamiq Sans', sans-serif",
    fontSize: `${narrow ? 18 : 22}px`,
    color: '#fff1d2',
    fontStyle: 'bold',
    stroke: '#17243a',
    strokeThickness: narrow ? 1 : 2,
  }).setOrigin(0, 0.5);
  fitTextWidth(titleText, contentWidth, narrow ? 12 : 13);

  const subtitleText = scene.add.text(contentLeft, options.y + (narrow ? 9 : 6), subtitle, {
    fontFamily: "'Balsamiq Sans', sans-serif",
    fontSize: `${narrow ? 12 : 14}px`,
    color: '#c6d2e6',
  }).setOrigin(0, 0.5);
  fitTextWidth(subtitleText, contentWidth, 9);
  const progress = options.snapshot.nextRank === null
    ? 1
    : options.snapshot.conditions.length === 0 ? 0 : options.snapshot.conditions.reduce(
        (total, condition) => total + Math.min(1, condition.current / condition.target),
        0,
      ) / options.snapshot.conditions.length;
  const bar = scene.add.graphics();
  const barWidth = Math.max(40, contentWidth - (narrow ? 2 : 20));
  const barHeight = narrow ? 5 : 8;
  const barY = options.y + (narrow ? 30 : 44);
  bar.fillStyle(0x101c30, 0.95);
  bar.fillRoundedRect(contentLeft, barY, barWidth, barHeight, barHeight / 2);
  if (progress > 0) {
    bar.fillStyle(0xd4a64f, 1);
    bar.fillRoundedRect(contentLeft, barY, Math.max(barHeight, barWidth * progress), barHeight, barHeight / 2);
  }
  const arrow = scene.add.image(options.x + options.width / 2 - (narrow ? 19 : 24), options.y,
    UI_ICON_KEYS.masteryForward).setDisplaySize(narrow ? 18 : 22, narrow ? 18 : 22).setTint(0xc6d2e6);

  background.setInteractive({ useHandCursor: true });
  background.on('pointerover', () => background.setTint(0xe4e8ef));
  background.on('pointerout', () => background.clearTint());
  background.on('pointerdown', () => background.setTint(0xc5cedc));
  background.on('pointerupoutside', () => background.clearTint());
  background.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    background.setTint(isTouchLikePointer(pointer) ? 0xffffff : 0xe4e8ef);
    getAudioFeedback(scene).play('ui-click');
    options.onActivate(pointer);
  });

  return {
    destroy: () => {
      subtitleText.destroy();
      titleText.destroy();
      bar.destroy();
      seal.destroy();
      arrow.destroy();
      background.destroy();
    },
  };
}

function fitTextWidth(text: Phaser.GameObjects.Text, maxWidth: number, minFontSize: number): void {
  let fontSize = Number.parseFloat(String(text.style.fontSize));
  while (text.width > maxWidth && fontSize > minFontSize) {
    fontSize -= 1;
    text.setFontSize(fontSize);
  }
}
