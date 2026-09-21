import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const renderStart = source.indexOf('const renderCompletionButtons =');
const renderEnd = source.indexOf('const launchUnlockedDaily =', renderStart);
if (renderStart < 0 || renderEnd < 0) throw new Error('Could not locate completion button renderer.');
const render = source.slice(renderStart, renderEnd);
if (!render.includes('calculateCompletionPanelLayout(')) {
  throw new Error('Completion UI must use the responsive completion-panel layout.');
}
if (!render.includes('layout.boardBottomReserve')) {
  throw new Error('Completion UI must reserve bottom clearance before relaying out the solved board.');
}
if (!render.includes('board?.relayout(boardLayout.originX, boardLayout.originY, boardLayout.cellSize);')) {
  throw new Error('Solved board must be relaid out only to keep the compact victory panel from covering it.');
}
if (render.includes('puzzle.reset(') || render.includes('new PuzzleState(')) {
  throw new Error('Completion relayout must never reset or recreate solved puzzle state.');
}
console.info('[Dungeon Logic] Completion board clearance sanity: PASS');
