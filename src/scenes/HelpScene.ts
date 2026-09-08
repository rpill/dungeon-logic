import Phaser from 'phaser';

import { HELP_SCENE_KEY, type HelpReturnSceneKey, type HelpSceneData } from '../help/HelpNavigation';
import { HELP_RULES, type HelpRule } from '../help/HelpRules';
import { MetaPointerGate } from '../runtime/MetaPointerGate';
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

    const narrow = this.scale.width < 700;
    const headerBottom = narrow ? 86 : 96;
    const contentWidth = Math.min(this.scale.width - (narrow ? 24 : 48), narrow ? 620 : 820);
    const cardGap = narrow ? 10 : 14;
    let cursorY = headerBottom + (narrow ? 14 : 18);

    this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x111318,
      1,
    ).setScrollFactor(0).setDepth(-1000);

    this.add.rectangle(
      this.scale.width / 2,
      headerBottom / 2,
      this.scale.width,
      headerBottom,
      0x111318,
      1,
    ).setScrollFactor(0).setDepth(1000);

    const back = this.add.text(16, narrow ? 17 : 20, '← НАЗАД', {
      fontFamily: 'monospace',
      fontSize: narrow ? '14px' : '16px',
      color: '#89929d',
      fontStyle: 'bold',
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(1002).setInteractive({ useHandCursor: true });

    this.add.text(this.scale.width / 2, narrow ? 54 : 60, 'КАК ИГРАТЬ', {
      fontFamily: 'monospace',
      fontSize: narrow ? '25px' : '31px',
      color: '#f0e6d2',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002);

    for (const rule of HELP_RULES) {
      cursorY = this.createRuleCard(rule, cursorY, contentWidth, narrow) + cardGap;
    }
    this.contentBottom = cursorY;

    const handlePointerDown = (pointer: Phaser.Input.Pointer): void => {
      this.pointerGate.notePointerDown(pointer.id);
    };
    this.input.on('pointerdown', handlePointerDown);

    this.setupScroll();

    back.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.shouldActivatePointer(pointer)) return;
      this.closeHelp();
    });

    const handleResize = (): void => {
      if (!this.scene.isActive()) return;
      this.scene.restart({ returnSceneKey: this.returnSceneKey });
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, handleResize);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', handlePointerDown);
      this.scale.off(Phaser.Scale.Events.RESIZE, handleResize);
    });
  }

  private createRuleCard(
    rule: HelpRule,
    topY: number,
    width: number,
    narrow: boolean,
  ): number {
    const left = this.scale.width / 2 - width / 2;
    const paddingX = narrow ? 14 : 18;
    const paddingY = narrow ? 13 : 16;
    const textWidth = width - paddingX * 2;

    const title = this.add.text(left + paddingX, topY + paddingY, rule.title, {
      fontFamily: 'monospace',
      fontSize: narrow ? '15px' : '17px',
      color: '#d0b978',
      fontStyle: 'bold',
      wordWrap: { width: textWidth },
    }).setOrigin(0, 0).setDepth(1);

    const body = this.add.text(left + paddingX, title.y + title.height + 8, rule.body, {
      fontFamily: 'monospace',
      fontSize: narrow ? '12px' : '14px',
      color: '#d8d1c4',
      lineSpacing: narrow ? 3 : 4,
      wordWrap: { width: textWidth },
    }).setOrigin(0, 0).setDepth(1);

    let bottom = body.y + body.height;
    if (rule.diagram !== undefined) {
      const diagram = this.add.text(left + paddingX, bottom + 10, rule.diagram, {
        fontFamily: 'monospace',
        fontSize: narrow ? '14px' : '16px',
        color: '#f0e6d2',
        lineSpacing: 2,
      }).setOrigin(0, 0).setDepth(1);
      bottom = diagram.y + diagram.height;
    }

    const cardHeight = bottom - topY + paddingY;
    this.add.rectangle(
      this.scale.width / 2,
      topY + cardHeight / 2,
      width,
      cardHeight,
      0x20252c,
      1,
    ).setStrokeStyle(1, 0x4f565f, 1).setDepth(0);

    return topY + cardHeight;
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

  private closeHelp(): void {
    const returnSceneKey = this.returnSceneKey;
    this.time.delayedCall(0, () => {
      this.scene.resume(returnSceneKey);
      this.scene.stop();
    });
  }
}
