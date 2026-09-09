import Phaser from 'phaser';

import {
  decodeDailyLeaderboardScore,
  encodeDailyLeaderboardScore,
  getDailyLeaderboardName,
} from '../daily/DailyLeaderboard';
import { getUiCopy } from '../i18n/UiCopy';
import { PLATFORM_SERVICES_REGISTRY_KEY } from '../platform/PlatformRegistry';
import type { LeaderboardPlayerView, PlatformServices } from '../platform/services';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import { HOME_SCENE_KEY } from '../runtime/MetaSelectors';

export const LEADERBOARD_SCENE_KEY = 'LeaderboardScene';

export interface LeaderboardSceneData {
  readonly dailyId: string;
  readonly dateKey: string;
}

interface DecodedLeaderboardRow {
  readonly entry: LeaderboardPlayerView;
  readonly timeMs: number;
}

export class LeaderboardScene extends Phaser.Scene {
  private launchData: LeaderboardSceneData | null = null;
  private renderVersion = 0;

  constructor() {
    super(LEADERBOARD_SCENE_KEY);
  }

  init(data: LeaderboardSceneData): void {
    this.launchData = data;
  }

  create(): void {
    const data = this.launchData;
    if (data === null) {
      this.scene.start(HOME_SCENE_KEY);
      return;
    }

    const profileService = this.getProfileService();
    const copy = getUiCopy(profileService.getProfile().settings.language);
    const width = this.scale.width;
    const narrow = width < 700;

    this.add.text(16, 18, copy.leaderboard.back, {
      fontFamily: 'monospace',
      fontSize: narrow ? '12px' : '14px',
      color: '#89929d',
      fontStyle: 'bold',
    }).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on('pointerup', () => {
      this.scene.start(HOME_SCENE_KEY);
    });

    this.add.text(width / 2, narrow ? 60 : 70, copy.leaderboard.title, {
      fontFamily: 'monospace',
      fontSize: narrow ? '20px' : '25px',
      color: '#f0e6d2',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const result = profileService.getProfile().daily.results[data.dateKey];
    if (result !== undefined) {
      this.add.text(width / 2, narrow ? 94 : 108, copy.leaderboard.yourResult(this.formatTime(result.bestTimeMs)), {
        fontFamily: 'monospace',
        fontSize: narrow ? '13px' : '15px',
        color: '#d0b978',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.add.text(
        width / 2,
        narrow ? 118 : 134,
        result.minHintsUsed > 0 ? copy.game.dailyArchiveOutsideRating : copy.leaderboard.firstResultOnly,
        {
        fontFamily: 'monospace',
        fontSize: narrow ? '10px' : '12px',
        color: '#89929d',
      }).setOrigin(0.5);
    }

    const status = this.add.text(width / 2, narrow ? 160 : 182, copy.common.loading, {
      fontFamily: 'monospace',
      fontSize: narrow ? '12px' : '14px',
      color: '#89929d',
      align: 'center',
      wordWrap: { width: Math.max(220, width - 40) },
    }).setOrigin(0.5, 0);

    const version = ++this.renderVersion;
    const leaderboardEligibleTimeMs = result !== undefined && result.minHintsUsed === 0
      ? result.bestTimeMs
      : null;
    void this.renderLeaderboard(data, status, version, narrow, leaderboardEligibleTimeMs);

    const handleResize = (): void => {
      if (this.scene.isActive()) this.scene.restart(data);
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
    });
  }

  private async renderLeaderboard(
    data: LeaderboardSceneData,
    status: Phaser.GameObjects.Text,
    version: number,
    narrow: boolean,
    fixedScoreMs: number | null,
  ): Promise<void> {
    const services = this.getPlatformServices();
    const profileService = this.getProfileService();
    const copy = getUiCopy(profileService.getProfile().settings.language);
    const leaderboardName = getDailyLeaderboardName(data.dailyId);
    const authorized = await services.leaderboards.isAuthorized();
    if (!this.isCurrent(version)) return;

    let current: LeaderboardPlayerView | null = null;
    if (authorized && fixedScoreMs !== null) {
      const packedScore = encodeDailyLeaderboardScore(data.dateKey, fixedScoreMs);
      const submit = await services.leaderboards.submitScore(
        leaderboardName,
        packedScore,
        JSON.stringify({
          dailyId: data.dailyId,
          dateKey: data.dateKey,
          timeMs: Math.floor(fixedScoreMs),
        }),
      );
      if (submit === 'submitted') {
        current = await services.leaderboards.getPlayerEntry(leaderboardName);
      }
    }
    if (!this.isCurrent(version)) return;

    const table = await services.leaderboards.getEntries(leaderboardName, {
      quantityTop: 10,
      quantityAround: 2,
      includeUser: authorized,
    });
    if (!this.isCurrent(version)) return;

    const decodedRows = table === null
      ? []
      : this.decodeRowsForDate(table.entries, data.dateKey);
    const rawCurrent = current ?? table?.currentPlayer ?? null;
    const decodedCurrent = rawCurrent === null
      ? null
      : this.decodeRowForDate(rawCurrent, data.dateKey);

    if (!authorized && fixedScoreMs !== null) {
      this.renderAuthOffer(data, status, version, narrow);
    } else if (table === null) {
      status.setText(copy.leaderboard.unavailable);
    } else if (decodedRows.length === 0) {
      status.setText(copy.leaderboard.noEntries);
    } else {
      status.setVisible(false);
    }

    if (decodedCurrent !== null) {
      this.add.text(
        this.scale.width / 2,
        narrow ? 146 : 158,
        copy.leaderboard.yourPlace(decodedCurrent.entry.place),
        {
          fontFamily: 'monospace',
          fontSize: narrow ? '13px' : '15px',
          color: '#f0d28a',
          fontStyle: 'bold',
        },
      ).setOrigin(0.5);
    }

    if (decodedRows.length > 0) {
      this.renderRows(decodedRows, copy.leaderboard.playerFallback, copy.leaderboard.currentPlayerSuffix, narrow);
    }
  }

  private decodeRowsForDate(
    rawEntries: readonly LeaderboardPlayerView[],
    dateKey: string,
  ): readonly DecodedLeaderboardRow[] {
    return rawEntries.flatMap((entry) => {
      const decoded = decodeDailyLeaderboardScore(entry.score);
      if (decoded === null || decoded.dateKey !== dateKey) return [];
      return [{ entry, timeMs: decoded.timeMs }];
    });
  }

  private decodeRowForDate(
    entry: LeaderboardPlayerView,
    dateKey: string,
  ): DecodedLeaderboardRow | null {
    const decoded = decodeDailyLeaderboardScore(entry.score);
    if (decoded === null || decoded.dateKey !== dateKey) return null;
    return { entry, timeMs: decoded.timeMs };
  }

  private renderAuthOffer(
    data: LeaderboardSceneData,
    status: Phaser.GameObjects.Text,
    version: number,
    narrow: boolean,
  ): void {
    const copy = getUiCopy(this.getProfileService().getProfile().settings.language);
    status.setText(`${copy.leaderboard.signInTitle}\n${copy.leaderboard.signInBody}`);

    const y = narrow ? 220 : 238;
    const width = Math.min(this.scale.width - 40, 260);
    const button = this.add.rectangle(this.scale.width / 2, y, width, 46, 0x2a3038, 1)
      .setStrokeStyle(1, 0xd0b978)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(this.scale.width / 2, y, copy.leaderboard.signIn, {
      fontFamily: 'monospace',
      fontSize: narrow ? '13px' : '15px',
      color: '#f0d28a',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    button.on('pointerup', () => {
      button.disableInteractive();
      label.setText(copy.common.loading);
      void this.getPlatformServices().leaderboards.requestAuthorization()
        .then((ok) => {
          if (!this.isCurrent(version)) return;
          if (!ok) {
            label.setText(copy.leaderboard.signIn);
            button.setInteractive({ useHandCursor: true });
            return;
          }
          this.scene.restart(data);
        });
    });
  }

  private renderRows(
    rawEntries: readonly DecodedLeaderboardRow[],
    fallbackName: string,
    currentSuffix: string,
    narrow: boolean,
  ): void {
    const unique = new Map<number, DecodedLeaderboardRow>();
    for (const row of rawEntries) unique.set(row.entry.place, row);
    const entries = [...unique.values()].sort((left, right) => left.entry.place - right.entry.place);
    const startY = narrow ? 290 : 300;
    const rowGap = narrow ? 30 : 34;
    const left = Math.max(24, this.scale.width / 2 - Math.min(300, this.scale.width * 0.42));
    const right = Math.min(this.scale.width - 24, this.scale.width / 2 + Math.min(300, this.scale.width * 0.42));

    entries.forEach((row, index) => {
      const entry = row.entry;
      const y = startY + index * rowGap;
      const name = entry.publicName.trim().length > 0 ? entry.publicName : fallbackName;
      this.add.text(left, y, `#${entry.place}  ${name}${entry.isCurrentPlayer ? currentSuffix : ''}`, {
        fontFamily: 'monospace',
        fontSize: narrow ? '11px' : '13px',
        color: entry.isCurrentPlayer ? '#f0d28a' : '#d8d1c4',
        fontStyle: entry.isCurrentPlayer ? 'bold' : 'normal',
      }).setOrigin(0, 0.5);
      this.add.text(right, y, this.formatTime(row.timeMs), {
        fontFamily: 'monospace',
        fontSize: narrow ? '11px' : '13px',
        color: entry.isCurrentPlayer ? '#f0d28a' : '#aeb4bc',
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);
    });
  }

  private isCurrent(version: number): boolean {
    return this.scene.isActive() && version === this.renderVersion;
  }

  private formatTime(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  private getPlatformServices(): PlatformServices {
    const services = this.registry.get(PLATFORM_SERVICES_REGISTRY_KEY) as PlatformServices | undefined;
    if (services === undefined) throw new Error('LeaderboardScene requires PlatformServices.');
    return services;
  }

  private getProfileService(): PlayerProfileService {
    const service = this.registry.get(PLAYER_PROFILE_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof PlayerProfileService)) {
      throw new Error('LeaderboardScene requires PlayerProfileService.');
    }
    return service;
  }
}
