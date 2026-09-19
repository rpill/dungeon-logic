import Phaser from 'phaser';

import { ANALYTICS_SERVICE_REGISTRY_KEY, type AnalyticsService } from '../analytics/AnalyticsService';
import { CAMPAIGN_SERVICE_REGISTRY_KEY, CampaignService } from '../campaign/CampaignService';
import type { CampaignLevelEntry } from '../content/campaign/types';
import { DAILY_SERVICE_REGISTRY_KEY, DailyService } from '../daily/DailyService';
import { ENDLESS_SERVICE_REGISTRY_KEY, EndlessService } from '../endless/EndlessService';
import { getUiCopy } from '../i18n/UiCopy';
import { getMasterySnapshot } from '../mastery/MasteryProgress';
import { PLATFORM_SERVICES_REGISTRY_KEY } from '../platform/PlatformRegistry';
import type { PlatformServices } from '../platform/services';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import {
  createCampaignGameSceneData,
  createEndlessGameSceneData,
  createTutorialGameSceneData,
} from '../runtime/GameLaunch';
import { createHeaderActionButton, getHeaderActionButtonMetrics, getHeaderActionPlacement } from '../runtime/HeaderActionButton';
import { MetaPointerGate } from '../runtime/MetaPointerGate';
import { createPrimaryActionButton } from '../runtime/PrimaryActionButton';
import { createHomeHubModeCard } from '../runtime/HomeHubModeCard';
import { createMasteryStrip } from '../runtime/MasteryStrip';
import {
  calculateAvailableViewport,
  readCssSafeAreaInsets,
  sanitizeViewportInset,
  STICKY_BOTTOM_INSET_REGISTRY_KEY,
} from '../runtime/AvailableViewport';
import {
  HOME_SCENE_KEY,
  LEVELS_SCENE_KEY,
  MASTERY_SCENE_KEY,
  SETTINGS_SCENE_KEY,
  getHomeCampaignAction,
  getHomeDailyAction,
} from '../runtime/MetaSelectors';
import { createSceneBackground } from '../runtime/SceneBackground';
import { UI_ICON_KEYS } from '../runtime/UiIcons';
import { TUTORIAL_SERVICE_REGISTRY_KEY, TutorialService } from '../tutorial/TutorialService';
import { DAILY_SCENE_KEY } from './DailyScene';
import { classifyViewport } from './GameBoardLayout';

const HOME_PROGRESS_TRACK_FILL = 0x090d16;
const HOME_PROGRESS_FILL = 0xf0bd63;

const HOME_CARD_ICON_KEYS = {
  play: 'home-menu-icon-play',
  daily: 'home-menu-icon-daily',
  levels: 'home-menu-icon-levels',
  endless: 'home-menu-icon-endless',
} as const;

type HomeCardIcon = keyof typeof HOME_CARD_ICON_KEYS;
type HomeCardVariant = 'primary' | 'tall' | 'wide';

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
  readonly activeAccent?: boolean;
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
    const endless = this.getEndlessService();
    const profileService = this.getProfileService();
    const profile = profileService.getProfile();
    const mastery = getMasterySnapshot(profile);
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
    const endlessUnlocked = campaign.isEndlessUnlocked();

    const centerX = safeViewport.centerX;
    const logo = this.add.image(centerX, 0, 'home-logo').setOrigin(0.5);
    const logoAspect = logo.width / logo.height;

    const homeHeaderActionMetrics = getHeaderActionButtonMetrics(safeViewport.width < 700);
    const homeSettingsPlacement = getHeaderActionPlacement(
      safeViewport,
      'right',
      homeHeaderActionMetrics.iconButtonSize,
      homeHeaderActionMetrics.iconButtonSize,
    );
    createHomeSettingsButton(this, {
      x: homeSettingsPlacement.x,
      y: homeSettingsPlacement.y,
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
    const naturalWideHeight = narrow ? (compactHeight ? 72 : 82) : (compactHeight ? 80 : 96);
    const naturalMasteryHeight = narrow ? (compactHeight ? 52 : 58) : (compactHeight ? 64 : 72);
    const masteryGap = narrow ? (compactHeight ? 8 : 10) : (compactHeight ? 9 : 12);
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
    const naturalTileHeight = naturalTileWidth;
    const naturalLogoWidth = narrow
      ? Math.min(naturalContentWidth * 0.88, 330)
      : Math.min(naturalContentWidth * 0.94, 500);
    const naturalLogoHeight = naturalLogoWidth / logoAspect;
    const naturalStackHeight = naturalLogoHeight
      + logoToPrimaryGap
      + naturalPrimaryHeight
      + masteryGap
      + naturalMasteryHeight
      + masteryGap
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
    const masteryHeight = naturalMasteryHeight * stackScale;
    const scaledLogoWidth = naturalLogoWidth * stackScale;
    const scaledLogoHeight = naturalLogoHeight * stackScale;
    const scaledLogoGap = logoToPrimaryGap * stackScale;
    const scaledCardSectionGap = cardSectionGap * stackScale;
    const scaledMasteryGap = masteryGap * stackScale;
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
    const masteryY = primaryY
      + primaryHeight / 2
      + scaledMasteryGap
      + masteryHeight / 2;
    const tileY = masteryY
      + masteryHeight / 2
      + scaledMasteryGap
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
      onActivate: primary.onActivate,
    }, this.pointerGate);

    createMasteryStrip(this, {
      x: centerX,
      y: masteryY,
      width: contentWidth,
      height: masteryHeight,
      snapshot: mastery,
      copy: copy.mastery,
      onActivate: (pointer) => {
        if (!this.pointerGate.canActivate(pointer.id)) return;
        this.scene.start(MASTERY_SCENE_KEY);
      },
    });

    createHomeHubCard(this, {
      x: centerX - (tileWidth + cardGap) / 2,
      y: tileY,
      width: tileWidth,
      height: tileHeight,
      variant: 'tall',
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
      subtitle: endlessUnlocked
        ? copy.home.endlessStreak(profile.endless.currentCleanStreak, profile.endless.bestCleanStreak)
        : copy.home.endlessLockedAfterLevel,
      icon: 'endless',
      enabled: endlessUnlocked,
      activeAccent: endlessUnlocked,
      onActivate: () => void this.launchEndless(endless, campaign),
    }, this.pointerGate);

    const handleResize = (): void => {
      if (this.scene.isActive()) this.scene.restart();
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
    });

    if (import.meta.env.DEV) {
      void import('../dev/MasteryRankUpDevControl').then(({ createMasteryRankUpDevControl }) => {
        if (!this.scene.isActive() || this.createVersion !== createVersion) return;
        createMasteryRankUpDevControl(this, {
          currentRank: mastery.currentRank,
          copy: copy.mastery,
        });
      });
    }

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

  private getEndlessService(): EndlessService {
    const service = this.registry.get(ENDLESS_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof EndlessService)) {
      throw new Error('HomeScene requires EndlessService in Phaser registry.');
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
        variant: 'tall',
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
      variant: 'tall',
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
        variant: 'tall',
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
        variant: 'tall',
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
      variant: 'tall',
      label: 'DAILY',
      subtitle: streak,
      icon: 'daily',
      activeAccent: !solved,
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

  private async launchEndless(service: EndlessService, campaign: CampaignService): Promise<void> {
    if (!campaign.isEndlessUnlocked()) return;
    if (this.launchPending) return;
    this.launchPending = true;

    try {
      const launch = service.beginCurrent();
      this.scene.start('GameScene', createEndlessGameSceneData(
        launch.level,
        launch.ordinal,
        launch.attempt,
      ));
    } catch (error) {
      this.launchPending = false;
      console.error('[Dungeon Logic] Could not start Endless from Home.', error);
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
  const activeAccent = options.activeAccent ?? false;

  if (options.variant === 'primary') {
    const button = createPrimaryActionButton(scene, {
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
      label: options.label,
      subtitle: options.subtitle,
      iconKey: HOME_CARD_ICON_KEYS[options.icon as 'play'],
      enabled,
      onActivate: (pointer) => {
        if (pointerGate.canActivate(pointer.id)) options.onActivate();
      },
    });
    return { destroy: () => button.destroy() };
  }

  const card = createHomeHubModeCard(scene, {
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    variant: options.variant,
    enabled,
    activeAccent,
    onActivate: (pointer) => {
      if (pointerGate.canActivate(pointer.id)) options.onActivate();
    },
  });
  const objects: Phaser.GameObjects.GameObject[] = [];

  const narrow = scene.scale.width < 700;
  const cardWidth = card.displayWidth;
  const cardHeight = card.displayHeight;
  // Legacy sanity anchors retained after switching to aspect-safe card bounds:
  // const iconSize = narrow ? 30 : Math.min(82, options.width * 0.31);
  //         y: options.y + options.height * (narrow ? 0.31 : 0.35),
  const labelColor = enabled
    ? (activeAccent ? '#ffd978' : '#fff1d2')
    : '#77849c';
  const subtitleColor = enabled ? '#c4d0e5' : '#58667f';

  if (options.variant === 'tall') {
    const iconSize = narrow ? 30 : Math.min(82, cardWidth * 0.31);
    const iconY = options.y - cardHeight * 0.22;
    const iconKey = HOME_CARD_ICON_KEYS[options.icon as 'daily' | 'levels'];
    const icon = scene.add.image(options.x, iconY, iconKey)
      .setDisplaySize(iconSize, iconSize)
      .setTint(enabled ? (activeAccent ? 0xf5c75f : 0xffefcf) : 0x7d889c)
      .setAlpha(enabled ? 1 : 0.58);
    objects.push(icon);

    if (!enabled) {
      const lockSize = narrow ? 14 : Math.max(16, Math.min(24, cardWidth * 0.085));
      const lock = scene.add.image(
        options.x + cardWidth * 0.29,
        options.y - options.height * 0.19,
        UI_ICON_KEYS.lock,
      )
        .setDisplaySize(lockSize, lockSize)
        .setTint(0x8792a8)
        .setAlpha(0.72);
      objects.push(lock);
    }

    const label = scene.add.text(options.x, options.y + cardHeight * 0.08, options.label, {
      fontFamily: 'monospace',
      fontSize: narrow ? '16px' : '21px',
      color: labelColor,
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(enabled ? 1 : 0.55);
    fitHomeText(label, cardWidth - (narrow ? 22 : 32), narrow ? 12 : 14);
    objects.push(label);

    if (options.progress !== undefined) {
      const progressLabel = scene.add.text(options.x, options.y + cardHeight * (narrow ? 0.24 : 0.28), options.progress.label, {
        fontFamily: 'monospace',
        fontSize: narrow ? '10px' : '13px',
        color: subtitleColor,
        fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(enabled ? 1 : 0.55);
      fitHomeText(progressLabel, cardWidth - (narrow ? 18 : 28), narrow ? 9 : 10);
      objects.push(progressLabel);

      const progress = drawHomeCardProgress(scene, {
        x: options.x,
        y: options.y + cardHeight * (narrow ? 0.31 : 0.35),
        width: cardWidth - (narrow ? 40 : 58),
        height: narrow ? 5 : 7,
        completed: options.progress.completed,
        total: options.progress.total,
      });
      if (!enabled) progress.setAlpha(0.55);
      objects.push(progress);
    } else {
      const subtitle = scene.add.text(options.x, options.y + cardHeight * (narrow ? 0.27 : 0.31), options.subtitle, {
        fontFamily: 'monospace',
        fontSize: narrow ? '11px' : '14px',
        color: subtitleColor,
      }).setOrigin(0.5).setAlpha(enabled ? 1 : 0.55);
      fitHomeText(subtitle, cardWidth - (narrow ? 18 : 28), narrow ? 9 : 10);
      objects.push(subtitle);
    }
  } else {
    const iconX = options.x - cardWidth * (narrow ? 0.31 : 0.32);
    const contentX = options.x + cardWidth * (narrow ? 0.08 : 0.05);
    const iconSize = narrow ? 38 : 52;
    const icon = scene.add.image(iconX, options.y, HOME_CARD_ICON_KEYS[options.icon])
      .setDisplaySize(iconSize, iconSize)
      .setTint(enabled ? 0xdfe8f8 : 0x717d93)
      .setAlpha(enabled ? 0.96 : 0.56);
    objects.push(icon);

    if (!enabled) {
      const lockSize = narrow ? 14 : 20;
      const lock = scene.add.image(
        options.x + cardWidth * (narrow ? 0.34 : 0.36),
        options.y,
        UI_ICON_KEYS.lock,
      )
        .setDisplaySize(lockSize, lockSize)
        .setTint(0x8792a8)
        .setAlpha(0.72);
      objects.push(lock);
    }

    const label = scene.add.text(contentX, options.y - (narrow ? 8 : 10), options.label, {
      fontFamily: 'monospace',
      fontSize: narrow ? '16px' : '22px',
      color: labelColor,
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(enabled ? 1 : 0.55);
    fitHomeText(label, cardWidth * 0.68, narrow ? 12 : 15);
    objects.push(label);

    const subtitle = scene.add.text(contentX, options.y + (narrow ? 15 : 20), options.subtitle, {
      fontFamily: 'monospace',
      fontSize: narrow ? '11px' : '14px',
      color: subtitleColor,
    }).setOrigin(0.5).setAlpha(enabled ? 1 : 0.55);
    fitHomeText(subtitle, cardWidth * 0.67, narrow ? 9 : 10);
    objects.push(subtitle);
  }

  return {
    destroy: () => {
      card.destroy();
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
