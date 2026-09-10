import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const boardLayout = readFileSync('src/scenes/GameBoardLayout.ts', 'utf8');
const toolbar = readFileSync('src/runtime/PuzzleUiState.ts', 'utf8');
const game = readFileSync('src/scenes/GameScene.ts', 'utf8');

assert(
  boardLayout.includes('const originX = (viewportWidth - boardWidth) / 2;'),
  'Narrow gameplay must center the board itself horizontally.',
);
assert(
  toolbar.includes('boardBottom?: number'),
  'Touch toolbar layout must accept the actual board bottom.',
);
assert(
  toolbar.includes('hideHintButton = false') && toolbar.includes("? ['undo', 'reset']"),
  'Pending touch hint must be removed from the touch action-row layout.',
);
assert(
  game.includes('boardLayout.originY + boardLayout.boardHeight'),
  'GameScene must position touch tools from the actual board bottom.',
);
assert(
  game.includes('showTouchToolButtons && currentHint !== null'),
  'GameScene must feed pending-hint state into toolbar layout.',
);

console.info('[Dungeon Logic] Mobile gameplay layout sanity: centered board + board-anchored tools + pending-hint visibility passed');
