import {
  calculatePuzzleToolbarLayout,
  createPuzzleToolbarState,
  shouldConfirmReset,
  shouldShowTouchToolButtons,
} from '../runtime/PuzzleUiState.ts';

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

const narrow = calculatePuzzleToolbarLayout(390, 844, 0, true);
assert(narrow.mode === 'stacked', 'Phone toolbar uses two stacked rows.');
assert(narrow.buttonHeight >= 48, 'Phone toolbar buttons meet the 48px touch target.');
assert(narrow.buttons.every((button) => button.x - button.width / 2 >= 12), 'Phone toolbar stays inside left margin.');
assert(narrow.buttons.every((button) => button.x + button.width / 2 <= 378), 'Phone toolbar stays inside right margin.');

const safe = calculatePuzzleToolbarLayout(390, 844, 24, true);
assert(safe.bottomY < narrow.bottomY, 'Bottom safe area moves toolbar upward.');

assert(!shouldConfirmReset(2), 'One or two edits reset immediately.');
assert(shouldConfirmReset(3), 'Three or more edits require reset confirmation.');

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
