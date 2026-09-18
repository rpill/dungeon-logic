import Phaser from 'phaser';

import type { UiCopy } from '../i18n/UiCopy';
import type { MasterySnapshot } from '../mastery/MasteryProgress';
import { createHeaderActionButton } from './HeaderActionButton';
import { createHomeHubModeCard } from './HomeHubModeCard';
import { createMasterySeal } from './MasterySeal';
import { UI_ICON_KEYS } from './UiIcons';

export interface MasteryStripOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly snapshot: MasterySnapshot;
  readonly copy: UiCopy['mastery'];
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
    onActivate: options.onActivate,
  });

  const left = options.x - options.width / 2;
  const right = options.x + options.width / 2;
  const sealSize = Math.min(options.height * 0.7, 54);
  const sealX = left + Math.max(30, options.width * 0.078);
  const seal = createMasterySeal(scene, {
    x: sealX,
    y: options.y,
    size: sealSize,
    rank: options.snapshot.currentRank,
    showRankPlaque: false,
  });

  const arrowButtonSize = Math.max(28, Math.min(38, options.height * 0.58));
  const arrowX = right - Math.max(22, options.width * 0.052);
  const arrow = createHeaderActionButton(scene, {
    x: arrowX,
    y: options.y,
    width: arrowButtonSize,
    height: arrowButtonSize,
    radius: Math.max(8, arrowButtonSize * 0.24),
    iconKey: UI_ICON_KEYS.back,
    iconSize: arrowButtonSize * 0.48,
    onActivate: options.onActivate,
  });
  arrow.icon.setRotation(Math.PI);

  const rankTitle = options.copy.rankTitles[options.snapshot.currentRank];
  const title = `${options.copy.homeTitle(options.snapshot.currentRank)} — ${rankTitle}`;
  const subtitle = options.snapshot.nextRank === null
    ? options.copy.maxRank
    : options.copy.homeNext(options.snapshot.nextRank, options.snapshot.remainingConditions);

  const titleX = left + Math.max(58, options.width * 0.145);
  const textRight = arrowX - arrowButtonSize / 2 - 12;
  const textWidth = Math.max(80, textRight - titleX);
  const titleText = scene.add.text(titleX, options.y - options.height * 0.115, title, {
    fontFamily: 'monospace',
    fontSize: `${Math.round(Math.max(13, options.height * 0.2))}px`,
    color: '#fff0cf',
    fontStyle: 'bold',
  }).setOrigin(0, 0.5);
  fitTextWidth(titleText, textWidth, 11);

  const subtitleText = scene.add.text(titleX, options.y + options.height * 0.17, subtitle, {
    fontFamily: 'monospace',
    fontSize: `${Math.round(Math.max(9, options.height * 0.14))}px`,
    color: '#c6d2e6',
  }).setOrigin(0, 0.5);
  fitTextWidth(subtitleText, textWidth, 9);

  return {
    destroy: () => {
      subtitleText.destroy();
      titleText.destroy();
      arrow.hit.destroy();
      arrow.label?.destroy();
      arrow.icon.destroy();
      arrow.background.destroy();
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
