import Phaser from 'phaser';

import { CAMPAIGN_SERVICE_REGISTRY_KEY, CampaignService } from '../campaign/CampaignService';
import { createCampaignGameSceneData, createLevelSelectItems } from '../runtime/GameLaunch';
import { calculateLevelSelectLayout } from '../runtime/ResponsiveLayout';
import type { CampaignLevelEntry } from '../content/campaign/types';

const STATE_LABEL = {
  completed: 'Completed',
  current: 'Current',
  unlocked: 'Unlocked',
  locked: 'Locked',
} as const;

const STATE_COLOR = {
  completed: '#8fbf8f',
  current: '#f0d28a',
  unlocked: '#d8d1c4',
  locked: '#62666d',
} as const;

export class LevelSelectScene extends Phaser.Scene {
  private launchPending = false;

  constructor() {
    super('LevelSelectScene');
  }

  create(): void {
    this.launchPending = false;

    const service = this.getCampaignService();
    const progress = service.getProgress();
    const items = createLevelSelectItems(service.getLevels(), progress);
    const layout = calculateLevelSelectLayout(
      this.scale.width,
      this.scale.height,
      items.length,
    );

    this.add.text(this.scale.width / 2, layout.titleY, 'Dungeon Logic', {
      fontFamily: 'monospace',
      fontSize: `${layout.titleFontSize}px`,
      color: '#f0e6d2',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const continueLevel = service.getContinueLevel();
    if (continueLevel !== null) {
      this.createActionButton(
        this.scale.width / 2,
        layout.continueY,
        layout.continueWidth,
        layout.continueHeight,
        layout.continueFontSize,
        `Continue · Level ${continueLevel.slot}`,
        '#f0d28a',
        () => { void this.launchLevel(service, continueLevel); },
      );
    }

    items.forEach((item, index) => {
      const cardLayout = layout.cards[index];
      const color = STATE_COLOR[item.state];
      const card = this.add
        .rectangle(
          cardLayout.x,
          cardLayout.y,
          cardLayout.width,
          cardLayout.height,
          0x20242b,
          0.96,
        )
        .setStrokeStyle(
          item.state === 'current' ? 3 : 2,
          Phaser.Display.Color.HexStringToColor(color).color,
        );

      this.add.text(
        cardLayout.x,
        cardLayout.y - cardLayout.height * 0.22,
        `Level ${item.entry.slot}`,
        {
          fontFamily: 'monospace',
          fontSize: `${layout.cardTitleFontSize}px`,
          color,
          fontStyle: 'bold',
        },
      ).setOrigin(0.5);

      this.add.text(
        cardLayout.x,
        cardLayout.y + cardLayout.height * 0.22,
        STATE_LABEL[item.state],
        {
          fontFamily: 'monospace',
          fontSize: `${layout.cardStateFontSize}px`,
          color,
        },
      ).setOrigin(0.5);

      if (item.playable) {
        card.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          void this.launchLevel(service, item.entry);
        });
      }
    });

    const handleResize = (): void => {
      if (this.scene.isActive()) {
        this.scene.restart();
      }
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
    });
  }

  private createActionButton(
    x: number,
    y: number,
    width: number,
    height: number,
    fontSize: number,
    label: string,
    color: string,
    onActivate: () => void,
  ): void {
    const button = this.add.rectangle(x, y, width, height, 0x2a3038, 1)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color)
      .setInteractive({ useHandCursor: true });

    this.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: `${fontSize}px`,
      color,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    button.on('pointerdown', onActivate);
  }

  private getCampaignService(): CampaignService {
    const service = this.registry.get(CAMPAIGN_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof CampaignService)) {
      throw new Error('LevelSelectScene requires CampaignService in Phaser registry.');
    }
    return service;
  }

  private async launchLevel(service: CampaignService, entry: CampaignLevelEntry): Promise<void> {
    if (this.launchPending || !service.canPlayLevel(entry.id)) return;
    this.launchPending = true;

    try {
      const startedEntry = await service.startLevel(entry.id);
      const data = createCampaignGameSceneData(startedEntry, service.getProgress());
      this.scene.start('GameScene', data);
    } catch (error) {
      this.launchPending = false;
      console.error(`[Dungeon Logic] Could not start ${entry.id}.`, error);
    }
  }
}
