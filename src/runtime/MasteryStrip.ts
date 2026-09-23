import Phaser from 'phaser';

import type { UiCopy } from '../i18n/UiCopy';
import type { MasterySnapshot } from '../mastery/MasteryProgress';
import { createHomeHubModeCard } from './HomeHubModeCard';
import { createMasterySeal } from './MasterySeal';
import { UI_THEME, uiColorHex } from '../ui/UiTheme';
import { UI_ICON_KEYS } from './UiIcons';

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

  background.setInteractive({ useHandCursor: true });

  const left = options.x - options.width / 2;
  const right = options.x + options.width / 2;
  const sealSize = Math.min(options.height * 1.26, 90);
  const sealX = left + Math.max(42, options.width * 0.1);
  const seal = createMasterySeal(scene, {
    x: sealX,
    y: options.y,
    size: sealSize,
    rank: options.snapshot.currentRank,
    showRankPlaque: false,
    textureVariant: 'small',
  });

  const arrowSize = Math.max(20, Math.min(26, options.height * 0.38));
  const arrowX = right - Math.max(28, options.width * 0.06);
  const arrowKey = UI_ICON_KEYS.masteryForward || UI_ICON_KEYS.back;
  const arrow = scene.add.image(arrowX, options.y, arrowKey)
    .setDisplaySize(arrowSize, arrowSize)
    .setAlpha(0.96);

  const rankTitle = options.copy.rankTitles[options.snapshot.currentRank];
  const title = `${options.copy.homeTitle(options.snapshot.currentRank)} — ${rankTitle}`;
  const subtitle = options.snapshot.nextRank === null
    ? (options.masterRatingLabel ?? options.copy.maxRank)
    : options.copy.homeNext(options.snapshot.nextRank, options.snapshot.remainingConditions);

  const titleX = left + Math.max(106, options.width * 0.235);
  const textRight = arrowX - arrowSize / 2 - 18;
  const textWidth = Math.max(80, textRight - titleX);
  const titleText = scene.add.text(titleX, options.y - options.height * 0.115, title, {
    fontFamily: 'monospace',
    fontSize: `${Math.round(Math.max(13, options.height * 0.2))}px`,
    color: uiColorHex(UI_THEME.colors.text.primary),
    fontStyle: 'bold',
  }).setOrigin(0, 0.5);
  fitTextWidth(titleText, textWidth, 11);

  const subtitleText = scene.add.text(titleX, options.y + options.height * 0.17, subtitle, {
    fontFamily: 'monospace',
    fontSize: `${Math.round(Math.max(10, options.height * 0.14))}px`,
    color: uiColorHex(UI_THEME.colors.text.secondary),
  }).setOrigin(0, 0.5);
  fitTextWidth(subtitleText, textWidth, 10);

  return {
    destroy: () => {
      subtitleText.destroy();
      titleText.destroy();
      arrow.destroy();
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
