import Phaser from 'phaser';

import { preloadAudioFeedbackAssets } from '../audio/AudioAssets';
import { ANALYTICS_SERVICE_REGISTRY_KEY, AnalyticsService } from '../analytics/AnalyticsService';
import type { TechnicalErrorReporter } from '../analytics/AnalyticsService';
import { createYandexMetricaTransport } from '../analytics/YandexMetricaTransport';
import { initializeBackgroundMusic } from '../audio/MusicService';
import { CAMPAIGN_SERVICE_REGISTRY_KEY, CampaignService } from '../campaign/CampaignService';
import { campaignManifest } from '../content/campaign/manifest';
import { DAILY_RELEASE_ENTRIES } from '../content/daily/manifest';
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
import { preloadCommonUiIcons } from '../runtime/UiIcons';
import { TUTORIAL_SERVICE_REGISTRY_KEY, TutorialService } from '../tutorial/TutorialService';
import { preloadBoardThemeAssets } from '../view/BoardThemeAssets';
import { preloadFixedObjectAssets } from '../view/FixedObjectAssets';
import {
  loadGeneratedReportFromDevServer,
  resolveDevLaunch,
} from '../runtime/LaunchRouting';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    preloadSceneBackgrounds(this);
    preloadAudioFeedbackAssets(this);
    preloadHomeMenuAssets(this);
    preloadCommonUiIcons(this);
    preloadBoardThemeAssets(this);
    preloadFixedObjectAssets(this);
    this.load.image('home-logo', '/assets/logo.png');
  }

  create(): void {
    const hostname = window.location.hostname;
    const isLocalDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocalDevelopment) {
      runValidatorSanityChecks();
      runSolverSanityChecks();
      runLevelQualitySanityChecks();
    }

    void this.routeLaunch();
  }

  private async routeLaunch(): Promise<void> {
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
    const dailyService = DailyService.create(
      DAILY_RELEASE_ENTRIES,
      profileService,
      platformServices.clock,
    );
    this.registry.set(PLAYER_PROFILE_SERVICE_REGISTRY_KEY, profileService);
    this.registry.set(TUTORIAL_SERVICE_REGISTRY_KEY, tutorialService);
    this.registry.set(CAMPAIGN_SERVICE_REGISTRY_KEY, campaignService);
    this.registry.set(DAILY_SERVICE_REGISTRY_KEY, dailyService);
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
