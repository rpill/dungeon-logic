import Phaser from 'phaser';

import { ANALYTICS_SERVICE_REGISTRY_KEY, type AnalyticsService } from '../analytics/AnalyticsService';
import { getUiCopy } from '../i18n/UiCopy';
import { formatMasterRating } from '../mastery/MasterRating';
import {
  MASTER_RATING_LEADERBOARD_NAME,
  syncMasterRatingLeaderboard,
} from '../mastery/MasterRatingLeaderboard';
import { getMasterySnapshot } from '../mastery/MasteryProgress';
import { PLATFORM_SERVICES_REGISTRY_KEY } from '../platform/PlatformRegistry';
import type { LeaderboardPlayerView, PlatformServices } from '../platform/services';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import { createCenteredTextMenuButton } from '../runtime/HomeMenuButton';
import { MASTERY_SCENE_KEY } from '../runtime/MetaSelectors';
import { createMetaPageHeader } from '../runtime/MetaPageHeader';
import { calculateMetaPageHeaderMetrics } from '../runtime/MetaPageHeaderLayout';
import { createSceneBackground } from '../runtime/SceneBackground';

export const MASTER_RATING_LEADERBOARD_SCENE_KEY = 'MasterRatingLeaderboardScene';

export class MasterRatingLeaderboardScene extends Phaser.Scene {
  private renderVersion = 0;

  constructor() {
    super(MASTER_RATING_LEADERBOARD_SCENE_KEY);
  }

  create(): void {
    const background = createSceneBackground(this, 'meta');
    const profile = this.getProfileService().getProfile();
    const copy = getUiCopy(profile.settings.language);
    const header = calculateMetaPageHeaderMetrics(this.scale.width, this.scale.height);
    const narrow = header.narrow;
    const compact = this.scale.height < 520;

    const analytics = this.registry.get(ANALYTICS_SERVICE_REGISTRY_KEY) as AnalyticsService | undefined;
    analytics?.screenView('leaderboard');

    createMetaPageHeader(this, {
      title: copy.masterRatingLeaderboard.title,
      backButton: true,
      backLabel: copy.common.back,
      onBack: () => this.scene.start(MASTERY_SCENE_KEY),
    });

    const subtitleY = header.headerHeight + (compact ? 12 : 20);
    this.add.text(this.scale.width / 2, subtitleY, copy.masterRatingLeaderboard.subtitle, {
      fontFamily: 'monospace',
      fontSize: narrow ? '12px' : '15px',
      color: '#a7b3c8',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const panelWidth = Math.min(this.scale.width - (narrow ? 28 : 64), 760);
    const panelTop = subtitleY + (compact ? 24 : 34);
    const panelHeight = Math.max(220, Math.min(compact ? 285 : 520, this.scale.height - panelTop - 18));
    const panel = this.add.graphics();
    panel.fillStyle(0x1f2c4a, 0.96);
    panel.fillRoundedRect(this.scale.width / 2 - panelWidth / 2, panelTop, panelWidth, panelHeight, 12);
    panel.lineStyle(1, 0x4b6386, 0.82);
    panel.strokeRoundedRect(this.scale.width / 2 - panelWidth / 2, panelTop, panelWidth, panelHeight, 12);

    const status = this.add.text(this.scale.width / 2, panelTop + 34, copy.common.loading, {
      fontFamily: 'monospace',
      fontSize: narrow ? '12px' : '15px',
      color: '#c6d2e6',
      align: 'center',
      wordWrap: { width: panelWidth - 50 },
    }).setOrigin(0.5, 0);

    const version = ++this.renderVersion;
    void this.renderTable(version, panelTop, panelWidth, panelHeight, status);

    const handleResize = (): void => {
      background.sync();
      if (this.scene.isActive()) this.scene.restart();
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
    });
  }

  private async renderTable(
    version: number,
    panelTop: number,
    panelWidth: number,
    panelHeight: number,
    status: Phaser.GameObjects.Text,
  ): Promise<void> {
    const profileService = this.getProfileService();
    const profile = profileService.getProfile();
    const copy = getUiCopy(profile.settings.language);
    const services = this.getPlatformServices();
    const isMaster = getMasterySnapshot(profile).currentRank === 'MASTER';

    if (!isMaster) {
      status.setText(copy.masterRatingLeaderboard.noEntry);
      return;
    }
    if (services.kind === 'local') {
      status.setText(copy.leaderboard.localUnavailable);
      return;
    }

    const authorized = await services.leaderboards.isAuthorized();
    if (!this.isCurrent(version)) return;
    if (!authorized) {
      status.setText(copy.masterRatingLeaderboard.signInBody);
      const button = createCenteredTextMenuButton(this, {
        x: this.scale.width / 2,
        y: Math.min(panelTop + panelHeight - 50, panelTop + 120),
        width: Math.min(320, panelWidth - 60),
        height: 50,
        label: copy.leaderboard.signIn,
        labelColor: '#f4ead7',
        onActivate: () => {
          void services.leaderboards.requestAuthorization().then((ok) => {
            if (!ok || !this.isCurrent(version)) return;
            this.scene.restart();
          });
        },
      });
      button.fill.setDepth(20);
      button.frame.setDepth(21);
      button.label.setDepth(22);
      return;
    }

    await syncMasterRatingLeaderboard(profileService.getProfile(), services.leaderboards);
    if (!this.isCurrent(version)) return;
    const snapshot = await services.leaderboards.getEntries(MASTER_RATING_LEADERBOARD_NAME, {
      quantityTop: 10,
      quantityAround: 2,
      includeUser: true,
    });
    if (!this.isCurrent(version)) return;
    if (snapshot === null) {
      status.setText(copy.leaderboard.unavailable);
      return;
    }

    status.setVisible(false);
    const current = snapshot.currentPlayer;
    const summary = current === null
      ? copy.masterRatingLeaderboard.yourRating(formatMasterRating(profile.mastery.rating, profile.settings.language))
      : `${copy.masterRatingLeaderboard.yourRating(formatMasterRating(current.score, profile.settings.language))} · ${copy.masterRatingLeaderboard.yourPlace(current.place)}`;
    this.add.text(this.scale.width / 2, panelTop + 28, summary, {
      fontFamily: 'monospace',
      fontSize: this.scale.width < 700 ? '13px' : '17px',
      color: '#f0bd63',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5, 0);

    const rows = [...snapshot.entries];
    if (current !== null && !rows.some((entry) => entry.isCurrentPlayer)) rows.push(current);
    rows.sort((left, right) => left.place - right.place);
    const uniqueRows = rows.filter((entry, index, all) => all.findIndex((candidate) => candidate.place === entry.place && candidate.publicName === entry.publicName) === index);
    const rowGap = this.scale.height < 520 ? 20 : 30;
    const startY = panelTop + (this.scale.height < 520 ? 72 : 84);
    const maxRows = Math.max(1, Math.floor((panelHeight - (startY - panelTop) - 18) / rowGap));
    uniqueRows.slice(0, maxRows).forEach((entry, index) => this.renderRow(entry, startY + index * rowGap, panelWidth, profile.settings.language));
  }

  private renderRow(entry: LeaderboardPlayerView, y: number, panelWidth: number, language: 'ru' | 'en'): void {
    const left = this.scale.width / 2 - panelWidth / 2 + 24;
    const right = this.scale.width / 2 + panelWidth / 2 - 24;
    const color = entry.isCurrentPlayer ? '#fff0c1' : '#d8e2f2';
    this.add.text(left, y, `#${entry.place}`, {
      fontFamily: 'monospace', fontSize: this.scale.width < 700 ? '11px' : '14px', color, fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const name = entry.publicName.trim().length > 0 ? entry.publicName : getUiCopy(language).leaderboard.playerFallback;
    this.add.text(left + 62, y, name, {
      fontFamily: 'monospace', fontSize: this.scale.width < 700 ? '11px' : '14px', color,
    }).setOrigin(0, 0.5);
    this.add.text(right, y, formatMasterRating(entry.score, language), {
      fontFamily: 'monospace', fontSize: this.scale.width < 700 ? '12px' : '15px', color: entry.isCurrentPlayer ? '#f0bd63' : '#f4ead7', fontStyle: 'bold',
    }).setOrigin(1, 0.5);
  }

  private isCurrent(version: number): boolean {
    return version === this.renderVersion && this.scene.isActive();
  }

  private getPlatformServices(): PlatformServices {
    const services = this.registry.get(PLATFORM_SERVICES_REGISTRY_KEY) as PlatformServices | undefined;
    if (services === undefined) throw new Error('MasterRatingLeaderboardScene requires PlatformServices.');
    return services;
  }

  private getProfileService(): PlayerProfileService {
    const service = this.registry.get(PLAYER_PROFILE_SERVICE_REGISTRY_KEY) as PlayerProfileService | undefined;
    if (service === undefined) throw new Error('MasterRatingLeaderboardScene requires PlayerProfileService.');
    return service;
  }
}
