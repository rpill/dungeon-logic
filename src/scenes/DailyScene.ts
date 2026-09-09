import Phaser from 'phaser';

import { DAILY_RELEASE_ENTRIES } from '../content/daily/manifest';
import type { DailyEntry } from '../content/daily/types';
import {
  DAILY_SERVICE_REGISTRY_KEY,
  DailyService,
  type DailyArchiveEntry,
  type DailyTodaySnapshot,
} from '../daily/DailyService';
import { getUiCopy, type UiCopy } from '../i18n/UiCopy';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import {
  createDailyHubCalendarMonth,
  getInitialDailyHubCalendarMonth,
  shiftDailyHubCalendarMonth,
  type DailyHubCalendarDayState,
} from '../runtime/DailyHubCalendar';
import { createDailyGameSceneData } from '../runtime/GameLaunch';
import { MetaPointerGate } from '../runtime/MetaPointerGate';
import {
  clampMetaScrollY,
  getMetaScrollMaxY,
  isMetaScrollDrag,
} from '../runtime/MetaScroll';
import { HOME_SCENE_KEY } from '../runtime/MetaSelectors';
import { createDailyLevelPreview } from '../runtime/DailyLevelPreview';
import type { DailyProfileState } from '../profile/types';
import { drawLevelThumbnail } from '../view/LevelThumbnailRenderer';
import { LEADERBOARD_SCENE_KEY } from './LeaderboardScene';

export const DAILY_SCENE_KEY = 'DailyScene';

const CALENDAR_STATE_STYLE: Readonly<Record<DailyHubCalendarDayState, {
  readonly fill: number;
  readonly alpha: number;
  readonly stroke: number;
  readonly text: string;
}>> = {
  unavailable: { fill: 0x181b20, alpha: 0.6, stroke: 0x2e333a, text: '#4d535c' },
  'archive-unsolved': { fill: 0x20242b, alpha: 1, stroke: 0xd0b978, text: '#d8d1c4' },
  'archive-solved': { fill: 0x20242b, alpha: 1, stroke: 0x6f8b72, text: '#8fbf8f' },
  today: { fill: 0x2a3038, alpha: 1, stroke: 0xf0d28a, text: '#f0d28a' },
  future: { fill: 0x1c2026, alpha: 0.72, stroke: 0x4c535c, text: '#62666d' },
};

export class DailyScene extends Phaser.Scene {
  private launchPending = false;
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
    super(DAILY_SCENE_KEY);
  }

  create(): void {
    this.launchPending = false;
    this.contentBottom = 0;
    this.scrollMaxY = 0;
    this.pointerGate.reset();
    this.cameras.main.setScroll(0, 0);

    const profile = this.getProfileService().getProfile();
    const copy = getUiCopy(profile.settings.language);
    const narrow = this.scale.width < 700;

    const headerHeight = narrow ? 80 : 92;
    this.add.rectangle(this.scale.width / 2, headerHeight / 2, this.scale.width, headerHeight, 0x111318, 1)
      .setScrollFactor(0)
      .setDepth(1000);
    this.add.text(16, 18, copy.common.backHome, {
      fontFamily: 'monospace',
      fontSize: narrow ? '12px' : '14px',
      color: '#89929d',
      fontStyle: 'bold',
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(1001)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (!this.pointerGate.canActivate(pointer.id)) return;
        this.scene.start(HOME_SCENE_KEY);
      });
    this.add.text(this.scale.width / 2, narrow ? 42 : 50, copy.dailyHub.title, {
      fontFamily: 'monospace',
      fontSize: narrow ? '25px' : '32px',
      color: '#f0e6d2',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    const loading = this.add.text(this.scale.width / 2, headerHeight + 28, copy.common.loading, {
      fontFamily: 'monospace',
      fontSize: narrow ? '12px' : '14px',
      color: '#89929d',
    }).setOrigin(0.5, 0);

    const renderVersion = Date.now();
    this.registry.set('daily-scene-render-version', renderVersion);
    void Promise.all([
      this.getDailyService().getToday(),
      this.getDailyService().getArchive(),
    ]).then(([today, archiveRows]) => {
      if (!this.scene.isActive() || this.registry.get('daily-scene-render-version') !== renderVersion) return;
      loading.destroy();
      this.renderContent(
        today,
        archiveRows,
        this.getProfileService().getProfile().daily,
        copy,
        headerHeight,
        narrow,
      );
      this.setupMetaScroll();
    }).catch((error) => {
      console.warn('[Dungeon Logic] Could not load Daily hub.', error);
      if (!this.scene.isActive()) return;
      loading.setText(copy.home.dailyUnavailable);
    });

    this.setupPointerOwnership();

    const handleResize = (): void => {
      if (this.scene.isActive()) this.scene.restart();
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
    });
  }

  private renderContent(
    today: DailyTodaySnapshot | null,
    archiveRows: readonly DailyArchiveEntry[],
    dailyProfile: DailyProfileState,
    copy: UiCopy,
    headerHeight: number,
    narrow: boolean,
  ): void {
    const width = Math.min(this.scale.width - (narrow ? 28 : 48), 620);
    const centerX = this.scale.width / 2;
    let y = headerHeight + (narrow ? 34 : 42);

    const todayTitleY = y;
    this.add.text(centerX, todayTitleY, copy.dailyHub.todayTitle, {
      fontFamily: 'monospace',
      fontSize: narrow ? '15px' : '18px',
      color: '#d0b978',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const todayHeight = narrow ? 92 : 104;
    const todayCardTop = todayTitleY + (narrow ? 28 : 34);
    const todayCardCenterY = todayCardTop + todayHeight / 2;
    y = todayCardCenterY;
    this.add.rectangle(centerX, todayCardCenterY, width, todayHeight, 0x22272e, 1)
      .setStrokeStyle(2, 0xd0b978);

    if (today?.entry === null || today === null) {
      this.add.text(centerX, y, copy.dailyHub.todayUnavailable, {
        fontFamily: 'monospace',
        fontSize: narrow ? '12px' : '14px',
        color: '#89929d',
        align: 'center',
        wordWrap: { width: width - 28 },
      }).setOrigin(0.5);
    } else {
      const entry = today.entry;
      const solved = today.solved && today.result !== null;
      this.add.text(centerX - width / 2 + 18, y - 18, this.formatDate(today.dateKey), {
        fontFamily: 'monospace',
        fontSize: narrow ? '13px' : '15px',
        color: '#f0e6d2',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      this.add.text(
        centerX - width / 2 + 18,
        y + 12,
        solved
          ? (today.result!.minHintsUsed > 0
            ? copy.dailyHub.todaySolvedOutsideRating(this.formatTime(today.result!.bestTimeMs))
            : copy.dailyHub.todaySolved(this.formatTime(today.result!.bestTimeMs)))
          : copy.dailyHub.todayUnsolved,
        {
          fontFamily: 'monospace',
          fontSize: narrow ? '10px' : '12px',
          color: '#89929d',
          wordWrap: { width: Math.max(150, width - (narrow ? 150 : 190)) },
        },
      ).setOrigin(0, 0.5);
      this.createActionButton(
        centerX + width / 2 - (narrow ? 62 : 76),
        y,
        narrow ? 110 : 138,
        narrow ? 42 : 46,
        solved ? copy.dailyHub.leaderboard : copy.dailyHub.playToday,
        solved ? '#aeb4bc' : '#f0d28a',
        (pointer) => {
          if (!this.shouldActivatePointer(pointer)) return;
          if (solved) {
            this.scene.start(LEADERBOARD_SCENE_KEY, { dailyId: entry.id, dateKey: today.dateKey });
          } else {
            void this.launchDaily(entry);
          }
        },
      );
    }

    y = todayCardTop + todayHeight + (narrow ? 38 : 46);
    const solvedArchive = archiveRows.filter((item) => item.solved).length;
    this.add.text(centerX, y, copy.dailyHub.archiveTitle, {
      fontFamily: 'monospace',
      fontSize: narrow ? '15px' : '18px',
      color: '#d8d1c4',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(centerX, y + (narrow ? 24 : 27), copy.dailyHub.archiveProgress(solvedArchive, archiveRows.length), {
      fontFamily: 'monospace',
      fontSize: narrow ? '10px' : '12px',
      color: '#89929d',
    }).setOrigin(0.5);
    y += narrow ? 62 : 68;

    if (today === null) {
      this.add.text(centerX, y + 24, copy.dailyHub.archiveEmpty, {
        fontFamily: 'monospace',
        fontSize: narrow ? '12px' : '14px',
        color: '#686e76',
      }).setOrigin(0.5);
      this.contentBottom = y + 70;
      return;
    }

    const calendarContainer = this.add.container(0, 0);
    let selectedMonth = getInitialDailyHubCalendarMonth(DAILY_RELEASE_ENTRIES, today.dateKey);
    const calendarWidth = Math.min(width, narrow ? 440 : 540);
    const columnGap = narrow ? 4 : 7;
    const cellSize = Math.max(30, Math.min(narrow ? 48 : 58, Math.floor((calendarWidth - columnGap * 6) / 7)));
    const gridWidth = cellSize * 7 + columnGap * 6;
    const numberGap = narrow ? 8 : 10;
    const numberHeight = narrow ? 10 : 12;
    const rowGap = narrow ? 8 : 10;
    const rowPitch = cellSize + numberGap + numberHeight + rowGap;
    const monthHeaderY = y;
    const weekdaysY = monthHeaderY + (narrow ? 32 : 36);
    const gridTopY = weekdaysY + (narrow ? 24 : 28);

    const renderCalendarMonth = (): void => {
      calendarContainer.removeAll(true);
      const calendar = createDailyHubCalendarMonth(
        DAILY_RELEASE_ENTRIES,
        archiveRows,
        today,
        selectedMonth.year,
        selectedMonth.month,
      );
      selectedMonth = { year: calendar.year, month: calendar.month };

      const monthLabel = `${copy.stats.months[calendar.month - 1]} ${calendar.year}`;
      const monthText = this.add.text(centerX, monthHeaderY, monthLabel, {
        fontFamily: 'monospace',
        fontSize: narrow ? '13px' : '15px',
        color: '#f0e6d2',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      calendarContainer.add(monthText);

      const createMonthArrow = (direction: -1 | 1, enabled: boolean): void => {
        const x = centerX + direction * Math.min(gridWidth / 2 - 14, narrow ? 150 : 190);
        const arrow = this.add.text(x, monthHeaderY, direction < 0 ? '‹' : '›', {
          fontFamily: 'monospace',
          fontSize: narrow ? '22px' : '26px',
          color: enabled ? '#d0b978' : '#4c535c',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        if (enabled) {
          arrow.setInteractive({ useHandCursor: true }).on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (!this.shouldActivatePointer(pointer)) return;
            selectedMonth = shiftDailyHubCalendarMonth(
              DAILY_RELEASE_ENTRIES,
              today.dateKey,
              calendar.year,
              calendar.month,
              direction,
            );
            renderCalendarMonth();
          });
        }
        calendarContainer.add(arrow);
      };
      createMonthArrow(-1, calendar.canGoPrevious);
      createMonthArrow(1, calendar.canGoNext);

      copy.stats.weekdays.forEach((weekday, column) => {
        const x = centerX - gridWidth / 2 + cellSize / 2 + column * (cellSize + columnGap);
        const text = this.add.text(x, weekdaysY, weekday, {
          fontFamily: 'monospace',
          fontSize: narrow ? '9px' : '10px',
          color: '#686e76',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        calendarContainer.add(text);
      });

      calendar.days.forEach((day) => {
        const position = calendar.leadingEmptyDays + day.day - 1;
        const column = position % 7;
        const row = Math.floor(position / 7);
        const x = centerX - gridWidth / 2 + cellSize / 2 + column * (cellSize + columnGap);
        const cellY = gridTopY + cellSize / 2 + row * rowPitch;
        const numberY = cellY + cellSize / 2 + numberGap;
        const style = CALENDAR_STATE_STYLE[day.state];
        const cell = this.add.rectangle(x, cellY, cellSize, cellSize, style.fill, style.alpha)
          .setStrokeStyle(day.state === 'today' ? 2 : 1, style.stroke);
        calendarContainer.add(cell);

        if (day.entry !== null && day.state !== 'future' && day.state !== 'unavailable') {
          const preview = createDailyLevelPreview(day.entry, dailyProfile);
          if (preview.status === 'unstarted') {
            const veil = this.add.rectangle(x, cellY, cellSize - 4, cellSize - 4, 0xf3eee5, 0.12);
            const question = this.add.text(x, cellY, '?', {
              fontFamily: 'monospace',
              fontSize: `${Math.max(16, Math.floor(cellSize * 0.42))}px`,
              color: day.state === 'today' ? '#f0d28a' : '#d8d1c4',
              fontStyle: 'bold',
            }).setOrigin(0.5);
            calendarContainer.add([veil, question]);
          } else {
            const thumbnail = drawLevelThumbnail(
              this,
              day.entry.level,
              preview.walls,
              { x, y: cellY, width: cellSize, height: cellSize },
              { showIncompleteOverlay: preview.showIncompleteOverlay },
            );
            calendarContainer.add(thumbnail);
          }
        } else if (day.entry !== null && day.state === 'future') {
          const question = this.add.text(x, cellY, '?', {
            fontFamily: 'monospace',
            fontSize: `${Math.max(15, Math.floor(cellSize * 0.38))}px`,
            color: '#62666d',
            fontStyle: 'bold',
          }).setOrigin(0.5);
          calendarContainer.add(question);
        }

        const number = this.add.text(x, numberY, String(day.day), {
          fontFamily: 'monospace',
          fontSize: narrow ? '10px' : '11px',
          color: style.text,
          fontStyle: day.state === 'today' ? 'bold' : 'normal',
        }).setOrigin(0.5, 0);
        calendarContainer.add(number);

        if (day.state === 'archive-solved') {
          const marker = this.add.text(x + cellSize / 2 - 3, cellY - cellSize / 2 + 2, '✓', {
            fontFamily: 'monospace',
            fontSize: narrow ? '8px' : '9px',
            color: '#8fbf8f',
            fontStyle: 'bold',
          }).setOrigin(1, 0);
          calendarContainer.add(marker);
        }

        if ((day.state === 'archive-unsolved' || day.state === 'archive-solved') && day.entry !== null) {
          cell.setInteractive({ useHandCursor: true }).on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (!this.shouldActivatePointer(pointer)) return;
            void this.launchDaily(day.entry!);
          });
        }
      });
    };

    renderCalendarMonth();

    const calendarRows = 6;
    const calendarBottom = gridTopY + calendarRows * rowPitch - rowGap;
    this.add.text(centerX, calendarBottom + (narrow ? 12 : 16), copy.dailyHub.archiveOutsideRating, {
      fontFamily: 'monospace',
      fontSize: narrow ? '9px' : '11px',
      color: '#686e76',
    }).setOrigin(0.5, 0);
    this.contentBottom = calendarBottom + (narrow ? 48 : 56);
  }

  private createActionButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: string,
    onActivate: (pointer: Phaser.Input.Pointer) => void,
  ): void {
    const rectangle = this.add.rectangle(x, y, width, height, 0x2a3038, 1)
      .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(color).color)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: this.scale.width < 700 ? '10px' : '12px',
      color,
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: width - 8 },
    }).setOrigin(0.5);
    rectangle.on('pointerup', onActivate);
  }

  private async launchDaily(entry: DailyEntry): Promise<void> {
    if (this.launchPending) return;
    this.launchPending = true;
    try {
      const attempt = await this.getDailyService().beginDaily(entry.dateKey, entry.id);
      if (attempt === null || !this.scene.isActive()) {
        this.launchPending = false;
        return;
      }
      this.scene.start('GameScene', createDailyGameSceneData(entry, attempt));
    } catch (error) {
      this.launchPending = false;
      console.error(`[Dungeon Logic] Could not start ${entry.id} from Daily hub.`, error);
    }
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
      camera.setScroll(0, clampMetaScrollY(camera.scrollY + deltaY, this.scrollMaxY));
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
      camera.setScroll(0, clampMetaScrollY(
        this.scrollStartCameraY - (pointer.y - this.scrollStartPointerY),
        this.scrollMaxY,
      ));
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

  private formatTime(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  private formatDate(dateKey: string): string {
    const [year, month, day] = dateKey.split('-');
    return `${day}.${month}.${year}`;
  }

  private getDailyService(): DailyService {
    const service = this.registry.get(DAILY_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof DailyService)) {
      throw new Error('DailyScene requires DailyService in Phaser registry.');
    }
    return service;
  }

  private getProfileService(): PlayerProfileService {
    const service = this.registry.get(PLAYER_PROFILE_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof PlayerProfileService)) {
      throw new Error('DailyScene requires PlayerProfileService in Phaser registry.');
    }
    return service;
  }
}
