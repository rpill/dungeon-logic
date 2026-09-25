import Phaser from 'phaser';

import type { UiCopy } from '../i18n/UiCopy';
import type { MasterySnapshot } from '../mastery/MasteryProgress';
import { createHomeHubModeCard } from './HomeHubModeCard';
import { createMasterySeal } from './MasterySeal';

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
  const background = createHomeHubModeCard(scene, {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    variant: 'wide',
    visualStyle: 'soft-stone',
    onActivate: options.onActivate,
  });

  const narrow = scene.scale.width < 700;
  const cardWidth = background.displayWidth;
  const cardHeight = background.displayHeight;
  const iconX = options.x - cardWidth * (narrow ? 0.31 : 0.32);
  const contentLeft = options.x - cardWidth * (narrow ? 0.16 : 0.18);
  const contentWidth = cardWidth * (narrow ? 0.62 : 0.64);
  const sealSize = Math.min(cardHeight * (narrow ? 1.47 : 1.26), narrow ? 108 : 129);

  const seal = createMasterySeal(scene, {
    x: iconX,
    y: options.y,
    size: sealSize,
    rank: options.snapshot.currentRank,
    showRankPlaque: false,
    textureVariant: 'small',
  });

  const rankTitle = options.copy.rankTitles[options.snapshot.currentRank];
  const title = `${options.copy.homeTitle(options.snapshot.currentRank)} — ${rankTitle}`;
  const subtitle = options.snapshot.nextRank === null
    ? (options.masterRatingLabel ?? options.copy.maxRank)
    : options.copy.homeNext(options.snapshot.nextRank, options.snapshot.remainingConditions);

  const titleText = scene.add.text(contentLeft, options.y - (narrow ? 8 : 10), title, {
    fontFamily: "'Balsamiq Sans', sans-serif",
    fontSize: `${narrow ? 18 : 22}px`,
    color: '#fff1d2',
    fontStyle: 'bold',
    stroke: '#26345f',
    strokeThickness: narrow ? 2 : 3,
    shadow: {
      offsetX: 0,
      offsetY: narrow ? 1 : 2,
      color: '#0b1024',
      blur: 2,
      fill: true,
    },
  }).setOrigin(0, 0.5).setLetterSpacing(narrow ? 1 : 1.5);
  fitTextWidth(titleText, contentWidth, narrow ? 12 : 13);

  const subtitleText = scene.add.text(contentLeft, options.y + (narrow ? 15 : 20), subtitle, {
    fontFamily: "'Balsamiq Sans', sans-serif",
    fontSize: `${narrow ? 12 : 14}px`,
    color: '#c6d2e6',
  }).setOrigin(0, 0.5);
  fitTextWidth(subtitleText, contentWidth, 9);

  return {
    destroy: () => {
      subtitleText.destroy();
      titleText.destroy();
      seal.destroy();
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
