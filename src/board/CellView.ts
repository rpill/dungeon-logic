import Phaser from 'phaser';

import {
  CellState,
  type CellState as CellStateValue,
} from '../puzzle/types';

type CellPointerHandler = (
  pointer: Phaser.Input.Pointer,
) => void;

const UNKNOWN_COLOR = 0x252a30;
const WALL_COLOR = 0x827565;
const WALL_CONFLICT_COLOR = 0xd9574f;

const DEFAULT_BORDER_COLOR = 0x59616a;
const HOVER_BORDER_COLOR = 0xb2bac4;

export class CellView {
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly marker: Phaser.GameObjects.Text;

  private readonly fixedMarker:
    string | null;

  private state: CellStateValue =
    CellState.Unknown;

  private conflict = false;

  constructor(
    scene: Phaser.Scene,
    centerX: number,
    centerY: number,
    size: number,
    fixedMarker: string | null,
    onPointerDown: CellPointerHandler,
    onPointerOver: CellPointerHandler,
  ) {
    this.fixedMarker = fixedMarker;

    this.background = scene.add
      .rectangle(
        centerX,
        centerY,
        size - 6,
        size - 6,
        UNKNOWN_COLOR,
      )
      .setStrokeStyle(
        2,
        DEFAULT_BORDER_COLOR,
      );

    this.marker = scene.add
      .text(
        centerX,
        centerY,
        '',
        {
          fontFamily: 'monospace',
          fontSize: '34px',
          color: '#d9d3c7',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);

    if (fixedMarker !== null) {
      this.state = CellState.Floor;
      this.render();

      return;
    }

    this.background
      .setInteractive({
        useHandCursor: true,
      })
      .on(
        'pointerdown',
        (
          pointer: Phaser.Input.Pointer,
        ) => {
          onPointerDown(pointer);
        },
      );

    this.background.on(
      'pointerover',
      (
        pointer: Phaser.Input.Pointer,
      ) => {
        this.background.setStrokeStyle(
          3,
          HOVER_BORDER_COLOR,
        );

        onPointerOver(pointer);
      },
    );

    this.background.on(
      'pointerout',
      () => {
        this.background.setStrokeStyle(
          2,
          DEFAULT_BORDER_COLOR,
        );
      },
    );
  }

  setState(
    state: CellStateValue,
  ): void {
    this.state = state;
    this.render();
  }

  setConflict(
    conflict: boolean,
  ): void {
    this.conflict = conflict;
    this.render();
  }

  private render(): void {
    if (this.fixedMarker !== null) {
      this.background.setFillStyle(
        0x3c3540,
      );

      this.background.setStrokeStyle(
        2,
        0x9f849f,
      );

      this.marker.setText(
        this.fixedMarker,
      );

      return;
    }

    switch (this.state) {
      case CellState.Unknown:
        this.background.setFillStyle(
          UNKNOWN_COLOR,
        );

        this.marker.setText('');
        break;

      case CellState.Wall:
        this.background.setFillStyle(
          this.conflict
            ? WALL_CONFLICT_COLOR
            : WALL_COLOR,
        );

        this.marker.setText('');
        break;

      case CellState.Floor:
        this.background.setFillStyle(
          UNKNOWN_COLOR,
        );

        this.marker.setText('·');
        break;
    }
  }
}