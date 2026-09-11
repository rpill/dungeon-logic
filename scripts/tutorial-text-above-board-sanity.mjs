import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const source = readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');

assert(
  source.includes('const tutorialClueTopY = boardLayout.originY'),
  'Tutorial text must anchor to the board/clue geometry.',
);
assert(
  source.includes('const panelX = boardLayout.originX + boardLayout.boardWidth / 2'),
  'Tutorial text must be centered on the gameplay board.',
);
assert(
  source.includes('.setFontSize(narrowScreen ? 15 : 18)'),
  'Tutorial copy should be more prominent above the board.',
);
assert(
  source.includes('applyTutorialBoardTopClearance'),
  'Tutorial board layout must reserve enough top clearance for the relocated message.',
);
assert(
  !source.slice(source.indexOf('const relayoutOnboarding'), source.indexOf('const controlsLocked')).includes('toolbarTop'),
  'Tutorial message layout must no longer be anchored to the bottom toolbar.',
);

console.info('Tutorial text above board sanity: PASS');
