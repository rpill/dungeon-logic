import type Phaser from 'phaser';

import {
  CellState,
  type CellState as CellStateValue,
} from '../puzzle/types';
import {
  BOARD_FLOOR_MARK_KEY,
  type BoardFloorTextureKey,
  type BoardWallTextureKey,
} from '../view/BoardThemeAssets';
import {
  CHEST_CLOSED_TEXTURE_KEY,
  CHEST_OPEN_TEXTURE_KEY,
} from '../view/FixedObjectAssets';

export const WIREFRAME = {
  background: 0x111318,
  floor: 0x252a30,
  wall: 0x827565,
  grid: 0x111318,
  clueCell: 0x171b20,
  mark: '#d54a42',
  clueActive: '#d54a42',
  clueComplete: '#777b7d',
  fixedText: '#d9d3c7',
  conflictWall: 0x8d4545,
  hoverTint: 0xf0e6d2,
  hoverAlpha: 0.10,
  gap: 2,
} as const;

const MONSTER_FRAME_MS = 180;

type CellPointerHandler = (
  pointer: Phaser.Input.Pointer,
) => void;


export type FixedCellVisual =
  | { readonly kind: 'monster'; readonly monsterFrameKeys: readonly string[] }
  | { readonly kind: 'chest' }
  | { readonly kind: 'technical'; readonly marker: 'X' | '↔' | '↕' }
  | null;

export class CellView {
  private readonly scene: Phaser.Scene;
  private readonly floor: Phaser.GameObjects.Image;
  private readonly wall: Phaser.GameObjects.Image;
  private readonly floorMark: Phaser.GameObjects.Image;
  private readonly hoverOverlay: Phaser.GameObjects.Rectangle;
  private readonly guidanceWallGhost: Phaser.GameObjects.Image;
  private readonly guidanceFloorGhost: Phaser.GameObjects.Image;
  private readonly fixedMarker: Phaser.GameObjects.Text;
  private readonly fixedSprite: Phaser.GameObjects.Image | null;
  private readonly fixedVisual: FixedCellVisual;

  private size: number;
  private state: CellStateValue = CellState.Unknown;
  private conflict = false;
  private hovered = false;
  private hintState: typeof CellState.Wall | typeof CellState.Floor | null = null;
  private tutorialTargetState: typeof CellState.Wall | typeof CellState.Floor | null = null;
  private readonly guidancePulseTween: Phaser.Tweens.Tween;
  private guidancePulseActive = false;
  private monsterAnimationEvent: Phaser.Time.TimerEvent | null = null;
  private monsterFrameIndex = 0;
  private solvedVisualState = false;

  constructor(
    scene: Phaser.Scene,
    centerX: number,
    centerY: number,
    size: number,
    fixedVisual: FixedCellVisual,
    floorTextureKey: BoardFloorTextureKey,
    wallTextureKey: BoardWallTextureKey,
    onPointerDown: CellPointerHandler,
    onPointerOver: CellPointerHandler,
  ) {
    this.scene = scene;
    this.fixedVisual = fixedVisual;
    this.size = size;

    const visualSize = Math.max(1, size - WIREFRAME.gap);

    this.floor = scene.add
      .image(centerX, centerY, floorTextureKey)
      .setDisplaySize(visualSize, visualSize);

    this.wall = scene.add
      .image(centerX, centerY, wallTextureKey)
      .setDisplaySize(visualSize, visualSize)
      .setVisible(false);

    this.floorMark = scene.add
      .image(centerX, centerY, BOARD_FLOOR_MARK_KEY)
      .setDisplaySize(visualSize, visualSize)
      .setVisible(false);

    this.hoverOverlay = scene.add
      .rectangle(
        centerX,
        centerY,
        visualSize,
        visualSize,
        WIREFRAME.hoverTint,
        WIREFRAME.hoverAlpha,
      )
      .setVisible(false);

    this.guidanceWallGhost = scene.add
      .image(centerX, centerY, wallTextureKey)
      .setDisplaySize(visualSize, visualSize)
      .setAlpha(0.32)
      .setVisible(false);

    this.guidanceFloorGhost = scene.add
      .image(centerX, centerY, BOARD_FLOOR_MARK_KEY)
      .setDisplaySize(visualSize, visualSize)
      .setAlpha(0.4)
      .setTint(0xd54a42)
      .setVisible(false);

    this.guidancePulseTween = scene.tweens.add({
      targets: [this.guidanceWallGhost, this.guidanceFloorGhost],
      alpha: { from: 0.28, to: 0.72 },
      duration: 680,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      paused: true,
    });

    this.fixedMarker = scene.add
      .text(
        centerX,
        centerY,
        fixedVisual?.kind === 'technical' ? fixedVisual.marker : '',
        {
          fontFamily: 'monospace',
          fontSize: `${this.getFixedMarkerFontSize()}px`,
          color: WIREFRAME.fixedText,
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5)
      .setVisible(fixedVisual?.kind === 'technical');

    this.fixedSprite = fixedVisual?.kind === 'monster'
      ? scene.add.image(centerX, centerY, fixedVisual.monsterFrameKeys[0]!)
      : fixedVisual?.kind === 'chest'
        ? scene.add.image(centerX, centerY, CHEST_CLOSED_TEXTURE_KEY)
        : null;
    this.resizeFixedSprite(centerX, centerY, visualSize);

    if (fixedVisual !== null) {
      this.state = CellState.Floor;
      this.render();
      return;
    }

    this.floor
      .setInteractive({ useHandCursor: true })
      .on(
        'pointerdown',
        (pointer: Phaser.Input.Pointer) => {
          onPointerDown(pointer);
        },
      )
      .on(
        'pointerover',
        (pointer: Phaser.Input.Pointer) => {
          this.hovered = true;
          this.renderHover();
          onPointerOver(pointer);
        },
      )
      .on(
        'pointerout',
        () => {
          this.hovered = false;
          this.renderHover();
        },
      );

    this.render();
  }

  setState(state: CellStateValue): void {
    this.state = state;
    this.render();
  }

  setConflict(conflict: boolean): void {
    this.conflict = conflict;
    this.render();
  }

  setHintTarget(state: typeof CellState.Wall | typeof CellState.Floor | null): void {
    this.hintState = state;
    this.renderGuidanceTarget();
  }

  setTutorialTarget(state: typeof CellState.Wall | typeof CellState.Floor | null): void {
    this.tutorialTargetState = state;
    this.renderGuidanceTarget();
  }

  setSolvedVisualState(solved: boolean): void {
    if (this.solvedVisualState === solved) return;
    this.solvedVisualState = solved;

    if (this.fixedVisual === null) {
      this.render();
      return;
    }
    if (this.fixedVisual.kind === 'technical') return;

    if (this.fixedVisual.kind === 'chest') {
      this.fixedSprite?.setTexture(solved ? CHEST_OPEN_TEXTURE_KEY : CHEST_CLOSED_TEXTURE_KEY);
      return;
    }

    this.stopMonsterAnimation();
    this.monsterFrameIndex = 0;
    this.fixedSprite?.setTexture(this.fixedVisual.monsterFrameKeys[0]!);
    if (!solved || this.fixedVisual.monsterFrameKeys.length <= 1) return;

    this.monsterAnimationEvent = this.scene.time.addEvent({
      delay: MONSTER_FRAME_MS,
      loop: true,
      callback: () => {
        if (this.fixedVisual?.kind !== 'monster') return;
        this.monsterFrameIndex = (this.monsterFrameIndex + 1) % this.fixedVisual.monsterFrameKeys.length;
        this.fixedSprite?.setTexture(this.fixedVisual.monsterFrameKeys[this.monsterFrameIndex]!);
      },
    });
  }

  relayout(centerX: number, centerY: number, size: number): void {
    this.size = size;
    const visualSize = Math.max(1, size - WIREFRAME.gap);

    for (const image of [this.floor, this.wall, this.floorMark, this.guidanceWallGhost, this.guidanceFloorGhost]) {
      image
        .setPosition(centerX, centerY)
        .setDisplaySize(visualSize, visualSize);
    }

    this.resizeFixedSprite(centerX, centerY, visualSize);

    this.hoverOverlay
      .setPosition(centerX, centerY)
      .setDisplaySize(visualSize, visualSize);
    this.fixedMarker
      .setPosition(centerX, centerY)
      .setFontSize(this.getFixedMarkerFontSize());
  }

  private resizeFixedSprite(centerX: number, centerY: number, visualSize: number): void {
    if (this.fixedSprite === null || this.fixedVisual === null || this.fixedVisual.kind === 'technical') return;
    const scale = this.fixedVisual.kind === 'chest' ? 0.92 : 0.96;
    this.fixedSprite
      .setPosition(centerX, centerY)
      .setDisplaySize(visualSize * scale, visualSize * scale);
  }

  private stopMonsterAnimation(): void {
    this.monsterAnimationEvent?.destroy();
    this.monsterAnimationEvent = null;
  }

  private getFixedMarkerFontSize(): number {
    return Math.max(18, Math.round(this.size * 0.46));
  }


  private render(): void {
    if (this.fixedVisual !== null) {
      this.wall.setVisible(false).clearTint();
      this.floorMark.setVisible(false);
      this.fixedMarker.setVisible(this.fixedVisual.kind === 'technical');
      this.fixedSprite?.setVisible(this.fixedVisual.kind === 'monster' || this.fixedVisual.kind === 'chest');
      this.renderHover();
      this.renderGuidanceTarget();
      return;
    }

    this.fixedMarker.setVisible(false);
    this.fixedSprite?.setVisible(false);

    switch (this.state) {
      case CellState.Unknown:
        this.wall.setVisible(false).clearTint();
        this.floorMark.setVisible(false);
        break;

      case CellState.Wall:
        this.wall.setVisible(true);
        if (this.conflict) {
          this.wall.setTint(WIREFRAME.conflictWall);
        } else {
          this.wall.clearTint();
        }
        this.floorMark.setVisible(false);
        break;

      case CellState.Floor:
        this.wall.setVisible(false).clearTint();
        this.floorMark.setVisible(!this.solvedVisualState);
        break;
    }

    this.renderHover();
    this.renderGuidanceTarget();
  }

  private renderHover(): void {
    this.hoverOverlay.setVisible(this.fixedVisual === null && this.hovered && !this.solvedVisualState);
  }

  private renderGuidanceTarget(): void {
    const guidanceState = this.tutorialTargetState ?? this.hintState;
    const guidanceVisible = this.fixedVisual === null
      && guidanceState !== null
      && this.state !== guidanceState;

    this.guidanceWallGhost.setVisible(guidanceVisible && guidanceState === CellState.Wall);
    this.guidanceFloorGhost.setVisible(guidanceVisible && guidanceState === CellState.Floor);

    if (guidanceVisible && !this.guidancePulseActive) {
      this.guidancePulseActive = true;
      this.guidancePulseTween.restart();
    } else if (!guidanceVisible && this.guidancePulseActive) {
      this.guidancePulseActive = false;
      this.guidancePulseTween.pause();
      this.guidanceWallGhost.setAlpha(0.32);
      this.guidanceFloorGhost.setAlpha(0.4);
    }
  }
}
