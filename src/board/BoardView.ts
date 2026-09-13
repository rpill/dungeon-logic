import type Phaser from 'phaser';

import { PuzzleInteractionSession, type PuzzleTool } from '../gameplay/PuzzleInteractionSession';
import { resolvePointerTool } from '../gameplay/PuzzlePointerPolicy';
import { PuzzleState } from '../puzzle/PuzzleState';
import { CellState, type CellState as CellStateValue } from '../puzzle/types';
import { monsterFrameKeys } from '../view/FixedObjectAssets';
import { resolveMonsterSkinForLevel } from '../view/MonsterVisuals';
import { CellView, WIREFRAME, type FixedCellVisual } from './CellView';
import { resolveFloorTextureKey, resolveWallTextureKey } from '../view/BoardThemeAssets';

type PuzzleChangedHandler = () => void;
type PuzzleEditCommittedHandler = () => void;
type PuzzleCellEditedHandler = (
  x: number,
  y: number,
  previousState: CellStateValue,
  nextState: CellStateValue,
) => void;

const CLUE_FONT_RATIO = 0.5;
const CLUE_GAP_RATIO = 0.3;

export class BoardView {
  private readonly scene: Phaser.Scene;
  private readonly puzzle: PuzzleState;
  private readonly session: PuzzleInteractionSession;
  private originX: number;
  private originY: number;
  private cellSize: number;
  private readonly onPuzzleChanged: PuzzleChangedHandler;
  private readonly onEditCommitted: PuzzleEditCommittedHandler;
  private readonly onCellEdited: PuzzleCellEditedHandler;

  private inputEnabled = true;
  private gestureActive = false;
  private inputCellTargets: ReadonlySet<string> | null = null;

  private readonly cells: CellView[][] = [];
  private readonly rowClues: Phaser.GameObjects.Text[] = [];
  private readonly columnClues: Phaser.GameObjects.Text[] = [];
  private tutorialGuideClue: { readonly axis: 'row' | 'column'; readonly index: number } | null = null;
  private guideCluePulseTween: Phaser.Tweens.Tween | null = null;

  constructor(
    scene: Phaser.Scene,
    puzzle: PuzzleState,
    session: PuzzleInteractionSession,
    originX: number,
    originY: number,
    cellSize: number,
    onPuzzleChanged: PuzzleChangedHandler,
    onEditCommitted: PuzzleEditCommittedHandler = () => {},
    onCellEdited: PuzzleCellEditedHandler = () => {},
  ) {
    this.scene = scene;
    this.puzzle = puzzle;
    this.session = session;
    this.originX = originX;
    this.originY = originY;
    this.cellSize = cellSize;
    this.onPuzzleChanged = onPuzzleChanged;
    this.onEditCommitted = onEditCommitted;
    this.onCellEdited = onCellEdited;

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
    this.setSolvedVisualState(false);
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

  setSolvedVisualState(solved: boolean): void {
    for (const row of this.cells) {
      for (const cell of row) {
        cell.setSolvedVisualState(solved);
      }
    }
  }

  setInputCellTarget(target: { readonly x: number; readonly y: number } | null): void {
    this.setInputCellTargets(target === null ? null : [target]);
  }

  setInputCellTargets(targets: readonly { readonly x: number; readonly y: number }[] | null): void {
    this.endGesture();
    this.inputCellTargets = targets === null
      ? null
      : new Set(targets.map(({ x, y }) => `${x},${y}`));
  }

  setTutorialCellTargets(
    targets: readonly { readonly x: number; readonly y: number }[] | null,
    state: typeof CellState.Wall | typeof CellState.Floor | null = null,
  ): void {
    const targetSet = targets === null || state === null
      ? null
      : new Set(targets.map(({ x, y }) => `${x},${y}`));
    for (let y = 0; y < this.puzzle.level.height; y += 1) {
      for (let x = 0; x < this.puzzle.level.width; x += 1) {
        this.cells[y][x].setTutorialTarget(
          targetSet !== null && targetSet.has(`${x},${y}`) ? state : null,
        );
      }
    }
  }

  setTutorialGuideClue(
    guideClue: { readonly axis: 'row' | 'column'; readonly index: number } | null,
  ): void {
    const previous = this.getGuideClueText(this.tutorialGuideClue);
    if (previous !== null) {
      previous.setScale(1).setAlpha(1);
    }
    this.guideCluePulseTween?.stop();
    this.guideCluePulseTween = null;

    this.tutorialGuideClue = guideClue;
    this.updateClues();

    const next = this.getGuideClueText(this.tutorialGuideClue);
    if (next === null) return;

    next.setScale(1.08).setAlpha(1);
    this.guideCluePulseTween = this.scene.tweens.add({
      targets: next,
      alpha: { from: 1, to: 0.5 },
      scaleX: { from: 1.08, to: 1.18 },
      scaleY: { from: 1.08, to: 1.18 },
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  setHintCellTarget(
    target: {
      readonly x: number;
      readonly y: number;
      readonly state: typeof CellState.Wall | typeof CellState.Floor;
    } | null,
  ): void {
    for (let y = 0; y < this.puzzle.level.height; y += 1) {
      for (let x = 0; x < this.puzzle.level.width; x += 1) {
        const state = target !== null && target.x === x && target.y === y
          ? target.state
          : null;
        this.cells[y][x].setHintTarget(state);
      }
    }
  }

  private isInputCellAllowed(x: number, y: number): boolean {
    return this.inputCellTargets === null || this.inputCellTargets.has(`${x},${y}`);
  }

  relayout(originX: number, originY: number, cellSize: number): void {
    this.endGesture();
    this.originX = originX;
    this.originY = originY;
    this.cellSize = cellSize;

    const level = this.puzzle.level;
    const topCenterY = originY - cellSize * CLUE_GAP_RATIO;
    const leftCenterX = originX - cellSize * CLUE_GAP_RATIO;

    for (let x = 0; x < level.width; x += 1) {
      const centerX = originX + x * cellSize + cellSize / 2;
      this.columnClues[x]
        .setPosition(centerX, topCenterY)
        .setFontSize(Math.max(16, Math.round(cellSize * CLUE_FONT_RATIO)));
    }

    for (let y = 0; y < level.height; y += 1) {
      const centerY = originY + y * cellSize + cellSize / 2;
      this.rowClues[y]
        .setPosition(leftCenterX, centerY)
        .setFontSize(Math.max(16, Math.round(cellSize * CLUE_FONT_RATIO)));

      for (let x = 0; x < level.width; x += 1) {
        const centerX = originX + x * cellSize + cellSize / 2;
        this.cells[y][x].relayout(centerX, centerY, cellSize);
      }
    }
  }

  private createClues(): void {
    const level = this.puzzle.level;
    const topCenterY = this.originY - this.cellSize * CLUE_GAP_RATIO;
    const leftCenterX = this.originX - this.cellSize * CLUE_GAP_RATIO;

    for (let x = 0; x < level.width; x += 1) {
      const centerX = this.originX + x * this.cellSize + this.cellSize / 2;
      this.columnClues.push(this.createClueText(centerX, topCenterY, level.columnClues[x]));
    }

    for (let y = 0; y < level.height; y += 1) {
      const centerY = this.originY + y * this.cellSize + this.cellSize / 2;
      this.rowClues.push(this.createClueText(leftCenterX, centerY, level.rowClues[y]));
    }
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
          fontSize: `${Math.max(16, Math.round(this.cellSize * CLUE_FONT_RATIO))}px`,
          color: WIREFRAME.clueActive,
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5);
  }

  private getGuideClueText(
    guideClue: { readonly axis: 'row' | 'column'; readonly index: number } | null,
  ): Phaser.GameObjects.Text | null {
    if (guideClue === null) return null;
    return guideClue.axis === 'row'
      ? this.rowClues[guideClue.index] ?? null
      : this.columnClues[guideClue.index] ?? null;
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
          resolveFloorTextureKey(x, y),
          resolveWallTextureKey(x, y),
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
      const monsters = this.puzzle.level.monsters;
      const monsterIndex = monsters.findIndex((monster) => monster.x === x && monster.y === y);
      const skin = resolveMonsterSkinForLevel(
        this.puzzle.level.id,
        x,
        y,
        monsterIndex,
        monsters.length,
      );
      return {
        kind: 'monster',
        monsterFrameKeys: monsterFrameKeys(skin),
      };
    }
    if (this.puzzle.isChest(x, y)) {
      return { kind: 'chest' };
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
    if (!this.isInputCellAllowed(x, y)) {
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
    if (!this.isInputCellAllowed(x, y)) {
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
    const previousState = this.puzzle.getCellState(x, y);
    if (!this.session.visitGestureCell(x, y)) {
      return;
    }

    const state = this.puzzle.getCellState(x, y);
    this.cells[y][x].setState(state);
    this.updateConstraintFeedback();
    this.onCellEdited(x, y, previousState, state);
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
      const complete = this.puzzle.getRowWallCount(y) === level.rowClues[y];
      this.rowClues[y].setColor(
        complete
          ? WIREFRAME.clueComplete
          : WIREFRAME.clueActive,
      );
    }

    for (let x = 0; x < level.width; x += 1) {
      const complete = this.puzzle.getColumnWallCount(x) === level.columnClues[x];
      this.columnClues[x].setColor(
        complete
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
