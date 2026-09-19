import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const renderStart = source.indexOf('const renderCompletionButtons =');
const renderEnd = source.indexOf('const launchUnlockedDaily =', renderStart);
if (renderStart < 0 || renderEnd < 0) throw new Error('Could not locate completion button renderer.');
const render = source.slice(renderStart, renderEnd);
if (/calculateStableBoardLayout\(completionBoardReserve\)/.test(render) || /board\?\.relayout/.test(render)) {
  throw new Error('Completion buttons must not relayout or shrink the gameplay board.');
}
console.info('[Dungeon Logic] Completion board stability sanity: PASS');
