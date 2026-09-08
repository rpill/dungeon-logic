import Phaser from 'phaser';

import { CAMPAIGN_SERVICE_REGISTRY_KEY, CampaignService } from '../campaign/CampaignService';
import { campaignManifest } from '../content/campaign/manifest';
import { runLevelQualitySanityChecks } from '../dev/levelQualitySanity';
import { runSolverSanityChecks } from '../dev/solverSanity';
import { runValidatorSanityChecks } from '../dev/validatorSanity';
import { LocalPlayerProfileStorage } from '../profile/LocalPlayerProfileStorage';
import { HOME_SCENE_KEY } from '../runtime/MetaSelectors';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import {
  loadGeneratedReportFromDevServer,
  resolveDevLaunch,
} from '../runtime/LaunchRouting';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
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

    const profileStorage = new LocalPlayerProfileStorage();
    const profileService = await PlayerProfileService.create(campaignManifest, profileStorage);
    const campaignService = CampaignService.create(campaignManifest, profileService);
    this.registry.set(PLAYER_PROFILE_SERVICE_REGISTRY_KEY, profileService);
    this.registry.set(CAMPAIGN_SERVICE_REGISTRY_KEY, campaignService);
    this.scene.start(HOME_SCENE_KEY);
  }
}
