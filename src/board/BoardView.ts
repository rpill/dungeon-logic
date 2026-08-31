import Phaser from 'phaser';

import {
  CellState,
  type CellState as CellStateValue,
} from '../puzzle/types';

import { PuzzleState } from '../puzzle/PuzzleState';
import { CellView } from './CellView';

type DragTool =
  | 'wall'
  | 'floor';

interface DragState {
  tool: DragTool;
  erase: boolean;
  visited: Set<string>;
}

export class BoardView {
  private readonly scene: Phaser.Scene;
  private readonly puzzle: PuzzleState;
  private readonly originX: number;
  private readonly originY: number;
  private readonly cellSize: number;

  private readonly cells: CellView[][] = [];

  private dragState: DragState | null = null;

  constructor(
    scene: Phaser.Scene,
    puzzle: PuzzleState,
    originX: number,
    originY: number,
    cellSize: number,
  ) {
    this.scene = scene;
    this.puzzle = puzzle;
    this.originX = originX;
    this.originY = originY;
    this.cellSize = cellSize;

    this.createClues();
    this.createCells();

    this.scene.input.on(
      'pointerup',
      () => {
        this.endDrag();
      },
    );

    this.scene.input.on(
      'pointerupoutside',
      () => {
        this.endDrag();
      },
    );
  }

  private createClues(): void {
    const level = this.puzzle.level;

    for (
      let x = 0;
      x < level.width;
      x += 1
    ) {
      const centerX =
        this.originX +
        x * this.cellSize +
        this.cellSize / 2;

      this.scene.add
        .text(
          centerX,
          this.originY - 32,
          String(level.columnClues[x]),
          {
            fontFamily: 'monospace',
            fontSize: '26px',
            color: '#d8d1c4',
            fontStyle: 'bold',
          },
        )
        .setOrigin(0.5);
    }

    for (
      let y = 0;
      y < level.height;
      y += 1
    ) {
      const centerY =
        this.originY +
        y * this.cellSize +
        this.cellSize / 2;

      this.scene.add
        .text(
          this.originX - 36,
          centerY,
          String(level.rowClues[y]),
          {
            fontFamily: 'monospace',
            fontSize: '26px',
            color: '#d8d1c4',
            fontStyle: 'bold',
          },
        )
        .setOrigin(0.5);
    }
  }

  private createCells(): void {
    const level = this.puzzle.level;

    for (
      let y = 0;
      y < level.height;
      y += 1
    ) {
      const row: CellView[] = [];

      for (
        let x = 0;
        x < level.width;
        x += 1
      ) {
        const centerX =
          this.originX +
          x * this.cellSize +
          this.cellSize / 2;

        const centerY =
          this.originY +
          y * this.cellSize +
          this.cellSize / 2;

        const isMonster =
          this.puzzle.isMonster(
            x,
            y,
          );

        const cell = new CellView(
          this.scene,
          centerX,
          centerY,
          this.cellSize,
          isMonster,
          (pointer) => {
            this.beginDrag(
              x,
              y,
              cell,
              pointer,
            );
          },
          (pointer) => {
            this.continueDrag(
              x,
              y,
              cell,
              pointer,
            );
          },
        );

        cell.setState(
          this.puzzle.getCellState(
            x,
            y,
          ),
        );

        row.push(cell);
      }

      this.cells.push(row);
    }
  }

  private beginDrag(
    x: number,
    y: number,
    cell: CellView,
    pointer: Phaser.Input.Pointer,
  ): void {
    let tool: DragTool;

    if (pointer.leftButtonDown()) {
      tool = 'wall';
    } else if (
      pointer.rightButtonDown()
    ) {
      tool = 'floor';
    } else {
      return;
    }

    const current =
      this.puzzle.getCellState(
        x,
        y,
      );

    const erase =
      tool === 'wall'
        ? current === CellState.Wall
        : current === CellState.Floor;

    this.dragState = {
      tool,
      erase,
      visited: new Set<string>(),
    };

    this.applyDrag(
      x,
      y,
      cell,
    );
  }

  private continueDrag(
    x: number,
    y: number,
    cell: CellView,
    pointer: Phaser.Input.Pointer,
  ): void {
    if (this.dragState === null) {
      return;
    }

    const buttonStillDown =
      this.dragState.tool === 'wall'
        ? pointer.leftButtonDown()
        : pointer.rightButtonDown();

    if (!buttonStillDown) {
      this.endDrag();
      return;
    }

    this.applyDrag(
      x,
      y,
      cell,
    );
  }

  private applyDrag(
    x: number,
    y: number,
    cell: CellView,
  ): void {
    const dragState = this.dragState;

    if (dragState === null) {
      return;
    }

    const key = `${x}:${y}`;

    if (
      dragState.visited.has(key)
    ) {
      return;
    }

    dragState.visited.add(key);

    const current =
      this.puzzle.getCellState(
        x,
        y,
      );

    const next =
      this.getDragResult(
        current,
        dragState,
      );

    if (next === current) {
      return;
    }

    this.puzzle.setCellState(
      x,
      y,
      next,
    );

    cell.setState(next);
  }

  private getDragResult(
    current: CellStateValue,
    dragState: DragState,
  ): CellStateValue {
    if (dragState.tool === 'wall') {
      if (dragState.erase) {
        return current === CellState.Wall
          ? CellState.Unknown
          : current;
      }

      return CellState.Wall;
    }

    if (dragState.erase) {
      return current === CellState.Floor
        ? CellState.Unknown
        : current;
    }

    return CellState.Floor;
  }

  private endDrag(): void {
    this.dragState = null;
  }
}