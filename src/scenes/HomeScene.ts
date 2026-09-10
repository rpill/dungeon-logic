import Phaser from 'phaser';

import { CAMPAIGN_SERVICE_REGISTRY_KEY, CampaignService } from '../campaign/CampaignService';
import type { CampaignLevelEntry } from '../content/campaign/types';
import type { TutorialLevelEntry } from '../content/tutorial/types';
import { DAILY_SERVICE_REGISTRY_KEY, DailyService } from '../daily/DailyService';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import {
  createCampaignGameSceneData,
  createTutorialGameSceneData,
} from '../runtime/GameLaunch';
import { HELP_SCENE_KEY } from '../help/HelpNavigation';
import { getUiCopy } from '../i18n/UiCopy';
import { DAILY_SCENE_KEY } from './DailyScene';
import { MetaPointerGate } from '../runtime/MetaPointerGate';
import { PLATFORM_SERVICES_REGISTRY_KEY } from '../platform/PlatformRegistry';
import type { PlatformServices } from '../platform/services';
import {
  LEVELS_SCENE_KEY,
  SETTINGS_SCENE_KEY,
  STATS_SCENE_KEY,
  getHomeCampaignAction,
  getHomeDailyAction,
  shouldShowDailyEntry,
  shouldShowSettingsEntry,
} from '../runtime/MetaSelectors';
import { classifyViewport } from './GameBoardLayout';
import { TUTORIAL_SERVICE_REGISTRY_KEY, TutorialService } from '../tutorial/TutorialService';
import { createSceneBackground } from '../runtime/SceneBackground';
import { createHomeMenuButton, type HomeMenuIcon } from '../runtime/HomeMenuButton';

const HOME_MENU_ICONS = {
  primary: { icon: 'play' as const },
  daily: { icon: 'daily' as const },
  levels: { icon: 'levels' as const },
  statistics: { icon: 'statistics' as const },
  settings: { icon: 'settings' as const },
};

export class HomeScene extends Phaser.Scene {
  private createVersion = 0;
  private launchPending = false;
  private readonly pointerGate = new MetaPointerGate();

  constructor() {
    super('HomeScene');
  }

  create(): void {
    createSceneBackground(this, 'meta');

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
    const tutorial = this.getTutorialService();
    const profileService = this.getProfileService();
    const profile = profileService.getProfile();
    const copy = getUiCopy(profile.settings.language);
    const action = getHomeCampaignAction(campaign, profile);
    const viewportClass = classifyViewport(this.scale.width);
    const narrow = viewportClass === 'narrow';

    const logoY = narrow ? 86 : 104;
    const logoWidth = Math.min(narrow ? this.scale.width - 48 : 560, 640);
    const logo = this.add.image(this.scale.width / 2, logoY, 'home-logo').setOrigin(0.5);
    const logoAspect = logo.width / logo.height;
    logo.setDisplaySize(logoWidth, logoWidth / logoAspect);

    const buttonWidth = Math.min(narrow ? this.scale.width - 32 : 360, 420);
    const mainY = narrow ? 215 : 250;
    const mainHeight = narrow ? 58 : 62;
    const dailyVisible = shouldShowDailyEntry(profile);
    const settingsVisible = shouldShowSettingsEntry(profile);
    const secondaryStep = dailyVisible || settingsVisible
      ? (narrow ? 88 : 96)
      : (narrow ? 105 : 118);

    if (action.kind === 'tutorial') {
      const entry = tutorial.getContinueLevel() ?? tutorial.getLevels()[0];
      const started = profile.tutorial.completedLevelIds.length > 0
        || profile.tutorial.activePuzzle !== null;
      this.createButton(
        this.scale.width / 2,
        mainY,
        buttonWidth,
        mainHeight,
        started ? copy.home.tutorialContinue : copy.home.tutorialStart,
        '#f0d28a',
        HOME_MENU_ICONS.primary.icon,
        () => {
          if (entry !== undefined) void this.launchTutorial(tutorial, entry);
        },
      );
      if (entry !== undefined) {
        this.add.text(
          this.scale.width / 2,
          mainY + mainHeight / 2 + 23,
          copy.game.tutorialTitle(entry.slot, tutorial.getLevels().length),
          {
            fontFamily: 'monospace',
            fontSize: narrow ? '13px' : '15px',
            color: '#89929d',
          },
        ).setOrigin(0.5);
      }
    } else if (action.kind === 'choose-level') {
      this.createButton(
        this.scale.width / 2,
        mainY,
        buttonWidth,
        mainHeight,
        copy.home.chooseLevel,
        '#f0d28a',
        HOME_MENU_ICONS.levels.icon,
        () => this.scene.start(LEVELS_SCENE_KEY),
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
        HOME_MENU_ICONS.primary.icon,
        () => {
          if (entry !== undefined) void this.launchLevel(campaign, entry);
        },
      );

    }

    this.createButton(
      this.scale.width / 2,
      mainY + secondaryStep * (dailyVisible ? 2 : 1),
      buttonWidth,
      narrow ? 52 : 56,
      copy.common.levels,
      '#d8d1c4',
      HOME_MENU_ICONS.levels.icon,
      () => this.scene.start(LEVELS_SCENE_KEY),
    );

    if (dailyVisible) {
      this.createButton(
        this.scale.width / 2,
        mainY + secondaryStep * 3,
        buttonWidth,
        narrow ? 52 : 56,
        copy.common.statistics,
        '#aeb4bc',
        HOME_MENU_ICONS.statistics.icon,
        () => this.scene.start(STATS_SCENE_KEY),
      );
      void this.renderDailyEntry(
        profileService,
        mainY + secondaryStep,
        buttonWidth,
        narrow ? 52 : 56,
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
        HOME_MENU_ICONS.settings.icon,
        () => this.scene.start(SETTINGS_SCENE_KEY),
      );
    }

    const tutorialEntry = tutorial.getContinueLevel() ?? tutorial.getLevels()[0];
    const lastMenuIndex = settingsVisible ? 4 : dailyVisible ? 3 : 1;
    const lastMenuY = mainY + secondaryStep * lastMenuIndex;
    const utilityGap = narrow ? 10 : 18;
    const utilityMargin = narrow ? 12 : 22;
    const utilityHeight = narrow ? 40 : 46;
    const utilityWidth = narrow
      ? Math.floor((this.scale.width - utilityMargin * 2 - utilityGap) / 2)
      : 184;
    const utilityY = narrow
      ? Math.min(this.scale.height - utilityHeight / 2 - 12, lastMenuY + 66)
      : 40;
    const tutorialX = utilityMargin + utilityWidth / 2;
    const helpX = this.scale.width - utilityMargin - utilityWidth / 2;

    createHomeMenuButton(this, {
      x: tutorialX,
      y: utilityY,
      width: utilityWidth,
      height: utilityHeight,
      label: copy.common.tutorial,
      labelColor: '#f4ead7',
      icon: 'play',
      compact: true,
      onActivate: (pointer) => {
        if (!this.pointerGate.canActivate(pointer.id) || tutorialEntry === undefined) return;
        void this.launchTutorial(tutorial, tutorialEntry);
      },
    });
    createHomeMenuButton(this, {
      x: helpX,
      y: utilityY,
      width: utilityWidth,
      height: utilityHeight,
      label: copy.common.howToPlay,
      labelColor: '#f4ead7',
      icon: 'info',
      compact: true,
      onActivate: (pointer) => {
        if (!this.pointerGate.canActivate(pointer.id)) return;
        this.scene.launch(HELP_SCENE_KEY, { returnSceneKey: 'HomeScene' });
        this.scene.pause();
      },
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
    icon: HomeMenuIcon,
    onActivate: () => void,
    enabled = true,
  ): void {
    createHomeMenuButton(this, {
      x,
      y,
      width,
      height,
      label,
      labelColor: color,
      icon,
      enabled,
      accentFrame: icon === 'daily' && enabled,
      onActivate: (pointer) => {
        if (!this.pointerGate.canActivate(pointer.id)) return;
        onActivate();
      },
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

  private getTutorialService(): TutorialService {
    const service = this.registry.get(TUTORIAL_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof TutorialService)) {
      throw new Error('HomeScene requires TutorialService in Phaser registry.');
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
        HOME_MENU_ICONS.daily.icon,
        () => {},
        false,
      );
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
      HOME_MENU_ICONS.daily.icon,
      () => this.scene.start(DAILY_SCENE_KEY),
    );

    }

  private async launchTutorial(
    service: TutorialService,
    entry: TutorialLevelEntry,
  ): Promise<void> {
    if (this.launchPending || !service.canPlayLevel(entry.id)) return;
    this.launchPending = true;

    try {
      const started = await service.startLevel(entry.id);
      this.scene.start('GameScene', createTutorialGameSceneData(started));
    } catch (error) {
      this.launchPending = false;
      console.error(`[Dungeon Logic] Could not start ${entry.id} from Home.`, error);
    }
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
