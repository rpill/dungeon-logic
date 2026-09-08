import { PuzzleInteractionSession } from '../gameplay/PuzzleInteractionSession';
import { PuzzleState } from '../puzzle/PuzzleState';
import { CellState, type LevelDefinition } from '../puzzle/types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const level: LevelDefinition = {
  id: 'puzzle-interaction-sanity',
  width: 4,
  height: 3,
  rowClues: [2, 1, 1],
  columnClues: [1, 1, 1, 1],
  monsters: [{ x: 3, y: 0 }],
  chests: [{ x: 3, y: 1 }],
  blockers: [{ x: 3, y: 2 }],
  doors: [{ position: { x: 2, y: 2 }, orientation: 'horizontal' }],
  solution: [
    '##..',
    '#...',
    '.#..',
  ],
};

const puzzle = new PuzzleState(level);
const session = new PuzzleInteractionSession(puzzle);

assert(session.getActiveTool() === 'wall', 'Wall must be the default active tool.');
assert(!session.canUndo(), 'Fresh session must not have Undo history.');
assert(session.getEditCount() === 0, 'Fresh session must have zero editable changes.');

session.setActiveTool('wall');
session.beginGesture(0, 0);
assert(session.visitGestureCell(0, 0), 'First wall cell must change.');
assert(session.visitGestureCell(1, 0), 'Drag must paint another wall cell.');
assert(!session.visitGestureCell(1, 0), 'Duplicate visits inside one gesture must do nothing.');
assert(session.endGesture(), 'Changed gesture must commit one history entry.');
assert(puzzle.getCellState(0, 0) === CellState.Wall, 'Wall tool must paint a wall.');
assert(puzzle.getCellState(1, 0) === CellState.Wall, 'Drag must paint the whole visited path.');
assert(session.getEditCount() === 2, 'Two editable cells must be counted.');
assert(session.canUndo(), 'Committed gesture must make Undo available.');
assert(session.undo(), 'Gesture Undo must succeed.');
assert(puzzle.getCellState(0, 0) === CellState.Unknown, 'Undo must restore the first drag cell.');
assert(puzzle.getCellState(1, 0) === CellState.Unknown, 'Undo must restore the whole drag as one action.');
assert(session.getEditCount() === 0, 'Undo must restore edit count.');

session.beginGesture(0, 0);
session.visitGestureCell(0, 0);
session.endGesture();
assert(puzzle.getCellState(0, 0) === CellState.Wall, 'Wall gesture must paint Unknown as Wall.');
session.beginGesture(0, 0);
session.visitGestureCell(0, 0);
session.endGesture();
assert(puzzle.getCellState(0, 0) === CellState.Unknown, 'Starting on the active state must erase it.');

session.setActiveTool('floor');
assert(session.getActiveTool() === 'floor', 'Active tool must be switchable.');
session.beginGesture(1, 1);
session.visitGestureCell(1, 1);
session.endGesture();
assert(puzzle.getCellState(1, 1) === CellState.Floor, 'Floor tool must paint a floor mark.');
session.setActiveTool('wall');
session.beginGesture(1, 1);
session.visitGestureCell(1, 1);
session.endGesture();
assert(puzzle.getCellState(1, 1) === CellState.Wall, 'Opposite active state must replace the current state.');

session.beginGesture(0, 1, 'floor');
session.visitGestureCell(0, 1);
session.endGesture();
assert(puzzle.getCellState(0, 1) === CellState.Floor, 'Tool override must apply only to that gesture.');
assert(session.getActiveTool() === 'wall', 'Tool override must not change the selected tool.');

const fixedBefore = [
  puzzle.getCellState(3, 0),
  puzzle.getCellState(3, 1),
  puzzle.getCellState(3, 2),
  puzzle.getCellState(2, 2),
];
session.beginGesture(3, 0);
assert(!session.visitGestureCell(3, 0), 'Monster cell must not be editable.');
assert(!session.visitGestureCell(3, 1), 'Chest cell must not be editable.');
assert(!session.visitGestureCell(3, 2), 'Blocker cell must not be editable.');
assert(!session.visitGestureCell(2, 2), 'Door cell must not be editable.');
assert(!session.endGesture(), 'Gesture touching only fixed cells must not create history.');
assert(
  fixedBefore.every((state, index) => state === [
    puzzle.getCellState(3, 0),
    puzzle.getCellState(3, 1),
    puzzle.getCellState(3, 2),
    puzzle.getCellState(2, 2),
  ][index]),
  'Fixed cell states must remain unchanged.',
);

const beforeResetCount = session.getEditCount();
assert(beforeResetCount > 0, 'Sanity setup must contain editable changes before Reset.');
assert(session.reset(), 'Reset with edits must create one undoable action.');
assert(session.getEditCount() === 0, 'Reset must clear editable changes.');
assert(session.undo(), 'Reset must be undoable as one action.');
assert(session.getEditCount() === beforeResetCount, 'Undo after Reset must restore every edit.');
assert(!session.reset() || session.getEditCount() === 0, 'Reset must clear edits when invoked again.');
assert(!session.reset(), 'Reset on an already clean puzzle must be a no-op.');

console.info('[Dungeon Logic] Puzzle interaction sanity: tools + drag transaction + Undo + Reset passed');
