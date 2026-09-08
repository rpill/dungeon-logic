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

assert(classifyViewport(1280) === 'wide', '1280px viewport is wide.');
assert(classifyViewport(1100) === 'wide', '1100px is the inclusive wide threshold.');
assert(classifyViewport(1099) === 'compact', '1099px viewport is compact.');
assert(classifyViewport(900) === 'compact', '900px viewport is compact.');
assert(classifyViewport(700) === 'compact', '700px is the inclusive compact threshold.');
assert(classifyViewport(699) === 'narrow', '699px viewport is narrow.');
assert(classifyViewport(390) === 'narrow', '390px viewport is narrow.');

const phoneSeven = calculateGameBoardLayout(390, 844, 7, 7);
const phoneSevenLeft = phoneSeven.originX - phoneSeven.cellSize;
const phoneSevenRight = phoneSeven.originX + phoneSeven.boardWidth;
assert(phoneSeven.cellSize >= 45, '390x844 uses almost the full width for a 7x7 puzzle.');
assert(phoneSevenLeft >= 12, 'Phone clue gutter stays inside the 12px narrow margin.');
assert(phoneSevenRight <= 390 - 12, 'Phone puzzle stays inside the right 12px narrow margin.');
assert(
  approxEqual((phoneSevenLeft + phoneSevenRight) / 2, 390 / 2),
  'The complete clue+board puzzle block is horizontally centered on phone.',
);
assert(phoneSeven.originY - phoneSeven.cellSize >= 72, 'Phone column clues stay below the narrow header reserve.');
assert(phoneSeven.originY + phoneSeven.boardHeight <= 844 - 132, 'Phone board stays above the narrow toolbar reserve.');

const phoneSix = calculateGameBoardLayout(390, 844, 6, 6);
const phoneSixLeft = phoneSix.originX - phoneSix.cellSize;
const phoneSixRight = phoneSix.originX + phoneSix.boardWidth;
assert(phoneSix.cellSize >= 52, '390x844 makes a 6x6 puzzle substantially larger than the previous centered-board geometry.');
assert(
  approxEqual((phoneSixLeft + phoneSixRight) / 2, 390 / 2),
  'The complete 6x6 clue+board block is centered on phone.',
);

const widerPhone = calculateGameBoardLayout(430, 844, 7, 7);
assert(widerPhone.cellSize >= 50, 'A 430px-wide phone can provide at least 50px 7x7 cells.');

const desktop = calculateGameBoardLayout(1280, 720, 6, 6);
assert(desktop.cellSize <= 72, 'Desktop cell size is capped instead of expanding with the viewport.');
assert(desktop.cellSize >= 64, '6x6 desktop board remains comfortably readable.');
assert(
  approxEqual(desktop.originX + desktop.boardWidth / 2, 1280 / 2),
  'Desktop gameplay board stays horizontally centered.',
);
assert(desktop.originY - desktop.cellSize >= 92, 'Desktop clues stay below the wide header reserve.');
assert(desktop.originY + desktop.boardHeight <= 720 - 96, 'Desktop board stays above the toolbar/status reserve.');

const desktopSeven = calculateGameBoardLayout(1280, 720, 7, 7);
assert(desktopSeven.cellSize < desktop.cellSize, '7x7 scales down when vertical safe space requires it.');
assert(desktopSeven.cellSize >= 60, '7x7 desktop cells stay comfortably playable.');

console.info('[Dungeon Logic] Game board layout sanity: viewport classes + full-width centered mobile puzzle passed');
