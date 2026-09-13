import Phaser from 'phaser';

import { ANALYTICS_SERVICE_REGISTRY_KEY, type AnalyticsService } from '../analytics/AnalyticsService';

import { getAudioFeedback } from '../audio/AudioFeedbackService';
import { DAILY_RELEASE_DATE_KEYS } from '../content/daily/manifest';
import { DAILY_SERVICE_REGISTRY_KEY, DailyService } from '../daily/DailyService';
import { getUiCopy } from '../i18n/UiCopy';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import { createMetaPageHeader } from '../runtime/MetaPageHeader';
import { HOME_SCENE_KEY, STATS_SCENE_KEY, isDailyUnlocked } from '../runtime/MetaSelectors';
import { calculateStatsLayout, type StatsLayout, type StatsSummaryCardLayout } from '../runtime/StatsLayout';
import { getStatsViewModel, type StatsViewModel } from '../runtime/StatsSelectors';
import { createSceneBackground } from '../runtime/SceneBackground';
import { DAILY_SCENE_KEY } from './DailyScene';

interface StatsCardContent {
  readonly title: string;
  readonly iconKey: string;
  readonly lines: readonly string[];
  readonly action?: () => void;
}

export class StatsScene extends Phaser.Scene {
  private copy = getUiCopy('ru');
  private createVersion = 0;

  constructor() {
    super(STATS_SCENE_KEY);
  }

  create(): void {
    const createVersion = this.createVersion + 1;
    this.createVersion = createVersion;

    const sceneBackground = createSceneBackground(this, 'meta');
    this.copy = getUiCopy(this.getProfileService().getProfile().settings.language);
    const analytics = this.registry.get(ANALYTICS_SERVICE_REGISTRY_KEY) as AnalyticsService | undefined;
    analytics?.screenView('statistics');
    const layout = calculateStatsLayout(this.scale.width, this.scale.height);
    const narrow = layout.viewportClass === 'narrow';

    createMetaPageHeader(this, {
      title: this.copy.stats.title,
      backLabel: this.copy.common.back,
      backButton: true,
      fixedBack: true,
      onBack: () => this.scene.start(HOME_SCENE_KEY),
    });

    const loading = this.add.text(
      this.scale.width / 2,
      layout.summaryCards[0]?.y ?? this.scale.height / 2,
      this.copy.common.loading,
      {
        fontFamily: 'monospace',
        fontSize: narrow ? '13px' : '15px',
        color: '#7f8ba2',
        fontStyle: 'bold',
      },
    ).setOrigin(0.5);

    void this.renderStats(layout, createVersion).finally(() => {
      if (loading.active) loading.destroy();
    });

    const handleResize = (): void => {
      sceneBackground.sync();
      if (this.scene.isActive()) this.scene.restart();
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
    });
  }

  private async renderStats(layout: StatsLayout, createVersion: number): Promise<void> {
    let todayDateKey: string | null = null;
    try {
      todayDateKey = (await this.getDailyService().getToday())?.dateKey ?? null;
    } catch (error) {
      console.warn('[Dungeon Logic] Could not resolve trusted date for Statistics.', error);
    }
    if (!this.scene.isActive() || createVersion !== this.createVersion) return;

    const profile = this.getProfileService().getProfile();
    const stats = getStatsViewModel(profile, todayDateKey, DAILY_RELEASE_DATE_KEYS);
    this.renderSummaryCards(layout, stats, isDailyUnlocked(profile));
  }

  private renderSummaryCards(layout: StatsLayout, stats: StatsViewModel, dailyUnlocked: boolean): void {
    const currentStreak = stats.daily.currentStreak === null ? '—' : String(stats.daily.currentStreak);
    const cards: readonly StatsCardContent[] = [
      {
        title: this.copy.stats.campaign,
        iconKey: 'home-menu-icon-levels',
        lines: [
          this.copy.stats.solved(stats.campaign.solved, stats.campaign.total),
          this.copy.stats.withoutHints(stats.campaign.solvedWithoutHints),
        ],
      },
      {
        title: this.copy.stats.daily,
        iconKey: 'home-menu-icon-daily',
        lines: [
          this.copy.stats.totalSolved(stats.daily.totalSolved),
          this.copy.stats.streakBest(currentStreak, stats.daily.bestStreak),
          this.copy.stats.withoutHints(stats.daily.solvedWithoutHints),
        ],
        action: dailyUnlocked ? () => this.scene.start(DAILY_SCENE_KEY) : undefined,
      },
      {
        title: this.copy.stats.overall,
        iconKey: 'home-menu-icon-statistics',
        lines: [
          this.copy.stats.puzzlesSolved(stats.overall.totalPuzzlesSolved),
          this.copy.stats.hints(stats.overall.totalHintsUsed),
          this.copy.stats.activeTime(this.formatDuration(stats.overall.activePlayMs)),
        ],
      },
    ];

    cards.forEach((card, index) => {
      const cardLayout = layout.summaryCards[index];
      if (cardLayout !== undefined) this.renderSummaryCard(layout, cardLayout, card);
    });
  }

  private renderSummaryCard(
    layout: StatsLayout,
    card: StatsSummaryCardLayout,
    content: StatsCardContent,
  ): void {
    const narrow = layout.viewportClass === 'narrow';
    const isColumns = layout.mode === 'columns';
    const compactVertical = layout.mode === 'vertical' && this.scale.height < 660;
    const radius = isColumns ? 10 : 12;
    const panel = this.add.graphics();
    panel.fillStyle(0x1f2c4a, 0.96);
    panel.fillRoundedRect(card.x - card.width / 2, card.y - card.height / 2, card.width, card.height, radius);
    panel.lineStyle(1, 0x4b6386, 0.82);
    panel.strokeRoundedRect(card.x - card.width / 2, card.y - card.height / 2, card.width, card.height, radius);

    const hoverOverlay = this.add.rectangle(
      card.x,
      card.y,
      card.width - 2,
      card.height - 2,
      0x5b7eb1,
      0,
    );
    if (content.action !== undefined) {
      hoverOverlay.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          hoverOverlay.setFillStyle(0x5b7eb1, 0.12);
          getAudioFeedback(this).play('ui-hover');
        })
        .on('pointerout', () => hoverOverlay.setFillStyle(0x5b7eb1, 0))
        .on('pointerdown', () => hoverOverlay.setFillStyle(0x5b7eb1, 0.2))
        .on('pointerup', () => {
          hoverOverlay.setFillStyle(0x5b7eb1, 0.12);
          getAudioFeedback(this).play('ui-click');
          content.action?.();
        });
    }

    const iconSize = isColumns ? 22 : compactVertical ? 28 : narrow ? 28 : 32;
    const titleFontSize = isColumns ? 14 : compactVertical ? 18 : narrow ? 18 : 20;
    const titleY = card.y - card.height / 2 + (isColumns ? 30 : compactVertical ? 32 : narrow ? 36 : 42);
    const icon = this.add.image(card.x, titleY, content.iconKey)
      .setDisplaySize(iconSize, iconSize)
      .setTint(0xf0b14f);
    const title = this.add.text(card.x, titleY, content.title, {
      fontFamily: 'monospace',
      fontSize: `${titleFontSize}px`,
      color: '#f0bd63',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const gap = isColumns ? 7 : 10;
    const groupWidth = icon.displayWidth + gap + title.width;
    const startX = card.x - groupWidth / 2;
    icon.setX(startX + icon.displayWidth / 2);
    title.setX(startX + icon.displayWidth + gap);

    const lineFontSize = isColumns ? 11 : compactVertical ? 17 : narrow ? 16 : 20;
    const lineGap = isColumns ? 25 : compactVertical ? 24 : narrow ? 23 : 30;
    const firstLineY = card.y - card.height / 2 + (
      isColumns
        ? 86
        : compactVertical
          ? content.lines.length >= 3 ? 72 : 83
          : narrow
            ? content.lines.length >= 3 ? 76 : 88
            : content.lines.length >= 3 ? 86 : 98
    );
    content.lines.forEach((line, index) => {
      this.add.text(card.x, firstLineY + index * lineGap, line, {
        fontFamily: 'monospace',
        fontSize: `${lineFontSize}px`,
        color: index === 0 ? '#f4ead7' : '#b8c2d4',
        fontStyle: index === 0 ? 'bold' : 'normal',
        align: 'center',
      }).setOrigin(0.5);
    });
  }

  private formatDuration(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  private getProfileService(): PlayerProfileService {
    const service = this.registry.get(PLAYER_PROFILE_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof PlayerProfileService)) {
      throw new Error('StatsScene requires PlayerProfileService in Phaser registry.');
    }
    return service;
  }

  private getDailyService(): DailyService {
    const service = this.registry.get(DAILY_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof DailyService)) {
      throw new Error('StatsScene requires DailyService in Phaser registry.');
    }
    return service;
  }
}
