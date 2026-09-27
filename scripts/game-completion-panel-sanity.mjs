import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const game = readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const boot = readFileSync(new URL('../src/scenes/BootScene.ts', import.meta.url), 'utf8');
const surface = readFileSync(new URL('../src/runtime/CompletionPanel.ts', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../src/runtime/CompletionPanelLayout.ts', import.meta.url), 'utf8');

assert(surface.includes("from './SlateSurface'") && surface.includes('createSlateSurface(scene, x, y, width, height)'),
  'Completion uses the reusable matte slate 9-slice.');
assert(!surface.includes('victory_plaque_') && !boot.includes('preloadCompletionPanelAssets'),
  'Old monolithic victory plaques have no runtime preload or rendering reference.');
assert(layout.includes('boardCenterX') && layout.includes('infoCount') && layout.includes('showMascots'),
  'Completion layout accounts for the board and varying runtime content.');
assert(game.includes('renderCompletionInfoPills(layout);') && game.includes('setCompletionInfoPills(['),
  'Actual mode data remains runtime text and icons.');
assert(game.includes('createPrimaryActionButton(this, {') && game.includes('createCenteredTextMenuButton(this, {'),
  'Primary and secondary actions remain independent shared button components.');
assert(game.includes('showTutorialCompletionState({') && game.includes('catalogComplete'),
  'Review fixtures cover tutorial and final catalog states.');
assert(!game.includes('drawCompletionCrown('), 'Completion does not add an unrelated crown overlay.');

console.info('[Dungeon Logic] Game completion panel sanity: shared slate + runtime content passed');
