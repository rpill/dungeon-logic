import { calculatePuzzleToolbarLayout, createPuzzleToolbarState } from '../runtime/PuzzleUiState.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const phoneState = createPuzzleToolbarState('wall', false, true, 1, true, 'en', undefined, true);
assert(phoneState.buttons.at(-1)?.id === 'skip', 'Endless toolbar appends Skip after the normal actions.');

const phone = calculatePuzzleToolbarLayout(390, 844, 0, true, 568, false, true);
assert(phone.buttons.map((button) => button.id).join(',') === 'wall,floor,undo,reset,hint,skip', 'Phone Endless toolbar includes Skip without removing Hint.');
assert(phone.buttons.every((button) => button.x - button.width / 2 >= 12 && button.x + button.width / 2 <= 378), 'Phone Endless actions stay inside safe horizontal margins.');

const desktop = calculatePuzzleToolbarLayout(1280, 720, 0, false, undefined, false, true);
assert(desktop.buttons.map((button) => button.id).join(',') === 'undo,reset,hint,skip', 'Desktop Endless toolbar includes Skip.');
assert(desktop.buttons.every((button) => button.x - button.width / 2 >= 16 && button.x + button.width / 2 <= 1264), 'Desktop Endless actions stay inside safe horizontal margins.');

for (const [width, height] of [[844, 390], [740, 360], [667, 375], [640, 360]] as const) {
  const landscape = calculatePuzzleToolbarLayout(width, height, 0, true, height * 0.62, false, true);
  assert(landscape.buttons.some((button) => button.id === 'skip'), `Landscape ${width}x${height} Endless toolbar must include Skip.`);
  assert(landscape.buttons.every((button) => button.x - button.width / 2 >= 8 && button.x + button.width / 2 <= width - 8), `Landscape ${width}x${height} Endless toolbar must stay on-screen.`);
}

const normal = createPuzzleToolbarState('wall', false, true, 1, true, 'en');
assert(!normal.buttons.some((button) => button.id === 'skip'), 'Skip remains absent outside Endless.');

console.info('[Dungeon Logic] Endless Skip UI sanity: toolbar state + phone/desktop geometry passed');
