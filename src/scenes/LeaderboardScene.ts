import Phaser from 'phaser';

import { ANALYTICS_SERVICE_REGISTRY_KEY, type AnalyticsService } from '../analytics/AnalyticsService';

import {
  decodeDailyLeaderboardScore,
  encodeDailyLeaderboardScore,
  getDailyLeaderboardName,
} from '../daily/DailyLeaderboard';
import { getUiCopy } from '../i18n/UiCopy';
import { PLATFORM_SERVICES_REGISTRY_KEY } from '../platform/PlatformRegistry';
import { isProfileAuthorizationReady, requestAuthorizationWithProfileMerge } from '../profile/ProfileAuthorization';
import type { LeaderboardPlayerView, LeaderboardSnapshot, PlatformServices } from '../platform/services';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import { createMaterialActionButton } from '../runtime/MaterialActionButton';
import {
  reindexDateFilteredLeaderboardRows,
  type DateFilteredLeaderboardRow,
  type DateFilteredLeaderboardSourceRow,
} from '../runtime/DailyLeaderboardPresentation';
import { createMetaPageHeader } from '../runtime/MetaPageHeader';
import { calculateMetaPageHeaderMetrics } from '../runtime/MetaPageHeaderLayout';
import { createSceneBackground } from '../runtime/SceneBackground';
import { createQuietInset } from '../runtime/QuietInset';
import { createSlateSurface } from '../runtime/SlateSurface';

export const LEADERBOARD_SCENE_KEY = 'LeaderboardScene';

const LEADERBOARD_CACHE_TTL_MS = 30_000;
const LEADERBOARD_STALE_FALLBACK_MS = 5 * 60_000;

interface CachedLeaderboardSnapshot {
  readonly snapshot: LeaderboardSnapshot;
  readonly fetchedAtMs: number;
}

const leaderboardSnapshotCache = new Map<string, CachedLeaderboardSnapshot>();

export interface LeaderboardSceneData {
  readonly dailyId: string;
  readonly dateKey: string;
}

type DecodedLeaderboardRow = DateFilteredLeaderboardRow<LeaderboardPlayerView>;
type DecodedLeaderboardSourceRow = DateFilteredLeaderboardSourceRow<LeaderboardPlayerView>;

interface LeaderboardLayout {
  readonly narrow: boolean;
  readonly compactHeight: boolean;
  readonly titleY: number;
  readonly subtitleY: number;
  readonly panelX: number;
  readonly panelTop: number;
  readonly panelWidth: number;
  readonly panelHeight: number;
  readonly infoY: number;
  readonly tableStartY: number;
  readonly rowGap: number;
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
      this.scene.start('DailyScene');
      return;
    }

    const sceneBackground = createSceneBackground(this, 'meta');
    const profileService = this.getProfileService();
    const copy = getUiCopy(profileService.getProfile().settings.language);
    const analytics = this.registry.get(ANALYTICS_SERVICE_REGISTRY_KEY) as AnalyticsService | undefined;
    analytics?.screenView('leaderboard');
    const layout = this.calculateLayout();

    createMetaPageHeader(this, {
      title: copy.leaderboard.title,
      backLabel: copy.common.back,
      backButton: true,
      onBack: () => this.scene.start('DailyScene'),
    });
    this.add.text(this.scale.width / 2, layout.subtitleY, copy.leaderboard.subtitle(this.formatDate(data.dateKey)), {
      fontFamily: "'Balsamiq Sans', sans-serif",
      fontSize: layout.compactHeight ? '11px' : layout.narrow ? '12px' : '15px',
      color: '#a7b3c8',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    createSlateSurface(this, layout.panelX, layout.panelTop + layout.panelHeight / 2,
      layout.panelWidth, layout.panelHeight);

    const status = this.add.text(layout.panelX, layout.tableStartY, copy.common.loading, {
      fontFamily: "'Balsamiq Sans', sans-serif",
      fontSize: layout.compactHeight ? '11px' : layout.narrow ? '12px' : '15px',
      color: '#c0cbda',
      align: 'center',
      wordWrap: { width: Math.max(180, layout.panelWidth - 48) },
    }).setOrigin(0.5, 0).setDepth(2);

    const result = profileService.getProfile().daily.results[data.dateKey];
    const leaderboardEligibleTimeMs = result !== undefined && result.minHintsUsed === 0
      ? result.bestTimeMs
      : null;
    const version = ++this.renderVersion;
    void this.renderLeaderboard(data, status, version, layout, leaderboardEligibleTimeMs, result?.bestTimeMs ?? null, result?.minHintsUsed ?? null);

    const handleResize = (): void => {
      sceneBackground.sync();
      if (this.scene.isActive()) this.scene.restart(data);
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
    });
  }

  private calculateLayout(): LeaderboardLayout {
    const width = this.scale.width;
    const height = this.scale.height;
    const header = calculateMetaPageHeaderMetrics(width, height);
    const narrow = header.narrow;
    const compactHeight = height < 520;
    const titleY = header.titleY;
    const subtitleY = Math.max(header.headerHeight + (compactHeight ? 10 : 16), titleY + (compactHeight ? 28 : 36));
    const panelTop = subtitleY + (compactHeight ? 22 : 30);
    const sideMargin = narrow ? 14 : 28;
    const panelWidth = Math.min(width - sideMargin * 2,
      narrow ? 460 : Math.min(840, Math.max(680, width * 0.52)));
    const panelHeight = Math.max(
      compactHeight ? 240 : narrow ? 300 : 360,
      Math.min(compactHeight ? 292 : narrow ? 490 : 500, height - panelTop - (compactHeight ? 12 : 28)),
    );
    const infoY = panelTop + (compactHeight ? 34 : 48);
    const tableStartY = panelTop + (compactHeight ? 108 : 140);
    const rowGap = compactHeight ? 26 : narrow ? 46 : 50;
    return {
      narrow,
      compactHeight,
      titleY,
      subtitleY,
      panelX: width / 2,
      panelTop,
      panelWidth,
      panelHeight,
      infoY,
      tableStartY,
      rowGap,
    };
  }

  private async renderLeaderboard(
    data: LeaderboardSceneData,
    status: Phaser.GameObjects.Text,
    version: number,
    layout: LeaderboardLayout,
    fixedScoreMs: number | null,
    savedResultMs: number | null,
    minHintsUsed: number | null,
  ): Promise<void> {
    const services = this.getPlatformServices();
    const profileService = this.getProfileService();
    const copy = getUiCopy(profileService.getProfile().settings.language);
    const leaderboardName = getDailyLeaderboardName(data.dailyId);
    const authorized = await isProfileAuthorizationReady(profileService, services.leaderboards);
    if (!this.isCurrent(version)) return;

    const cacheKey = `${leaderboardName}:${data.dateKey}:${authorized ? 'auth' : 'anon'}`;
    const nowMs = Date.now();
    const cached = leaderboardSnapshotCache.get(cacheKey) ?? null;
    const cachedAgeMs = cached === null ? Number.POSITIVE_INFINITY : nowMs - cached.fetchedAtMs;

    let table: LeaderboardSnapshot | null = cached !== null && cachedAgeMs <= LEADERBOARD_CACHE_TTL_MS
      ? cached.snapshot
      : await services.leaderboards.getEntries(leaderboardName, {
          quantityTop: 10,
          quantityAround: 2,
          includeUser: authorized,
        });
    if (!this.isCurrent(version)) return;

    if (table !== null && (cached === null || table !== cached.snapshot)) {
      leaderboardSnapshotCache.set(cacheKey, { snapshot: table, fetchedAtMs: nowMs });
    } else if (
      table === null
      && cached !== null
      && cachedAgeMs <= LEADERBOARD_STALE_FALLBACK_MS
    ) {
      table = cached.snapshot;
    }

    let rawCurrent = table?.currentPlayer ?? null;
    if (authorized && rawCurrent === null && table === null) {
      rawCurrent = await services.leaderboards.getPlayerEntry(leaderboardName);
      if (!this.isCurrent(version)) return;
    }

    if (authorized && fixedScoreMs !== null && !this.entryMatchesDate(rawCurrent, data.dateKey)) {
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
        rawCurrent = this.makeOptimisticCurrentEntry(
          table?.entries ?? [],
          data.dateKey,
          packedScore,
          copy.leaderboard.playerFallback,
        );
        table = table === null
          ? { entries: [], currentPlayer: rawCurrent }
          : { ...table, currentPlayer: rawCurrent };
        leaderboardSnapshotCache.set(cacheKey, { snapshot: table, fetchedAtMs: Date.now() });
        void this.refreshLeaderboardCacheAfterSubmit(services, leaderboardName, cacheKey, authorized);
      } else {
        console.warn('[Dungeon Logic] Daily leaderboard score submission was not accepted.', {
          leaderboardName,
          dateKey: data.dateKey,
          score: packedScore,
          submit,
        });
      }
    }

    const rawRows = table === null ? [] : [...table.entries];
    if (rawCurrent !== null && !rawRows.some((entry) => entry.isCurrentPlayer)) {
      rawRows.push(rawCurrent);
    }
    const decodedRows = this.decodeRowsForDate(rawRows, data.dateKey);
    const decodedCurrent = decodedRows.find((row) => row.entry.isCurrentPlayer) ?? null;

    const detailBottomY = this.renderPlayerSummary(
      layout,
      savedResultMs,
      minHintsUsed,
      decodedCurrent?.displayPlace ?? null,
    );

    let tableStartY = layout.tableStartY;
    if (!authorized && services.kind === 'yandex') {
      const authBottomY = this.renderAuthOffer(data, version, layout, detailBottomY);
      tableStartY = Math.max(tableStartY, authBottomY + (layout.compactHeight ? 8 : 12));
    }
    status.setY(tableStartY);
    if (services.kind === 'local') {
      status.setText(copy.leaderboard.localUnavailable);
      this.placeEmptyStatus(status, layout, tableStartY);
      return;
    }

    if (decodedRows.length === 0) {
      status.setText(table === null ? copy.leaderboard.unavailable : copy.leaderboard.noEntries);
      this.placeEmptyStatus(status, layout, tableStartY);
      return;
    }

    status.setVisible(false);
    this.renderRows(
      decodedRows,
      copy.leaderboard.playerFallback,
      copy.leaderboard.currentPlayerSuffix,
      layout,
      tableStartY,
    );
  }

  private placeEmptyStatus(
    status: Phaser.GameObjects.Text,
    layout: LeaderboardLayout,
    tableStartY: number,
  ): void {
    const panelBottom = layout.panelTop + layout.panelHeight;
    const messageY = Math.max(tableStartY + 34, (tableStartY + panelBottom) / 2);
    createQuietInset(this, {
      x: layout.panelX,
      y: messageY,
      width: layout.panelWidth - (layout.narrow ? 30 : 48),
      height: layout.compactHeight ? 54 : 70,
      borderAlpha: 0.28,
    });
    status.setPosition(layout.panelX, messageY).setOrigin(0.5).setColor('#d2dce9');
  }


  private makeOptimisticCurrentEntry(
    entries: readonly LeaderboardPlayerView[],
    dateKey: string,
    score: number,
    fallbackName: string,
  ): LeaderboardPlayerView {
    const sameDate = entries
      .filter((entry) => this.entryMatchesDate(entry, dateKey))
      .sort((left, right) => right.score - left.score);
    const insertionIndex = sameDate.findIndex((entry) => score > entry.score);
    const index = insertionIndex < 0 ? sameDate.length : insertionIndex;

    let place = 1;
    if (sameDate.length > 0) {
      if (index === 0) place = sameDate[0]!.place - 0.5;
      else if (index === sameDate.length) place = sameDate[sameDate.length - 1]!.place + 0.5;
      else place = (sameDate[index - 1]!.place + sameDate[index]!.place) / 2;
    }

    return {
      place,
      score,
      publicName: fallbackName,
      avatarUrl: null,
      isCurrentPlayer: true,
    };
  }

  private async refreshLeaderboardCacheAfterSubmit(
    services: PlatformServices,
    leaderboardName: string,
    cacheKey: string,
    includeUser: boolean,
  ): Promise<void> {
    const refreshed = await services.leaderboards.getEntries(leaderboardName, {
      quantityTop: 10,
      quantityAround: 2,
      includeUser,
    });
    if (refreshed !== null) {
      leaderboardSnapshotCache.set(cacheKey, { snapshot: refreshed, fetchedAtMs: Date.now() });
    }
  }

  private renderPlayerSummary(
    layout: LeaderboardLayout,
    resultMs: number | null,
    minHintsUsed: number | null,
    place: number | null,
  ): number {
    const copy = getUiCopy(this.getProfileService().getProfile().settings.language);
    const summaryHeight = layout.compactHeight ? 58 : layout.narrow ? 72 : 76;
    createQuietInset(this, {
      x: layout.panelX,
      y: layout.infoY + (layout.compactHeight ? 12 : 14),
      width: layout.panelWidth - (layout.narrow ? 30 : 48),
      height: summaryHeight,
      borderAlpha: 0.38,
    });
    const summary = resultMs === null
      ? copy.leaderboard.noResult
      : copy.leaderboard.yourResult(this.formatTime(resultMs));
    this.add.text(layout.panelX, layout.infoY, summary, {
      fontFamily: "'Balsamiq Sans', sans-serif",
      fontSize: layout.compactHeight ? '12px' : layout.narrow ? '15px' : '20px',
      color: resultMs === null ? '#d8e0eb' : '#f4ead7',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const detail = place !== null
      ? copy.leaderboard.yourPlace(place)
      : resultMs !== null && minHintsUsed !== null && minHintsUsed > 0
        ? copy.leaderboard.assistedResult
        : resultMs !== null
          ? copy.leaderboard.firstResultOnly
          : copy.leaderboard.playToRank;
    const detailText = this.add.text(layout.panelX, layout.infoY + (layout.compactHeight ? 22 : 30), detail, {
      fontFamily: "'Balsamiq Sans', sans-serif",
      fontSize: layout.compactHeight ? '10px' : layout.narrow ? '12px' : '15px',
      color: place !== null ? '#f0bd63' : '#b8c5d7',
      fontStyle: place !== null ? 'bold' : 'normal',
      align: 'center',
      wordWrap: { width: Math.max(180, layout.panelWidth - 50) },
    }).setOrigin(0.5);
    return detailText.y + detailText.displayHeight / 2;
  }

  private renderAuthOffer(
    data: LeaderboardSceneData,
    version: number,
    layout: LeaderboardLayout,
    detailBottomY: number,
  ): number {
    const copy = getUiCopy(this.getProfileService().getProfile().settings.language);
    const buttonWidth = Math.min(layout.panelWidth - 32, layout.compactHeight ? 200 : 280);
    const buttonHeight = layout.compactHeight ? 48 : 54;
    const authButtonY = Math.max(
      detailBottomY + (layout.compactHeight ? 8 : 12) + buttonHeight / 2,
      layout.infoY + (layout.compactHeight ? 50 : layout.narrow ? 62 : 68),
    );
    const button = createMaterialActionButton(this, {
      x: layout.panelX,
      y: authButtonY,
      width: buttonWidth,
      height: buttonHeight,
      label: copy.leaderboard.signIn,
      variant: 'secondary',
      compact: false,
      onActivate: () => {
        button.surface.disableInteractive();
        button.label.setText(copy.common.loading);
        void requestAuthorizationWithProfileMerge(
          this.getProfileService(),
          this.getPlatformServices().leaderboards,
        ).then((ok) => {
            if (!this.isCurrent(version)) return;
            if (!ok) {
              button.label.setText(copy.leaderboard.signIn);
              button.surface.setInteractive({ useHandCursor: true });
              return;
            }
            this.scene.restart(data);
          });
      },
    });
    return authButtonY + buttonHeight / 2;
  }

  private entryMatchesDate(entry: LeaderboardPlayerView | null, dateKey: string): boolean {
    if (entry === null) return false;
    return decodeDailyLeaderboardScore(entry.score)?.dateKey === dateKey;
  }

  private decodeRowsForDate(
    rawEntries: readonly LeaderboardPlayerView[],
    dateKey: string,
  ): readonly DecodedLeaderboardRow[] {
    const decodedRows: DecodedLeaderboardSourceRow[] = rawEntries.flatMap((entry) => {
      const decoded = decodeDailyLeaderboardScore(entry.score);
      if (decoded === null || decoded.dateKey !== dateKey) return [];
      return [{ entry, timeMs: decoded.timeMs }];
    });
    return reindexDateFilteredLeaderboardRows(decodedRows);
  }

  private renderRows(
    rawEntries: readonly DecodedLeaderboardRow[],
    fallbackName: string,
    currentSuffix: string,
    layout: LeaderboardLayout,
    tableStartY: number,
  ): void {
    const entries = rawEntries.slice(0, 10);
    const left = layout.panelX - layout.panelWidth / 2 + (layout.narrow ? 26 : 40);
    const right = layout.panelX + layout.panelWidth / 2 - (layout.narrow ? 26 : 40);
    const rowWidth = right - left;
    const panelBottom = layout.panelTop + layout.panelHeight;
    const availableRowHeight = Math.max(1, panelBottom - tableStartY - (layout.compactHeight ? 20 : 34));
    const rowGap = entries.length > 1
      ? Math.min(layout.rowGap, availableRowHeight / (entries.length - 1))
      : layout.rowGap;

    entries.forEach((row, index) => {
      const entry = row.entry;
      const y = tableStartY + index * rowGap;
      const current = entry.isCurrentPlayer;
      createQuietInset(this, {
        x: layout.panelX,
        y,
        width: rowWidth + (layout.narrow ? 20 : 28),
        height: Math.max(21, rowGap - (layout.compactHeight ? 3 : 5)),
        radius: 7,
        fillAlpha: current ? 0.94 : 0.72,
        borderAlpha: current ? 0.62 : 0.18,
      });
      if (current) {
        const highlight = this.add.graphics();
        highlight.lineStyle(2, 0xd9ae63, 0.9);
        highlight.lineBetween(left - 10, y - rowGap * 0.25, left - 10, y + rowGap * 0.25);
      }
      const name = entry.publicName.trim().length > 0 ? entry.publicName : fallbackName;
      this.add.text(left, y, `#${row.displayPlace}`, {
        fontFamily: "'Balsamiq Sans', sans-serif",
        fontSize: layout.compactHeight ? '11px' : layout.narrow ? '14px' : '17px',
        color: current ? '#f0d28a' : '#d6e0ec',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      const time = this.add.text(right, y, this.formatTime(row.timeMs), {
        fontFamily: "'Balsamiq Sans', sans-serif",
        fontSize: layout.compactHeight ? '11px' : layout.narrow ? '14px' : '17px',
        color: current ? '#f0d28a' : '#e0e8f2',
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      const suffix = current ? currentSuffix : '';
      const playerText = this.add.text(left + (layout.narrow ? 34 : 49), y,
        `${name}${suffix}`, {
          fontFamily: "'Balsamiq Sans', sans-serif",
          fontSize: layout.compactHeight ? '11px' : layout.narrow ? '14px' : '17px',
          color: current ? '#f0d28a' : '#e0e8f2',
          fontStyle: current ? 'bold' : 'normal',
        }).setOrigin(0, 0.5);
      const playerMaxWidth = time.x - time.width - 14 - playerText.x;
      if (playerText.width > playerMaxWidth && playerMaxWidth > 0) {
        let visibleName = name;
        while (visibleName.length > 1 && playerText.width > playerMaxWidth) {
          visibleName = visibleName.slice(0, -1);
          playerText.setText(`${visibleName}…${suffix}`);
        }
      }
    });
  }

  private isCurrent(version: number): boolean {
    return this.scene.isActive() && version === this.renderVersion;
  }

  private formatDate(dateKey: string): string {
    const [year = '', month = '', day = ''] = dateKey.split('-');
    return `${day}.${month}.${year}`;
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
