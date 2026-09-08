import Phaser from 'phaser';

import { CAMPAIGN_SERVICE_REGISTRY_KEY, CampaignService } from '../campaign/CampaignService';
import { getManuscriptForSlot } from '../content/campaign/manuscripts';
import type { CampaignLevelEntry } from '../content/campaign/types';
import type { DailyEntry } from '../content/daily/types';
import { DAILY_SERVICE_REGISTRY_KEY, DailyService } from '../daily/DailyService';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import {
  createCampaignGameSceneData,
  createDailyGameSceneData,
} from '../runtime/GameLaunch';
import { HELP_SCENE_KEY } from '../help/HelpNavigation';
import { getUiCopy } from '../i18n/UiCopy';
import { MetaPointerGate } from '../runtime/MetaPointerGate';
import { PLATFORM_SERVICES_REGISTRY_KEY } from '../platform/PlatformRegistry';
import type { PlatformServices } from '../platform/services';
import {
  ARCHIVE_SCENE_KEY,
  SETTINGS_SCENE_KEY,
  STATS_SCENE_KEY,
  getHomeCampaignAction,
  getHomeDailyAction,
  shouldShowDailyEntry,
  shouldShowSettingsEntry,
} from '../runtime/MetaSelectors';
import { classifyViewport } from './GameBoardLayout';

export class HomeScene extends Phaser.Scene {
  private createVersion = 0;
  private launchPending = false;
  private readonly pointerGate = new MetaPointerGate();

  constructor() {
    super('HomeScene');
  }

  create(): void {
    const createVersion = this.createVersion + 1;
    this.createVersion = createVersion;
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
    const copy = getUiCopy(profile.settings.language);
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
      copy.home.archiveProgress(completed, 30),
      {
        fontFamily: 'monospace',
        fontSize: narrow ? '14px' : '17px',
        color: '#89929d',
      },
    ).setOrigin(0.5);

    const buttonWidth = Math.min(narrow ? this.scale.width - 32 : 360, 420);
    const mainY = narrow ? 215 : 250;
    const mainHeight = narrow ? 58 : 62;
    const dailyVisible = shouldShowDailyEntry(profile);
    const settingsVisible = shouldShowSettingsEntry(profile);
    const secondaryStep = dailyVisible || settingsVisible
      ? (narrow ? 88 : 96)
      : (narrow ? 105 : 118);

    if (action.kind === 'choose-level') {
      this.createButton(
        this.scale.width / 2,
        mainY,
        buttonWidth,
        mainHeight,
        copy.home.chooseLevel,
        '#f0d28a',
        () => this.scene.start(ARCHIVE_SCENE_KEY),
      );
    } else {
      const entry = campaign.getLevels().find((candidate) => candidate.id === action.levelId);
      const label = action.kind === 'start' ? copy.home.start : copy.home.continue;
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
          ? copy.home.levelContext(entry.slot)
          : copy.home.manuscriptLevelContext(manuscript.roman, entry.slot);
        this.add.text(this.scale.width / 2, mainY + mainHeight / 2 + 23, context, {
          fontFamily: 'monospace',
          fontSize: narrow ? '13px' : '15px',
          color: '#89929d',
        }).setOrigin(0.5);
      }
    }

    this.createButton(
      this.scale.width / 2,
      mainY + secondaryStep * (dailyVisible ? 2 : 1),
      buttonWidth,
      narrow ? 52 : 56,
      copy.common.archive,
      '#d8d1c4',
      () => this.scene.start(ARCHIVE_SCENE_KEY),
    );

    if (dailyVisible) {
      this.createButton(
        this.scale.width / 2,
        mainY + secondaryStep * 3,
        buttonWidth,
        narrow ? 52 : 56,
        copy.common.statistics,
        '#aeb4bc',
        () => this.scene.start(STATS_SCENE_KEY),
      );
      void this.renderDailyEntry(
        profileService,
        mainY + secondaryStep,
        buttonWidth,
        narrow ? 52 : 56,
        narrow,
        createVersion,
      );
    }

    if (settingsVisible) {
      this.createButton(
        this.scale.width / 2,
        mainY + secondaryStep * 4,
        buttonWidth,
        narrow ? 52 : 56,
        copy.common.settings,
        '#89929d',
        () => this.scene.start(SETTINGS_SCENE_KEY),
      );
    }

    const helpLink = this.add.text(this.scale.width - 16, 18, copy.common.howToPlay, {
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

    const platformServices = this.registry.get(PLATFORM_SERVICES_REGISTRY_KEY) as PlatformServices | null | undefined;
    void platformServices?.readiness.ready();
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: string,
    onActivate: () => void,
    enabled = true,
  ): void {
    const rectangle = this.add.rectangle(x, y, width, height, 0x2a3038, 1)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color);
    if (enabled) rectangle.setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: this.scale.width < 700 ? '17px' : '19px',
      color,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    if (enabled) {
      rectangle.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (!this.pointerGate.canActivate(pointer.id)) return;
        onActivate();
      });
    }
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

  private getDailyService(): DailyService {
    const service = this.registry.get(DAILY_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof DailyService)) {
      throw new Error('HomeScene requires DailyService in Phaser registry.');
    }
    return service;
  }

  private async renderDailyEntry(
    profileService: PlayerProfileService,
    y: number,
    width: number,
    height: number,
    narrow: boolean,
    createVersion: number,
  ): Promise<void> {
    let today = null;
    try {
      today = await this.getDailyService().getToday();
    } catch (error) {
      console.warn('[Dungeon Logic] Could not resolve today\'s Daily for Home.', error);
    }
    if (!this.scene.isActive() || createVersion !== this.createVersion) return;

    const profile = profileService.getProfile();
    const copy = getUiCopy(profile.settings.language);
    const action = getHomeDailyAction(profile, today);
    if (action.kind === 'hidden') return;

    if (action.kind === 'unavailable') {
      this.createButton(
        this.scale.width / 2,
        y,
        width,
        height,
        copy.home.dailyUnavailable,
        '#5f666f',
        () => {},
        false,
      );
      this.add.text(this.scale.width / 2, y + height / 2 + 20, copy.home.noDailyForTrustedDate, {
        fontFamily: 'monospace',
        fontSize: narrow ? '11px' : '13px',
        color: '#6f7780',
      }).setOrigin(0.5);
      return;
    }

    const solved = action.kind === 'solved';
    this.createButton(
      this.scale.width / 2,
      y,
      width,
      height,
      solved ? copy.home.dailySolved : copy.home.dailyNew,
      solved ? '#aeb4bc' : '#d0b978',
      () => this.launchDaily(action.entry),
    );

    const streakCopy = copy.home.streakSuffix(action.currentStreak);
    const detail = solved
      ? copy.home.best(this.formatTime(action.result.bestTimeMs), streakCopy)
      : copy.home.today(streakCopy);
    this.add.text(this.scale.width / 2, y + height / 2 + 20, detail, {
      fontFamily: 'monospace',
      fontSize: narrow ? '11px' : '13px',
      color: '#89929d',
    }).setOrigin(0.5);
  }

  private launchDaily(entry: DailyEntry): void {
    if (this.launchPending) return;
    this.launchPending = true;
    this.scene.start('GameScene', createDailyGameSceneData(entry));
  }

  private formatTime(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
