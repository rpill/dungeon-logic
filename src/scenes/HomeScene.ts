import Phaser from 'phaser';
import { getAudioFeedback } from '../audio/AudioFeedbackService';

import { ANALYTICS_SERVICE_REGISTRY_KEY, type AnalyticsService } from '../analytics/AnalyticsService';
import { CAMPAIGN_SERVICE_REGISTRY_KEY, CampaignService } from '../campaign/CampaignService';
import type { CampaignLevelEntry } from '../content/campaign/types';
import { DAILY_SERVICE_REGISTRY_KEY, DailyService } from '../daily/DailyService';
import { ENDLESS_SERVICE_REGISTRY_KEY, EndlessService } from '../endless/EndlessService';
import { getUiCopy } from '../i18n/UiCopy';
import { getMasterySnapshot } from '../mastery/MasteryProgress';
import { formatMasterRating } from '../mastery/MasterRating';
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
import { createPrimaryActionButton } from '../runtime/PrimaryActionButton';
import { createSlateSurface } from '../runtime/SlateSurface';
import { resolveUiDensity, type UiDensity } from '../ui/UiDensity';
import { createUiTextStyle } from '../ui/UiText';
import { UI_THEME } from '../ui/UiTheme';
import { DAILY_SCENE_KEY } from './DailyScene';
import { classifyViewport } from './GameBoardLayout';

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
  readonly density: UiDensity;
  readonly label: string;
  readonly subtitle: string;
  readonly icon: HomeCardIcon;
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
    const endlessProgress = endless.getProgress();
    const copy = getUiCopy(profile.settings.language);
    const density = resolveUiDensity(this.scale.width, this.scale.height);
    const analytics = this.registry.get(ANALYTICS_SERVICE_REGISTRY_KEY) as AnalyticsService | undefined;
    analytics?.screenView('home');

    const action = getHomeCampaignAction(campaign, profile);
    const viewportClass = classifyViewport(this.scale.width);
    const narrow = viewportClass === 'narrow';
    const safeAreaInsets = readCssSafeAreaInsets();
    const safeViewport = calculateAvailableViewport(this.scale.width, this.scale.height, safeAreaInsets);
    const compactNarrow = narrow && safeViewport.height < 720;
    const levels = campaign.getLevels();
    const completedIds = new Set(profile.campaign.completedLevelIds);
    const completedCampaign = levels.reduce(
      (count, entry) => count + (completedIds.has(entry.id) ? 1 : 0),
      0,
    );
    const endlessUnlocked = campaign.isEndlessUnlocked();

    const centerX = safeViewport.centerX;
    const logoTextureKey = profile.settings.language === 'ru' ? 'home-logo-ru' : 'home-logo-en';
    const logo = this.add.image(centerX, 0, logoTextureKey).setOrigin(0.5);
    const logoAspect = logo.width / logo.height;

    const homeHeaderActionMetrics = getHeaderActionButtonMetrics(safeViewport.width < 700, compactNarrow);
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

    // Preserve the existing actions while letting desktop use its width and
    // phone use compact navigation rows. Reserve the platform's sticky area.
    const stickyBottomInset = sanitizeViewportInset(
      this.registry.get(STICKY_BOTTOM_INSET_REGISTRY_KEY) as unknown,
    );
    const headerBottom = homeSettingsPlacement.y + homeHeaderActionMetrics.iconButtonSize / 2;
    const contentViewport = calculateAvailableViewport(this.scale.width, this.scale.height, {
      top: Math.max(
        safeAreaInsets.top + (narrow ? (compactNarrow ? 8 : 14) : 20),
        headerBottom + (compactNarrow ? 10 : 16),
      ),
      right: safeAreaInsets.right,
      bottom: safeAreaInsets.bottom + (narrow ? 18 : 24) + stickyBottomInset,
      left: safeAreaInsets.left,
    });
    const naturalWidth = narrow
      ? Math.min(contentViewport.width - 28, 390)
      : Math.min(contentViewport.width - 104, 1260);
    const naturalGap = narrow ? (compactNarrow ? 8 : 10) : 16;
    const naturalLogoWidth = narrow
      ? compactNarrow
        ? Math.min(naturalWidth * 0.7, 250)
        : Math.min(naturalWidth * 0.82, 310)
      : Math.min(naturalWidth * 0.46, 560);
    const naturalLogoHeight = naturalLogoWidth / logoAspect;
    const naturalPrimaryHeight = narrow ? (compactNarrow ? 74 : 82) : 92;
    const naturalMasteryHeight = narrow ? (compactNarrow ? 86 : 94) : 190;
    const naturalNavHeight = narrow ? (compactNarrow ? 72 : 78) : 124;
    const naturalHeroHeight = narrow
      ? naturalPrimaryHeight + naturalGap + naturalMasteryHeight
      : naturalMasteryHeight;
    const naturalNavBlockHeight = narrow ? naturalNavHeight * 3 + naturalGap * 2 : naturalNavHeight;
    const naturalLogoGap = narrow ? (compactNarrow ? 10 : 16) : 22;
    const naturalSectionGap = narrow ? (compactNarrow ? 10 : 13) : 22;
    const naturalStackHeight = naturalLogoHeight + naturalLogoGap + naturalHeroHeight
      + naturalSectionGap + naturalNavBlockHeight;
    const stackScale = Math.min(1, contentViewport.height / naturalStackHeight);
    const contentWidth = naturalWidth * stackScale;
    const gap = naturalGap * stackScale;
    const primaryHeight = naturalPrimaryHeight * stackScale;
    const masteryHeight = naturalMasteryHeight * stackScale;
    const navHeight = naturalNavHeight * stackScale;
    const heroHeight = naturalHeroHeight * stackScale;
    const navBlockHeight = naturalNavBlockHeight * stackScale;
    const scaledStackHeight = naturalStackHeight * stackScale;
    const stackCenterY = contentViewport.centerY - (narrow ? contentViewport.height * 0.035 : 0);
    const stackTop = Phaser.Math.Clamp(
      stackCenterY - scaledStackHeight / 2,
      Math.max(contentViewport.y, headerBottom + (compactNarrow ? 10 : 16)),
      contentViewport.bottom - scaledStackHeight,
    );
    const logoHeight = naturalLogoHeight * stackScale;
    logo.setPosition(centerX, stackTop + logoHeight / 2);
    logo.setDisplaySize(naturalLogoWidth * stackScale, logoHeight);

    const heroY = stackTop + logoHeight + naturalLogoGap * stackScale + heroHeight / 2;
    const primaryY = narrow ? heroY - (masteryHeight + gap) / 2 : heroY;
    const masteryY = narrow ? heroY + (primaryHeight + gap) / 2 : heroY;
    const leftHeroWidth = narrow ? contentWidth : (contentWidth - gap) * 0.48;
    const rightHeroWidth = narrow ? contentWidth : contentWidth - gap - leftHeroWidth;
    const primaryX = narrow ? centerX : centerX - (contentWidth - leftHeroWidth) / 2;
    const masteryX = narrow ? centerX : centerX + (contentWidth - rightHeroWidth) / 2;
    if (!narrow) createSlateSurface(this, primaryX, primaryY, leftHeroWidth, heroHeight);

    const primary = this.resolvePrimaryCard(campaign, tutorial, action, completedCampaign, levels.length, copy);
    createHomeHubCard(this, {
      x: primaryX,
      y: primaryY,
      width: narrow ? contentWidth : leftHeroWidth - 38 * stackScale,
      height: primaryHeight,
      variant: 'primary',
      density,
      label: primary.label,
      subtitle: primary.subtitle,
      icon: primary.icon,
      onActivate: primary.onActivate,
    }, this.pointerGate);

    createMasteryStrip(this, {
      x: masteryX,
      y: masteryY,
      width: rightHeroWidth,
      height: masteryHeight,
      snapshot: mastery,
      copy: copy.mastery,
      masterRatingLabel: mastery.currentRank === 'MASTER'
        ? copy.mastery.rating(formatMasterRating(profile.mastery.rating, profile.settings.language))
        : undefined,
      onActivate: (pointer) => {
        if (!this.pointerGate.canActivate(pointer.id)) return;
        this.scene.start(MASTERY_SCENE_KEY);
      },
    });

    const navTop = heroY + heroHeight / 2 + naturalSectionGap * stackScale;
    const navWidth = narrow ? contentWidth : (contentWidth - gap * 2) / 3;
    const navPosition = (index: number): { x: number; y: number } => narrow
      ? { x: centerX, y: navTop + navHeight / 2 + index * (navHeight + gap) }
      : { x: centerX - contentWidth / 2 + navWidth / 2 + index * (navWidth + gap), y: navTop + navBlockHeight / 2 };
    const levelsPosition = navPosition(0);
    createHomeHubCard(this, {
      ...levelsPosition,
      width: navWidth,
      height: navHeight,
      variant: 'wide',
      density,
      label: copy.common.levels,
      subtitle: copy.levelSelect.progress(completedCampaign, levels.length),
      icon: 'levels',
      onActivate: () => this.scene.start(LEVELS_SCENE_KEY),
    }, this.pointerGate);

    void this.renderDailyCard(
      profileService,
      navPosition(1).x,
      navPosition(1).y,
      navWidth,
      navHeight,
      createVersion,
      density,
    );

    createHomeHubCard(this, {
      ...navPosition(2),
      width: navWidth,
      height: navHeight,
      variant: 'wide',
      density,
      label: copy.home.endless,
      subtitle: endlessUnlocked
        ? endlessProgress.rankedComplete
          ? copy.home.endlessFreePlay(endlessProgress.catalogLength)
          : copy.home.endlessProgress(
              endlessProgress.completed,
              endlessProgress.catalogLength,
              profile.endless.currentStreak,
              profile.endless.bestStreak,
            )
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

    if (import.meta.env.DEV && this.registry.get('visual-qa-active') !== true) {
      void import('../dev/MasteryRankUpDevControl').then(({ createMasteryRankUpDevControl }) => {
        if (!this.scene.isActive() || this.createVersion !== createVersion) return;
        createMasteryRankUpDevControl(this, {
          profileService,
          campaignLevels: levels,
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
    density: UiDensity,
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
        density,
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
      density,
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
        density,
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
        density,
        label: 'DAILY',
        subtitle: copy.home.dailyUnavailableShort,
        icon: 'daily',
        enabled: false,
        onActivate: () => {},
      }, this.pointerGate);
      return;
    }

    const solved = action.kind === 'solved';
    const streak = solved
      ? action.currentStreak > 0
        ? `${copy.home.dailySolvedShort} · ${copy.home.dailyStreak(action.currentStreak)}`
        : copy.home.dailySolvedShort
      : action.currentStreak > 0
        ? copy.home.dailyStreak(action.currentStreak)
        : copy.home.dailyNewShort;

    createHomeHubCard(this, {
      x,
      y,
      width,
      height,
      variant: 'tall',
      density,
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
        launch.kind,
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
      iconKey: HOME_CARD_ICON_KEYS[options.icon],
      homeWideLayout: true,
      enabled,
      onActivate: (pointer) => {
        if (pointerGate.canActivate(pointer.id)) options.onActivate();
      },
    });
    return { destroy: () => button.destroy() };
  }

  const narrow = scene.scale.width < 700;
  const surface = createSlateSurface(scene, options.x, options.y, options.width, options.height);
  if (!enabled) surface.setTint(0x8490a0);
  const left = options.x - options.width / 2;
  const iconSize = Math.min(narrow ? 45 : 54, options.height * 0.6);
  const iconX = left + (narrow ? 34 : 39);
  const textX = left + (narrow ? 66 : 76);
  const textWidth = options.width - (textX - left) - (narrow ? 43 : 48);
  const icon = scene.add.image(iconX, options.y, HOME_CARD_ICON_KEYS[options.icon])
    .setDisplaySize(iconSize, iconSize);
  if (!enabled) icon.setTint(UI_THEME.colors.text.disabled);
  const label = scene.add.text(textX, options.y - (narrow ? 10 : 12), options.label, {
    ...createUiTextStyle('bodyStrong', options.density, {
      color: enabled ? UI_THEME.colors.text.primary : UI_THEME.colors.text.disabled,
    }),
    fontSize: `${narrow ? 17 : 19}px`,
    fontStyle: 'bold',
  }).setOrigin(0, 0.5);
  fitHomeText(label, textWidth, 12);
  const subtitle = scene.add.text(textX, options.y + (narrow ? 15 : 17), options.subtitle, {
    ...createUiTextStyle('meta', options.density, {
      color: !enabled ? UI_THEME.colors.text.disabled
        : activeAccent ? UI_THEME.colors.semantic.gold : UI_THEME.colors.text.secondary,
    }),
    fontSize: `${narrow ? 12 : 14}px`,
  }).setOrigin(0, 0.5);
  fitHomeText(subtitle, textWidth, 10);
  const stateIcon = scene.add.image(
    options.x + options.width / 2 - (narrow ? 20 : 24),
    options.y,
    enabled ? UI_ICON_KEYS.masteryForward : UI_ICON_KEYS.lock,
  ).setDisplaySize(narrow ? 17 : 20, narrow ? 17 : 20)
    .setTint(enabled ? UI_THEME.colors.text.secondary : UI_THEME.colors.text.disabled);
  if (enabled) {
    surface.setInteractive({ useHandCursor: true });
    surface.on('pointerover', () => surface.setTint(0xe4e8ef));
    surface.on('pointerout', () => surface.clearTint());
    surface.on('pointerdown', () => surface.setTint(0xc5cedc));
    surface.on('pointerupoutside', () => surface.clearTint());
    surface.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      surface.clearTint();
      if (!pointerGate.canActivate(pointer.id)) return;
      getAudioFeedback(scene).play('ui-click');
      options.onActivate();
    });
  }
  return { destroy: () => { surface.destroy(); icon.destroy(); label.destroy(); subtitle.destroy(); stateIcon.destroy(); } };
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
