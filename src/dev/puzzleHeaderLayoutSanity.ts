import { calculatePuzzleHeaderLayout } from '../runtime/PuzzleHeaderLayout.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const laptop = calculatePuzzleHeaderLayout(1366, 768);
assert(laptop.titleY < laptop.statusY, 'Laptop header keeps title above status row.');
assert(laptop.bottom <= 96, 'Laptop header stays inside the existing desktop header reserve.');
assert(laptop.titleFontSize <= 34, 'Laptop title is compact enough for long mode names.');
assert(laptop.titlePanelHeight <= 48, 'Laptop title panel stays shallow.');

const compactLaptop = calculatePuzzleHeaderLayout(1280, 650);
assert(compactLaptop.bottom <= 88, 'Compact laptop header leaves extra clearance for the board.');
assert(compactLaptop.titleFontSize <= laptop.titleFontSize, 'Compact laptop never grows the title.');

const phoneLandscape = calculatePuzzleHeaderLayout(844, 390);
assert(phoneLandscape.bottom <= 76, 'Landscape phone header stays well above the board reserve.');
assert(phoneLandscape.titleFontSize <= 24, 'Landscape phone uses a compact title size.');
assert(phoneLandscape.statusFontSize <= 13, 'Landscape phone keeps status text compact.');

const phonePortrait = calculatePuzzleHeaderLayout(390, 844);
assert(phonePortrait.titleY >= 54, 'Portrait phone pushes the center header below edge actions.');
assert(phonePortrait.bottom <= 104, 'Portrait phone header still fits the narrow header reserve.');

console.info('[Dungeon Logic] Puzzle header layout sanity: desktop/laptop/mobile geometry passed');
