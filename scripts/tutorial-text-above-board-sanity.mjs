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
  source.includes('const hasSideTutorialNote = (): boolean => this.scale.width >= 1100 && this.scale.height >= 600;')
    && source.includes('const panelX = sideNote')
    && source.includes(': boardLayout.originX + boardLayout.boardWidth / 2;'),
  'Tutorial text must sit beside the board on wide desktop and align above it on narrow screens.',
);
assert(
  source.includes('.setFontSize(sideNote ? 16 : narrowScreen ? 15 : 18)'),
  'Tutorial copy must remain readable at desktop and phone sizes.',
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
