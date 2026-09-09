import Phaser from 'phaser';

import { getUiCopy } from '../i18n/UiCopy';

import { DAILY_RELEASE_DATE_KEYS } from '../content/daily/manifest';
import { DAILY_SERVICE_REGISTRY_KEY, DailyService } from '../daily/DailyService';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import {
  HOME_SCENE_KEY,
  STATS_SCENE_KEY,
} from '../runtime/MetaSelectors';
import { MetaPointerGate } from '../runtime/MetaPointerGate';
import {
  clampMetaScrollY,
  getMetaScrollMaxY,
  isMetaScrollDrag,
} from '../runtime/MetaScroll';
import {
  calculateStatsLayout,
  type StatsLayout,
  type StatsSummaryCardLayout,
} from '../runtime/StatsLayout';
import {
  getStatsViewModel,
  type DailyMonthCalendarView,
  type StatsViewModel,
} from '../runtime/StatsSelectors';

export class StatsScene extends Phaser.Scene {
  private copy = getUiCopy('ru');
  private createVersion = 0;
  private contentBottom = 0;
  private scrollMaxY = 0;
  private scrollPointerId: number | null = null;
  private scrollStartPointerY = 0;
  private scrollStartCameraY = 0;
  private scrollGestureDragged = false;
  private lastDraggedPointerId: number | null = null;
  private lastDragEndedAtMs = 0;
  private readonly pointerGate = new MetaPointerGate();

  constructor() {
    super(STATS_SCENE_KEY);
  }

  create(): void {
    const createVersion = this.createVersion + 1;
    this.createVersion = createVersion;
    this.contentBottom = 0;
    this.scrollMaxY = 0;
    this.pointerGate.reset();
    this.cameras.main.setScroll(0, 0);

    this.copy = getUiCopy(this.getProfileService().getProfile().settings.language);
    const layout = calculateStatsLayout(this.scale.width, this.scale.height);
    this.renderFixedHeader(layout);
    this.setupPointerOwnership();

    const loading = this.add.text(this.scale.width / 2, layout.summaryCards[0].y, this.copy.common.loading, {
      fontFamily: 'monospace',
      fontSize: layout.viewportClass === 'narrow' ? '14px' : '16px',
      color: '#6f7780',
    }).setOrigin(0.5);

    void this.renderStats(layout, createVersion).finally(() => {
      if (loading.active) loading.destroy();
    });

    const handleResize = (): void => {
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
    this.renderSummaryCards(layout, stats);
    this.renderCalendar(layout, stats.calendar);
    this.contentBottom = stats.calendar === null
      ? layout.calendar.titleY + 70
      : layout.contentBottom;
    this.setupMetaScroll();
  }

  private renderFixedHeader(layout: StatsLayout): void {
    const headerHeight = layout.viewportClass === 'narrow' ? 92 : 102;
    this.add.rectangle(
      this.scale.width / 2,
      headerHeight / 2,
      this.scale.width,
      headerHeight,
      0x111318,
      1,
    ).setScrollFactor(0).setDepth(1000);

    const back = this.add.text(16, 18, this.copy.common.backHome, {
      fontFamily: 'monospace',
      fontSize: layout.viewportClass === 'narrow' ? '12px' : '14px',
      color: '#89929d',
      fontStyle: 'bold',
    }).setOrigin(0, 0).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(1002);
    back.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.shouldActivatePointer(pointer)) return;
      this.scene.start(HOME_SCENE_KEY);
    });

    this.add.text(this.scale.width / 2, layout.titleY, this.copy.stats.title, {
      fontFamily: 'monospace',
      fontSize: `${layout.titleFontSize}px`,
      color: '#f0e6d2',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002);
  }

  private renderSummaryCards(layout: StatsLayout, stats: StatsViewModel): void {
    const currentStreak = stats.daily.currentStreak === null ? '—' : String(stats.daily.currentStreak);
    const cards = [
      {
        title: this.copy.stats.campaign,
        lines: [
          this.copy.stats.solved(stats.campaign.solved, stats.campaign.total),
          this.copy.stats.withoutHints(stats.campaign.solvedWithoutHints),
        ],
      },
      {
        title: this.copy.stats.daily,
        lines: [
          this.copy.stats.totalSolved(stats.daily.totalSolved),
          this.copy.stats.streakBest(currentStreak, stats.daily.bestStreak),
          this.copy.stats.withoutHints(stats.daily.solvedWithoutHints),
        ],
      },
      {
        title: this.copy.stats.overall,
        lines: [
          this.copy.stats.activeTime(this.formatDuration(stats.overall.activePlayMs)),
          this.copy.stats.puzzlesSolved(stats.overall.totalPuzzlesSolved),
          this.copy.stats.hints(stats.overall.totalHintsUsed),
        ],
      },
    ] as const;

    cards.forEach((card, index) => {
      this.renderSummaryCard(layout, layout.summaryCards[index], card.title, card.lines);
    });
  }

  private renderSummaryCard(
    layout: StatsLayout,
    card: StatsSummaryCardLayout,
    title: string,
    lines: readonly string[],
  ): void {
    this.add.rectangle(card.x, card.y, card.width, card.height, 0x1b2027, 1)
      .setStrokeStyle(1, 0x4b535d);
    this.add.text(card.x, card.y - card.height / 2 + 22, title, {
      fontFamily: 'monospace',
      fontSize: layout.viewportClass === 'narrow' ? '15px' : '17px',
      color: '#d0b978',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const lineSize = layout.viewportClass === 'narrow' ? 12 : 14;
    const lineGap = layout.viewportClass === 'narrow' ? 20 : 24;
    const firstY = card.y - lineGap + 8;
    lines.forEach((line, index) => {
      this.add.text(card.x, firstY + index * lineGap, line, {
        fontFamily: 'monospace',
        fontSize: `${lineSize}px`,
        color: '#d8d1c4',
      }).setOrigin(0.5);
    });
  }

  private renderCalendar(layout: StatsLayout, calendar: DailyMonthCalendarView | null): void {
    if (calendar === null) {
      this.add.text(
        this.scale.width / 2,
        layout.calendar.titleY,
        this.copy.stats.dailyCalendar,
        {
          fontFamily: 'monospace',
          fontSize: layout.viewportClass === 'narrow' ? '16px' : '19px',
          color: '#d0b978',
          fontStyle: 'bold',
        },
      ).setOrigin(0.5);
      this.add.text(
        this.scale.width / 2,
        layout.calendar.titleY + 38,
        this.copy.stats.noTrustedDate,
        {
          fontFamily: 'monospace',
          fontSize: layout.viewportClass === 'narrow' ? '11px' : '13px',
          color: '#6f7780',
        },
      ).setOrigin(0.5);
      return;
    }

    const monthName = this.copy.stats.months[calendar.month - 1] ?? String(calendar.month);
    this.add.text(
      layout.calendar.centerX,
      layout.calendar.titleY,
      this.copy.stats.dailyMonth(monthName, calendar.year),
      {
        fontFamily: 'monospace',
        fontSize: layout.viewportClass === 'narrow' ? '16px' : '19px',
        color: '#d0b978',
        fontStyle: 'bold',
      },
    ).setOrigin(0.5);

    const totalGridWidth = layout.calendar.cellSize * 7 + layout.calendar.gap * 6;
    const startX = layout.calendar.centerX - totalGridWidth / 2 + layout.calendar.cellSize / 2;
    this.copy.stats.weekdays.forEach((label, column) => {
      this.add.text(
        startX + column * (layout.calendar.cellSize + layout.calendar.gap),
        layout.calendar.weekdayY,
        label,
        {
          fontFamily: 'monospace',
          fontSize: layout.viewportClass === 'narrow' ? '10px' : '11px',
          color: '#6f7780',
          fontStyle: 'bold',
        },
      ).setOrigin(0.5);
    });

    calendar.days.forEach((day, index) => {
      const position = calendar.leadingBlankCount + index;
      const column = position % 7;
      const row = Math.floor(position / 7);
      const x = startX + column * (layout.calendar.cellSize + layout.calendar.gap);
      const y = layout.calendar.gridTopY
        + layout.calendar.cellSize / 2
        + row * (layout.calendar.cellSize + layout.calendar.gap);
      const appearance = this.getCalendarAppearance(day.state);

      this.add.rectangle(
        x,
        y,
        layout.calendar.cellSize,
        layout.calendar.cellSize,
        appearance.fill,
        1,
      ).setStrokeStyle(day.state === 'today' ? 2 : 1, appearance.stroke);
      this.add.text(x, y, String(day.dayOfMonth), {
        fontFamily: 'monospace',
        fontSize: layout.viewportClass === 'narrow' ? '12px' : '13px',
        color: appearance.text,
        fontStyle: day.state === 'today' ? 'bold' : 'normal',
      }).setOrigin(0.5);

      if (day.solved) {
        this.add.text(
          x + layout.calendar.cellSize / 2 - 4,
          y + layout.calendar.cellSize / 2 - 3,
          '✓',
          {
            fontFamily: 'monospace',
            fontSize: '9px',
            color: '#8fbf8f',
            fontStyle: 'bold',
          },
        ).setOrigin(1, 1);
      }
    });
  }

  private getCalendarAppearance(state: 'solved' | 'missed' | 'today' | 'future' | 'unavailable'): {
    readonly fill: number;
    readonly stroke: number;
    readonly text: string;
  } {
    switch (state) {
      case 'solved':
        return { fill: 0x203026, stroke: 0x6e9e74, text: '#9ac49d' };
      case 'missed':
        return { fill: 0x191c21, stroke: 0x343a42, text: '#5f666f' };
      case 'today':
        return { fill: 0x2c2920, stroke: 0xd0b978, text: '#f0d28a' };
      case 'future':
        return { fill: 0x15181d, stroke: 0x272c33, text: '#4f565e' };
      case 'unavailable':
        return { fill: 0x111318, stroke: 0x20242a, text: '#343a42' };
    }
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

  private setupPointerOwnership(): void {
    const handlePointerDown = (pointer: Phaser.Input.Pointer): void => {
      this.pointerGate.notePointerDown(pointer.id);
    };
    this.input.on('pointerdown', handlePointerDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', handlePointerDown);
    });
  }

  private setupMetaScroll(): void {
    this.scrollMaxY = getMetaScrollMaxY(this.scale.height, this.contentBottom);
    if (this.scrollMaxY <= 0) return;

    const camera = this.cameras.main;
    const handleWheel = (
      _pointer: Phaser.Input.Pointer,
      _gameObjects: readonly Phaser.GameObjects.GameObject[],
      _deltaX: number,
      deltaY: number,
    ): void => {
      camera.scrollY = clampMetaScrollY(camera.scrollY + deltaY, this.scrollMaxY);
    };
    const handlePointerDown = (pointer: Phaser.Input.Pointer): void => {
      this.scrollPointerId = pointer.id;
      this.scrollStartPointerY = pointer.y;
      this.scrollStartCameraY = camera.scrollY;
      this.scrollGestureDragged = false;
    };
    const handlePointerMove = (pointer: Phaser.Input.Pointer): void => {
      if (this.scrollPointerId !== pointer.id || !pointer.isDown) return;
      if (!this.scrollGestureDragged) {
        this.scrollGestureDragged = isMetaScrollDrag(this.scrollStartPointerY, pointer.y);
      }
      if (!this.scrollGestureDragged) return;
      camera.scrollY = clampMetaScrollY(
        this.scrollStartCameraY - (pointer.y - this.scrollStartPointerY),
        this.scrollMaxY,
      );
    };
    const handlePointerUp = (pointer: Phaser.Input.Pointer): void => {
      if (this.scrollPointerId !== pointer.id) return;
      if (this.scrollGestureDragged) {
        this.lastDraggedPointerId = pointer.id;
        this.lastDragEndedAtMs = Date.now();
      }
      this.scrollPointerId = null;
      this.scrollGestureDragged = false;
    };

    this.input.on('wheel', handleWheel);
    this.input.on('pointerdown', handlePointerDown);
    this.input.on('pointermove', handlePointerMove);
    this.input.on('pointerup', handlePointerUp);
    this.input.on('pointerupoutside', handlePointerUp);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('wheel', handleWheel);
      this.input.off('pointerdown', handlePointerDown);
      this.input.off('pointermove', handlePointerMove);
      this.input.off('pointerup', handlePointerUp);
      this.input.off('pointerupoutside', handlePointerUp);
    });
  }

  private shouldActivatePointer(pointer: Phaser.Input.Pointer): boolean {
    if (!this.pointerGate.canActivate(pointer.id)) return false;
    if (this.scrollPointerId === pointer.id && this.scrollGestureDragged) return false;
    return !(
      this.lastDraggedPointerId === pointer.id
      && Date.now() - this.lastDragEndedAtMs < 160
    );
  }
}
