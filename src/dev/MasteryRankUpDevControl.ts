import Phaser from 'phaser';

import type { UiCopy } from '../i18n/UiCopy';
import {
  MASTERY_RANK_IDS,
  getMasteryRankIndex,
  type MasteryRankId,
} from '../mastery/MasteryProgress';
import { showMasteryRankUpOverlay } from '../runtime/MasteryRankUpOverlay';

export interface MasteryRankUpDevControlOptions {
  readonly currentRank: MasteryRankId;
  readonly copy: UiCopy['mastery'];
}

export interface MasteryRankUpDevControlHandle {
  destroy(): void;
}

export function createMasteryRankUpDevControl(
  scene: Phaser.Scene,
  options: MasteryRankUpDevControlOptions,
): MasteryRankUpDevControlHandle {
  const width = 132;
  const height = 30;
  const x = 12;
  const y = scene.scale.height - 12;
  const depth = 900;

  const surface = scene.add.rectangle(x, y, width, height, 0x471b2a, 0.94)
    .setOrigin(0, 1)
    .setStrokeStyle(1, 0xffb85c, 0.95)
    .setDepth(depth)
    .setInteractive({ useHandCursor: true });

  const label = scene.add.text(x + width / 2, y - height / 2, 'DEV RANK UP', {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#ffe2a8',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(depth + 1);

  let demoIndex = Math.max(0, getMasteryRankIndex(options.currentRank));
  if (demoIndex >= MASTERY_RANK_IDS.length - 1) demoIndex = MASTERY_RANK_IDS.length - 2;

  surface.on('pointerover', () => surface.setFillStyle(0x673044, 0.98));
  surface.on('pointerout', () => surface.setFillStyle(0x471b2a, 0.94));
  surface.on('pointerup', () => {
    const fromIndex = Math.min(demoIndex, MASTERY_RANK_IDS.length - 2);
    const toIndex = fromIndex + 1;
    const fromRank = MASTERY_RANK_IDS[fromIndex]!;
    const toRank = MASTERY_RANK_IDS[toIndex]!;

    showMasteryRankUpOverlay(scene, {
      fromRank,
      toRank,
      copy: options.copy,
      onContinue: () => undefined,
    });

    demoIndex = toIndex >= MASTERY_RANK_IDS.length - 1 ? 0 : toIndex;
  });

  return {
    destroy: () => {
      label.destroy();
      surface.destroy();
    },
  };
}
