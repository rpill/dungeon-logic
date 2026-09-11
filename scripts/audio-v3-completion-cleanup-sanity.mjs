import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const game = readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const board = readFileSync(new URL('../src/board/BoardView.ts', import.meta.url), 'utf8');
const cell = readFileSync(new URL('../src/board/CellView.ts', import.meta.url), 'utf8');
const audio = readFileSync(new URL('../src/audio/AudioFeedbackService.ts', import.meta.url), 'utf8');
const assets = readFileSync(new URL('../src/audio/AudioAssets.ts', import.meta.url), 'utf8');

assert(audio.includes("| 'marker-toggle'"), 'Audio events must include marker-toggle.');
assert(audio.includes("| 'wall-remove'"), 'Audio events must include wall-remove.');
assert(!audio.includes("| 'monster'"), 'Monster click audio event must be removed.');
assert(!audio.includes("| 'chest'"), 'Chest click audio event must be removed.');
assert(!assets.includes('monster1') && !assets.includes('chestCoins'), 'Monster/chest audio assets must no longer be loaded.');

assert(board.includes('previousState: CellStateValue') && board.includes('nextState: CellStateValue'), 'Board edit callback must expose state transition.');
assert(game.includes("previousState === CellState.Floor && state === CellState.Unknown"), 'Removing a floor marker must be recognized as a marker toggle.');
assert(game.includes("previousState === CellState.Wall && state === CellState.Unknown"), 'Removing a wall must have its own transition.');
assert(game.includes("feedback.play('marker-toggle')"), 'Marker add/remove must share marker-toggle audio.');
assert(game.includes("feedback.play('wall-remove')"), 'Wall removal must use wall-remove audio.');
assert(game.includes('if (validatePuzzle(puzzle).isSolved) return;'), 'Final edit sound must be suppressed so completion audio does not overlap it.');
assert(!game.includes("kind === 'monster' ? 'monster' : 'chest'"), 'Fixed objects must not trigger special audio.');

assert(cell.includes('this.floorMark.setVisible(!this.solvedVisualState);'), 'Solved board must hide floor markers while keeping state intact.');
assert(cell.includes('if (this.fixedVisual === null)') && cell.includes('this.render();'), 'Solved visual state must rerender editable cells.');

console.info('Audio v3 + solved cleanup sanity: PASS');
