import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const primary = readFileSync('src/runtime/PrimaryActionButton.ts', 'utf8');
const material = readFileSync('src/runtime/MaterialActionButton.ts', 'utf8');
const game = readFileSync('src/scenes/GameScene.ts', 'utf8');

assert(!primary.includes('surface.setAlpha(0.82)'), 'Primary disabled buttons must keep the textured asset fully opaque.');
assert(!material.includes('surface.setAlpha(0.82)'), 'Secondary/danger disabled buttons must keep the textured asset fully opaque.');
assert(!material.includes("label.setAlpha(activeState === 'disabled' ? 0.55 : 1)"), 'Disabled material-button labels must be darkened, not made translucent.');
assert(!material.includes("icon?.setAlpha(activeState === 'disabled' ? 0.55 : 1)"), 'Disabled material-button icons must be darkened, not made translucent.');
assert(game.includes('createHeaderActionButton(this, {'), 'Game Back/Menu must use the shared textured square header buttons.');
assert(game.includes('createMaterialButtonSurface(this, {'), 'Gameplay toolbar must use shared textured material button surfaces.');
assert(game.includes('createPrimaryButtonSurface(this, {'), 'Gameplay Hint must use the shared textured primary surface.');

console.info('[Dungeon Logic] disabled textured button opacity sanity: PASS');
