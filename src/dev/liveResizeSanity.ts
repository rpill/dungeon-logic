import { readFileSync } from 'node:fs';

import type Phaser from 'phaser';

import { BoardView } from '../board/BoardView';
import { PuzzleInteractionSession } from '../gameplay/PuzzleInteractionSession';
import { PuzzleState } from '../puzzle/PuzzleState';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

type EventHandler = (...args: any[]) => void;

class FakeRectangle {
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  fillColor: number;
  visible = true;
  interactive = false;
  readonly handlers = new Map<string, EventHandler>();

  constructor(x: number, y: number, width: number, height: number, fillColor = 0) {
    this.x = x;
    this.y = y;
    this.displayWidth = width;
    this.displayHeight = height;
    this.fillColor = fillColor;
  }

  setInteractive(): this { this.interactive = true; return this; }
  setVisible(value: boolean): this { this.visible = value; return this; }
  setFillStyle(color: number): this { this.fillColor = color; return this; }
  setPosition(x: number, y: number): this { this.x = x; this.y = y; return this; }
  setDisplaySize(width: number, height: number): this {
    this.displayWidth = width;
    this.displayHeight = height;
    return this;
  }
  on(event: string, callback: EventHandler): this { this.handlers.set(event, callback); return this; }
}

class FakeText {
  x: number;
  y: number;
  value: string;
  fontSize = 0;
  visible = true;

  constructor(x: number, y: number, value: string) {
    this.x = x;
    this.y = y;
    this.value = value;
  }

  setOrigin(): this { return this; }
  setVisible(value: boolean): this { this.visible = value; return this; }
  setColor(): this { return this; }
  setText(value: string): this { this.value = value; return this; }
  setPosition(x: number, y: number): this { this.x = x; this.y = y; return this; }
  setFontSize(value: number): this { this.fontSize = value; return this; }
}

class FakeScene {
  readonly rectangles: FakeRectangle[] = [];
  readonly texts: FakeText[] = [];
  readonly add = {
    rectangle: (x: number, y: number, width: number, height: number, fillColor?: number) => {
      const item = new FakeRectangle(x, y, width, height, fillColor);
      this.rectangles.push(item);
      return item;
    },
    text: (x: number, y: number, value: string) => {
      const item = new FakeText(x, y, value);
      this.texts.push(item);
      return item;
    },
  };
  readonly input = { on: () => undefined };
}

const level = {
  id: 'live-resize-sanity',
  width: 2,
  height: 2,
  rowClues: [1, 1],
  columnClues: [1, 1],
  monsters: [],
  chests: [],
  blockers: [],
  doors: [],
  solution: ['#.', '.#'],
} as any;

const puzzle = new PuzzleState(level);
const interaction = new PuzzleInteractionSession(puzzle);
const scene = new FakeScene();
const board = new BoardView(
  scene as unknown as Phaser.Scene,
  puzzle,
  interaction,
  100,
  100,
  48,
  () => undefined,
);

const editable = scene.rectangles.find((rectangle) => rectangle.interactive);
assert(editable !== undefined, 'Sanity board exposes an editable cell.');
const beforeX = editable.x;
const beforeWidth = editable.displayWidth;

board.relayout(180, 160, 64);

assert(editable.x !== beforeX, 'Board relayout moves existing cell objects.');
assert(editable.displayWidth > beforeWidth, 'Board relayout resizes existing cell objects.');
assert(puzzle.getCellState(0, 0) === 'unknown', 'Relayout preserves puzzle state.');

const gameSceneSource = readFileSync(new URL('../scenes/GameScene.ts', import.meta.url), 'utf8');
assert(
  gameSceneSource.includes('Phaser.Scale.Events.RESIZE'),
  'GameScene listens for live Phaser resize events.',
);
assert(
  gameSceneSource.includes('board?.relayout('),
  'GameScene relayouts the existing board instead of restarting the scene.',
);
console.info('[Dungeon Logic] Live resize sanity: scene resize listener + state-preserving board relayout passed');
