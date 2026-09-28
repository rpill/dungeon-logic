import {
  calculatePuzzleToolbarLayout,
  createPuzzleToolbarState,
  formatCompactHintLabel,
  getPuzzleToolbarIconSize,
  shouldConfirmReset,
  shouldShowTouchToolButtons,
  shouldUseCompactHintLabel,
} from '../runtime/PuzzleUiState.ts';
import { calculateGameBoardLayout } from '../scenes/GameBoardLayout';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const initial = createPuzzleToolbarState('wall', false, true, 3);
assert(initial.activeTool === 'wall', 'Wall is the default active tool state.');
assert(initial.buttons.find((button) => button.id === 'wall')?.active === true, 'Wall button is active.');
assert(initial.buttons.find((button) => button.id === 'floor')?.active === false, 'Floor button is inactive.');
assert(initial.buttons.find((button) => button.id === 'undo')?.disabled === true, 'Undo is disabled without history.');

const floorSelected = createPuzzleToolbarState('floor', true, true, 2);
assert(floorSelected.buttons.find((button) => button.id === 'floor')?.active === true, 'Floor selection updates active state.');
assert(floorSelected.buttons.find((button) => button.id === 'undo')?.disabled === false, 'Undo enables with history.');
assert(floorSelected.buttons.find((button) => button.id === 'hint')?.label === 'HINT ×2', 'Hint button shows remaining free hints.');
assert(formatCompactHintLabel(2) === '×2', 'Compact phone hint label keeps only the remaining count.');
assert(formatCompactHintLabel(0) === '×0', 'Compact phone hint label shows zero when only rewarded hints remain.');
assert(shouldUseCompactHintLabel(390, 844, true), 'Portrait touch phone uses compact Hint content.');
assert(shouldUseCompactHintLabel(844, 390, true), 'Landscape touch phone uses compact Hint content.');
assert(!shouldUseCompactHintLabel(1024, 768, true), 'Large touch viewport keeps the full Hint label.');
assert(!shouldUseCompactHintLabel(844, 390, false), 'Mouse-only viewport keeps the full Hint label.');

const narrow = calculatePuzzleToolbarLayout(390, 844, 0, true);
assert(narrow.mode === 'stacked', 'Phone toolbar uses two stacked rows.');
assert(narrow.buttonHeight >= 48, 'Phone toolbar buttons meet the 48px touch target.');
assert(narrow.buttons.every((button) => button.x - button.width / 2 >= 12), 'Phone toolbar stays inside left margin.');
assert(narrow.buttons.every((button) => button.x + button.width / 2 <= 378), 'Phone toolbar stays inside right margin.');

const safe = calculatePuzzleToolbarLayout(390, 844, 24, true);
assert(safe.bottomY < narrow.bottomY, 'Bottom safe area moves toolbar upward.');

const shortBrowserBoard = calculateGameBoardLayout(390, 612, 6, 6, true, false, false);
const shortBrowserBoardBottom = shortBrowserBoard.originY
  + shortBrowserBoard.boardHeight
  + shortBrowserBoard.cellSize * 0.5;
const shortBrowserToolbar = calculatePuzzleToolbarLayout(390, 612, 0, true, shortBrowserBoardBottom);
const shortBrowserWall = shortBrowserToolbar.buttons.find((button) => button.id === 'wall')!;
const shortBrowserFloor = shortBrowserToolbar.buttons.find((button) => button.id === 'floor')!;
assert(shortBrowserBoard.cellSize >= 44, 'Short browser viewport keeps the puzzle field readable instead of over-reserving toolbar space.');
assert(shortBrowserWall.width <= 150 && shortBrowserFloor.width <= 150, 'Short browser Wall/Floor controls do not span half the phone width.');
assert(shortBrowserWall.height <= 54 && shortBrowserFloor.height <= 54, 'Short browser Wall/Floor controls use compact height.');
assert(getPuzzleToolbarIconSize('floor', true, shortBrowserBoard.cellSize, 2) >= 34, 'Phone Floor mark icon remains visually prominent inside the compact button.');

const boardAnchored = calculatePuzzleToolbarLayout(390, 844, 0, true, 568);
const boardAnchoredWall = boardAnchored.buttons.find((button) => button.id === 'wall')!;
assert(boardAnchoredWall.y - boardAnchoredWall.height / 2 === 580, 'Phone Wall/Floor row starts 12px below the supplied board bottom.');
const pendingHintLayout = calculatePuzzleToolbarLayout(390, 844, 0, true, 568, true);
assert(pendingHintLayout.buttons.map((button) => button.id).join(',') === 'wall,floor,undo,reset', 'Pending touch hint removes Hint from the phone action-row layout.');
const pendingUndo = pendingHintLayout.buttons.find((button) => button.id === 'undo')!;
const pendingReset = pendingHintLayout.buttons.find((button) => button.id === 'reset')!;
assert(pendingUndo.width === pendingReset.width && pendingUndo.width > 150, 'Undo and Reset expand into the freed Hint-button space.');

assert(!shouldConfirmReset(2), 'One or two edits reset immediately.');
assert(shouldConfirmReset(3), 'Three or more edits require reset confirmation.');

const compactTouch = calculatePuzzleToolbarLayout(844, 390, 0, true, 250, true);
assert(compactTouch.mode === 'inline', 'Short landscape touch phone uses the dedicated inline toolbar mode.');
assert(compactTouch.buttons.map((button) => button.id).join(',') === 'wall,floor,undo,reset', 'Landscape touch phone also removes Hint from layout while a hint is pending.');

const wide = calculatePuzzleToolbarLayout(1280, 720, 0, false);
assert(wide.mode === 'inline', 'Desktop toolbar uses one inline row.');
assert(wide.buttons.map((button) => button.id).join(',') === 'undo,reset,hint', 'Desktop toolbar hides Wall/Floor selectors but keeps Hint.');

const desktopState = createPuzzleToolbarState('floor', true, false, 1);
assert(desktopState.buttons.map((button) => button.id).join(',') === 'undo,reset,hint', 'Desktop state exposes Undo/Reset/Hint controls.');
assert(createPuzzleToolbarState('wall', false, false, 0).buttons.find((button) => button.id === 'hint')?.disabled === true, 'Hint disables when the free pool is empty until rewarded ads are wired.');
assert(shouldShowTouchToolButtons(true, 0), 'Coarse pointer keeps Wall/Floor tool buttons.');
assert(shouldShowTouchToolButtons(false, 1), 'Touch-capable device keeps Wall/Floor tool buttons.');
assert(!shouldShowTouchToolButtons(false, 0), 'Mouse-only desktop hides Wall/Floor tool buttons.');

console.info('[Dungeon Logic] Wireframe UI sanity: toolbar state + touch geometry passed');
