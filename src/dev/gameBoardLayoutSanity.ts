import { GameBoardViewportTooSmallError, tryGameBoardLayoutForResize } from '../scenes/GameBoardLayout';
import * as layoutModule from '../scenes/GameBoardLayout';

interface GameBoardLayout {
  cellSize: number;
  boardWidth: number;
  boardHeight: number;
  originX: number;
  originY: number;
}

type ViewportClass = 'wide' | 'compact' | 'narrow';

type ClassifyViewport = (width: number) => ViewportClass;
type LayoutCalculator = (
  viewportWidth: number,
  viewportHeight: number,
  boardColumns: number,
  boardRows: number,
  touchControls?: boolean,
  inlineTouchControls?: boolean,
) => GameBoardLayout;

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function approxEqual(actual: number, expected: number, epsilon = 0.001): boolean {
  return Math.abs(actual - expected) <= epsilon;
}

const classifyViewport = (layoutModule as unknown as {
  classifyViewport?: ClassifyViewport;
}).classifyViewport;
const calculateGameBoardLayout = (layoutModule as unknown as {
  calculateGameBoardLayout?: LayoutCalculator;
}).calculateGameBoardLayout;

assert(typeof classifyViewport === 'function', 'classifyViewport() must exist.');
assert(typeof calculateGameBoardLayout === 'function', 'calculateGameBoardLayout() must exist.');
assert(
  typeof GameBoardViewportTooSmallError === 'function',
  'GameBoardViewportTooSmallError must identify transient resize failures.',
);

let tinyViewportError: unknown = null;
try {
  calculateGameBoardLayout(800, 180, 7, 7, true);
} catch (error) {
  tinyViewportError = error;
}
assert(
  tinyViewportError instanceof GameBoardViewportTooSmallError,
  'A viewport temporarily smaller than header + toolbar reserves uses the dedicated transient error.',
);

let invalidBoardError: unknown = null;
try {
  calculateGameBoardLayout(800, 600, 0, 7);
} catch (error) {
  invalidBoardError = error;
}
assert(invalidBoardError instanceof RangeError, 'Invalid board dimensions still fail loudly.');
assert(
  !(invalidBoardError instanceof GameBoardViewportTooSmallError),
  'Invalid board dimensions must not be mistaken for a transient resize failure.',
);

const retainedDuringTinyResize = tryGameBoardLayoutForResize(() => {
  throw new GameBoardViewportTooSmallError('transient');
});
assert(retainedDuringTinyResize === null, 'Transient resize failure skips the relayout.');

let programmingErrorRethrown = false;
try {
  tryGameBoardLayoutForResize(() => {
    throw new Error('programming error');
  });
} catch (error) {
  programmingErrorRethrown = error instanceof Error && error.message === 'programming error';
}
assert(programmingErrorRethrown, 'Non-viewport layout errors are rethrown instead of being hidden.');

assert(classifyViewport(1280) === 'wide', '1280px viewport is wide.');
assert(classifyViewport(1100) === 'wide', '1100px is the inclusive wide threshold.');
assert(classifyViewport(1099) === 'compact', '1099px viewport is compact.');
assert(classifyViewport(900) === 'compact', '900px viewport is compact.');
assert(classifyViewport(700) === 'compact', '700px is the inclusive compact threshold.');
assert(classifyViewport(699) === 'narrow', '699px viewport is narrow.');
assert(classifyViewport(390) === 'narrow', '390px viewport is narrow.');

const phoneSeven = calculateGameBoardLayout(390, 844, 7, 7);
const phoneSevenLeft = phoneSeven.originX - phoneSeven.cellSize * 0.9;
const phoneSevenRight = phoneSeven.originX + phoneSeven.boardWidth + phoneSeven.cellSize * 0.5;
const phoneSevenClueLeft = phoneSeven.originX - phoneSeven.cellSize * 0.55;
assert(phoneSeven.cellSize >= 43, '390x844 keeps readable 7x7 cells with a complete frame.');
assert(phoneSevenClueLeft >= 12, 'Phone clue text stays inside the 12px narrow margin.');
assert(phoneSevenRight <= 390 - 12, 'Phone board stays inside the right 12px narrow margin.');
assert(
  approxEqual((phoneSevenLeft + phoneSevenRight) / 2, 390 / 2),
  'The framed puzzle is horizontally centered on phone.',
);
assert(phoneSeven.originY - phoneSeven.cellSize >= 72, 'Phone column clues stay below the narrow header reserve.');
assert(phoneSeven.originY + phoneSeven.boardHeight <= 844 - 132, 'Phone board stays above the narrow toolbar reserve.');

const phoneSix = calculateGameBoardLayout(390, 844, 6, 6);
const phoneSixLeft = phoneSix.originX - phoneSix.cellSize * 0.9;
const phoneSixRight = phoneSix.originX + phoneSix.boardWidth + phoneSix.cellSize * 0.5;
assert(phoneSix.cellSize >= 49, '390x844 keeps a large readable framed 6x6 puzzle.');
assert(
  approxEqual((phoneSixLeft + phoneSixRight) / 2, 390 / 2),
  'The framed 6x6 puzzle is centered on phone.',
);

const widerPhone = calculateGameBoardLayout(430, 844, 7, 7);
assert(widerPhone.cellSize >= 48, 'A 430px-wide phone provides 48px 7x7 cells with a complete frame.');

const desktop = calculateGameBoardLayout(1280, 720, 6, 6);
assert(desktop.cellSize <= 72, 'Desktop cell size is capped instead of expanding with the viewport.');
assert(desktop.cellSize >= 64, '6x6 desktop board remains comfortably readable.');
assert(
  approxEqual(desktop.originX + desktop.boardWidth / 2 - desktop.cellSize * 0.2, 1280 / 2),
  'Desktop framed puzzle stays horizontally centered.',
);
assert(desktop.originY - desktop.cellSize * 0.9 >= 92, 'Desktop frame stays below the wide header reserve.');
assert(desktop.originY + desktop.boardHeight <= 720 - 96, 'Desktop board stays above the toolbar/status reserve.');

const desktopSeven = calculateGameBoardLayout(1280, 720, 7, 7);
assert(desktopSeven.cellSize < desktop.cellSize, '7x7 scales down when vertical safe space requires it.');
assert(desktopSeven.cellSize >= 60, '7x7 desktop cells stay comfortably playable.');

console.info('[Dungeon Logic] Game board layout sanity: viewport classes + board-centered mobile puzzle passed');
