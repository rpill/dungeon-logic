import type Phaser from 'phaser';

import { BoardView } from '../board/BoardView';
import { WIREFRAME } from '../board/CellView';
import { PuzzleInteractionSession } from '../gameplay/PuzzleInteractionSession';
import { PuzzleState } from '../puzzle/PuzzleState';
import { CellState } from '../puzzle/types';
import { BOARD_FLOOR_MARK_KEY } from '../view/BoardThemeAssets';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function readVisible(value: { readonly visible: boolean } | undefined): boolean | undefined {
  return value?.visible;
}

type EventHandler = (...args: any[]) => void;

class FakeImage {
  readonly handlers = new Map<string, EventHandler>();
  visible = true;
  interactive = false;
  tint: number | null = null;
  alpha = 1;
  x: number;
  y: number;
  width = 0;
  height = 0;
  readonly textureKey: string;

  constructor(x: number, y: number, textureKey: string) {
    this.x = x;
    this.y = y;
    this.textureKey = textureKey;
  }

  setDisplaySize(width: number, height: number): this {
    this.width = width;
    this.height = height;
    return this;
  }

  setPosition(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  setVisible(visible: boolean): this {
    this.visible = visible;
    return this;
  }

  setInteractive(): this {
    this.interactive = true;
    return this;
  }

  setTint(tint: number): this {
    this.tint = tint;
    return this;
  }

  setAlpha(alpha: number): this {
    this.alpha = alpha;
    return this;
  }

  clearTint(): this {
    this.tint = null;
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

class FakeRectangle {
  readonly handlers = new Map<string, EventHandler>();
  fillColor: number;
  fillAlpha: number;
  strokeWidth = 0;
  strokeColor = 0;
  strokeAlpha = 0;
  visible = true;
  interactive = false;
  x: number;
  y: number;
  width: number;
  height: number;

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

  setPosition(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  setDisplaySize(width: number, height: number): this {
    this.width = width;
    this.height = height;
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
  x: number;
  y: number;

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
  setPosition(x: number, y: number): this { this.x = x; this.y = y; return this; }
}

class FakeScene {
  readonly images: FakeImage[] = [];
  readonly rectangles: FakeRectangle[] = [];
  readonly texts: FakeText[] = [];
  readonly inputHandlers = new Map<string, EventHandler>();
  tileSpriteCalls = 0;

  readonly add = {
    image: (x: number, y: number, textureKey: string) => {
      const image = new FakeImage(x, y, textureKey);
      this.images.push(image);
      return image;
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

  readonly tweens = {
    add: () => ({
      restart: () => {},
      pause: () => {},
    }),
  };
}

function createLevel(overrides: Record<string, unknown> = {}) {
  return {
    id: 'board-asset-sanity',
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

const editable = createBoard();
assert(editable.scene.tileSpriteCalls === 0, 'Gameplay board must not create tileSprites.');

const floorImage = editable.scene.images.find((image) => image.textureKey.startsWith('board-floor-'));
const wallImage = editable.scene.images.find((image) => image.textureKey.startsWith('board-wall-'));
const floorMark = editable.scene.images.find((image) => image.textureKey === BOARD_FLOOR_MARK_KEY);
const hoverRect = editable.scene.rectangles.find((rectangle) => rectangle.fillColor === WIREFRAME.hoverTint);
const cellInput = editable.scene.images.find((image) => image.interactive);

assert(floorImage !== undefined, 'Unknown cell must render a floor texture image.');
assert(wallImage !== undefined, 'Editable cell must own a wall texture image.');
assert(floorMark !== undefined, 'Editable cell must own the floor-mark image.');
assert(cellInput === floorImage, 'Floor image is the editable pointer target.');
assert(floorImage.width < 48 && floorImage.height < 48, 'Tile images preserve the board cell gap.');
assert(!wallImage.visible, 'Unknown cell starts with wall image hidden.');
assert(!floorMark.visible, 'Unknown cell starts with floor mark hidden.');
assert(hoverRect !== undefined && !hoverRect.visible, 'Editable cell owns a dedicated hover overlay.');

const clueBacking = editable.scene.rectangles.find((rectangle) => rectangle.fillColor === WIREFRAME.clueCell);
assert(clueBacking === undefined, 'Row and column clues render as bare text with no backing tiles.');

const touchPointer = { isDown: true, wasTouch: true, rightButtonDown: () => false };
editable.board.setActiveTool('floor');
cellInput.trigger('pointerdown', touchPointer);
editable.scene.inputHandlers.get('pointerup')?.();
assert(!wallImage.visible, 'Floor state does not show the wall image.');
assert(floorMark.visible, 'Floor state shows the authored diamond mark asset.');
assert(editable.getChanged() === 1, 'Actual pointer mutation emits one puzzle-changed callback.');

cellInput.trigger('pointerover', touchPointer);
assert(hoverRect.visible, 'Hover remains a soft fill overlay above the textured cell.');
cellInput.trigger('pointerout');
assert(!hoverRect.visible, 'Hover overlay disappears on pointerout.');

editable.board.setActiveTool('wall');
cellInput.trigger('pointerdown', touchPointer);
editable.scene.inputHandlers.get('pointerup')?.();
assert(wallImage.visible, 'Wall state reveals the authored wall texture image.');
assert(wallImage.tint === null, 'Normal wall texture has no conflict tint.');
assert(!floorMark.visible, 'Wall state hides the floor mark.');
assert(
  editable.scene.texts.filter((text) => text.value === '1').every((text) => text.color === WIREFRAME.clueComplete),
  'Satisfied row and column clues switch to the completed clue color.',
);

const rightPointer = { isDown: true, rightButtonDown: () => true };
cellInput.trigger('pointerdown', rightPointer);
editable.scene.inputHandlers.get('pointerup')?.();
assert(!wallImage.visible && floorMark.visible, 'Right click overrides the active tool and paints Floor.');
assert(editable.board.undo(), 'BoardView exposes gesture-level Undo through PuzzleInteractionSession.');
assert(wallImage.visible && !floorMark.visible, 'Undo refreshes textured cell visuals from puzzle state.');
assert(editable.board.reset(), 'BoardView exposes Reset through PuzzleInteractionSession.');
assert(!wallImage.visible && !floorMark.visible, 'Reset refreshes the cell back to Unknown.');

const conflictBoard = createBoard(createLevel({ width: 2, height: 1, rowClues: [1], columnClues: [1, 1], solution: ['##'] }));
const conflictInputs = conflictBoard.scene.images.filter((image) => image.interactive);
conflictBoard.board.setActiveTool('wall');
conflictInputs[0].trigger('pointerdown', touchPointer);
conflictBoard.scene.inputHandlers.get('pointerup')?.();
conflictBoard.board.setActiveTool('wall');
conflictInputs[1].trigger('pointerdown', touchPointer);
conflictBoard.scene.inputHandlers.get('pointerup')?.();
const conflictWalls = conflictBoard.scene.images.filter(
  (image) => image.visible && image.textureKey.startsWith('board-wall-') && image.tint === WIREFRAME.conflictWall,
);
assert(conflictWalls.length >= 2, 'Overfilled rows/columns tint the conflicting wall textures red.');

const mousePolicy = createBoard(createLevel());
const mouseInput = mousePolicy.scene.images.find((image) => image.interactive)!;
const mouseWall = mousePolicy.scene.images.find((image) => image.textureKey.startsWith('board-wall-'))!;
const mouseFloorMark = mousePolicy.scene.images.find((image) => image.textureKey === BOARD_FLOOR_MARK_KEY)!;
mousePolicy.board.setActiveTool('floor');
mouseInput.trigger('pointerdown', { isDown: true, wasTouch: false, rightButtonDown: () => false });
mousePolicy.scene.inputHandlers.get('pointerup')?.();
assert(mouseWall.visible === true, 'Mouse left button always paints Wall even if Floor was previously selected.');
mousePolicy.board.setActiveTool('wall');
mouseInput.trigger('pointerdown', { isDown: true, wasTouch: false, rightButtonDown: () => true });
mousePolicy.scene.inputHandlers.get('pointerup')?.();
assert(readVisible(mouseWall) === false && readVisible(mouseFloorMark) === true, 'Mouse right button always paints Floor.');

const touchPolicy = createBoard(createLevel());
const touchInputPolicy = touchPolicy.scene.images.find((image) => image.interactive)!;
touchPolicy.board.setActiveTool('floor');
touchInputPolicy.trigger('pointerdown', { isDown: true, wasTouch: true, rightButtonDown: () => false });
touchPolicy.scene.inputHandlers.get('pointerup')?.();
const touchFloorMarkPolicy = touchPolicy.scene.images.find((image) => image.textureKey === BOARD_FLOOR_MARK_KEY);
assert(touchFloorMarkPolicy?.visible === true, 'Touch uses the currently selected Wall/Floor tool.');

const hintPreview = createBoard(createLevel());
hintPreview.board.setHintCellTarget({ x: 0, y: 0, state: CellState.Floor } as any);
const visibleFloorHint = hintPreview.scene.images.find(
  (image) => image.textureKey === BOARD_FLOOR_MARK_KEY && image.tint === 0xd54a42 && image.visible,
);
assert(visibleFloorHint !== undefined, 'Floor hint uses the same pulsing coral floor marker as Tutorial guidance.');
hintPreview.board.setHintCellTarget({ x: 0, y: 0, state: CellState.Wall } as any);
const visibleWallHint = hintPreview.scene.images.find(
  (image) => image.textureKey.startsWith('board-wall-') && image.visible && image.alpha < 1,
);
assert(visibleWallHint !== undefined, 'Wall hint uses the same semi-transparent wall texture as Tutorial guidance.');

const monster = createBoard(createLevel({ monsters: [{ x: 0, y: 0 }], solution: ['.'] }));
assert(monster.scene.texts.some((text) => text.value === 'M' && text.visible), 'Monster remains a temporary M marker in this stage.');
assert(monster.scene.images.some((image) => image.textureKey.startsWith('board-floor-')), 'Monster cell still uses the authored floor tile beneath its placeholder.');

const chest = createBoard(createLevel({ chests: [{ x: 0, y: 0 }], solution: ['.'] }));
assert(chest.scene.texts.some((text) => text.value === 'C' && text.visible), 'Chest remains a temporary C marker in this stage.');
assert(chest.scene.images.some((image) => image.textureKey.startsWith('board-floor-')), 'Chest cell still uses the authored floor tile beneath its placeholder.');

console.info('[Dungeon Logic] Board visual sanity: authored floor/wall/mark assets + existing interaction feedback passed');
