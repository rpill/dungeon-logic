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

type PuzzleChangedHandler =
  () => void;

const CLUE_ACTIVE_COLOR =
  '#ff6557';

const CLUE_COMPLETE_COLOR =
  '#777b7d';

export class BoardView {
  private readonly scene: Phaser.Scene;
  private readonly puzzle: PuzzleState;
  private readonly originX: number;
  private readonly originY: number;
  private readonly cellSize: number;

  private readonly onPuzzleChanged:
    PuzzleChangedHandler;

  private inputEnabled = true;

  private readonly cells: CellView[][] = [];

  private readonly rowClues:
    Phaser.GameObjects.Text[] = [];

  private readonly columnClues:
    Phaser.GameObjects.Text[] = [];

  private dragState: DragState | null = null;

  constructor(
    scene: Phaser.Scene,
    puzzle: PuzzleState,
    originX: number,
    originY: number,
    cellSize: number,
    onPuzzleChanged: PuzzleChangedHandler,
  ) {
    this.scene = scene;
    this.puzzle = puzzle;
    this.originX = originX;
    this.originY = originY;
    this.cellSize = cellSize;
    this.onPuzzleChanged =
      onPuzzleChanged;

    this.createClues();
    this.createCells();

    this.updateConstraintFeedback();

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

  setInputEnabled(
    enabled: boolean,
  ): void {
    this.inputEnabled = enabled;

    if (!enabled) {
      this.endDrag();
    }
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

      const clue =
        this.scene.add
          .text(
            centerX,
            this.originY - 32,
            String(
              level.columnClues[x],
            ),
            {
              fontFamily: 'monospace',
              fontSize: '26px',
              color: CLUE_ACTIVE_COLOR,
              fontStyle: 'bold',
            },
          )
          .setOrigin(0.5);

      this.columnClues.push(
        clue,
      );
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

      const clue =
        this.scene.add
          .text(
            this.originX - 36,
            centerY,
            String(
              level.rowClues[y],
            ),
            {
              fontFamily: 'monospace',
              fontSize: '26px',
              color: CLUE_ACTIVE_COLOR,
              fontStyle: 'bold',
            },
          )
          .setOrigin(0.5);

      this.rowClues.push(
        clue,
      );
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

        let fixedMarker:
          string | null = null;

        if (
          this.puzzle.isMonster(
            x,
            y,
          )
        ) {
          fixedMarker = 'M';
        } else if (
          this.puzzle.isChest(
            x,
            y,
          )
        ) {
          fixedMarker = 'C';
        } else if (
          this.puzzle.isBlocker(
            x,
            y,
          )
        ) {
          fixedMarker = 'X';
        } else {
          const door =
            this.puzzle.getDoor(
              x,
              y,
            );

          if (door !== null) {
            fixedMarker =
              door.orientation ===
                'horizontal'
                ? '↔'
                : '↕';
          }
        }

        const cell = new CellView(
          this.scene,
          centerX,
          centerY,
          this.cellSize,
          fixedMarker,
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
    if (!this.inputEnabled) {
      return;
    }

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
    if (!this.inputEnabled) {
      this.endDrag();

      return;
    }

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
    const dragState =
      this.dragState;

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

    const appliedState =
      this.puzzle.setCellState(
        x,
        y,
        next,
      );

    cell.setState(
      appliedState,
    );

    this.updateConstraintFeedback();

    this.onPuzzleChanged();
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

  private updateConstraintFeedback(): void {
    this.updateClues();
    this.updateWallConflicts();
  }

  private updateClues(): void {
    const level =
      this.puzzle.level;

    for (
      let y = 0;
      y < level.height;
      y += 1
    ) {
      const current =
        this.puzzle.getRowWallCount(
          y,
        );

      const target =
        level.rowClues[y];

      this.rowClues[y].setColor(
        current === target
          ? CLUE_COMPLETE_COLOR
          : CLUE_ACTIVE_COLOR,
      );
    }

    for (
      let x = 0;
      x < level.width;
      x += 1
    ) {
      const current =
        this.puzzle.getColumnWallCount(
          x,
        );

      const target =
        level.columnClues[x];

      this.columnClues[x].setColor(
        current === target
          ? CLUE_COMPLETE_COLOR
          : CLUE_ACTIVE_COLOR,
      );
    }
  }

  private updateWallConflicts(): void {
    const level =
      this.puzzle.level;

    const overfilledRows =
      new Set<number>();

    const overfilledColumns =
      new Set<number>();

    for (
      let y = 0;
      y < level.height;
      y += 1
    ) {
      if (
        this.puzzle.getRowWallCount(y) >
        level.rowClues[y]
      ) {
        overfilledRows.add(y);
      }
    }

    for (
      let x = 0;
      x < level.width;
      x += 1
    ) {
      if (
        this.puzzle.getColumnWallCount(x) >
        level.columnClues[x]
      ) {
        overfilledColumns.add(x);
      }
    }

    for (
      let y = 0;
      y < level.height;
      y += 1
    ) {
      for (
        let x = 0;
        x < level.width;
        x += 1
      ) {
        const conflict =
          overfilledRows.has(y) ||
          overfilledColumns.has(x);

        this.cells[y][x].setConflict(
          conflict,
        );
      }
    }
  }

  private endDrag(): void {
    this.dragState = null;
  }
}