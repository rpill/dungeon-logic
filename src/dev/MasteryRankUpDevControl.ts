import Phaser from 'phaser';

import type { CampaignLevelEntry } from '../content/campaign/types';
import type { UiCopy } from '../i18n/UiCopy';
import { getMasterySnapshot } from '../mastery/MasteryProgress';
import type { PlayerProfileService } from '../profile/PlayerProfileService';
import { showMasteryRankUpOverlay } from '../runtime/MasteryRankUpOverlay';
import { advanceMasteryRankForDev } from './MasteryRankUpDevProfile';
import { resetPlayerProfileForDev } from './PlayerProfileDevReset';

export interface MasteryRankUpDevControlOptions {
  readonly profileService: PlayerProfileService;
  readonly campaignLevels: readonly CampaignLevelEntry[];
  readonly copy: UiCopy['mastery'];
}

export interface MasteryRankUpDevControlHandle {
  destroy(): void;
}

export function createMasteryRankUpDevControl(
  scene: Phaser.Scene,
  options: MasteryRankUpDevControlOptions,
): MasteryRankUpDevControlHandle {
  const rankWidth = 132;
  const resetWidth = 104;
  const gap = 8;
  const height = 30;
  const x = 12;
  const y = scene.scale.height - 12;
  const depth = 900;

  const rankSurface = scene.add.rectangle(x, y, rankWidth, height, 0x471b2a, 0.94)
    .setOrigin(0, 1)
    .setStrokeStyle(1, 0xffb85c, 0.95)
    .setDepth(depth);
  const rankLabel = scene.add.text(x + rankWidth / 2, y - height / 2, 'DEV RANK UP', {
    fontFamily: "'Balsamiq Sans', sans-serif",
    fontSize: '11px',
    color: '#ffe2a8',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(depth + 1);

  const resetX = x + rankWidth + gap;
  const resetSurface = scene.add.rectangle(resetX, y, resetWidth, height, 0x69323a, 0.94)
    .setOrigin(0, 1)
    .setStrokeStyle(1, 0xe88f99, 0.95)
    .setDepth(depth)
    .setInteractive({ useHandCursor: true });
  const resetLabel = scene.add.text(resetX + resetWidth / 2, y - height / 2, 'DEV RESET', {
    fontFamily: "'Balsamiq Sans', sans-serif",
    fontSize: '11px',
    color: '#ffd6d9',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(depth + 1);

  let actionPending = false;

  const refreshState = (): void => {
    const mastery = getMasterySnapshot(options.profileService.getProfile());
    const isMaster = mastery.currentRank === 'MASTER';
    rankLabel.setText(isMaster ? 'DEV MASTER' : 'DEV RANK UP');
    rankSurface.setFillStyle(isMaster ? 0x272d3a : 0x471b2a, isMaster ? 0.82 : 0.94);
    rankSurface.setStrokeStyle(1, isMaster ? 0x5f6878 : 0xffb85c, isMaster ? 0.65 : 0.95);
    if (isMaster || actionPending) {
      rankSurface.disableInteractive();
    } else {
      rankSurface.setInteractive({ useHandCursor: true });
    }
    if (actionPending) resetSurface.disableInteractive();
    else resetSurface.setInteractive({ useHandCursor: true });
  };

  rankSurface.on('pointerover', () => {
    if (!actionPending && getMasterySnapshot(options.profileService.getProfile()).currentRank !== 'MASTER') {
      rankSurface.setFillStyle(0x673044, 0.98);
    }
  });
  rankSurface.on('pointerout', () => refreshState());
  rankSurface.on('pointerup', () => {
    if (actionPending) return;

    const promotion = advanceMasteryRankForDev(
      options.profileService.getProfile(),
      options.campaignLevels,
    );
    if (promotion === null) {
      refreshState();
      return;
    }

    actionPending = true;
    options.profileService.update(() => promotion.profile);
    refreshState();
    void options.profileService.flush().catch((error) => {
      console.warn('[Dungeon Logic] DEV mastery promotion could not be persisted immediately.', error);
    });

    showMasteryRankUpOverlay(scene, {
      fromRank: promotion.fromRank,
      toRank: promotion.toRank,
      copy: options.copy,
      onContinue: () => {
        actionPending = false;
        if (scene.scene.isActive()) scene.scene.restart();
      },
    });
  });

  resetSurface.on('pointerover', () => {
    if (!actionPending) resetSurface.setFillStyle(0x87434d, 0.98);
  });
  resetSurface.on('pointerout', () => {
    resetSurface.setFillStyle(0x69323a, 0.94);
  });
  resetSurface.on('pointerup', () => {
    if (actionPending) return;
    actionPending = true;
    const resetProfile = resetPlayerProfileForDev(
      options.profileService.getProfile(),
      options.campaignLevels,
    );
    options.profileService.update(() => resetProfile);
    refreshState();
    void options.profileService.flush()
      .catch((error) => {
        console.warn('[Dungeon Logic] DEV profile reset could not be persisted immediately.', error);
      })
      .finally(() => {
        actionPending = false;
        if (scene.scene.isActive()) scene.scene.restart();
      });
  });

  refreshState();

  return {
    destroy: () => {
      resetLabel.destroy();
      resetSurface.destroy();
      rankLabel.destroy();
      rankSurface.destroy();
    },
  };
}
