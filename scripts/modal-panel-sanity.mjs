import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path) => readFileSync(resolve(path), 'utf8');
const boot = read('src/scenes/BootScene.ts');
const game = read('src/scenes/GameScene.ts');
const rankup = read('src/runtime/MasteryRankUpOverlay.ts');

if (boot.includes('preloadModalPanelAssets(this)')) {
  throw new Error('BootScene still preloads the obsolete modal skins.');
}
if (!game.includes('createSlateSurface(this, centerX, centerY, panelWidth, panelHeight)')) {
  throw new Error('Gameplay confirmation dialog must use the shared slate surface.');
}
if (!rankup.includes('createSlateSurface(scene, centerX, centerY, panelWidth, panelHeight)')) {
  throw new Error('Rank-up overlay must use the shared slate surface.');
}
if (!rankup.includes('createPrimaryActionButton(scene, {')) {
  throw new Error('Rank-up CTA must be a separate shared button.');
}

console.info('[Dungeon Logic] modal panel sanity: PASS');
