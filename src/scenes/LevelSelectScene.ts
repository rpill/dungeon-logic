import Phaser from 'phaser';

import { getUiCopy } from '../i18n/UiCopy';

import { CAMPAIGN_SERVICE_REGISTRY_KEY, CampaignService } from '../campaign/CampaignService';
import type { CampaignLevelEntry } from '../content/campaign/types';
import type { TutorialLevelEntry } from '../content/tutorial/types';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import { createCampaignLevelPreview, type CampaignLevelPreview } from '../runtime/CampaignLevelPreview';
import {
  createCampaignGameSceneData,
  createLevelSelectItems,
  createTutorialGameSceneData,
} from '../runtime/GameLaunch';
import { createHomeMenuButton, type HomeMenuButtonHandle } from '../runtime/HomeMenuButton';
import { MetaPointerGate } from '../runtime/MetaPointerGate';
import { HOME_SCENE_KEY } from '../runtime/MetaSelectors';
import {
  clampMetaScrollY,
  getMetaScrollMaxY,
  isMetaScrollDrag,
} from '../runtime/MetaScroll';
import { calculateLevelSelectLayout, type LevelCardLayout } from '../runtime/ResponsiveLayout';
import { createSceneBackground } from '../runtime/SceneBackground';
import { TUTORIAL_SERVICE_REGISTRY_KEY, TutorialService } from '../tutorial/TutorialService';
import { drawLevelThumbnail } from '../view/LevelThumbnailRenderer';

const STATE_COLOR = {
  completed: '#73d0bd',
  current: '#f0bd63',
  unlocked: '#f4ead7',
  locked: '#7f8ba2',
} as const;

const STATE_FILL = {
  completed: { color: 0x15243d, alpha: 0.96 },
  current: { color: 0x1a2843, alpha: 0.98 },
  unlocked: { color: 0x142038, alpha: 0.94 },
  locked: { color: 0x0f1728, alpha: 0.74 },
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

    const sceneBackground = createSceneBackground(this, 'meta');
    const service = this.getCampaignService();
    const tutorial = this.getTutorialService();
    const profile = this.getProfileService().getProfile();
    const copy = getUiCopy(profile.settings.language);
    const progress = service.getProgress();
    const items = createLevelSelectItems(service.getLevels(), progress, profile.tutorial.completed);
    const layout = calculateLevelSelectLayout(
      this.scale.width,
      this.scale.height,
      items.length,
    );
    this.contentBottom = layout.contentBottom;
    this.headerBottom = layout.headerBottom;

    const narrow = this.scale.width < 700;
    const headerScrim = this.add.rectangle(
      this.scale.width / 2,
      layout.headerBottom / 2,
      this.scale.width,
      layout.headerBottom,
      0x07111f,
      narrow ? 0.32 : 0.24,
    ).setScrollFactor(0).setDepth(1000);

    this.createBackControl(copy.common.backHome, layout.titleY, narrow);
    this.createTitle(copy.common.levels, layout.titleY, narrow);

    if (!profile.tutorial.completed) {
      const tutorialEntry = tutorial.getContinueLevel() ?? tutorial.getLevels()[0];
      if (tutorialEntry !== undefined) {
        this.createActionButton(
          this.scale.width / 2,
          layout.continueY,
          layout.continueWidth,
          layout.continueHeight,
          copy.home.continue,
          '#f0d28a',
          () => { void this.launchTutorial(tutorial, tutorialEntry); },
        );
      }
    } else {
      const continueLevel = service.getContinueLevel();
      if (continueLevel !== null) {
        this.createActionButton(
          this.scale.width / 2,
          layout.continueY,
          layout.continueWidth,
          layout.continueHeight,
          copy.home.continue,
          '#f0d28a',
          () => { void this.launchLevel(service, continueLevel); },
        );
      }
    }

    items.forEach((item, index) => {
      const cardLayout = layout.cards[index];
      const color = STATE_COLOR[item.state];
      const preview = createCampaignLevelPreview(item.entry, profile.campaign);
      const cardTone = STATE_FILL[item.state];
      const strokeColor = Phaser.Display.Color.HexStringToColor(color).color;

      this.add.rectangle(
        cardLayout.x,
        cardLayout.y + 2,
        cardLayout.width,
        cardLayout.height,
        0x040912,
        0.22,
      );

      const card = this.add
        .rectangle(
          cardLayout.x,
          cardLayout.y,
          cardLayout.width,
          cardLayout.height,
          cardTone.color,
          cardTone.alpha,
        )
        .setStrokeStyle(item.state === 'current' ? 3 : 2, strokeColor);

      this.drawLevelPreview(item.entry, preview, cardLayout, item.state);

      this.add.text(
        cardLayout.x,
        cardLayout.numberY,
        String(item.entry.slot),
        {
          fontFamily: 'monospace',
          fontSize: `${layout.cardTitleFontSize}px`,
          color,
          fontStyle: 'bold',
        },
      ).setOrigin(0.5);

      if (item.playable) {
        const hoverOverlay = this.add.rectangle(
          cardLayout.x,
          cardLayout.y,
          Math.max(1, cardLayout.width - 6),
          Math.max(1, cardLayout.height - 6),
          0x40577f,
          0.16,
        ).setVisible(false);

        card.setInteractive({ useHandCursor: true })
          .on('pointerover', () => {
            hoverOverlay.setAlpha(0.16).setVisible(true);
          })
          .on('pointerout', () => {
            hoverOverlay.setVisible(false);
          })
          .on('pointerdown', () => {
            hoverOverlay.setAlpha(0.28).setVisible(true);
          })
          .on('pointerup', (pointer: Phaser.Input.Pointer) => {
            hoverOverlay.setAlpha(0.16).setVisible(true);
            if (!this.shouldActivatePointer(pointer)) return;
            void this.launchLevel(service, item.entry);
          });
      }
    });

    this.setupPointerOwnership();
    this.setupMetaScroll();

    const handleResize = (): void => {
      sceneBackground.sync();
      if (this.scene.isActive()) {
        this.scene.restart();
      }
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
      headerScrim.destroy();
    });
  }

  private createBackControl(label: string, y: number, narrow: boolean): void {
    const iconSize = narrow ? 22 : 26;
    const x = narrow ? 16 : 26;
    const icon = this.add.image(x + iconSize / 2, y, 'ui-icon-back')
      .setDisplaySize(iconSize, iconSize)
      .setTint(0xf4ead7)
      .setScrollFactor(0)
      .setDepth(1003);
    const text = this.add.text(
      x + iconSize + (narrow ? 8 : 10),
      y,
      label.replace(/^←\s*/, ''),
      {
        fontFamily: 'monospace',
        fontSize: narrow ? '13px' : '16px',
        color: '#f4ead7',
        fontStyle: 'bold',
      },
    ).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1003);

    this.add.zone(
      x + (iconSize + 10 + text.width) / 2,
      y,
      iconSize + 10 + text.width,
      Math.max(42, iconSize + 8),
    ).setScrollFactor(0).setDepth(1004).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start(HOME_SCENE_KEY);
      });

    void icon;
  }

  private createTitle(label: string, y: number, narrow: boolean): void {
    const title = this.add.text(this.scale.width / 2, y, label, {
      fontFamily: 'monospace',
      fontSize: narrow ? '28px' : '32px',
      color: '#f4ead7',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002);

    const decor = this.add.graphics().setScrollFactor(0).setDepth(1001);
    decor.fillStyle(0xf0b14f, 0.95);
    const diamondSize = narrow ? 4 : 5;
    const lineWidth = narrow ? 34 : 40;
    const gap = narrow ? 20 : 26;
    const leftDiamondX = title.x - title.width / 2 - gap;
    const rightDiamondX = title.x + title.width / 2 + gap;
    const drawDiamond = (x: number): void => {
      decor.beginPath();
      decor.moveTo(x, y - diamondSize);
      decor.lineTo(x + diamondSize, y);
      decor.lineTo(x, y + diamondSize);
      decor.lineTo(x - diamondSize, y);
      decor.closePath();
      decor.fillPath();
    };
    drawDiamond(leftDiamondX);
    drawDiamond(rightDiamondX);
    decor.fillRect(leftDiamondX - lineWidth - (narrow ? 12 : 16), y - 1, lineWidth, 2);
    decor.fillRect(rightDiamondX + (narrow ? 12 : 16), y - 1, lineWidth, 2);
  }

  private drawLevelPreview(
    entry: CampaignLevelEntry,
    preview: CampaignLevelPreview,
    cardLayout: LevelCardLayout,
    state: keyof typeof STATE_COLOR,
  ): void {
    if (preview.status === 'unstarted') {
      this.add.rectangle(
        cardLayout.x,
        cardLayout.y,
        cardLayout.width - 4,
        cardLayout.height - 4,
        0xf3eee5,
        state === 'locked' ? 0.08 : 0.12,
      );
      this.add.text(cardLayout.x, cardLayout.y, '?', {
        fontFamily: 'monospace',
        fontSize: `${Math.max(22, Math.floor(cardLayout.width * 0.5))}px`,
        color: state === 'locked' ? '#7f8ba2' : '#d8d1c4',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      return;
    }

    drawLevelThumbnail(
      this,
      entry.level,
      preview.walls,
      {
        x: cardLayout.x,
        y: cardLayout.y,
        width: cardLayout.width,
        height: cardLayout.height,
      },
      { showIncompleteOverlay: preview.showIncompleteOverlay },
    );
  }

  private createActionButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: string,
    onActivate: () => void,
  ): void {
    const button = createHomeMenuButton(this, {
      x,
      y,
      width,
      height,
      label,
      labelColor: color,
      icon: 'play',
      accentFrame: true,
      onActivate: (pointer) => {
        if (!this.shouldActivatePointer(pointer, true)) return;
        onActivate();
      },
    });
    this.centerActionButtonContent(button, x, y);
    this.pinHomeMenuButton(button);
  }

  private centerActionButtonContent(button: HomeMenuButtonHandle, x: number, y: number): void {
    const gap = this.scale.width < 700 ? 10 : 12;
    const contentWidth = button.icon.displayWidth + gap + button.label.width;
    const startX = x - contentWidth / 2;
    button.icon.setPosition(startX + button.icon.displayWidth / 2, y);
    button.label.setPosition(startX + button.icon.displayWidth + gap, y);
  }

  private pinHomeMenuButton(button: HomeMenuButtonHandle): void {
    button.fill.setScrollFactor(0).setDepth(1002);
    button.frame.setScrollFactor(0).setDepth(1003);
    button.icon.setScrollFactor(0).setDepth(1004);
    button.label.setScrollFactor(0).setDepth(1004);
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

  private getProfileService(): PlayerProfileService {
    const service = this.registry.get(PLAYER_PROFILE_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof PlayerProfileService)) {
      throw new Error('LevelSelectScene requires PlayerProfileService in Phaser registry.');
    }
    return service;
  }

  private getTutorialService(): TutorialService {
    const service = this.registry.get(TUTORIAL_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof TutorialService)) {
      throw new Error('LevelSelectScene requires TutorialService in Phaser registry.');
    }
    return service;
  }

  private getCampaignService(): CampaignService {
    const service = this.registry.get(CAMPAIGN_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof CampaignService)) {
      throw new Error('LevelSelectScene requires CampaignService in Phaser registry.');
    }
    return service;
  }

  private async launchTutorial(service: TutorialService, entry: TutorialLevelEntry): Promise<void> {
    if (this.launchPending || !service.canPlayLevel(entry.id)) return;
    this.launchPending = true;

    try {
      const startedEntry = await service.startLevel(entry.id);
      this.scene.start('GameScene', createTutorialGameSceneData(startedEntry));
    } catch (error) {
      this.launchPending = false;
      console.error(`[Dungeon Logic] Could not start ${entry.id}.`, error);
    }
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
