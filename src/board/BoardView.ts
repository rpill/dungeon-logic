import type Phaser from 'phaser';

import { PuzzleInteractionSession, type PuzzleTool } from '../gameplay/PuzzleInteractionSession';
import { resolvePointerTool } from '../gameplay/PuzzlePointerPolicy';
import { PuzzleState } from '../puzzle/PuzzleState';
import { CellState } from '../puzzle/types';
import { CellView, WIREFRAME, type FixedCellVisual } from './CellView';

type PuzzleChangedHandler = () => void;
type PuzzleEditCommittedHandler = () => void;

export class BoardView {
  private readonly scene: Phaser.Scene;
  private readonly puzzle: PuzzleState;
  private readonly session: PuzzleInteractionSession;
  private originX: number;
  private originY: number;
  private cellSize: number;
  private readonly onPuzzleChanged: PuzzleChangedHandler;
  private readonly onEditCommitted: PuzzleEditCommittedHandler;

  private inputEnabled = true;
  private gestureActive = false;

  private readonly cells: CellView[][] = [];
  private readonly clueBackings: Phaser.GameObjects.Rectangle[] = [];
  private readonly rowClues: Phaser.GameObjects.Text[] = [];
  private readonly columnClues: Phaser.GameObjects.Text[] = [];

  constructor(
    scene: Phaser.Scene,
    puzzle: PuzzleState,
    session: PuzzleInteractionSession,
    originX: number,
    originY: number,
    cellSize: number,
    onPuzzleChanged: PuzzleChangedHandler,
    onEditCommitted: PuzzleEditCommittedHandler = () => {},
  ) {
    this.scene = scene;
    this.puzzle = puzzle;
    this.session = session;
    this.originX = originX;
    this.originY = originY;
    this.cellSize = cellSize;
    this.onPuzzleChanged = onPuzzleChanged;
    this.onEditCommitted = onEditCommitted;

    this.createClues();
    this.createCells();
    this.updateConstraintFeedback();

    this.scene.input.on('pointerup', () => {
      this.endGesture();
    });
    this.scene.input.on('pointerupoutside', () => {
      this.endGesture();
    });
  }

  setActiveTool(tool: PuzzleTool): void {
    this.session.setActiveTool(tool);
  }

  undo(): boolean {
    this.endGesture();
    if (!this.session.undo()) {
      return false;
    }

    this.syncAllCells();
    this.onEditCommitted();
    this.onPuzzleChanged();
    return true;
  }

  reset(): boolean {
    this.endGesture();
    if (!this.session.reset()) {
      return false;
    }

    this.syncAllCells();
    this.onEditCommitted();
    this.onPuzzleChanged();
    return true;
  }

  setInputEnabled(enabled: boolean): void {
    this.inputEnabled = enabled;
    if (!enabled) {
      this.endGesture();
    }
  }

  relayout(originX: number, originY: number, cellSize: number): void {
    this.endGesture();
    this.originX = originX;
    this.originY = originY;
    this.cellSize = cellSize;

    const level = this.puzzle.level;
    const visualSize = Math.max(1, cellSize - WIREFRAME.gap);
    const topCenterY = originY - cellSize / 2;
    const leftCenterX = originX - cellSize / 2;

    let backingIndex = 0;
    this.clueBackings[backingIndex++]
      .setPosition(leftCenterX, topCenterY)
      .setDisplaySize(visualSize, visualSize);

    for (let x = 0; x < level.width; x += 1) {
      const centerX = originX + x * cellSize + cellSize / 2;
      this.clueBackings[backingIndex++]
        .setPosition(centerX, topCenterY)
        .setDisplaySize(visualSize, visualSize);
      this.columnClues[x]
        .setPosition(centerX, topCenterY)
        .setFontSize(Math.max(16, Math.round(cellSize * 0.42)));
    }

    for (let y = 0; y < level.height; y += 1) {
      const centerY = originY + y * cellSize + cellSize / 2;
      this.clueBackings[backingIndex++]
        .setPosition(leftCenterX, centerY)
        .setDisplaySize(visualSize, visualSize);
      this.rowClues[y]
        .setPosition(leftCenterX, centerY)
        .setFontSize(Math.max(16, Math.round(cellSize * 0.42)));

      for (let x = 0; x < level.width; x += 1) {
        const centerX = originX + x * cellSize + cellSize / 2;
        this.cells[y][x].relayout(centerX, centerY, cellSize);
      }
    }
  }

  private createClues(): void {
    const level = this.puzzle.level;
    const topCenterY = this.originY - this.cellSize / 2;
    const leftCenterX = this.originX - this.cellSize / 2;

    this.createClueBacking(leftCenterX, topCenterY);

    for (let x = 0; x < level.width; x += 1) {
      const centerX = this.originX + x * this.cellSize + this.cellSize / 2;
      this.createClueBacking(centerX, topCenterY);
      this.columnClues.push(this.createClueText(centerX, topCenterY, level.columnClues[x]));
    }

    for (let y = 0; y < level.height; y += 1) {
      const centerY = this.originY + y * this.cellSize + this.cellSize / 2;
      this.createClueBacking(leftCenterX, centerY);
      this.rowClues.push(this.createClueText(leftCenterX, centerY, level.rowClues[y]));
    }
  }

  private createClueBacking(centerX: number, centerY: number): void {
    const visualSize = Math.max(1, this.cellSize - WIREFRAME.gap);

    this.clueBackings.push(
      this.scene.add.rectangle(
        centerX,
        centerY,
        visualSize,
        visualSize,
        WIREFRAME.clueCell,
        1,
      ),
    );
  }

  private createClueText(
    centerX: number,
    centerY: number,
    value: number,
  ): Phaser.GameObjects.Text {
    return this.scene.add
      .text(
        centerX,
        centerY,
        String(value),
        {
          fontFamily: 'monospace',
          fontSize: `${Math.max(16, Math.round(this.cellSize * 0.42))}px`,
          color: WIREFRAME.clueActive,
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);
  }

  private createCells(): void {
    const level = this.puzzle.level;

    for (let y = 0; y < level.height; y += 1) {
      const row: CellView[] = [];

      for (let x = 0; x < level.width; x += 1) {
        const centerX = this.originX + x * this.cellSize + this.cellSize / 2;
        const centerY = this.originY + y * this.cellSize + this.cellSize / 2;
        const fixedVisual = this.resolveFixedVisual(x, y);

        const cell = new CellView(
          this.scene,
          centerX,
          centerY,
          this.cellSize,
          fixedVisual,
          (pointer) => {
            this.beginGesture(x, y, pointer);
          },
          (pointer) => {
            this.continueGesture(x, y, pointer);
          },
        );

        cell.setState(this.puzzle.getCellState(x, y));
        row.push(cell);
      }

      this.cells.push(row);
    }
  }

  private resolveFixedVisual(x: number, y: number): FixedCellVisual {
    if (this.puzzle.isMonster(x, y)) {
      return { kind: 'monster', marker: 'M' };
    }
    if (this.puzzle.isChest(x, y)) {
      return { kind: 'chest', marker: 'C' };
    }
    if (this.puzzle.isBlocker(x, y)) {
      return { kind: 'technical', marker: 'X' };
    }

    const door = this.puzzle.getDoor(x, y);
    if (door !== null) {
      return {
        kind: 'technical',
        marker: door.orientation === 'horizontal' ? '↔' : '↕',
      };
    }

    return null;
  }

  private beginGesture(
    x: number,
    y: number,
    pointer: Phaser.Input.Pointer,
  ): void {
    if (!this.inputEnabled) {
      return;
    }

    pointer.event?.preventDefault?.();

    const pointerData = pointer as Phaser.Input.Pointer & { wasTouch?: boolean };
    const eventData = pointer.event as (Event & { pointerType?: string }) | undefined;
    const isTouchLikePointer = pointerData.wasTouch === true || eventData?.pointerType === 'touch';
    const toolOverride: PuzzleTool = resolvePointerTool(
      this.session.getActiveTool(),
      isTouchLikePointer,
      pointer.rightButtonDown(),
    );

    this.session.beginGesture(x, y, toolOverride);
    this.gestureActive = true;
    this.visitGestureCell(x, y);
  }

  private continueGesture(
    x: number,
    y: number,
    pointer: Phaser.Input.Pointer,
  ): void {
    if (!this.inputEnabled) {
      this.endGesture();
      return;
    }
    if (!this.gestureActive) {
      return;
    }
    if (!pointer.isDown) {
      this.endGesture();
      return;
    }

    pointer.event?.preventDefault?.();
    this.visitGestureCell(x, y);
  }

  private visitGestureCell(x: number, y: number): void {
    if (!this.session.visitGestureCell(x, y)) {
      return;
    }

    this.cells[y][x].setState(this.puzzle.getCellState(x, y));
    this.updateConstraintFeedback();
    this.onPuzzleChanged();
  }

  private endGesture(): void {
    if (!this.gestureActive) {
      return;
    }

    const changed = this.session.endGesture();
    this.gestureActive = false;
    if (changed) {
      this.onEditCommitted();
    }
  }

  private syncAllCells(): void {
    const level = this.puzzle.level;
    for (let y = 0; y < level.height; y += 1) {
      for (let x = 0; x < level.width; x += 1) {
        this.cells[y][x].setState(this.puzzle.getCellState(x, y));
      }
    }
    this.updateConstraintFeedback();
  }

  private updateConstraintFeedback(): void {
    this.updateClues();
    this.updateWallConflicts();
  }

  private updateClues(): void {
    const level = this.puzzle.level;

    for (let y = 0; y < level.height; y += 1) {
      this.rowClues[y].setColor(
        this.puzzle.getRowWallCount(y) === level.rowClues[y]
          ? WIREFRAME.clueComplete
          : WIREFRAME.clueActive,
      );
    }

    for (let x = 0; x < level.width; x += 1) {
      this.columnClues[x].setColor(
        this.puzzle.getColumnWallCount(x) === level.columnClues[x]
          ? WIREFRAME.clueComplete
          : WIREFRAME.clueActive,
      );
    }
  }

  private updateWallConflicts(): void {
    const level = this.puzzle.level;
    const overfilledRows = new Set<number>();
    const overfilledColumns = new Set<number>();

    for (let y = 0; y < level.height; y += 1) {
      if (this.puzzle.getRowWallCount(y) > level.rowClues[y]) {
        overfilledRows.add(y);
      }
    }

    for (let x = 0; x < level.width; x += 1) {
      if (this.puzzle.getColumnWallCount(x) > level.columnClues[x]) {
        overfilledColumns.add(x);
      }
    }

    for (let y = 0; y < level.height; y += 1) {
      for (let x = 0; x < level.width; x += 1) {
        const isWall = this.puzzle.getCellState(x, y) === CellState.Wall;
        const conflict = isWall && (
          overfilledRows.has(y)
          || overfilledColumns.has(x)
        );
        this.cells[y][x].setConflict(conflict);
      }
    }
  }
}
