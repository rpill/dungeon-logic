import Phaser from 'phaser';

import { getAudioFeedback } from '../audio/AudioFeedbackService';
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
import {
  calculateDailyHubLayout,
  getDailyCalendarRowCount,
} from '../runtime/DailyHubLayout';
import { createDailyGameSceneData } from '../runtime/GameLaunch';
import { createHomeMenuButton } from '../runtime/HomeMenuButton';
import { createMetaPageHeader } from '../runtime/MetaPageHeader';
import { MetaPointerGate } from '../runtime/MetaPointerGate';
import {
  clampMetaScrollY,
  getMetaScrollMaxY,
  isMetaScrollDrag,
} from '../runtime/MetaScroll';
import { HOME_SCENE_KEY } from '../runtime/MetaSelectors';
import { createSceneBackground } from '../runtime/SceneBackground';
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
  unavailable: { fill: 0x101a2c, alpha: 0.56, stroke: 0x2b3b55, text: '#52617a' },
  'archive-unsolved': { fill: 0x17243d, alpha: 0.96, stroke: 0x8190aa, text: '#d8d1c4' },
  'archive-solved': { fill: 0x17243d, alpha: 0.98, stroke: 0x73d0bd, text: '#73d0bd' },
  today: { fill: 0x1f2c4a, alpha: 1, stroke: 0xf0bd63, text: '#f0bd63' },
  future: { fill: 0x111a2d, alpha: 0.66, stroke: 0x34455f, text: '#65728a' },
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

    const sceneBackground = createSceneBackground(this, 'meta');
    sceneBackground.image.setScrollFactor(0);

    const profile = this.getProfileService().getProfile();
    const copy = getUiCopy(profile.settings.language);
    const shellLayout = calculateDailyHubLayout(this.scale.width, this.scale.height, 6);
    const { narrow } = shellLayout;


    createMetaPageHeader(this, {
      title: copy.dailyHub.title,
      backLabel: copy.common.backHome,
      onBack: (pointer) => {
        if (!this.shouldActivatePointer(pointer)) return;
        this.scene.start(HOME_SCENE_KEY);
      },
    });

    const loading = this.add.text(this.scale.width / 2, shellLayout.headerHeight + 12, copy.common.loading, {
      fontFamily: 'monospace',
      fontSize: shellLayout.density === 'ultra' ? '10px' : narrow ? '12px' : '14px',
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
      );
      this.setupMetaScroll();
    }).catch((error) => {
      console.warn('[Dungeon Logic] Could not load Daily hub.', error);
      if (!this.scene.isActive()) return;
      loading.setText(copy.home.dailyUnavailable);
    });

    this.setupPointerOwnership();

    const handleResize = (): void => {
      sceneBackground.sync();
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
  ): void {
    const shellLayout = calculateDailyHubLayout(this.scale.width, this.scale.height, 6);
    const { narrow, density } = shellLayout;
    const width = shellLayout.contentWidth;
    const centerX = this.scale.width / 2;

    this.add.text(centerX, shellLayout.todayTitleY, copy.dailyHub.todayTitle, {
      fontFamily: 'monospace',
      fontSize: density === 'ultra' ? '11px' : density === 'tight' ? '13px' : narrow ? '15px' : '18px',
      color: '#f0bd63',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const todayHeight = shellLayout.todayHeight;
    const todayCardTop = shellLayout.todayCardTop;
    const todayCardCenterY = todayCardTop + todayHeight / 2;
    const panel = this.add.graphics();
    const cardRadius = density === 'ultra' ? 8 : narrow ? 12 : 14;
    panel.fillStyle(0x1b2945, 0.96);
    panel.fillRoundedRect(centerX - width / 2, todayCardTop, width, todayHeight, cardRadius);
    panel.lineStyle(1, 0x415878, 0.92);
    panel.strokeRoundedRect(centerX - width / 2, todayCardTop, width, todayHeight, cardRadius);

    if (today?.entry === null || today === null) {
      this.add.text(centerX, todayCardCenterY, copy.dailyHub.todayUnavailable, {
        fontFamily: 'monospace',
        fontSize: density === 'ultra' ? '9px' : narrow ? '12px' : '14px',
        color: '#9aa6ba',
        align: 'center',
        wordWrap: { width: width - 40 },
      }).setOrigin(0.5);
    } else {
      const entry = today.entry;
      const solved = today.solved && today.result !== null;
      const stackedAction = narrow;
      const actionHeight = density === 'ultra' ? 32 : density === 'tight' ? 36 : narrow ? 34 : 44;
      const actionGap = density === 'ultra' ? 6 : 8;
      const playWidth = density === 'ultra' ? 118 : density === 'tight' ? 128 : narrow ? 128 : 148;
      const leaderboardWidth = density === 'ultra' ? 146 : density === 'tight' ? 158 : narrow ? 164 : 184;
      const actionGroupWidth = playWidth + actionGap + leaderboardWidth;
      const contentLeft = centerX - width / 2 + (density === 'ultra' ? 14 : narrow ? 20 : 24);
      const actionGroupRight = stackedAction
        ? centerX + actionGroupWidth / 2
        : centerX + width / 2 - (density === 'ultra' ? 12 : 22);
      const playX = actionGroupRight - actionGroupWidth + playWidth / 2;
      const leaderboardX = actionGroupRight - leaderboardWidth / 2;
      const actionY = stackedAction
        ? todayCardTop + todayHeight - actionHeight / 2 - (density === 'ultra' ? 5 : 7)
        : todayCardCenterY;
      const statusWidth = stackedAction
        ? width - 40
        : width - actionGroupWidth - (density === 'ultra' ? 54 : 76);
      const dateY = todayCardTop + (density === 'ultra' ? 13 : narrow ? 18 : 30);
      const statusY = todayCardTop + (density === 'ultra' ? 31 : narrow ? 40 : 58);

      this.add.text(contentLeft, dateY, this.formatDate(today.dateKey), {
        fontFamily: 'monospace',
        fontSize: density === 'ultra' ? '10px' : density === 'tight' ? '12px' : narrow ? '13px' : '16px',
        color: '#f4ead7',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      this.add.text(
        contentLeft,
        statusY,
        solved
          ? (today.result!.minHintsUsed > 0
            ? copy.dailyHub.todaySolvedOutsideRating(this.formatTime(today.result!.bestTimeMs))
            : copy.dailyHub.todaySolved(this.formatTime(today.result!.bestTimeMs)))
          : copy.dailyHub.todayUnsolved,
        {
          fontFamily: 'monospace',
          fontSize: density === 'ultra' ? '8px' : density === 'tight' ? '9px' : narrow ? '10px' : '12px',
          color: '#9aa6ba',
          wordWrap: { width: statusWidth },
        },
      ).setOrigin(0, 0.5);

      this.createTodayActionButton(
        playX,
        actionY,
        playWidth,
        actionHeight,
        copy.dailyHub.playToday,
        'play',
        true,
        (pointer) => {
          if (!this.shouldActivatePointer(pointer)) return;
          void this.launchDaily(entry);
        },
      );
      this.createTodayActionButton(
        leaderboardX,
        actionY,
        leaderboardWidth,
        actionHeight,
        copy.dailyHub.leaderboard,
        'statistics',
        false,
        (pointer) => {
          if (!this.shouldActivatePointer(pointer)) return;
          this.scene.start(LEADERBOARD_SCENE_KEY, { dailyId: entry.id, dateKey: today.dateKey });
        },
      );
    }

    this.add.text(centerX, shellLayout.archiveTitleY, copy.dailyHub.archiveTitle, {
      fontFamily: 'monospace',
      fontSize: density === 'ultra' ? '11px' : density === 'tight' ? '13px' : narrow ? '16px' : '19px',
      color: '#f4ead7',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    if (today === null) {
      this.add.text(centerX, shellLayout.monthHeaderY, copy.dailyHub.archiveEmpty, {
        fontFamily: 'monospace',
        fontSize: density === 'ultra' ? '9px' : narrow ? '12px' : '14px',
        color: '#65728a',
      }).setOrigin(0.5);
      this.contentBottom = shellLayout.monthHeaderY + 48;
      this.scrollMaxY = getMetaScrollMaxY(this.scale.height, this.contentBottom);
      return;
    }

    const calendarContainer = this.add.container(0, 0);
    let selectedMonth = getInitialDailyHubCalendarMonth(DAILY_RELEASE_ENTRIES, today.dateKey);

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

      const calendarRows = getDailyCalendarRowCount(calendar.leadingEmptyDays, calendar.days.length);
      const layout = calculateDailyHubLayout(this.scale.width, this.scale.height, calendarRows);
      const gridWidth = layout.cellSize * 7 + layout.columnGap * 6;
      const monthLabel = `${copy.stats.months[calendar.month - 1]} ${calendar.year}`;

      const monthText = this.add.text(centerX, layout.monthHeaderY, monthLabel, {
        fontFamily: 'monospace',
        fontSize: layout.density === 'ultra' ? '10px' : layout.density === 'tight' ? '12px' : narrow ? '14px' : '17px',
        color: '#f4ead7',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      calendarContainer.add(monthText);

      const createMonthArrow = (direction: -1 | 1, enabled: boolean): void => {
        const maxArrowOffset = layout.density === 'ultra' ? 180 : narrow ? 156 : 220;
        const x = centerX + direction * Math.min(Math.max(34, gridWidth / 2 - 12), maxArrowOffset);
        const restingColor = enabled ? '#aeb9cb' : '#46536a';
        const arrow = this.add.text(x, layout.monthHeaderY, direction < 0 ? '‹' : '›', {
          fontFamily: 'monospace',
          fontSize: layout.density === 'ultra' ? '18px' : narrow ? '24px' : '30px',
          color: restingColor,
          fontStyle: 'bold',
        }).setOrigin(0.5);
        if (enabled) {
          arrow.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
              arrow.setColor('#f0bd63');
              getAudioFeedback(this).play('ui-hover');
            })
            .on('pointerout', () => arrow.setColor(restingColor))
            .on('pointerup', (pointer: Phaser.Input.Pointer) => {
              if (!this.shouldActivatePointer(pointer)) return;
              getAudioFeedback(this).play('ui-click');
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
        const x = centerX - gridWidth / 2 + layout.cellSize / 2 + column * (layout.cellSize + layout.columnGap);
        const text = this.add.text(x, layout.weekdaysY, weekday, {
          fontFamily: 'monospace',
          fontSize: layout.density === 'ultra' ? '7px' : layout.density === 'tight' ? '8px' : narrow ? '9px' : '10px',
          color: '#718098',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        calendarContainer.add(text);
      });

      calendar.days.forEach((day) => {
        const position = calendar.leadingEmptyDays + day.day - 1;
        const column = position % 7;
        const row = Math.floor(position / 7);
        const x = centerX - gridWidth / 2 + layout.cellSize / 2 + column * (layout.cellSize + layout.columnGap);
        const cellY = layout.gridTopY + layout.cellSize / 2 + row * layout.rowPitch;
        const numberY = cellY + layout.cellSize / 2 + layout.numberGap;
        const style = CALENDAR_STATE_STYLE[day.state];
        const cell = this.add.rectangle(x, cellY, layout.cellSize, layout.cellSize, style.fill, style.alpha)
          .setStrokeStyle(day.state === 'today' ? 2 : 1, style.stroke);
        calendarContainer.add(cell);

        if (day.entry !== null && day.state !== 'future' && day.state !== 'unavailable') {
          const preview = createDailyLevelPreview(day.entry, dailyProfile);
          if (preview.status === 'unstarted') {
            const veil = this.add.rectangle(
              x,
              cellY,
              Math.max(1, layout.cellSize - 4),
              Math.max(1, layout.cellSize - 4),
              0xf3eee5,
              day.state === 'today' ? 0.1 : 0.08,
            );
            const question = this.add.text(x, cellY, '?', {
              fontFamily: 'monospace',
              fontSize: `${Math.max(layout.density === 'ultra' ? 11 : 14, Math.floor(layout.cellSize * 0.4))}px`,
              color: day.state === 'today' ? '#f0bd63' : '#c9d0dc',
              fontStyle: 'bold',
            }).setOrigin(0.5);
            calendarContainer.add([veil, question]);
          } else {
            const thumbnail = drawLevelThumbnail(
              this,
              day.entry.level,
              preview.walls,
              { x, y: cellY, width: layout.cellSize, height: layout.cellSize },
              { showIncompleteOverlay: preview.showIncompleteOverlay },
            );
            calendarContainer.add(thumbnail);
          }
        } else if (day.entry !== null && day.state === 'future') {
          const question = this.add.text(x, cellY, '?', {
            fontFamily: 'monospace',
            fontSize: `${Math.max(layout.density === 'ultra' ? 10 : 13, Math.floor(layout.cellSize * 0.36))}px`,
            color: '#65728a',
            fontStyle: 'bold',
          }).setOrigin(0.5);
          calendarContainer.add(question);
        }

        const playableDay = (day.state === 'today' || day.state === 'archive-unsolved' || day.state === 'archive-solved') && day.entry !== null;
        const hoverOverlay = this.add.rectangle(
          x,
          cellY,
          Math.max(1, layout.cellSize - 4),
          Math.max(1, layout.cellSize - 4),
          0x28395f,
          0.22,
        ).setVisible(false);
        calendarContainer.add(hoverOverlay);

        const number = this.add.text(x, numberY, String(day.day), {
          fontFamily: 'monospace',
          fontSize: layout.density === 'ultra' ? '7px' : layout.density === 'tight' ? '8px' : narrow ? '10px' : '12px',
          color: style.text,
          fontStyle: day.state === 'today' ? 'bold' : 'normal',
        }).setOrigin(0.5, 0);
        calendarContainer.add(number);

        if (day.state === 'archive-solved') {
          const markerInset = layout.density === 'ultra' ? 2 : 4;
          const marker = this.add.text(
            x + layout.cellSize / 2 - markerInset,
            cellY - layout.cellSize / 2 + markerInset,
            '✓',
            {
              fontFamily: 'monospace',
              fontSize: layout.density === 'ultra' ? '7px' : narrow ? '9px' : '11px',
              color: '#73d0bd',
              fontStyle: 'bold',
            },
          ).setOrigin(1, 0);
          calendarContainer.add(marker);
        }

        if (playableDay) {
          cell.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
              hoverOverlay.setAlpha(0.22);
              hoverOverlay.setVisible(true);
              getAudioFeedback(this).play('ui-hover');
            })
            .on('pointerout', () => {
              hoverOverlay.setVisible(false);
            })
            .on('pointerdown', () => {
              hoverOverlay.setAlpha(0.34);
              hoverOverlay.setVisible(true);
            })
            .on('pointerup', (pointer: Phaser.Input.Pointer) => {
              hoverOverlay.setAlpha(0.22);
              hoverOverlay.setVisible(true);
              if (!this.shouldActivatePointer(pointer)) return;
              getAudioFeedback(this).play('ui-click');
              void this.launchDaily(day.entry!);
            });
        }
      });

      const outsideRating = this.add.text(centerX, layout.outsideRatingY, copy.dailyHub.archiveOutsideRating, {
        fontFamily: 'monospace',
        fontSize: layout.density === 'ultra' ? '7px' : layout.density === 'tight' ? '8px' : narrow ? '9px' : '11px',
        color: '#65728a',
      }).setOrigin(0.5, 0);
      calendarContainer.add(outsideRating);

      this.contentBottom = layout.contentBottom;
      this.scrollMaxY = getMetaScrollMaxY(this.scale.height, this.contentBottom);
      this.cameras.main.setScroll(0, clampMetaScrollY(this.cameras.main.scrollY, this.scrollMaxY));
    };

    renderCalendarMonth();
  }

  private createTodayActionButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    icon: 'play' | 'statistics',
    accentFrame: boolean,
    onActivate: (pointer: Phaser.Input.Pointer) => void,
  ): void {
    createHomeMenuButton(this, {
      x,
      y,
      width,
      height,
      label,
      labelColor: accentFrame ? '#f0d28a' : '#d8d1c4',
      icon,
      compact: true,
      accentFrame,
      onActivate,
    });
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
