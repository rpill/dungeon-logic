import Phaser from 'phaser';

import { ANALYTICS_SERVICE_REGISTRY_KEY, type AnalyticsService } from '../analytics/AnalyticsService';
import { CAMPAIGN_SERVICE_REGISTRY_KEY, CampaignService } from '../campaign/CampaignService';
import type { CampaignLevelEntry } from '../content/campaign/types';
import { DAILY_SERVICE_REGISTRY_KEY, DailyService } from '../daily/DailyService';
import { getUiCopy } from '../i18n/UiCopy';
import { PLATFORM_SERVICES_REGISTRY_KEY } from '../platform/PlatformRegistry';
import type { PlatformServices } from '../platform/services';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import {
  createCampaignGameSceneData,
  createTutorialGameSceneData,
} from '../runtime/GameLaunch';
import { createHeaderActionButton, getHeaderActionButtonMetrics } from '../runtime/HeaderActionButton';
import { MetaPointerGate } from '../runtime/MetaPointerGate';
import {
  calculateAvailableViewport,
  readCssSafeAreaInsets,
  sanitizeViewportInset,
  STICKY_BOTTOM_INSET_REGISTRY_KEY,
} from '../runtime/AvailableViewport';
import {
  HOME_SCENE_KEY,
  LEVELS_SCENE_KEY,
  SETTINGS_SCENE_KEY,
  getHomeCampaignAction,
  getHomeDailyAction,
} from '../runtime/MetaSelectors';
import { createSceneBackground } from '../runtime/SceneBackground';
import { getAudioFeedback } from '../audio/AudioFeedbackService';
import { TUTORIAL_SERVICE_REGISTRY_KEY, TutorialService } from '../tutorial/TutorialService';
import { DAILY_SCENE_KEY } from './DailyScene';
import { classifyViewport } from './GameBoardLayout';

const HOME_FILL_KEY = 'home-menu-fill';
const HOME_FRAME_NORMAL_KEY = 'home-menu-frame-normal';
const HOME_FRAME_HOVER_KEY = 'home-menu-frame-hover';
const HOME_FRAME_PRESSED_KEY = 'home-menu-frame-pressed';
const HOME_FRAME_SLICE_X = 48;
const HOME_FRAME_SLICE_Y = 24;
const HOME_PROGRESS_TRACK_FILL = 0x1f4375;
const HOME_PROGRESS_FILL = 0xf0bd63;

const HOME_CARD_ICON_KEYS = {
  play: 'home-menu-icon-play',
  daily: 'home-menu-icon-daily',
  levels: 'home-menu-icon-levels',
} as const;

type HomeCardIcon = keyof typeof HOME_CARD_ICON_KEYS | 'infinity';
type HomeCardVariant = 'primary' | 'tile' | 'wide';
type HomeCardFrameState = 'normal' | 'hover' | 'pressed';

interface HomeHubCardOptions {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly variant: HomeCardVariant;
  readonly label: string;
  readonly subtitle: string;
  readonly icon: HomeCardIcon;
  readonly progress?: {
    readonly completed: number;
    readonly total: number;
    readonly label: string;
  };
  readonly accent?: boolean;
  readonly enabled?: boolean;
  readonly onActivate: () => void;
}

interface HomeHubCardHandle {
  destroy(): void;
}

interface HomeSettingsButtonOptions {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly onActivate: (pointer: Phaser.Input.Pointer) => void;
}

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
    const analytics = this.registry.get(ANALYTICS_SERVICE_REGISTRY_KEY) as AnalyticsService | undefined;
    analytics?.screenView('home');

    const action = getHomeCampaignAction(campaign, profile);
    const viewportClass = classifyViewport(this.scale.width);
    const narrow = viewportClass === 'narrow';
    const compactHeight = this.scale.height < (narrow ? 650 : 590);
    const safeAreaInsets = readCssSafeAreaInsets();
    const safeViewport = calculateAvailableViewport(this.scale.width, this.scale.height, safeAreaInsets);
    const levels = campaign.getLevels();
    const completedIds = new Set(profile.campaign.completedLevelIds);
    const completedCampaign = levels.reduce(
      (count, entry) => count + (completedIds.has(entry.id) ? 1 : 0),
      0,
    );

    const centerX = safeViewport.centerX;
    const logo = this.add.image(centerX, 0, 'home-logo').setOrigin(0.5);
    const logoAspect = logo.width / logo.height;

    const homeHeaderActionMetrics = getHeaderActionButtonMetrics(narrow);
    const homeHeaderInset = narrow ? 16 : 28;
    createHomeSettingsButton(this, {
      x: safeViewport.right - homeHeaderInset - homeHeaderActionMetrics.iconButtonSize / 2,
      y: safeViewport.y + homeHeaderInset + homeHeaderActionMetrics.iconButtonSize / 2,
      size: homeHeaderActionMetrics.iconButtonSize,
      onActivate: (pointer: Phaser.Input.Pointer) => {
        if (!this.pointerGate.canActivate(pointer.id)) return;
        this.scene.start(SETTINGS_SCENE_KEY, { returnSceneKey: HOME_SCENE_KEY });
      },
    });

    // Build Home as one cohesive stack. The whole stack is centered inside the
    // usable viewport and scales down together on short screens instead of
    // letting the bottom cards clip. A future sticky banner can reserve space
    // by setting the shared sticky bottom inset before entering Home.
    const naturalCardGap = narrow ? 10 : 16;
    const naturalPrimaryHeight = narrow ? (compactHeight ? 66 : 74) : (compactHeight ? 70 : 84);
    const naturalMobileTileHeight = compactHeight ? 102 : 116;
    const naturalWideHeight = narrow ? (compactHeight ? 72 : 82) : (compactHeight ? 80 : 96);
    const cardSectionGap = narrow ? (compactHeight ? 10 : 12) : (compactHeight ? 10 : 14);
    const logoToPrimaryGap = narrow ? (compactHeight ? 18 : 22) : (compactHeight ? 18 : 24);

    const naturalDesktopTileSide = Math.max(200, Math.min(
      260,
      (safeViewport.width - 80 - naturalCardGap) / 2,
    ));
    const naturalContentWidth = narrow
      ? Math.min(safeViewport.width - 28, 390)
      : (naturalDesktopTileSide * 2) + naturalCardGap;
    const naturalTileWidth = (naturalContentWidth - naturalCardGap) / 2;
    const naturalTileHeight = narrow
      ? naturalMobileTileHeight
      : naturalTileWidth;
    const naturalLogoWidth = narrow
      ? Math.min(naturalContentWidth * 0.88, 330)
      : Math.min(naturalContentWidth * 0.94, 500);
    const naturalLogoHeight = naturalLogoWidth / logoAspect;
    const naturalStackHeight = naturalLogoHeight
      + logoToPrimaryGap
      + naturalPrimaryHeight
      + cardSectionGap
      + naturalTileHeight
      + cardSectionGap
      + naturalWideHeight;

    // Home explicitly opts in to sticky-banner reservation. Other scenes only
    // reserve this inset when they choose to read the same registry value.
    const stickyBottomInset = sanitizeViewportInset(
      this.registry.get(STICKY_BOTTOM_INSET_REGISTRY_KEY) as unknown,
    );
    const contentViewport = calculateAvailableViewport(this.scale.width, this.scale.height, {
      top: safeAreaInsets.top + (narrow ? 14 : 20),
      right: safeAreaInsets.right,
      bottom: safeAreaInsets.bottom + (narrow ? 18 : 24) + stickyBottomInset,
      left: safeAreaInsets.left,
    });
    const availableHeight = contentViewport.height;
    const stackScale = Math.min(1, availableHeight / naturalStackHeight);

    const contentWidth = naturalContentWidth * stackScale;
    const cardGap = naturalCardGap * stackScale;
    const primaryHeight = naturalPrimaryHeight * stackScale;
    const tileWidth = naturalTileWidth * stackScale;
    const tileHeight = naturalTileHeight * stackScale;
    const wideHeight = naturalWideHeight * stackScale;
    const scaledLogoWidth = naturalLogoWidth * stackScale;
    const scaledLogoHeight = naturalLogoHeight * stackScale;
    const scaledLogoGap = logoToPrimaryGap * stackScale;
    const scaledCardSectionGap = cardSectionGap * stackScale;
    const scaledStackHeight = naturalStackHeight * stackScale;

    const desiredCenterRatio = narrow ? 0.47 : 0.5;
    const desiredCenterY = contentViewport.y + availableHeight * desiredCenterRatio;
    const minCenterY = contentViewport.y + scaledStackHeight / 2;
    const maxCenterY = contentViewport.bottom - scaledStackHeight / 2;
    const stackCenterY = Phaser.Math.Clamp(desiredCenterY, minCenterY, maxCenterY);
    const stackTop = stackCenterY - scaledStackHeight / 2;

    const logoY = stackTop + scaledLogoHeight / 2;
    const primaryY = stackTop
      + scaledLogoHeight
      + scaledLogoGap
      + primaryHeight / 2;
    const tileY = primaryY
      + primaryHeight / 2
      + scaledCardSectionGap
      + tileHeight / 2;
    const wideY = tileY
      + tileHeight / 2
      + scaledCardSectionGap
      + wideHeight / 2;

    logo.setPosition(centerX, logoY);
    logo.setDisplaySize(scaledLogoWidth, scaledLogoHeight);

    const primary = this.resolvePrimaryCard(campaign, tutorial, action, completedCampaign, levels.length, copy);
    createHomeHubCard(this, {
      x: centerX,
      y: primaryY,
      width: contentWidth,
      height: primaryHeight,
      variant: 'primary',
      label: primary.label,
      subtitle: primary.subtitle,
      icon: primary.icon,
      accent: true,
      onActivate: primary.onActivate,
    }, this.pointerGate);

    createHomeHubCard(this, {
      x: centerX - (tileWidth + cardGap) / 2,
      y: tileY,
      width: tileWidth,
      height: tileHeight,
      variant: 'tile',
      label: copy.common.levels,
      subtitle: '',
      icon: 'levels',
      progress: { completed: completedCampaign, total: levels.length, label: copy.levelSelect.progress(completedCampaign, levels.length) },
      onActivate: () => this.scene.start(LEVELS_SCENE_KEY),
    }, this.pointerGate);

    void this.renderDailyCard(
      profileService,
      centerX + (tileWidth + cardGap) / 2,
      tileY,
      tileWidth,
      tileHeight,
      createVersion,
    );

    createHomeHubCard(this, {
      x: centerX,
      y: wideY,
      width: contentWidth,
      height: wideHeight,
      variant: 'wide',
      label: copy.home.endless,
      subtitle: copy.home.endlessSoon,
      icon: 'infinity',
      enabled: false,
      onActivate: () => {},
    }, this.pointerGate);

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

  private resolvePrimaryCard(
    campaign: CampaignService,
    tutorial: TutorialService,
    action: ReturnType<typeof getHomeCampaignAction>,
    completedCampaign: number,
    campaignTotal: number,
    copy: ReturnType<typeof getUiCopy>,
  ): {
    readonly label: string;
    readonly subtitle: string;
    readonly icon: 'play' | 'levels';
    readonly onActivate: () => void;
  } {
    if (action.kind === 'tutorial') {
      const entry = tutorial.getContinueLevel() ?? tutorial.getLevels()[0];
      const profile = this.getProfileService().getProfile();
      const started = profile.tutorial.completedLevelIds.length > 0
        || profile.tutorial.activePuzzle !== null;
      return {
        label: started ? copy.home.tutorialContinue : copy.home.tutorialStart,
        subtitle: entry === undefined
          ? ''
          : copy.game.tutorialTitle(entry.slot, tutorial.getLevels().length),
        icon: 'play',
        onActivate: () => {
          if (entry !== undefined) void this.launchTutorial(tutorial);
        },
      };
    }

    if (action.kind === 'choose-level') {
      return {
        label: copy.home.chooseLevel,
        subtitle: `${completedCampaign} / ${campaignTotal}`,
        icon: 'levels',
        onActivate: () => this.scene.start(LEVELS_SCENE_KEY),
      };
    }

    const entry = campaign.getLevels().find((candidate) => candidate.id === action.levelId);
    const label = action.kind === 'start' ? copy.home.start : copy.home.continue;
    return {
      label,
      subtitle: entry === undefined
        ? `${completedCampaign} / ${campaignTotal}`
        : copy.levelSelect.level(entry.slot),
      icon: 'play',
      onActivate: () => {
        if (entry !== undefined) void this.launchLevel(campaign, entry);
      },
    };
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

  private async renderDailyCard(
    profileService: PlayerProfileService,
    x: number,
    y: number,
    width: number,
    height: number,
    createVersion: number,
  ): Promise<void> {
    const initialProfile = profileService.getProfile();
    const initialCopy = getUiCopy(initialProfile.settings.language);
    const initialAction = getHomeDailyAction(initialProfile, null);

    if (initialAction.kind === 'locked') {
      createHomeHubCard(this, {
        x,
        y,
        width,
        height,
        variant: 'tile',
        label: 'DAILY',
        subtitle: initialCopy.home.dailyLockedShort,
        icon: 'daily',
        enabled: false,
        onActivate: () => {},
      }, this.pointerGate);
      return;
    }

    const loading = createHomeHubCard(this, {
      x,
      y,
      width,
      height,
      variant: 'tile',
      label: 'DAILY',
      subtitle: initialCopy.common.loading,
      icon: 'daily',
      enabled: false,
      onActivate: () => {},
    }, this.pointerGate);

    let today = null;
    try {
      today = await this.getDailyService().getToday();
    } catch (error) {
      console.warn('[Dungeon Logic] Could not resolve today\'s Daily for Home.', error);
    }
    if (!this.scene.isActive() || createVersion !== this.createVersion) return;

    loading.destroy();
    const profile = profileService.getProfile();
    const copy = getUiCopy(profile.settings.language);
    const action = getHomeDailyAction(profile, today);

    if (action.kind === 'locked') {
      createHomeHubCard(this, {
        x,
        y,
        width,
        height,
        variant: 'tile',
        label: 'DAILY',
        subtitle: copy.home.dailyLockedShort,
        icon: 'daily',
        enabled: false,
        onActivate: () => {},
      }, this.pointerGate);
      return;
    }

    if (action.kind === 'unavailable') {
      createHomeHubCard(this, {
        x,
        y,
        width,
        height,
        variant: 'tile',
        label: 'DAILY',
        subtitle: copy.home.dailyUnavailableShort,
        icon: 'daily',
        enabled: false,
        onActivate: () => {},
      }, this.pointerGate);
      return;
    }

    const solved = action.kind === 'solved';
    const streak = action.currentStreak > 0
      ? copy.home.dailyStreak(action.currentStreak)
      : solved
        ? copy.home.dailySolvedShort
        : copy.home.dailyNewShort;

    createHomeHubCard(this, {
      x,
      y,
      width,
      height,
      variant: 'tile',
      label: 'DAILY',
      subtitle: streak,
      icon: 'daily',
      accent: !solved,
      onActivate: () => this.scene.start(DAILY_SCENE_KEY),
    }, this.pointerGate);
  }

  private async launchTutorial(service: TutorialService): Promise<void> {
    if (this.launchPending) return;
    this.launchPending = true;

    try {
      const started = await service.startEntryLevel();
      this.scene.start('GameScene', createTutorialGameSceneData(started));
    } catch (error) {
      this.launchPending = false;
      console.error('[Dungeon Logic] Could not start Tutorial from Home.', error);
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

function createHomeHubCard(
  scene: Phaser.Scene,
  options: HomeHubCardOptions,
  pointerGate: MetaPointerGate,
): HomeHubCardHandle {
  const enabled = options.enabled ?? true;
  const accent = options.accent ?? false;
  const objects: Phaser.GameObjects.GameObject[] = [];

  const fill = scene.add.nineslice(
    options.x,
    options.y,
    HOME_FILL_KEY,
    undefined,
    options.width,
    options.height,
    HOME_FRAME_SLICE_X,
    HOME_FRAME_SLICE_X,
    HOME_FRAME_SLICE_Y,
    HOME_FRAME_SLICE_Y,
  );
  objects.push(fill);

  const frame = scene.add.nineslice(
    options.x,
    options.y,
    accent ? HOME_FRAME_HOVER_KEY : HOME_FRAME_NORMAL_KEY,
    undefined,
    options.width,
    options.height,
    HOME_FRAME_SLICE_X,
    HOME_FRAME_SLICE_X,
    HOME_FRAME_SLICE_Y,
    HOME_FRAME_SLICE_Y,
  );
  objects.push(frame);

  const narrow = scene.scale.width < 700;
  const labelColor = enabled
    ? (accent ? '#f0c86b' : '#f4ead7')
    : '#8290a7';
  const subtitleColor = enabled ? '#98a5ba' : '#66738a';

  const setFrameState = (state: HomeCardFrameState): void => {
    frame.clearTint();
    if (state === 'pressed') {
      frame.setTexture(HOME_FRAME_PRESSED_KEY);
      return;
    }
    if (state === 'hover' || accent) {
      frame.setTexture(HOME_FRAME_HOVER_KEY);
      return;
    }
    frame.setTexture(HOME_FRAME_NORMAL_KEY);
  };

  if (options.variant === 'primary') {
    const iconSize = narrow ? 30 : 38;
    const iconX = options.x - options.width * (narrow ? 0.31 : 0.32);
    const contentX = options.x + options.width * (narrow ? 0.04 : 0.03);
    const icon = scene.add.image(iconX, options.y, HOME_CARD_ICON_KEYS[options.icon as 'play'])
      .setDisplaySize(iconSize, iconSize)
      .setTint(0xf0c86b);
    objects.push(icon);

    const label = scene.add.text(contentX, options.y - (narrow ? 8 : 10), options.label, {
      fontFamily: 'monospace',
      fontSize: narrow ? '20px' : '26px',
      color: labelColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    fitHomeText(label, options.width * 0.67, narrow ? 15 : 18);
    objects.push(label);

    const subtitle = scene.add.text(contentX, options.y + (narrow ? 17 : 21), options.subtitle, {
      fontFamily: 'monospace',
      fontSize: narrow ? '12px' : '15px',
      color: subtitleColor,
    }).setOrigin(0.5);
    fitHomeText(subtitle, options.width * 0.66, narrow ? 10 : 11);
    objects.push(subtitle);
  } else if (options.variant === 'tile') {
    const iconSize = narrow ? 30 : Math.min(82, options.width * 0.31);
    const iconY = options.y - options.height * 0.22;
    const iconKey = HOME_CARD_ICON_KEYS[options.icon as 'daily' | 'levels'];
    const icon = scene.add.image(options.x, iconY, iconKey)
      .setDisplaySize(iconSize, iconSize)
      .setTint(accent ? 0xf0c86b : 0xf4ead7);
    objects.push(icon);

    const label = scene.add.text(options.x, options.y + options.height * 0.08, options.label, {
      fontFamily: 'monospace',
      fontSize: narrow ? '16px' : '21px',
      color: labelColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    fitHomeText(label, options.width - (narrow ? 22 : 32), narrow ? 12 : 14);
    objects.push(label);

    if (options.progress !== undefined) {
      const progressLabel = scene.add.text(options.x, options.y + options.height * (narrow ? 0.24 : 0.28), options.progress.label, {
        fontFamily: 'monospace',
        fontSize: narrow ? '10px' : '13px',
        color: subtitleColor,
        fontStyle: 'bold',
      }).setOrigin(0.5);
      fitHomeText(progressLabel, options.width - (narrow ? 18 : 28), narrow ? 9 : 10);
      objects.push(progressLabel);

      const progress = drawHomeCardProgress(scene, {
        x: options.x,
        y: options.y + options.height * (narrow ? 0.35 : 0.41),
        width: options.width - (narrow ? 28 : 44),
        height: narrow ? 5 : 7,
        completed: options.progress.completed,
        total: options.progress.total,
      });
      objects.push(progress);
    } else {
      const subtitle = scene.add.text(options.x, options.y + options.height * (narrow ? 0.27 : 0.31), options.subtitle, {
        fontFamily: 'monospace',
        fontSize: narrow ? '11px' : '14px',
        color: subtitleColor,
      }).setOrigin(0.5);
      fitHomeText(subtitle, options.width - (narrow ? 18 : 28), narrow ? 9 : 10);
      objects.push(subtitle);
    }
  } else {
    const iconX = options.x - options.width * (narrow ? 0.31 : 0.32);
    const contentX = options.x + options.width * (narrow ? 0.08 : 0.05);
    const infinity = scene.add.text(iconX, options.y, '∞', {
      fontFamily: 'Arial, sans-serif',
      fontSize: narrow ? '44px' : '58px',
      color: enabled ? '#f0c86b' : '#8792a8',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    objects.push(infinity);

    const label = scene.add.text(contentX, options.y - (narrow ? 8 : 10), options.label, {
      fontFamily: 'monospace',
      fontSize: narrow ? '16px' : '22px',
      color: labelColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    fitHomeText(label, options.width * 0.68, narrow ? 12 : 15);
    objects.push(label);

    const subtitle = scene.add.text(contentX, options.y + (narrow ? 15 : 20), options.subtitle, {
      fontFamily: 'monospace',
      fontSize: narrow ? '11px' : '14px',
      color: subtitleColor,
    }).setOrigin(0.5);
    fitHomeText(subtitle, options.width * 0.67, narrow ? 9 : 10);
    objects.push(subtitle);
  }

  if (enabled) {
    fill.setInteractive({ useHandCursor: true });
    fill.on('pointerover', () => {
      setFrameState('hover');
      getAudioFeedback(scene).play('ui-hover');
    });
    fill.on('pointerout', () => setFrameState('normal'));
    fill.on('pointerdown', () => setFrameState('pressed'));
    fill.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      setFrameState('hover');
      getAudioFeedback(scene).play('ui-click');
      if (pointerGate.canActivate(pointer.id)) options.onActivate();
    });
  } else {
    fill.setAlpha(0.72);
    frame.setAlpha(0.72);
  }

  return {
    destroy: () => {
      for (const object of objects) object.destroy();
    },
  };
}

function drawHomeCardProgress(
  scene: Phaser.Scene,
  options: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly completed: number;
    readonly total: number;
  },
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();
  const radius = options.height / 2;
  const left = options.x - options.width / 2;
  const top = options.y - options.height / 2;
  const safeTotal = Math.max(1, options.total);
  const ratio = Phaser.Math.Clamp(options.completed / safeTotal, 0, 1);

  graphics.fillStyle(HOME_PROGRESS_TRACK_FILL, 0.9);
  graphics.fillRoundedRect(left, top, options.width, options.height, radius);

  if (ratio > 0) {
    const fillWidth = Math.min(options.width, Math.max(options.height, options.width * ratio));
    graphics.fillStyle(HOME_PROGRESS_FILL, 1);
    graphics.fillRoundedRect(left, top, fillWidth, options.height, radius);
  }

  return graphics;
}

function createHomeSettingsButton(
  scene: Phaser.Scene,
  options: HomeSettingsButtonOptions,
): void {
  const narrow = scene.scale.width < 700;
  const metrics = getHeaderActionButtonMetrics(narrow);
  createHeaderActionButton(scene, {
    x: options.x,
    y: options.y,
    width: options.size,
    height: options.size,
    radius: metrics.radius,
    iconKey: 'home-menu-icon-settings',
    iconSize: metrics.iconSize,
    onActivate: options.onActivate,
  });
}

function fitHomeText(
  text: Phaser.GameObjects.Text,
  maxWidth: number,
  minFontSize: number,
): void {
  if (text.width <= maxWidth) return;
  const current = Number.parseFloat(text.style.fontSize?.toString() ?? '16');
  if (!Number.isFinite(current) || current <= 0) return;
  text.setFontSize(Math.max(minFontSize, Math.floor(current * maxWidth / text.width)));
}
