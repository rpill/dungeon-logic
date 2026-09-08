import Phaser from 'phaser';

import { CAMPAIGN_SERVICE_REGISTRY_KEY, CampaignService } from '../campaign/CampaignService';
import { getManuscriptForSlot } from '../content/campaign/manuscripts';
import type { CampaignLevelEntry } from '../content/campaign/types';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import { createCampaignGameSceneData } from '../runtime/GameLaunch';
import { HELP_SCENE_KEY } from '../help/HelpNavigation';
import { MetaPointerGate } from '../runtime/MetaPointerGate';
import {
  ARCHIVE_SCENE_KEY,
  getHomeCampaignAction,
} from '../runtime/MetaSelectors';
import { classifyViewport } from './GameBoardLayout';

export class HomeScene extends Phaser.Scene {
  private launchPending = false;
  private readonly pointerGate = new MetaPointerGate();

  constructor() {
    super('HomeScene');
  }

  create(): void {
    this.launchPending = false;
    this.pointerGate.reset();
    const handlePointerDown = (pointer: Phaser.Input.Pointer): void => {
      this.pointerGate.notePointerDown(pointer.id);
    };
    this.input.on('pointerdown', handlePointerDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', handlePointerDown);
    });
    const campaign = this.getCampaignService();
    const profileService = this.getProfileService();
    const profile = profileService.getProfile();
    const action = getHomeCampaignAction(campaign, profile);
    const viewportClass = classifyViewport(this.scale.width);
    const narrow = viewportClass === 'narrow';

    const titleY = narrow ? 84 : 108;
    const titleSize = narrow ? 34 : 48;
    this.add.text(this.scale.width / 2, titleY, 'DUNGEON LOGIC', {
      fontFamily: 'monospace',
      fontSize: `${titleSize}px`,
      color: '#f0e6d2',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const completed = profile.campaign.completedLevelIds.length;
    this.add.text(
      this.scale.width / 2,
      titleY + (narrow ? 45 : 58),
      `Архив · ${completed} / 30`,
      {
        fontFamily: 'monospace',
        fontSize: narrow ? '14px' : '17px',
        color: '#89929d',
      },
    ).setOrigin(0.5);

    const buttonWidth = Math.min(narrow ? this.scale.width - 32 : 360, 420);
    const mainY = narrow ? 215 : 250;
    const mainHeight = narrow ? 58 : 62;

    if (action.kind === 'choose-level') {
      this.createButton(
        this.scale.width / 2,
        mainY,
        buttonWidth,
        mainHeight,
        'ВЫБРАТЬ УРОВЕНЬ',
        '#f0d28a',
        () => this.scene.start(ARCHIVE_SCENE_KEY),
      );
    } else {
      const entry = campaign.getLevels().find((candidate) => candidate.id === action.levelId);
      const label = action.kind === 'start' ? 'НАЧАТЬ' : 'ПРОДОЛЖИТЬ';
      this.createButton(
        this.scale.width / 2,
        mainY,
        buttonWidth,
        mainHeight,
        label,
        '#f0d28a',
        () => {
          if (entry !== undefined) void this.launchLevel(campaign, entry);
        },
      );

      if (entry !== undefined) {
        const manuscript = getManuscriptForSlot(entry.slot);
        const context = manuscript === null
          ? `Уровень ${String(entry.slot).padStart(2, '0')}`
          : `Рукопись ${manuscript.roman} · Уровень ${String(entry.slot).padStart(2, '0')}`;
        this.add.text(this.scale.width / 2, mainY + mainHeight / 2 + 23, context, {
          fontFamily: 'monospace',
          fontSize: narrow ? '13px' : '15px',
          color: '#89929d',
        }).setOrigin(0.5);
      }
    }

    this.createButton(
      this.scale.width / 2,
      mainY + (narrow ? 105 : 118),
      buttonWidth,
      narrow ? 52 : 56,
      'АРХИВ',
      '#d8d1c4',
      () => this.scene.start(ARCHIVE_SCENE_KEY),
    );

    const helpLink = this.add.text(this.scale.width - 16, 18, 'ⓘ КАК ИГРАТЬ', {
      fontFamily: 'monospace',
      fontSize: narrow ? '12px' : '14px',
      color: '#89929d',
      fontStyle: 'bold',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    helpLink.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.pointerGate.canActivate(pointer.id)) return;
      this.scene.launch(HELP_SCENE_KEY, { returnSceneKey: 'HomeScene' });
      this.scene.pause();
    });

    const handleResize = (): void => {
      if (this.scene.isActive()) this.scene.restart();
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
    });
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: string,
    onActivate: () => void,
  ): void {
    const rectangle = this.add.rectangle(x, y, width, height, 0x2a3038, 1)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: this.scale.width < 700 ? '17px' : '19px',
      color,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    rectangle.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.pointerGate.canActivate(pointer.id)) return;
      onActivate();
    });
  }

  private getCampaignService(): CampaignService {
    const service = this.registry.get(CAMPAIGN_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof CampaignService)) {
      throw new Error('HomeScene requires CampaignService in Phaser registry.');
    }
    return service;
  }

  private getProfileService(): PlayerProfileService {
    const service = this.registry.get(PLAYER_PROFILE_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof PlayerProfileService)) {
      throw new Error('HomeScene requires PlayerProfileService in Phaser registry.');
    }
    return service;
  }

  private async launchLevel(
    service: CampaignService,
    entry: CampaignLevelEntry,
  ): Promise<void> {
    if (this.launchPending || !service.canPlayLevel(entry.id)) return;
    this.launchPending = true;

    try {
      const started = await service.startLevel(entry.id);
      this.scene.start('GameScene', createCampaignGameSceneData(started, service.getProgress()));
    } catch (error) {
      this.launchPending = false;
      console.error(`[Dungeon Logic] Could not start ${entry.id} from Home.`, error);
    }
  }
}
