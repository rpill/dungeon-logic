import Phaser from 'phaser';

import { CAMPAIGN_SERVICE_REGISTRY_KEY, CampaignService } from '../campaign/CampaignService';
import { createCampaignGameSceneData, createLevelSelectItems } from '../runtime/GameLaunch';
import { MetaPointerGate } from '../runtime/MetaPointerGate';
import {
  clampMetaScrollY,
  getMetaScrollMaxY,
  isMetaScrollDrag,
} from '../runtime/MetaScroll';
import { calculateLevelSelectLayout } from '../runtime/ResponsiveLayout';
import type { CampaignLevelEntry } from '../content/campaign/types';

const STATE_LABEL = {
  completed: 'Completed',
  current: 'Current',
  unlocked: 'Unlocked',
  locked: 'Locked',
} as const;

const STATE_COLOR = {
  completed: '#8fbf8f',
  current: '#f0d28a',
  unlocked: '#d8d1c4',
  locked: '#62666d',
} as const;

export class LevelSelectScene extends Phaser.Scene {
  private launchPending = false;
  private contentBottom = 0;
  private headerBottom = 0;
  private scrollMaxY = 0;
  private scrollPointerId: number | null = null;
  private scrollStartPointerY = 0;
  private scrollStartCameraY = 0;
  private scrollGestureDragged = false;
  private lastDraggedPointerId: number | null = null;
  private lastDragEndedAtMs = 0;
  private readonly pointerGate = new MetaPointerGate();

  constructor() {
    super('LevelSelectScene');
  }

  create(): void {
    this.launchPending = false;
    this.pointerGate.reset();
    this.contentBottom = 0;
    this.headerBottom = 0;
    this.scrollMaxY = 0;
    this.scrollPointerId = null;
    this.scrollGestureDragged = false;
    this.lastDraggedPointerId = null;
    this.lastDragEndedAtMs = 0;
    this.cameras.main.setScroll(0, 0);

    const service = this.getCampaignService();
    const progress = service.getProgress();
    const items = createLevelSelectItems(service.getLevels(), progress);
    const layout = calculateLevelSelectLayout(
      this.scale.width,
      this.scale.height,
      items.length,
    );
    this.contentBottom = layout.contentBottom;
    this.headerBottom = layout.headerBottom;

    this.add.rectangle(
      this.scale.width / 2,
      layout.headerBottom / 2,
      this.scale.width,
      layout.headerBottom,
      0x111318,
      1,
    ).setScrollFactor(0).setDepth(1000);

    this.add.text(this.scale.width / 2, layout.titleY, 'Dungeon Logic', {
      fontFamily: 'monospace',
      fontSize: `${layout.titleFontSize}px`,
      color: '#f0e6d2',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002);

    const continueLevel = service.getContinueLevel();
    if (continueLevel !== null) {
      this.createActionButton(
        this.scale.width / 2,
        layout.continueY,
        layout.continueWidth,
        layout.continueHeight,
        layout.continueFontSize,
        `Continue · Level ${continueLevel.slot}`,
        '#f0d28a',
        () => { void this.launchLevel(service, continueLevel); },
      );
    }

    items.forEach((item, index) => {
      const cardLayout = layout.cards[index];
      const color = STATE_COLOR[item.state];
      const card = this.add
        .rectangle(
          cardLayout.x,
          cardLayout.y,
          cardLayout.width,
          cardLayout.height,
          0x20242b,
          0.96,
        )
        .setStrokeStyle(
          item.state === 'current' ? 3 : 2,
          Phaser.Display.Color.HexStringToColor(color).color,
        );

      this.add.text(
        cardLayout.x,
        cardLayout.y - cardLayout.height * 0.22,
        `Level ${item.entry.slot}`,
        {
          fontFamily: 'monospace',
          fontSize: `${layout.cardTitleFontSize}px`,
          color,
          fontStyle: 'bold',
        },
      ).setOrigin(0.5);

      this.add.text(
        cardLayout.x,
        cardLayout.y + cardLayout.height * 0.22,
        STATE_LABEL[item.state],
        {
          fontFamily: 'monospace',
          fontSize: `${layout.cardStateFontSize}px`,
          color,
        },
      ).setOrigin(0.5);

      if (item.playable) {
        card.setInteractive({ useHandCursor: true }).on('pointerup', (pointer: Phaser.Input.Pointer) => {
          if (!this.shouldActivatePointer(pointer)) return;
          void this.launchLevel(service, item.entry);
        });
      }
    });

    this.setupPointerOwnership();
    this.setupMetaScroll();

    const handleResize = (): void => {
      if (this.scene.isActive()) {
        this.scene.restart();
      }
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
    });
  }

  private createActionButton(
    x: number,
    y: number,
    width: number,
    height: number,
    fontSize: number,
    label: string,
    color: string,
    onActivate: () => void,
  ): void {
    const button = this.add.rectangle(x, y, width, height, 0x2a3038, 1)
      .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color)
      .setScrollFactor(0)
      .setDepth(1002)
      .setInteractive({ useHandCursor: true });

    this.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: `${fontSize}px`,
      color,
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1003);

    button.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.shouldActivatePointer(pointer, true)) return;
      onActivate();
    });
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

  private shouldActivatePointer(
    pointer: Phaser.Input.Pointer,
    allowFixedHeader = false,
  ): boolean {
    if (!this.pointerGate.canActivate(pointer.id)) return false;
    if (!allowFixedHeader && pointer.y < this.headerBottom) return false;
    if (this.scrollPointerId === pointer.id && this.scrollGestureDragged) return false;
    return !(
      this.lastDraggedPointerId === pointer.id
      && Date.now() - this.lastDragEndedAtMs < 160
    );
  }

  private getCampaignService(): CampaignService {
    const service = this.registry.get(CAMPAIGN_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof CampaignService)) {
      throw new Error('LevelSelectScene requires CampaignService in Phaser registry.');
    }
    return service;
  }

  private async launchLevel(service: CampaignService, entry: CampaignLevelEntry): Promise<void> {
    if (this.launchPending || !service.canPlayLevel(entry.id)) return;
    this.launchPending = true;

    try {
      const startedEntry = await service.startLevel(entry.id);
      const data = createCampaignGameSceneData(startedEntry, service.getProgress());
      this.scene.start('GameScene', data);
    } catch (error) {
      this.launchPending = false;
      console.error(`[Dungeon Logic] Could not start ${entry.id}.`, error);
    }
  }
}
