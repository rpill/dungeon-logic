import Phaser from 'phaser';

import {
  CellState,
  type CellState as CellStateValue,
} from '../puzzle/types';

type CellPointerHandler = (
  pointer: Phaser.Input.Pointer,
) => void;

export class CellView {
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly marker: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    centerX: number,
    centerY: number,
    size: number,
    isMonster: boolean,
    onPointerDown: CellPointerHandler,
    onPointerOver: CellPointerHandler,
  ) {
    this.background = scene.add
      .rectangle(
        centerX,
        centerY,
        size - 6,
        size - 6,
        0x252a30,
      )
      .setStrokeStyle(
        2,
        0x59616a,
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

    if (isMonster) {
      this.marker.setText('M');

      this.background.setFillStyle(
        0x3c3540,
      );

      this.background.setStrokeStyle(
        2,
        0x9f849f,
      );

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
          0xb2bac4,
        );

        onPointerOver(pointer);
      },
    );

    this.background.on(
      'pointerout',
      () => {
        this.background.setStrokeStyle(
          2,
          0x59616a,
        );
      },
    );
  }

  setState(
    state: CellStateValue,
  ): void {
    switch (state) {
      case CellState.Unknown:
        this.background.setFillStyle(
          0x252a30,
        );

        this.marker.setText('');
        break;

      case CellState.Wall:
        this.background.setFillStyle(
          0x827565,
        );

        this.marker.setText('');
        break;

      case CellState.Floor:
        this.background.setFillStyle(
          0x252a30,
        );

        this.marker.setText('·');
        break;
    }
  }
}