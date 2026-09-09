import type Phaser from 'phaser';

import {
  CellState,
  type CellState as CellStateValue,
} from '../puzzle/types';

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

type CellPointerHandler = (
  pointer: Phaser.Input.Pointer,
) => void;

export type FixedCellVisual =
  | { readonly kind: 'monster'; readonly marker: 'M' }
  | { readonly kind: 'chest'; readonly marker: 'C' }
  | { readonly kind: 'technical'; readonly marker: 'X' | '↔' | '↕' }
  | null;

export class CellView {
  private readonly floor: Phaser.GameObjects.Rectangle;
  private readonly wall: Phaser.GameObjects.Rectangle;
  private readonly hoverOverlay: Phaser.GameObjects.Rectangle;
  private readonly hintOverlay: Phaser.GameObjects.Rectangle;
  private readonly hintWallPreview: Phaser.GameObjects.Rectangle;
  private readonly hintFloorPreview: Phaser.GameObjects.Text;
  private readonly marker: Phaser.GameObjects.Text;
  private readonly fixedVisual: FixedCellVisual;

  private size: number;
  private state: CellStateValue = CellState.Unknown;
  private conflict = false;
  private hovered = false;
  private hintState: typeof CellState.Wall | typeof CellState.Floor | null = null;

  constructor(
    scene: Phaser.Scene,
    centerX: number,
    centerY: number,
    size: number,
    fixedVisual: FixedCellVisual,
    onPointerDown: CellPointerHandler,
    onPointerOver: CellPointerHandler,
  ) {
    this.fixedVisual = fixedVisual;
    this.size = size;

    const visualSize = Math.max(1, size - WIREFRAME.gap);

    this.floor = scene.add
      .rectangle(
        centerX,
        centerY,
        visualSize,
        visualSize,
        WIREFRAME.floor,
        1,
      );

    this.wall = scene.add
      .rectangle(
        centerX,
        centerY,
        visualSize,
        visualSize,
        WIREFRAME.wall,
        1,
      )
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

    this.marker = scene.add
      .text(
        centerX,
        centerY,
        fixedVisual?.marker ?? '◆',
        {
          fontFamily: 'monospace',
          fontSize: `${this.getMarkerFontSize()}px`,
          color: fixedVisual === null
            ? WIREFRAME.mark
            : WIREFRAME.fixedText,
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5)
      .setVisible(fixedVisual !== null);

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

  relayout(centerX: number, centerY: number, size: number): void {
    this.size = size;
    const visualSize = Math.max(1, size - WIREFRAME.gap);

    for (const rectangle of [this.floor, this.wall, this.hoverOverlay, this.hintOverlay]) {
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
    this.marker
      .setPosition(centerX, centerY)
      .setFontSize(this.getMarkerFontSize());
  }

  private getMarkerFontSize(): number {
    return this.fixedVisual === null
      ? Math.max(14, Math.round(this.size * 0.24))
      : Math.max(18, Math.round(this.size * 0.46));
  }

  private getHintMarkerFontSize(): number {
    return Math.max(18, Math.round(this.size * 0.34));
  }

  private render(): void {
    if (this.fixedVisual !== null) {
      this.floor.setFillStyle(WIREFRAME.floor, 1);
      this.wall.setVisible(false);
      this.marker
        .setColor(WIREFRAME.fixedText)
        .setFontSize(this.getMarkerFontSize())
        .setText(this.fixedVisual.marker)
        .setVisible(true);
      this.renderHover();
      this.renderHint();
      return;
    }

    switch (this.state) {
      case CellState.Unknown:
        this.floor.setFillStyle(WIREFRAME.floor, 1);
        this.wall.setVisible(false);
        this.marker.setVisible(false);
        break;

      case CellState.Wall:
        this.floor.setFillStyle(WIREFRAME.floor, 1);
        this.wall
          .setFillStyle(
            this.conflict ? WIREFRAME.conflictWall : WIREFRAME.wall,
            1,
          )
          .setVisible(true);
        this.marker.setVisible(false);
        break;

      case CellState.Floor:
        this.floor.setFillStyle(WIREFRAME.floor, 1);
        this.wall.setVisible(false);
        this.marker
          .setColor(WIREFRAME.mark)
          .setFontSize(this.getMarkerFontSize())
          .setText('◆')
          .setVisible(true);
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
