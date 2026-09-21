import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
function assert(condition, message) { if (!condition) throw new Error(message); }
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const game = readFileSync(resolve(root, 'src/scenes/GameScene.ts'), 'utf8');
const modal = readFileSync(resolve(root, 'src/runtime/ModalPanel.ts'), 'utf8');
assert(game.includes('const height = 248;'), 'Reset modal must use the taller 248px layout.');
assert(game.includes('const titleY = -height / 2 + 66;'), 'Reset title must sit safely inside the plaque.');
assert(game.includes('const verticalPadding = narrowScreen ? 18 : 20;'), 'Tutorial plaque must have larger vertical padding.');
assert(game.includes('narrowScreen ? 82 : 96,'), 'Tutorial plaque must enforce a taller minimum height.');
assert(modal.includes('const MODAL_SLICE_Y'), 'ModalPanel must define vertical slice caps.');
assert(modal.includes('sliceY,\n    sliceY,'), 'ModalPanel NineSlice must preserve top and bottom caps.');
console.info('[Dungeon Logic] modal layout spacing sanity: PASS');
