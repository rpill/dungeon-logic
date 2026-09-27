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
import { isProfileAuthorizationReady, requestAuthorizationWithProfileMerge } from '../profile/ProfileAuthorization';
import type { LeaderboardPlayerView, PlatformServices } from '../platform/services';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import { createMaterialActionButton } from '../runtime/MaterialActionButton';
import { MASTERY_SCENE_KEY } from '../runtime/MetaSelectors';
import { createMetaPageHeader } from '../runtime/MetaPageHeader';
import { calculateMetaPageHeaderMetrics } from '../runtime/MetaPageHeaderLayout';
import { createSceneBackground } from '../runtime/SceneBackground';
import { createQuietInset } from '../runtime/QuietInset';
import { createSlateSurface } from '../runtime/SlateSurface';

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
      fontFamily: "'Balsamiq Sans', sans-serif",
      fontSize: narrow ? '12px' : '15px',
      color: '#a7b3c8',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const panelWidth = Math.min(this.scale.width - (narrow ? 28 : 64),
      narrow ? 460 : Math.min(840, Math.max(680, this.scale.width * 0.52)));
    const panelTop = subtitleY + (compact ? 24 : 34);
    const panelHeight = Math.max(220, Math.min(compact ? 285 : narrow ? 490 : 500, this.scale.height - panelTop - 18));
    createSlateSurface(this, this.scale.width / 2, panelTop + panelHeight / 2,
      panelWidth, panelHeight);
    const summaryY = panelTop + (compact ? 43 : 55);
    createQuietInset(this, {
      x: this.scale.width / 2,
      y: summaryY,
      width: panelWidth - (narrow ? 30 : 48),
      height: compact ? 62 : 76,
      borderAlpha: 0.38,
    });

    const status = this.add.text(this.scale.width / 2, summaryY,
      copy.masterRatingLeaderboard.yourRating(formatMasterRating(profile.mastery.rating, profile.settings.language)), {
      fontFamily: "'Balsamiq Sans', sans-serif",
      fontSize: narrow ? '14px' : '19px',
      color: '#c6d2e6',
      align: 'center',
      wordWrap: { width: panelWidth - 50 },
    }).setOrigin(0.5).setDepth(2);
    const loadingY = panelTop + panelHeight * 0.56;
    const loadingSurface = createQuietInset(this, {
      x: this.scale.width / 2,
      y: loadingY,
      width: panelWidth - (narrow ? 30 : 48),
      height: 70,
      borderAlpha: 0.28,
    });
    const loadingText = this.add.text(this.scale.width / 2, loadingY, copy.common.loading, {
      fontFamily: "'Balsamiq Sans', sans-serif",
      fontSize: narrow ? '13px' : '16px',
      color: '#d2dce9',
    }).setOrigin(0.5).setDepth(2);

    const version = ++this.renderVersion;
    void this.renderTable(version, panelTop, panelWidth, panelHeight, status, () => {
      loadingSurface.destroy();
      loadingText.destroy();
    });

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
    clearLoading: () => void,
  ): Promise<void> {
    const profileService = this.getProfileService();
    const profile = profileService.getProfile();
    const copy = getUiCopy(profile.settings.language);
    const services = this.getPlatformServices();
    const isMaster = getMasterySnapshot(profile).currentRank === 'MASTER';

    if (!isMaster) {
      clearLoading();
      status.setText(copy.masterRatingLeaderboard.noEntry);
      return;
    }
    if (services.kind === 'local') {
      clearLoading();
      status.setText(copy.masterRatingLeaderboard.yourRating(formatMasterRating(profile.mastery.rating, profile.settings.language)));
      this.renderEmptyStatus(panelTop, panelWidth, panelHeight, copy.leaderboard.localUnavailable);
      return;
    }

    const authorized = await isProfileAuthorizationReady(profileService, services.leaderboards);
    if (!this.isCurrent(version)) return;
    if (!authorized) {
      clearLoading();
      status.setText(copy.masterRatingLeaderboard.signInBody);
      const button = createMaterialActionButton(this, {
        x: this.scale.width / 2,
        y: panelTop + panelHeight * 0.56,
        width: Math.min(320, panelWidth - 60),
        height: 58,
        label: copy.leaderboard.signIn,
        variant: 'secondary',
        onActivate: () => {
          void requestAuthorizationWithProfileMerge(profileService, services.leaderboards).then((ok) => {
            if (!ok || !this.isCurrent(version)) return;
            this.scene.restart();
          });
        },
      });
      button.surface.setDepth(20);
      button.label.setDepth(21);
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
    clearLoading();
    if (snapshot === null) {
      status.setText(copy.masterRatingLeaderboard.yourRating(formatMasterRating(profile.mastery.rating, profile.settings.language)));
      this.renderEmptyStatus(panelTop, panelWidth, panelHeight, copy.leaderboard.unavailable);
      return;
    }

    const current = snapshot.currentPlayer;
    const summary = current === null
      ? copy.masterRatingLeaderboard.yourRating(formatMasterRating(profile.mastery.rating, profile.settings.language))
      : `${copy.masterRatingLeaderboard.yourRating(formatMasterRating(current.score, profile.settings.language))} · ${copy.masterRatingLeaderboard.yourPlace(current.place)}`;
    status.setText(summary).setColor(current === null ? '#e2e9f2' : '#e8be72');

    const rows = [...snapshot.entries];
    if (current !== null && !rows.some((entry) => entry.isCurrentPlayer)) rows.push(current);
    rows.sort((left, right) => left.place - right.place);
    const uniqueRows = rows.filter((entry, index, all) => all.findIndex((candidate) => candidate.place === entry.place && candidate.publicName === entry.publicName) === index);
    const startY = panelTop + (this.scale.height < 520 ? 108 : 140);
    if (uniqueRows.length === 0) {
      this.renderEmptyStatus(panelTop, panelWidth, panelHeight, copy.leaderboard.noEntries);
      return;
    }
    const baseGap = this.scale.height < 520 ? 28 : this.scale.width < 700 ? 46 : 50;
    const topRows = uniqueRows.slice(0, 10);
    const ownRow = uniqueRows.find((entry) => entry.isCurrentPlayer);
    const visibleRows = ownRow !== undefined && !topRows.includes(ownRow)
      ? [...topRows.slice(0, 9), ownRow]
      : topRows;
    const available = panelTop + panelHeight - startY - (this.scale.height < 520 ? 20 : 34);
    const rowGap = visibleRows.length > 1 ? Math.min(baseGap, available / (visibleRows.length - 1)) : baseGap;
    visibleRows.forEach((entry, index) => this.renderRow(
      entry, startY + index * rowGap, panelWidth, rowGap, profile.settings.language,
    ));
  }

  private renderEmptyStatus(panelTop: number, panelWidth: number, panelHeight: number, message: string): void {
    const narrow = this.scale.width < 700;
    const messageY = panelTop + panelHeight * 0.56;
    createQuietInset(this, {
      x: this.scale.width / 2,
      y: messageY,
      width: panelWidth - (narrow ? 30 : 48),
      height: 70,
      borderAlpha: 0.28,
    });
    this.add.text(this.scale.width / 2, messageY, message, {
      fontFamily: "'Balsamiq Sans', sans-serif",
      fontSize: narrow ? '13px' : '16px',
      color: '#d2dce9',
      align: 'center',
      wordWrap: { width: panelWidth - 64 },
    }).setOrigin(0.5);
  }

  private renderRow(entry: LeaderboardPlayerView, y: number, panelWidth: number, rowGap: number, language: 'ru' | 'en'): void {
    const narrow = this.scale.width < 700;
    const left = this.scale.width / 2 - panelWidth / 2 + (narrow ? 26 : 40);
    const right = this.scale.width / 2 + panelWidth / 2 - (narrow ? 26 : 40);
    const color = entry.isCurrentPlayer ? '#f0d28a' : '#e0e8f2';
    createQuietInset(this, {
      x: this.scale.width / 2,
      y,
      width: right - left + (narrow ? 20 : 28),
      height: Math.max(22, rowGap - 5),
      radius: 7,
      fillAlpha: entry.isCurrentPlayer ? 0.94 : 0.72,
      borderAlpha: entry.isCurrentPlayer ? 0.62 : 0.18,
    });
    if (entry.isCurrentPlayer) {
      const marker = this.add.graphics();
      marker.lineStyle(2, 0xd9ae63, 0.9);
      marker.lineBetween(left - 10, y - rowGap * 0.25, left - 10, y + rowGap * 0.25);
    }
    this.add.text(left, y, `#${entry.place}`, {
      fontFamily: "'Balsamiq Sans', sans-serif", fontSize: narrow ? '14px' : '17px', color, fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const name = entry.publicName.trim().length > 0 ? entry.publicName : getUiCopy(language).leaderboard.playerFallback;
    const score = this.add.text(right, y, formatMasterRating(entry.score, language), {
      fontFamily: "'Balsamiq Sans', sans-serif", fontSize: narrow ? '14px' : '17px', color, fontStyle: 'bold',
    }).setOrigin(1, 0.5);
    const player = this.add.text(left + (narrow ? 34 : 49), y, name, {
      fontFamily: "'Balsamiq Sans', sans-serif", fontSize: narrow ? '14px' : '17px', color,
      fontStyle: entry.isCurrentPlayer ? 'bold' : 'normal',
    }).setOrigin(0, 0.5);
    const maxNameWidth = score.x - score.width - 14 - player.x;
    if (player.width > maxNameWidth && maxNameWidth > 0) {
      let visible = name;
      while (visible.length > 1 && player.width > maxNameWidth) {
        visible = visible.slice(0, -1);
        player.setText(`${visible}…`);
      }
    }
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
