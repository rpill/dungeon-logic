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
  hintTint: 0xd0b978,
  hintAlpha: 0.10,
  hintPreviewAlpha: 0.58,
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
  private readonly hintOverlay: Phaser.GameObjects.Rectangle;
  private readonly hintWallPreview: Phaser.GameObjects.Rectangle;
  private readonly hintFloorPreview: Phaser.GameObjects.Text;
  private readonly fixedMarker: Phaser.GameObjects.Text;
  private readonly fixedSprite: Phaser.GameObjects.Image | null;
  private readonly fixedVisual: FixedCellVisual;

  private size: number;
  private state: CellStateValue = CellState.Unknown;
  private conflict = false;
  private hovered = false;
  private hintState: typeof CellState.Wall | typeof CellState.Floor | null = null;
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

    this.hintOverlay = scene.add
      .rectangle(
        centerX,
        centerY,
        visualSize,
        visualSize,
        WIREFRAME.hintTint,
        WIREFRAME.hintAlpha,
      )
      .setVisible(false);

    this.hintWallPreview = scene.add
      .rectangle(
        centerX,
        centerY,
        Math.max(10, visualSize * 0.64),
        Math.max(10, visualSize * 0.64),
        WIREFRAME.hintTint,
        WIREFRAME.hintPreviewAlpha,
      )
      .setVisible(false);

    this.hintFloorPreview = scene.add
      .text(
        centerX,
        centerY,
        '◆',
        {
          fontFamily: 'monospace',
          fontSize: `${this.getHintMarkerFontSize()}px`,
          color: '#d0b978',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5)
      .setVisible(false);

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
    this.renderHint();
  }

  setSolvedVisualState(solved: boolean): void {
    if (this.fixedVisual === null || this.fixedVisual.kind === 'technical') return;
    if (this.solvedVisualState === solved) return;
    this.solvedVisualState = solved;

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

    for (const image of [this.floor, this.wall, this.floorMark]) {
      image
        .setPosition(centerX, centerY)
        .setDisplaySize(visualSize, visualSize);
    }

    this.resizeFixedSprite(centerX, centerY, visualSize);

    for (const rectangle of [this.hoverOverlay, this.hintOverlay]) {
      rectangle
        .setPosition(centerX, centerY)
        .setDisplaySize(visualSize, visualSize);
    }

    this.hintWallPreview
      .setPosition(centerX, centerY)
      .setDisplaySize(Math.max(10, visualSize * 0.64), Math.max(10, visualSize * 0.64));
    this.hintFloorPreview
      .setPosition(centerX, centerY)
      .setFontSize(this.getHintMarkerFontSize());
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

  private getHintMarkerFontSize(): number {
    return Math.max(18, Math.round(this.size * 0.34));
  }

  private render(): void {
    if (this.fixedVisual !== null) {
      this.wall.setVisible(false).clearTint();
      this.floorMark.setVisible(false);
      this.fixedMarker.setVisible(this.fixedVisual.kind === 'technical');
      this.fixedSprite?.setVisible(this.fixedVisual.kind === 'monster' || this.fixedVisual.kind === 'chest');
      this.renderHover();
      this.renderHint();
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
        this.floorMark.setVisible(true);
        break;
    }

    this.renderHover();
    this.renderHint();
  }

  private renderHover(): void {
    this.hoverOverlay.setVisible(this.fixedVisual === null && this.hovered);
  }

  private renderHint(): void {
    const visible = this.fixedVisual === null && this.hintState !== null;
    this.hintOverlay.setVisible(visible);
    this.hintWallPreview.setVisible(visible && this.hintState === CellState.Wall);
    this.hintFloorPreview.setVisible(visible && this.hintState === CellState.Floor);
  }
}
