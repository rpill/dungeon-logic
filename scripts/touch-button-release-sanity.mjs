import { readFileSync } from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const material = readFileSync(new URL('../src/runtime/MaterialActionButton.ts', import.meta.url), 'utf8');
const header = readFileSync(new URL('../src/runtime/HeaderActionButton.ts', import.meta.url), 'utf8');
const game = readFileSync(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');

assert(material.includes("isTouchLikePointer(pointer) ? 'normal' : 'hover'"), 'Material buttons must return to normal after touch release.');
assert(material.includes("surface.on('pointerupoutside'"), 'Material buttons must reset when release happens outside the surface.');
assert(header.includes("isTouchLikePointer(pointer) ? 'normal' : 'hover'"), 'Header buttons must return to normal after touch release.');
assert(header.includes("hit.on('pointerupoutside'"), 'Header buttons must reset when release happens outside the hit area.');
assert(game.includes("if (isTouchLikePointer(pointer)) visual.hovered = false;"), 'Gameplay toolbar must clear hover after touch release.');
assert(game.includes(".on('pointerupoutside', () =>"), 'Gameplay toolbar must clear pressed state after outside release.');
assert(game.includes('const backAction = createHeaderActionButton(this, {'), 'Game Back must delegate release/hover state to the shared header button.');
assert(game.includes('const menuAction = createHeaderActionButton(this, {'), 'Game Menu must delegate release/hover state to the shared header button.');
assert(!game.includes('backHovered') && !game.includes('menuHovered'), 'Game top actions must not keep duplicate local hover state.');

console.info('[Dungeon Logic] Touch button release sanity: PASS');
