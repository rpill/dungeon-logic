import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const game = readFileSync(resolve('src/scenes/GameScene.ts'), 'utf8');
const material = readFileSync(resolve('src/runtime/MaterialActionButton.ts'), 'utf8');
const homeMenu = readFileSync(resolve('src/runtime/HomeMenuButton.ts'), 'utf8');
const header = readFileSync(resolve('src/runtime/HeaderActionButton.ts'), 'utf8');
const toolbar = readFileSync(resolve('src/runtime/PuzzleUiState.ts'), 'utf8');

assert(material.includes('label.setStroke('), 'Shared material buttons must add a subtle text outline for white labels.');
assert(homeMenu.includes("variant === 'primary'"), 'Centered text buttons must support the yellow primary button family.');
assert(game.includes("variant: 'primary'"), 'Gameplay hint confirmation must use a yellow primary confirm button.');
assert(!game.includes('labelColor: uiColorHex(UI_THEME.colors.semantic.danger)'), 'Exit to Home in the game menu must not stay red.');
assert(header.includes('iconButtonSize: 50') || header.includes('iconButtonSize: 56'), 'Header square buttons must use the larger unified square sizing.');
assert(toolbar.includes('const buttonHeight = 56') || toolbar.includes('const actionButtonHeight = 56'), 'Gameplay toolbar must use the taller unified button height.');

console.log('[Dungeon Logic] High button unification sanity: PASS');
