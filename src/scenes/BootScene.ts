import Phaser from 'phaser';

import { preloadAudioFeedbackAssets } from '../audio/AudioAssets';
import { ANALYTICS_SERVICE_REGISTRY_KEY, AnalyticsService } from '../analytics/AnalyticsService';
import type { TechnicalErrorReporter } from '../analytics/AnalyticsService';
import { createYandexMetricaTransport } from '../analytics/YandexMetricaTransport';
import { initializeBackgroundMusic } from '../audio/MusicService';
import { CAMPAIGN_SERVICE_REGISTRY_KEY, CampaignService } from '../campaign/CampaignService';
import { campaignManifest } from '../content/campaign/manifest';
import { loadDailyCatalog } from '../content/daily/DailyCatalogLoader';
import { loadEndlessCatalog } from '../content/endless/EndlessCatalogLoader';
import { ENDLESS_SERVICE_REGISTRY_KEY, EndlessService } from '../endless/EndlessService';
import { TUTORIAL_MANIFEST } from '../content/tutorial/manifest';
import { DAILY_SERVICE_REGISTRY_KEY, DailyService } from '../daily/DailyService';
import { runLevelQualitySanityChecks } from '../dev/levelQualitySanity';
import { runSolverSanityChecks } from '../dev/solverSanity';
import { runValidatorSanityChecks } from '../dev/validatorSanity';
import { LocalPlayerProfileStorage } from '../profile/LocalPlayerProfileStorage';
import { PlatformPlayerProfileStorage } from '../profile/PlatformPlayerProfileStorage';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import { createLocalPlatformServices } from '../platform/local';
import {
  PLATFORM_SERVICES_REGISTRY_KEY,
  resolvePlatformServices,
} from '../platform/PlatformRegistry';
import { createYandexPlatformServices } from '../platform/yandex';
import type { YandexGlobalScopeLike } from '../platform/yandex';
import { resolveSupportedLanguage } from '../i18n/Language';
import { HOME_SCENE_KEY, shouldAutoStartTutorial } from '../runtime/MetaSelectors';
import { createTutorialGameSceneData } from '../runtime/GameLaunch';
import { preloadSceneBackgrounds } from '../runtime/SceneBackground';
import { preloadHomeMenuAssets } from '../runtime/HomeMenuButton';
import { preloadPrimaryActionButtonAssets } from '../runtime/PrimaryActionButton';
import { preloadHeaderActionButtonAssets } from '../runtime/HeaderActionButton';
import { preloadCommonUiIcons } from '../runtime/UiIcons';
import { preloadPuzzleHeaderUiAssets } from '../runtime/PuzzleHeaderUiAssets';
import { preloadSlateSurfaceAsset } from '../runtime/SlateSurface';
import { preloadMasterySealAssets } from '../runtime/MasterySeal';
import { TUTORIAL_SERVICE_REGISTRY_KEY, TutorialService } from '../tutorial/TutorialService';
import { preloadBoardThemeAssets } from '../view/BoardThemeAssets';
import { preloadFixedObjectAssets } from '../view/FixedObjectAssets';
import {
  loadGeneratedReportFromDevServer,
  resolveDevLaunch,
} from '../runtime/LaunchRouting';

export class BootScene extends Phaser.Scene {
  private readonly failedBootAssetKeys = new Set<string>();

  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.failedBootAssetKeys.clear();
    this.load.on('loaderror', this.handleBootAssetLoadError, this);

    preloadSceneBackgrounds(this);
    preloadAudioFeedbackAssets(this);
    preloadHomeMenuAssets(this);
    preloadPrimaryActionButtonAssets(this);
    preloadHeaderActionButtonAssets(this);
    preloadCommonUiIcons(this);
    preloadMasterySealAssets(this);
    preloadPuzzleHeaderUiAssets(this);
    preloadSlateSurfaceAsset(this);
    preloadBoardThemeAssets(this);
    preloadFixedObjectAssets(this);
    this.load.image('home-logo', 'assets/logo.webp');
  }

  create(): void {
    this.load.off('loaderror', this.handleBootAssetLoadError, this);
    if (this.failedBootAssetKeys.size > 0) {
      this.renderLoadFailure();
      return;
    }

    const hostname = window.location.hostname;
    const isLocalDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocalDevelopment) {
      runValidatorSanityChecks();
      runSolverSanityChecks();
      runLevelQualitySanityChecks();
    }

    void this.routeLaunch();
  }


  private handleBootAssetLoadError(file: Phaser.Loader.File): void {
    const key = String(file.key ?? 'unknown');
    this.failedBootAssetKeys.add(key);
    console.error(`[Dungeon Logic] Required boot asset failed to load: ${key}`);
  }

  private renderLoadFailure(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const narrow = width < 700;
    const russian = typeof navigator !== 'undefined'
      && navigator.language.toLowerCase().startsWith('ru');
    const title = russian ? 'Не удалось загрузить игру' : 'Could not load the game';
    const details = russian
      ? 'Проверьте соединение и попробуйте ещё раз.'
      : 'Check your connection and try again.';
    const retryLabel = russian ? 'ПОВТОРИТЬ' : 'RETRY';

    this.cameras.main.setBackgroundColor('#111318');
    this.add.text(width / 2, height / 2 - (narrow ? 70 : 82), title, {
      fontFamily: "'Balsamiq Sans', sans-serif",
      fontSize: `${narrow ? 24 : 32}px`,
      color: '#f2e7d5',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: Math.max(240, width - 48) },
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - (narrow ? 20 : 24), details, {
      fontFamily: "'Balsamiq Sans', sans-serif",
      fontSize: `${narrow ? 14 : 17}px`,
      color: '#aebbd0',
      align: 'center',
      wordWrap: { width: Math.max(240, width - 64) },
    }).setOrigin(0.5);

    const buttonWidth = Math.min(narrow ? 220 : 260, Math.max(180, width - 56));
    const buttonHeight = narrow ? 48 : 54;
    const buttonY = height / 2 + (narrow ? 58 : 70);
    const button = this.add.rectangle(width / 2, buttonY, buttonWidth, buttonHeight, 0x283548, 1)
      .setStrokeStyle(2, 0xc69e58, 1)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(width / 2, buttonY, retryLabel, {
      fontFamily: "'Balsamiq Sans', sans-serif",
      fontSize: `${narrow ? 17 : 19}px`,
      color: '#f4ead7',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const reload = (): void => window.location.reload();
    button.on('pointerover', () => button.setFillStyle(0x34445c, 1));
    button.on('pointerout', () => button.setFillStyle(0x283548, 1));
    button.on('pointerdown', () => button.setFillStyle(0x1d2939, 1));
    button.on('pointerup', reload);
    label.setInteractive({ useHandCursor: true }).on('pointerup', reload);
  }

  private async routeLaunch(): Promise<void> {
    const visualQaId = import.meta.env.DEV
      ? new URLSearchParams(window.location.search).get('visualQa')
      : null;
    if (visualQaId !== null) {
      const { launchVisualQa } = await import('../dev/VisualQaMode');
      await launchVisualQa(this, visualQaId);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        document.documentElement.dataset.visualQaReady = visualQaId;
      }));
      return;
    }

    const analytics = new AnalyticsService(createYandexMetricaTransport({
      prod: import.meta.env.PROD,
      counterId: import.meta.env.VITE_YANDEX_METRICA_ID,
      globals: globalThis,
      document: typeof document === 'undefined' ? null : document,
    }));
    this.registry.set(ANALYTICS_SERVICE_REGISTRY_KEY, analytics);
    const reportTechnicalError: TechnicalErrorReporter = (code, area, context) => {
      analytics.techError(code, area, context);
    };

    const platformServices = await resolvePlatformServices(
      () => createYandexPlatformServices(
        globalThis as unknown as YandexGlobalScopeLike,
        reportTechnicalError,
      ),
      () => createLocalPlatformServices(),
      reportTechnicalError,
    );
    this.registry.set(PLATFORM_SERVICES_REGISTRY_KEY, platformServices);
    console.info(`[Dungeon Logic] Platform services: ${platformServices.kind}`);

    const profileStorage = new PlatformPlayerProfileStorage(
      platformServices.storage,
      new LocalPlayerProfileStorage(),
      reportTechnicalError,
    );
    const profileService = await PlayerProfileService.create(campaignManifest, profileStorage, {
      defaultLanguage: resolveSupportedLanguage(platformServices.environment.language),
      reportTechnicalError,
    });
    const tutorialService = TutorialService.create(TUTORIAL_MANIFEST, profileService);
    const campaignService = CampaignService.create(campaignManifest, profileService);
    const [dailyCatalog, endlessCatalog] = await Promise.all([
      loadDailyCatalog(),
      loadEndlessCatalog(),
    ]);
    const dailyService = DailyService.create(
      dailyCatalog.entries,
      profileService,
      platformServices.clock,
    );
    const endlessService = EndlessService.create(endlessCatalog, profileService);
    this.registry.set(PLAYER_PROFILE_SERVICE_REGISTRY_KEY, profileService);
    this.registry.set(TUTORIAL_SERVICE_REGISTRY_KEY, tutorialService);
    this.registry.set(CAMPAIGN_SERVICE_REGISTRY_KEY, campaignService);
    this.registry.set(DAILY_SERVICE_REGISTRY_KEY, dailyService);
    this.registry.set(ENDLESS_SERVICE_REGISTRY_KEY, endlessService);
    const profile = profileService.getProfile();
    analytics.gameReady({
      platform: platformServices.kind,
      language: profile.settings.language,
      tutorialCompleted: profile.tutorial.completed,
      campaignCompletedCount: profile.campaign.completedLevelIds.length,
    });
    initializeBackgroundMusic(this, profile.settings.musicEnabled);

    let devLaunch = null;
    try {
      devLaunch = await resolveDevLaunch(
        new URLSearchParams(window.location.search),
        {
          isDev: import.meta.env.DEV,
          loadGeneratedReport: loadGeneratedReportFromDevServer,
        },
      );
    } catch (error) {
      console.warn('[Dungeon Logic] Dev launch routing failed; continuing to campaign flow.', error);
    }

    if (devLaunch !== null) {
      this.scene.start('GameScene', devLaunch);
      return;
    }

    if (shouldAutoStartTutorial(profileService.getProfile())) {
      try {
        const started = await tutorialService.startEntryLevel();
        this.scene.start('GameScene', createTutorialGameSceneData(started));
        return;
      } catch (error) {
        console.warn('[Dungeon Logic] Could not auto-start first Tutorial; falling back to Home.', error);
      }
    }

    this.scene.start(HOME_SCENE_KEY);
  }
}
