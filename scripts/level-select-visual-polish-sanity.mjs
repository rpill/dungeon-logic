import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scene = readFileSync('src/scenes/LevelSelectScene.ts', 'utf8');
const layout = readFileSync('src/runtime/ResponsiveLayout.ts', 'utf8');

assert(scene.includes('copy.home.continue'), 'Levels primary action must use the short localized Continue label.');
assert(!scene.includes('copy.levelSelect.continueLevel('), 'Levels primary action must not append the level number to Continue.');
assert(scene.includes('const hoverOverlay = this.add.rectangle('), 'Playable level cards must use an overlay for hover feedback.');
assert(scene.includes('0x40577f'), 'Level-card hover overlay must reuse the gameplay blue selector palette.');
assert(scene.includes('hoverOverlay.setAlpha(0.16).setVisible(true)'), 'Hover overlay must use the subtle resting-hover opacity.');
assert(scene.includes('hoverOverlay.setAlpha(0.28).setVisible(true)'), 'Pressed level-card overlay must strengthen without changing the border.');
assert(!scene.includes('hoverStrokeWidth'), 'Level hover must not change border thickness.');
assert(!scene.includes('pressedStrokeWidth'), 'Level press must not change border thickness.');
assert(layout.includes('continueWidth: Math.min(shortViewport ? 240 : 260'), 'Desktop Continue button must stay compact.');
assert(layout.includes('const continueY = metaHeader.headerHeight +'), 'Continue button must sit below the shared fixed Levels header.');

console.info('[Dungeon Logic] Level Select visual polish sanity: compact Continue + overlay hover passed');
