import Phaser from 'phaser';

import { CAMPAIGN_SERVICE_REGISTRY_KEY, CampaignService } from '../campaign/CampaignService';
import { getManuscriptForSlot } from '../content/campaign/manuscripts';
import type {
  CampaignLevelEntry,
  ManuscriptId,
} from '../content/campaign/types';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import { createCampaignGameSceneData } from '../runtime/GameLaunch';
import {
  HOME_SCENE_KEY,
  getManuscriptViewModels,
  type ManuscriptViewModel,
  type RealManuscriptViewModel,
} from '../runtime/MetaSelectors';
import { MetaPointerGate } from '../runtime/MetaPointerGate';
import { calculateArchiveListLayout } from '../runtime/ArchiveListLayout';
import {
  clampMetaScrollY,
  getMetaScrollMaxY,
  isMetaScrollDrag,
} from '../runtime/MetaScroll';
import { classifyViewport, type ViewportClass } from './GameBoardLayout';

interface ArchiveSceneData {
  readonly manuscriptId?: ManuscriptId | null;
}

const STATE_COLOR = {
  complete: '#8fbf8f',
  passed: '#d0b978',
  active: '#d8d1c4',
  locked: '#686e76',
  sealed: '#555b62',
} as const;

export class ArchiveScene extends Phaser.Scene {
  private selectedManuscriptId: ManuscriptId | null = null;
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
  private manuscriptListHeaderBottom = 0;

  constructor() {
    super('ArchiveScene');
  }

  init(data: ArchiveSceneData): void {
    this.selectedManuscriptId = data.manuscriptId ?? null;
  }

  create(): void {
    this.launchPending = false;
    this.pointerGate.reset();
    this.contentBottom = 0;
    this.scrollMaxY = 0;
    this.manuscriptListHeaderBottom = 0;
    this.cameras.main.setScroll(0, 0);
    const campaign = this.getCampaignService();
    const profileService = this.getProfileService();
    const profile = profileService.getProfile();
    const manuscripts = getManuscriptViewModels(campaign.getLevels(), profile);
    const viewportClass = classifyViewport(this.scale.width);

    if (viewportClass === 'wide') {
      if (this.selectedManuscriptId === null) {
        this.selectedManuscriptId = this.resolveDefaultManuscript(campaign);
      }
      this.renderWide(campaign, manuscripts);
    } else if (this.selectedManuscriptId === null) {
      this.renderManuscriptList(manuscripts, viewportClass, false);
    } else {
      const selected = manuscripts.find(
        (candidate) => candidate.kind === 'real' && candidate.id === this.selectedManuscriptId,
      );
      if (selected?.kind === 'real') {
        this.renderCompactDetail(campaign, selected, viewportClass);
      } else {
        this.selectedManuscriptId = null;
        this.renderManuscriptList(manuscripts, viewportClass, false);
      }
    }

    this.setupPointerOwnership();
    this.setupMetaScroll();

    const handleResize = (): void => {
      if (!this.scene.isActive()) return;
      this.scene.restart({ manuscriptId: this.selectedManuscriptId });
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
    });
  }

  private renderWide(
    campaign: CampaignService,
    manuscripts: readonly ManuscriptViewModel[],
  ): void {
    this.createTopBack('← ГЛАВНАЯ', () => this.scene.start(HOME_SCENE_KEY));
    const listLayout = calculateArchiveListLayout(this.scale.width, 'wide', true);
    this.createFixedArchiveHeader(listLayout.headerBottom, 340);
    this.add.text(36, listLayout.titleY, 'АРХИВ', {
      fontFamily: 'monospace',
      fontSize: '30px',
      color: '#f0e6d2',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1002);

    const panelWidth = 310;
    const panelTop = listLayout.headerBottom + 4;
    const panelBottom = Math.max(panelTop + 1, this.scale.height - 16);
    this.add.rectangle(
      panelWidth / 2 + 24,
      (panelTop + panelBottom) / 2,
      panelWidth,
      panelBottom - panelTop,
      0x161a20,
      1,
    ).setScrollFactor(0).setDepth(-1);
    this.renderManuscriptList(manuscripts, 'wide', true);

    const selected = manuscripts.find(
      (candidate) => candidate.kind === 'real' && candidate.id === this.selectedManuscriptId,
    );
    if (selected?.kind === 'real') {
      this.renderManuscriptDetail(
        campaign,
        selected,
        370,
        52,
        this.scale.width - 400,
        'wide',
      );
    }
  }

  private renderManuscriptList(
    manuscripts: readonly ManuscriptViewModel[],
    viewportClass: ViewportClass,
    embedded: boolean,
  ): void {
    const narrow = viewportClass === 'narrow';
    const listLayout = calculateArchiveListLayout(
      this.scale.width,
      viewportClass,
      embedded,
    );
    this.manuscriptListHeaderBottom = listLayout.headerBottom;

    if (!embedded) {
      this.createTopBack('← ГЛАВНАЯ', () => this.scene.start(HOME_SCENE_KEY));
      this.createFixedArchiveHeader(listLayout.headerBottom, this.scale.width);
      this.add.text(this.scale.width / 2, listLayout.titleY, 'АРХИВ', {
        fontFamily: 'monospace',
        fontSize: narrow ? '28px' : '34px',
        color: '#f0e6d2',
        fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1002);
    }

    const startY = listLayout.startY;
    const cardHeight = listLayout.cardHeight;
    const gap = listLayout.gap;
    const centerX = listLayout.centerX;
    const width = listLayout.width;

    manuscripts.forEach((manuscript, index) => {
      const y = startY + index * (cardHeight + gap);
      const selected = manuscript.kind === 'real' && manuscript.id === this.selectedManuscriptId;
      const state = manuscript.kind === 'sealed' ? 'sealed' : manuscript.state;
      const color = STATE_COLOR[state];
      const fill = selected ? 0x30353d : 0x22272e;
      const card = this.add.rectangle(centerX, y, width, cardHeight, fill, 1)
        .setStrokeStyle(selected ? 2 : 1, Phaser.Display.Color.HexStringToColor(color).color);

      this.add.text(centerX - width / 2 + 18, y, manuscript.roman, {
        fontFamily: 'monospace',
        fontSize: embedded ? '21px' : narrow ? '20px' : '23px',
        color,
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      const title = manuscript.kind === 'sealed'
        ? 'ЗАПЕЧАТАНО'
        : manuscript.title.toUpperCase();
      this.add.text(centerX - width / 2 + 58, y - (manuscript.kind === 'real' ? 10 : 0), title, {
        fontFamily: 'monospace',
        fontSize: embedded ? '15px' : narrow ? '15px' : '17px',
        color,
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      if (manuscript.kind === 'real') {
        const rightText = manuscript.unlocked
          ? `${manuscript.progress.solved}/${manuscript.progress.total}`
          : '🔒';
        this.add.text(centerX + width / 2 - 16, y - 10, rightText, {
          fontFamily: 'monospace',
          fontSize: embedded ? '14px' : '15px',
          color,
          fontStyle: 'bold',
        }).setOrigin(1, 0.5);

        const subline = manuscript.unlocked
          ? manuscript.state === 'complete'
            ? 'Завершено полностью'
            : manuscript.state === 'passed'
              ? 'Следующая рукопись открыта'
              : 'Доступно'
          : manuscript.requirementText ?? 'Закрыто';
        this.add.text(centerX - width / 2 + 58, y + 13, subline, {
          fontFamily: 'monospace',
          fontSize: embedded ? '11px' : narrow ? '11px' : '12px',
          color: manuscript.unlocked ? '#89929d' : '#686e76',
        }).setOrigin(0, 0.5);

        card.setInteractive({ useHandCursor: true }).on('pointerup', (pointer: Phaser.Input.Pointer) => {
          if (pointer.y < this.manuscriptListHeaderBottom) return;
          if (!this.shouldActivatePointer(pointer)) return;
          this.selectedManuscriptId = manuscript.id;
          this.scene.restart({ manuscriptId: manuscript.id });
        });
      } else {
        this.add.text(centerX - width / 2 + 58, y + 15, 'Содержимое пока неизвестно', {
          fontFamily: 'monospace',
          fontSize: embedded ? '10px' : narrow ? '11px' : '12px',
          color: '#686e76',
        }).setOrigin(0, 0.5);
      }
    });

    if (manuscripts.length > 0) {
      const lastCenterY = startY + (manuscripts.length - 1) * (cardHeight + gap);
      this.trackContentBottom(lastCenterY + cardHeight / 2 + 20);
    }
  }

  private renderCompactDetail(
    campaign: CampaignService,
    manuscript: RealManuscriptViewModel,
    viewportClass: ViewportClass,
  ): void {
    this.createTopBack('← АРХИВ', () => {
      this.selectedManuscriptId = null;
      this.scene.restart({ manuscriptId: null });
    });
    this.renderManuscriptDetail(
      campaign,
      manuscript,
      14,
      48,
      this.scale.width - 28,
      viewportClass,
    );
  }

  private renderManuscriptDetail(
    campaign: CampaignService,
    manuscript: RealManuscriptViewModel,
    x: number,
    y: number,
    width: number,
    viewportClass: ViewportClass,
  ): void {
    const narrow = viewportClass === 'narrow';
    const centerX = x + width / 2;
    const titleY = y + (narrow ? 28 : 34);

    this.add.text(centerX, titleY, `РУКОПИСЬ ${manuscript.roman}`, {
      fontFamily: 'monospace',
      fontSize: narrow ? '16px' : viewportClass === 'wide' ? '18px' : '17px',
      color: '#89929d',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(centerX, titleY + (narrow ? 27 : 32), manuscript.title.toUpperCase(), {
      fontFamily: 'monospace',
      fontSize: narrow ? '26px' : viewportClass === 'wide' ? '34px' : '30px',
      color: '#f0e6d2',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(centerX, titleY + (narrow ? 57 : 68), `${manuscript.progress.solved} / ${manuscript.progress.total}`, {
      fontFamily: 'monospace',
      fontSize: narrow ? '14px' : '16px',
      color: manuscript.unlocked ? '#d0b978' : '#686e76',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    let levelsStartY = titleY + (narrow ? 96 : 112);
    if (!manuscript.unlocked && manuscript.requirementText !== null) {
      this.add.text(centerX, levelsStartY, `🔒 ${manuscript.requirementText}`, {
        fontFamily: 'monospace',
        fontSize: narrow ? '13px' : '15px',
        color: '#89929d',
        align: 'center',
        wordWrap: { width: Math.max(200, width - 32) },
      }).setOrigin(0.5);
      levelsStartY += narrow ? 48 : 54;
    } else if (manuscript.requiredForNext !== null) {
      this.add.text(
        centerX,
        levelsStartY,
        `До следующей рукописи: ${Math.min(manuscript.progress.solved, manuscript.requiredForNext)} / ${manuscript.requiredForNext}`,
        {
          fontFamily: 'monospace',
          fontSize: narrow ? '12px' : '14px',
          color: '#89929d',
        },
      ).setOrigin(0.5);
      levelsStartY += narrow ? 38 : 44;
    }

    const promoted = campaign.getLevels()
      .filter((entry) => manuscript.promotedLevelIds.includes(entry.id))
      .slice()
      .sort((left, right) => left.slot - right.slot);

    if (promoted.length === 0) {
      this.add.text(centerX, levelsStartY + 36, 'В текущей сборке пока нет опубликованных уровней этой рукописи.', {
        fontFamily: 'monospace',
        fontSize: narrow ? '12px' : '14px',
        color: '#686e76',
        align: 'center',
        wordWrap: { width: Math.max(220, width - 36) },
      }).setOrigin(0.5);
      this.trackContentBottom(levelsStartY + 84);
      return;
    }

    const columns = viewportClass === 'wide' ? Math.min(4, promoted.length) : viewportClass === 'compact' ? Math.min(3, promoted.length) : Math.min(2, promoted.length);
    const gapX = narrow ? 10 : 14;
    const gapY = narrow ? 10 : 14;
    const sideMargin = narrow ? 2 : viewportClass === 'wide' ? 20 : 8;
    const cardWidth = Math.min(
      viewportClass === 'wide' ? 150 : 170,
      Math.floor((width - sideMargin * 2 - gapX * Math.max(0, columns - 1)) / Math.max(1, columns)),
    );
    const cardHeight = narrow ? 78 : 90;
    const totalGridWidth = columns * cardWidth + gapX * Math.max(0, columns - 1);
    const gridStartX = centerX - totalGridWidth / 2 + cardWidth / 2;

    promoted.forEach((entry, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const cardX = gridStartX + column * (cardWidth + gapX);
      const cardY = levelsStartY + cardHeight / 2 + row * (cardHeight + gapY);
      this.createLevelCard(campaign, entry, cardX, cardY, cardWidth, cardHeight);
    });

    const rows = Math.ceil(promoted.length / columns);
    const gridBottom = levelsStartY
      + rows * cardHeight
      + Math.max(0, rows - 1) * gapY;
    this.trackContentBottom(gridBottom + 24);
  }

  private createLevelCard(
    campaign: CampaignService,
    entry: CampaignLevelEntry,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const profile = this.getProfileService().getProfile();
    const completed = profile.campaign.completedLevelIds.includes(entry.id);
    const playable = campaign.canPlayLevel(entry.id);
    const current = !completed && profile.campaign.lastPlayedLevelId === entry.id && playable;
    const color = completed ? '#8fbf8f' : playable ? current ? '#f0d28a' : '#d8d1c4' : '#62666d';
    const fill = current ? 0x343138 : 0x22272e;

    const card = this.add.rectangle(x, y, width, height, fill, 1)
      .setStrokeStyle(current ? 2 : 1, Phaser.Display.Color.HexStringToColor(color).color);
    this.add.text(x, y - 13, String(entry.slot).padStart(2, '0'), {
      fontFamily: 'monospace',
      fontSize: this.scale.width < 700 ? '20px' : '22px',
      color,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(x, y + 17, completed ? '✓ РЕШЕНО' : playable ? 'ДОСТУПНО' : '🔒 ЗАКРЫТО', {
      fontFamily: 'monospace',
      fontSize: this.scale.width < 700 ? '10px' : '11px',
      color,
    }).setOrigin(0.5);

    if (playable) {
      card.setInteractive({ useHandCursor: true }).on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (!this.shouldActivatePointer(pointer)) return;
        void this.launchLevel(campaign, entry);
      });
    }
  }

  private createFixedArchiveHeader(height: number, width: number): void {
    this.add.rectangle(width / 2, height / 2, width, height, 0x111318, 1)
      .setScrollFactor(0)
      .setDepth(1000);
  }

  private createTopBack(label: string, onActivate: () => void): void {
    const back = this.add.text(16, 20, label, {
      fontFamily: 'monospace',
      fontSize: this.scale.width < 700 ? '14px' : '16px',
      color: '#89929d',
      fontStyle: 'bold',
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(1003).setInteractive({ useHandCursor: true });
    back.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.shouldActivatePointer(pointer)) return;
      onActivate();
    });
  }

  private trackContentBottom(bottom: number): void {
    this.contentBottom = Math.max(this.contentBottom, bottom);
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

      const dragDelta = pointer.y - this.scrollStartPointerY;
      camera.scrollY = clampMetaScrollY(
        this.scrollStartCameraY - dragDelta,
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
    if (!this.pointerGate.canActivate(pointer.id)) {
      return false;
    }
    if (this.scrollPointerId === pointer.id && this.scrollGestureDragged) {
      return false;
    }
    return !(
      this.lastDraggedPointerId === pointer.id
      && Date.now() - this.lastDragEndedAtMs < 160
    );
  }

  private resolveDefaultManuscript(campaign: CampaignService): ManuscriptId {
    const continueLevel = campaign.getContinueLevel();
    if (continueLevel !== null) {
      const manuscript = getManuscriptForSlot(continueLevel.slot);
      if (manuscript !== null) return manuscript.id;
    }
    return 'manuscript-i';
  }

  private getCampaignService(): CampaignService {
    const service = this.registry.get(CAMPAIGN_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof CampaignService)) {
      throw new Error('ArchiveScene requires CampaignService in Phaser registry.');
    }
    return service;
  }

  private getProfileService(): PlayerProfileService {
    const service = this.registry.get(PLAYER_PROFILE_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof PlayerProfileService)) {
      throw new Error('ArchiveScene requires PlayerProfileService in Phaser registry.');
    }
    return service;
  }

  private async launchLevel(
    service: CampaignService,
    entry: CampaignLevelEntry,
  ): Promise<void> {
    if (this.launchPending || !service.canPlayLevel(entry.id)) return;
    this.launchPending = true;
    try {
      const started = await service.startLevel(entry.id);
      this.scene.start('GameScene', createCampaignGameSceneData(started, service.getProgress()));
    } catch (error) {
      this.launchPending = false;
      console.error(`[Dungeon Logic] Could not start ${entry.id} from Archive.`, error);
    }
  }
}
