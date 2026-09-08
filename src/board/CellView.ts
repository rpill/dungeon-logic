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
  private readonly marker: Phaser.GameObjects.Text;
  private readonly fixedVisual: FixedCellVisual;

  private size: number;
  private state: CellStateValue = CellState.Unknown;
  private conflict = false;
  private hovered = false;

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

  relayout(centerX: number, centerY: number, size: number): void {
    this.size = size;
    const visualSize = Math.max(1, size - WIREFRAME.gap);

    for (const rectangle of [this.floor, this.wall, this.hoverOverlay]) {
      rectangle
        .setPosition(centerX, centerY)
        .setDisplaySize(visualSize, visualSize);
    }

    this.marker
      .setPosition(centerX, centerY)
      .setFontSize(this.getMarkerFontSize());
  }

  private getMarkerFontSize(): number {
    return this.fixedVisual === null
      ? Math.max(14, Math.round(this.size * 0.24))
      : Math.max(18, Math.round(this.size * 0.46));
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
  }

  private renderHover(): void {
    this.hoverOverlay.setVisible(this.fixedVisual === null && this.hovered);
  }
}
