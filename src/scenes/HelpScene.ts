import Phaser from 'phaser';

import { ANALYTICS_SERVICE_REGISTRY_KEY, type AnalyticsService } from '../analytics/AnalyticsService';

import { renderHelpIllustration } from '../help/HelpIllustrations';
import { HELP_SCENE_KEY, type HelpReturnSceneKey, type HelpSceneData } from '../help/HelpNavigation';
import {
  getHelpRules,
  getHelpUtilities,
  type HelpRule,
  type HelpUtility,
} from '../help/HelpRules';
import { getUiCopy } from '../i18n/UiCopy';
import {
  PLAYER_PROFILE_SERVICE_REGISTRY_KEY,
  PlayerProfileService,
} from '../profile/PlayerProfileService';
import { createCenteredTextMenuButton } from '../runtime/HomeMenuButton';
import { createMetaPageHeader } from '../runtime/MetaPageHeader';
import { calculateMetaPageHeaderMetrics } from '../runtime/MetaPageHeaderLayout';
import { MetaPointerGate } from '../runtime/MetaPointerGate';
import { createSceneBackground } from '../runtime/SceneBackground';
import { createQuietInset } from '../runtime/QuietInset';
import {
  clampMetaScrollY,
  getMetaScrollMaxY,
  isMetaScrollDrag,
} from '../runtime/MetaScroll';

export class HelpScene extends Phaser.Scene {
  private returnSceneKey: HelpReturnSceneKey = 'HomeScene';
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
    super(HELP_SCENE_KEY);
  }

  init(data: HelpSceneData): void {
    this.returnSceneKey = data.returnSceneKey;
  }

  create(): void {
    this.contentBottom = 0;
    this.scrollMaxY = 0;
    this.scrollPointerId = null;
    this.scrollGestureDragged = false;
    this.lastDraggedPointerId = null;
    this.lastDragEndedAtMs = 0;
    this.pointerGate.reset();
    this.cameras.main.setScroll(0, 0);

    const language = this.getProfileService().getProfile().settings.language;
    const copy = getUiCopy(language);
    const analytics = this.registry.get(ANALYTICS_SERVICE_REGISTRY_KEY) as AnalyticsService | undefined;
    analytics?.screenView('help');
    const header = calculateMetaPageHeaderMetrics(this.scale.width, this.scale.height);
    const narrow = header.narrow;
    const contentWidth = Math.min(this.scale.width - (narrow ? 24 : 64), narrow ? 620 : 1040);
    const panelTop = header.headerHeight + (narrow ? 14 : 24);
    let cursorY = panelTop + (narrow ? 24 : 34);

    const sceneBackground = createSceneBackground(this, 'meta');
    sceneBackground.image.setScrollFactor(0);

    createMetaPageHeader(this, {
      title: copy.help.title,
      backLabel: copy.common.back,
      backButton: true,
      onBack: (pointer) => {
        if (!this.shouldActivatePointer(pointer)) return;
        this.closeHelp();
      },
    });

    const sections = [...getHelpRules(language), ...getHelpUtilities(language)];
    const dividers = this.add.graphics().setDepth(2);
    for (const [index, section] of sections.entries()) {
      cursorY = this.createSection(section, cursorY, contentWidth, narrow);
      if (index < sections.length - 1) {
        const halfWidth = contentWidth / 2 - (narrow ? 22 : 38);
        dividers.lineStyle(1, 0x9ca9b4, 0.25);
        dividers.lineBetween(this.scale.width / 2 - halfWidth, cursorY, this.scale.width / 2 + halfWidth, cursorY);
        cursorY += narrow ? 26 : 34;
      }
    }

    const ctaWidth = Math.min(narrow ? 260 : 300, this.scale.width - (narrow ? 32 : 80));
    const ctaHeight = narrow ? 68 : 72;
    const ctaY = cursorY + ctaHeight / 2 + (narrow ? 18 : 28);
    const cta = createCenteredTextMenuButton(this, {
      x: this.scale.width / 2,
      y: ctaY,
      width: ctaWidth,
      height: ctaHeight,
      label: copy.help.done,
      labelColor: '#f4ead7',
      accentFrame: true,
      onActivate: (pointer) => {
        if (!this.shouldActivatePointer(pointer)) return;
        this.closeHelp();
      },
    });
    cta.fill.setDepth(2);
    cta.frame.setDepth(3);
    cta.label.setDepth(4);
    const panelBottom = ctaY + ctaHeight / 2 + (narrow ? 24 : 34);
    createQuietInset(this, {
      x: this.scale.width / 2,
      y: (panelTop + panelBottom) / 2,
      width: contentWidth,
      height: panelBottom - panelTop,
      radius: narrow ? 15 : 20,
      fillAlpha: 0.98,
      borderAlpha: 0.42,
    }).setDepth(1);
    this.contentBottom = panelBottom + (narrow ? 18 : 30);

    const handlePointerDown = (pointer: Phaser.Input.Pointer): void => {
      this.pointerGate.notePointerDown(pointer.id);
    };
    this.input.on('pointerdown', handlePointerDown);

    this.setupScroll();

    const handleResize = (): void => {
      sceneBackground.sync();
      if (!this.scene.isActive()) return;
      this.scene.restart({ returnSceneKey: this.returnSceneKey });
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', handlePointerDown);
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
    });
  }

  private createSection(
    content: HelpRule | HelpUtility,
    topY: number,
    width: number,
    narrow: boolean,
  ): number {
    const left = this.scale.width / 2 - width / 2;
    const paddingX = narrow ? 22 : 40;
    const textWidth = narrow ? width - paddingX * 2 : Math.round((width - paddingX * 2) * 0.57);
    const illustrationWidth = width - paddingX * 2 - textWidth - 24;

    const title = this.add.text(left + paddingX, topY, content.title, {
      fontFamily: "'Balsamiq Sans', sans-serif",
      fontSize: narrow ? '17px' : '21px',
      color: '#f0bd63',
      fontStyle: 'bold',
      wordWrap: { width: textWidth },
    }).setOrigin(0, 0).setDepth(3);

    const titleMark = this.add.graphics().setDepth(3);
    titleMark.fillStyle(0xf0b14f, 0.95);
    const diamondX = left + paddingX - (narrow ? 8 : 10);
    const diamondY = title.y + title.height / 2;
    const diamondSize = narrow ? 3 : 4;
    titleMark.beginPath();
    titleMark.moveTo(diamondX, diamondY - diamondSize);
    titleMark.lineTo(diamondX + diamondSize, diamondY);
    titleMark.lineTo(diamondX, diamondY + diamondSize);
    titleMark.lineTo(diamondX - diamondSize, diamondY);
    titleMark.closePath();
    titleMark.fillPath();

    const body = this.add.text(left + paddingX, title.y + title.height + (narrow ? 9 : 12), content.body, {
      fontFamily: "'Balsamiq Sans', sans-serif",
      fontSize: narrow ? '14px' : '17px',
      color: '#e7e1d6',
      lineSpacing: narrow ? 4 : 6,
      wordWrap: { width: textWidth },
    }).setOrigin(0, 0).setDepth(3);

    const illustrationTop = narrow ? body.y + body.height + 16 : topY + 4;
    const illustrationHeight = renderHelpIllustration(this, content.id, {
      x: narrow ? this.scale.width / 2 : left + paddingX + textWidth + 24 + illustrationWidth / 2,
      topY: illustrationTop,
      width: narrow ? textWidth : illustrationWidth,
      narrow,
      language: this.getProfileService().getProfile().settings.language,
    });
    return Math.max(body.y + body.height, illustrationTop + illustrationHeight) + (narrow ? 24 : 30);
  }

  private setupScroll(): void {
    this.scrollMaxY = getMetaScrollMaxY(this.scale.height, this.contentBottom, 28);
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

  private getProfileService(): PlayerProfileService {
    const service = this.registry.get(PLAYER_PROFILE_SERVICE_REGISTRY_KEY) as unknown;
    if (!(service instanceof PlayerProfileService)) {
      throw new Error('HelpScene requires PlayerProfileService in Phaser registry.');
    }
    return service;
  }

  private closeHelp(): void {
    const returnSceneKey = this.returnSceneKey;
    this.time.delayedCall(0, () => {
      this.scene.resume(returnSceneKey);
      this.scene.stop();
    });
  }
}
