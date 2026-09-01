import Phaser from 'phaser';

import { BoardView } from '../board/BoardView';
import { level001 } from '../data/levels/level001';

import {
  validatePuzzle,
} from '../puzzle/LevelValidator';

import { PuzzleState } from '../puzzle/PuzzleState';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create(): void {
    this.add
      .text(
        this.scale.width / 2,
        52,
        'Dungeon Logic',
        {
          fontFamily: 'monospace',
          fontSize: '42px',
          color: '#f0e6d2',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(
        this.scale.width - 40,
        52,
        'Restart',
        {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#89929d',
          fontStyle: 'bold',
        },
      )
      .setOrigin(1, 0.5)
      .setInteractive({
        useHandCursor: true,
      })
      .on(
        'pointerdown',
        () => {
          this.scene.restart();
        },
      );

    const puzzle =
      new PuzzleState(level001);

    const cellSize = 72;

    const boardWidth =
      level001.width * cellSize;

    const boardHeight =
      level001.height * cellSize;

    const originX =
      (
        this.scale.width -
        boardWidth
      ) / 2;

    const originY =
      (
        this.scale.height -
        boardHeight
      ) / 2 + 30;

    const statusText =
      this.add
        .text(
          this.scale.width / 2,
          this.scale.height - 42,
          'Hold left: Walls   •   Hold right: Floor marks',
          {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#89929d',
            fontStyle: 'bold',
          },
        )
        .setOrigin(0.5);

    let board:
      BoardView | null = null;

    let solved = false;

    const handlePuzzleChanged =
      (): void => {
        if (solved) {
          return;
        }

        const validation =
          validatePuzzle(puzzle);

        if (
          !validation.isSolved
        ) {
          return;
        }

        solved = true;

        board?.setInputEnabled(
          false,
        );

        statusText
          .setText(
            'Dungeon complete!',
          )
          .setColor(
            '#d8d1c4',
          );
      };

    board = new BoardView(
      this,
      puzzle,
      originX,
      originY,
      cellSize,
      handlePuzzleChanged,
    );
  }
}