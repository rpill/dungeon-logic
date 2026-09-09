import type Phaser from 'phaser';

import { BoardView } from '../board/BoardView';
import { WIREFRAME } from '../board/CellView';
import { PuzzleInteractionSession } from '../gameplay/PuzzleInteractionSession';
import { PuzzleState } from '../puzzle/PuzzleState';
import { CellState } from '../puzzle/types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function readVisible(value: { readonly visible: boolean } | undefined): boolean | undefined {
  return value?.visible;
}

type EventHandler = (...args: any[]) => void;

class FakeImage {
  setDisplaySize(): this { return this; }
  setTexture(): this { return this; }
  setVisible(): this { return this; }
}

class FakeRectangle {
  readonly handlers = new Map<string, EventHandler>();
  fillColor: number;
  fillAlpha: number;
  strokeWidth = 0;
  strokeColor = 0;
  strokeAlpha = 0;
  visible = true;
  interactive = false;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor = 0,
    fillAlpha = 1,
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.fillColor = fillColor;
    this.fillAlpha = fillAlpha;
  }

  setStrokeStyle(width = 0, color = 0, alpha = 1): this {
    this.strokeWidth = width;
    this.strokeColor = color;
    this.strokeAlpha = alpha;
    return this;
  }

  setInteractive(): this {
    this.interactive = true;
    return this;
  }

  setFillStyle(color: number, alpha = 1): this {
    this.fillColor = color;
    this.fillAlpha = alpha;
    return this;
  }

  setVisible(visible: boolean): this {
    this.visible = visible;
    return this;
  }

  on(event: string, callback: EventHandler): this {
    this.handlers.set(event, callback);
    return this;
  }

  trigger(event: string, ...args: any[]): void {
    this.handlers.get(event)?.(...args);
  }
}

class FakeText {
  value: string;
  color: string | undefined;
  visible = true;
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number, value: string, style?: { color?: string }) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.color = style?.color;
  }

  setOrigin(): this { return this; }
  setText(value: string): this { this.value = value; return this; }
  setColor(color: string): this { this.color = color; return this; }
  setFontSize(): this { return this; }
  setVisible(visible: boolean): this { this.visible = visible; return this; }
}

class FakeScene {
  readonly rectangles: FakeRectangle[] = [];
  readonly texts: FakeText[] = [];
  readonly inputHandlers = new Map<string, EventHandler>();
  imageCalls = 0;
  tileSpriteCalls = 0;

  readonly add = {
    image: () => {
      this.imageCalls += 1;
      return new FakeImage();
    },
    rectangle: (
      x: number,
      y: number,
      width: number,
      height: number,
      fillColor?: number,
      fillAlpha?: number,
    ) => {
      const rectangle = new FakeRectangle(x, y, width, height, fillColor, fillAlpha);
      this.rectangles.push(rectangle);
      return rectangle;
    },
    text: (x: number, y: number, value: string, style?: { color?: string }) => {
      const text = new FakeText(x, y, value, style);
      this.texts.push(text);
      return text;
    },
    tileSprite: () => {
      this.tileSpriteCalls += 1;
      return {};
    },
  };

  readonly input = {
    on: (event: string, callback: EventHandler) => {
      this.inputHandlers.set(event, callback);
    },
  };
}

function createLevel(overrides: Record<string, unknown> = {}) {
  return {
    id: 'board-wireframe-sanity',
    width: 1,
    height: 1,
    rowClues: [1],
    columnClues: [1],
    monsters: [],
    chests: [],
    blockers: [],
    doors: [],
    solution: ['#'],
    ...overrides,
  } as any;
}

function createBoard(level = createLevel()) {
  const puzzle = new PuzzleState(level);
  const session = new PuzzleInteractionSession(puzzle);
  const scene = new FakeScene();
  let changed = 0;
  const board = new BoardView(
    scene as unknown as Phaser.Scene,
    puzzle,
    session,
    100,
    100,
    48,
    () => { changed += 1; },
  );
  return { board, puzzle, scene, getChanged: () => changed };
}

assert(WIREFRAME.floor === 0x252a30, 'Wireframe floor returns to the original dark neutral fill.');
assert(WIREFRAME.wall === 0x827565, 'Wireframe wall returns to the original warm contrasting fill.');
assert(WIREFRAME.clueCell === 0x171b20, 'Clue cells remain darker than both floor and wall states.');
assert(WIREFRAME.mark === '#d54a42', 'Wireframe floor mark uses the approved muted red.');

const editable = createBoard();
assert(editable.scene.imageCalls === 0, 'Gameplay board must not create Phaser images in wireframe mode.');
assert(editable.scene.tileSpriteCalls === 0, 'Gameplay board must not create tileSprites in wireframe mode.');

const floorRect = editable.scene.rectangles.find((rectangle) => rectangle.fillColor === WIREFRAME.floor);
const wallRect = editable.scene.rectangles.find((rectangle) => rectangle.fillColor === WIREFRAME.wall);
const hoverRect = editable.scene.rectangles.find((rectangle) => rectangle.fillColor === WIREFRAME.hoverTint);
const cellInput = editable.scene.rectangles.find((rectangle) => rectangle.interactive);
const floorMark = editable.scene.texts.find((text) => text.value === '◆' && text.color === WIREFRAME.mark);
assert(floorRect !== undefined, 'Unknown cell must render a primitive floor rectangle.');
assert(wallRect !== undefined, 'Editable cell must own a primitive wall rectangle.');
assert(hoverRect !== undefined && !hoverRect.visible, 'Editable cell owns a dedicated hover overlay without outline resizing.');
assert(floorRect.strokeWidth === 0 && wallRect.strokeWidth === 0, 'Editable cells must not use per-cell strokes; spacing forms the grid.');
assert(floorRect.width < 48 && floorRect.height < 48, 'Editable cells leave a fixed gap inside each cell slot.');
const clueBacking = editable.scene.rectangles.find((rectangle) => rectangle.fillColor === WIREFRAME.clueCell);
assert(clueBacking !== undefined && clueBacking.strokeWidth === 0, 'Clue cells also avoid per-cell strokes.');
assert(clueBacking.width < 48 && clueBacking.height < 48, 'Clue cells use the same visual gap as editable cells.');
assert(cellInput === floorRect, 'Floor rectangle is the editable pointer target.');
assert(!wallRect.visible, 'Unknown cell starts with wall rectangle hidden.');
assert(floorMark !== undefined && !floorMark.visible, 'Unknown cell starts with floor mark hidden.');

const touchPointer = { isDown: true, wasTouch: true, rightButtonDown: () => false };
editable.board.setActiveTool('floor');
cellInput.trigger('pointerdown', touchPointer);
editable.scene.inputHandlers.get('pointerup')?.();
assert(floorRect.fillColor === WIREFRAME.floor, 'Floor state keeps exactly the same underlying floor fill as Unknown.');
assert(!wallRect.visible, 'Floor state does not show the wall rectangle.');
assert(floorMark.visible, 'Floor state adds only the diamond mark.');
assert(editable.getChanged() === 1, 'Actual pointer mutation emits one puzzle-changed callback.');

cellInput.trigger('pointerover', touchPointer);
assert(hoverRect.visible, 'Hover is rendered as a soft fill overlay instead of a border outline.');
cellInput.trigger('pointerout');
assert(!hoverRect.visible, 'Hover overlay disappears on pointerout.');

editable.board.setActiveTool('wall');
cellInput.trigger('pointerdown', touchPointer);
editable.scene.inputHandlers.get('pointerup')?.();
assert(wallRect.visible, 'Wall state reveals the charcoal wall rectangle.');
assert(wallRect.fillColor === WIREFRAME.wall, 'Normal wall keeps the warm contrasting fill.');
assert(!floorMark.visible, 'Wall state hides the floor mark.');
assert(
  editable.scene.texts.filter((text) => text.value === '1').every((text) => text.color === WIREFRAME.clueComplete),
  'Satisfied row and column clues switch to the completed clue color.',
);

const rightPointer = { isDown: true, rightButtonDown: () => true };
cellInput.trigger('pointerdown', rightPointer);
editable.scene.inputHandlers.get('pointerup')?.();
assert(!wallRect.visible && floorMark.visible, 'Right click overrides the active tool and paints Floor.');
assert(editable.board.undo(), 'BoardView exposes gesture-level Undo through PuzzleInteractionSession.');
assert(wallRect.visible && !floorMark.visible, 'Undo refreshes primitive cell visuals from puzzle state.');
assert(editable.board.reset(), 'BoardView exposes Reset through PuzzleInteractionSession.');
assert(!wallRect.visible && !floorMark.visible, 'Reset refreshes the cell back to Unknown.');

const conflictBoard = createBoard(createLevel({ width: 2, height: 1, rowClues: [1], columnClues: [1, 1], solution: ['##'] }));
const conflictInputs = conflictBoard.scene.rectangles.filter((rectangle) => rectangle.interactive);
conflictBoard.board.setActiveTool('wall');
conflictInputs[0].trigger('pointerdown', touchPointer);
conflictBoard.scene.inputHandlers.get('pointerup')?.();
conflictBoard.board.setActiveTool('wall');
conflictInputs[1].trigger('pointerdown', touchPointer);
conflictBoard.scene.inputHandlers.get('pointerup')?.();
const conflictWalls = conflictBoard.scene.rectangles.filter((rectangle) => rectangle.visible && rectangle.fillColor === WIREFRAME.conflictWall);
assert(conflictWalls.length >= 2, 'Overfilled rows/columns tint the conflicting wall cells themselves red.');


const mousePolicy = createBoard(createLevel());
const mouseInput = mousePolicy.scene.rectangles.find((rectangle) => rectangle.interactive)!;
mousePolicy.board.setActiveTool('floor');
mouseInput.trigger('pointerdown', { isDown: true, wasTouch: false, rightButtonDown: () => false });
mousePolicy.scene.inputHandlers.get('pointerup')?.();
const mouseWall = mousePolicy.scene.rectangles.find((rectangle) => rectangle.fillColor === WIREFRAME.wall || rectangle.fillColor === WIREFRAME.conflictWall);
assert(mouseWall?.visible === true, 'Mouse left button always paints Wall even if Floor was previously selected.');
mousePolicy.board.setActiveTool('wall');
mouseInput.trigger('pointerdown', { isDown: true, wasTouch: false, rightButtonDown: () => true });
mousePolicy.scene.inputHandlers.get('pointerup')?.();
const mouseFloorMark = mousePolicy.scene.texts.find((text) => text.value === '◆' && text.color === WIREFRAME.mark);
assert(readVisible(mouseWall) === false && readVisible(mouseFloorMark) === true, 'Mouse right button always paints Floor.');

const touchPolicy = createBoard(createLevel());
const touchInputPolicy = touchPolicy.scene.rectangles.find((rectangle) => rectangle.interactive)!;
touchPolicy.board.setActiveTool('floor');
touchInputPolicy.trigger('pointerdown', { isDown: true, wasTouch: true, rightButtonDown: () => false });
touchPolicy.scene.inputHandlers.get('pointerup')?.();
const touchFloorMarkPolicy = touchPolicy.scene.texts.find((text) => text.value === '◆' && text.color === WIREFRAME.mark);
assert(touchFloorMarkPolicy?.visible === true, 'Touch uses the currently selected Wall/Floor tool.');



const hintPreview = createBoard(createLevel());
hintPreview.board.setHintCellTarget({ x: 0, y: 0, state: CellState.Floor } as any);
const visibleGoldFloorHint = hintPreview.scene.texts.find(
  (text) => text.value === '◆' && text.color === '#d0b978' && text.visible,
);
assert(visibleGoldFloorHint !== undefined, 'Floor hint renders an explicit gold floor diamond preview.');
hintPreview.board.setHintCellTarget({ x: 0, y: 0, state: CellState.Wall } as any);
const visibleWallHint = hintPreview.scene.rectangles.find(
  (rectangle) => rectangle.visible && rectangle.fillColor === WIREFRAME.hintTint && rectangle.fillAlpha >= 0.45,
);
assert(visibleWallHint !== undefined, 'Wall hint renders a distinct gold ghost-wall preview.');

const monster = createBoard(createLevel({ monsters: [{ x: 0, y: 0 }], solution: ['.'] }));
assert(monster.scene.imageCalls === 0, 'Monster cell must not create an image asset.');
assert(monster.scene.texts.some((text) => text.value === 'M' && text.visible), 'Monster uses the wireframe M marker.');

const chest = createBoard(createLevel({ chests: [{ x: 0, y: 0 }], solution: ['.'] }));
assert(chest.scene.imageCalls === 0, 'Chest cell must not create an image asset.');
assert(chest.scene.texts.some((text) => text.value === 'C' && text.visible), 'Chest uses the wireframe C marker.');

console.info('[Dungeon Logic] Board visual sanity: muted wireframe palette + hover fill + conflict tint passed');
